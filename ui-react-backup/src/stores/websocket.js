/**
 * SecuClaw WebSocket Store — Zustand
 *
 * Manages the WebSocket gateway connection.
 * Preserves the original message protocol (req/res/event/batch).
 * Default endpoint: ws://127.0.0.1:21981/ws (proxied via Vite dev server as /ws)
 */
import { create } from 'zustand';
export const useWebSocketStore = create((set, get) => {
    // Internal refs (not reactive — only status is reactive state)
    let ws = null;
    let seq = 0;
    const pendingRequests = new Map();
    const eventHandlers = new Map();
    const connectionHandlers = new Set();
    let authToken = null;
    let intentionalDisconnect = false;
    let reconnectTimer = null;
    let wsId = 0;
    const messageQueue = [];
    const MAX_RECONNECT_ATTEMPTS = 10;
    const RECONNECT_BASE_DELAY = 1000;
    const REQUEST_TIMEOUT = 30000;
    const WS_URL = '/ws'; // Vite proxies to ws://127.0.0.1:21981/ws
    function cleanupWebSocket() {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        if (ws) {
            ws.onopen = null;
            ws.onclose = null;
            ws.onerror = null;
            ws.onmessage = null;
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close(1000, 'Client cleanup');
            }
            ws = null;
        }
    }
    function getAuthenticatedUrl() {
        if (!authToken)
            return WS_URL;
        const sep = WS_URL.includes('?') ? '&' : '?';
        return `${WS_URL}${sep}token=${encodeURIComponent(authToken)}`;
    }
    function flushMessageQueue() {
        while (messageQueue.length > 0 && ws?.readyState === WebSocket.OPEN) {
            const msg = messageQueue.shift();
            ws.send(JSON.stringify(msg));
        }
    }
    function notifyConnectionHandlers(connected) {
        connectionHandlers.forEach((h) => h(connected));
    }
    function scheduleReconnect() {
        const state = get();
        if (intentionalDisconnect)
            return;
        if (state.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error('[Gateway] Max reconnection attempts reached');
            return;
        }
        if (reconnectTimer)
            clearTimeout(reconnectTimer);
        const attempts = state.reconnectAttempts + 1;
        set({ reconnectAttempts: attempts });
        const delay = RECONNECT_BASE_DELAY * Math.pow(2, attempts - 1);
        console.log(`[Gateway] Reconnecting in ${delay}ms (attempt ${attempts}/${MAX_RECONNECT_ATTEMPTS})`);
        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            get().connect().catch((err) => {
                console.warn('[Gateway] Reconnect failed:', err.message);
            });
        }, delay);
    }
    function handleMessage(data) {
        try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'batch' && Array.isArray(parsed.messages)) {
                parsed.messages.forEach(handleSingleMessage);
            }
            else {
                handleSingleMessage(parsed);
            }
        }
        catch (error) {
            console.error('[Gateway] Failed to parse message:', error);
        }
    }
    function handleSingleMessage(message) {
        if (message.type === 'res') {
            const pending = pendingRequests.get(message.seq);
            if (pending) {
                clearTimeout(pending.timeout);
                pendingRequests.delete(message.seq);
                if (message.error) {
                    pending.reject(new Error(message.error.message));
                }
                else {
                    pending.resolve(message.result);
                }
            }
        }
        else if (message.type === 'event') {
            const handlers = eventHandlers.get(message.event);
            if (handlers) {
                handlers.forEach((handler) => handler(message.data));
            }
        }
    }
    return {
        // State
        status: 'disconnected',
        reconnectAttempts: 0,
        lastConnectedAt: null,
        // Actions
        setAuthToken(token) {
            authToken = token;
        },
        async connect() {
            const state = get();
            if (state.status === 'connected' && ws?.readyState === WebSocket.OPEN)
                return;
            cleanupWebSocket();
            intentionalDisconnect = false;
            const currentWsId = ++wsId;
            return new Promise((resolve, reject) => {
                set({ status: 'connecting' });
                let settled = false;
                const url = getAuthenticatedUrl();
                console.log(`[Gateway] Connecting to ${url}...`);
                const socket = new WebSocket(url);
                ws = socket;
                const timeoutId = setTimeout(() => {
                    if (settled)
                        return;
                    settled = true;
                    cleanupWebSocket();
                    set({ status: 'disconnected' });
                    reject(new Error('Connection timeout'));
                }, 10000);
                socket.onopen = () => {
                    if (settled || wsId !== currentWsId)
                        return;
                    settled = true;
                    clearTimeout(timeoutId);
                    set({ status: 'connected', reconnectAttempts: 0, lastConnectedAt: new Date() });
                    console.log('[Gateway] Connected');
                    flushMessageQueue();
                    notifyConnectionHandlers(true);
                    resolve();
                };
                socket.onclose = (event) => {
                    clearTimeout(timeoutId);
                    if (wsId !== currentWsId)
                        return;
                    if (event.code === 4001) {
                        console.warn('[Gateway] Auth token rejected');
                        authToken = null;
                        try {
                            localStorage.removeItem('secuclaw_auth_token');
                        }
                        catch { }
                    }
                    if (!settled) {
                        settled = true;
                        reject(new Error(`Connection closed: ${event.code}`));
                    }
                    set({ status: 'disconnected' });
                    notifyConnectionHandlers(false);
                    if (!intentionalDisconnect)
                        scheduleReconnect();
                };
                socket.onerror = () => {
                    clearTimeout(timeoutId);
                    if (settled)
                        return;
                    settled = true;
                    set({ status: 'error' });
                    reject(new Error('Connection failed'));
                };
                socket.onmessage = (event) => {
                    if (wsId !== currentWsId)
                        return;
                    handleMessage(event.data);
                };
            });
        },
        disconnect() {
            intentionalDisconnect = true;
            cleanupWebSocket();
            set({ status: 'disconnected' });
            pendingRequests.forEach((pending) => {
                clearTimeout(pending.timeout);
                pending.reject(new Error('Connection closed'));
            });
            pendingRequests.clear();
        },
        async request(method, params) {
            const currentSeq = ++seq;
            const message = { type: 'req', seq: currentSeq, method, params };
            const state = get();
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    pendingRequests.delete(currentSeq);
                    reject(new Error(`Request timeout: ${method}`));
                }, REQUEST_TIMEOUT);
                pendingRequests.set(currentSeq, {
                    resolve: resolve,
                    reject,
                    timeout,
                });
                if (state.status === 'connected' && ws) {
                    ws.send(JSON.stringify(message));
                }
                else {
                    messageQueue.push(message);
                    console.warn(`[Gateway] Offline, message queued: ${method}`);
                }
            });
        },
        subscribe(event, handler) {
            if (!eventHandlers.has(event))
                eventHandlers.set(event, new Set());
            eventHandlers.get(event).add(handler);
            return () => {
                eventHandlers.get(event)?.delete(handler);
            };
        },
        onConnectionChange(handler) {
            connectionHandlers.add(handler);
            handler(get().status === 'connected');
            return () => {
                connectionHandlers.delete(handler);
            };
        },
        isConnected() {
            return get().status === 'connected';
        },
    };
});
//# sourceMappingURL=websocket.js.map
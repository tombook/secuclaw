/**
 * SecuClaw WebSocket Store — Zustand
 *
 * Manages the WebSocket gateway connection.
 * Preserves the original message protocol (req/res/event/batch).
 * Default endpoint: ws://127.0.0.1:21981/ws (proxied via Vite dev server as /ws)
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
type EventHandler = (data: unknown) => void;
type ConnectionHandler = (connected: boolean) => void;
interface WebSocketState {
    status: ConnectionStatus;
    reconnectAttempts: number;
    lastConnectedAt: Date | null;
}
interface WebSocketActions {
    connect: () => Promise<void>;
    disconnect: () => void;
    request: <T = unknown>(method: string, params?: Record<string, unknown>) => Promise<T>;
    subscribe: (event: string, handler: EventHandler) => () => void;
    onConnectionChange: (handler: ConnectionHandler) => () => void;
    isConnected: () => boolean;
    setAuthToken: (token: string | null) => void;
}
export type WebSocketStore = WebSocketState & WebSocketActions;
export declare const useWebSocketStore: import("zustand").UseBoundStore<import("zustand").StoreApi<WebSocketStore>>;
export {};
//# sourceMappingURL=websocket.d.ts.map
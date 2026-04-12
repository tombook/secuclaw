type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
type MessageHandler = (data: unknown) => void;
type ConnectionHandler = (connected: boolean) => void;

interface RequestMessage {
  type: 'req';
  seq: number;
  method: string;
  params?: Record<string, unknown>;
}

interface ResponseMessage {
  type: 'res';
  seq: number;
  result?: unknown;
  error?: { code: string; message: string };
}

interface EventMessage {
  type: 'event';
  event: string;
  data?: unknown;
}

interface BatchMessage {
  type: 'batch';
  messages: GatewayMessage[];
}

type GatewayMessage = RequestMessage | ResponseMessage | EventMessage | BatchMessage;

class GatewayClient {
  private ws: WebSocket | null = null;
  private url: string;
  private status: ConnectionStatus = 'disconnected';
  private seq = 0;
  private pendingRequests = new Map<number, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }>();
  private eventHandlers = new Map<string, Set<MessageHandler>>();
  private connectionHandlers = new Set<ConnectionHandler>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private messageQueue: RequestMessage[] = [];
  private authToken: string | null = null;

  constructor(url: string = '/ws') {
    this.url = url;
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  private getAuthenticatedUrl(): string {
    if (!this.authToken) return this.url;
    const separator = this.url.includes('?') ? '&' : '?';
    return `${this.url}${separator}token=${encodeURIComponent(this.authToken)}`;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.status = 'connecting';
      this.ws = new WebSocket(this.getAuthenticatedUrl());

      this.ws.onopen = () => {
        this.status = 'connected';
        this.reconnectAttempts = 0;
        this.flushMessageQueue();
        this.notifyConnectionHandlers(true);
        resolve();
      };

      this.ws.onclose = () => {
        this.status = 'disconnected';
        this.notifyConnectionHandlers(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[Gateway] Error:', error);
        this.status = 'error';
        reject(new Error('Connection failed'));
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.status = 'disconnected';
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Connection closed'));
    });
    this.pendingRequests.clear();
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Gateway] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  private handleMessage(data: string): void {
    try {
      const parsed = JSON.parse(data);

      if (parsed.type === 'batch' && Array.isArray(parsed.messages)) {
        for (const msg of parsed.messages) {
          this.handleSingleMessage(msg);
        }
      } else {
        this.handleSingleMessage(parsed);
      }
    } catch (error) {
      console.error('[Gateway] Failed to parse message:', error);
    }
  }

  private handleSingleMessage(message: GatewayMessage): void {
    if (message.type === 'res') {
      const pending = this.pendingRequests.get(message.seq);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.seq);
        if (message.error) {
          pending.reject(new Error(message.error.message));
        } else {
          pending.resolve(message.result);
        }
      }
    } else if (message.type === 'event') {
      const handlers = this.eventHandlers.get(message.event);
      if (handlers) {
        handlers.forEach((handler) => handler(message.data));
      }
    }
  }

  async request<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
    return new Promise((resolve, reject) => {
      const seq = ++this.seq;
      const message: RequestMessage = {
        type: 'req',
        seq,
        method,
        params,
      };

      if (this.status === 'connected' && this.ws) {
        // Online: normal request with timeout
        const timeout = setTimeout(() => {
          this.pendingRequests.delete(seq);
          reject(new Error(`Request timeout: ${method}`));
        }, 30000);

        this.pendingRequests.set(seq, {
          resolve: resolve as (value: unknown) => void,
          reject,
          timeout,
        });

        this.ws.send(JSON.stringify(message));
      } else {
        // Offline: queue message, reject after timeout
        this.messageQueue.push(message);
        console.warn(`[Gateway] Offline, message queued: ${method}`);
        const timeout = setTimeout(() => {
          this.messageQueue = this.messageQueue.filter(m => m.seq !== seq);
          reject(new Error(`Request timeout (offline): ${method}`));
        }, 30000);

        this.pendingRequests.set(seq, {
          resolve: resolve as (value: unknown) => void,
          reject,
          timeout,
        });
      }
    });
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()!;
      this.ws.send(JSON.stringify(message));
    }
  }

  subscribe(event: string, handler: MessageHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    handler(this.status === 'connected');
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach((handler) => handler(connected));
  }

  isConnected(): boolean {
    return this.status === 'connected';
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Wait for the gateway to be connected.
   * Returns immediately if already connected, otherwise waits up to specified timeout.
   */
  waitForConnection(timeoutMs: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.status === 'connected') {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Connection timeout'));
      }, timeoutMs);

      const cleanup = this.onConnectionChange((connected) => {
        if (connected) {
          clearTimeout(timeout);
          cleanup();
          resolve();
        }
      });
    });
  }

  async executeSkill(params: { skillId: string; roleId: string; params: Record<string, any> }): Promise<{ executionId: string }> {
    return this.request<{ executionId: string }>('skill.execute', params);
  }

  cancelSkillExecution(executionId: string): Promise<void> {
    return this.request<void>('skill.cancel', { executionId });
  }

  on(event: string, handler: MessageHandler): () => void {
    return this.subscribe(event, handler);
  }

  off(event: string): void {
    this.eventHandlers.delete(event);
  }
}

export const gatewayClient = new GatewayClient();
export type { GatewayClient, ConnectionStatus };

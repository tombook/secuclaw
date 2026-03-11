import { WebSocketServer, WebSocket, RawData } from 'ws';
import { createServer, IncomingMessage, Server as HttpServer } from 'http';
import { Router } from './router.js';

const logger = {
  info: (...args: any[]) => console.log('[Gateway]', ...args),
  error: (...args: any[]) => console.error('[Gateway]', ...args),
  warn: (...args: any[]) => console.warn('[Gateway]', ...args),
  debug: (...args: any[]) => console.log('[Gateway:DEBUG]', ...args),
};

interface GatewayConfig {
  port: number;
  skillLoader: any;
  mitreLoader: any;
  scfLoader: any;
  jsonStore: any;
}

interface Client {
  id: string;
  ws: WebSocket;
  isAlive: boolean;
  subscriptions: Set<string>;
}

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

type GatewayMessage = RequestMessage | ResponseMessage | EventMessage;

export class GatewayServer {
  private config: GatewayConfig;
  private httpServer: HttpServer;
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();
  private router: Router;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: GatewayConfig) {
    this.config = config;
    this.httpServer = createServer();
    this.wss = new WebSocketServer({ server: this.httpServer });
    this.router = new Router(config);
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.httpServer.listen(this.config.port, () => {
        logger.info(`Gateway server listening on port ${this.config.port}`);
        this.setupWebSocketHandlers();
        this.startHeartbeat();
        resolve();
      });

      this.httpServer.on('error', (error) => {
        logger.error('HTTP server error:', error);
        reject(error);
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }

      // Close all client connections
      this.clients.forEach((client) => {
        client.ws.close(1001, 'Server shutting down');
      });
      this.clients.clear();

      this.wss.close(() => {
        this.httpServer.close(() => {
          logger.info('Gateway server stopped');
          resolve();
        });
      });
    });
  }

  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      const clientId = this.generateClientId();
      const client: Client = {
        id: clientId,
        ws,
        isAlive: true,
        subscriptions: new Set(),
      };

      this.clients.set(clientId, client);
      logger.info(`Client ${clientId} connected. Total clients: ${this.clients.size}`);

      ws.on('message', (data: RawData) => {
        this.handleMessage(client, data);
      });

      ws.on('pong', () => {
        client.isAlive = true;
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        logger.info(`Client ${clientId} disconnected. Total clients: ${this.clients.size}`);
      });

      ws.on('error', (error) => {
        logger.error(`Client ${clientId} error:`, error);
      });
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client) => {
        if (!client.isAlive) {
          logger.warn(`Client ${client.id} not responding, terminating`);
          client.ws.terminate();
          this.clients.delete(client.id);
          return;
        }

        client.isAlive = false;
        client.ws.ping();
      });
    }, 30000); // 30 seconds
  }

  private async handleMessage(client: Client, data: RawData): Promise<void> {
    try {
      const message: GatewayMessage = JSON.parse(data.toString());

      if (message.type === 'req') {
        const response = await this.router.handleRequest(message.method, message.params);
        this.sendResponse(client, message.seq, response);
      }
    } catch (error) {
      logger.error('Failed to handle message:', error);
    }
  }

  private sendResponse(client: Client, seq: number, response: { result?: unknown; error?: { code: string; message: string } }): void {
    const message: ResponseMessage = {
      type: 'res',
      seq,
      ...response,
    };

    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  broadcast(event: string, data: unknown): void {
    const message: EventMessage = {
      type: 'event',
      event,
      data,
    };

    const payload = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN && client.subscriptions.has(event)) {
        client.ws.send(payload);
      }
    });
  }

  broadcastToAll(event: string, data: unknown): void {
    const message: EventMessage = {
      type: 'event',
      event,
      data,
    };

    const payload = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    });
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

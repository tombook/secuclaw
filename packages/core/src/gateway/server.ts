import 'reflect-metadata';
import { Service } from 'typedi';
import { WebSocketServer, WebSocket, RawData } from 'ws';
import { createServer, IncomingMessage, Server as HttpServer } from 'http';
import { Router } from './router.js';
import { verifyToken } from '../auth/jwt.js';
import type { JWTPayload } from '../auth/jwt.js';

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
  kpiService?: any;
  rolesService?: any;
  eventBus?: any;
}

interface Client {
  id: string;
  ws: WebSocket;
  isAlive: boolean;
  subscriptions: Set<string>;
  data?: { user?: JWTPayload };
  pendingMessages: (ResponseMessage | EventMessage)[];
  flushTimer: ReturnType<typeof setTimeout> | null;
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

@Service()
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
    this.router = new Router();

    this.httpServer.on('request', (req, res) => {
      if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
      }
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.httpServer.listen(this.config.port, () => {
        logger.info(`Gateway server listening on port ${this.config.port}`);
        this.setupWebSocketHandlers();
        this.startHeartbeat();
        this.bridgeEventBus();
        resolve();
      });

      this.httpServer.on('error', (error) => {
        logger.error('HTTP server error:', error);
        reject(error);
      });
    });
  }

  /** Expose router for service injection */
  getRouter(): Router {
    return this.router;
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
    this.wss.on('connection', async (ws: WebSocket, request: IncomingMessage) => {
      const clientId = this.generateClientId();
      const client: Client = {
        id: clientId,
        ws,
        isAlive: true,
        subscriptions: new Set(),
        data: {},
        pendingMessages: [],
        flushTimer: null,
      };

      this.clients.set(clientId, client);
      logger.info(`Client ${clientId} connected. Total clients: ${this.clients.size}`);

      // Extract token from URL or header
      let token: string | null = null;
      try {
        const url = (request.url as string) || '';
        const base = `http://${request.headers.host || 'localhost'}`;
        const parsed = new URL(url, base);
        token = parsed.searchParams.get('token');
      } catch {
        // ignore parse errors
      }
      if (!token) {
        const protoHeader = request.headers['sec-websocket-protocol'];
        if (protoHeader) token = Array.isArray(protoHeader) ? protoHeader[0] : (protoHeader as string);
      }

      if (!token) {
        // Demo mode: use default user if no token provided
        client.data = {
          user: {
            userId: 'demo-user',
            username: 'demo-user',
            roleIds: ['secuclaw-commander'],
            permissions: [],
          },
        };
        logger.info(`Client ${clientId} connected as demo user (no token)`);
      } else {
        const payload = await verifyToken(token);
        if (!payload) {
          ws.close(4001, 'Unauthorized: invalid token');
          this.clients.delete(clientId);
          return;
        }
        client.data = { user: payload };
        logger.info(`Client ${clientId} authenticated as ${payload.username}`);
      }

      ws.on('message', (data: RawData) => {
        this.handleMessage(client, data);
      });

      ws.on('pong', () => {
        client.isAlive = true;
      });

      ws.on('close', () => {
        this.flushClient(client);
        if (client.flushTimer) clearTimeout(client.flushTimer);
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
        const response = await this.router.handleRequest(message.method, message.params, client.data);
        this.sendResponse(client, message.seq, response);
      } else if ((message as any).type === 'subscribe') {
        const events = (message as any).events as string[] | undefined;
        if (events) {
          for (const evt of events) {
            client.subscriptions.add(evt);
          }
        }
        logger.debug(`Client ${client.id} subscribed to: ${events?.join(', ') || 'none'}`);
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
      client.pendingMessages.push(message);
      this.scheduleFlush(client);
    }
  }

  private scheduleFlush(client: Client): void {
    if (!client.flushTimer) {
      client.flushTimer = setTimeout(() => {
        this.flushClient(client);
      }, 16);
    }
  }

  private flushClient(client: Client): void {
    if (client.flushTimer) {
      clearTimeout(client.flushTimer);
      client.flushTimer = null;
    }
    if (client.pendingMessages.length === 0) return;
    const payload = JSON.stringify({ type: 'batch', messages: client.pendingMessages });
    client.pendingMessages = [];
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }

  broadcast(event: string, data: unknown): void {
    const message: EventMessage = {
      type: 'event',
      event,
      data,
    };

    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN && client.subscriptions.has(event)) {
        client.pendingMessages.push(message);
        this.scheduleFlush(client);
      }
    });
  }

  broadcastToAll(event: string, data: unknown): void {
    const message: EventMessage = {
      type: 'event',
      event,
      data,
    };

    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.pendingMessages.push(message);
        this.scheduleFlush(client);
      }
    });
  }

  private bridgeEventBus(): void {
    const eventBus = this.config.eventBus;
    if (!eventBus) return;

    const eventNames = [
      'incident.created', 'incident.statusChanged', 'incident.resolved',
      'vulnerability.created', 'vulnerability.statusChanged', 'vulnerability.critical',
      'threat.detected', 'threat.confidenceUpdated',
      'compliance.violation', 'compliance.scoreChanged',
      'asset.created', 'asset.updated', 'asset.deleted', 'asset.vulnerabilityLinked',
      'task.created', 'task.completed', 'approval.expired',
      'anomaly.detected', 'kpi.calculated', 'notification.send', 'system.alert',
      'sla.warning', 'sla.breached',
    ];

    for (const eventName of eventNames) {
      eventBus.on(eventName, (payload: unknown) => {
        this.broadcastToAll(eventName, payload);
      });
    }
    logger.info(`EventBus bridged: ${eventNames.length} events → WebSocket broadcast`);
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

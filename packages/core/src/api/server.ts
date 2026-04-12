/**
 * API Server
 * RESTful API Server with Express
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';

import { assetsRouter } from './routes/assets.js';
import { rolesRouter } from './routes/roles.js';
import { vulnerabilitiesRouter } from './routes/vulnerabilities.js';
import { incidentsRouter } from './routes/incidents.js';
import { tasksRouter } from './routes/tasks.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { rateLimiter } from '../middleware/rate-limiter.js';

const logger = {
  info: (...args: any[]) => console.log('[API]', ...args),
  error: (...args: any[]) => console.error('[API]', ...args),
  warn: (...args: any[]) => console.warn('[API]', ...args),
};

interface ApiServerConfig {
  port: number;
}

export class ApiServer {
  private app: Application;
  private server: ReturnType<typeof createServer> | null = null;
  private config: ApiServerConfig;

  constructor(config: ApiServerConfig) {
    this.config = config;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // Response compression (gzip/deflate) - threshold 1kb
    this.app.use(compression({ threshold: 1024 }));
    
    // CORS configuration
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      exposedHeaders: ['X-Request-ID'],
      credentials: true,
      maxAge: 86400,
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use(morgan('combined'));

    // Rate limiting
    this.app.use(rateLimiter.middleware());
    // Stricter rate limiting for auth endpoints
    this.app.use('/api/v1/auth', rateLimiter.middleware({ windowMs: 15_000, maxRequests: 10, blockDurationMs: 900_000 }));

    // Request ID middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      res.setHeader('X-Request-ID', requestId);
      (req as any).requestId = requestId;
      next();
    });

    // Health check
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });
  }

  private setupRoutes(): void {
    // API v1 routes
    this.app.use('/api/v1/assets', assetsRouter);
    this.app.use('/api/v1/roles', rolesRouter);
    this.app.use('/api/v1/vulnerabilities', vulnerabilitiesRouter);
    this.app.use('/api/v1/incidents', incidentsRouter);
    this.app.use('/api/v1/tasks', tasksRouter);
    
    // API info
    this.app.get('/api', (_req: Request, res: Response) => {
      res.json({
        version: 'v1',
        endpoints: {
          assets: '/api/v1/assets',
          roles: '/api/v1/roles',
          vulnerabilities: '/api/v1/vulnerabilities',
          incidents: '/api/v1/incidents',
          tasks: '/api/v1/tasks',
        },
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = createServer(this.app);
        
        this.server.on('error', (error: NodeJS.ErrnoException) => {
          if (error.code === 'EADDRINUSE') {
            logger.error(`Port ${this.config.port} is already in use`);
            reject(new Error(`Port ${this.config.port} is already in use`));
          } else {
            logger.error('Server error:', error);
            reject(error);
          }
        });

        this.server.listen(this.config.port, () => {
          logger.info(`API server listening on port ${this.config.port}`);
          resolve();
        });
      } catch (error) {
        logger.error('Failed to start API server:', error);
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info('API server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getApp(): Application {
    return this.app;
  }
}

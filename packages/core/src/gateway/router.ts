// NOTE: This router file has been refactored to be a slim entry point.
// All domain-specific route handlers have moved into dedicated modules under
// ./routes. See the new files in packages/core/src/gateway/routes/

export type Handler = (params: Record<string, unknown>) => Promise<unknown>;
export interface EventBusLike {
  emit(event: string, payload: unknown): Promise<void>;
  on?(event: string, handler: (payload: any) => Promise<void>): () => void;
}

// Import route registration helpers
import { registerAuthRoutes } from './routes/auth-routes.js';
import { registerKnowledgeRoutes } from './routes/knowledge-routes.js';
import { registerCommanderRoutes } from './routes/commander-routes.js';
import { registerLlmRoutes } from './routes/llm-routes.js';
import { registerChannelRoutes } from './routes/channel-routes.js';
import { registerCapabilityRoutes } from './routes/capability-routes.js';
import { registerIncidentRoutes } from './routes/incident-routes.js';
import { registerSecurityRoutes } from './routes/security-routes.js';
import { registerAiRoutes } from './routes/ai-routes.js';
import { registerKpiRoutes } from './routes/kpi-routes.js';

const logger = {
  info: (...args: any[]) => console.log('[Router]', ...args),
  error: (...args: any[]) => console.error('[Router]', ...args),
  warn: (...args: any[]) => console.warn('[Router]', ...args),
};

export interface RouterDeps {
  skillLoader: any;
  mitreLoader: any;
  scfLoader: any;
  jsonStore: any;
  kpiService?: any;
  capabilitiesService?: any;
  commanderService?: any;
  incidentsService?: any;
  vulnerabilitiesService?: any;
  threatsService?: any;
  complianceService?: any;
  assetsService?: any;
  aiService?: any;
  channelManager?: any;
  eventBus?: EventBusLike;
}

export class Router {
  private handlers: Map<string, Handler> = new Map();
  private deps: RouterDeps;

  constructor(deps: RouterDeps) {
    this.deps = deps;
    // Register domain-specific routes
    registerAuthRoutes(this.handlers, this.deps);
    registerKnowledgeRoutes(this.handlers, this.deps);
    registerCommanderRoutes(this.handlers, this.deps);
    registerLlmRoutes(this.handlers, this.deps);
    registerChannelRoutes(this.handlers, this.deps);
    registerCapabilityRoutes(this.handlers, this.deps);
    registerIncidentRoutes(this.handlers, this.deps);
    registerSecurityRoutes(this.handlers, this.deps);
    registerAiRoutes(this.handlers, this.deps);
    registerKpiRoutes(this.handlers, this.deps);
  }

  registerHandler(method: string, handler: Handler): void {
    this.handlers.set(method, handler);
  }

  getDeps(): RouterDeps {
    return this.deps;
  }

  async handleRequest(method: string, params: Record<string, unknown> = {}): Promise<{ result?: unknown; error?: { code: string; message: string } }> {
    const handler = this.handlers.get(method);
    if (!handler) {
      logger.warn(`Unknown method: ${method}`);
      return { error: { code: 'METHOD_NOT_FOUND', message: `Unknown method: ${method}` } };
    }
    try {
      const result = await handler(params);
      return { result };
    } catch (error) {
      logger.error(`Error handling ${method}:`, error);
      return {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      };
    }
  }
}

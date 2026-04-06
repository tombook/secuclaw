import { registerAuthRoutes } from './routes/auth-routes.js';
import { registerKnowledgeRoutes } from './routes/knowledge-routes.js';
import { registerCommanderRoutes } from './routes/commander-routes.js';
import { registerLlmRoutes } from './routes/llm-routes.js';
import { registerSecurityRoutes } from './routes/security-routes.js';
import { registerAiRoutes } from './routes/ai-routes.js';
import { registerAssetsRoutes } from './routes/assets-routes.js';
import { registerRolesCrudRoutes } from './routes/roles-crud-routes.js';
import { registerIncidentsCrudRoutes } from './routes/incidents-crud-routes.js';
import { registerVulnerabilitiesCrudRoutes } from './routes/vulnerabilities-crud-routes.js';
import { registerTasksCrudRoutes } from './routes/tasks-crud-routes.js';
import { registerToolRoutes } from './routes/tools-routes.js';
import { registerRiskRoutes } from './routes/risk-routes.js';
import { registerReportRoutes } from './routes/report-routes.js';
import { registerApprovalRoutes } from './routes/approval-routes.js';
import { registerPlaybookRoutes } from './routes/playbook-routes.js';
import { registerSiemRoutes } from './routes/siem-routes.js';

export type Handler = (params: Record<string, unknown>) => Promise<unknown>;

export interface RouterDeps {  skillLoader: any;
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
  eventBus?: any;
}

export class Router {
  private handlers: Map<string, Handler> = new Map();
  private deps: RouterDeps;

  constructor(deps: RouterDeps) {
    this.deps = deps;
    registerAuthRoutes(this.handlers, this.deps);
    registerKnowledgeRoutes(this.handlers, this.deps);
    registerCommanderRoutes(this.handlers, this.deps);
    registerLlmRoutes(this.handlers, this.deps);
    registerAssetsRoutes(this.handlers, this.deps);
    registerSecurityRoutes(this.handlers, this.deps);
    registerAiRoutes(this.handlers, this.deps);
    registerRolesCrudRoutes(this.handlers, this.deps);
    registerIncidentsCrudRoutes(this.handlers, this.deps);
    registerVulnerabilitiesCrudRoutes(this.handlers, this.deps);
    registerTasksCrudRoutes(this.handlers, this.deps);
    registerToolRoutes(this.handlers, this.deps);
    registerRiskRoutes(this.handlers, this.deps);
    registerReportRoutes(this.handlers, this.deps);
    registerApprovalRoutes(this.handlers, this.deps);
    registerPlaybookRoutes(this.handlers, this.deps);
    registerSiemRoutes(this.handlers, { store: this.deps.jsonStore });
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
      return { error: { code: 'METHOD_NOT_FOUND', message: `Unknown method: ${method}` } };
    }
    try {
      const result = await handler(params);
      return { result };
    } catch (error) {
      return {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      };
    }
  }
}

import 'reflect-metadata';
import { Service } from 'typedi';
import type { Handler, HandlerResponse } from './types.js';
import type { JsonStore } from '../storage/json-store.js';
import type { SkillLoader } from '../skills/loader.js';
import type { MitreLoader } from '../knowledge/mitre/loader.js';
import type { ScfLoader } from '../knowledge/scf/loader.js';
import type { AssetsService } from '../assets/service.js';
import type { IncidentsService } from '../incidents/service.js';
import type { VulnerabilitiesService } from '../vulnerabilities/service.js';
import type { CommanderService } from '../commander/service.js';

export interface RouterDeps {
  jsonStore: JsonStore;
  skillLoader?: SkillLoader;
  mitreLoader?: MitreLoader;
  scfLoader?: ScfLoader;
  assetsService?: AssetsService;
  incidentsService?: IncidentsService;
  vulnerabilitiesService?: VulnerabilitiesService;
  commanderService?: CommanderService;
  [key: string]: unknown;
}

@Service()
export class Router {
  private handlers: Map<string, Handler> = new Map();
  private capabilitiesService?: any;
  private channelManager?: any;
  private deps: RouterDeps = { jsonStore: null as any };

  async handleRequest(
    method: string,
    params: Record<string, unknown> = {},
    clientContext?: Record<string, unknown>
  ): Promise<HandlerResponse> {
    const handler = this.handlers.get(method);
    if (!handler) {
      return {
        error: { code: 'METHOD_NOT_FOUND', message: `Unknown method: ${method}` },
      };
    }
    try {
      const result = await handler(params, this.deps, clientContext);
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

  registerHandler(method: string, handler: Handler): void {
    this.handlers.set(method, handler);
  }

  getHandler(method: string): Handler | undefined {
    return this.handlers.get(method);
  }

  getMethodCount(): number {
    return this.handlers.size;
  }

  getMethods(): string[] {
    return Array.from(this.handlers.keys());
  }

  getHandlers(): Map<string, Handler> {
    return this.handlers;
  }

  setHandlersFromMap(handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>): void {
    handlers.forEach((handler, method) => {
      this.registerHandler(method, handler);
    });
  }

  // Backward compatibility methods for main.ts initialization
  setCapabilitiesService(svc: any): void {
    this.capabilitiesService = svc;
  }

  getCapabilitiesService(): any {
    return this.capabilitiesService;
  }

  setChannelManager(mgr: any): void {
    this.channelManager = mgr;
  }

  getChannelManager(): any {
    return this.channelManager;
  }

  // Placeholder for late route registration
  // Routes that depend on runtime services (capabilities, channels) register here
  initLateRoutes(): void {
    // Late route registration is now handled via registerHandler calls
    // after services are injected. This method exists for backward compatibility.
  }

  setDeps(deps: RouterDeps): void {
    this.deps = deps;
  }

  getDeps(): RouterDeps {
    return this.deps;
  }
}

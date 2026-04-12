import type { JsonStore } from '../storage/json-store.js';
import type { LLMConfig } from './llm-types.js';
import type { RaciAssignment, ScenarioType, RoleId } from '../raci/types.js';

const CONFIG_KEY = 'ai-collaboration/config.json';

export interface ModelRouteEntry {
  raciType: RaciAssignment;
  provider: LLMConfig['provider'];
  model: string;
  baseUrl: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}

export interface ModelRoutingConfig {
  routes: ModelRouteEntry[];
  commanderProvider: LLMConfig['provider'];
  commanderModel: string;
  commanderBaseUrl: string;
  commanderApiKey: string;
  maxConcurrency: number;
  singleCallTimeoutMs: number;
  totalTimeoutMs: number;
}

const DEFAULT_ROUTES: ModelRouteEntry[] = [
  {
    raciType: 'R',
    provider: 'bigmodel',
    model: 'GLM-5-Turbo',
    baseUrl: 'https://open.bigmodel.cn/api/coding/paas/v4',
    apiKey: '02795750a3db4446b3d675ac755e6c0a.lc9oQDOH86EZ1kwD',
    temperature: 0.3,
    maxTokens: 2048,
  },
  {
    raciType: 'A',
    provider: 'bigmodel',
    model: 'GLM-5-Turbo',
    baseUrl: 'https://open.bigmodel.cn/api/coding/paas/v4',
    apiKey: '02795750a3db4446b3d675ac755e6c0a.lc9oQDOH86EZ1kwD',
    temperature: 0.2,
    maxTokens: 2048,
  },
  {
    raciType: 'C',
    provider: 'openai',
    model: 'doubao-seed-2.0-pro',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/coding/v3',
    apiKey: '075cca97-a0ca-4225-87bf-78ac1b1e9664',
    temperature: 0.4,
    maxTokens: 1536,
  },
  {
    raciType: 'I',
    provider: 'openai',
    model: 'doubao-seed-2.0-lite',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/coding/v3',
    apiKey: '075cca97-a0ca-4225-87bf-78ac1b1e9664',
    temperature: 0.2,
    maxTokens: 512,
  },
];

export const DEFAULT_CONFIG: ModelRoutingConfig = {
  routes: DEFAULT_ROUTES,
  commanderProvider: 'bigmodel',
  commanderModel: 'GLM-5-Turbo',
  commanderBaseUrl: 'https://open.bigmodel.cn/api/coding/paas/v4',
  commanderApiKey: '02795750a3db4446b3d675ac755e6c0a.lc9oQDOH86EZ1kwD',
  maxConcurrency: 3,
  singleCallTimeoutMs: 15000,
  totalTimeoutMs: 60000,
};

export class AIModelRouter {
  private config: ModelRoutingConfig;
  private store: JsonStore | null;

  constructor(store: JsonStore | null, config?: ModelRoutingConfig) {
    this.store = store;
    this.config = config || { ...DEFAULT_CONFIG, routes: DEFAULT_ROUTES.map(r => ({ ...r })) };
  }

  async load(): Promise<ModelRoutingConfig> {
    if (!this.store) return this.config;
    const stored = await this.store.get<ModelRoutingConfig>(CONFIG_KEY);
    if (stored) {
      this.config = stored;
    }
    return this.config;
  }

  async save(config: Partial<ModelRoutingConfig>): Promise<ModelRoutingConfig> {
    this.config = { ...this.config, ...config };
    if (this.store) {
      await this.store.set(CONFIG_KEY, this.config);
    }
    return this.config;
  }

  getConfig(): ModelRoutingConfig {
    return this.config;
  }

  getRouteForRaciType(raciType: RaciAssignment): ModelRouteEntry {
    const route = this.config.routes.find(r => r.raciType === raciType);
    if (!route) {
      return this.config.routes.find(r => r.raciType === 'C') || DEFAULT_ROUTES[2];
    }
    return route;
  }

  getCommanderRoute(): { provider: LLMConfig['provider']; model: string; baseUrl: string; apiKey: string; temperature: number; maxTokens: number } {
    return {
      provider: this.config.commanderProvider,
      model: this.config.commanderModel,
      baseUrl: this.config.commanderBaseUrl,
      apiKey: this.config.commanderApiKey,
      temperature: 0.2,
      maxTokens: 2048,
    };
  }

  toLLMConfig(route: ModelRouteEntry): LLMConfig {
    return {
      provider: route.provider,
      model: route.model,
      apiKey: route.apiKey,
      baseUrl: route.baseUrl,
      temperature: route.temperature,
      timeout: this.config.singleCallTimeoutMs,
    };
  }

  toCommanderLLMConfig(): LLMConfig {
    const cmd = this.getCommanderRoute();
    return {
      provider: cmd.provider,
      model: cmd.model,
      apiKey: cmd.apiKey,
      baseUrl: cmd.baseUrl,
      temperature: cmd.temperature,
      timeout: this.config.singleCallTimeoutMs,
    };
  }
}

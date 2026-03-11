# SPEC-03: Backend Architecture

> **Document Version**: 1.0  
> **Created**: 2026-03-08  
> **Purpose**: AI-Implementation-Ready Specification for SecuClaw Backend Architecture

---

## 1. Entry Point

**File**: `packages/core/src/main.ts`

```typescript
import { GatewayServer } from './gateway/server.js';
import { SkillLoader } from './skills/loader.js';
import { MitreLoader } from './knowledge/mitre/loader.js';
import { ScfLoader } from './knowledge/scf/loader.js';
import { JsonStore } from './storage/json-store.js';
import { Logger } from './utils/logger.js';

const logger = new Logger('main');

interface AppConfig {
  gatewayPort: number;
  databasePath: string;
  skillsPath: string;
  dataPath: string;
}

const config: AppConfig = {
  gatewayPort: parseInt(process.env.GATEWAY_PORT || '21981', 10),
  databasePath: process.env.DATABASE_PATH || './data/secuclaw.db',
  skillsPath: process.env.SKILLS_PATH || './skills',
  dataPath: process.env.DATA_PATH || './data',
};

class SecuClawApplication {
  private gateway: GatewayServer;
  private skillLoader: SkillLoader;
  private mitreLoader: MitreLoader;
  private scfLoader: ScfLoader;
  private jsonStore: JsonStore;
  private shutdownHandlers: Array<() => Promise<void>> = [];

  constructor(config: AppConfig) {
    this.jsonStore = new JsonStore('./data/storage');
    this.skillLoader = new SkillLoader(config.skillsPath);
    this.mitreLoader = new MitreLoader(`${config.dataPath}/mitre/attack-stix-data`);
    this.scfLoader = new ScfLoader(`${config.dataPath}/scf`);
    this.gateway = new GatewayServer({
      port: config.gatewayPort,
      skillLoader: this.skillLoader,
      mitreLoader: this.mitreLoader,
      scfLoader: this.scfLoader,
      jsonStore: this.jsonStore,
    });
  }

  async initialize(): Promise<void> {
    logger.info('Initializing SecuClaw application...');

    // Load skills
    logger.info('Loading skills...');
    await this.skillLoader.loadAll();
    logger.info(`Loaded ${Object.keys(this.skillLoader.getAll()).length} skills`);

    // Load MITRE ATT&CK data
    logger.info('Loading MITRE ATT&CK data...');
    await this.mitreLoader.loadAll();
    const mitreStats = this.mitreLoader.getStats();
    logger.info(`Loaded MITRE: ${mitreStats.techniques} techniques, ${mitreStats.tactics} tactics`);

    // Load SCF data
    logger.info('Loading SCF data...');
    await this.scfLoader.load();
    const scfStats = this.scfLoader.getStats();
    logger.info(`Loaded SCF: ${scfStats.controls} controls, ${scfStats.domains} domains`);

    // Start gateway server
    logger.info('Starting gateway server...');
    await this.gateway.start();
    this.shutdownHandlers.push(() => this.gateway.stop());

    logger.info('SecuClaw application initialized successfully');
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down SecuClaw application...');

    for (const handler of this.shutdownHandlers) {
      try {
        await handler();
      } catch (error) {
        logger.error('Error during shutdown:', error);
      }
    }

    logger.info('Shutdown complete');
  }

  setupSignalHandlers(): void {
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, initiating graceful shutdown...`);
        await this.shutdown();
        process.exit(0);
      });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      this.shutdown().then(() => process.exit(1));
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection:', reason);
    });
  }
}

// Main entry point
async function main() {
  const app = new SecuClawApplication(config);
  app.setupSignalHandlers();

  try {
    await app.initialize();
    logger.info(`Gateway server running on port ${config.gatewayPort}`);
    logger.info('Ready to accept connections at ws://127.0.0.1:21981/ws');
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

main();
```

---

## 2. WebSocket Gateway

### 2.1 Server

**File**: `packages/core/src/gateway/server.ts`

```typescript
import { WebSocketServer, WebSocket, RawData } from 'ws';
import { createServer, IncomingMessage, Server as HttpServer } from 'http';
import { Router } from './router.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('gateway');

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
```

### 2.2 Message Protocol

```typescript
// Request from client
interface RequestMessage {
  type: 'req';
  seq: number;        // Sequence number for correlation
  method: string;     // API method name (e.g., 'skills.list')
  params?: Record<string, unknown>;
}

// Response to client
interface ResponseMessage {
  type: 'res';
  seq: number;        // Same sequence number as request
  result?: unknown;   // Result data on success
  error?: {           // Error details on failure
    code: string;     // Error code (e.g., 'NOT_FOUND', 'INVALID_PARAMS')
    message: string;  // Human-readable error message
  };
}

// Event broadcast from server
interface EventMessage {
  type: 'event';
  event: string;      // Event name (e.g., 'incident.created')
  data?: unknown;     // Event payload
}
```

### 2.3 API Router

**File**: `packages/core/src/gateway/router.ts`

```typescript
import { Logger } from '../utils/logger.js';

const logger = new Logger('router');

interface RouterDeps {
  skillLoader: any;
  mitreLoader: any;
  scfLoader: any;
  jsonStore: any;
}

type Handler = (params: Record<string, unknown>) => Promise<unknown>;

export class Router {
  private handlers: Map<string, Handler> = new Map();
  private deps: RouterDeps;

  constructor(deps: RouterDeps) {
    this.deps = deps;
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // Skills
    this.handlers.set('skills.list', this.handleSkillsList.bind(this));
    this.handlers.set('skills.get', this.handleSkillsGet.bind(this));

    // MITRE ATT&CK
    this.handlers.set('knowledge.mitre.stats', this.handleMitreStats.bind(this));
    this.handlers.set('knowledge.mitre.tactics', this.handleMitreTactics.bind(this));
    this.handlers.set('knowledge.mitre.techniques', this.handleMitreTechniques.bind(this));
    this.handlers.set('knowledge.mitre.search', this.handleMitreSearch.bind(this));

    // SCF
    this.handlers.set('knowledge.scf.stats', this.handleScfStats.bind(this));
    this.handlers.set('knowledge.scf.domains', this.handleScfDomains.bind(this));
    this.handlers.set('knowledge.scf.controls', this.handleScfControls.bind(this));
    this.handlers.set('knowledge.scf.search', this.handleScfSearch.bind(this));

    // Commander
    this.handlers.set('commander.get', this.handleCommanderGet.bind(this));
    this.handlers.set('commander.create', this.handleCommanderCreate.bind(this));
    this.handlers.set('commander.update', this.handleCommanderUpdate.bind(this));
    this.handlers.set('commander.activateRole', this.handleCommanderActivateRole.bind(this));
    this.handlers.set('commander.deactivateRole', this.handleCommanderDeactivateRole.bind(this));
    this.handlers.set('commander.bindLLM', this.handleCommanderBindLLM.bind(this));

    // LLM Providers
    this.handlers.set('llm.providers.list', this.handleLLMProvidersList.bind(this));
    this.handlers.set('llm.providers.add', this.handleLLMProvidersAdd.bind(this));
    this.handlers.set('llm.providers.update', this.handleLLMProvidersUpdate.bind(this));
    this.handlers.set('llm.providers.delete', this.handleLLMProvidersDelete.bind(this));
    this.handlers.set('llm.chat', this.handleLLMChat.bind(this));

    // Channels
    this.handlers.set('channels.status', this.handleChannelsStatus.bind(this));
    this.handlers.set('channels.configure', this.handleChannelsConfigure.bind(this));
    this.handlers.set('channels.send', this.handleChannelsSend.bind(this));
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

  // ==================== Skills Handlers ====================

  private async handleSkillsList() {
    return this.deps.skillLoader.getAll();
  }

  private async handleSkillsGet(params: Record<string, unknown>) {
    const { roleId } = params;
    if (!roleId || typeof roleId !== 'string') {
      throw new Error('roleId is required');
    }
    return this.deps.skillLoader.get(roleId);
  }

  // ==================== MITRE Handlers ====================

  private async handleMitreStats() {
    return this.deps.mitreLoader.getStats();
  }

  private async handleMitreTactics() {
    return this.deps.mitreLoader.getTactics();
  }

  private async handleMitreTechniques(params: Record<string, unknown>) {
    const { tacticId } = params;
    return this.deps.mitreLoader.getTechniques(tacticId as string | undefined);
  }

  private async handleMitreSearch(params: Record<string, unknown>) {
    const { query, type } = params;
    if (!query || typeof query !== 'string') {
      throw new Error('query is required');
    }
    return this.deps.mitreLoader.search(query, type as 'technique' | 'tactic' | 'all' | undefined);
  }

  // ==================== SCF Handlers ====================

  private async handleScfStats() {
    return this.deps.scfLoader.getStats();
  }

  private async handleScfDomains() {
    return this.deps.scfLoader.getDomains();
  }

  private async handleScfControls(params: Record<string, unknown>) {
    const { domainId } = params;
    return this.deps.scfLoader.getControls(domainId as string | undefined);
  }

  private async handleScfSearch(params: Record<string, unknown>) {
    const { query } = params;
    if (!query || typeof query !== 'string') {
      throw new Error('query is required');
    }
    return this.deps.scfLoader.search(query);
  }

  // ==================== Commander Handlers ====================

  private async handleCommanderGet(params: Record<string, unknown>) {
    const { id } = params;
    return this.deps.jsonStore.get(`commanders/${id}.json`);
  }

  private async handleCommanderCreate(params: Record<string, unknown>) {
    const id = `cmdr_${Date.now()}`;
    const commander = {
      id,
      name: params.name || 'Default Commander',
      type: params.type || 'personal',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      roles: [],
      primaryRole: 'security-expert',
      llmBindings: {},
      skillStates: {},
      settings: {
        language: 'zh-CN',
        theme: 'dark',
        notifications: { enabled: true, channels: [] },
      },
    };
    await this.deps.jsonStore.set(`commanders/${id}.json`, commander);
    return commander;
  }

  private async handleCommanderUpdate(params: Record<string, unknown>) {
    const { id, updates } = params;
    const commander = await this.deps.jsonStore.get(`commanders/${id}.json`);
    const updated = { ...commander, ...updates, updatedAt: Date.now() };
    await this.deps.jsonStore.set(`commanders/${id}.json`, updated);
    return updated;
  }

  private async handleCommanderActivateRole(params: Record<string, unknown>) {
    const { commanderId, roleId } = params;
    const commander = await this.deps.jsonStore.get(`commanders/${commanderId}.json`);
    
    const roleIndex = commander.roles.findIndex((r: any) => r.roleId === roleId);
    if (roleIndex >= 0) {
      commander.roles[roleIndex].enabled = true;
      commander.roles[roleIndex].activatedAt = Date.now();
    } else {
      commander.roles.push({ roleId, enabled: true, activatedAt: Date.now() });
    }
    
    commander.updatedAt = Date.now();
    await this.deps.jsonStore.set(`commanders/${commanderId}.json`, commander);
    return commander;
  }

  private async handleCommanderDeactivateRole(params: Record<string, unknown>) {
    const { commanderId, roleId } = params;
    const commander = await this.deps.jsonStore.get(`commanders/${commanderId}.json`);
    
    const role = commander.roles.find((r: any) => r.roleId === roleId);
    if (role) {
      role.enabled = false;
    }
    
    commander.updatedAt = Date.now();
    await this.deps.jsonStore.set(`commanders/${commanderId}.json`, commander);
    return commander;
  }

  private async handleCommanderBindLLM(params: Record<string, unknown>) {
    const { commanderId, roleId, binding } = params;
    const commander = await this.deps.jsonStore.get(`commanders/${commanderId}.json`);
    
    commander.llmBindings[roleId as string] = binding;
    commander.updatedAt = Date.now();
    
    await this.deps.jsonStore.set(`commanders/${commanderId}.json`, commander);
    return commander;
  }

  // ==================== LLM Handlers ====================

  private async handleLLMProvidersList() {
    const providers = await this.deps.jsonStore.get('llm-providers.json');
    return providers || [];
  }

  private async handleLLMProvidersAdd(params: Record<string, unknown>) {
    const providers = (await this.deps.jsonStore.get('llm-providers.json')) || [];
    const newProvider = {
      id: `provider_${Date.now()}`,
      name: params.name,
      type: params.type,
      baseUrl: params.baseUrl,
      apiKey: params.apiKey,
      models: params.models || [],
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    providers.push(newProvider);
    await this.deps.jsonStore.set('llm-providers.json', providers);
    return newProvider;
  }

  private async handleLLMProvidersUpdate(params: Record<string, unknown>) {
    const { id, updates } = params;
    const providers = (await this.deps.jsonStore.get('llm-providers.json')) || [];
    const index = providers.findIndex((p: any) => p.id === id);
    
    if (index >= 0) {
      providers[index] = { ...providers[index], ...updates, updatedAt: Date.now() };
      await this.deps.jsonStore.set('llm-providers.json', providers);
      return providers[index];
    }
    
    throw new Error('Provider not found');
  }

  private async handleLLMProvidersDelete(params: Record<string, unknown>) {
    const { id } = params;
    const providers = (await this.deps.jsonStore.get('llm-providers.json')) || [];
    const filtered = providers.filter((p: any) => p.id !== id);
    await this.deps.jsonStore.set('llm-providers.json', filtered);
    return { success: true };
  }

  private async handleLLMChat(params: Record<string, unknown>) {
    // Placeholder - actual LLM integration would go here
    const { providerId, model, messages, stream } = params;
    return {
      message: { role: 'assistant', content: 'LLM integration not implemented' },
      providerId,
      model,
    };
  }

  // ==================== Channels Handlers ====================

  private async handleChannelsStatus() {
    // Return status of all channels
    const channels = ['feishu', 'telegram', 'slack', 'discord', 'whatsapp', 'google-chat', 'teams', 'signal', 'imessage', 'nostr'];
    return channels.map((id) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
      connected: false,
      enabled: false,
    }));
  }

  private async handleChannelsConfigure(params: Record<string, unknown>) {
    const { channelId, config } = params;
    await this.deps.jsonStore.set(`channels/${channelId}.json`, config);
    return { success: true, channelId };
  }

  private async handleChannelsSend(params: Record<string, unknown>) {
    const { channelId, message } = params;
    // Placeholder - actual channel integration would go here
    return { success: false, message: 'Channel integration not implemented' };
  }
}
```

---

## 3. Service Layer

### 3.1 Skill Loader

**File**: `packages/core/src/skills/loader.ts`

```typescript
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import { Logger } from '../utils/logger.js';

const logger = new Logger('skill-loader');

interface Capabilities {
  light: string[];
  dark: string[];
  security: string[];
  legal: string[];
  technology: string[];
  business: string[];
}

interface SkillMetadata {
  openclaw: {
    emoji: string;
    role: string;
    combination: 'single' | 'binary' | 'ternary' | 'quaternary';
    version: string;
    capabilities: Capabilities;
    mitre_coverage: string[];
    scf_coverage: string[];
  };
}

interface SkillDefinition {
  name: string;
  description: string;
  homepage: string;
  metadata: SkillMetadata;
  content: string;
  roleId: string;
}

export class SkillLoader {
  private skillsPath: string;
  private skills: Map<string, SkillDefinition> = new Map();

  constructor(skillsPath: string) {
    this.skillsPath = skillsPath;
  }

  async loadAll(): Promise<void> {
    try {
      const dirs = await readdir(this.skillsPath);

      for (const dir of dirs) {
        const skillPath = join(this.skillsPath, dir, 'SKILL.md');
        try {
          const skill = await this.loadSkill(dir, skillPath);
          if (skill) {
            this.skills.set(dir, skill);
            logger.debug(`Loaded skill: ${dir}`);
          }
        } catch (error) {
          logger.warn(`Failed to load skill ${dir}:`, error);
        }
      }

      logger.info(`Loaded ${this.skills.size} skills`);
    } catch (error) {
      logger.error('Failed to load skills:', error);
      throw error;
    }
  }

  private async loadSkill(roleId: string, filePath: string): Promise<SkillDefinition | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const { data, content: body } = matter(content);

      return {
        name: data.name || roleId,
        description: data.description || '',
        homepage: data.homepage || '',
        metadata: data.metadata || { openclaw: {} },
        content: body,
        roleId,
      };
    } catch (error) {
      // File doesn't exist or parsing error
      return null;
    }
  }

  get(roleId: string): SkillDefinition | undefined {
    return this.skills.get(roleId);
  }

  getAll(): Record<string, SkillDefinition> {
    return Object.fromEntries(this.skills);
  }

  getCapabilities(roleId: string): Capabilities | null {
    const skill = this.skills.get(roleId);
    return skill?.metadata?.openclaw?.capabilities || null;
  }

  getMitreCoverage(roleId: string): string[] {
    const skill = this.skills.get(roleId);
    return skill?.metadata?.openclaw?.mitre_coverage || [];
  }

  getScfCoverage(roleId: string): string[] {
    const skill = this.skills.get(roleId);
    return skill?.metadata?.openclaw?.scf_coverage || [];
  }
}
```

### 3.2 MITRE Loader

**File**: `packages/core/src/knowledge/mitre/loader.ts`

```typescript
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { Logger } from '../utils/logger.js';

const logger = new Logger('mitre-loader');

interface MitreTactic {
  id: string;
  external_id: string;
  name: string;
  description: string;
  shortname: string;
}

interface MitreTechnique {
  id: string;
  external_id: string;
  name: string;
  description: string;
  tactics: string[];
  platforms: string[];
  killChainPhases: string[];
}

interface MitreStats {
  techniques: number;
  tactics: number;
  enterprise: number;
  mobile: number;
  ics: number;
}

interface StixObject {
  type: string;
  id: string;
  name?: string;
  description?: string;
  external_references?: Array<{ external_id: string; source_name: string }>;
  kill_chain_phases?: Array<{ kill_chain_name: string; phase_name: string }>;
  x_mitre_platforms?: string[];
  x_mitre_shortname?: string;
}

export class MitreLoader {
  private dataPath: string;
  private tactics: Map<string, MitreTactic> = new Map();
  private techniques: Map<string, MitreTechnique> = new Map();
  private searchIndex: Map<string, { type: 'tactic' | 'technique'; id: string }> = new Map();

  constructor(dataPath: string) {
    this.dataPath = dataPath;
  }

  async loadAll(): Promise<void> {
    const files = ['enterprise-attack.json', 'mobile-attack.json', 'ics-attack.json'];

    for (const file of files) {
      try {
        const filePath = join(this.dataPath, file);
        await this.loadFile(filePath, file.replace('-attack.json', ''));
      } catch (error) {
        logger.warn(`Failed to load ${file}:`, error);
      }
    }

    this.buildSearchIndex();
    logger.info(`Loaded ${this.tactics.size} tactics, ${this.techniques.size} techniques`);
  }

  private async loadFile(filePath: string, source: string): Promise<void> {
    const content = await readFile(filePath, 'utf-8');
    const data = JSON.parse(content);

    if (!data.objects || !Array.isArray(data.objects)) {
      throw new Error('Invalid STIX format');
    }

    for (const obj of data.objects as StixObject[]) {
      if (obj.type === 'x-mitre-tactic') {
        this.parseTactic(obj);
      } else if (obj.type === 'attack-pattern') {
        this.parseTechnique(obj);
      }
    }
  }

  private parseTactic(obj: StixObject): void {
    const externalRef = obj.external_references?.find((r) => r.source_name === 'mitre-attack');
    
    const tactic: MitreTactic = {
      id: obj.id,
      external_id: externalRef?.external_id || '',
      name: obj.name || '',
      description: obj.description || '',
      shortname: obj.x_mitre_shortname || '',
    };

    this.tactics.set(obj.id, tactic);
  }

  private parseTechnique(obj: StixObject): void {
    const externalRef = obj.external_references?.find((r) => r.source_name === 'mitre-attack');
    const tactics = obj.kill_chain_phases
      ?.filter((p) => p.kill_chain_name === 'mitre-attack')
      .map((p) => p.phase_name) || [];

    const technique: MitreTechnique = {
      id: obj.id,
      external_id: externalRef?.external_id || '',
      name: obj.name || '',
      description: obj.description || '',
      tactics,
      platforms: obj.x_mitre_platforms || [],
      killChainPhases: obj.kill_chain_phases?.map((p) => p.phase_name) || [],
    };

    this.techniques.set(obj.id, technique);
  }

  private buildSearchIndex(): void {
    // Index tactics
    this.tactics.forEach((tactic, id) => {
      const key = `${tactic.name} ${tactic.description} ${tactic.external_id}`.toLowerCase();
      this.searchIndex.set(key, { type: 'tactic', id });
    });

    // Index techniques
    this.techniques.forEach((technique, id) => {
      const key = `${technique.name} ${technique.description} ${technique.external_id}`.toLowerCase();
      this.searchIndex.set(key, { type: 'technique', id });
    });
  }

  getTactics(): MitreTactic[] {
    return Array.from(this.tactics.values());
  }

  getTactic(id: string): MitreTactic | undefined {
    return this.tactics.get(id);
  }

  getTechniques(tacticId?: string): MitreTechnique[] {
    const all = Array.from(this.techniques.values());
    if (!tacticId) return all;
    return all.filter((t) => t.tactics.includes(tacticId));
  }

  getTechnique(id: string): MitreTechnique | undefined {
    return this.techniques.get(id);
  }

  getStats(): MitreStats {
    return {
      techniques: this.techniques.size,
      tactics: this.tactics.size,
      enterprise: 0, // Could be calculated from source tracking
      mobile: 0,
      ics: 0,
    };
  }

  search(query: string, type?: 'technique' | 'tactic' | 'all'): Array<MitreTactic | MitreTechnique> {
    const results: Array<MitreTactic | MitreTechnique> = [];
    const queryLower = query.toLowerCase();

    this.searchIndex.forEach((index, key) => {
      if (key.includes(queryLower)) {
        if (type === 'tactic' && index.type === 'tactic') {
          results.push(this.tactics.get(index.id)!);
        } else if (type === 'technique' && index.type === 'technique') {
          results.push(this.techniques.get(index.id)!);
        } else if (!type || type === 'all') {
          if (index.type === 'tactic') {
            results.push(this.tactics.get(index.id)!);
          } else {
            results.push(this.techniques.get(index.id)!);
          }
        }
      }
    });

    return results;
  }
}
```

### 3.3 SCF Loader

**File**: `packages/core/src/knowledge/scf/loader.ts`

```typescript
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { Logger } from '../utils/logger.js';

const logger = new Logger('scf-loader');

interface ScfDomain {
  id: string;
  scfIdentifier: string;
  name: string;
  description: string;
}

interface ScfControl {
  id: string;
  scfNumber: string;
  name: string;
  description: string;
  domain: string;
  category: string;
  objectives?: string[];
}

interface ScfStats {
  controls: number;
  domains: number;
  categories: string[];
}

export class ScfLoader {
  private dataPath: string;
  private domains: Map<string, ScfDomain> = new Map();
  private controls: Map<string, ScfControl> = new Map();
  private controlsByDomain: Map<string, string[]> = new Map();

  constructor(dataPath: string) {
    this.dataPath = dataPath;
  }

  async load(): Promise<void> {
    // Load domains
    try {
      const domainsData = await readFile(join(this.dataPath, 'scf-domains-principles.json'), 'utf-8');
      const domains = JSON.parse(domainsData);
      
      for (const domain of domains) {
        const scfDomain: ScfDomain = {
          id: domain['SCF Identifier'] || domain.id,
          scfIdentifier: domain['SCF Identifier'] || '',
          name: domain['SCF Domain'] || domain.name || '',
          description: domain['Description'] || domain.description || '',
        };
        this.domains.set(scfDomain.id, scfDomain);
      }
    } catch (error) {
      logger.warn('Failed to load SCF domains:', error);
    }

    // Load controls
    try {
      const controlsData = await readFile(join(this.dataPath, 'scf-20254.json'), 'utf-8');
      const controls = JSON.parse(controlsData);

      for (const control of controls) {
        const scfControl: ScfControl = {
          id: control['SCF #'] || control.id,
          scfNumber: control['SCF #'] || '',
          name: control['Control'] || control.name || '',
          description: control['Control Description'] || control.description || '',
          domain: control['SCF Domain'] || control.domain || '',
          category: control['SCF Control'] || control.category || '',
          objectives: control['Control Objectives'] ? [control['Control Objectives']] : undefined,
        };

        this.controls.set(scfControl.id, scfControl);

        // Index by domain
        if (scfControl.domain) {
          if (!this.controlsByDomain.has(scfControl.domain)) {
            this.controlsByDomain.set(scfControl.domain, []);
          }
          this.controlsByDomain.get(scfControl.domain)!.push(scfControl.id);
        }
      }
    } catch (error) {
      logger.warn('Failed to load SCF controls:', error);
    }

    logger.info(`Loaded ${this.domains.size} domains, ${this.controls.size} controls`);
  }

  getDomains(): ScfDomain[] {
    return Array.from(this.domains.values());
  }

  getDomain(id: string): ScfDomain | undefined {
    return this.domains.get(id);
  }

  getControls(domainId?: string): ScfControl[] {
    if (!domainId) {
      return Array.from(this.controls.values());
    }

    const controlIds = this.controlsByDomain.get(domainId) || [];
    return controlIds.map((id) => this.controls.get(id)!).filter(Boolean);
  }

  getControl(id: string): ScfControl | undefined {
    return this.controls.get(id);
  }

  getStats(): ScfStats {
    const categories = new Set<string>();
    this.controls.forEach((control) => {
      if (control.category) categories.add(control.category);
    });

    return {
      controls: this.controls.size,
      domains: this.domains.size,
      categories: Array.from(categories),
    };
  }

  search(query: string): ScfControl[] {
    const results: ScfControl[] = [];
    const queryLower = query.toLowerCase();

    this.controls.forEach((control) => {
      const searchable = `${control.name} ${control.description} ${control.scfNumber} ${control.category}`.toLowerCase();
      if (searchable.includes(queryLower)) {
        results.push(control);
      }
    });

    return results;
  }
}
```

---

## 4. Data Layer

### 4.1 JSON Store

**File**: `packages/core/src/storage/json-store.ts`

```typescript
import { mkdir, readFile, writeFile, unlink, access } from 'fs/promises';
import { join, dirname } from 'path';
import { Logger } from '../utils/logger.js';

const logger = new Logger('json-store');

export class JsonStore {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  private async ensureDir(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    await mkdir(dir, { recursive: true });
  }

  private resolvePath(key: string): string {
    return join(this.basePath, key);
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const filePath = this.resolvePath(key);
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch (error) {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const filePath = this.resolvePath(key);
    await this.ensureDir(filePath);
    
    // Write to temp file first, then rename (atomic write)
    const tempPath = `${filePath}.tmp`;
    await writeFile(tempPath, JSON.stringify(value, null, 2), 'utf-8');
    
    // Rename temp to actual (atomic on most systems)
    const fs = await import('fs/promises');
    await fs.rename(tempPath, filePath);
    
    logger.debug(`Saved: ${key}`);
  }

  async delete(key: string): Promise<boolean> {
    try {
      const filePath = this.resolvePath(key);
      await unlink(filePath);
      logger.debug(`Deleted: ${key}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const filePath = this.resolvePath(key);
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async list(prefix: string): Promise<string[]> {
    try {
      const dir = this.resolvePath(prefix);
      const fs = await import('fs/promises');
      const files = await fs.readdir(dir);
      return files.filter((f) => f.endsWith('.json'));
    } catch {
      return [];
    }
  }
}
```

### 4.2 SQLite Store

**File**: `packages/core/src/storage/sqlite-store.ts`

```typescript
import Database from 'better-sqlite3';
import { Logger } from '../utils/logger.js';

const logger = new Logger('sqlite-store');

interface AuditLog {
  id: number;
  timestamp: number;
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  details?: string;
}

interface Session {
  id: string;
  data: string;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
}

export class SqliteStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initializeSchema();
  }

  private initializeSchema(): void {
    // Audit logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        user_id TEXT,
        details TEXT
      )
    `);

    // Sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        expires_at INTEGER
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    `);

    logger.info('SQLite schema initialized');
  }

  // Audit logging
  logAudit(action: string, entityType: string, entityId: string, userId?: string, details?: object): void {
    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (timestamp, action, entity_type, entity_id, user_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      Date.now(),
      action,
      entityType,
      entityId,
      userId || null,
      details ? JSON.stringify(details) : null
    );
  }

  getAuditLogs(options: { entityType?: string; entityId?: string; limit?: number } = {}): AuditLog[] {
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];

    if (options.entityType) {
      sql += ' AND entity_type = ?';
      params.push(options.entityType);
    }

    if (options.entityId) {
      sql += ' AND entity_id = ?';
      params.push(options.entityId);
    }

    sql += ' ORDER BY timestamp DESC';

    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as AuditLog[];
  }

  // Session management
  setSession(id: string, data: object, expiresIn?: number): void {
    const now = Date.now();
    const expiresAt = expiresIn ? now + expiresIn : null;

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO sessions (id, data, created_at, updated_at, expires_at)
      VALUES (?, ?, COALESCE((SELECT created_at FROM sessions WHERE id = ?), ?), ?, ?)
    `);

    stmt.run(
      id,
      JSON.stringify(data),
      id,
      now,
      now,
      expiresAt
    );
  }

  getSession<T = unknown>(id: string): T | null {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    const row = stmt.get(id) as Session | undefined;

    if (!row) return null;

    // Check expiration
    if (row.expiresAt && row.expiresAt < Date.now()) {
      this.deleteSession(id);
      return null;
    }

    return JSON.parse(row.data) as T;
  }

  deleteSession(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Cleanup expired sessions
  cleanExpiredSessions(): number {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE expires_at IS NOT NULL AND expires_at < ?');
    const result = stmt.run(Date.now());
    return result.changes;
  }

  close(): void {
    this.db.close();
    logger.info('SQLite connection closed');
  }
}
```

---

## 5. REST API Endpoints

### 5.1 Knowledge Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/knowledge/mitre/stats` | Get MITRE statistics |
| GET | `/api/knowledge/mitre/tactics` | List all MITRE tactics |
| GET | `/api/knowledge/mitre/techniques` | List all MITRE techniques |
| POST | `/api/knowledge/mitre/search` | Search MITRE data |
| GET | `/api/knowledge/scf/stats` | Get SCF statistics |
| GET | `/api/knowledge/scf/domains` | List all SCF domains |
| GET | `/api/knowledge/scf/controls` | List all SCF controls |
| POST | `/api/knowledge/scf/search` | Search SCF data |

### 5.2 Skill Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/skills` | List all skills |
| GET | `/api/skills/:roleId` | Get specific skill |
| GET | `/api/skills/:roleId/capabilities` | Get skill capabilities |

### 5.3 LLM Provider Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/llm/providers` | List all LLM providers |
| POST | `/api/llm/providers` | Create new provider |
| PUT | `/api/llm/providers/:id` | Update provider |
| DELETE | `/api/llm/providers/:id` | Delete provider |
| POST | `/api/llm/chat` | Send chat message |

---

## 6. Types Reference

### 6.1 Commander Types

```typescript
interface Commander {
  id: string;
  name: string;
  type: 'personal' | 'organization' | 'government';
  organization?: string;
  createdAt: number;
  updatedAt: number;
  roles: RoleConfig[];
  primaryRole: string;
  llmBindings: Record<string, LLMBinding>;
  skillStates: Record<string, SkillState>;
  settings: CommanderSettings;
}

interface RoleConfig {
  roleId: string;
  enabled: boolean;
  activatedAt?: number;
  customCapabilities?: Partial<Capabilities>;
}

interface LLMBinding {
  providerId: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
}

interface SkillState {
  installed: boolean;
  activated: boolean;
  installedAt?: number;
  activatedAt?: number;
  version: string;
}

interface CommanderSettings {
  language: 'zh-CN' | 'en' | 'zh-TW';
  theme: 'light' | 'dark' | 'system';
  notifications: {
    enabled: boolean;
    channels: string[];
  };
}
```

### 6.2 Skill Types

```typescript
interface SkillDefinition {
  name: string;
  description: string;
  homepage: string;
  metadata: {
    openclaw: {
      emoji: string;
      role: string;
      combination: 'single' | 'binary' | 'ternary' | 'quaternary';
      version: string;
      capabilities: Capabilities;
      mitre_coverage: string[];
      scf_coverage: string[];
    };
  };
  content: string;
}

interface Capabilities {
  light: string[];
  dark: string[];
  security: string[];
  legal: string[];
  technology: string[];
  business: string[];
}
```

### 6.3 Knowledge Types

```typescript
interface MitreTactic {
  id: string;
  external_id: string;
  name: string;
  description: string;
  shortname: string;
}

interface MitreTechnique {
  id: string;
  external_id: string;
  name: string;
  description: string;
  tactics: string[];
  platforms: string[];
  killChainPhases: string[];
}

interface ScfDomain {
  id: string;
  scfIdentifier: string;
  name: string;
  description: string;
}

interface ScfControl {
  id: string;
  scfNumber: string;
  name: string;
  description: string;
  domain: string;
  category: string;
  objectives?: string[];
}
```

### 6.4 LLM Provider Types

```typescript
interface LLMProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'azure' | 'local' | 'custom';
  baseUrl: string;
  apiKey?: string;
  models: string[];
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}
```

---

## 7. Error Codes

| Code | Description |
|------|-------------|
| `METHOD_NOT_FOUND` | Unknown API method |
| `INVALID_PARAMS` | Missing or invalid parameters |
| `NOT_FOUND` | Resource not found |
| `INTERNAL_ERROR` | Server-side error |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Permission denied |

---

*End of SPEC-03: Backend Architecture*

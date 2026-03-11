import { CapabilitiesRepository } from '../capabilities/repository.js';
import { CapabilitiesService } from '../capabilities/service.js';

import { readFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

const logger = {
  info: (...args: any[]) => console.log('[Router]', ...args),
  error: (...args: any[]) => console.error('[Router]', ...args),
  warn: (...args: any[]) => console.warn('[Router]', ...args),
};

interface RouterDeps {
  skillLoader: any;
  mitreLoader: any;
  scfLoader: any;
  jsonStore: any;
  capabilitiesService?: CapabilitiesService;
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

    // AI Experts Config
    this.handlers.set('aiExperts.config.get', this.handleAIExpertsConfigGet.bind(this));
    this.handlers.set('aiExperts.config.save', this.handleAIExpertsConfigSave.bind(this));

    // Channels
    this.handlers.set('channels.status', this.handleChannelsStatus.bind(this));
    this.handlers.set('channels.configure', this.handleChannelsConfigure.bind(this));
    this.handlers.set('channels.send', this.handleChannelsSend.bind(this));

    // Capabilities Center
    this.handlers.set('capabilities.domains.list', this.handleCapabilitiesDomainsList.bind(this));
    this.handlers.set('capabilities.items.list', this.handleCapabilitiesItemsList.bind(this));
    this.handlers.set('capabilities.tasks.list', this.handleCapabilitiesTasksList.bind(this));
    this.handlers.set('capabilities.tasks.create', this.handleCapabilitiesTasksCreate.bind(this));
    this.handlers.set('capabilities.tasks.updateStatus', this.handleCapabilitiesTasksUpdateStatus.bind(this));
    this.handlers.set('capabilities.tasks.sla', this.handleCapabilitiesTasksSLA.bind(this));
    this.handlers.set('capabilities.tasks.close', this.handleCapabilitiesTasksClose.bind(this));
    this.handlers.set('capabilities.tasks.reopen', this.handleCapabilitiesTasksReopen.bind(this));
    this.handlers.set('capabilities.approvals.create', this.handleCapabilitiesApprovalsCreate.bind(this));
    this.handlers.set('capabilities.approvals.approve', this.handleCapabilitiesApprovalsApprove.bind(this));
    this.handlers.set('capabilities.runs.execute', this.handleCapabilitiesRunsExecute.bind(this));
    this.handlers.set('capabilities.runs.listByTask', this.handleCapabilitiesRunsListByTask.bind(this));
    this.handlers.set('capabilities.evidence.create', this.handleCapabilitiesEvidenceCreate.bind(this));
    this.handlers.set('capabilities.evidence.list', this.handleCapabilitiesEvidenceList.bind(this));
    this.handlers.set('capabilities.overview.metrics', this.handleCapabilitiesOverviewMetrics.bind(this));
  }

  private normalizeProvider(input: unknown, index: number): { provider: any; changed: boolean } {
    const source = (input && typeof input === 'object') ? (input as Record<string, unknown>) : {};
    let changed = !(input && typeof input === 'object');

    const rawModels = source.models;
    let models: string[] = [];
    if (Array.isArray(rawModels)) {
      models = rawModels.map((m) => String(m)).filter((m) => m.length > 0);
      if (models.length !== rawModels.length || rawModels.some((m, i) => m !== models[i])) {
        changed = true;
      }
    } else if (typeof rawModels === 'string') {
      models = rawModels
        .split(',')
        .map((m) => m.trim())
        .filter((m) => m.length > 0);
      changed = true;
    } else {
      changed = true;
    }

    const now = Date.now();
    const id = typeof source.id === 'string' && source.id.trim() ? source.id : `provider_${now}_${index}`;
    const name = typeof source.name === 'string' && source.name.trim() ? source.name : `Provider ${index + 1}`;
    const type = typeof source.type === 'string' && source.type.trim() ? source.type : 'custom';
    const baseUrl = typeof source.baseUrl === 'string' ? source.baseUrl : '';
    const apiKey = typeof source.apiKey === 'string' ? source.apiKey : '';
    const enabled = typeof source.enabled === 'boolean' ? source.enabled : true;
    const createdAt = typeof source.createdAt === 'number' ? source.createdAt : now;
    const updatedAt = typeof source.updatedAt === 'number' ? source.updatedAt : now;

    if (id !== source.id || name !== source.name || type !== source.type || baseUrl !== source.baseUrl || apiKey !== source.apiKey) {
      changed = true;
    }
    if (enabled !== source.enabled || createdAt !== source.createdAt || updatedAt !== source.updatedAt) {
      changed = true;
    }

    return {
      provider: {
        id,
        name,
        type,
        baseUrl,
        apiKey,
        models,
        enabled,
        createdAt,
        updatedAt,
      },
      changed,
    };
  }

  private normalizeProviders(raw: unknown): { providers: any[]; changed: boolean } {
    let candidates: unknown[] = [];
    let changed = false;

    if (Array.isArray(raw)) {
      candidates = raw;
    } else if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      if (Array.isArray(obj.providers)) {
        candidates = obj.providers;
      } else if (Array.isArray(obj.data)) {
        candidates = obj.data;
      } else {
        candidates = Object.values(obj).filter((value) => value && typeof value === 'object');
      }
      changed = true;
    } else if (raw != null) {
      changed = true;
    }

    const providers = candidates.map((item, index) => {
      const normalized = this.normalizeProvider(item, index);
      if (normalized.changed) {
        changed = true;
      }
      return normalized.provider;
    });

    return { providers, changed };
  }

  private async loadLegacyProvidersFile(): Promise<unknown | null> {
    try {
      const filePath = join(homedir(), '.secuclaw', 'config', 'llm-providers.json');
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private async loadProvidersFromStore(): Promise<any[]> {
    const raw = await this.deps.jsonStore.get('llm-providers.json');
    let { providers, changed } = this.normalizeProviders(raw);

    // Backward compatibility: migrate from ~/.secuclaw/config/llm-providers.json
    if (providers.length === 0) {
      const legacyRaw = await this.loadLegacyProvidersFile();
      if (legacyRaw) {
        const normalizedLegacy = this.normalizeProviders(legacyRaw);
        providers = normalizedLegacy.providers;
        changed = providers.length > 0 || changed || normalizedLegacy.changed;
      }
    }

    if (changed) {
      await this.deps.jsonStore.set('llm-providers.json', providers);
    }

    return providers;
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
    const commander = await this.deps.jsonStore.get(`commanders/${id}.json`);
    
    // Return default commander if not found
    if (!commander) {
      return {
        id: id || 'default',
        name: 'Default Commander',
        type: 'personal',
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
    }
    return commander;
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
    
    if (!commander) {
      throw new Error('Commander not found');
    }

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
    
    if (!commander) {
      throw new Error('Commander not found');
    }

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
    
    if (!commander) {
      throw new Error('Commander not found');
    }

    commander.llmBindings[roleId as string] = binding;
    commander.updatedAt = Date.now();
    
    await this.deps.jsonStore.set(`commanders/${commanderId}.json`, commander);
    return commander;
  }

  // ==================== LLM Handlers ====================

  private async handleLLMProvidersList() {
    return this.loadProvidersFromStore();
  }

  private async handleLLMProvidersAdd(params: Record<string, unknown>) {
    const providers = await this.loadProvidersFromStore();
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
    const providers = await this.loadProvidersFromStore();
    const index = providers.findIndex((p: any) => p.id === id);
    
    if (index >= 0) {
      providers[index] = { ...providers[index], ...updates, updatedAt: Date.now() };
      providers[index] = this.normalizeProvider(providers[index], index).provider;
      await this.deps.jsonStore.set('llm-providers.json', providers);
      return providers[index];
    }
    
    throw new Error('Provider not found');
  }

  private async handleLLMProvidersDelete(params: Record<string, unknown>) {
    const { id } = params;
    const providers = await this.loadProvidersFromStore();
    const filtered = providers.filter((p: any) => p.id !== id);
    await this.deps.jsonStore.set('llm-providers.json', filtered);
    return { success: true };
  }

  private async handleLLMChat(params: Record<string, unknown>) {
    // Placeholder - actual LLM integration would go here
    const { providerId, model, messages } = params;
    return {
      message: { role: 'assistant', content: 'LLM integration not implemented' },
      providerId,
      model,
    };
  }

  // ==================== Channels Handlers ====================

  private async handleChannelsStatus() {
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

  // ==================== Capabilities Center Handlers ====================

  private getCapabilitiesService(): CapabilitiesService {
    if (!this.deps.capabilitiesService) {
      const repo = new CapabilitiesRepository(this.deps.jsonStore);
      this.deps.capabilitiesService = new CapabilitiesService(repo);
    }
    return this.deps.capabilitiesService;
  }

  private async handleCapabilitiesDomainsList() {
    return this.getCapabilitiesService().listDomains();
  }

  private async handleCapabilitiesItemsList(params: Record<string, unknown>) {
    return this.getCapabilitiesService().listItems({
      domainId: params.domainId as any,
      roleId: params.roleId as string,
      enabledOnly: params.enabledOnly as boolean,
    });
  }

  private async handleCapabilitiesTasksList(params: Record<string, unknown>) {
    return this.getCapabilitiesService().listTasks({
      domainId: params.domainId as any,
      status: params.status as any,
      assigneeRole: params.assigneeRole as string,
      priority: params.priority as any,
      capabilityId: params.capabilityId as string,
      limit: params.limit as number,
      offset: params.offset as number,
    });
  }

  private async handleCapabilitiesTasksCreate(params: Record<string, unknown>) {
    const { domainId, capabilityId, title, description, priority, assigneeRole, dueAt, slaMinutes } = params;
    if (!domainId || !capabilityId || !title || !priority || !assigneeRole) {
      throw new Error('Missing required parameters: domainId, capabilityId, title, priority, assigneeRole');
    }
    return this.getCapabilitiesService().createTask({
      domainId: domainId as any,
      capabilityId: capabilityId as string,
      title: title as string,
      description: description as string,
      priority: priority as any,
      assigneeRole: assigneeRole as string,
      dueAt: dueAt as number,
      slaMinutes: slaMinutes as number,
    });
  }

  private async handleCapabilitiesTasksUpdateStatus(params: Record<string, unknown>) {
    const { id, status, comment } = params;
    if (!id || !status) {
      throw new Error('Missing required parameters: id, status');
    }
    return this.getCapabilitiesService().updateTaskStatus({
      id: id as string,
      status: status as any,
      comment: comment as string,
    });
  }

  private async handleCapabilitiesTasksSLA(params: Record<string, unknown>) {
    const { taskId } = params;
    if (!taskId) {
      throw new Error('Missing required parameter: taskId');
    }
    return this.getCapabilitiesService().getTaskSLAStatus(taskId as string);
  }

  private async handleCapabilitiesTasksClose(params: Record<string, unknown>) {
    const { id, comment } = params;
    if (!id) {
      throw new Error('Missing required parameter: id');
    }
    return this.getCapabilitiesService().updateTaskStatus({
      id: id as string,
      status: 'closed',
      comment: comment as string,
    });
  }

  private async handleCapabilitiesTasksReopen(params: Record<string, unknown>) {
    const { id, comment } = params;
    if (!id) {
      throw new Error('Missing required parameter: id');
    }
    return this.getCapabilitiesService().updateTaskStatus({
      id: id as string,
      status: 'in_progress',
      comment: comment as string,
    });
  }

  private async handleCapabilitiesApprovalsCreate(params: Record<string, unknown>) {
    const { taskId, requester, scope, ticketNo, expiresAt } = params;
    if (!taskId || !requester || !scope || !ticketNo || !expiresAt) {
      throw new Error('Missing required parameters: taskId, requester, scope, ticketNo, expiresAt');
    }
    return this.getCapabilitiesService().createApproval({
      taskId: taskId as string,
      requester: requester as string,
      scope: scope as string,
      ticketNo: ticketNo as string,
      expiresAt: expiresAt as number,
    });
  }

  private async handleCapabilitiesApprovalsApprove(params: Record<string, unknown>) {
    const { id, approver, approved, reason } = params;
    if (!id || !approver || typeof approved !== 'boolean') {
      throw new Error('Missing required parameters: id, approver, approved');
    }
    return this.getCapabilitiesService().approveApproval({
      id: id as string,
      approver: approver as string,
      approved: approved as boolean,
      reason: reason as string,
    });
  }

  private async handleCapabilitiesRunsExecute(params: Record<string, unknown>) {
    const { taskId, toolId, params: execParams } = params;
    if (!taskId || !toolId) {
      throw new Error('Missing required parameters: taskId, toolId');
    }
    return this.getCapabilitiesService().executeRun({
      taskId: taskId as string,
      toolId: toolId as string,
      params: (execParams || {}) as Record<string, unknown>,
    });
  }

  private async handleCapabilitiesRunsListByTask(params: Record<string, unknown>) {
    const { taskId } = params;
    if (!taskId) {
      throw new Error('Missing required parameter: taskId');
    }
    return this.getCapabilitiesService().listRunsByTask(taskId as string);
  }

  private async handleCapabilitiesEvidenceCreate(params: Record<string, unknown>) {
    const { domainId, taskId, runId, title, description, files, tags, createdBy } = params;
    if (!domainId || !title || !files) {
      throw new Error('Missing required parameters: domainId, title, files');
    }
    return this.getCapabilitiesService().createEvidence({
      domainId: domainId as any,
      taskId: taskId as string,
      runId: runId as string,
      title: title as string,
      description: description as string,
      files: files as string[],
      tags: tags as string[],
      createdBy: createdBy as string,
    });
  }

  private async handleCapabilitiesEvidenceList(params: Record<string, unknown>) {
    return this.getCapabilitiesService().listEvidence({
      domainId: params.domainId as any,
      taskId: params.taskId as string,
      runId: params.runId as string,
      limit: params.limit as number,
    });
  }

  private async handleCapabilitiesOverviewMetrics(params: Record<string, unknown>) {
    return this.getCapabilitiesService().getOverviewMetrics();
  }

  // ==================== AI Experts Config Handlers ====================

  private async handleAIExpertsConfigGet() {
    const config = await this.deps.jsonStore.get('ai-experts-config.json');
    
    // Return default config if not found
    if (!config) {
      return {
        roles: [
          { id: 'security-expert', enabled: true, providerId: '', model: '' },
          { id: 'privacy-officer', enabled: true, providerId: '', model: '' },
          { id: 'security-architect', enabled: true, providerId: '', model: '' },
          { id: 'business-security-officer', enabled: true, providerId: '', model: '' },
          { id: 'secuclaw-commander', enabled: true, providerId: '', model: '' },
          { id: 'ciso', enabled: true, providerId: '', model: '' },
          { id: 'security-ops', enabled: true, providerId: '', model: '' },
          { id: 'supply-chain-security', enabled: true, providerId: '', model: '' },
        ],
        updatedAt: Date.now(),
      };
    }
    return config;
  }

  private async handleAIExpertsConfigSave(params: Record<string, unknown>) {
    const { roles } = params;
    
    if (!Array.isArray(roles)) {
      throw new Error('roles must be an array');
    }
    
    const config = {
      roles,
      updatedAt: Date.now(),
    };
    
    await this.deps.jsonStore.set('ai-experts-config.json', config);
    return config;
  }
}

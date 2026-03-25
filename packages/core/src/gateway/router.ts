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

import { IncidentsService } from '../incidents/service.js';
import { VulnerabilitiesService } from '../vulnerabilities/service.js';
import { ThreatsService } from '../threats/service.js';
import { ComplianceService } from '../compliance/service.js';
import { AssetsService } from '../assets/service.js';
import { AIService } from '../ai/service.js';

interface RouterDeps {
  skillLoader: any;
  mitreLoader: any;
  scfLoader: any;
  jsonStore: any;
  capabilitiesService?: CapabilitiesService;
  incidentsService?: IncidentsService;
  vulnerabilitiesService?: VulnerabilitiesService;
  threatsService?: ThreatsService;
  complianceService?: ComplianceService;
  assetsService?: AssetsService;
  aiService?: AIService;
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

    // Incidents
    this.handlers.set('incidents.list', this.handleIncidentsList.bind(this));
    this.handlers.set('incidents.get', this.handleIncidentsGet.bind(this));
    this.handlers.set('incidents.create', this.handleIncidentsCreate.bind(this));
    this.handlers.set('incidents.update', this.handleIncidentsUpdate.bind(this));
    this.handlers.set('incidents.delete', this.handleIncidentsDelete.bind(this));
    this.handlers.set('incidents.updateStatus', this.handleIncidentsUpdateStatus.bind(this));
    this.handlers.set('incidents.stats', this.handleIncidentsStats.bind(this));

    // Vulnerabilities
    this.handlers.set('vulnerabilities.list', this.handleVulnerabilitiesList.bind(this));
    this.handlers.set('vulnerabilities.get', this.handleVulnerabilitiesGet.bind(this));
    this.handlers.set('vulnerabilities.updateStatus', this.handleVulnerabilitiesUpdateStatus.bind(this));
    this.handlers.set('vulnerabilities.assign', this.handleVulnerabilitiesAssign.bind(this));
    this.handlers.set('vulnerabilities.stats', this.handleVulnerabilitiesStats.bind(this));

    // Threats
    this.handlers.set('threats.list', this.handleThreatsList.bind(this));
    this.handlers.set('threats.get', this.handleThreatsGet.bind(this));
    this.handlers.set('threats.stats', this.handleThreatsStats.bind(this));
    this.handlers.set('threats.search', this.handleThreatsSearch.bind(this));

    // Compliance
    this.handlers.set('compliance.list', this.handleComplianceList.bind(this));
    this.handlers.set('compliance.get', this.handleComplianceGet.bind(this));
    this.handlers.set('compliance.stats', this.handleComplianceStats.bind(this));

    // Assets
    this.handlers.set('assets.list', this.handleAssetsList.bind(this));
    this.handlers.set('assets.get', this.handleAssetsGet.bind(this));
    this.handlers.set('assets.stats', this.handleAssetsStats.bind(this));

    // AI
    this.handlers.set('ai.insights', this.handleAIInsights.bind(this));
    this.handlers.set('ai.anomalies', this.handleAIAnomalies.bind(this));
    this.handlers.set('ai.trend', this.handleAITrend.bind(this));
    this.handlers.set('ai.recommendations', this.handleAIRecommendations.bind(this));
    this.handlers.set('ai.anomaly.acknowledge', this.handleAIAnomalyAcknowledge.bind(this));
    this.handlers.set('ai.anomaly.resolve', this.handleAIAnomalyResolve.bind(this));
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

  // ==================== Incidents Handlers ====================

  private getIncidentsService(): IncidentsService {
    if (!this.deps.incidentsService) {
      const { IncidentsRepository } = require('../incidents/repository.js');
      const repo = new IncidentsRepository(this.deps.jsonStore);
      this.deps.incidentsService = new IncidentsService(repo);
    }
    return this.deps.incidentsService;
  }

  private async handleIncidentsList(params: Record<string, unknown>) {
    return this.getIncidentsService().list({
      status: params.status as any,
      severity: params.severity as any,
      category: params.category as any,
      assignee: params.assignee as string,
      domainId: params.domainId as any,
      fromDate: params.fromDate as number,
      toDate: params.toDate as number,
      page: params.page as number,
      pageSize: params.pageSize as number,
    });
  }

  private async handleIncidentsGet(params: Record<string, unknown>) {
    const { id } = params;
    if (!id) throw new Error('Missing required parameter: id');
    return this.getIncidentsService().get(id as string);
  }

  private async handleIncidentsCreate(params: Record<string, unknown>) {
    return this.getIncidentsService().create({
      domainId: params.domainId as any,
      title: params.title as string,
      description: params.description as string,
      category: params.category as any,
      severity: params.severity as any,
      source: params.source as string,
      affectedAssets: params.affectedAssets as any,
      affectedUsers: params.affectedUsers as number,
      dataTypes: params.dataTypes as any,
      businessImpact: params.businessImpact as string,
      attackVector: params.attackVector as string,
      mitreTechniques: params.mitreTechniques as any,
    });
  }

  private async handleIncidentsUpdate(params: Record<string, unknown>) {
    const { id, ...data } = params;
    if (!id) throw new Error('Missing required parameter: id');
    return this.getIncidentsService().update(id as string, data);
  }

  private async handleIncidentsDelete(params: Record<string, unknown>) {
    const { id } = params;
    if (!id) throw new Error('Missing required parameter: id');
    return this.getIncidentsService().delete(id as string);
  }

  private async handleIncidentsUpdateStatus(params: Record<string, unknown>) {
    const { id, status, actor, note } = params;
    if (!id || !status) throw new Error('Missing required parameters: id, status');
    return this.getIncidentsService().updateStatus(
      id as string, 
      status as any, 
      actor as string, 
      note as string
    );
  }

  private async handleIncidentsStats() {
    return this.getIncidentsService().getStats();
  }

  // ==================== Vulnerabilities Handlers ====================

  private getVulnerabilitiesService(): VulnerabilitiesService {
    if (!this.deps.vulnerabilitiesService) {
      const { VulnerabilitiesRepository } = require('../vulnerabilities/repository.js');
      const repo = new VulnerabilitiesRepository(this.deps.jsonStore);
      this.deps.vulnerabilitiesService = new VulnerabilitiesService(repo);
    }
    return this.deps.vulnerabilitiesService;
  }

  private async handleVulnerabilitiesList(params: Record<string, unknown>) {
    return this.getVulnerabilitiesService().list({
      status: params.status as string,
      severity: params.severity as string,
      cveId: params.cveId as string,
      assetId: params.assetId as string,
      assignedTo: params.assignedTo as string,
      page: params.page as number,
      pageSize: params.pageSize as number,
    });
  }

  private async handleVulnerabilitiesGet(params: Record<string, unknown>) {
    const { id } = params;
    if (!id) throw new Error('Missing required parameter: id');
    return this.getVulnerabilitiesService().get(id as string);
  }

  private async handleVulnerabilitiesUpdateStatus(params: Record<string, unknown>) {
    const { id, status, assignedTo, user } = params;
    if (!id || !status) throw new Error('Missing required parameters: id, status');
    return this.getVulnerabilitiesService().updateRemediation(
      id as string, 
      status as any,
      assignedTo as string,
      user as string
    );
  }

  private async handleVulnerabilitiesAssign(params: Record<string, unknown>) {
    const { id, assignedTo, user } = params;
    if (!id || !assignedTo) throw new Error('Missing required parameters: id, assignedTo');
    return this.getVulnerabilitiesService().assign(id as string, assignedTo as string, user as string);
  }

  private async handleVulnerabilitiesStats() {
    return this.getVulnerabilitiesService().getStats();
  }

  // ==================== Threats Handlers ====================

  private getThreatsService(): ThreatsService {
    if (!this.deps.threatsService) {
      const { ThreatsRepository } = require('../threats/repository.js');
      const repo = new ThreatsRepository(this.deps.jsonStore);
      this.deps.threatsService = new ThreatsService(repo);
    }
    return this.deps.threatsService;
  }

  private async handleThreatsList(params: Record<string, unknown>) {
    return this.getThreatsService().list({
      type: params.type as string,
      motivation: params.motivation as string,
      target: params.target as string,
      page: params.page as number,
      pageSize: params.pageSize as number,
    });
  }

  private async handleThreatsGet(params: Record<string, unknown>) {
    const { id } = params;
    if (!id) throw new Error('Missing required parameter: id');
    return this.getThreatsService().get(id as string);
  }

  private async handleThreatsStats() {
    return this.getThreatsService().getStats();
  }

  private async handleThreatsSearch(params: Record<string, unknown>) {
    const { keyword } = params;
    if (!keyword) throw new Error('Missing required parameter: keyword');
    return this.getThreatsService().search(keyword as string);
  }

  // ==================== Compliance Handlers ====================

  private getComplianceService(): ComplianceService {
    if (!this.deps.complianceService) {
      const { ComplianceRepository } = require('../compliance/repository.js');
      const repo = new ComplianceRepository(this.deps.jsonStore);
      this.deps.complianceService = new ComplianceService(repo);
    }
    return this.deps.complianceService;
  }

  private async handleComplianceList(params: Record<string, unknown>) {
    return this.getComplianceService().list({
      jurisdiction: params.jurisdiction as string,
      page: params.page as number,
      pageSize: params.pageSize as number,
    });
  }

  private async handleComplianceGet(params: Record<string, unknown>) {
    const { id } = params;
    if (!id) throw new Error('Missing required parameter: id');
    return this.getComplianceService().get(id as string);
  }

  private async handleComplianceStats() {
    return this.getComplianceService().getStats();
  }

  // ==================== Assets Handlers ====================

  private getAssetsService(): AssetsService {
    if (!this.deps.assetsService) {
      const { AssetsRepository } = require('../assets/repository.js');
      const repo = new AssetsRepository(this.deps.jsonStore);
      this.deps.assetsService = new AssetsService(repo);
    }
    return this.deps.assetsService;
  }

  private async handleAssetsList(params: Record<string, unknown>) {
    return this.getAssetsService().list({
      type: params.type as string,
      category: params.category as string,
      environment: params.environment as string,
      criticality: params.criticality as string,
      status: params.status as string,
      owner: params.owner as string,
      department: params.department as string,
      page: params.page as number,
      pageSize: params.pageSize as number,
    });
  }

  private async handleAssetsGet(params: Record<string, unknown>) {
    const { id } = params;
    if (!id) throw new Error('Missing required parameter: id');
    return this.getAssetsService().get(id as string);
  }

  private async handleAssetsStats() {
    return this.getAssetsService().getStats();
  }

  // ==================== AI Handlers ====================

  private getAIService(): AIService {
    if (!this.deps.aiService) {
      this.deps.aiService = new AIService(this.deps.jsonStore);
    }
    return this.deps.aiService;
  }

  private async handleAIInsights(params: Record<string, unknown>) {
    const context = (params.context as string) || 'general';
    return this.getAIService().generateInsights(context, params.data);
  }

  private async handleAIAnomalies(params: Record<string, unknown>) {
    const context = (params.context as string) || 'general';
    return this.getAIService().detectAnomalies(context, params.data);
  }

  private async handleAITrend(params: Record<string, unknown>) {
    const metric = (params.metric as string) || 'risk-score';
    const timeframe = (params.timeframe as string) || '30d';
    return this.getAIService().predictTrend(metric, timeframe);
  }

  private async handleAIRecommendations(params: Record<string, unknown>) {
    const context = (params.context as string) || 'general';
    return this.getAIService().generateRecommendations(context, params.data);
  }

  private async handleAIAnomalyAcknowledge(params: Record<string, unknown>) {
    const { anomalyId, acknowledgedBy } = params;
    if (!anomalyId) throw new Error('Missing required parameter: anomalyId');
    return this.getAIService().acknowledgeAnomaly(
      anomalyId as string,
      (acknowledgedBy as string) || 'system'
    );
  }

  private async handleAIAnomalyResolve(params: Record<string, unknown>) {
    const { anomalyId } = params;
    if (!anomalyId) throw new Error('Missing required parameter: anomalyId');
    return this.getAIService().resolveAnomaly(anomalyId as string);
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

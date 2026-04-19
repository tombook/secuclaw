/**
 * SecuClaw Unified API Service
 *
 * Wraps all WebSocket request() calls into a typed, ergonomic API layer.
 * Every method maps to a backend handler registered in gateway/routes/*.
 */

import { useWebSocketStore } from '@/stores/websocket';

class ApiService {
  private get ws() {
    return useWebSocketStore.getState();
  }

  private async call<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    return this.ws.request<T>(method, params);
  }

  // ── Auth ──
  auth = {
    login: (username: string, password: string) =>
      this.call<{ token: string; user: { id: string; username: string; displayName: string; roleIds: string[] } }>(
        'auth.login', { username, password },
      ),
    logout: () => this.call('auth.logout'),
    getCurrentUser: () => this.call('auth.getCurrentUser'),
  };

  // ── Incidents ──
  incidents = {
    list: (params?: {
      status?: string;
      severity?: string;
      category?: string;
      assignee?: string;
      page?: number;
      pageSize?: number;
      sortBy?: string;
      sortOrder?: string;
    }) => this.call<{ data: any[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>('incidents.list', params),
    get: (id: string) => this.call<any>('incidents.get', { id }),
    create: (data: Record<string, unknown>) => this.call('incidents.create', data),
    update: (id: string, data: Record<string, unknown>) => this.call('incidents.update', { id, ...data }),
    updateStatus: (id: string, status: string, actor?: string, note?: string) =>
      this.call('incidents.updateStatus', { id, status, actor, note }),
    delete: (id: string) => this.call('incidents.delete', { id }),
    stats: () => this.call<any>('incidents.stats'),
    enums: () => this.call<any>('incidents.enums'),
  };

  // ── Vulnerabilities ──
  vulnerabilities = {
    list: (params?: {
      severity?: string;
      status?: string;
      cveId?: string;
      assignedTo?: string;
      page?: number;
      pageSize?: number;
      sortBy?: string;
      sortOrder?: string;
    }) => this.call<{ data: any[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>('vulnerabilities.list', params),
    get: (id: string) => this.call<any>('vulnerabilities.get', { id }),
    create: (data: Record<string, unknown>) => this.call('vulnerabilities.create', data),
    update: (id: string, data: Record<string, unknown>) => this.call('vulnerabilities.update', { id, ...data }),
    updateStatus: (id: string, status: string, actor?: string, note?: string) =>
      this.call('vulnerabilities.updateStatus', { id, status, actor, note }),
    assign: (id: string, assignedTo: string, user?: string) =>
      this.call('vulnerabilities.assign', { id, assignedTo, user }),
    delete: (id: string) => this.call('vulnerabilities.delete', { id }),
    stats: () => this.call<any>('vulnerabilities.stats'),
    enums: () => this.call<any>('vulnerabilities.enums'),
    batchImport: (items: any[]) => this.call('vulnerabilities.batchImport', { items }),
    batchUpdateStatus: (ids: string[], status: string, user?: string) =>
      this.call('vulnerabilities.batchUpdateStatus', { ids, status, user }),
  };

  // ── Tasks ──
  tasks = {
    list: (params?: {
      status?: string;
      type?: string;
      urgency?: string;
      ownerId?: string;
      assigneeId?: string;
      approvalStatus?: string;
      page?: number;
      pageSize?: number;
    }) => this.call<{ data: any[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>('tasks.list', params),
    get: (id: string) => this.call<any>('tasks.get', { id }),
    create: (data: Record<string, unknown>) => this.call('tasks.create', data),
    update: (id: string, data: Record<string, unknown>) => this.call('tasks.update', { id, ...data }),
    updateStatus: (id: string, status: string, userId?: string) =>
      this.call('tasks.updateStatus', { id, status, userId }),
    approve: (id: string, approved: boolean, approverId: string, note?: string) =>
      this.call('tasks.approve', { id, approved, approverId, note }),
    delete: (id: string) => this.call('tasks.delete', { id }),
    stats: () => this.call<any>('tasks.stats'),
    enums: () => this.call<any>('tasks.enums'),
  };

  // ── Skills ──
  skills = {
    list: () => this.call<any[]>('skills.list'),
    get: (roleId: string) => this.call<any>('skills.get', { roleId }),
    getStates: (commanderId: string) => this.call('skills.getStates', { commanderId }),
    install: (commanderId: string, roleId: string, version?: string) =>
      this.call('skills.install', { commanderId, roleId, version }),
    uninstall: (commanderId: string, roleId: string) =>
      this.call('skills.uninstall', { commanderId, roleId }),
    activate: (commanderId: string, roleId: string) =>
      this.call('skills.activate', { commanderId, roleId }),
    deactivate: (commanderId: string, roleId: string) =>
      this.call('skills.deactivate', { commanderId, roleId }),
  };

  // ── Knowledge ──
  knowledge = {
    mitreStats: () => this.call<any>('knowledge.mitre.stats'),
    mitreTactics: () => this.call<any[]>('knowledge.mitre.tactics'),
    mitreTechniques: (params?: { tacticId?: string }) =>
      this.call<any[]>('knowledge.mitre.techniques', params),
    mitreSearch: (query: string, type?: 'technique' | 'tactic' | 'all') =>
      this.call('knowledge.mitre.search', { query, type }),
    scfStats: () => this.call<any>('knowledge.scf.stats'),
    scfDomains: () => this.call<any[]>('knowledge.scf.domains'),
    scfControls: (params?: { domainId?: string }) =>
      this.call<any[]>('knowledge.scf.controls', params),
    scfSearch: (query: string) => this.call('knowledge.scf.search', { query }),
  };

  // ── Commander ──
  commander = {
    get: (id: string) => this.call<any>('commander.get', { id }),
    create: (data: Record<string, unknown>) => this.call('commander.create', data),
    update: (id: string, updates: Record<string, unknown>) => this.call('commander.update', { id, updates }),
    activateRole: (commanderId: string, roleId: string) =>
      this.call('commander.activateRole', { commanderId, roleId }),
    deactivateRole: (commanderId: string, roleId: string) =>
      this.call('commander.deactivateRole', { commanderId, roleId }),
    bindLLM: (commanderId: string, roleId: string, binding: Record<string, unknown>) =>
      this.call('commander.bindLLM', { commanderId, roleId, binding }),
    delete: (id: string) => this.call('commander.delete', { id }),
  };

  // ── LLM ──
  llm = {
    listProviders: () => this.call<any[]>('llm.providers.list'),
    addProvider: (data: Record<string, unknown>) => this.call('llm.providers.add', data),
    updateProvider: (id: string, updates: Record<string, unknown>) =>
      this.call('llm.providers.update', { id, updates }),
    deleteProvider: (id: string) => this.call('llm.providers.delete', { id }),
    chat: (params: { providerId: string; model: string; messages: any[]; temperature?: number; maxTokens?: number }) =>
      this.call('llm.chat', params),
    chatParallel: (params: { messages: any[]; providerIds?: string[]; model?: string; temperature?: number; maxTokens?: number }) =>
      this.call('llm.chat.parallel', params),
    chatCollaborative: (params: { prompt: string; systemPrompt?: string }) =>
      this.call('llm.chat.collaborative', params),
  };

  // ── AI ──
  ai = {
    chat: (params: { message: string; pageId?: string; pageTitle?: string; roleId?: string; forceRefresh?: boolean }) =>
      this.call<any>('ai.chat', params),
    insights: (params?: { pageId?: string }) => this.call<any>('ai.insights', params),
    anomalies: () => this.call('ai.anomalies'),
    trend: (params?: { metric?: string; timeframe?: string }) => this.call<any>('ai.trend', params),
    recommendations: (params?: { pageId?: string }) => this.call<any>('ai.recommendations', params),
    executeAction: (actionId: string) => this.call('ai.action.execute', { actionId: actionId }),
  };

  // ── Channels ──
  channels = {
    status: () => this.call('channels.status'),
    configure: (channelId: string, config: Record<string, unknown>) =>
      this.call('channels.configure', { channelId, config }),
    send: (channelId: string, message: string, params?: { priority?: string; recipients?: string[] }) =>
      this.call('channels.send', { channelId, message, ...params }),
    enable: (channelId: string) => this.call('channels.enable', { channelId }),
    disable: (channelId: string) => this.call('channels.disable', { channelId }),
  };

  // ── KPI ──
  kpi = {
    calculate: () => this.call<any>('kpi.calculate'),
    summary: () => this.call<any>('kpi.summary'),
  };

  // ── Risk ──
  risk = {
    list: (params?: { category?: string; status?: string; riskLevel?: string; limit?: number; offset?: number }) =>
      this.call<{ data: any[] }>('risk.list', params),
    get: (factorId: string) => this.call('risk.getFactor', { factorId }),
    createFactor: (data: Record<string, unknown>) => this.call('risk.createFactor', data),
    updateFactor: (factorId: string, updates: Record<string, unknown>) =>
      this.call('risk.updateFactor', { factorId, ...updates }),
    deleteFactor: (factorId: string) => this.call('risk.deleteFactor', { factorId }),
    getMetrics: () => this.call('risk.getMetrics'),
    history: (days?: number) => this.call('risk.history', { days }),
    predict: (days?: number) => this.call('risk.predict', { days }),
    listPredictions: () => this.call('risk.listPredictions'),
  };

  // ── Reports ──
  reports = {
    list: (params?: { type?: string; limit?: number; offset?: number }) =>
      this.call<{ data: any[] }>('reports.list', params),
    get: (reportId: string) => this.call('reports.get', { reportId }),
    listTemplates: () => this.call<{ data: any[] }>('reports.listTemplates'),
    generate: (params: { templateId: string; reportData: Record<string, unknown>; format: string; generatedBy: string }) =>
      this.call('reports.generate', params),
    delete: (reportId: string) => this.call('reports.delete', { reportId }),
  };

  // ── Events (subscribe) ──
  subscribe(event: string, handler: (data: unknown) => void) {
    return this.ws.subscribe(event, handler);
  }
}

export const api = new ApiService();

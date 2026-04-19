/**
 * SecuClaw Unified API Service
 *
 * Wraps all WebSocket request() calls into a typed, ergonomic API layer.
 * Every method maps to a backend handler registered in gateway/routes/*.
 */
import { useWebSocketStore } from '@/stores/websocket';
class ApiService {
    get ws() {
        return useWebSocketStore.getState();
    }
    async call(method, params) {
        return this.ws.request(method, params);
    }
    // ── Auth ──
    auth = {
        login: (username, password) => this.call('auth.login', { username, password }),
        logout: () => this.call('auth.logout'),
        getCurrentUser: () => this.call('auth.getCurrentUser'),
    };
    // ── Incidents ──
    incidents = {
        list: (params) => this.call('incidents.list', params),
        get: (id) => this.call('incidents.get', { id }),
        create: (data) => this.call('incidents.create', data),
        update: (id, data) => this.call('incidents.update', { id, ...data }),
        updateStatus: (id, status, actor, note) => this.call('incidents.updateStatus', { id, status, actor, note }),
        delete: (id) => this.call('incidents.delete', { id }),
        stats: () => this.call('incidents.stats'),
        enums: () => this.call('incidents.enums'),
    };
    // ── Vulnerabilities ──
    vulnerabilities = {
        list: (params) => this.call('vulnerabilities.list', params),
        get: (id) => this.call('vulnerabilities.get', { id }),
        create: (data) => this.call('vulnerabilities.create', data),
        update: (id, data) => this.call('vulnerabilities.update', { id, ...data }),
        updateStatus: (id, status, actor, note) => this.call('vulnerabilities.updateStatus', { id, status, actor, note }),
        assign: (id, assignedTo, user) => this.call('vulnerabilities.assign', { id, assignedTo, user }),
        delete: (id) => this.call('vulnerabilities.delete', { id }),
        stats: () => this.call('vulnerabilities.stats'),
        enums: () => this.call('vulnerabilities.enums'),
        batchImport: (items) => this.call('vulnerabilities.batchImport', { items }),
        batchUpdateStatus: (ids, status, user) => this.call('vulnerabilities.batchUpdateStatus', { ids, status, user }),
    };
    // ── Tasks ──
    tasks = {
        list: (params) => this.call('tasks.list', params),
        get: (id) => this.call('tasks.get', { id }),
        create: (data) => this.call('tasks.create', data),
        update: (id, data) => this.call('tasks.update', { id, ...data }),
        updateStatus: (id, status, userId) => this.call('tasks.updateStatus', { id, status, userId }),
        approve: (id, approved, approverId, note) => this.call('tasks.approve', { id, approved, approverId, note }),
        delete: (id) => this.call('tasks.delete', { id }),
        stats: () => this.call('tasks.stats'),
        enums: () => this.call('tasks.enums'),
    };
    // ── Skills ──
    skills = {
        list: () => this.call('skills.list'),
        get: (roleId) => this.call('skills.get', { roleId }),
        getStates: (commanderId) => this.call('skills.getStates', { commanderId }),
        install: (commanderId, roleId, version) => this.call('skills.install', { commanderId, roleId, version }),
        uninstall: (commanderId, roleId) => this.call('skills.uninstall', { commanderId, roleId }),
        activate: (commanderId, roleId) => this.call('skills.activate', { commanderId, roleId }),
        deactivate: (commanderId, roleId) => this.call('skills.deactivate', { commanderId, roleId }),
    };
    // ── Knowledge ──
    knowledge = {
        mitreStats: () => this.call('knowledge.mitre.stats'),
        mitreTactics: () => this.call('knowledge.mitre.tactics'),
        mitreTechniques: (params) => this.call('knowledge.mitre.techniques', params),
        mitreSearch: (query, type) => this.call('knowledge.mitre.search', { query, type }),
        scfStats: () => this.call('knowledge.scf.stats'),
        scfDomains: () => this.call('knowledge.scf.domains'),
        scfControls: (params) => this.call('knowledge.scf.controls', params),
        scfSearch: (query) => this.call('knowledge.scf.search', { query }),
    };
    // ── Commander ──
    commander = {
        get: (id) => this.call('commander.get', { id }),
        create: (data) => this.call('commander.create', data),
        update: (id, updates) => this.call('commander.update', { id, updates }),
        activateRole: (commanderId, roleId) => this.call('commander.activateRole', { commanderId, roleId }),
        deactivateRole: (commanderId, roleId) => this.call('commander.deactivateRole', { commanderId, roleId }),
        bindLLM: (commanderId, roleId, binding) => this.call('commander.bindLLM', { commanderId, roleId, binding }),
        delete: (id) => this.call('commander.delete', { id }),
    };
    // ── LLM ──
    llm = {
        listProviders: () => this.call('llm.providers.list'),
        addProvider: (data) => this.call('llm.providers.add', data),
        updateProvider: (id, updates) => this.call('llm.providers.update', { id, updates }),
        deleteProvider: (id) => this.call('llm.providers.delete', { id }),
        chat: (params) => this.call('llm.chat', params),
        chatParallel: (params) => this.call('llm.chat.parallel', params),
        chatCollaborative: (params) => this.call('llm.chat.collaborative', params),
    };
    // ── AI ──
    ai = {
        chat: (params) => this.call('ai.chat', params),
        insights: (params) => this.call('ai.insights', params),
        anomalies: () => this.call('ai.anomalies'),
        trend: (params) => this.call('ai.trend', params),
        recommendations: (params) => this.call('ai.recommendations', params),
        executeAction: (actionId) => this.call('ai.action.execute', { actionId: actionId }),
    };
    // ── Channels ──
    channels = {
        status: () => this.call('channels.status'),
        configure: (channelId, config) => this.call('channels.configure', { channelId, config }),
        send: (channelId, message, params) => this.call('channels.send', { channelId, message, ...params }),
        enable: (channelId) => this.call('channels.enable', { channelId }),
        disable: (channelId) => this.call('channels.disable', { channelId }),
    };
    // ── KPI ──
    kpi = {
        calculate: () => this.call('kpi.calculate'),
        summary: () => this.call('kpi.summary'),
    };
    // ── Risk ──
    risk = {
        list: (params) => this.call('risk.list', params),
        get: (factorId) => this.call('risk.getFactor', { factorId }),
        createFactor: (data) => this.call('risk.createFactor', data),
        updateFactor: (factorId, updates) => this.call('risk.updateFactor', { factorId, ...updates }),
        deleteFactor: (factorId) => this.call('risk.deleteFactor', { factorId }),
        getMetrics: () => this.call('risk.getMetrics'),
        history: (days) => this.call('risk.history', { days }),
        predict: (days) => this.call('risk.predict', { days }),
        listPredictions: () => this.call('risk.listPredictions'),
    };
    // ── Reports ──
    reports = {
        list: (params) => this.call('reports.list', params),
        get: (reportId) => this.call('reports.get', { reportId }),
        listTemplates: () => this.call('reports.listTemplates'),
        generate: (params) => this.call('reports.generate', params),
        delete: (reportId) => this.call('reports.delete', { reportId }),
    };
    // ── Events (subscribe) ──
    subscribe(event, handler) {
        return this.ws.subscribe(event, handler);
    }
}
export const api = new ApiService();
//# sourceMappingURL=api.js.map
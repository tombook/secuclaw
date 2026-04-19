/**
 * SecuClaw Unified API Service
 *
 * Wraps all WebSocket request() calls into a typed, ergonomic API layer.
 * Every method maps to a backend handler registered in gateway/routes/*.
 */
declare class ApiService {
    private get ws();
    private call;
    auth: {
        login: (username: string, password: string) => Promise<{
            token: string;
            user: {
                id: string;
                username: string;
                displayName: string;
                roleIds: string[];
            };
        }>;
        logout: () => Promise<unknown>;
        getCurrentUser: () => Promise<unknown>;
    };
    incidents: {
        list: (params?: {
            status?: string;
            severity?: string;
            category?: string;
            assignee?: string;
            page?: number;
            pageSize?: number;
            sortBy?: string;
            sortOrder?: string;
        }) => Promise<{
            data: any[];
            pagination: {
                page: number;
                pageSize: number;
                total: number;
                totalPages: number;
            };
        }>;
        get: (id: string) => Promise<any>;
        create: (data: Record<string, unknown>) => Promise<unknown>;
        update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
        updateStatus: (id: string, status: string, actor?: string, note?: string) => Promise<unknown>;
        delete: (id: string) => Promise<unknown>;
        stats: () => Promise<any>;
        enums: () => Promise<any>;
    };
    vulnerabilities: {
        list: (params?: {
            severity?: string;
            status?: string;
            cveId?: string;
            assignedTo?: string;
            page?: number;
            pageSize?: number;
            sortBy?: string;
            sortOrder?: string;
        }) => Promise<{
            data: any[];
            pagination: {
                page: number;
                pageSize: number;
                total: number;
                totalPages: number;
            };
        }>;
        get: (id: string) => Promise<any>;
        create: (data: Record<string, unknown>) => Promise<unknown>;
        update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
        updateStatus: (id: string, status: string, actor?: string, note?: string) => Promise<unknown>;
        assign: (id: string, assignedTo: string, user?: string) => Promise<unknown>;
        delete: (id: string) => Promise<unknown>;
        stats: () => Promise<any>;
        enums: () => Promise<any>;
        batchImport: (items: any[]) => Promise<unknown>;
        batchUpdateStatus: (ids: string[], status: string, user?: string) => Promise<unknown>;
    };
    tasks: {
        list: (params?: {
            status?: string;
            type?: string;
            urgency?: string;
            ownerId?: string;
            assigneeId?: string;
            approvalStatus?: string;
            page?: number;
            pageSize?: number;
        }) => Promise<{
            data: any[];
            pagination: {
                page: number;
                pageSize: number;
                total: number;
                totalPages: number;
            };
        }>;
        get: (id: string) => Promise<any>;
        create: (data: Record<string, unknown>) => Promise<unknown>;
        update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
        updateStatus: (id: string, status: string, userId?: string) => Promise<unknown>;
        approve: (id: string, approved: boolean, approverId: string, note?: string) => Promise<unknown>;
        delete: (id: string) => Promise<unknown>;
        stats: () => Promise<any>;
        enums: () => Promise<any>;
    };
    skills: {
        list: () => Promise<any[]>;
        get: (roleId: string) => Promise<any>;
        getStates: (commanderId: string) => Promise<unknown>;
        install: (commanderId: string, roleId: string, version?: string) => Promise<unknown>;
        uninstall: (commanderId: string, roleId: string) => Promise<unknown>;
        activate: (commanderId: string, roleId: string) => Promise<unknown>;
        deactivate: (commanderId: string, roleId: string) => Promise<unknown>;
    };
    knowledge: {
        mitreStats: () => Promise<any>;
        mitreTactics: () => Promise<any[]>;
        mitreTechniques: (params?: {
            tacticId?: string;
        }) => Promise<any[]>;
        mitreSearch: (query: string, type?: "technique" | "tactic" | "all") => Promise<unknown>;
        scfStats: () => Promise<any>;
        scfDomains: () => Promise<any[]>;
        scfControls: (params?: {
            domainId?: string;
        }) => Promise<any[]>;
        scfSearch: (query: string) => Promise<unknown>;
    };
    commander: {
        get: (id: string) => Promise<any>;
        create: (data: Record<string, unknown>) => Promise<unknown>;
        update: (id: string, updates: Record<string, unknown>) => Promise<unknown>;
        activateRole: (commanderId: string, roleId: string) => Promise<unknown>;
        deactivateRole: (commanderId: string, roleId: string) => Promise<unknown>;
        bindLLM: (commanderId: string, roleId: string, binding: Record<string, unknown>) => Promise<unknown>;
        delete: (id: string) => Promise<unknown>;
    };
    llm: {
        listProviders: () => Promise<any[]>;
        addProvider: (data: Record<string, unknown>) => Promise<unknown>;
        updateProvider: (id: string, updates: Record<string, unknown>) => Promise<unknown>;
        deleteProvider: (id: string) => Promise<unknown>;
        chat: (params: {
            providerId: string;
            model: string;
            messages: any[];
            temperature?: number;
            maxTokens?: number;
        }) => Promise<unknown>;
        chatParallel: (params: {
            messages: any[];
            providerIds?: string[];
            model?: string;
            temperature?: number;
            maxTokens?: number;
        }) => Promise<unknown>;
        chatCollaborative: (params: {
            prompt: string;
            systemPrompt?: string;
        }) => Promise<unknown>;
    };
    ai: {
        chat: (params: {
            message: string;
            pageId?: string;
            pageTitle?: string;
            roleId?: string;
            forceRefresh?: boolean;
        }) => Promise<any>;
        insights: (params?: {
            pageId?: string;
        }) => Promise<any>;
        anomalies: () => Promise<unknown>;
        trend: (params?: {
            metric?: string;
            timeframe?: string;
        }) => Promise<any>;
        recommendations: (params?: {
            pageId?: string;
        }) => Promise<any>;
        executeAction: (actionId: string) => Promise<unknown>;
    };
    channels: {
        status: () => Promise<unknown>;
        configure: (channelId: string, config: Record<string, unknown>) => Promise<unknown>;
        send: (channelId: string, message: string, params?: {
            priority?: string;
            recipients?: string[];
        }) => Promise<unknown>;
        enable: (channelId: string) => Promise<unknown>;
        disable: (channelId: string) => Promise<unknown>;
    };
    kpi: {
        calculate: () => Promise<any>;
        summary: () => Promise<any>;
    };
    risk: {
        list: (params?: {
            category?: string;
            status?: string;
            riskLevel?: string;
            limit?: number;
            offset?: number;
        }) => Promise<{
            data: any[];
        }>;
        get: (factorId: string) => Promise<unknown>;
        createFactor: (data: Record<string, unknown>) => Promise<unknown>;
        updateFactor: (factorId: string, updates: Record<string, unknown>) => Promise<unknown>;
        deleteFactor: (factorId: string) => Promise<unknown>;
        getMetrics: () => Promise<unknown>;
        history: (days?: number) => Promise<unknown>;
        predict: (days?: number) => Promise<unknown>;
        listPredictions: () => Promise<unknown>;
    };
    reports: {
        list: (params?: {
            type?: string;
            limit?: number;
            offset?: number;
        }) => Promise<{
            data: any[];
        }>;
        get: (reportId: string) => Promise<unknown>;
        listTemplates: () => Promise<{
            data: any[];
        }>;
        generate: (params: {
            templateId: string;
            reportData: Record<string, unknown>;
            format: string;
            generatedBy: string;
        }) => Promise<unknown>;
        delete: (reportId: string) => Promise<unknown>;
    };
    subscribe(event: string, handler: (data: unknown) => void): () => void;
}
export declare const api: ApiService;
export {};
//# sourceMappingURL=api.d.ts.map
/**
 * SecuClaw React Hooks for API data fetching
 *
 * Provides reusable hooks with loading/error states and auto-refetch.
 */
import { api } from '@/services/api';
export declare function useApiCall<T>(fetcher: () => Promise<T>, deps?: unknown[]): {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
};
export declare const useIncidents: (params?: Parameters<typeof api.incidents.list>[0]) => {
    data: {
        data: any[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
};
export declare const useIncidentStats: () => {
    data: any;
    loading: boolean;
    error: string | null;
    refetch: () => void;
};
export declare const useVulnerabilities: (params?: Parameters<typeof api.vulnerabilities.list>[0]) => {
    data: {
        data: any[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
};
export declare const useVulnStats: () => {
    data: any;
    loading: boolean;
    error: string | null;
    refetch: () => void;
};
export declare const useTasks: (params?: Parameters<typeof api.tasks.list>[0]) => {
    data: {
        data: any[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
};
export declare const useSkills: () => {
    data: any[] | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
};
export declare const useChannels: () => {
    data: unknown;
    loading: boolean;
    error: string | null;
    refetch: () => void;
};
export declare const useLlmProviders: () => {
    data: any[] | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
};
export declare const useCommander: (id?: string) => {
    data: any;
    loading: boolean;
    error: string | null;
    refetch: () => void;
};
export declare const useKpiSummary: () => {
    data: any;
    loading: boolean;
    error: string | null;
    refetch: () => void;
};
export declare const useRiskMetrics: () => {
    data: unknown;
    loading: boolean;
    error: string | null;
    refetch: () => void;
};
export declare const useRiskHistory: (days?: number) => {
    data: unknown;
    loading: boolean;
    error: string | null;
    refetch: () => void;
};
export declare const useReports: (params?: Parameters<typeof api.reports.list>[0]) => {
    data: {
        data: any[];
    } | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
};
export declare const useKnowledgeMitre: () => {
    data: {
        stats: any;
        tactics: any[];
    } | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
};
export declare const useKnowledgeScf: () => {
    data: {
        stats: any;
        domains: any[];
    } | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
};
export declare const useAiInsights: (pageId?: string) => {
    data: any;
    loading: boolean;
    error: string | null;
    refetch: () => void;
};
export declare const useAiRecommendations: (pageId?: string) => {
    data: any;
    loading: boolean;
    error: string | null;
    refetch: () => void;
};
//# sourceMappingURL=useApi.d.ts.map
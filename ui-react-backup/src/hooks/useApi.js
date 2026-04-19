/**
 * SecuClaw React Hooks for API data fetching
 *
 * Provides reusable hooks with loading/error states and auto-refetch.
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
// ── Generic Data Fetching Hook ──
export function useApiCall(fetcher, deps = []) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        fetcher()
            .then((result) => { if (!cancelled)
            setData(result); })
            .catch((err) => { if (!cancelled)
            setError(err.message || String(err)); })
            .finally(() => { if (!cancelled)
            setLoading(false); });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
    const refetch = useCallback(() => {
        setLoading(true);
        setError(null);
        fetcher()
            .then(setData)
            .catch((err) => setError(err.message || String(err)))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
    return { data, loading, error, refetch };
}
// ── Pre-built Hooks for Common Data ──
export const useIncidents = (params) => useApiCall(() => api.incidents.list(params), [JSON.stringify(params)]);
export const useIncidentStats = () => useApiCall(() => api.incidents.stats(), []);
export const useVulnerabilities = (params) => useApiCall(() => api.vulnerabilities.list(params), [JSON.stringify(params)]);
export const useVulnStats = () => useApiCall(() => api.vulnerabilities.stats(), []);
export const useTasks = (params) => useApiCall(() => api.tasks.list(params), [JSON.stringify(params)]);
export const useSkills = () => useApiCall(() => api.skills.list(), []);
export const useChannels = () => useApiCall(() => api.channels.status(), []);
export const useLlmProviders = () => useApiCall(() => api.llm.listProviders(), []);
export const useCommander = (id = 'default') => useApiCall(() => api.commander.get(id), [id]);
export const useKpiSummary = () => useApiCall(() => api.kpi.summary(), []);
export const useRiskMetrics = () => useApiCall(() => api.risk.getMetrics(), []);
export const useRiskHistory = (days = 30) => useApiCall(() => api.risk.history(days), [days]);
export const useReports = (params) => useApiCall(() => api.reports.list(params), [JSON.stringify(params)]);
// ── Knowledge Hooks ──
export const useKnowledgeMitre = () => useApiCall(async () => {
    const [stats, tactics] = await Promise.all([
        api.knowledge.mitreStats(),
        api.knowledge.mitreTactics(),
    ]);
    return { stats, tactics };
}, []);
export const useKnowledgeScf = () => useApiCall(async () => {
    const [stats, domains] = await Promise.all([
        api.knowledge.scfStats(),
        api.knowledge.scfDomains(),
    ]);
    return { stats, domains };
}, []);
// ── AI Hooks ──
export const useAiInsights = (pageId) => useApiCall(() => api.ai.insights({ pageId }), [pageId]);
export const useAiRecommendations = (pageId) => useApiCall(() => api.ai.recommendations({ pageId }), [pageId]);
//# sourceMappingURL=useApi.js.map
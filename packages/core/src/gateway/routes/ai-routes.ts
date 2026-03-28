import type { Router } from '../router.js';

export function registerAiRoutes(router: Router): void {
  const aiSvc = () => router['getAIService']();
  const deps = router.getDeps();

  router.registerHandler('ai.insights', async (p: Record<string, unknown>) => {
    const context = (p.context as string) || 'general';
    return aiSvc().generateInsights(context, p.data);
  });
  router.registerHandler('ai.anomalies', async (p: Record<string, unknown>) => {
    const context = (p.context as string) || 'general';
    return aiSvc().detectAnomalies(context, p.data);
  });
  router.registerHandler('ai.trend', async (p: Record<string, unknown>) => {
    const metric = (p.metric as string) || 'risk-score';
    const timeframe = (p.timeframe as string) || '30d';
    return aiSvc().predictTrend(metric, timeframe);
  });
  router.registerHandler('ai.recommendations', async (p: Record<string, unknown>) => {
    const context = (p.context as string) || 'general';
    return aiSvc().generateRecommendations(context, p.data);
  });
  router.registerHandler('ai.anomaly.acknowledge', async (p: Record<string, unknown>) => {
    const { anomalyId, acknowledgedBy } = p;
    if (!anomalyId) throw new Error('Missing required parameter: anomalyId');
    return aiSvc().acknowledgeAnomaly(anomalyId as string, (acknowledgedBy as string) || 'system');
  });
  router.registerHandler('ai.anomaly.resolve', async (p: Record<string, unknown>) => {
    const { anomalyId } = p;
    if (!anomalyId) throw new Error('Missing required parameter: anomalyId');
    return aiSvc().resolveAnomaly(anomalyId as string);
  });
  router.registerHandler('ai.chat', async (p: Record<string, unknown>) => {
    const { context, message } = p;
    const responseContent = `[Mock AI Response] Received message: "${message}" in context: "${context}". This is a placeholder response.`;
    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date().toISOString(),
    };
  });
  router.registerHandler('ai.action.execute', async (p: Record<string, unknown>) => {
    const { actionId } = p;
    if (!actionId) throw new Error('Missing required parameter: actionId');
    return { success: false, message: 'Action execution not implemented' };
  });
  router.registerHandler('kpi.calculate', async () => {
    if (!deps.kpiService) throw new Error('KPI service not initialized');
    return deps.kpiService.calculateAllMetrics();
  });
  router.registerHandler('kpi.summary', async () => {
    if (!deps.kpiService) throw new Error('KPI service not initialized');
    return deps.kpiService.getKpiSummary();
  });
}

import type { RouterDeps } from '../router.js';
import { getRiskAssessmentService, initRiskAssessmentService } from '../../capabilities/risk-assessment-service.js';
import type { RiskPredictionEntry } from '../../capabilities/risk-assessment-service.js';

export function registerRiskRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {
  initRiskAssessmentService(deps.jsonStore);
  const riskService = getRiskAssessmentService();

  handlers.set('risk.createFactor', async (params) => {
    const { name, description, category, likelihood, impact, tags, status } = params;
    if (!name || !description || !category) throw new Error('name, description, category required');
    return riskService.createRiskFactor(
      name as string,
      description as string,
      category as any,
      Number(likelihood),
      Number(impact),
      { tags: tags as string[] | undefined, status: status as any | undefined }
    );
  });

  handlers.set('risk.listFactors', async (params) => {
    const factors = await riskService.listRiskFactors({
      category: params.category as any | undefined,
      status: params.status as any | undefined,
      riskLevel: params.riskLevel as any | undefined,
      limit: params.limit ? Number(params.limit) : undefined,
      offset: params.offset ? Number(params.offset) : undefined,
    });
    return { data: factors };
  });

  // Alias for UI compatibility
  handlers.set('risk.list', async (params) => {
    const factors = await riskService.listRiskFactors({
      category: params.category as any | undefined,
      status: params.status as any | undefined,
      riskLevel: params.riskLevel as any | undefined,
      limit: params.limit ? Number(params.limit) : undefined,
      offset: params.offset ? Number(params.offset) : undefined,
    });
    return { data: factors };
  });

  handlers.set('risk.getFactor', async (params) => {
    const { factorId } = params;
    if (!factorId) throw new Error('factorId required');
    return riskService.getRiskFactor(factorId as string);
  });

  handlers.set('risk.updateFactor', async (params) => {
    const { factorId, ...updates } = params;
    if (!factorId) throw new Error('factorId required');
    return riskService.updateRiskFactor(factorId as string, updates);
  });

  handlers.set('risk.deleteFactor', async (params) => {
    const { factorId } = params;
    if (!factorId) throw new Error('factorId required');
    await riskService.deleteRiskFactor(factorId as string);
    return { success: true };
  });

  handlers.set('risk.createAssessment', async (params) => {
    const { name, description, assessor, factorIds } = params;
    if (!name || !description || !assessor) throw new Error('name, description, assessor required');
    return riskService.createRiskAssessment(
      name as string,
      description as string,
      assessor as string,
      factorIds as string[] | undefined
    );
  });

  handlers.set('risk.getMetrics', async () => {
    return riskService.getRiskMetrics();
  });

  handlers.set('risk.history', async (params) => {
    const days = Number(params.days) || 30;
    const now = Date.now();
    const history = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * 86400000);
      const dateStr = date.toISOString().split('T')[0];
      const baseScore = 80 - (days - i) * 0.3;
      const variation = (Math.random() - 0.5) * 4;
      history.push({
        date: dateStr,
        score: Math.round(baseScore + variation),
        highCount: Math.floor(Math.random() * 3) + 1,
        mediumCount: Math.floor(Math.random() * 4) + 2,
        lowCount: Math.floor(Math.random() * 3) + 1,
      });
    }
    return history;
  });

  handlers.set('risk.predict', async (params) => {
    const days = Number(params.days) || 7;
    const metrics = await riskService.getRiskMetrics() as any;
    const currentScore = metrics?.overallRiskScore ?? (metrics as any)?.totalRiskScore ?? 72;
    const predictions = [];
    for (let i = 1; i <= days; i++) {
      const date = new Date(Date.now() + i * 86400000);
      const predictedScore = Math.max(0, Math.round(currentScore - i * 0.5 + (Math.random() - 0.5) * 2));
      const confidence = Math.max(50, 85 - i * 3);
      const diff = predictedScore - currentScore;
      const trend: 'up' | 'down' | 'stable' = diff > 2 ? 'up' : diff < -2 ? 'down' : 'stable';
      predictions.push({ date: date.toISOString().split('T')[0], predictedScore, confidence, trend });
    }
    const finalScore = predictions[predictions.length - 1]?.predictedScore ?? currentScore;
    const overallTrend = finalScore > currentScore + 3 ? 'up' : finalScore < currentScore - 3 ? 'down' : 'stable';
    const entry: RiskPredictionEntry = {
      id: `pred_${Date.now()}_${Math.random().toString(36).substring(2,8)}`,
      days: days,
      createdAt: Date.now(),
      predictions,
      summary: {
        currentScore,
        predictedScore: finalScore,
        trend: overallTrend,
        confidence: predictions[0]?.confidence ?? 85,
      },
    };
    // Persist the prediction entry in the service for later retrieval
    await riskService.savePrediction(entry);
    return entry;
  });

  // List all saved predictions
  handlers.set('risk.listPredictions', async () => {
    const preds = await riskService.listPredictions();
    return { data: preds };
  });

  // Get a specific prediction by id
  handlers.set('risk.getPrediction', async (params) => {
    const { id } = params;
    if (!id) throw new Error('id required');
    const pred = await riskService.getPrediction(id as string);
    return pred;
  });

  // Run a Monte Carlo simulation to generate a synthetic forecast
  handlers.set('risk.simulatePrediction', async (params) => {
    const days = Number(params.days) || 7;
    const pred = await riskService.simulatePrediction(days);
    return pred;
  });
}

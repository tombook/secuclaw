import { AISPMService } from '../../ai-spm/ai-spm-service.js';
import type { JsonStore } from '../../storage/json-store.js';
import type { RouterDeps } from '../router.js';


const logger = {
  info: (...args: any[]) => console.log('[AI-SPM]', ...args),
  error: (...args: any[]) => console.error('[AI-SPM]', ...args),
};

export function registerAiSpmRoutes(handlers: Map<string, Function>, deps: RouterDeps): void {
  const store = (deps as any).jsonStore ?? (deps as any).store;
  const service = new AISPMService(store);

  handlers.set('ai-spm.models.register', async (params: Record<string, unknown>) => {
    const result = await service.registerModel({
      name: params.name as string,
      provider: params.provider as string,
      modelId: params.modelId as string,
      version: params.version as string,
      status: (params.status as 'active' | 'deprecated' | 'testing' | 'retired') ?? 'active',
      riskLevel: (params.riskLevel as 'low' | 'medium' | 'high' | 'critical') ?? 'medium',
      endpoint: params.endpoint as string,
      capabilities: (params.capabilities as string[]) ?? [],
      dataClassification: params.dataClassification as 'public' | 'internal' | 'confidential' | 'restricted',
      accessControl: params.accessControl as { allowedRoles: string[]; allowedUsers: string[]; rateLimit: number },
      securityConfig: params.securityConfig as { inputSanitization: boolean; outputValidation: boolean; contentFiltering: boolean; piiRedaction: boolean; maxTokenLimit: number },
      metadata: (params.metadata as Record<string, unknown>) ?? {},
    } as any);
    logger.info(`Model registered: ${result.id} (${result.name})`);
    return result;
  });

  handlers.set('ai-spm.models.list', async (params: Record<string, unknown>) => {
    return service.listModels({
      provider: params.provider as string | undefined,
      status: params.status as any,
      riskLevel: params.riskLevel as any,
    });
  });

  handlers.set('ai-spm.models.get', async (params: Record<string, unknown>) => {
    return service.getModel(params.modelId as string);
  });

  handlers.set('ai-spm.models.update', async (params: Record<string, unknown>) => {
    return service.updateModel(params.modelId as string, params.updates as any);
  });

  handlers.set('ai-spm.models.retire', async (params: Record<string, unknown>) => {
    const success = await service.retireModel(params.modelId as string);
    return { success };
  });

  handlers.set('ai-spm.drift.detect', async (params: Record<string, unknown>) => {
    return service.detectDrift(
      params.modelId as string,
      params.baselineMetrics as Record<string, number>,
      params.currentMetrics as Record<string, number>,
    );
  });

  handlers.set('ai-spm.drift.history', async (params: Record<string, unknown>) => {
    return service.getDriftHistory(
      params.modelId as string,
      params.limit as number | undefined,
    );
  });

  handlers.set('ai-spm.attack-surface.assess', async (params: Record<string, unknown>) => {
    return service.assessAttackSurface(params.modelId as string);
  });

  handlers.set('ai-spm.attack-surface.history', async (params: Record<string, unknown>) => {
    return service.getAttackSurfaceHistory(
      params.modelId as string,
      params.limit as number | undefined,
    );
  });

  handlers.set('ai-spm.report', async () => {
    const report = await service.generateReport();
    logger.info(`AI-SPM report generated: ${report.id}`);
    return report;
  });

  handlers.set('ai-spm.compliance', async (params: Record<string, unknown>) => {
    return service.getComplianceReport(params.framework as 'EU-AI-Act' | 'NIST-AI-RMF' | 'ISO-42001');
  });

  handlers.set('ai-spm.report.latest', async () => {
    return service.getLatestReport();
  });
}

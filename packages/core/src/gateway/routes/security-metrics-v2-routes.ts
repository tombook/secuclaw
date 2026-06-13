import { SecurityMetricsV2Service } from '../../kpi/security-metrics-v2.js';
import type { JsonStore } from '../../storage/json-store.js';
import type { RouterDeps } from '../router.js';


const logger = {
  info: (...args: any[]) => console.log('[SecurityMetricsV2]', ...args),
  error: (...args: any[]) => console.error('[SecurityMetricsV2]', ...args),
};

export function registerSecurityMetricsV2Routes(handlers: Map<string, Function>, deps: RouterDeps): void {
  const store = (deps as any).jsonStore ?? (deps as any).store;
  const service = new SecurityMetricsV2Service(store);

  handlers.set('security-metrics-v2.compute', async (params: Record<string, unknown>) => {
    const start = Number(params.start);
    const end = Number(params.end);
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return { error: 'Invalid time range: start and end must be numbers' };
    }
    if (end < start) {
      return { error: 'Invalid time range: end must be greater than or equal to start' };
    }
    const metrics = await service.compute({ start, end });
    logger.info(`Computed security metrics for range ${new Date(start).toISOString()} — ${new Date(end).toISOString()}`);
    return metrics;
  });

  handlers.set('security-metrics-v2.latest', async () => {
    return service.getLatest();
  });

  handlers.set('security-metrics-v2.history', async (params: Record<string, unknown>) => {
    const limit = params.limit !== undefined ? Number(params.limit) : undefined;
    return service.getHistory(limit);
  });

  handlers.set('security-metrics-v2.executive-summary', async () => {
    const content = await service.getExecutiveSummary();
    return { content };
  });

  handlers.set('security-metrics-v2.mttd', async () => {
    return service.getMTTDReport();
  });

  handlers.set('security-metrics-v2.mttr', async () => {
    return service.getMTTRReport();
  });

  handlers.set('security-metrics-v2.roi', async () => {
    return service.getROIReport();
  });

  handlers.set('security-metrics-v2.collaboration', async () => {
    return service.getCollaborationReport();
  });
}

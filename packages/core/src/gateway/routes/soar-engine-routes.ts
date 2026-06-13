import { AlertCorrelator } from '../../soar/alert-correlator.js';
import { Deduplicator, PriorityCalculator } from '../../soar/alert-deduplicator.js';
import type { RouterDeps } from '../router.js';
import type { JsonStore } from '../../storage/json-store.js';

export function registerSoarEngineRoutes(handlers: Map<string, Function>, deps: RouterDeps): void {
  const store: any = (deps as any).jsonStore ?? (deps as any).store;
  const correlator = new AlertCorrelator(store);
  const dedup = new Deduplicator(store);
  const priority = new PriorityCalculator(store);

  handlers.set('soar.alert.ingest', async (params: Record<string, unknown>) => {
    const alert = params.alert as any;
    await correlator.ingestAlert(alert);
    return { ingested: true };
  });

  handlers.set('soar.alert.ingest-batch', async (params: Record<string, unknown>) => {
    const alerts = (params.alerts as any[]) || [];
    const result = await correlator.ingestBatch(alerts);
    return result;
  });

  handlers.set('soar.incidents.list', async (params: Record<string, unknown>) => {
    const filters: any = {};
    if (params.status) filters.status = params.status;
    if (params.severity) filters.severity = params.severity;
    if (params.since !== undefined) filters.since = params.since;
    return await correlator.listIncidents(filters);
  });

  handlers.set('soar.incidents.get', async (params: Record<string, unknown>) => {
    const incidentId = params.incidentId as string;
    return await correlator.getIncident(incidentId);
  });

  handlers.set('soar.incidents.update-status', async (params: Record<string, unknown>) => {
    const incidentId = params.incidentId as string;
    const status = params.status as any;
    const success = await correlator.updateIncidentStatus(incidentId, status);
    return { success };
  });

  handlers.set('soar.correlate', async (params: Record<string, unknown>) => {
    const timeRange = params.timeRange as { start: number; end: number } | undefined;
    return await correlator.correlate(timeRange);
  });

  handlers.set('soar.correlation-rules.list', async () => {
    return correlator.listCorrelationRules();
  });

  handlers.set('soar.dedup.run', async (params: Record<string, unknown>) => {
    const alerts = (params.alerts as any[]) || [];
    const result = dedup.deduplicate(alerts);
    const obj: Record<string, any> = {};
    for (const [key, value] of result.entries()) {
      obj[key] = value;
    }
    return obj;
  });

  handlers.set('soar.dedup.stats', async () => {
    return await dedup.getStats();
  });

  handlers.set('soar.priority.calculate', async (params: Record<string, unknown>) => {
    const ctx: any = {
      alert: params.alert,
      asset: params.asset ?? null,
      businessHours: params.businessHours ?? false,
      recentIncidentCount: params.recentIncidentCount ?? 0,
      threatIntelMatch: params.threatIntelMatch ?? false,
      isHoliday: params.isHoliday ?? false,
    };
    return priority.calculate(ctx);
  });

  handlers.set('soar.priority.assets.list', async (params: Record<string, unknown>) => {
    const filters: any = {};
    if (params.type) filters.type = params.type;
    if (params.minCriticality !== undefined) filters.minCriticality = params.minCriticality;
    return await priority.listAssets(filters);
  });

  handlers.set('soar.priority.assets.register', async (params: Record<string, unknown>) => {
    const asset = params.asset as any;
    await priority.registerAsset(asset);
    return { success: true };
  });
}
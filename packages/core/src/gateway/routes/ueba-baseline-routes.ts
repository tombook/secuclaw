import { BehaviorBaselineService } from '../../ueba/behavior-baseline.js';
import type { RouterDeps } from '../router.js';
import type { JsonStore } from '../../storage/json-store.js';

export function registerUebaBaselineRoutes(handlers: Map<string, Function>, deps: RouterDeps): void {
  const store: any = (deps as any).jsonStore ?? (deps as any).store;
  const service = new BehaviorBaselineService(store);

  handlers.set('ueba.activity.record', async (params: Record<string, unknown>) => {
    const activity = params.activity as any;
    await service.recordActivity(activity);
    return { id: activity.id || null, recorded: true };
  });

  handlers.set('ueba.activity.record-batch', async (params: Record<string, unknown>) => {
    const activities = (params.activities as any[]) || [];
    await service.recordBatch(activities);
    return { count: activities.length };
  });

  handlers.set('ueba.baseline.build', async (params: Record<string, unknown>) => {
    const entityId = params.entityId as string;
    const entityType = params.entityType as any;
    const timeRange = params.timeRange as { start: number; end: number } | undefined;
    return await service.buildBaseline(entityId, entityType, timeRange);
  });

  handlers.set('ueba.baseline.build-all', async () => {
    return await service.buildAllBaselines();
  });

  handlers.set('ueba.baseline.get', async (params: Record<string, unknown>) => {
    const entityId = params.entityId as string;
    const activityType = params.activityType as any;
    return await service.getBaseline(entityId, activityType);
  });

  handlers.set('ueba.baseline.list', async (params: Record<string, unknown>) => {
    const filters: any = {};
    if (params.entityType) filters.entityType = params.entityType;
    if (params.minSampleCount !== undefined) filters.minSampleCount = params.minSampleCount;
    return await service.listBaselines(filters);
  });

  handlers.set('ueba.baseline.delete', async (params: Record<string, unknown>) => {
    const entityId = params.entityId as string;
    const activityType = params.activityType as any;
    const success = await service.deleteBaseline(entityId, activityType);
    return { success };
  });

  handlers.set('ueba.anomaly.detect', async (params: Record<string, unknown>) => {
    const activity = params.activity as any;
    return await service.detectAnomaly(activity);
  });

  handlers.set('ueba.anomaly.detect-batch', async (params: Record<string, unknown>) => {
    const activities = (params.activities as any[]) || [];
    return await service.detectAnomalies(activities);
  });
}
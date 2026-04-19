import type { RouterDeps } from '../router.js';

export function registerDataCenterRoutes(handlers: Map<string, (...args: any[]) => Promise<any>>, deps: RouterDeps): void {
  const { jsonStore } = deps;

  handlers.set('data-center.stats', async () => {
    const store = (jsonStore as any).store || jsonStore;
    const stats: Record<string, { total: number; lastUpdated?: number }> = {};

    const collections: Record<string, string> = {
      incidents: 'incidents',
      vulnerabilities: 'vulnerabilities',
      threats: 'threats',
      assets: 'assets',
      compliance: 'compliance',
      tasks: 'tasks',
      approvals: 'approvals',
      reports: 'reports',
      playbooks: 'playbooks',
      evidence: 'evidence',
      roles: 'roles',
    };

    for (const [key, fileName] of Object.entries(collections)) {
      try {
        const data = await jsonStore.get(fileName);
        const arr = Array.isArray(data) ? data : [];
        stats[key] = {
          total: arr.length,
          lastUpdated: arr.length > 0 ? Math.max(...arr.map((item: any) => item.updatedAt || item.createdAt || 0)) : undefined,
        };
      } catch {
        stats[key] = { total: 0 };
      }
    }

    const totalRecords = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
    return { totalRecords, collections: stats, generatedAt: Date.now() };
  });

  handlers.set('data-center.export', async (params: Record<string, unknown>) => {
    const collections = (params.collections as string[]) || ['incidents', 'vulnerabilities', 'threats', 'assets', 'compliance', 'tasks'];
    const result: Record<string, any[]> = {};

    for (const coll of collections) {
      try {
        result[coll] = (await jsonStore.get(coll)) ?? [];
      } catch {
        result[coll] = [];
      }
    }

    return {
      data: result,
      exportedAt: Date.now(),
      collections: Object.keys(result),
    };
  });

  handlers.set('data-center.cleanup', async (params: Record<string, unknown>) => {
    const { collection, olderThanDays } = params;
    if (!collection || !olderThanDays) throw new Error('collection and olderThanDays required');

    const cutoff = Date.now() - (olderThanDays as number) * 24 * 60 * 60 * 1000;
    const data = await jsonStore.get(collection as string);
    const arr = Array.isArray(data) ? data : [];
    const before = arr.length;
    const filtered = arr.filter((item: any) => {
      const ts = item.updatedAt || item.createdAt || 0;
      return ts >= cutoff;
    });
    const removed = before - filtered.length;

    if (removed > 0) {
      await jsonStore.set(collection as string, filtered);
    }

    return { collection, removed, remaining: filtered.length, cutoffDate: new Date(cutoff).toISOString() };
  });
}

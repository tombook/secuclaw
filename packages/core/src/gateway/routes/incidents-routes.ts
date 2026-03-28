import type { Router } from '../router.js';

export function registerIncidentsRoutes(router: Router): void {
  const svc = () => router['getIncidentsService']();

  router.registerHandler('incidents.list', async (p: Record<string, unknown>) => svc().list({
    status: p.status as any, severity: p.severity as any, category: p.category as any,
    assignee: p.assignee as string, domainId: p.domainId as any,
    fromDate: p.fromDate as number, toDate: p.toDate as number,
    page: p.page as number, pageSize: p.pageSize as number,
  }));
  router.registerHandler('incidents.get', async (p: Record<string, unknown>) => {
    const { id } = p;
    if (!id) throw new Error('Missing required parameter: id');
    return svc().get(id as string);
  });
  router.registerHandler('incidents.create', async (p: Record<string, unknown>) => svc().create({
    domainId: p.domainId as any, title: p.title as string, description: p.description as string,
    category: p.category as any, severity: p.severity as any, source: p.source as string,
    affectedAssets: p.affectedAssets as any, affectedUsers: p.affectedUsers as number,
    dataTypes: p.dataTypes as any, businessImpact: p.businessImpact as string,
    attackVector: p.attackVector as string, mitreTechniques: p.mitreTechniques as any,
  }));
  router.registerHandler('incidents.update', async (p: Record<string, unknown>) => {
    const { id, ...data } = p;
    if (!id) throw new Error('Missing required parameter: id');
    return svc().update(id as string, data);
  });
  router.registerHandler('incidents.delete', async (p: Record<string, unknown>) => {
    const { id } = p;
    if (!id) throw new Error('Missing required parameter: id');
    return svc().delete(id as string);
  });
  router.registerHandler('incidents.updateStatus', async (p: Record<string, unknown>) => {
    const { id, status, actor, note } = p;
    if (!id || !status) throw new Error('Missing required parameters: id, status');
    return svc().updateStatus(id as string, status as any, actor as string, note as string);
  });
  router.registerHandler('incidents.stats', async () => svc().getStats());
}

import type { RouterDeps } from '../router.js';

export function registerIncidentsRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {
  const svc = () => deps.incidentsService!;

  handlers.set('incidents.list', async (p: Record<string, unknown>) => svc().list({
    status: p.status as any, severity: p.severity as any, category: p.category as any,
    assignee: p.assignee as string, domainId: p.domainId as any,
    fromDate: p.fromDate as number, toDate: p.toDate as number,
    page: p.page as number, pageSize: p.pageSize as number,
  }));
  
  handlers.set('incidents.get', async (p: Record<string, unknown>) => {
    const { id } = p;
    if (!id) throw new Error('Missing required parameter: id');
    return svc().get(id as string);
  });
  
  handlers.set('incidents.getByTicketId', async (p: Record<string, unknown>) => {
    const { ticketId } = p;
    if (!ticketId) throw new Error('Missing required parameter: ticketId');
    return svc().getByTicketId(ticketId as string);
  });
  
  handlers.set('incidents.create', async (p: Record<string, unknown>) => svc().create({
    domainId: p.domainId as any, title: p.title as string, description: p.description as string,
    category: p.category as any, severity: p.severity as any, source: p.source as string,
    affectedAssets: p.affectedAssets as any, affectedUsers: p.affectedUsers as number,
    dataTypes: p.dataTypes as any, businessImpact: p.businessImpact as string,
    attackVector: p.attackVector as string, mitreTechniques: p.mitreTechniques as any,
  }, p.createdBy as string));
  
  handlers.set('incidents.update', async (p: Record<string, unknown>) => {
    const { id, ...data } = p;
    if (!id) throw new Error('Missing required parameter: id');
    return svc().update(id as string, data);
  });
  
  handlers.set('incidents.delete', async (p: Record<string, unknown>) => {
    const { id } = p;
    if (!id) throw new Error('Missing required parameter: id');
    return svc().delete(id as string);
  });
  
  handlers.set('incidents.updateStatus', async (p: Record<string, unknown>) => {
    const { id, status, actor, note } = p;
    if (!id || !status) throw new Error('Missing required parameters: id, status');
    return svc().updateStatus(id as string, status as any, actor as string, note as string);
  });
  
  handlers.set('incidents.escalate', async (p: Record<string, unknown>) => {
    const { id, level, reason } = p;
    if (!id || !level) throw new Error('Missing required parameters: id, level');
    return svc().escalateIncident(
      id as string, 
      level as 'manager' | 'director' | 'ciso', 
      reason as string
    );
  });
  
  handlers.set('incidents.stats', async () => svc().getStats());
  
  handlers.set('incidents.linkedResources', async (p: Record<string, unknown>) => {
    const { incidentId } = p;
    if (!incidentId) throw new Error('Missing required parameter: incidentId');
    return svc().getLinkedResources(incidentId as string);
  });
}

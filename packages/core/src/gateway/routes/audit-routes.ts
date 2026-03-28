import type { Router } from '../router.js';

export function registerAuditRoutes(router: Router): void {
  const deps = router.getDeps();

  router.registerHandler('audit.query', async (params: Record<string, unknown>) => {
    const { AuditLogRepository } = await import('../../audit/repository.js');
    const repo = new AuditLogRepository(deps.jsonStore);
    return repo.query({
      action: params.action as any,
      resource: params.resource as any,
      resourceId: params.resourceId as string,
      actor: params.actor as string,
      fromTimestamp: params.fromTimestamp as number,
      toTimestamp: params.toTimestamp as number,
      page: params.page as number,
      pageSize: params.pageSize as number,
    });
  });

  router.registerHandler('audit.stats', async () => {
    const { AuditLogRepository } = await import('../../audit/repository.js');
    const repo = new AuditLogRepository(deps.jsonStore);
    return repo.getStats();
  });

  router.registerHandler('audit.getByResource', async (params: Record<string, unknown>) => {
    const { resource, resourceId } = params;
    if (!resource || !resourceId) throw new Error('Missing required parameters: resource, resourceId');
    const { AuditLogRepository } = await import('../../audit/repository.js');
    const repo = new AuditLogRepository(deps.jsonStore);
    return repo.getByResource(resource as any, resourceId as string);
  });

  router.registerHandler('audit.getResourceHistory', async (params: Record<string, unknown>) => {
    const { resource, resourceId } = params;
    if (!resource || !resourceId) throw new Error('Missing required parameters: resource, resourceId');
    const { AuditLogService } = await import('../../audit/service.js');
    const { AuditLogRepository } = await import('../../audit/repository.js');
    const repo = new AuditLogRepository(deps.jsonStore);
    const svc = new AuditLogService(repo);
    return svc.getResourceHistory(resource as any, resourceId as string);
  });

  router.registerHandler('audit.log', async (params: Record<string, unknown>) => {
    const { AuditLogService } = await import('../../audit/service.js');
    const { AuditLogRepository } = await import('../../audit/repository.js');
    const repo = new AuditLogRepository(deps.jsonStore);
    const svc = new AuditLogService(repo);
    const { action, } = params;
    if (!action) throw new Error('Missing required parameter: action');
    return svc.log({
      action: action as any,
      resource: params.resource as any,
      resourceId: (params.resourceId as string) || 'unknown',
      actor: (params.actor as string) || 'system',
      details: params.details as Record<string, unknown>,
      previousValue: params.previousValue,
      newValue: params.newValue,
    });
  });
}

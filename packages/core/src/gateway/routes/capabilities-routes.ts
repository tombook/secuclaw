import type { Router } from '../router.js';

export function registerCapabilitiesRoutes(router: Router): void {
  const svc = () => router['getCapabilitiesService']();

  router.registerHandler('capabilities.domains.list', async () => svc().listDomains());
  router.registerHandler('capabilities.items.list', async (p: Record<string, unknown>) => svc().listItems({
    domainId: p.domainId as any, roleId: p.roleId as string, enabledOnly: p.enabledOnly as boolean,
  }));
  router.registerHandler('capabilities.tasks.list', async (p: Record<string, unknown>) => svc().listTasks({
    domainId: p.domainId as any, status: p.status as any, assigneeRole: p.assigneeRole as string,
    priority: p.priority as any, capabilityId: p.capabilityId as string, limit: p.limit as number, offset: p.offset as number,
  }));
  router.registerHandler('capabilities.tasks.create', async (p: Record<string, unknown>) => {
    const { domainId, capabilityId, title, description, priority, assigneeRole, dueAt, slaMinutes } = p;
    if (!domainId || !capabilityId || !title || !priority || !assigneeRole) throw new Error('Missing required parameters');
    return svc().createTask({
      domainId: domainId as any, capabilityId: capabilityId as string, title: title as string,
      description: description as string, priority: priority as any, assigneeRole: assigneeRole as string,
      dueAt: dueAt as number, slaMinutes: slaMinutes as number,
    });
  });
  router.registerHandler('capabilities.tasks.updateStatus', async (p: Record<string, unknown>) => {
    const { id, status, comment } = p;
    if (!id || !status) throw new Error('Missing required parameters: id, status');
    return svc().updateTaskStatus({ id: id as string, status: status as any, comment: comment as string });
  });
  router.registerHandler('capabilities.tasks.sla', async (p: Record<string, unknown>) => {
    const { taskId } = p;
    if (!taskId) throw new Error('Missing required parameter: taskId');
    return svc().getTaskSLAStatus(taskId as string);
  });
  router.registerHandler('capabilities.tasks.close', async (p: Record<string, unknown>) => {
    const { id, comment } = p;
    if (!id) throw new Error('Missing required parameter: id');
    return svc().updateTaskStatus({ id: id as string, status: 'closed', comment: comment as string });
  });
  router.registerHandler('capabilities.tasks.reopen', async (p: Record<string, unknown>) => {
    const { id, comment } = p;
    if (!id) throw new Error('Missing required parameter: id');
    return svc().updateTaskStatus({ id: id as string, status: 'in_progress', comment: comment as string });
  });
  router.registerHandler('capabilities.approvals.create', async (p: Record<string, unknown>) => {
    const { taskId, requester, scope, ticketNo, expiresAt } = p;
    if (!taskId || !requester || !scope || !ticketNo || !expiresAt) throw new Error('Missing required parameters');
    return svc().createApproval({
      taskId: taskId as string, requester: requester as string, scope: scope as string,
      ticketNo: ticketNo as string, expiresAt: expiresAt as number,
    });
  });
  router.registerHandler('capabilities.approvals.approve', async (p: Record<string, unknown>) => {
    const { id, approver, approved, reason } = p;
    if (!id || !approver || typeof approved !== 'boolean') throw new Error('Missing required parameters');
    return svc().approveApproval({
      id: id as string, approver: approver as string, approved: approved as boolean, reason: reason as string,
    });
  });
  router.registerHandler('capabilities.runs.execute', async (p: Record<string, unknown>) => {
    const { taskId, toolId, params: execParams } = p;
    if (!taskId || !toolId) throw new Error('Missing required parameters: taskId, toolId');
    return svc().executeRun({ taskId: taskId as string, toolId: toolId as string, params: (execParams || {}) as Record<string, unknown> });
  });
  router.registerHandler('capabilities.runs.listByTask', async (p: Record<string, unknown>) => {
    const { taskId } = p;
    if (!taskId) throw new Error('Missing required parameter: taskId');
    return svc().listRunsByTask(taskId as string);
  });
  router.registerHandler('capabilities.evidence.create', async (p: Record<string, unknown>) => {
    const { domainId, taskId, runId, title, description, files, tags, createdBy } = p;
    if (!domainId || !title || !files) throw new Error('Missing required parameters: domainId, title, files');
    return svc().createEvidence({
      domainId: domainId as any, taskId: taskId as string, runId: runId as string,
      title: title as string, description: description as string, files: files as string[],
      tags: tags as string[], createdBy: createdBy as string,
    });
  });
  router.registerHandler('capabilities.evidence.list', async (p: Record<string, unknown>) => svc().listEvidence({
    domainId: p.domainId as any, taskId: p.taskId as string, runId: p.runId as string, limit: p.limit as number,
  }));
  router.registerHandler('capabilities.overview.metrics', async () => svc().getOverviewMetrics());
}

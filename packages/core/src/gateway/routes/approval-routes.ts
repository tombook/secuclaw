import type { RouterDeps } from '../router.js';
import { getApprovalService, initApprovalService } from '../../capabilities/approval-service.js';

export function registerApprovalRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {
  initApprovalService(deps.jsonStore);
  const approvalService = getApprovalService();

  handlers.set('approval.create', async (params) => {
    const { taskId, requester, scope, approverRole } = params;
    if (!taskId || !requester || !scope) throw new Error('taskId, requester, scope required');
    return approvalService.createApproval(
      taskId as string,
      requester as string,
      scope as string,
      approverRole as string | undefined
    );
  });

  handlers.set('approval.get', async (params) => {
    const { approvalId } = params;
    if (!approvalId) throw new Error('approvalId required');
    return approvalService.getApproval(approvalId as string);
  });

  handlers.set('approval.getByTaskId', async (params) => {
    const { taskId } = params;
    if (!taskId) throw new Error('taskId required');
    return approvalService.getApprovalByTaskId(taskId as string);
  });

  handlers.set('approval.list', async (params) => {
    const approvals = await approvalService.listApprovals({
      status: params.status as any | undefined,
      approverRole: params.approverRole as string | undefined,
      requester: params.requester as string | undefined,
      limit: params.limit ? Number(params.limit) : undefined,
      offset: params.offset ? Number(params.offset) : undefined,
    });
    return { data: approvals };
  });

  handlers.set('approval.approve', async (params) => {
    const { approvalId, approver, reason } = params;
    if (!approvalId || !approver) throw new Error('approvalId and approver required');
    return approvalService.approve(
      approvalId as string,
      approver as string,
      reason as string | undefined
    );
  });

  handlers.set('approval.reject', async (params) => {
    const { approvalId, approver, reason } = params;
    if (!approvalId || !approver) throw new Error('approvalId and approver required');
    return approvalService.reject(
      approvalId as string,
      approver as string,
      reason as string | undefined
    );
  });

  handlers.set('approval.canExecute', async (params) => {
    const { taskId } = params;
    if (!taskId) throw new Error('taskId required');
    const canExecute = await approvalService.canExecuteDarkTask(taskId as string);
    return { canExecute };
  });
}

import { RemediationActionRegistry } from '../../remediation/action-registry.js';
import { RemediationApprovalWorkflow } from '../../remediation/approval-workflow.js';
import { RemediationVerificationEngine } from '../../remediation/verification-engine.js';
import { RollbackManager } from '../../remediation/rollback-manager.js';
import type { JsonStore } from '../../storage/json-store.js';
import type { RouterDeps } from '../router.js';


export function registerRemediationRoutes(handlers: Map<string, Function>, deps: RouterDeps): void {
  const store = (deps as any).jsonStore ?? (deps as any).store;

  const actionRegistry = new RemediationActionRegistry();
  const approvalWorkflow = new RemediationApprovalWorkflow(store);
  const verificationEngine = new RemediationVerificationEngine(store);
  const rollbackManager = new RollbackManager(store);

  handlers.set('remediation.actions.execute', async (params: Record<string, unknown>) => {
    const { actionId, actionType, target, params: actionParams, riskLevel } = params as {
      actionId?: string;
      actionType: string;
      target: string;
      params: Record<string, unknown>;
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
    };

    if (actionId) {
      return actionRegistry.execute(actionId);
    }

    const action = actionRegistry.createActionFromTemplate(actionType as 'block_ip' | 'isolate_host' | 'kill_process' | 'rotate_credentials' | 'patch_vulnerability' | 'update_firewall' | 'quarantine_file' | 'disable_user' | 'notify_team' | 'create_ticket' | 'enrich_ioc' | 'scan_target' | 'custom', target, actionParams);
    if (riskLevel) {
      action.riskLevel = riskLevel;
    }
    actionRegistry.registerAction(action);
    return actionRegistry.execute(action.id);
  });

  handlers.set('remediation.actions.execute-by-type', async (params: Record<string, unknown>) => {
    const { type, target, params: actionParams } = params as {
      type: string;
      target: string;
      params: Record<string, unknown>;
    };
    return actionRegistry.executeByType(type as any, target, actionParams);
  });

  handlers.set('remediation.actions.list-templates', async () => {
    return { templates: actionRegistry.getActionTemplates() };
  });

  handlers.set('remediation.approvals.create', async (params: Record<string, unknown>) => {
    const { actionId, actionType, actionTarget, actionParams, riskLevel, justification, requestedBy, escalationPath } = params as {
      actionId: string;
      actionType: string;
      actionTarget: string;
      actionParams: Record<string, unknown>;
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
      justification: string;
      requestedBy: string;
      escalationPath?: string[];
    };
    return approvalWorkflow.createRequest({
      actionId,
      actionType,
      actionTarget,
      actionParams,
      riskLevel,
      justification,
      requestedBy,
      escalationPath,
    });
  });

  handlers.set('remediation.approvals.approve', async (params: Record<string, unknown>) => {
    const { requestId, approver, comment } = params as {
      requestId: string;
      approver: string;
      comment?: string;
    };
    return approvalWorkflow.approve(requestId, approver, comment);
  });

  handlers.set('remediation.approvals.reject', async (params: Record<string, unknown>) => {
    const { requestId, approver, comment } = params as {
      requestId: string;
      approver: string;
      comment?: string;
    };
    return approvalWorkflow.reject(requestId, approver, comment);
  });

  handlers.set('remediation.approvals.list', async (params: Record<string, unknown>) => {
    const { status, riskLevel, requestedBy, actionType } = params as {
      status?: 'pending' | 'approved' | 'rejected' | 'expired' | 'auto_approved';
      riskLevel?: 'low' | 'medium' | 'high' | 'critical';
      requestedBy?: string;
      actionType?: string;
    };
    return approvalWorkflow.listRequests({ status, riskLevel, requestedBy, actionType });
  });

  handlers.set('remediation.approvals.process-expirations', async () => {
    const expiredCount = await approvalWorkflow.processExpirations();
    return { expiredCount };
  });

  handlers.set('remediation.approvals.stats', async () => {
    return approvalWorkflow.getStats();
  });

  handlers.set('remediation.approvals.policy.get', async () => {
    return approvalWorkflow.getPolicy();
  });

  handlers.set('remediation.approvals.policy.set', async (params: Record<string, unknown>) => {
    const { policy } = params as { policy: Parameters<typeof approvalWorkflow.setPolicy>[0] };
    approvalWorkflow.setPolicy(policy);
    return { success: true };
  });

  handlers.set('remediation.verify', async (params: Record<string, unknown>) => {
    const { actionId, actionType, metricsBefore } = params as {
      actionId: string;
      actionType: string;
      metricsBefore: Record<string, number>;
    };
    return verificationEngine.verify(actionId, actionType, metricsBefore);
  });

  handlers.set('remediation.verification.get', async (params: Record<string, unknown>) => {
    const { reportId } = params as { reportId: string };
    return verificationEngine.getReport(reportId);
  });

  handlers.set('remediation.verification.list', async (params: Record<string, unknown>) => {
    const { limit } = params as { limit?: number };
    return verificationEngine.getRecentReports(limit ?? 50);
  });

  handlers.set('remediation.verification.stats', async () => {
    return verificationEngine.getVerificationStats();
  });

  handlers.set('remediation.rollback.create-plan', async (params: Record<string, unknown>) => {
    const { actionId, actionType, rollbackActions } = params as {
      actionId: string;
      actionType: string;
      rollbackActions: Array<{ rollbackType: string; command: string; params: Record<string, unknown> }>;
    };
    return rollbackManager.createPlan(actionId, actionType, rollbackActions);
  });

  handlers.set('remediation.rollback.execute-plan', async (params: Record<string, unknown>) => {
    const { planId } = params as { planId: string };
    return rollbackManager.executePlan(planId);
  });

  handlers.set('remediation.rollback.auto', async (params: Record<string, unknown>) => {
    const { actionId, reason } = params as { actionId: string; reason: string };
    return rollbackManager.autoRollback(actionId, reason);
  });

  handlers.set('remediation.rollback.history', async (params: Record<string, unknown>) => {
    const { actionType, success, since } = params as {
      actionType?: string;
      success?: boolean;
      since?: number;
    };
    const history = await rollbackManager.getHistory({ actionType, success });
    if (since !== undefined) {
      return history.filter((h) => h.timestamp >= since);
    }
    return history;
  });

  handlers.set('remediation.rollback.stats', async () => {
    return rollbackManager.getRollbackStats();
  });
}
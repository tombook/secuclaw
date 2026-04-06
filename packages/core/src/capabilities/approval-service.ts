import type { Approval, ApprovalStatus } from './types.js';
import type { JsonStore } from '../storage/json-store.js';

const logger = {
  info: (...args: any[]) => console.log('[ApprovalService]', ...args),
  error: (...args: any[]) => console.error('[ApprovalService]', ...args),
  warn: (...args: any[]) => console.warn('[ApprovalService]', ...args),
  debug: (...args: any[]) => console.log('[ApprovalService:DEBUG]', ...args),
};

export class ApprovalService {
  private approvals: Map<string, Approval> = new Map();
  private jsonStore: JsonStore | undefined;
  private expirationCheckInterval: NodeJS.Timeout | undefined;

  constructor(store?: JsonStore) {
    this.jsonStore = store;
  }

  async initialize(): Promise<void> {
    if (this.jsonStore) {
      try {
        const savedApprovals = await this.jsonStore.get<Approval[]>('approvals.json');
        if (savedApprovals) {
          for (const approval of savedApprovals) {
            this.approvals.set(approval.id, approval);
          }
          logger.info(`Loaded ${savedApprovals.length} saved approvals`);
        }
      } catch (error) {
        logger.warn('Could not load saved approvals:', error);
      }
    }

    this.startExpirationChecker();
  }

  private async saveApprovals(): Promise<void> {
    if (this.jsonStore) {
      const approvalsArray = Array.from(this.approvals.values());
      await this.jsonStore.set('approvals.json', approvalsArray);
    }
  }

  async createApproval(
    taskId: string,
    requester: string,
    scope: string,
    approverRole?: string
  ): Promise<Approval> {
    const now = Date.now();
    const expiresAt = now + (2 * 60 * 60 * 1000);

    const approval: Approval = {
      id: `approval_${now}_${Math.random().toString(36).substring(2, 11)}`,
      taskId,
      type: 'dark-operation',
      requester,
      approverRole,
      scope,
      ticketNo: `REQ-${now}`,
      expiresAt,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    this.approvals.set(approval.id, approval);
    logger.info(`Created approval: ${approval.id} for task ${taskId}`);

    await this.saveApprovals();
    return approval;
  }

  async getApproval(approvalId: string): Promise<Approval> {
    const approval = this.approvals.get(approvalId);
    if (!approval) {
      throw new Error(`Approval not found: ${approvalId}`);
    }
    return approval;
  }

  async getApprovalByTaskId(taskId: string): Promise<Approval | null> {
    for (const approval of this.approvals.values()) {
      if (approval.taskId === taskId) {
        return approval;
      }
    }
    return null;
  }

  async listApprovals(options?: {
    status?: ApprovalStatus;
    approverRole?: string;
    requester?: string;
    limit?: number;
    offset?: number;
  }): Promise<Approval[]> {
    let approvals = Array.from(this.approvals.values());

    if (options?.status) {
      approvals = approvals.filter(a => a.status === options.status);
    }
    if (options?.approverRole) {
      approvals = approvals.filter(a => a.approverRole === options.approverRole);
    }
    if (options?.requester) {
      approvals = approvals.filter(a => a.requester === options.requester);
    }

    approvals.sort((a, b) => b.createdAt - a.createdAt);

    if (options?.limit) {
      const offset = options.offset || 0;
      approvals = approvals.slice(offset, offset + options.limit);
    }

    return approvals;
  }

  async approve(
    approvalId: string,
    approver: string,
    reason?: string
  ): Promise<Approval> {
    const approval = await this.getApproval(approvalId);
    const now = Date.now();

    if (approval.status !== 'pending') {
      throw new Error('Approval is not pending');
    }

    approval.status = 'approved';
    approval.approver = approver;
    approval.approvedAt = now;
    approval.reason = reason;
    approval.updatedAt = now;

    await this.saveApprovals();
    logger.info(`Approval ${approvalId} approved by ${approver}`);
    return approval;
  }

  async reject(
    approvalId: string,
    approver: string,
    reason?: string
  ): Promise<Approval> {
    const approval = await this.getApproval(approvalId);
    const now = Date.now();

    if (approval.status !== 'pending') {
      throw new Error('Approval is not pending');
    }

    approval.status = 'rejected';
    approval.approver = approver;
    approval.approvedAt = now;
    approval.reason = reason;
    approval.updatedAt = now;

    await this.saveApprovals();
    logger.info(`Approval ${approvalId} rejected by ${approver}`);
    return approval;
  }

  async isApproved(taskId: string): Promise<boolean> {
    const approval = await this.getApprovalByTaskId(taskId);
    return approval?.status === 'approved';
  }

  async canExecuteDarkTask(taskId: string): Promise<boolean> {
    const approval = await this.getApprovalByTaskId(taskId);
    
    if (!approval) {
      return false;
    }
    
    if (approval.status !== 'approved') {
      return false;
    }

    const now = Date.now();
    if (approval.expiresAt < now) {
      logger.warn(`Approval for task ${taskId} has expired`);
      await this.expireApproval(approval.id);
      return false;
    }

    return true;
  }

  private async expireApproval(approvalId: string): Promise<Approval> {
    const approval = await this.getApproval(approvalId);
    approval.status = 'expired';
    approval.updatedAt = Date.now();
    await this.saveApprovals();
    logger.info(`Approval ${approvalId} expired`);
    return approval;
  }

  private startExpirationChecker(): void {
    this.expirationCheckInterval = setInterval(() => {
      this.checkExpirations();
    }, 60000);
  }

  private async checkExpirations(): Promise<void> {
    const now = Date.now();
    for (const approval of this.approvals.values()) {
      if (approval.status === 'pending' && approval.expiresAt < now) {
        await this.expireApproval(approval.id);
      }
    }
  }

  shutdown(): void {
    logger.info('Shutting down approval service...');
    if (this.expirationCheckInterval) {
      clearInterval(this.expirationCheckInterval);
    }
  }
}

export let approvalService: ApprovalService | undefined;

export function initApprovalService(store?: JsonStore): ApprovalService {
  approvalService = new ApprovalService(store);
  return approvalService;
}

export function getApprovalService(): ApprovalService {
  if (!approvalService) {
    throw new Error('ApprovalService not initialized');
  }
  return approvalService;
}

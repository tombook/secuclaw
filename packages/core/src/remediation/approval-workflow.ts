import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'auto_approved';

export interface ApprovalRequest {
  id: string;
  actionId: string;
  actionType: string;
  actionTarget: string;
  actionParams: Record<string, unknown>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  justification: string;
  status: ApprovalStatus;
  requestedAt: number;
  requestedBy: string;
  respondedAt: number | null;
  respondedBy: string | null;
  responseComment: string | null;
  expiresAt: number;
  escalationPath: string[];
}

export interface ApprovalPolicyRule {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  autoApprove: boolean;
  requiredApprovers: number;
  escalationTimeoutMs: number;
}

export interface ApprovalPolicy {
  id: string;
  name: string;
  rules: ApprovalPolicyRule[];
  defaultPolicy: boolean;
}

export interface ApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  autoApproved: number;
  avgResponseTimeMs: number;
}

const STORE_KEY = 'remediation/approval-requests.json';

const DEFAULT_POLICY: ApprovalPolicy = {
  id: 'default-approval-policy',
  name: 'Default Remediation Approval Policy',
  defaultPolicy: true,
  rules: [
    { riskLevel: 'low', autoApprove: true, requiredApprovers: 0, escalationTimeoutMs: 0 },
    { riskLevel: 'medium', autoApprove: false, requiredApprovers: 1, escalationTimeoutMs: 30 * 60 * 1000 },
    { riskLevel: 'high', autoApprove: false, requiredApprovers: 1, escalationTimeoutMs: 15 * 60 * 1000 },
    { riskLevel: 'critical', autoApprove: false, requiredApprovers: 2, escalationTimeoutMs: 10 * 60 * 1000 },
  ],
};

export class RemediationApprovalWorkflow {
  private policy: ApprovalPolicy = DEFAULT_POLICY;

  constructor(private store: JsonStore) {}

  async createRequest(params: {
    actionId: string;
    actionType: string;
    actionTarget: string;
    actionParams: Record<string, unknown>;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    justification: string;
    requestedBy: string;
    escalationPath?: string[];
  }): Promise<ApprovalRequest> {
    const now = Date.now();
    const rule = this.policy.rules.find((r) => r.riskLevel === params.riskLevel) ?? this.policy.rules[this.policy.rules.length - 1];

    const request: ApprovalRequest = {
      id: this.generateId(),
      actionId: params.actionId,
      actionType: params.actionType,
      actionTarget: params.actionTarget,
      actionParams: params.actionParams,
      riskLevel: params.riskLevel,
      justification: params.justification,
      status: this.shouldAutoApprove(params.riskLevel) ? 'auto_approved' : 'pending',
      requestedAt: now,
      requestedBy: params.requestedBy,
      respondedAt: this.shouldAutoApprove(params.riskLevel) ? now : null,
      respondedBy: this.shouldAutoApprove(params.riskLevel) ? 'system' : null,
      responseComment: this.shouldAutoApprove(params.riskLevel) ? 'Auto-approved based on policy' : null,
      expiresAt: rule.autoApprove ? now : now + rule.escalationTimeoutMs,
      escalationPath: params.escalationPath ?? [],
    };

    const requests = await this.loadRequests();
    requests.push(request);
    await this.store.set(STORE_KEY, requests);

    return request;
  }

  async approve(requestId: string, approver: string, comment?: string): Promise<ApprovalRequest> {
    const requests = await this.loadRequests();
    const request = requests.find((r) => r.id === requestId);
    if (!request) {
      throw new Error(`Approval request not found: ${requestId}`);
    }
    if (request.status !== 'pending') {
      throw new Error(`Cannot approve request with status: ${request.status}`);
    }

    request.status = 'approved';
    request.respondedAt = Date.now();
    request.respondedBy = approver;
    request.responseComment = comment ?? null;

    await this.store.set(STORE_KEY, requests);
    return request;
  }

  async reject(requestId: string, approver: string, comment?: string): Promise<ApprovalRequest> {
    const requests = await this.loadRequests();
    const request = requests.find((r) => r.id === requestId);
    if (!request) {
      throw new Error(`Approval request not found: ${requestId}`);
    }
    if (request.status !== 'pending') {
      throw new Error(`Cannot reject request with status: ${request.status}`);
    }

    request.status = 'rejected';
    request.respondedAt = Date.now();
    request.respondedBy = approver;
    request.responseComment = comment ?? null;

    await this.store.set(STORE_KEY, requests);
    return request;
  }

  async getRequest(requestId: string): Promise<ApprovalRequest | null> {
    const requests = await this.loadRequests();
    return requests.find((r) => r.id === requestId) ?? null;
  }

  async listRequests(filters?: {
    status?: ApprovalStatus;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    requestedBy?: string;
    actionType?: string;
  }): Promise<ApprovalRequest[]> {
    let requests = await this.loadRequests();

    if (filters) {
      if (filters.status) {
        requests = requests.filter((r) => r.status === filters.status);
      }
      if (filters.riskLevel) {
        requests = requests.filter((r) => r.riskLevel === filters.riskLevel);
      }
      if (filters.requestedBy) {
        requests = requests.filter((r) => r.requestedBy === filters.requestedBy);
      }
      if (filters.actionType) {
        requests = requests.filter((r) => r.actionType === filters.actionType);
      }
    }

    return requests;
  }

  async processExpirations(): Promise<number> {
    const now = Date.now();
    const requests = await this.loadRequests();
    let expiredCount = 0;

    for (const request of requests) {
      if (request.status === 'pending' && request.expiresAt <= now) {
        request.status = 'expired';
        request.respondedAt = now;
        request.respondedBy = 'system';
        request.responseComment = 'Request expired due to timeout';
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      await this.store.set(STORE_KEY, requests);
    }

    return expiredCount;
  }

  setPolicy(policy: ApprovalPolicy): void {
    this.policy = policy;
  }

  getPolicy(): ApprovalPolicy {
    return this.policy;
  }

  async getStats(): Promise<ApprovalStats> {
    const requests = await this.loadRequests();

    const responded = requests.filter((r) => r.respondedAt !== null);
    const totalResponseTime = responded.reduce((sum, r) => sum + (r.respondedAt! - r.requestedAt), 0);

    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      approved: requests.filter((r) => r.status === 'approved').length,
      rejected: requests.filter((r) => r.status === 'rejected').length,
      expired: requests.filter((r) => r.status === 'expired').length,
      autoApproved: requests.filter((r) => r.status === 'auto_approved').length,
      avgResponseTimeMs: responded.length > 0 ? totalResponseTime / responded.length : 0,
    };
  }

  private shouldAutoApprove(riskLevel: 'low' | 'medium' | 'high' | 'critical'): boolean {
    const rule = this.policy.rules.find((r) => r.riskLevel === riskLevel);
    return rule?.autoApprove ?? false;
  }

  private generateId(): string {
    return randomUUID();
  }

  private async loadRequests(): Promise<ApprovalRequest[]> {
    const data = await this.store.get<ApprovalRequest[]>(STORE_KEY);
    return data ?? [];
  }
}

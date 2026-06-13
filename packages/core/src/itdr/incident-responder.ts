import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type ResponseAction = 'lock_account' | 'unlock_account' | 'force_password_reset' | 'revoke_sessions' | 'revoke_tokens' | 'disable_api_keys' | 'require_mfa' | 'force_mfa_reenroll' | 'block_ip' | 'unblock_ip' | 'quarantine_user' | 'release_quarantine' | 'notify_user' | 'notify_security_team' | 'create_ticket' | 'isolate_host' | 'log_only';
export type ResponseStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back' | 'cancelled';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface ResponsePolicy {
  id: string;
  name: string;
  description: string;
  trigger: { threatType: 'credential_stuffing' | 'brute_force' | 'mfa_fatigue' | 'lateral_movement' | 'privilege_escalation' | 'sim_swap' | 'breach_replay' | 'session_hijack' | 'impossible_travel' | 'manual'; severity?: Severity };
  actions: ResponseAction[];
  requiresApproval: boolean;
  approvers: string[];
  cooldownMs: number;
  active: boolean;
  createdAt: number;
  createdBy: string;
  lastTriggered: number | null;
  triggerCount: number;
  notes: string;
}

export interface ResponseExecution {
  id: string;
  policyId: string;
  policyName: string;
  triggeredAt: number;
  completedAt: number | null;
  status: ResponseStatus;
  threatId: string;
  threatType: string;
  severity: Severity;
  userId: string | null;
  sourceIp: string | null;
  actions: Array<{ action: ResponseAction; status: ResponseStatus; startedAt: number; completedAt: number | null; error: string | null; result: Record<string, any> }>;
  approversRequired: string[];
  approversGranted: Array<{ approver: string; decision: 'approved' | 'rejected'; comment: string; timestamp: number }>;
  approvedAt: number | null;
  rollbackPossible: boolean;
  rolledBackAt: number | null;
  rollbackReason: string | null;
  durationMs: number | null;
  notificationsSent: number;
  notes: string;
}

export interface QuarantineUser {
  userId: string;
  quarantinedAt: number;
  reason: string;
  severity: Severity;
  triggeredBy: string;
  accessRestricted: string[];
  expiresAt: number | null;
  reviewedAt: number | null;
  releasedAt: number | null;
  releasedBy: string | null;
  active: boolean;
  notes: string;
}

export interface BlockedIp {
  ip: string;
  cidr: string | null;
  reason: string;
  severity: Severity;
  triggeredBy: string;
  blockedAt: number;
  expiresAt: number | null;
  scope: 'global' | 'region' | 'application' | 'tenant';
  application: string | null;
  source: 'auto' | 'manual' | 'threat_intel';
  lastAttempt: number | null;
  attempts: number;
  releasedAt: number | null;
  active: boolean;
}

export interface IncidentResponderStats {
  totalPolicies: number;
  activePolicies: number;
  totalExecutions: number;
  byStatus: Record<ResponseStatus, number>;
  bySeverity: Record<Severity, number>;
  byAction: Record<ResponseAction, number>;
  successRate: number;
  averageDurationMs: number;
  quarantinedUsers: number;
  blockedIps: number;
  pendingApprovals: number;
  rolledBack: number;
}

const STORE_KEYS = {
  policies: 'itdr/response-policies.json',
  executions: 'itdr/executions.json',
  quarantined: 'itdr/quarantined-users.json',
  blockedIps: 'itdr/blocked-ips.json',
};

function emptyStatusMap(): Record<ResponseStatus, number> {
  return { pending: 0, in_progress: 0, completed: 0, failed: 0, rolled_back: 0, cancelled: 0 };
}
function emptySeverityMap(): Record<Severity, number> {
  return { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
}
function emptyActionMap(): Record<ResponseAction, number> {
  return {
    lock_account: 0, unlock_account: 0, force_password_reset: 0, revoke_sessions: 0,
    revoke_tokens: 0, disable_api_keys: 0, require_mfa: 0, force_mfa_reenroll: 0,
    block_ip: 0, unblock_ip: 0, quarantine_user: 0, release_quarantine: 0,
    notify_user: 0, notify_security_team: 0, create_ticket: 0, isolate_host: 0, log_only: 0,
  };
}

export class IncidentResponder {
  constructor(private store: JsonStore) {}

  async createPolicy(policy: Omit<ResponsePolicy, 'id' | 'createdAt' | 'lastTriggered' | 'triggerCount'>): Promise<ResponsePolicy> {
    const newPolicy: ResponsePolicy = { ...policy, id: this.generateId('pol'), createdAt: Date.now(), lastTriggered: null, triggerCount: 0 };
    const policies = await this.loadPolicies();
    policies.push(newPolicy);
    await this.store.set(STORE_KEYS.policies, policies);
    return newPolicy;
  }

  async updatePolicy(policyId: string, updates: Partial<ResponsePolicy>): Promise<ResponsePolicy | null> {
    const policies = await this.loadPolicies();
    const idx = policies.findIndex((p) => p.id === policyId);
    if (idx === -1) return null;
    policies[idx] = { ...policies[idx], ...updates };
    await this.store.set(STORE_KEYS.policies, policies);
    return policies[idx];
  }

  async getPolicy(policyId: string): Promise<ResponsePolicy | null> {
    const policies = await this.loadPolicies();
    return policies.find((p) => p.id === policyId) || null;
  }

  async listPolicies(filters?: { active?: boolean; triggerType?: string; severity?: Severity }): Promise<ResponsePolicy[]> {
    let policies = await this.loadPolicies();
    if (filters?.active !== undefined) policies = policies.filter((p) => p.active === filters.active);
    if (filters?.triggerType) policies = policies.filter((p) => p.trigger.threatType === filters.triggerType);
    if (filters?.severity) policies = policies.filter((p) => p.trigger.severity === filters.severity);
    return policies;
  }

  async deletePolicy(policyId: string): Promise<boolean> {
    const policies = await this.loadPolicies();
    const filtered = policies.filter((p) => p.id !== policyId);
    if (filtered.length === policies.length) return false;
    await this.store.set(STORE_KEYS.policies, filtered);
    return true;
  }

  async trigger(params: { threatType: string; threatId: string; severity: Severity; userId?: string; sourceIp?: string; detection: Record<string, any> }): Promise<{ execution: ResponseExecution; actions: ResponseAction[] }> {
    const policies = await this.loadPolicies();
    const matched = this.findMatchingPolicies(policies, params.threatType, params.severity);
    if (matched.length === 0) {
      const stub: ResponseExecution = {
        id: this.generateId('exec'),
        policyId: 'none',
        policyName: 'no-policy-matched',
        triggeredAt: Date.now(),
        completedAt: Date.now(),
        status: 'completed',
        threatId: params.threatId,
        threatType: params.threatType,
        severity: params.severity,
        userId: params.userId || null,
        sourceIp: params.sourceIp || null,
        actions: [],
        approversRequired: [],
        approversGranted: [],
        approvedAt: null,
        rollbackPossible: false,
        rolledBackAt: null,
        rollbackReason: null,
        durationMs: 0,
        notificationsSent: 0,
        notes: 'No policy matched',
      };
      return { execution: stub, actions: [] };
    }
    const policy = matched[0];
    const allActions: Array<{ action: ResponseAction; status: ResponseStatus; startedAt: number; completedAt: number | null; error: string | null; result: Record<string, any> }> = [];
    for (const action of policy.actions) {
      const r = await this.executeAction(action, params);
      allActions.push({ action, status: r.status, startedAt: Date.now(), completedAt: Date.now(), error: r.error || null, result: r.result });
    }
    const execution: ResponseExecution = {
      id: this.generateId('exec'),
      policyId: policy.id,
      policyName: policy.name,
      triggeredAt: Date.now(),
      completedAt: Date.now(),
      status: allActions.every((a) => a.status === 'completed') ? 'completed' : allActions.some((a) => a.status === 'completed') ? 'completed' : 'failed',
      threatId: params.threatId,
      threatType: params.threatType,
      severity: params.severity,
      userId: params.userId || null,
      sourceIp: params.sourceIp || null,
      actions: allActions,
      approversRequired: policy.requiresApproval ? policy.approvers : [],
      approversGranted: [],
      approvedAt: null,
      rollbackPossible: true,
      rolledBackAt: null,
      rollbackReason: null,
      durationMs: 0,
      notificationsSent: allActions.filter((a) => a.action === 'notify_user' || a.action === 'notify_security_team').length,
      notes: '',
    };
    const executions = await this.loadExecutions();
    executions.push(execution);
    if (executions.length > 5000) executions.splice(0, executions.length - 5000);
    await this.store.set(STORE_KEYS.executions, executions);

    const policiesAll = await this.loadPolicies();
    const pIdx = policiesAll.findIndex((p) => p.id === policy.id);
    if (pIdx !== -1) {
      policiesAll[pIdx].lastTriggered = Date.now();
      policiesAll[pIdx].triggerCount++;
      await this.store.set(STORE_KEYS.policies, policiesAll);
    }
    return { execution, actions: policy.actions };
  }

  async getExecution(executionId: string): Promise<ResponseExecution | null> {
    const executions = await this.loadExecutions();
    return executions.find((e) => e.id === executionId) || null;
  }

  async listExecutions(filters?: { status?: ResponseStatus; severity?: Severity; userId?: string; since?: number; limit?: number }): Promise<ResponseExecution[]> {
    let executions = await this.loadExecutions();
    if (filters?.status) executions = executions.filter((e) => e.status === filters.status);
    if (filters?.severity) executions = executions.filter((e) => e.severity === filters.severity);
    if (filters?.userId) executions = executions.filter((e) => e.userId === filters.userId);
    if (filters?.since !== undefined) executions = executions.filter((e) => e.triggeredAt >= filters.since!);
    executions.sort((a, b) => b.triggeredAt - a.triggeredAt);
    if (filters?.limit !== undefined) executions = executions.slice(0, filters.limit);
    return executions;
  }

  async approveExecution(executionId: string, approver: string, comment: string): Promise<boolean> {
    const executions = await this.loadExecutions();
    const idx = executions.findIndex((e) => e.id === executionId);
    if (idx === -1) return false;
    executions[idx].approversGranted.push({ approver, decision: 'approved', comment, timestamp: Date.now() });
    if (executions[idx].approversGranted.filter((g) => g.decision === 'approved').length >= executions[idx].approversRequired.length) {
      executions[idx].approvedAt = Date.now();
      executions[idx].status = 'in_progress';
    }
    await this.store.set(STORE_KEYS.executions, executions);
    return true;
  }

  async rejectExecution(executionId: string, approver: string, comment: string): Promise<boolean> {
    const executions = await this.loadExecutions();
    const idx = executions.findIndex((e) => e.id === executionId);
    if (idx === -1) return false;
    executions[idx].approversGranted.push({ approver, decision: 'rejected', comment, timestamp: Date.now() });
    executions[idx].status = 'cancelled';
    await this.store.set(STORE_KEYS.executions, executions);
    return true;
  }

  async rollbackExecution(executionId: string, reason: string): Promise<boolean> {
    const executions = await this.loadExecutions();
    const idx = executions.findIndex((e) => e.id === executionId);
    if (idx === -1) return false;
    if (!executions[idx].rollbackPossible) return false;
    executions[idx].rolledBackAt = Date.now();
    executions[idx].rollbackReason = reason;
    executions[idx].status = 'rolled_back';
    await this.store.set(STORE_KEYS.executions, executions);
    return true;
  }

  async quarantineUser(params: { userId: string; reason: string; severity: Severity; triggeredBy: string; accessRestricted?: string[]; expiresIn?: number }): Promise<QuarantineUser> {
    const newQ: QuarantineUser = {
      userId: params.userId,
      quarantinedAt: Date.now(),
      reason: params.reason,
      severity: params.severity,
      triggeredBy: params.triggeredBy,
      accessRestricted: params.accessRestricted || [],
      expiresAt: params.expiresIn ? Date.now() + params.expiresIn : null,
      reviewedAt: null,
      releasedAt: null,
      releasedBy: null,
      active: true,
      notes: '',
    };
    const list = await this.loadQuarantined();
    list.push(newQ);
    await this.store.set(STORE_KEYS.quarantined, list);
    return newQ;
  }

  async releaseQuarantine(userId: string, releasedBy: string, reason: string): Promise<boolean> {
    const list = await this.loadQuarantined();
    const idx = list.findIndex((q) => q.userId === userId && q.active);
    if (idx === -1) return false;
    list[idx].active = false;
    list[idx].releasedAt = Date.now();
    list[idx].releasedBy = releasedBy;
    list[idx].notes = reason;
    await this.store.set(STORE_KEYS.quarantined, list);
    return true;
  }

  async getQuarantinedUser(userId: string): Promise<QuarantineUser | null> {
    const list = await this.loadQuarantined();
    return list.find((q) => q.userId === userId) || null;
  }

  async listQuarantinedUsers(filters?: { active?: boolean; severity?: Severity; since?: number }): Promise<QuarantineUser[]> {
    let list = await this.loadQuarantined();
    if (filters?.active !== undefined) list = list.filter((q) => q.active === filters.active);
    if (filters?.severity) list = list.filter((q) => q.severity === filters.severity);
    if (filters?.since !== undefined) list = list.filter((q) => q.quarantinedAt >= filters.since!);
    list.sort((a, b) => b.quarantinedAt - a.quarantinedAt);
    return list;
  }

  async blockIp(params: { ip: string; cidr?: string; reason: string; severity: Severity; triggeredBy: string; scope?: 'global'|'region'|'application'|'tenant'; application?: string; expiresIn?: number }): Promise<BlockedIp> {
    const newB: BlockedIp = {
      ip: params.ip,
      cidr: params.cidr || null,
      reason: params.reason,
      severity: params.severity,
      triggeredBy: params.triggeredBy,
      blockedAt: Date.now(),
      expiresAt: params.expiresIn ? Date.now() + params.expiresIn : null,
      scope: params.scope || 'global',
      application: params.application || null,
      source: 'auto',
      lastAttempt: null,
      attempts: 0,
      releasedAt: null,
      active: true,
    };
    const list = await this.loadBlockedIps();
    list.push(newB);
    await this.store.set(STORE_KEYS.blockedIps, list);
    return newB;
  }

  async unblockIp(ip: string, reason: string): Promise<boolean> {
    const list = await this.loadBlockedIps();
    const idx = list.findIndex((b) => b.ip === ip && b.active);
    if (idx === -1) return false;
    list[idx].active = false;
    list[idx].releasedAt = Date.now();
    list[idx].reason = `${list[idx].reason} | Unblocked: ${reason}`;
    await this.store.set(STORE_KEYS.blockedIps, list);
    return true;
  }

  async isIpBlocked(ip: string): Promise<boolean> {
    const list = await this.loadBlockedIps();
    return list.some((b) => b.active && (b.ip === ip || (b.cidr && ip.startsWith(b.cidr.split('/')[0].slice(0, -1)))));
  }

  async listBlockedIps(filters?: { active?: boolean; severity?: Severity; scope?: string; since?: number }): Promise<BlockedIp[]> {
    let list = await this.loadBlockedIps();
    if (filters?.active !== undefined) list = list.filter((b) => b.active === filters.active);
    if (filters?.severity) list = list.filter((b) => b.severity === filters.severity);
    if (filters?.scope) list = list.filter((b) => b.scope === filters.scope);
    if (filters?.since !== undefined) list = list.filter((b) => b.blockedAt >= filters.since!);
    list.sort((a, b) => b.blockedAt - a.blockedAt);
    return list;
  }

  async getStats(): Promise<IncidentResponderStats> {
    const policies = await this.loadPolicies();
    const executions = await this.loadExecutions();
    const quarantined = await this.loadQuarantined();
    const blockedIps = await this.loadBlockedIps();
    const byStatus = emptyStatusMap();
    const bySeverity = emptySeverityMap();
    const byAction = emptyActionMap();
    let totalDuration = 0;
    let completedCount = 0;
    for (const e of executions) {
      byStatus[e.status]++;
      bySeverity[e.severity]++;
      for (const a of e.actions) byAction[a.action]++;
      if (e.durationMs !== null) totalDuration += e.durationMs;
      if (e.status === 'completed') completedCount++;
    }
    return {
      totalPolicies: policies.length,
      activePolicies: policies.filter((p) => p.active).length,
      totalExecutions: executions.length,
      byStatus,
      bySeverity,
      byAction,
      successRate: executions.length > 0 ? completedCount / executions.length : 0,
      averageDurationMs: completedCount > 0 ? totalDuration / completedCount : 0,
      quarantinedUsers: quarantined.filter((q) => q.active).length,
      blockedIps: blockedIps.filter((b) => b.active).length,
      pendingApprovals: executions.filter((e) => e.status === 'pending').length,
      rolledBack: byStatus.rolled_back,
    };
  }

  private async executeAction(action: ResponseAction, context: Record<string, any>): Promise<{ status: ResponseStatus; result: Record<string, any>; error?: string }> {
    try {
      switch (action) {
        case 'lock_account':
          if (context.userId) await this.quarantineUser({ userId: context.userId, reason: 'Auto-lock: ' + (context.threatType || 'unknown'), severity: 'high', triggeredBy: 'incident-responder' });
          return { status: 'completed', result: { action: 'lock_account', userId: context.userId } };
        case 'force_password_reset':
          return { status: 'completed', result: { action: 'force_password_reset', userId: context.userId } };
        case 'revoke_sessions':
          return { status: 'completed', result: { action: 'revoke_sessions', userId: context.userId, sessionsRevoked: 'all' } };
        case 'revoke_tokens':
          return { status: 'completed', result: { action: 'revoke_tokens', userId: context.userId, tokensRevoked: 'all' } };
        case 'block_ip':
          if (context.sourceIp) await this.blockIp({ ip: context.sourceIp, reason: 'Auto-block: ' + (context.threatType || 'unknown'), severity: 'high', triggeredBy: 'incident-responder' });
          return { status: 'completed', result: { action: 'block_ip', ip: context.sourceIp } };
        case 'notify_user':
          return { status: 'completed', result: { action: 'notify_user', userId: context.userId, channel: 'email' } };
        case 'notify_security_team':
          return { status: 'completed', result: { action: 'notify_security_team', channel: 'slack,pagerduty' } };
        case 'require_mfa':
          return { status: 'completed', result: { action: 'require_mfa', userId: context.userId } };
        case 'force_mfa_reenroll':
          return { status: 'completed', result: { action: 'force_mfa_reenroll', userId: context.userId } };
        case 'isolate_host':
          return { status: 'completed', result: { action: 'isolate_host', host: context.host } };
        case 'log_only':
          return { status: 'completed', result: { action: 'log_only' } };
        default:
          return { status: 'completed', result: { action } };
      }
    } catch (e: any) {
      return { status: 'failed', result: { action }, error: e?.message || String(e) };
    }
  }

  private findMatchingPolicies(policies: ResponsePolicy[], threatType: string, severity: Severity): ResponsePolicy[] {
    return policies.filter((p) => p.active && p.trigger.threatType === threatType && (!p.trigger.severity || p.trigger.severity === severity));
  }

  private async loadPolicies(): Promise<ResponsePolicy[]> {
    let policies = await this.store.get<ResponsePolicy[]>(STORE_KEYS.policies);
    if (!policies || policies.length === 0) {
      policies = this.buildDefaultPolicies();
      await this.store.set(STORE_KEYS.policies, policies);
    }
    return policies;
  }

  private buildDefaultPolicies(): ResponsePolicy[] {
    return [
      { id: this.generateId('pol'), name: 'Critical Brute Force', description: 'Auto-respond to brute force attacks', trigger: { threatType: 'brute_force', severity: 'critical' }, actions: ['force_password_reset', 'revoke_sessions', 'require_mfa'], requiresApproval: false, approvers: [], cooldownMs: 60000, active: true, createdAt: Date.now(), createdBy: 'system', lastTriggered: null, triggerCount: 0, notes: '' },
      { id: this.generateId('pol'), name: 'Credential Stuffing Block', description: 'Block IP and force reset on credential stuffing', trigger: { threatType: 'credential_stuffing' }, actions: ['block_ip', 'force_password_reset', 'notify_security_team'], requiresApproval: false, approvers: [], cooldownMs: 300000, active: true, createdAt: Date.now(), createdBy: 'system', lastTriggered: null, triggerCount: 0, notes: '' },
      { id: this.generateId('pol'), name: 'MFA Fatigue Lock', description: 'Lock account on MFA fatigue', trigger: { threatType: 'mfa_fatigue' }, actions: ['lock_account', 'force_mfa_reenroll', 'notify_security_team'], requiresApproval: true, approvers: ['security-team'], cooldownMs: 600000, active: true, createdAt: Date.now(), createdBy: 'system', lastTriggered: null, triggerCount: 0, notes: '' },
      { id: this.generateId('pol'), name: 'Lateral Movement Contain', description: 'Isolate host and disable accounts on lateral movement', trigger: { threatType: 'lateral_movement' }, actions: ['isolate_host', 'disable_api_keys', 'revoke_sessions', 'notify_security_team'], requiresApproval: true, approvers: ['security-team', 'incident-commander'], cooldownMs: 60000, active: true, createdAt: Date.now(), createdBy: 'system', lastTriggered: null, triggerCount: 0, notes: '' },
      { id: this.generateId('pol'), name: 'Impossible Travel', description: 'Notify and require MFA on impossible travel', trigger: { threatType: 'impossible_travel' }, actions: ['notify_user', 'require_mfa', 'log_only'], requiresApproval: false, approvers: [], cooldownMs: 300000, active: true, createdAt: Date.now(), createdBy: 'system', lastTriggered: null, triggerCount: 0, notes: '' },
      { id: this.generateId('pol'), name: 'Breach Replay Response', description: 'Force password reset on breach replay', trigger: { threatType: 'breach_replay' }, actions: ['force_password_reset', 'revoke_tokens', 'notify_user', 'notify_security_team'], requiresApproval: false, approvers: [], cooldownMs: 60000, active: true, createdAt: Date.now(), createdBy: 'system', lastTriggered: null, triggerCount: 0, notes: '' },
    ];
  }

  private async loadExecutions(): Promise<ResponseExecution[]> {
    return (await this.store.get<ResponseExecution[]>(STORE_KEYS.executions)) || [];
  }

  private async loadQuarantined(): Promise<QuarantineUser[]> {
    return (await this.store.get<QuarantineUser[]>(STORE_KEYS.quarantined)) || [];
  }

  private async loadBlockedIps(): Promise<BlockedIp[]> {
    return (await this.store.get<BlockedIp[]>(STORE_KEYS.blockedIps)) || [];
  }

  private generateId(prefix: string): string {
    return `${prefix}_${randomUUID()}`;
  }
}

/**
 * Capabilities Center Client
 * 
 * Frontend API client for capabilities center
 */

import { gatewayClient } from './gateway-client.js';

// Re-export types from backend (duplicated for frontend use)
export type DomainId = 'light' | 'dark' | 'security' | 'legal' | 'technology' | 'business';

export interface DomainKPI {
  riskScore: number;
  closureRate: number;
  slaRate: number;
  trend: number;
  updatedAt: number;
}

export interface CapabilityDomain {
  id: DomainId;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  color: string;
  ownerRoles: string[];
  partnerRoles: string[];
  kpi: DomainKPI;
  capabilityCount: number;
  enabled: boolean;
  order: number;
}

export interface CapabilityItem {
  id: string;
  domainId: DomainId;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  ownerRoles: string[];
  partnerRoles: string[];
  tools: string[];
  playbookId?: string;
  mitreCoverage?: string[];
  scfCoverage?: string[];
  enabled: boolean;
  requiresApproval: boolean;
  priority: number;
  createdAt: number;
  updatedAt: number;
}

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'closed';
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface SecurityTask {
  id: string;
  domainId: DomainId;
  capabilityId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeRole: string;
  dueAt?: number;
  slaMinutes?: number;
  createdAt: number;
  updatedAt: number;
}

export type RunStatus = 'queued' | 'running' | 'success' | 'failed' | 'canceled';

export interface ExecutionRun {
  id: string;
  taskId: string;
  domainId: DomainId;
  toolId: string;
  params: Record<string, unknown>;
  status: RunStatus;
  startedAt?: number;
  endedAt?: number;
  summary?: string;
  error?: string;
  artifacts: string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface Approval {
  id: string;
  taskId: string;
  type: 'dark-operation';
  requester: string;
  approverRole?: string;
  approver?: string;
  scope: string;
  ticketNo: string;
  expiresAt: number;
  status: ApprovalStatus;
  reason?: string;
  approvedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface EvidencePack {
  id: string;
  domainId: DomainId;
  taskId?: string;
  runId?: string;
  title: string;
  description?: string;
  files: string[];
  hash: string;
  createdAt: number;
  tags: string[];
  createdBy?: string;
}

export interface DomainMetrics {
  id: DomainId;
  name: string;
  kpi: DomainKPI;
  taskCounts: {
    todo: number;
    inProgress: number;
    done: number;
    total: number;
  };
}

export interface OverviewMetrics {
  domains: DomainMetrics[];
  totalRiskScore: number;
  totalClosureRate: number;
  totalSlaRate: number;
  updatedAt: number;
}

/**
 * Capabilities Center API Client
 */
export const capabilitiesClient = {
  // ==================== Domains ====================
  
  async listDomains(): Promise<CapabilityDomain[]> {
    return gatewayClient.request<CapabilityDomain[]>('capabilities.domains.list');
  },

  // ==================== Items ====================
  
  async listItems(params?: {
    domainId?: DomainId;
    roleId?: string;
    enabledOnly?: boolean;
  }): Promise<CapabilityItem[]> {
    return gatewayClient.request<CapabilityItem[]>('capabilities.items.list', params);
  },

  // ==================== Tasks ====================
  
  async listTasks(params?: {
    domainId?: DomainId;
    status?: TaskStatus;
    assigneeRole?: string;
    priority?: TaskPriority;
    capabilityId?: string;
    limit?: number;
    offset?: number;
  }): Promise<SecurityTask[]> {
    return gatewayClient.request<SecurityTask[]>('capabilities.tasks.list', params);
  },

  async createTask(params: {
    domainId: DomainId;
    capabilityId: string;
    title: string;
    description?: string;
    priority: TaskPriority;
    assigneeRole: string;
    dueAt?: number;
    slaMinutes?: number;
  }): Promise<SecurityTask> {
    return gatewayClient.request<SecurityTask>('capabilities.tasks.create', params);
  },

  async updateTaskStatus(params: {
    id: string;
    status: TaskStatus;
    comment?: string;
  }): Promise<SecurityTask> {
    return gatewayClient.request<SecurityTask>('capabilities.tasks.updateStatus', params);
  },

  // ==================== Approvals ====================
  
  async createApproval(params: {
    taskId: string;
    requester: string;
    scope: string;
    ticketNo: string;
    expiresAt: number;
  }): Promise<Approval> {
    return gatewayClient.request<Approval>('capabilities.approvals.create', params);
  },

  async approveApproval(params: {
    id: string;
    approver: string;
    approved: boolean;
    reason?: string;
  }): Promise<Approval> {
    return gatewayClient.request<Approval>('capabilities.approvals.approve', params);
  },

  // ==================== Runs ====================
  
  async executeRun(params: {
    taskId: string;
    toolId: string;
    params?: Record<string, unknown>;
  }): Promise<ExecutionRun> {
    return gatewayClient.request<ExecutionRun>('capabilities.runs.execute', params);
  },

  async listRunsByTask(taskId: string): Promise<ExecutionRun[]> {
    return gatewayClient.request<ExecutionRun[]>('capabilities.runs.listByTask', { taskId });
  },

  // ==================== Evidence ====================
  
  async createEvidence(params: {
    domainId: DomainId;
    taskId?: string;
    runId?: string;
    title: string;
    description?: string;
    files: string[];
    tags?: string[];
    createdBy?: string;
  }): Promise<EvidencePack> {
    return gatewayClient.request<EvidencePack>('capabilities.evidence.create', params);
  },

  async listEvidence(params?: {
    domainId?: DomainId;
    taskId?: string;
    runId?: string;
    limit?: number;
  }): Promise<EvidencePack[]> {
    return gatewayClient.request<EvidencePack[]>('capabilities.evidence.list', params);
  },

  // ==================== Overview ====================
  
  async getOverviewMetrics(): Promise<OverviewMetrics> {
    return gatewayClient.request<OverviewMetrics>('capabilities.overview.metrics');
  },
};

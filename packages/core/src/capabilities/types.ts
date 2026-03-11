/**
 * Capabilities Center Types
 * 
 * 6大能力域 + 角色编排系统的数据类型定义
 */

// ==================== Domain Types ====================

/** 能力域ID */
export type DomainId = 'light' | 'dark' | 'security' | 'legal' | 'technology' | 'business';

/** 域级 KPI */
export interface DomainKPI {
  /** 风险评分 0-100 */
  riskScore: number;
  /** 闭环率 0-100 */
  closureRate: number;
  /** SLA达成率 0-100 */
  slaRate: number;
  /** 趋势 -1~1 */
  trend: number;
  /** 最后更新时间 */
  updatedAt: number;
}

/** 能力域 */
export interface CapabilityDomain {
  id: DomainId;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  color: string;
  /** 主责角色 */
  ownerRoles: string[];
  /** 协作角色 */
  partnerRoles: string[];
  /** KPI 指标 */
  kpi: DomainKPI;
  /** 能力数量 */
  capabilityCount: number;
  /** 是否启用 */
  enabled: boolean;
  /** 排序权重 */
  order: number;
}

// ==================== Capability Item Types ====================

/** 能力项 */
export interface CapabilityItem {
  id: string;
  domainId: DomainId;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  /** 主责角色 */
  ownerRoles: string[];
  /** 协作角色 */
  partnerRoles: string[];
  /** 关联的工具连接器ID */
  tools: string[];
  /** 关联的 Playbook ID */
  playbookId?: string;
  /** MITRE 覆盖 */
  mitreCoverage?: string[];
  /** SCF 覆盖 */
  scfCoverage?: string[];
  /** 是否启用 */
  enabled: boolean;
  /** 是否需要审批（黑暗面强制为 true） */
  requiresApproval: boolean;
  /** 优先级权重 */
  priority: number;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

// ==================== Task Types ====================

/** 任务状态 */
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'closed';

/** 任务优先级 */
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3';

/** 安全任务 */
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

// ==================== Execution Types ====================

/** 执行状态 */
export type RunStatus = 'queued' | 'running' | 'success' | 'failed' | 'canceled';

/** 执行记录 */
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
  /** 关联的证据ID */
  artifacts: string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

// ==================== Approval Types ====================

/** 审批状态 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

/** 审批单 */
export interface Approval {
  id: string;
  taskId: string;
  type: 'dark-operation';
  requester: string;
  /** 审批人角色 */
  approverRole?: string;
  approver?: string;
  /** 目标范围描述 */
  scope: string;
  /** 变更单号 */
  ticketNo: string;
  /** 有效期截止 */
  expiresAt: number;
  /** 审批状态 */
  status: ApprovalStatus;
  /** 审批原因/备注 */
  reason?: string;
  /** 审批时间 */
  approvedAt?: number;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

// ==================== Evidence Types ====================

/** 证据包 */
export interface EvidencePack {
  id: string;
  domainId: DomainId;
  taskId?: string;
  runId?: string;
  title: string;
  description?: string;
  /** 文件路径列表 */
  files: string[];
  /** 内容哈希 */
  hash: string;
  /** 创建时间 */
  createdAt: number;
  /** 标签 */
  tags: string[];
  /** 创建者 */
  createdBy?: string;
}

// ==================== Overview Metrics ====================

/** 域级指标 */
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

/** 概览指标 */
export interface OverviewMetrics {
  domains: DomainMetrics[];
  /** 总风险评分 */
  totalRiskScore: number;
  /** 总闭环率 */
  totalClosureRate: number;
  /** 总SLA达成率 */
  totalSlaRate: number;
  /** 最后更新 */
  updatedAt: number;
}

// ==================== Filter Types ====================

/** 任务查询参数 */
export interface TaskQueryParams {
  domainId?: DomainId;
  status?: TaskStatus;
  assigneeRole?: string;
  priority?: TaskPriority;
  capabilityId?: string;
  limit?: number;
  offset?: number;
}

/** 能力项查询参数 */
export interface CapabilityQueryParams {
  domainId?: DomainId;
  roleId?: string;
  enabledOnly?: boolean;
}

/** 执行记录查询参数 */
export interface RunQueryParams {
  taskId?: string;
  domainId?: DomainId;
  status?: RunStatus;
  limit?: number;
}

/** 证据查询参数 */
export interface EvidenceQueryParams {
  domainId?: DomainId;
  taskId?: string;
  runId?: string;
  limit?: number;
}

// ==================== Error Codes ====================

export const ErrorCodes = {
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  INVALID_DOMAIN: 'INVALID_DOMAIN',
  RUN_EXECUTION_FAILED: 'RUN_EXECUTION_FAILED',
  CAPABILITY_NOT_FOUND: 'CAPABILITY_NOT_FOUND',
  APPROVAL_NOT_FOUND: 'APPROVAL_NOT_FOUND',
  APPROVAL_EXPIRED: 'APPROVAL_EXPIRED',
  APPROVAL_NOT_APPROVED: 'APPROVAL_NOT_APPROVED',
  INVALID_PARAMS: 'INVALID_PARAMS',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

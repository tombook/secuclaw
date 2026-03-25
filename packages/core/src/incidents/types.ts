/**
 * Incidents Module Types
 * 安全事件数据类型定义
 */

import { DomainId } from '../capabilities/types.js';

// ==================== Incident Status ====================

/** 事件状态 */
export type IncidentStatus = 
  | 'detected'     // 已检测
  | 'reported'     // 已报告
  | 'acknowledged' // 已确认
  | 'investigating' // 调查中
  | 'containing'   // 遏制中
  | 'eradicating'  // 根除中
  | 'recovering'   // 恢复中
  | 'closed'       // 已关闭
  | 'reopened';    // 已重开

/** 事件严重程度 */
export type IncidentSeverity = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

/** 事件类别 */
export type IncidentCategory = 
  | 'intrusion'      // 入侵
  | 'malware'        // 恶意软件
  | 'data_breach'    // 数据泄露
  | 'denial_of_service' // DoS攻击
  | 'insider_threat' // 内部威胁
  | 'phishing'       // 钓鱼
  | 'vulnerability'  // 漏洞利用
  | 'configuration'  // 配置错误
  | 'other';         // 其他

// ==================== Incident Types ====================

/** 时间线 */
export interface IncidentTimeline {
  detectedAt?: number;
  reportedAt?: number;
  acknowledgedAt?: number;
  containingAt?: number;
  eradicatedAt?: number;
  recoveredAt?: number;
  closedAt?: number;
  reopenedAt?: number;
}

/** SLA */
export interface IncidentSLA {
  responseDeadline?: number;   // 响应截止时间
  resolutionDeadline?: number; // 解决截止时间
  responseBreached?: boolean;  // 响应SLA是否突破
  resolutionBreached?: boolean; // 解决SLA是否突破
  responseTimeMinutes?: number; // 实际响应时间(分钟)
  resolutionTimeMinutes?: number; // 实际解决时间(分钟)
}

/** 工作流 */
export interface IncidentWorkflow {
  status: IncidentStatus;
  assignee?: string;
  assigneeRole?: string;
  previousStatus?: IncidentStatus;
  resolver?: string;
  resolution?: string;
}

/** 影响范围 */
export interface IncidentImpact {
  affectedAssets: string[];
  affectedUsers: number;
  dataTypes: string[];
  businessImpact: string;
  estimatedLoss?: number;
  downtime?: number;
}

/** 攻击信息 */
export interface IncidentAttack {
  attackVector?: string;
  threatActor?: string;
  mitreTechniques?: string[];
  iocs?: string[];
  attackSummary?: string;
}

/** 处理记录 */
export interface IncidentHandler {
  user: string;
  role: string;
  joinedAt: number;
  actions: string[];
  notes?: string;
}

/** 安全事件 */
export interface SecurityIncident {
  id: string;
  ticketId: string;
  domainId?: DomainId;
  info: {
    title: string;
    description: string;
    category: IncidentCategory;
    severity: IncidentSeverity;
    priority: number;
    source?: string;
  };
  timeline: IncidentTimeline;
  sla: IncidentSLA;
  workflow: IncidentWorkflow;
  impact: IncidentImpact;
  attack?: IncidentAttack;
  handlers: IncidentHandler[];
  evidence?: string[];
  relatedIncidents?: string[];
  createdAt: number;
  updatedAt: number;
}

// ==================== Query Types ====================

export interface IncidentQueryParams {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  category?: IncidentCategory;
  assignee?: string;
  domainId?: DomainId;
  fromDate?: number;
  toDate?: number;
  page?: number;
  pageSize?: number;
}

export interface IncidentStats {
  total: number;
  byStatus: Record<IncidentStatus, number>;
  bySeverity: Record<IncidentSeverity, number>;
  byCategory: Record<IncidentCategory, number>;
  avgResponseTime: number;
  avgResolutionTime: number;
  slaComplianceRate: number;
}

// ==================== API Response Types ====================

export interface CreateIncidentRequest {
  domainId?: DomainId;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  source?: string;
  affectedAssets?: string[];
  affectedUsers?: number;
  dataTypes?: string[];
  businessImpact?: string;
  attackVector?: string;
  mitreTechniques?: string[];
}

export interface UpdateIncidentRequest {
  title?: string;
  description?: string;
  category?: IncidentCategory;
  severity?: IncidentSeverity;
  priority?: number;
  assignee?: string;
  assigneeRole?: string;
  status?: IncidentStatus;
  resolution?: string;
  resolver?: string;
}

export interface IncidentTimelineUpdate {
  status: IncidentStatus;
  note?: string;
  actor?: string;
}

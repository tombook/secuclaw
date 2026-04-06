/**
 * Vulnerabilities Module Types
 * 漏洞管理数据类型定义
 */

import type { DomainId } from '../capabilities/types.js';

// ==================== Vulnerability Enums ====================

/** 漏洞状态 */
export type VulnerabilityStatus = 
  | 'new'          // 新发现
  | 'confirmed'    // 已确认
  | 'in_progress'  // 修复中
  | 'fixed'        // 已修复
  | 'wont_fix'     // 不修复
  | 'false_positive' // 误报
  | 'deferred'     // 延迟处理
  | 'verified'     // 已验证;

/** 漏洞严重程度 */
export type VulnerabilitySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/** 漏洞来源 */
export type VulnerabilitySource = 
  | 'nessus'       // Nessus扫描
  | 'openvas'      // OpenVAS扫描
  | 'nmap'         // Nmap扫描
  | 'manual'       // 人工发现
  | 'bug_bounty'   // 漏洞赏金
  | 'pentest'      // 渗透测试
  | 'monitor'      // 安全监控
  | 'other';       // 其他

/** 修复优先级 */
export type VulnerabilityPriority = 'immediate' | 'high' | 'medium' | 'low';

// ==================== Vulnerability Interfaces ====================

/** CVSS评分信息 */
export interface CVSSInfo {
  version: '2.0' | '3.0' | '3.1';
  baseScore: number;
  vector: string;
  attackVector?: string;
  attackComplexity?: string;
  privilegesRequired?: string;
  userInteraction?: string;
  scope?: string;
  confidentialityImpact?: string;
  integrityImpact?: string;
  availabilityImpact?: string;
  exploitCodeMaturity?: string;
  remediationLevel?: string;
  reportConfidence?: string;
}

/** 漏洞时间线 */
export interface VulnerabilityTimeline {
  discoveredAt: number;        // 发现时间
  confirmedAt?: number;        // 确认时间
  firstReportedAt?: number;    // 首次上报时间
  remediationStartedAt?: number;// 开始修复时间
  fixedAt?: number;            // 修复完成时间
  verifiedAt?: number;         // 验证时间
  closedAt?: number;           // 关闭时间
}

/** 漏洞影响范围 */
export interface VulnerabilityImpact {
  affectedAssets: string[];     // 受影响资产ID列表
  affectedAssetCount: number;  // 受影响资产数量
  businessImpact?: string;     // 业务影响描述
  estimatedDowntime?: number;  // 预估停机时间（分钟）
  estimatedLoss?: number;      // 预估损失（元）
}

/** 修复信息 */
export interface RemediationInfo {
  description?: string;        // 修复建议
  steps?: string[];            // 修复步骤
  references?: string[];       // 参考链接
  estimatedEffort?: number;    // 预估修复工作量（人天）
  patchUrl?: string;           // 补丁下载地址
  workaround?: string;         // 临时解决方案
}

/** 安全漏洞 */
export interface SecurityVulnerability {
  id: string;
  domainId?: DomainId;
  vulnId: string;              // 漏洞ID（如CVE-2023-1234）
  title: string;               // 漏洞标题
  description: string;         // 漏洞描述
  severity: VulnerabilitySeverity;
  status: VulnerabilityStatus;
  source: VulnerabilitySource;
  priority: VulnerabilityPriority;
  cvss: CVSSInfo;
  timeline: VulnerabilityTimeline;
  impact: VulnerabilityImpact;
  remediation: RemediationInfo;
  tags: string[];
  cweIds?: string[];           // CWE ID列表
  references?: string[];       // 参考链接
  assignee?: string;           // 处理人
  notes?: string;              // 备注
  createdAt: number;
  updatedAt: number;
}

// ==================== Query Types ====================

export interface VulnerabilityQueryParams {
  status?: VulnerabilityStatus;
  severity?: VulnerabilitySeverity;
  priority?: VulnerabilityPriority;
  source?: VulnerabilitySource;
  vulnId?: string;
  assetId?: string;
  assignee?: string;
  domainId?: DomainId;
  fromDate?: number;
  toDate?: number;
  cvssScoreMin?: number;
  cvssScoreMax?: number;
  page?: number;
  pageSize?: number;
}

export interface VulnerabilityStats {
  total: number;
  byStatus: Record<VulnerabilityStatus, number>;
  bySeverity: Record<VulnerabilitySeverity, number>;
  byPriority: Record<VulnerabilityPriority, number>;
  bySource: Record<VulnerabilitySource, number>;
  avgFixTimeDays: number;
  fixRate: number;
  totalCriticalVulns: number;
  totalHighVulns: number;
  totalMediumVulns: number;
  totalLowVulns: number;
  riskScore: number;
}

// ==================== API Request/Response Types ====================

export interface CreateVulnerabilityRequest {
  domainId?: DomainId;
  vulnId: string;
  title: string;
  description: string;
  severity: VulnerabilitySeverity;
  source: VulnerabilitySource;
  cvss: CVSSInfo;
  affectedAssets?: string[];
  remediation?: Partial<RemediationInfo>;
  tags?: string[];
  cweIds?: string[];
  references?: string[];
  assignee?: string;
  notes?: string;
}

export interface UpdateVulnerabilityRequest {
  title?: string;
  description?: string;
  severity?: VulnerabilitySeverity;
  status?: VulnerabilityStatus;
  source?: VulnerabilitySource;
  priority?: VulnerabilityPriority;
  cvss?: Partial<CVSSInfo>;
  remediation?: Partial<RemediationInfo>;
  tags?: string[];
  cweIds?: string[];
  references?: string[];
  assignee?: string;
  notes?: string;
}

export interface VulnerabilityBatchImportResult {
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; vulnId: string; message: string }>;
  importedVulnIds: string[];
}
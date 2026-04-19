/**
 * API 服务层 — 封装后端 REST 接口 + Mock 数据
 * @see v2.1 文档 4.6 API 合约
 *
 * 开发阶段使用 Mock，生产环境切换为真实 API。
 * 切换方式：设置 MOCK_API=false 环境变量。
 */

import type { RoleId } from '../config/role-tool-config';
import { ROLE_DASHBOARDS, type MetricStatus } from '../config/role-dashboard-config';

// ─── Types ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  error?: { code: string; message: string; retryAfter?: number };
}

export interface OverviewData {
  score: number;
  activeEvents: number;
  pendingTasks: number;
  collabRequests: number;
}

export interface MetricData {
  id: string;
  value: number;
  trend: number[];
  updatedAt: number;
  status: MetricStatus;
}

export interface RaciTask {
  id: string;
  type: 'R' | 'A' | 'C' | 'I';
  title: string;
  status: 'pending' | 'in-progress' | 'done';
  assignee?: string;
  createdAt: number;
}

export interface CollabItem {
  id: string;
  type: 'request' | 'mention' | 'decision' | 'log';
  fromRole: RoleId;
  content: string;
  timestamp: number;
  actions?: { label: string; action: string }[];
}

export interface ToolExecuteResult {
  success: boolean;
  metrics?: Record<string, number>;
  badge?: { toolId: string; count: number };
  raciUpdate?: RaciTask;
}

export interface AlertItem {
  id: string;
  severity: 'P1' | 'P2' | 'P3';
  title: string;
  source: string;
  createdAt: number;
  status: 'new' | 'investigating' | 'resolved';
}

// ─── Mock Data Generators ─────────────────────────────────────

const MOCK_VALUES: Record<string, number> = {
  'vuln-total': 67, 'vuln-critical': 2, 'cvss-avg': 6.3,
  'patch-coverage': 82, 'mttr-vuln': 96, 'intel-match': 78,
  'gdpr-compliance': 94, 'pipl-compliance': 87, 'data-breach': 0,
  'privacy-requests': 15, 'dpia-completion': 83, 'dsr-response': 92,
  'arch-risk': 23, 'threat-coverage': 78, 'control-count': 156,
  'iam-policies': 42, 'zero-trust': 55, 'change-pending': 4,
  'bcp-score': 87, 'mttr-biz': 3.2, 'drill-pending': 2,
  'insurance-cov': 95, 'bcp-doc': 97, 'biz-impact': 0,
  'total-alerts': 234, 'mttd': 4.2, 'sec-score': 76,
  'active-events': 7, 'coord-requests': 12, 'escalations': 2,
  'risk-score': 42, 'budget-usage': 67, 'kpi-rate': 88,
  'pending-approval': 4, 'maturity': 3.8, 'audit-open': 3,
  'pending-alerts': 23, 'false-pos-rate': 14, 'mttr-ops': 8,
  'escalation-rate': 6, 'soar-rate': 73, 'soc-uptime': 99.7,
  'high-risk-vendors': 3, 'sbom-coverage': 67, '3rd-party-vulns': 12,
  'license-compliance': 93, 'critical-vendors': 8, 'vendor-total': 156,
};

function mockTrend(): number[] {
  return Array.from({ length: 30 }, () => 0.3 + Math.random() * 0.7);
}

function jitter(base: number, range: number): number {
  return Math.round((base + (Math.random() - 0.5) * range) * 10) / 10;
}

// ─── API Functions ─────────────────────────────────────────────

export async function fetchOverview(): Promise<ApiResponse<OverviewData>> {
  return {
    data: {
      score: jitter(76, 8),
      activeEvents: Math.round(jitter(7, 4)),
      pendingTasks: Math.round(jitter(23, 10)),
      collabRequests: Math.round(jitter(12, 6)),
    },
  };
}

export async function fetchRoleMetrics(roleId: RoleId): Promise<ApiResponse<MetricData[]>> {
  const dashboard = ROLE_DASHBOARDS[roleId];
  if (!dashboard) return { data: [] };

  const metrics: MetricData[] = dashboard.metrics.map((m) => {
    const base = MOCK_VALUES[m.id] ?? 50;
    const value = jitter(base, base * 0.1);
    return {
      id: m.id,
      value,
      trend: mockTrend(),
      updatedAt: Date.now() - Math.random() * 300000,
      status: 'normal' as MetricStatus, // simplified
    };
  });

  // Simulate network delay
  await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
  return { data: metrics };
}

export async function fetchRoleRaci(roleId: RoleId): Promise<ApiResponse<RaciTask[]>> {
  const now = Date.now();
  const tasks: RaciTask[] = [
    { id: `${roleId}-r1`, type: 'R', title: '执行安全扫描任务', status: 'in-progress', createdAt: now - 3600000 },
    { id: `${roleId}-r2`, type: 'R', title: '处理待办告警事件', status: 'pending', createdAt: now - 7200000 },
    { id: `${roleId}-a1`, type: 'A', title: '审批变更申请', status: 'pending', createdAt: now - 1800000 },
    { id: `${roleId}-a2`, type: 'A', title: '审批预算追加', status: 'pending', createdAt: now - 5400000 },
    { id: `${roleId}-c1`, type: 'C', title: '提供技术咨询', status: 'pending', createdAt: now - 14400000 },
    { id: `${roleId}-i1`, type: 'I', title: '知悉安全评分变化', status: 'done', createdAt: now - 600000 },
  ];
  await new Promise((r) => setTimeout(r, 150));
  return { data: tasks };
}

export async function fetchRoleCollab(roleId: RoleId): Promise<ApiResponse<CollabItem[]>> {
  const now = Date.now();
  const items: CollabItem[] = [
    {
      id: `${roleId}-cl1`, type: 'request', fromRole: 'secuclaw-commander' as RoleId,
      content: '需要你协助分析跨系统安全风险', timestamp: now - 1200000,
      actions: [{ label: '查看', action: 'view' }, { label: '接受', action: 'accept' }],
    },
    {
      id: `${roleId}-cl2`, type: 'mention', fromRole: 'security-expert' as RoleId,
      content: `@你 检测到异常活动需要确认`, timestamp: now - 3600000,
      actions: [{ label: '查看', action: 'view' }],
    },
    {
      id: `${roleId}-cl3`, type: 'decision', fromRole: 'ciso' as RoleId,
      content: '安全策略变更已审批通过', timestamp: now - 7200000,
    },
  ];
  await new Promise((r) => setTimeout(r, 100));
  return { data: items };
}

export async function fetchRoleAlerts(_roleId: RoleId): Promise<ApiResponse<AlertItem[]>> {
  const now = Date.now();
  const alerts: AlertItem[] = [
    { id: 'al1', severity: 'P1', title: '可疑进程检测：/tmp/.hidden', source: 'EDR', createdAt: now - 300000, status: 'new' },
    { id: 'al2', severity: 'P2', title: '异常登录：来自未知 IP', source: 'IAM', createdAt: now - 900000, status: 'investigating' },
    { id: 'al3', severity: 'P2', title: '端口扫描活动：192.168.1.0/24', source: 'IDS', createdAt: now - 1800000, status: 'new' },
    { id: 'al4', severity: 'P3', title: 'SSL 证书即将过期', source: 'Scanner', createdAt: now - 3600000, status: 'new' },
    { id: 'al5', severity: 'P1', title: '数据外泄检测：大量 DNS 查询', source: 'DLP', createdAt: now - 600000, status: 'new' },
  ];
  await new Promise((r) => setTimeout(r, 150));
  return { data: alerts };
}

export async function executeTool(toolId: string, roleId: RoleId, operation: string): Promise<ApiResponse<ToolExecuteResult>> {
  // Simulate tool execution
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000));
  return {
    data: {
      success: true,
      metrics: { [`${toolId}-result`]: Math.round(Math.random() * 100) },
      badge: { toolId, count: Math.round(Math.random() * 5) },
    },
  };
}

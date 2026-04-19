/**
 * SecuClaw 角色指标配置
 * 定义 8 个角色 × 6 个指标（含阈值和下钻动作）
 *
 * @see v2.0 文档 第 3.5 节 专业指标区
 */

import type { RoleId } from './role-tool-config';

// ─── Types ────────────────────────────────────────────────────

export type MetricFormat = 'integer' | 'percent' | 'score' | 'hours' | 'minutes' | 'decimal';

export type MetricStatus = 'normal' | 'warning' | 'danger' | 'target' | 'no-data';

export interface MetricThreshold {
  normal: number;     // 正常范围
  warning: number;    // 警告阈值
  danger: number;     // 危险阈值
  /** 比较方向：'below'=低于阈值危险，'above'=高于阈值危险 */
  direction: 'below' | 'above';
}

export interface MetricDef {
  id: string;
  label: string;
  icon: string;             // Lucide icon
  format: MetricFormat;
  unit?: string;
  threshold: MetricThreshold;
  drilldownTarget: string;  // 下钻跳转目标
}

export interface RoleDashboardConfig {
  roleId: RoleId;
  metrics: MetricDef[];
}

// ─── Helper ───────────────────────────────────────────────────

/** 根据阈值判断指标状态 */
export function evaluateMetric(
  metric: MetricDef,
  value: number | null
): MetricStatus {
  if (value === null) return 'no-data';

  const { threshold } = metric;
  const { direction, normal, warning, danger } = threshold;

  if (direction === 'above') {
    // 值越高越危险（如漏洞总数、告警数）
    if (value >= danger) return 'danger';
    if (value >= warning) return 'warning';
    if (value <= normal) return 'target';
    return 'normal';
  } else {
    // 值越低越危险（如覆盖率、合规率）
    if (value <= danger) return 'danger';
    if (value <= warning) return 'warning';
    if (value >= normal) return 'target';
    return 'normal';
  }
}

/** 格式化指标数值 */
export function formatMetricValue(
  value: number | null,
  format: MetricFormat,
  unit?: string
): string {
  if (value === null) return '—';
  switch (format) {
    case 'percent': return `${value}%`;
    case 'score': return `${value}/100`;
    case 'hours': return `${value}h`;
    case 'minutes': return `${value}min`;
    case 'decimal': return value.toFixed(1);
    case 'integer': default: return `${value}`;
  }
}

// ─── Role Dashboard Definitions ───────────────────────────────

export const ROLE_DASHBOARDS: Record<RoleId, RoleDashboardConfig> = {
  'security-expert': {
    roleId: 'security-expert',
    metrics: [
      { id: 'vuln-total',      label: '漏洞总数',     icon: 'ShieldAlert',  format: 'integer', threshold: { direction: 'above', normal: 50,  warning: 100, danger: 200 }, drilldownTarget: 'vuln-list' },
      { id: 'vuln-critical',   label: '高危漏洞',     icon: 'AlertTriangle', format: 'integer', threshold: { direction: 'above', normal: 0,   warning: 3,   danger: 10  }, drilldownTarget: 'cve-detail' },
      { id: 'cvss-avg',        label: 'CVSS 均分',    icon: 'BarChart3',    format: 'decimal', threshold: { direction: 'above', normal: 5.0, warning: 7.0, danger: 9.0 }, drilldownTarget: 'cvss-chart' },
      { id: 'patch-coverage',  label: '补丁覆盖率',   icon: 'PackageCheck', format: 'percent', threshold: { direction: 'below', normal: 90,  warning: 70,  danger: 50  }, drilldownTarget: 'patch-mgmt' },
      { id: 'mttr-vuln',       label: '平均修复时间', icon: 'Clock',        format: 'hours',   threshold: { direction: 'above', normal: 72,  warning: 168, danger: 336 }, drilldownTarget: 'fix-orders' },
      { id: 'intel-match',     label: '情报匹配率',   icon: 'Radio',        format: 'percent', threshold: { direction: 'below', normal: 85,  warning: 70,  danger: 50  }, drilldownTarget: 'threat-intel' },
    ],
  },

  'privacy-officer': {
    roleId: 'privacy-officer',
    metrics: [
      { id: 'gdpr-compliance',   label: 'GDPR 合规率',  icon: 'FileCheck',    format: 'percent', threshold: { direction: 'below', normal: 95,  warning: 80,  danger: 60  }, drilldownTarget: 'compliance-list' },
      { id: 'pipl-compliance',   label: 'PIPL 合规率',  icon: 'FileCheck',    format: 'percent', threshold: { direction: 'below', normal: 90,  warning: 75,  danger: 50  }, drilldownTarget: 'pipl-assessment' },
      { id: 'data-breach',       label: '数据泄露事件', icon: 'AlertOctagon', format: 'integer', threshold: { direction: 'above', normal: 0,   warning: 2,   danger: 5   }, drilldownTarget: 'breach-detail' },
      { id: 'privacy-requests',  label: '隐私请求积压', icon: 'UserCheck',    format: 'integer', threshold: { direction: 'above', normal: 10,  warning: 20,  danger: 50  }, drilldownTarget: 'privacy-queue' },
      { id: 'dpia-completion',   label: 'DPIA 完成率',  icon: 'ClipboardCheck', format: 'percent', threshold: { direction: 'below', normal: 80, warning: 60,  danger: 40  }, drilldownTarget: 'dpia-list' },
      { id: 'dsr-response',      label: '主体权利响应', icon: 'Shield',       format: 'percent', threshold: { direction: 'below', normal: 95,  warning: 80,  danger: 60  }, drilldownTarget: 'dsr-log' },
    ],
  },

  'security-architect': {
    roleId: 'security-architect',
    metrics: [
      { id: 'arch-risk',       label: '架构风险数',   icon: 'AlertTriangle', format: 'integer', threshold: { direction: 'above', normal: 10,  warning: 20,  danger: 50  }, drilldownTarget: 'threat-model' },
      { id: 'threat-coverage', label: '威胁覆盖率',   icon: 'Shield',        format: 'percent', threshold: { direction: 'below', normal: 85,  warning: 70,  danger: 50  }, drilldownTarget: 'control-eff' },
      { id: 'control-count',   label: '安全控制数',   icon: 'Database',      format: 'integer', threshold: { direction: 'below', normal: 100, warning: 50,  danger: 20  }, drilldownTarget: 'control-lib' },
      { id: 'iam-policies',    label: 'IAM 策略数',   icon: 'KeyRound',      format: 'integer', threshold: { direction: 'above', normal: 50,  warning: 60,  danger: 75  }, drilldownTarget: 'iam-config' },
      { id: 'zero-trust',      label: '零信任进度',   icon: 'Fingerprint',   format: 'percent', threshold: { direction: 'below', normal: 60,  warning: 30,  danger: 10  }, drilldownTarget: 'zero-trust-eval' },
      { id: 'change-pending',  label: '变更待审批',   icon: 'CheckCircle',   format: 'integer', threshold: { direction: 'above', normal: 5,   warning: 10,  danger: 20  }, drilldownTarget: 'approval-queue' },
    ],
  },

  'business-security-officer': {
    roleId: 'business-security-officer',
    metrics: [
      { id: 'bcp-score',       label: '连续性评分',   icon: 'ShieldCheck',   format: 'score',   threshold: { direction: 'below', normal: 85,  warning: 70,  danger: 50  }, drilldownTarget: 'bcp-detail' },
      { id: 'mttr-biz',        label: '恢复时间',     icon: 'RotateCcw',     format: 'hours',   threshold: { direction: 'above', normal: 4,   warning: 8,   danger: 24  }, drilldownTarget: 'recovery-log' },
      { id: 'drill-pending',   label: '待执行演练',   icon: 'CalendarCheck', format: 'integer', threshold: { direction: 'above', normal: 1,   warning: 3,   danger: 6   }, drilldownTarget: 'drill-plan' },
      { id: 'insurance-cov',   label: '保险覆盖率',   icon: 'Landmark',      format: 'percent', threshold: { direction: 'below', normal: 90,  warning: 70,  danger: 50  }, drilldownTarget: 'insurance-mgmt' },
      { id: 'bcp-doc',         label: 'BCP 完整性',   icon: 'FileText',      format: 'percent', threshold: { direction: 'below', normal: 95,  warning: 80,  danger: 60  }, drilldownTarget: 'doc-review' },
      { id: 'biz-impact',      label: '业务影响事件', icon: 'TrendingDown',  format: 'integer', threshold: { direction: 'above', normal: 0,   warning: 2,   danger: 5   }, drilldownTarget: 'impact-analysis' },
    ],
  },

  'secuclaw-commander': {
    roleId: 'secuclaw-commander',
    metrics: [
      { id: 'total-alerts',    label: '全域告警',     icon: 'Bell',          format: 'integer', threshold: { direction: 'above', normal: 100, warning: 300, danger: 500 }, drilldownTarget: 'global-situation' },
      { id: 'mttd',            label: '检测时间',     icon: 'Clock',         format: 'minutes', threshold: { direction: 'above', normal: 5,   warning: 15,  danger: 30  }, drilldownTarget: 'event-timeline' },
      { id: 'sec-score',       label: '安全评分',     icon: 'BarChart3',     format: 'score',   threshold: { direction: 'below', normal: 80,  warning: 60,  danger: 40  }, drilldownTarget: 'score-detail' },
      { id: 'active-events',   label: '活跃事件',     icon: 'Siren',         format: 'integer', threshold: { direction: 'above', normal: 5,   warning: 15,  danger: 30  }, drilldownTarget: 'event-list' },
      { id: 'coord-requests',  label: '协调请求',     icon: 'Users',         format: 'integer', threshold: { direction: 'above', normal: 10,  warning: 30,  danger: 50  }, drilldownTarget: 'raci-panel' },
      { id: 'escalations',     label: '升级事件',     icon: 'ArrowUpCircle', format: 'integer', threshold: { direction: 'above', normal: 3,   warning: 10,  danger: 20  }, drilldownTarget: 'escalation-log' },
    ],
  },

  'ciso': {
    roleId: 'ciso',
    metrics: [
      { id: 'risk-score',      label: '风险评分',     icon: 'BarChart3',     format: 'score',   threshold: { direction: 'above', normal: 30,  warning: 60,  danger: 80  }, drilldownTarget: 'risk-register' },
      { id: 'budget-usage',    label: '预算使用率',   icon: 'PiggyBank',     format: 'percent', threshold: { direction: 'above', normal: 80,  warning: 90,  danger: 100 }, drilldownTarget: 'budget-dash' },
      { id: 'kpi-rate',        label: 'KPI 达成率',   icon: 'Target',        format: 'percent', threshold: { direction: 'below', normal: 85,  warning: 70,  danger: 50  }, drilldownTarget: 'kpi-track' },
      { id: 'pending-approval',label: '待审批项目',   icon: 'FileText',      format: 'integer', threshold: { direction: 'above', normal: 3,   warning: 8,   danger: 15  }, drilldownTarget: 'approval-queue' },
      { id: 'maturity',        label: '成熟度评分',   icon: 'Award',         format: 'decimal', threshold: { direction: 'below', normal: 3.5, warning: 2.5, danger: 1.5 }, drilldownTarget: 'maturity-assess' },
      { id: 'audit-open',      label: '审计未关闭',   icon: 'ListChecks',    format: 'integer', threshold: { direction: 'above', normal: 5,   warning: 15,  danger: 30  }, drilldownTarget: 'audit-trail' },
    ],
  },

  'security-ops': {
    roleId: 'security-ops',
    metrics: [
      { id: 'pending-alerts',  label: '待处理告警',   icon: 'BellRing',      format: 'integer', threshold: { direction: 'above', normal: 20,  warning: 50,  danger: 100 }, drilldownTarget: 'alert-queue' },
      { id: 'false-pos-rate',  label: '误报率',       icon: 'XCircle',       format: 'percent', threshold: { direction: 'above', normal: 15,  warning: 25,  danger: 40  }, drilldownTarget: 'fp-analysis' },
      { id: 'mttr-ops',        label: '响应时间',     icon: 'Timer',         format: 'minutes', threshold: { direction: 'above', normal: 10,  warning: 30,  danger: 60  }, drilldownTarget: 'response-log' },
      { id: 'escalation-rate', label: '升级率',       icon: 'ArrowUpRight',  format: 'percent', threshold: { direction: 'above', normal: 5,   warning: 15,  danger: 25  }, drilldownTarget: 'escalation-log' },
      { id: 'soar-rate',       label: 'SOAR 处置率',  icon: 'Play',          format: 'percent', threshold: { direction: 'below', normal: 70,  warning: 50,  danger: 30  }, drilldownTarget: 'soar-report' },
      { id: 'soc-uptime',      label: 'SOC 可用性',   icon: 'Activity',      format: 'percent', threshold: { direction: 'below', normal: 99.5, warning: 99,  danger: 98  }, drilldownTarget: 'system-status' },
    ],
  },

  'supply-chain-security': {
    roleId: 'supply-chain-security',
    metrics: [
      { id: 'high-risk-vendors', label: '高风险供应商', icon: 'AlertTriangle', format: 'integer', threshold: { direction: 'above', normal: 0,   warning: 5,   danger: 10  }, drilldownTarget: 'vendor-risk' },
      { id: 'sbom-coverage',     label: 'SBOM 覆盖率', icon: 'PackageSearch', format: 'percent', threshold: { direction: 'below', normal: 80,  warning: 60,  danger: 40  }, drilldownTarget: 'sbom-mgmt' },
      { id: '3rd-party-vulns',   label: '第三方漏洞',   icon: 'Bug',          format: 'integer', threshold: { direction: 'above', normal: 10,  warning: 30,  danger: 50  }, drilldownTarget: 'vuln-correlation' },
      { id: 'license-compliance',label: '许可证合规',   icon: 'Stamp',        format: 'percent', threshold: { direction: 'below', normal: 95,  warning: 85,  danger: 70  }, drilldownTarget: 'license-audit' },
      { id: 'critical-vendors',  label: '关键供应商',   icon: 'Star',         format: 'integer', threshold: { direction: 'above', normal: 10,  warning: 15,  danger: 20  }, drilldownTarget: 'vendor-list' },
      { id: 'vendor-total',      label: '供应商总数',   icon: 'Building',     format: 'integer', threshold: { direction: 'above', normal: 200, warning: 300, danger: 500 }, drilldownTarget: 'vendor-list' },
    ],
  },
};

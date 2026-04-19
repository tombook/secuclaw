/**
 * SecuClaw Role Dashboard Configuration — React-compatible
 * Migrated from ui/src/ui/config/role-dashboard-config.ts
 */

import type { RoleId } from './role-themes';

export interface KpiCard {
  id: string;
  label: string;
  metricKey: string;
  format: 'number' | 'percentage' | 'trend';
}

export interface ChartConfig {
  type:
    | 'vulnerability-trend'
    | 'compliance-status'
    | 'incident-timeline'
    | 'risk-distribution'
    | 'asset-coverage'
    | 'threat-landscape'
    | 'supply-chain-risk'
    | 'security-score';
  dataKey: string;
}

export interface AlertFilter {
  category: string[];
  severity?: string[];
  status?: string[];
}

export interface RaciTaskSummary {
  showRSummary: boolean;
  showASummary: boolean;
  showISummary: boolean;
  label: string;
}

export interface RoleDashboardConfig {
  primaryKpis: KpiCard[];
  secondaryKpis: KpiCard[];
  mainChart: ChartConfig;
  alertFilters: AlertFilter;
  quickActions: string[];
  raciTaskSummary: RaciTaskSummary;
}

export const ROLE_DASHBOARD_CONFIG: Record<RoleId, RoleDashboardConfig> = {
  'security-expert': {
    primaryKpis: [
      { id: 'total-vulns', label: '漏洞总数', metricKey: 'vulnerabilities.total', format: 'number' },
      { id: 'critical-vulns', label: '严重漏洞', metricKey: 'vulnerabilities.critical', format: 'number' },
      { id: 'patch-coverage', label: '补丁覆盖率', metricKey: 'vulnerabilities.patchCoverage', format: 'percentage' },
    ],
    secondaryKpis: [
      { id: 'cvss-distribution', label: 'CVSS分布', metricKey: 'vulnerabilities.cvssDistribution', format: 'trend' },
      { id: 'mean-time-remediate', label: '平均修复时间', metricKey: 'vulnerabilities.mttr', format: 'trend' },
    ],
    mainChart: { type: 'vulnerability-trend', dataKey: 'vulnerabilities.trend' },
    alertFilters: { category: ['vulnerability', 'misconfiguration'], severity: ['critical', 'high', 'medium'] },
    quickActions: ['漏洞扫描', '代码审计', '渗透测试'],
    raciTaskSummary: { showRSummary: true, showASummary: false, showISummary: true, label: 'RACI 任务概览' },
  },

  'privacy-officer': {
    primaryKpis: [
      { id: 'compliance-rate', label: '合规率', metricKey: 'compliance.overall', format: 'percentage' },
      { id: 'data-breaches', label: '数据泄露事件', metricKey: 'incidents.dataBreach', format: 'number' },
      { id: 'privacy-requests', label: '隐私请求', metricKey: 'privacy.requests.pending', format: 'number' },
    ],
    secondaryKpis: [
      { id: 'dpia-completed', label: '已完成DPIA', metricKey: 'privacy.dpia.completed', format: 'number' },
      { id: 'consent-rate', label: '同意率', metricKey: 'privacy.consent.rate', format: 'percentage' },
    ],
    mainChart: { type: 'compliance-status', dataKey: 'compliance.byRegulation' },
    alertFilters: { category: ['privacy', 'data-protection', 'consent'], severity: ['high', 'critical'] },
    quickActions: ['隐私影响评估', '合规审计', '数据分类'],
    raciTaskSummary: { showRSummary: true, showASummary: false, showISummary: false, label: 'RACI 任务概览' },
  },

  'security-architect': {
    primaryKpis: [
      { id: 'design-risks', label: '架构风险数', metricKey: 'architecture.risks', format: 'number' },
      { id: 'threat-coverage', label: '威胁覆盖率', metricKey: 'architecture.threatCoverage', format: 'percentage' },
      { id: 'security-controls', label: '安全控制数', metricKey: 'architecture.controls', format: 'number' },
    ],
    secondaryKpis: [
      { id: 'technical-debt', label: '技术债务', metricKey: 'architecture.technicalDebt', format: 'trend' },
      { id: 'control-effectiveness', label: '控制有效性', metricKey: 'architecture.controlEffectiveness', format: 'percentage' },
    ],
    mainChart: { type: 'risk-distribution', dataKey: 'architecture.riskByCategory' },
    alertFilters: { category: ['architecture', 'design', 'integration'], severity: ['critical', 'high', 'medium'] },
    quickActions: ['安全架构评审', '威胁建模', '安全控制评估'],
    raciTaskSummary: { showRSummary: true, showASummary: false, showISummary: false, label: 'RACI 任务概览' },
  },

  'business-security-officer': {
    primaryKpis: [
      { id: 'business-impact', label: '业务影响事件', metricKey: 'incidents.businessImpact', format: 'number' },
      { id: 'recovery-time', label: '平均恢复时间', metricKey: 'incidents.recoveryTime', format: 'trend' },
      { id: 'continuity-score', label: '连续性评分', metricKey: 'bc.continuityScore', format: 'percentage' },
    ],
    secondaryKpis: [
      { id: 'risk-accepted', label: '已接受风险', metricKey: 'risks.accepted', format: 'number' },
      { id: 'risk-mitigated', label: '已缓解风险', metricKey: 'risks.mitigated', format: 'number' },
    ],
    mainChart: { type: 'incident-timeline', dataKey: 'incidents.byBusinessUnit' },
    alertFilters: { category: ['business-impact', 'operational', 'regulatory'], severity: ['critical', 'high'] },
    quickActions: ['业务影响评估', '风险接受评审', '应急演练'],
    raciTaskSummary: { showRSummary: false, showASummary: false, showISummary: true, label: 'RACI 任务概览' },
  },

  'secuclaw-commander': {
    primaryKpis: [
      { id: 'total-alerts', label: '总告警数', metricKey: 'alerts.total', format: 'number' },
      { id: 'mean-time-detect', label: '平均检测时间', metricKey: 'alerts.mtd', format: 'trend' },
      { id: 'security-score', label: '安全评分', metricKey: 'overall.securityScore', format: 'number' },
    ],
    secondaryKpis: [
      { id: 'coverage-rate', label: '覆盖率', metricKey: 'overall.coverageRate', format: 'percentage' },
      { id: 'automation-rate', label: '自动化率', metricKey: 'alerts.automationRate', format: 'percentage' },
    ],
    mainChart: { type: 'threat-landscape', dataKey: 'overall.threatLandscape' },
    alertFilters: { category: ['all'], severity: ['critical', 'high', 'medium', 'low'] },
    quickActions: ['全域态势', '协同响应', '资源调度'],
    raciTaskSummary: { showRSummary: false, showASummary: true, showISummary: true, label: 'RACI 任务概览' },
  },

  'ciso': {
    primaryKpis: [
      { id: 'risk-score', label: '风险评分', metricKey: 'executive.riskScore', format: 'number' },
      { id: 'budget-utilization', label: '预算使用率', metricKey: 'executive.budgetUtilization', format: 'percentage' },
      { id: 'kpi-compliance', label: 'KPI达成率', metricKey: 'executive.kpiCompliance', format: 'percentage' },
    ],
    secondaryKpis: [
      { id: 'program-maturity', label: '成熟度评分', metricKey: 'executive.maturityScore', format: 'number' },
      { id: 'stakeholder-satisfaction', label: '满意度', metricKey: 'executive.satisfaction', format: 'percentage' },
    ],
    mainChart: { type: 'security-score', dataKey: 'executive.trend' },
    alertFilters: { category: ['executive', 'strategic', 'regulatory'], severity: ['critical'] },
    quickActions: ['安全报告', '预算规划', '策略审批'],
    raciTaskSummary: { showRSummary: false, showASummary: true, showISummary: true, label: 'RACI 任务概览' },
  },

  'security-ops': {
    primaryKpis: [
      { id: 'open-alerts', label: '待处理告警', metricKey: 'alerts.open', format: 'number' },
      { id: 'false-positive-rate', label: '误报率', metricKey: 'alerts.falsePositiveRate', format: 'percentage' },
      { id: 'escalation-rate', label: '升级率', metricKey: 'alerts.escalationRate', format: 'percentage' },
    ],
    secondaryKpis: [
      { id: 'response-time', label: '响应时间', metricKey: 'alerts.responseTime', format: 'trend' },
      { id: 'automation-impact', label: '自动化效果', metricKey: 'alerts.automationImpact', format: 'trend' },
    ],
    mainChart: { type: 'threat-landscape', dataKey: 'alerts.byCategory' },
    alertFilters: { category: ['alert', 'incident', 'forensic'], severity: ['critical', 'high', 'medium'], status: ['open', 'in-progress'] },
    quickActions: ['日志分析', '入侵追踪', '事件响应'],
    raciTaskSummary: { showRSummary: true, showASummary: false, showISummary: true, label: 'RACI 任务概览' },
  },

  'supply-chain-security': {
    primaryKpis: [
      { id: 'vendor-risks', label: '供应商风险数', metricKey: 'vendors.risks', format: 'number' },
      { id: 'critical-vendors', label: '关键供应商', metricKey: 'vendors.critical', format: 'number' },
      { id: 'sbom-coverage', label: 'SBOM覆盖率', metricKey: 'dependencies.sbomCoverage', format: 'percentage' },
    ],
    secondaryKpis: [
      { id: 'known-vulnerabilities', label: '已知漏洞', metricKey: 'dependencies.knownVulns', format: 'number' },
      { id: 'license-risks', label: '许可证风险', metricKey: 'dependencies.licenseRisks', format: 'number' },
    ],
    mainChart: { type: 'supply-chain-risk', dataKey: 'vendors.riskByCategory' },
    alertFilters: { category: ['vendor', 'dependency', 'license'], severity: ['critical', 'high'] },
    quickActions: ['供应商评估', 'SBOM扫描', '依赖审查'],
    raciTaskSummary: { showRSummary: true, showASummary: false, showISummary: true, label: 'RACI 任务概览' },
  },
};

export function getRoleDashboardConfig(roleId: RoleId): RoleDashboardConfig {
  return ROLE_DASHBOARD_CONFIG[roleId] ?? ROLE_DASHBOARD_CONFIG['security-expert'];
}

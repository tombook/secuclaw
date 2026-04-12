/**
 * SecuClaw Dashboard Page - 仪表盘页面
 * 
 * 整体安全态势展示，集成AI能力
 * 包含：安全健康分、风险趋势、事件统计、漏洞概览、合规状态、能力域看板
 */
import { LitElement, html, css, svg } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { aiService, type SmartInsight, type AnomalyAlert, type TrendPrediction, type AIRecommendation } from '../ai-service.js';
import type { IncidentStats, VulnerabilityStats } from '../data-service.js';
import { gatewayClient } from '../gateway-client.js';
import { roleContext } from '../store/role-context.js';
import { ROLE_DASHBOARD_CONFIG } from '../config/role-dashboard-config.js';
import { roleFilterService } from '../services/role-filter-service.js';
import { ROLE_THEMES, type RoleId } from '../config/role-themes.js';
import '../components/sc-ai-assistant.js';
import '../components/sc-smart-card.js';
import '../components/sc-metric-card.js';
import '../components/sc-role-commander.js';
import '../components/sc-smart-recommendation-bar.js';
import '../components/design-system/sc-button.js';
import './sc-dashboard-header.js';
import './sc-dashboard-insights.js';
import './sc-dashboard-metrics.js';

type ViewMode = 'overview' | 'commander';

// ============ 类型定义 ============

// API 响应类型
interface IncidentStatsResponse {
  open?: number;
  byStatus?: {
    open?: number;
    openIncidents?: number;
  };
}

interface VulnerabilityStatsResponse {
  bySeverity?: {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
  };
}

interface RiskMetricsResponse {
  overallRiskScore?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

interface KPICalculateResponse {
  data?: {
    overallScore?: number;
    riskScore?: number;
  };
  overallScore?: number;
  riskScore?: number;
  kpi?: Record<string, number>;
  scores?: Record<string, number>;
}

interface SecurityMetric {
  id: string;
  title: string;
  value: number;
  unit?: string;
  target?: number;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
  icon: string;
  dataPoints: { label: string; value: number }[];
  aiInsight?: string;
}

interface ComplianceItem {
  name: string;
  score: number;
  status: 'compliant' | 'partial' | 'non-compliant';
}

// ============ 页面组件 ============

@customElement('sc-dashboard')
export class ScDashboard extends LitElement {
  // ============ 状态 ============

  private i18n = new I18nController(this);

  @state()
  private loading = true;

  @state()
  private metrics: SecurityMetric[] = [];

  @state()
  private complianceItems: ComplianceItem[] = [];

  @state()
  private insights: SmartInsight[] = [];

  @state()
  private anomalies: AnomalyAlert[] = [];

  @state()
  private predictions: TrendPrediction | null = null;

  @state()
  private recommendations: AIRecommendation[] = [];

  @state()
  private securityScore = 0;

  @state()
  private incidentStats: IncidentStats | null = null;

  @state()
  private vulnStats: VulnerabilityStats | null = null;

  @state()
  private currentRole: string = 'security-expert';

  @state()
  private viewMode: ViewMode = 'overview';

  private roleUnsubscribe?: () => void;

  // ============ 样式 ============

  static styles = css`
    :host {
      display: block;
    }

    .dashboard-container {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: var(--sc-spacing-lg, 20px);
      height: 100%;
    }

    .main-content {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-lg, 20px);
      overflow-y: auto;
      padding-right: var(--sc-spacing-md, 16px);
    }

    /* 页面头部 */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .page-title-section {
      flex: 1;
    }

    .page-title {
      font-size: var(--sc-font-size-2xl, 24px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
    }

    /* 一句话说明 - SMART原则 */
    .page-description {
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #64748b);
      margin-top: var(--sc-spacing-xs, 4px);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs, 6px);
    }

    .page-description-icon {
      opacity: 0.7;
    }

    .btn {
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 16px);
      border-radius: var(--sc-radius-md, 8px);
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background-color: var(--sc-primary, #3b82f6);
      color: white;
    }

    .btn-primary:hover {
      background-color: var(--sc-primary-dark, #2563eb);
    }

    .btn-secondary {
      background-color: var(--sc-bg-secondary, #f8fafc);
      color: var(--sc-text-primary, #1e293b);
      border: 1px solid var(--sc-border-color, #e2e8f0);
    }

    .btn-secondary:hover {
      background-color: var(--sc-bg-tertiary, #f1f5f9);
    }

    /* 安全评分区域 */
    .security-score-section {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: var(--sc-spacing-lg, 20px);
    }

    @media (max-width: 768px) {
      .security-score-section {
        grid-template-columns: 1fr;
      }
    }

    .score-card {
      background: linear-gradient(135deg, var(--sc-primary, #3b82f6) 0%, var(--sc-primary-dark, #2563eb) 100%);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
    }

    .score-title {
      font-size: var(--sc-font-size-sm, 14px);
      opacity: 0.9;
      margin-bottom: var(--sc-spacing-md, 16px);
    }

    .score-value {
      font-size: 64px;
      font-weight: 700;
      line-height: 1;
    }

    .score-label {
      font-size: var(--sc-font-size-lg, 18px);
      margin-top: var(--sc-spacing-sm, 8px);
      opacity: 0.9;
    }

    .score-trend {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs, 4px);
      margin-top: var(--sc-spacing-md, 16px);
      font-size: var(--sc-font-size-sm, 14px);
    }

    /* 快速统计 */
    .quick-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--sc-spacing-md, 16px);
    }

    @media (max-width: 480px) {
      .quick-stats {
        grid-template-columns: 1fr;
      }
    }

    /* AI洞察区域 */
    .insights-section {
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-md, 16px);
    }

    .section-title {
      font-size: var(--sc-font-size-lg, 18px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
    }

    .section-badge {
      font-size: var(--sc-font-size-xs, 12px);
      padding: 2px 8px;
      background-color: var(--sc-primary, #3b82f6);
      color: white;
      border-radius: var(--sc-radius-full, 999px);
    }

    .insights-list {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-sm, 8px);
    }

    .insight-item {
      display: flex;
      align-items: flex-start;
      gap: var(--sc-spacing-sm, 8px);
      padding: var(--sc-spacing-sm, 8px);
      background-color: var(--sc-bg-secondary, #f8fafc);
      border-radius: var(--sc-radius-md, 8px);
    }

    .insight-icon {
      font-size: 18px;
      flex-shrink: 0;
    }

    .insight-content {
      flex: 1;
    }

    .insight-title {
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      color: var(--sc-text-primary, #1e293b);
    }

    .insight-description {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
      margin-top: 2px;
    }

    .insight-priority {
      padding: 2px 6px;
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 500;
    }

    .insight-priority.high {
      background-color: rgba(239, 68, 68, 0.1);
      color: var(--sc-danger, #ef4444);
    }

    .insight-priority.medium {
      background-color: rgba(245, 158, 11, 0.1);
      color: var(--sc-warning, #f59e0b);
    }

    .insight-priority.low {
      background-color: rgba(34, 197, 94, 0.1);
      color: var(--sc-success, #22c55e);
    }

    /* 趋势图区域 */
    .trends-section {
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }

    .chart-container {
      height: 200px;
      width: 100%;
    }

    .chart-svg {
      width: 100%;
      height: 100%;
    }

    .chart-line {
      fill: none;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .chart-area {
      opacity: 0.1;
    }

    /* 合规状态区域 */
    .compliance-section {
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }

    .compliance-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--sc-spacing-md, 16px);
    }

    .compliance-item {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-xs, 4px);
    }

    .compliance-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .compliance-name {
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      color: var(--sc-text-primary, #1e293b);
    }

    .compliance-score {
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 600;
    }

    .compliance-score.compliant { color: var(--sc-success, #22c55e); }
    .compliance-score.partial { color: var(--sc-warning, #f59e0b); }
    .compliance-score.non-compliant { color: var(--sc-danger, #ef4444); }

    .compliance-bar {
      height: 8px;
      background-color: var(--sc-bg-tertiary, #f1f5f9);
      border-radius: var(--sc-radius-full, 999px);
      overflow: hidden;
    }

    .compliance-fill {
      height: 100%;
      border-radius: var(--sc-radius-full, 999px);
      transition: width 0.3s ease;
    }

    .compliance-fill.compliant { background-color: var(--sc-success, #22c55e); }
    .compliance-fill.partial { background-color: var(--sc-warning, #f59e0b); }
    .compliance-fill.non-compliant { background-color: var(--sc-danger, #ef4444); }

    /* 异常告警区域 */
    .anomalies-section {
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }

    .anomaly-list {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-sm, 8px);
    }

    .anomaly-item {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md, 16px);
      padding: var(--sc-spacing-sm, 8px);
      border-left: 3px solid;
      padding-left: var(--sc-spacing-md, 16px);
      background-color: var(--sc-bg-secondary, #f8fafc);
      border-radius: 0 var(--sc-radius-md, 8px) var(--sc-radius-md, 8px) 0;
    }

    .anomaly-item.critical { border-left-color: var(--sc-danger, #ef4444); }
    .anomaly-item.high { border-left-color: var(--sc-warning, #f59e0b); }
    .anomaly-item.medium { border-left-color: var(--sc-primary, #3b82f6); }

    .anomaly-severity {
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 600;
      padding: 2px 6px;
      border-radius: var(--sc-radius-sm, 4px);
      text-transform: uppercase;
    }

    .anomaly-severity.critical {
      background-color: rgba(239, 68, 68, 0.1);
      color: var(--sc-danger, #ef4444);
    }

    .anomaly-severity.high {
      background-color: rgba(245, 158, 11, 0.1);
      color: var(--sc-warning, #f59e0b);
    }

    .anomaly-content {
      flex: 1;
    }

    .anomaly-metric {
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      color: var(--sc-text-primary, #1e293b);
    }

    .anomaly-detail {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
    }

    /* AI助手侧边栏 */
    .ai-sidebar {
      position: sticky;
      top: 0;
      height: calc(100vh - var(--sc-spacing-lg, 20px) * 2);
      overflow: hidden;
    }

    /* RACI任务概览区域 */
    .raci-summary-section {
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
      margin-bottom: var(--sc-spacing-lg, 20px);
    }

    .raci-summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-md, 16px);
    }

    .raci-summary-title {
      font-size: var(--sc-font-size-lg, 18px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
    }

    .raci-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--sc-spacing-md, 16px);
    }

    .raci-card {
      background-color: var(--sc-bg-secondary, #f8fafc);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-md, 8px);
      padding: var(--sc-spacing-md, 16px);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: all var(--sc-transition-fast, 0.2s ease);
    }

    .raci-card:hover {
      border-color: var(--sc-primary, #3b82f6);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .raci-card-icon {
      font-size: 32px;
      margin-bottom: var(--sc-spacing-sm, 8px);
    }

    .raci-card-value {
      font-size: var(--sc-font-size-2xl, 24px);
      font-weight: 700;
      color: var(--sc-primary, #3b82f6);
      margin-bottom: var(--sc-spacing-xs, 4px);
    }

    .raci-card-label {
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #64748b);
      font-weight: 500;
    }

    .raci-badge {
      padding: var(--sc-spacing-xs, 4px) var(--sc-spacing-sm, 8px);
      border-radius: var(--sc-radius-full, 999px);
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 600;
    }

    .raci-badge.r {
      background-color: rgba(59, 130, 246, 0.1);
      color: var(--sc-primary, #3b82f6);
    }

    .raci-badge.a {
      background-color: rgba(239, 68, 68, 0.1);
      color: var(--sc-danger, #ef4444);
    }

    .raci-badge.c {
      background-color: rgba(16, 185, 129, 0.1);
      color: var(--sc-success, #10b981);
    }

    .raci-badge.i {
      background-color: rgba(245, 158, 11, 0.1);
      color: var(--sc-warning, #f59e0b);
    }
  `;

  // ============ 生命周期 ============

  constructor() {
    super();
    const saved = localStorage.getItem('secuclaw-view-mode') as ViewMode;
    if (saved) {
      this.viewMode = saved;
    }
    this.currentRole = roleContext.getState().currentRole || 'security-expert';
    this.loadDashboardData();
  }

  connectedCallback() {
    super.connectedCallback();
    this.roleUnsubscribe = roleContext.subscribe((state) => {
      if (state.currentRole && state.currentRole !== this.currentRole) {
        this.currentRole = state.currentRole;
        this.loadDashboardData();
      }
    });
    this.addEventListener('back-to-overview', this.handleBackToOverview as EventListener);
    this.addEventListener('enter-commander', this.handleEnterCommander as EventListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.roleUnsubscribe?.();
    this.removeEventListener('back-to-overview', this.handleBackToOverview as EventListener);
    this.removeEventListener('enter-commander', this.handleEnterCommander as EventListener);
  }

  private handleBackToOverview = () => {
    this.viewMode = 'overview';
    localStorage.setItem('secuclaw-view-mode', 'overview');
  };

  private handleEnterCommander = (e: CustomEvent) => {
    if (e.detail?.roleId) {
      roleContext.setRole(e.detail.roleId as RoleId);
    }
    this.viewMode = 'commander';
    localStorage.setItem('secuclaw-view-mode', 'commander');
  };

  private switchToCommander(roleId: string) {
    roleContext.setRole(roleId as RoleId);
    this.viewMode = 'commander';
    localStorage.setItem('secuclaw-view-mode', 'commander');
  }

  private async loadDashboardData() {
    this.loading = true;
    
    try {
      // 加载真实数据
      await Promise.all([
        this.loadMetrics(),
        this.loadCompliance(),
        this.loadAIInsights(),
        this.loadIncidentStats(),
        this.loadVulnStats(),
      ]);
      
      this.securityScore = this.calculateSecurityScore();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      this.loading = false;
    }
  }

  private async loadMetrics() {
    // 通过后端 websocket 提供的聚合指标，优先使用真实数据，失败回退到 mock
    let openIncidents = 12;
    let critVulns = 5;
    let riskScore = 72;
    try {
      const [incStats, vulnStats, riskRes] = await Promise.all([
        gatewayClient.request<IncidentStatsResponse>('incidents.stats', {}),
        gatewayClient.request<VulnerabilityStatsResponse>('vulnerabilities.stats', {}),
        gatewayClient.request<RiskMetricsResponse>('risk.getMetrics', {}),
      ]);

      // incidents.stats
      if (incStats && typeof incStats === 'object') {
        // 兼容后端返回结构，优先通过 byStatus.open / open 字段
        openIncidents = incStats.open ?? incStats.byStatus?.open ?? incStats.byStatus?.openIncidents ?? openIncidents;
      }

      // vulnerabilities.stats
      if (vulnStats && typeof vulnStats === 'object') {
        const crit = vulnStats.bySeverity?.critical ?? 0;
        const high = vulnStats.bySeverity?.high ?? 0;
        critVulns = crit + high;
      }

      // risk.getMetrics
      if (riskRes && typeof riskRes === 'object') {
        riskScore = riskRes.overallRiskScore ?? riskScore;
      }
    } catch {
      // keep defaults on failure
    }

    const roleConfig = ROLE_DASHBOARD_CONFIG[this.currentRole as keyof typeof ROLE_DASHBOARD_CONFIG];
    const primaryKpis = roleConfig?.primaryKpis || [];

    this.metrics = [
      {
        id: 'risk-score',
        title: primaryKpis.find(k => k.id === 'risk-score')?.label || '风险评分',
        value: riskScore,
        unit: '分',
        target: 85,
        status: riskScore >= 80 ? 'healthy' : riskScore >= 60 ? 'warning' : 'critical',
        trend: 'up',
        trendValue: '+5%',
        icon: '📊',
        dataPoints: this.generateMockDataPoints(7, 60, 80),
        aiInsight: '风险评分持续改善，建议关注供应链安全'
      },
      {
        id: 'open-incidents',
        title: primaryKpis.find(k => k.id === 'open-incidents')?.label || '待处理事件',
        value: openIncidents,
        unit: '个',
        target: 5,
        status: openIncidents > 10 ? 'critical' : openIncidents > 5 ? 'warning' : 'healthy',
        trend: 'down',
        trendValue: '-3',
        icon: '🚨',
        dataPoints: this.generateMockDataPoints(7, 10, 25),
        aiInsight: `${openIncidents}个待处理事件需要关注`
      },
      {
        id: 'critical-vulns',
        title: primaryKpis.find(k => k.id === 'critical-vulns')?.label || '高危漏洞',
        value: critVulns,
        unit: '个',
        target: 0,
        status: critVulns > 5 ? 'critical' : critVulns > 2 ? 'warning' : 'healthy',
        trend: 'stable',
        trendValue: '0',
        icon: '🐛',
        dataPoints: this.generateMockDataPoints(7, 3, 8),
        aiInsight: 'CVE-2024-XXXX 需优先修复'
      },
      {
        id: 'threat-ioc',
        title: '活跃威胁指标',
        value: 156,
        unit: '个',
        status: 'healthy',
        trend: 'up',
        trendValue: '+23',
        icon: '🎯',
        dataPoints: this.generateMockDataPoints(7, 100, 180),
        aiInsight: '新增APT组织相关IOC，已自动关联'
      }
    ];
  }

  private async loadCompliance() {
    try {
      const scfRes = await gatewayClient.request<{ totalDomains?: number; totalControls?: number; compliantCount?: number }>('knowledge.scf.stats', {});
      if (scfRes && typeof scfRes === 'object') {
        const totalDomains = scfRes.totalDomains ?? 0;
        const totalControls = scfRes.totalControls ?? 0;
        const compliantCount = scfRes.compliantCount ?? 0;
        if (totalDomains > 0 || totalControls > 0) {
          const domainsScore = totalDomains > 0 ? Math.round((compliantCount / totalDomains) * 100) : 0;
          const controlsScore = totalControls > 0 ? Math.round((compliantCount / totalControls) * 100) : 0;
          this.complianceItems = [
            {
              name: 'Domains',
              score: domainsScore,
              status: domainsScore >= 80 ? 'compliant' as const : domainsScore >= 60 ? 'partial' as const : 'non-compliant' as const,
            },
            {
              name: 'Controls',
              score: controlsScore,
              status: controlsScore >= 80 ? 'compliant' as const : controlsScore >= 60 ? 'partial' as const : 'non-compliant' as const,
            },
          ];
          return;
        }
      }
    } catch {
      // fall back to mock data below
    }
    // Fallback mock data
    this.complianceItems = [
      { name: 'GDPR', score: 85, status: 'partial' as const },
      { name: 'SOC 2', score: 75, status: 'partial' as const },
      { name: 'ISO 27001', score: 92, status: 'compliant' as const },
      { name: 'PIPL', score: 68, status: 'non-compliant' as const },
      { name: 'NIST CSF', score: 88, status: 'compliant' as const },
      { name: '等保2.0', score: 78, status: 'partial' as const }
    ];
  }

  private async loadAIInsights() {
    try {
      this.insights = await aiService.generateInsights({
        pageId: 'dashboard',
        data: { metrics: this.metrics, compliance: this.complianceItems },
        userRole: this.currentRole,
      });

      this.anomalies = await aiService.detectAnomalies({
        pageId: 'dashboard',
        metrics: this.metrics.map(m => ({ name: m.title, value: m.value })),
      });

      const riskMetric = this.metrics.find(m => m.id === 'risk-score');
      this.predictions = await aiService.predictTrend({
        metric: 'risk-score',
        historicalData: riskMetric?.dataPoints?.map(dp => ({
          date: new Date(dp.label),
          value: dp.value,
        })) || [],
        timeframe: '30d',
      });

      this.recommendations = await aiService.generateRecommendations({
        pageId: 'dashboard',
        data: { insights: this.insights, anomalies: this.anomalies },
        userRole: this.currentRole,
      });
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    }
  }

  private async loadIncidentStats() {
    try {
      const res = await gatewayClient.request<IncidentStatsResponse>('incidents.stats', {});
      this.incidentStats = res as IncidentStats;
      // Update metrics with real data
      if (this.incidentStats) {
        const metric = this.metrics.find(m => m.id === 'open-incidents');
        if (metric) {
          const incRes = this.incidentStats as unknown as IncidentStatsResponse;
          const openCount = incRes.open ?? incRes.byStatus?.open ?? 0;
          metric.value = incRes.open ?? incRes.byStatus?.open ?? metric.value;
          metric.status = openCount > 10 ? 'critical' : openCount > 5 ? 'warning' : 'healthy';
        }
      }
    } catch (error) {
      console.error('Failed to load incident stats:', error);
    }
  }

  private async loadVulnStats() {
    try {
      const res = await gatewayClient.request<VulnerabilityStatsResponse>('vulnerabilities.stats', {});
      this.vulnStats = res as VulnerabilityStats;
      if (this.vulnStats) {
        const vulnRes = this.vulnStats as unknown as VulnerabilityStatsResponse;
        const critical = vulnRes.bySeverity?.critical || 0;
        const high = vulnRes.bySeverity?.high || 0;
        const metric = this.metrics.find(m => m.id === 'critical-vulns');
        if (metric) {
          metric.value = critical + high;
          metric.status = metric.value > 5 ? 'critical' : metric.value > 2 ? 'warning' : 'healthy';
        }
      }
    } catch (error) {
      console.error('Failed to load vulnerability stats:', error);
    }
  }

  private async loadKPI() {
    try {
      const res = await gatewayClient.request<KPICalculateResponse>('kpi.calculate', {});
      const data = res?.data ?? res;
      if (data && typeof data === 'object') {
        const scoreMetric = this.metrics.find(m => m.id === 'risk-score');
        if (scoreMetric && (data.overallScore ?? data.riskScore)) {
          scoreMetric.value = data.overallScore ?? data.riskScore ?? scoreMetric.value;
          scoreMetric.status = scoreMetric.value >= 80 ? 'healthy' : scoreMetric.value >= 60 ? 'warning' : 'critical';
        }
        this.securityScore = this.calculateSecurityScore();
        this.showToast('KPI已重新计算', 'success');
      }
    } catch (e) {
      console.error('[dashboard] loadKPI failed:', e);
      this.showToast('KPI计算失败', 'error');
    }
  }

  @state()
  private toastMessage: string = '';

  @state()
  private toastType: 'success' | 'error' | 'info' = 'info';

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastMessage = message;
    this.toastType = type;
    window.setTimeout(() => {
      this.toastMessage = '';
      this.requestUpdate();
    }, 3000);
  }

  private generateMockDataPoints(count: number, min: number, max: number): { label: string; value: number }[] {
    const points = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      points.push({
        label: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        value: Math.floor(Math.random() * (max - min + 1)) + min
      });
    }
    return points;
  }

  private calculateSecurityScore(): number {
    // 基于各项指标计算综合安全评分
    const complianceAvg = this.complianceItems.length > 0
      ? this.complianceItems.reduce((sum, item) => sum + item.score, 0) / this.complianceItems.length
      : 75;
    const riskScore = this.metrics.find(m => m.id === 'risk-score')?.value || 72;
    const incidentPenalty = Math.min((this.metrics.find(m => m.id === 'open-incidents')?.value || 0) * 2, 20);
    const vulnPenalty = Math.min((this.metrics.find(m => m.id === 'critical-vulns')?.value || 0) * 3, 15);

    return Math.round((complianceAvg * 0.3 + riskScore * 0.4 + 100 - incidentPenalty - vulnPenalty) * 0.3);
  }

  // ============ 渲染方法 ============

  private renderSecurityScore() {
    const scoreClass = this.securityScore >= 80 ? 'healthy' : this.securityScore >= 60 ? 'warning' : 'critical';
    
    return html`
      <div class="security-score-section">
        <div class="score-card ${scoreClass}">
          <div class="score-title">整体安全评分</div>
          <div class="score-value">${this.securityScore}</div>
          <div class="score-label">${this.i18n.t('dashboard.scoreLabel') || '安全态势'}</div>
          <div class="score-trend">
            <span>▲</span>
            <span>+${Math.floor(Math.random() * 5) + 1} 本周</span>
          </div>
        </div>
        
        <div class="quick-stats">
          ${this.metrics.map(metric => html`
            <sc-metric-card
              .title=${metric.title}
              .value=${metric.value}
              .unit=${metric.unit}
              .target=${metric.target}
              .status=${metric.status}
              .icon=${metric.icon}
              .dataPoints=${metric.dataPoints}
              .aiInsight=${metric.aiInsight}
            ></sc-metric-card>
          `)}
        </div>
      </div>
    `;
  }

  private renderInsights() {
    const displayInsights = this.insights.slice(0, 5);
    
    return html`
      <div class="insights-section">
        <div class="section-header">
          <h3 class="section-title">
            <span>🤖</span>
            AI智能洞察
            <span class="section-badge">${this.insights.length}</span>
          </h3>
        </div>
        <div class="insights-list">
          ${displayInsights.length > 0 ? displayInsights.map(insight => html`
            <div class="insight-item">
              <span class="insight-icon">${insight.type === 'warning' ? '⚠️' : insight.type === 'recommendation' ? '💡' : 'ℹ️'}</span>
              <div class="insight-content">
                <div class="insight-title">${insight.title}</div>
                <div class="insight-description">${insight.description}</div>
              </div>
              <span class="insight-priority ${insight.priority}">${insight.priority}</span>
            </div>
          `) : html`
            <div class="insight-item">
              <span class="insight-icon">✅</span>
              <div class="insight-content">
                <div class="insight-title">系统运行正常</div>
                <div class="insight-description">当前没有需要关注的安全洞察</div>
              </div>
            </div>
          `}
        </div>
      </div>
    `;
  }

  private renderTrendsChart() {
    const riskMetric = this.metrics.find(m => m.id === 'risk-score');
    if (!riskMetric) return html``;

    const dataPoints = riskMetric.dataPoints;
    const values = dataPoints.map(d => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    const width = 600;
    const height = 180;
    const padding = 20;

    const points = values.map((val, i) => {
      const x = padding + (i / (values.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    });

    const areaPoints = [
      `${padding},${height - padding}`,
      ...points,
      `${width - padding},${height - padding}`
    ];

    return html`
      <div class="trends-section">
        <div class="section-header">
          <h3 class="section-title">📈 风险趋势 (7天)</h3>
        </div>
        <div class="chart-container">
          <svg class="chart-svg" viewBox="0 0 ${width} ${height}">
            <defs>
              <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--sc-primary, #3b82f6)" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="var(--sc-primary, #3b82f6)" stop-opacity="0.05"/>
              </linearGradient>
            </defs>
            <!-- 网格线 -->
            ${[0, 0.25, 0.5, 0.75, 1].map(ratio => svg`
              <line
                x1=${padding}
                y1=${padding + ratio * (height - 2 * padding)}
                x2=${width - padding}
                y2=${padding + ratio * (height - 2 * padding)}
                stroke="var(--sc-border-color, #e2e8f0)"
                stroke-dasharray="4,4"
              />
            `)}
            <!-- 区域填充 -->
            <path
              d="M ${areaPoints.join(' L ')} Z"
              fill="url(#trend-gradient)"
            />
            <!-- 趋势线 -->
            <path
              d="M ${points.join(' L ')}"
              class="chart-line"
              stroke="var(--sc-primary, #3b82f6)"
            />
            <!-- 数据点 -->
            ${values.map((val, i) => {
              const x = padding + (i / (values.length - 1)) * (width - 2 * padding);
              const y = height - padding - ((val - min) / range) * (height - 2 * padding);
              return svg`
                <circle cx=${x} cy=${y} r="4" fill="var(--sc-primary, #3b82f6)" />
              `;
            })}
            <!-- X轴标签 -->
            ${dataPoints.map((point, i) => {
              const x = padding + (i / (dataPoints.length - 1)) * (width - 2 * padding);
              return svg`
                <text x=${x} y=${height - 5} text-anchor="middle" fill="var(--sc-text-tertiary, #94a3b8)" font-size="10">
                  ${point.label}
                </text>
              `;
            })}
          </svg>
        </div>
      </div>
    `;
  }

  private renderCompliance() {
    return html`
      <div class="compliance-section">
        <div class="section-header">
          <h3 class="section-title">✅ 合规状态</h3>
        </div>
        <div class="compliance-grid">
          ${this.complianceItems.map(item => html`
            <div class="compliance-item">
              <div class="compliance-header">
                <span class="compliance-name">${item.name}</span>
                <span class="compliance-score ${item.status}">${item.score}%</span>
              </div>
              <div class="compliance-bar">
                <div 
                  class="compliance-fill ${item.status}" 
                  style="width: ${item.score}%"
                ></div>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private renderRaciSummary() {
    const roleConfig = ROLE_DASHBOARD_CONFIG[this.currentRole as keyof typeof ROLE_DASHBOARD_CONFIG];
    if (!roleConfig || !roleConfig.raciTaskSummary) return html``;

    const { showRSummary, showASummary, showISummary, label } = roleConfig.raciTaskSummary;

    const rCount = this.getRaciCount('R');
    const aCount = this.getRaciCount('A');
    const iCount = this.getRaciCount('I');

    const theme = ROLE_THEMES[this.currentRole as RoleId];

    return html`
      <div class="raci-summary-section">
        <div class="raci-summary-header">
          <h3 class="raci-summary-title">
            <span>🎯</span>
            ${label || 'RACI 任务概览'}
          </h3>
          <sc-button 
            variant="primary"
            @click=${() => this.switchToCommander(this.currentRole)}
          >
            🎖️ 进入${theme?.nameCn || '角色'}指挥台
          </sc-button>
        </div>
        <div class="raci-summary-grid">
          ${showRSummary ? html`
            <div class="raci-card">
              <div class="raci-card-icon">🔵</div>
              <div class="raci-badge r">R</div>
              <div class="raci-card-value">${rCount}</div>
              <div class="raci-card-label">待执行任务</div>
            </div>
          ` : ''}
          ${showASummary ? html`
            <div class="raci-card">
              <div class="raci-card-icon">🔴</div>
              <div class="raci-badge a">A</div>
              <div class="raci-card-value">${aCount}</div>
              <div class="raci-card-label">待审批任务</div>
            </div>
          ` : ''}
          ${showISummary ? html`
            <div class="raci-card">
              <div class="raci-card-icon">🟠</div>
              <div class="raci-badge i">I</div>
              <div class="raci-card-value">${iCount}</div>
              <div class="raci-card-label">未读通知</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private getRaciCount(raciType: 'R' | 'A' | 'I'): number {
    const raciAssignments = roleContext.getRaciAssignments();
    let count = 0;

    raciAssignments.scenarios.forEach(scenario => {
      if (scenario.raciRole === raciType) {
        count += Math.floor(Math.random() * 5) + 1;
      }
    });

    return count;
  }

  private renderAnomalies() {
    const displayAnomalies = this.anomalies.slice(0, 3);
    
    return html`
      <div class="anomalies-section">
        <div class="section-header">
          <h3 class="section-title">
            🚨 异常告警
            ${this.anomalies.length > 0 ? html`<span class="section-badge">${this.anomalies.length}</span>` : ''}
          </h3>
        </div>
        <div class="anomaly-list">
          ${displayAnomalies.length > 0 ? displayAnomalies.map(anomaly => html`
            <div class="anomaly-item ${anomaly.severity}">
              <span class="anomaly-severity ${anomaly.severity}">${anomaly.severity}</span>
              <div class="anomaly-content">
                <div class="anomaly-metric">${anomaly.metric}</div>
                <div class="anomaly-detail">
                  当前: ${anomaly.currentValue} | 预期: ${anomaly.expectedValue} | 偏差: ${anomaly.deviation}%
                </div>
              </div>
            </div>
          `) : html`
            <div class="anomaly-item">
              <div class="anomaly-content">
                <div class="anomaly-metric">无异常检测</div>
                <div class="anomaly-detail">所有指标运行正常</div>
              </div>
            </div>
          `}
        </div>
      </div>
    `;
  }

  render() {
    if (this.viewMode === 'commander') {
      return html`<sc-role-commander></sc-role-commander>`;
    }

    if (this.loading) {
      return html`
        <div style="text-align: center; padding: 2rem;">
          <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
          <div style="color: var(--sc-text-secondary);">${this.i18n.t('common.loading')}</div>
        </div>
      `;
    }

    return html`
      <sc-smart-recommendation-bar></sc-smart-recommendation-bar>
      <div class="dashboard-container">
        <div class="main-content">
          ${this.toastMessage ? html`<div style="padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:14px;background:${this.toastType === 'success' ? '#d4edda' : '#f8d7da'};color:${this.toastType === 'success' ? '#155724' : '#721c24'}">
            ${this.toastType === 'success' ? '✅' : '❌'} ${this.toastMessage}
          </div>` : ''}
          
          <sc-dashboard-header
            @refresh=${() => this.loadDashboardData()}
            @kpi-calc=${() => this.loadKPI()}
          ></sc-dashboard-header>
 
          ${this.renderSecurityScore()}
          ${this.renderRaciSummary()}
          ${this.renderInsights()}
          ${this.renderTrendsChart()}
          ${this.renderCompliance()}
          ${this.renderAnomalies()}
        </div>

        <div class="ai-sidebar">
          <sc-ai-assistant
            pageId="dashboard"
            pageTitle="仪表盘"
            .pageData=${{
              metrics: this.metrics,
              compliance: this.complianceItems,
              score: this.securityScore,
              predictions: this.predictions,
              recommendations: this.recommendations,
            }}
            .userRole=${this.currentRole}
          ></sc-ai-assistant>
        </div>
      </div>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'sc-dashboard': ScDashboard;
  }
}

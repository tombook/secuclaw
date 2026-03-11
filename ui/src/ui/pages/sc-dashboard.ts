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
import '../components/sc-ai-assistant.js';
import '../components/sc-smart-card.js';
import '../components/sc-metric-card.js';

// ============ 类型定义 ============

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
  private predictions: TrendPrediction[] = [];

  @state()
  private recommendations: AIRecommendation[] = [];

  @state()
  private securityScore = 0;

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

    @media (max-width: 1200px) {
      .dashboard-container {
        grid-template-columns: 1fr;
      }
    }

    /* 页面头部 */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-title {
      font-size: var(--sc-font-size-2xl, 24px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
    }

    .header-actions {
      display: flex;
      gap: var(--sc-spacing-sm, 8px);
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
  `;

  // ============ 生命周期 ============

  constructor() {
    super();
    this.loadDashboardData();
  }

  private async loadDashboardData() {
    this.loading = true;
    
    try {
      // 模拟数据加载
      await this.loadMetrics();
      await this.loadCompliance();
      await this.loadAIInsights();
      
      this.securityScore = this.calculateSecurityScore();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      this.loading = false;
    }
  }

  private async loadMetrics() {
    // 模拟安全指标数据
    this.metrics = [
      {
        id: 'risk-score',
        title: '风险评分',
        value: 72,
        unit: '分',
        target: 85,
        status: 'warning',
        trend: 'up',
        trendValue: '+5%',
        icon: '📊',
        dataPoints: this.generateMockDataPoints(7, 60, 80),
        aiInsight: '风险评分持续改善，建议关注供应链安全'
      },
      {
        id: 'open-incidents',
        title: '待处理事件',
        value: 12,
        unit: '个',
        target: 5,
        status: 'critical',
        trend: 'down',
        trendValue: '-3',
        icon: '🚨',
        dataPoints: this.generateMockDataPoints(7, 10, 25),
        aiInsight: '3个高优先级事件需要立即处理'
      },
      {
        id: 'critical-vulns',
        title: '高危漏洞',
        value: 5,
        unit: '个',
        target: 0,
        status: 'warning',
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
    this.complianceItems = [
      { name: 'GDPR', score: 85, status: 'partial' },
      { name: 'SOC 2', score: 75, status: 'partial' },
      { name: 'ISO 27001', score: 92, status: 'compliant' },
      { name: 'PIPL', score: 68, status: 'non-compliant' },
      { name: 'NIST CSF', score: 88, status: 'compliant' },
      { name: '等保2.0', score: 78, status: 'partial' }
    ];
  }

  private async loadAIInsights() {
    try {
      // 获取AI洞察
      this.insights = await aiService.generateInsights('dashboard', {
        metrics: this.metrics,
        compliance: this.complianceItems
      });

      // 获取异常检测
      this.anomalies = await aiService.detectAnomalies('dashboard', {
        metrics: this.metrics
      });

      // 获取趋势预测
      this.predictions = await aiService.predictTrend('dashboard', {
        metric: 'risk-score',
        timeframe: '30d'
      });

      // 获取建议
      this.recommendations = await aiService.generateRecommendations('dashboard', {
        insights: this.insights,
        anomalies: this.anomalies
      });
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    }
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
    const complianceAvg = this.complianceItems.reduce((sum, item) => sum + item.score, 0) / this.complianceItems.length;
    const riskScore = this.metrics.find(m => m.id === 'risk-score')?.value || 0;
    const incidentPenalty = Math.min((this.metrics.find(m => m.id === 'open-incidents')?.value || 0) * 2, 20);
    const vulnPenalty = Math.min((this.metrics.find(m => m.id === 'critical-vulns')?.value || 0) * 3, 15);
    
    return Math.round((complianceAvg * 0.3 + riskScore * 0.4 + 100 - incidentPenalty - vulnPenalty) * 0.3);
  }

  // ============ 渲染方法 ============

  private renderSecurityScore() {
    const scoreClass = this.securityScore >= 80 ? 'healthy' : this.securityScore >= 60 ? 'warning' : 'critical';
    
    return html`
      <div class="security-score-section">
        <div class="score-card">
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
    if (this.loading) {
      return html`
        <div style="text-align: center; padding: 2rem;">
          <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
          <div style="color: var(--sc-text-secondary);">${this.i18n.t('common.loading')}</div>
        </div>
      `;
    }

    return html`
      <div class="dashboard-container">
        <div class="main-content">
          <div class="page-header">
            <h1 class="page-title">${this.i18n.t('nav.dashboard') || '仪表盘'}</h1>
            <div class="header-actions">
              <button class="btn btn-secondary" @click=${() => this.loadDashboardData()}>
                🔄 刷新
              </button>
              <button class="btn btn-primary">
                📊 生成报告
              </button>
            </div>
          </div>

          ${this.renderSecurityScore()}
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
              score: this.securityScore
            }}
            userRole="security-expert"
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

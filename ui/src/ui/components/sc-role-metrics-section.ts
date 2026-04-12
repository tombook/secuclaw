import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { RoleId } from '../config/role-themes.js';
import { ROLE_THEMES } from '../config/role-themes.js';
import { dataService } from '../data-service.js';

export interface MetricCard {
  id: string;
  label: string;
  value: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  status?: 'healthy' | 'warning' | 'critical';
  sparkline?: number[];
  anomalyScore?: number;
  drillDownData?: Record<string, unknown>;
}

interface IncidentStats {
  open?: number;
  bySeverity?: Record<string, number>;
}

interface VulnStats {
  bySeverity?: Record<string, number>;
}

interface ComplianceStats {
  overallScore?: number;
  pendingTasks?: number;
}

@customElement('sc-role-metrics-section')
export class ScRoleMetricsSection extends LitElement {
  @state() private metrics: MetricCard[] = [];
  @state() private selectedMetric: MetricCard | null = null;
  @state() private showDrillDown = false;
  @state() private loading = false;
  
  private _title = '';
  private _roleId: RoleId = 'security-expert';

  static styles = css`
    :host {
      display: block;
      contain: layout style;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-icon {
      font-size: 16px;
    }

    .view-all-btn {
      background: none;
      border: none;
      color: var(--role-primary, #3b82f6);
      font-size: 12px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .view-all-btn:hover {
      background: rgba(59, 130, 246, 0.1);
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
    }

    @media (max-width: 480px) {
      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .metric-card {
        padding: 12px;
      }
      .metric-value {
        font-size: 24px;
      }
    }

    .metric-card {
      background: #0f172a;
      border-radius: 8px;
      padding: 16px;
      transition: all 0.2s;
      cursor: pointer;
    }

    .metric-card:hover {
      background: #1e293b;
      transform: translateY(-2px);
    }

    .metric-label {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 8px;
    }

    .metric-value-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .metric-value {
      font-size: 28px;
      font-weight: 700;
      color: #f1f5f9;
    }

    .metric-unit {
      font-size: 14px;
      color: #64748b;
    }

    .metric-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      font-size: 12px;
    }

    .metric-trend.up {
      color: #10b981;
    }

    .metric-trend.down {
      color: #ef4444;
    }

    .metric-trend.stable {
      color: #94a3b8;
    }

    .metric-sparkline {
      margin-top: 12px;
      height: 32px;
    }

    .sparkline-path {
      fill: none;
      stroke: var(--role-primary, #3b82f6);
      stroke-width: 2;
    }

    .sparkline-area {
      fill: var(--role-primary, #3b82f6);
      opacity: 0.1;
    }

    .metric-status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      margin-top: 8px;
    }

    .metric-status.healthy {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
    }

    .metric-status.warning {
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
    }

    .metric-status.critical {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }

    .metric-card.anomaly {
      animation: anomalyPulse 2s ease-in-out infinite;
    }

    .metric-card.anomaly.critical {
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
      border-color: rgba(239, 68, 68, 0.5);
    }

    .metric-card.anomaly.warning {
      box-shadow: 0 0 15px rgba(245, 158, 11, 0.3);
      border-color: rgba(245, 158, 11, 0.4);
    }

    @keyframes anomalyPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }

    .drill-down-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .drill-down-modal {
      background: #1e293b;
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      animation: slideUp 0.2s ease-out;
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .drill-down-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid #334155;
    }

    .drill-down-title {
      font-size: 18px;
      font-weight: 600;
      color: #f1f5f9;
    }

    .drill-down-close {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 24px;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      line-height: 1;
    }

    .drill-down-close:hover {
      color: #f1f5f9;
      background: rgba(255,255,255,0.1);
    }

    .drill-down-close:focus {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    .drill-down-content {
      color: #94a3b8;
      font-size: 14px;
    }

    .drill-down-stat {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #334155;
    }

    .drill-down-stat:last-child {
      border-bottom: none;
    }

    .drill-down-stat-label {
      color: #64748b;
    }

    .drill-down-stat-value {
      color: #f1f5f9;
      font-weight: 500;
    }

    .anomaly-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 8px;
    }
  `;

  set title(val: string) {
    this._title = val;
    this.requestUpdate();
  }

  set roleId(val: RoleId) {
    this._roleId = val;
    this.loadMetrics();
    this.requestUpdate();
  }

  protected override shouldUpdate(changedProperties: Map<string, any>): boolean {
    return super.shouldUpdate(changedProperties);
  }

  private async loadMetrics() {
    this.loading = true;
    try {
      const [incidentStats, vulnStats, complianceStats] = await Promise.all([
        dataService.getIncidentStats().catch(() => ({ open: 0, bySeverity: {} })),
        dataService.getVulnerabilityStats().catch(() => ({ bySeverity: {} })),
        dataService.getComplianceStats().catch(() => ({})),
      ]);
      
      this.metrics = this.buildMetricsFromStats(incidentStats, vulnStats, complianceStats);
    } catch (error) {
      console.warn('[ScRoleMetricsSection] Failed to fetch real metrics, using mock data:', error);
      this.metrics = this.getMockMetrics();
    } finally {
      this.loading = false;
    }
  }

  private buildMetricsFromStats(
    incidentStats: IncidentStats,
    vulnStats: VulnStats,
    complianceStats: ComplianceStats
  ): MetricCard[] {
    const baseMetrics: MetricCard[] = [];
    
    if (this._roleId === 'security-expert' || this._roleId === 'secuclaw-commander' || this._roleId === 'security-ops') {
      baseMetrics.push(
        { id: 'open-incidents', label: '待处理事件', value: incidentStats?.open || 0, unit: '个', status: 'warning' },
        { id: 'critical-vulns', label: '严重漏洞', value: vulnStats?.bySeverity?.critical || 0, unit: '个', status: vulnStats?.bySeverity?.critical > 0 ? 'critical' : 'healthy' }
      );
    }
    
    if (this._roleId === 'privacy-officer' || this._roleId === 'ciso') {
      baseMetrics.push(
        { id: 'compliance-rate', label: '合规率', value: complianceStats?.overallScore || 0, unit: '%', status: 'healthy' }
      );
    }
    
    return baseMetrics.length > 0 ? baseMetrics : this.getMockMetrics();
  }

  private getMockMetrics(): MetricCard[] {
    const baseMetrics: Record<RoleId, MetricCard[]> = {
      'security-expert': [
        { id: 'total-vulns', label: '漏洞总数', value: 127, unit: '个', trend: 'down', trendValue: '-12', status: 'warning', sparkline: [45, 52, 38, 65, 42, 55, 38] },
        { id: 'critical-vulns', label: '严重漏洞', value: 5, unit: '个', trend: 'down', trendValue: '-2', status: 'critical', sparkline: [8, 7, 6, 9, 7, 5, 5] },
        { id: 'patch-coverage', label: '补丁覆盖率', value: 87, unit: '%', trend: 'up', trendValue: '+3%', status: 'healthy', sparkline: [82, 84, 85, 83, 86, 85, 87] },
        { id: 'cvss-high', label: '高危CVSS', value: 23, unit: '个', trend: 'stable', trendValue: '0', status: 'warning', sparkline: [25, 22, 24, 23, 21, 23, 23] },
      ],
      'privacy-officer': [
        { id: 'compliance-rate', label: '合规率', value: 92, unit: '%', trend: 'up', trendValue: '+5%', status: 'healthy', sparkline: [85, 87, 89, 88, 90, 91, 92] },
        { id: 'data-breaches', label: '数据泄露事件', value: 0, unit: '个', trend: 'stable', trendValue: '0', status: 'healthy', sparkline: [2, 1, 1, 0, 0, 0, 0] },
        { id: 'dpia-completed', label: '已完成DPIA', value: 45, unit: '个', trend: 'up', trendValue: '+8', status: 'healthy', sparkline: [30, 35, 38, 40, 42, 44, 45] },
        { id: 'consent-rate', label: '同意率', value: 94, unit: '%', trend: 'stable', trendValue: '0', status: 'healthy', sparkline: [93, 94, 93, 95, 94, 94, 94] },
      ],
      'secuclaw-commander': [
        { id: 'total-alerts', label: '总告警数', value: 1567, unit: '个', trend: 'down', trendValue: '-23%', status: 'warning', sparkline: [2000, 1890, 1750, 1680, 1590, 1580, 1567] },
        { id: 'security-score', label: '安全评分', value: 85, unit: '分', trend: 'up', trendValue: '+3', status: 'healthy', sparkline: [78, 80, 81, 82, 83, 84, 85] },
        { id: 'coverage-rate', label: '覆盖率', value: 92, unit: '%', trend: 'up', trendValue: '+2%', status: 'healthy', sparkline: [88, 89, 90, 90, 91, 91, 92] },
        { id: 'automation-rate', label: '自动化率', value: 78, unit: '%', trend: 'up', trendValue: '+5%', status: 'healthy', sparkline: [65, 68, 70, 72, 74, 76, 78] },
      ],
      'ciso': [
        { id: 'risk-score', label: '风险评分', value: 68, unit: '分', trend: 'down', trendValue: '-5', status: 'warning', sparkline: [78, 75, 73, 71, 70, 69, 68] },
        { id: 'budget-utilization', label: '预算使用率', value: 65, unit: '%', trend: 'stable', trendValue: '0', status: 'healthy', sparkline: [60, 62, 63, 64, 65, 65, 65] },
        { id: 'kpi-compliance', label: 'KPI达成率', value: 88, unit: '%', trend: 'up', trendValue: '+3%', status: 'healthy', sparkline: [82, 84, 85, 86, 86, 87, 88] },
        { id: 'maturity-score', label: '成熟度评分', value: 3.8, unit: '/5', trend: 'up', trendValue: '+0.2', status: 'healthy', sparkline: [3.4, 3.5, 3.5, 3.6, 3.7, 3.7, 3.8] },
      ],
      'security-ops': [
        { id: 'open-alerts', label: '待处理告警', value: 45, unit: '个', trend: 'down', trendValue: '-12', status: 'warning', sparkline: [78, 65, 58, 52, 49, 57, 45] },
        { id: 'false-positive-rate', label: '误报率', value: 12, unit: '%', trend: 'down', trendValue: '-3%', status: 'healthy', sparkline: [18, 16, 15, 14, 13, 13, 12] },
        { id: 'escalation-rate', label: '升级率', value: 8, unit: '%', trend: 'stable', trendValue: '0', status: 'healthy', sparkline: [9, 8, 9, 8, 7, 8, 8] },
        { id: 'response-time', label: '平均响应时间', value: 12, unit: '分钟', trend: 'down', trendValue: '-3分钟', status: 'healthy', sparkline: [18, 16, 15, 14, 13, 13, 12] },
      ],
      'supply-chain-security': [
        { id: 'vendor-risks', label: '供应商风险数', value: 23, unit: '个', trend: 'up', trendValue: '+5', status: 'warning', sparkline: [15, 16, 18, 19, 20, 22, 23] },
        { id: 'critical-vendors', label: '关键供应商', value: 8, unit: '家', trend: 'stable', trendValue: '0', status: 'healthy', sparkline: [8, 8, 8, 8, 8, 8, 8] },
        { id: 'sbom-coverage', label: 'SBOM覆盖率', value: 76, unit: '%', trend: 'up', trendValue: '+8%', status: 'warning', sparkline: [55, 60, 65, 68, 70, 73, 76] },
        { id: 'license-risks', label: '许可证风险', value: 5, unit: '个', trend: 'down', trendValue: '-2', status: 'healthy', sparkline: [12, 10, 9, 8, 7, 7, 5] },
      ],
      'security-architect': [
        { id: 'design-risks', label: '架构风险数', value: 12, unit: '个', trend: 'down', trendValue: '-3', status: 'warning', sparkline: [20, 18, 17, 15, 14, 13, 12] },
        { id: 'threat-coverage', label: '威胁覆盖率', value: 89, unit: '%', trend: 'up', trendValue: '+2%', status: 'healthy', sparkline: [82, 84, 85, 86, 87, 88, 89] },
        { id: 'security-controls', label: '安全控制数', value: 156, unit: '个', trend: 'up', trendValue: '+12', status: 'healthy', sparkline: [130, 135, 140, 145, 148, 152, 156] },
        { id: 'technical-debt', label: '技术债务', value: 18, unit: '项', trend: 'down', trendValue: '-4', status: 'warning', sparkline: [30, 28, 25, 23, 22, 20, 18] },
      ],
      'business-security-officer': [
        { id: 'business-impact', label: '业务影响事件', value: 3, unit: '个', trend: 'down', trendValue: '-2', status: 'healthy', sparkline: [8, 7, 6, 5, 4, 5, 3] },
        { id: 'recovery-time', label: '平均恢复时间', value: 2.5, unit: '小时', trend: 'down', trendValue: '-0.5h', status: 'healthy', sparkline: [4.5, 4.0, 3.5, 3.2, 3.0, 2.8, 2.5] },
        { id: 'continuity-score', label: '连续性评分', value: 94, unit: '%', trend: 'up', trendValue: '+2%', status: 'healthy', sparkline: [88, 90, 91, 92, 92, 93, 94] },
        { id: 'risk-accepted', label: '已接受风险', value: 5, unit: '个', trend: 'stable', trendValue: '0', status: 'warning', sparkline: [5, 5, 6, 5, 5, 5, 5] },
      ],
    };

    return baseMetrics[this._roleId] || baseMetrics['security-expert'];
  }

  private renderSparkline(data: number[]): string {
    if (!data || data.length === 0) return '';
    
    const width = 100;
    const height = 32;
    const padding = 2;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const points = data.map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  }

  private renderSparklineArea(data: number[]): string {
    if (!data || data.length === 0) return '';
    
    const width = 100;
    const height = 32;
    const padding = 2;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const points = data.map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    });
    
    const areaPoints = [
      `${padding},${height - padding}`,
      ...points,
      `${width - padding},${height - padding}`
    ];
    
    return `M ${areaPoints.join(' L ')} Z`;
  }

  private isAnomaly(metric: MetricCard): boolean {
    if (metric.anomalyScore && metric.anomalyScore > 0.7) return true;
    if (metric.status === 'critical') return true;
    if (metric.trend === 'up' && metric.status === 'warning') return true;
    return false;
  }

  private handleMetricClick(metric: MetricCard) {
    this.selectedMetric = metric;
    this.showDrillDown = true;
    this.dispatchEvent(new CustomEvent('metric-click', {
      detail: { metric },
      bubbles: true,
      composed: true,
    }));
  }

  private closeDrillDown() {
    this.showDrillDown = false;
    this.selectedMetric = null;
  }

  private handleOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('drill-down-overlay')) {
      this.closeDrillDown();
    }
  }

  private handleMetricKeyDown(e: KeyboardEvent, metric: MetricCard) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleMetricClick(metric);
    }
  }

  render() {
    const theme = ROLE_THEMES[this._roleId];

    return html`
      <div class="section-header">
        <h3 class="section-title">
          <span class="section-icon">📊</span>
          ${this._title || '专业指标'}
        </h3>
        <button class="view-all-btn">查看全部 →</button>
      </div>

      <div class="metrics-grid">
        ${this.metrics.map(metric => html`
          <div 
            class="metric-card ${this.isAnomaly(metric) ? 'anomaly ' + (metric.status || '') : ''}"
            @click=${() => this.handleMetricClick(metric)}
            @keydown=${(e: KeyboardEvent) => this.handleMetricKeyDown(e, metric)}
            role="button"
            aria-label="查看 ${metric.label} 详情"
            tabindex="0"
          >
            <div class="metric-label">${metric.label}</div>
            <div class="metric-value-row">
              <span class="metric-value">${metric.value}</span>
              ${metric.unit ? html`<span class="metric-unit">${metric.unit}</span>` : ''}
              ${this.isAnomaly(metric) ? html`<span class="anomaly-badge">⚡ AI异常</span>` : ''}
            </div>
            
            ${metric.trend ? html`
              <div class="metric-trend ${metric.trend}">
                ${metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                ${metric.trendValue}
              </div>
            ` : ''}

            ${metric.sparkline && metric.sparkline.length > 0 ? html`
              <div class="metric-sparkline">
                <svg viewBox="0 0 100 32" preserveAspectRatio="none">
                  <path 
                    class="sparkline-area" 
                    d="${this.renderSparklineArea(metric.sparkline)}"
                    style="fill: ${theme?.colors.primary || '#3b82f6'}"
                  />
                  <path 
                    class="sparkline-path" 
                    d="${this.renderSparkline(metric.sparkline)}"
                    style="stroke: ${theme?.colors.primary || '#3b82f6'}"
                  />
                </svg>
              </div>
            ` : ''}

            ${metric.status ? html`
              <span class="metric-status ${metric.status}">
                ${metric.status === 'healthy' ? '✓ 正常' : metric.status === 'warning' ? '⚠ 警告' : '✕ 严重'}
              </span>
            ` : ''}
          </div>
        `)}
      </div>

      ${this.showDrillDown && this.selectedMetric ? html`
        <div class="drill-down-overlay" @click=${this.handleOverlayClick}>
          <div class="drill-down-modal" role="dialog" aria-label="${this.selectedMetric.label} 详情">
            <div class="drill-down-header">
              <h3 class="drill-down-title">${this.selectedMetric.label}</h3>
              <button class="drill-down-close" @click=${this.closeDrillDown} aria-label="关闭">×</button>
            </div>
            <div class="drill-down-content">
              <div class="drill-down-stat">
                <span class="drill-down-stat-label">当前值</span>
                <span class="drill-down-stat-value">${this.selectedMetric?.value ?? '-'} ${this.selectedMetric?.unit || ''}</span>
              </div>
              ${this.selectedMetric?.trend ? html`
                <div class="drill-down-stat">
                  <span class="drill-down-stat-label">趋势</span>
                  <span class="drill-down-stat-value">${this.selectedMetric?.trend === 'up' ? '↑ 上升' : this.selectedMetric?.trend === 'down' ? '↓ 下降' : '→ 稳定'} ${this.selectedMetric?.trendValue || ''}</span>
                </div>
              ` : ''}
              ${this.selectedMetric?.status ? html`
                <div class="drill-down-stat">
                  <span class="drill-down-stat-label">状态</span>
                  <span class="drill-down-stat-value">${this.selectedMetric?.status === 'healthy' ? '✓ 健康' : this.selectedMetric?.status === 'warning' ? '⚠ 警告' : '✕ 严重'}</span>
                </div>
              ` : ''}
              ${this.selectedMetric?.sparkline && this.selectedMetric.sparkline.length > 0 ? html`
                <div class="drill-down-stat">
                  <span class="drill-down-stat-label">7日趋势数据</span>
                  <span class="drill-down-stat-value">${this.selectedMetric.sparkline.join(' → ')}</span>
                </div>
              ` : ''}
              ${this.selectedMetric && this.isAnomaly(this.selectedMetric) ? html`
                <div class="drill-down-stat">
                  <span class="drill-down-stat-label">AI分析</span>
                  <span class="drill-down-stat-value" style="color: #ef4444;">检测到异常模式，建议优先处理</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-role-metrics-section': ScRoleMetricsSection;
  }
}

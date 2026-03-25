/**
 * SecuClaw Metric Card Component - 指标卡片组件
 * 
 * 显示指标详情、迷你图表、历史数据、AI分析
 */
import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';

// ============ 类型定义 ============

export type MetricStatus = 'healthy' | 'warning' | 'critical' | 'unknown';
export type ChartType = 'line' | 'bar' | 'area';

export interface DataPoint {
  label: string;
  value: number;
  timestamp?: Date;
}

// ============ 组件定义 ============

@customElement('sc-metric-card')
export class ScMetricCard extends LitElement {
  // ============ 属性 ============

  /** 指标标题 */
  @property({ type: String })
  title: string = '';

  /** 当前值 */
  @property({ type: Number })
  value: number = 0;

  /** 单位 */
  @property({ type: String })
  unit?: string;

  /** 目标值 */
  @property({ type: Number })
  target?: number;

  /** 状态 */
  @property({ type: String })
  status: MetricStatus = 'healthy';

  /** 图表类型 */
  @property({ type: String })
  chartType: ChartType = 'line';

  /** 历史数据点 */
  @property({ type: Array })
  dataPoints: DataPoint[] = [];

  /** 图标 */
  @property({ type: String })
  icon?: string;

  /** 描述 */
  @property({ type: String })
  description?: string;

  /** AI洞察提示 */
  @property({ type: String })
  aiInsight?: string;

  /** 是否加载中 */
  @property({ type: Boolean })
  loading: boolean = false;

  // ============ 私有属性 ============

  private i18n = new I18nController(this);

  // ============ 样式 ============

  static styles = css`
    :host {
      display: block;
    }

    .metric-card {
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-md, 16px);
    }

    /* 头部 */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-xs, 4px);
    }

    .card-title {
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #64748b);
      font-weight: 500;
    }

    .card-value-container {
      display: flex;
      align-items: baseline;
      gap: var(--sc-spacing-xs, 4px);
    }

    .card-value {
      font-size: var(--sc-font-size-3xl, 30px);
      font-weight: 700;
      line-height: 1.2;
    }

    .card-unit {
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #64748b);
    }

    /* 状态颜色 */
    .status-healthy .card-value { color: var(--sc-success, #22c55e); }
    .status-warning .card-value { color: var(--sc-warning, #f59e0b); }
    .status-critical .card-value { color: var(--sc-danger, #ef4444); }
    .status-unknown .card-value { color: var(--sc-text-secondary, #64748b); }

    /* 图标 */
    .card-icon {
      font-size: 32px;
      line-height: 1;
    }

    /* 目标进度 */
    .target-section {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-xs, 4px);
    }

    .target-label {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-tertiary, #94a3b8);
    }

    .progress-bar {
      height: 6px;
      background-color: var(--sc-bg-tertiary, #f1f5f9);
      border-radius: var(--sc-radius-full, 999px);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: var(--sc-radius-full, 999px);
      transition: width 0.3s ease;
    }

    .progress-fill.healthy { background-color: var(--sc-success, #22c55e); }
    .progress-fill.warning { background-color: var(--sc-warning, #f59e0b); }
    .progress-fill.critical { background-color: var(--sc-danger, #ef4444); }

    /* 迷你图表 */
    .mini-chart {
      height: 60px;
      width: 100%;
      position: relative;
    }

    .chart-svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    /* AI洞察 */
    .ai-insight {
      display: flex;
      align-items: flex-start;
      gap: var(--sc-spacing-sm, 8px);
      padding: var(--sc-spacing-sm, 8px);
      background-color: var(--sc-bg-secondary, #f8fafc);
      border-radius: var(--sc-radius-md, 8px);
      border-left: 3px solid var(--sc-primary, #3b82f6);
    }

    .ai-icon {
      font-size: 16px;
      flex-shrink: 0;
    }

    .ai-text {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
      line-height: 1.4;
    }

    /* 描述 */
    .card-description {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-tertiary, #94a3b8);
    }

    /* 加载状态 */
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
      border-radius: 4px;
    }

    @keyframes skeleton-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .loading-value {
      width: 80px;
      height: 36px;
    }

    .loading-title {
      width: 100px;
      height: 16px;
    }

    .loading-chart {
      width: 100%;
      height: 60px;
    }
  `;

  // ============ 私有方法 ============

  private getProgressPercentage(): number {
    if (this.target === undefined || this.target === 0) return 0;
    return Math.min((this.value / this.target) * 100, 100);
  }

  private getChartPath(): string {
    if (this.dataPoints.length < 2) return '';
    
    const values = this.dataPoints.map(d => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    
    const width = 200;
    const height = 50;
    const padding = 5;
    
    const points = values.map((val, i) => {
      const x = padding + (i / (values.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  }

  private getAreaPath(): string {
    if (this.dataPoints.length < 2) return '';
    
    const values = this.dataPoints.map(d => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    
    const width = 200;
    const height = 50;
    const padding = 5;
    
    const points = values.map((val, i) => {
      const x = padding + (i / (values.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    });
    
    // Start from bottom-left, go along line, end at bottom-right
    return `M ${padding},${height - padding} L ${points.join(' L ')} L ${width - padding},${height - padding} Z`;
  }

  private getBarRects(): string {
    if (this.dataPoints.length < 1) return '';
    
    const values = this.dataPoints.map(d => d.value);
    const max = Math.max(...values) || 1;
    
    const width = 200;
    const height = 50;
    const padding = 5;
    const barWidth = (width - 2 * padding) / values.length - 2;
    
    return values.map((val, i) => {
      const x = padding + i * ((width - 2 * padding) / values.length) + 1;
      const barHeight = (val / max) * (height - 2 * padding);
      const y = height - padding - barHeight;
      return `${x},${y},${barWidth},${barHeight}`;
    }).join(';');
  }

  private renderChart() {
    if (this.dataPoints.length < 2) return null;

    if (this.chartType === 'line') {
      return svg`
        <svg class="chart-svg" viewBox="0 0 200 50" preserveAspectRatio="none">
          <path
            d=${this.getChartPath()}
            fill="none"
            stroke="var(--sc-primary, #3b82f6)"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      `;
    }

    if (this.chartType === 'area') {
      return svg`
        <svg class="chart-svg" viewBox="0 0 200 50" preserveAspectRatio="none">
          <defs>
            <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--sc-primary, #3b82f6)" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="var(--sc-primary, #3b82f6)" stop-opacity="0.05"/>
            </linearGradient>
          </defs>
          <path
            d=${this.getAreaPath()}
            fill="url(#area-gradient)"
          />
          <path
            d=${this.getChartPath()}
            fill="none"
            stroke="var(--sc-primary, #3b82f6)"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      `;
    }

    if (this.chartType === 'bar') {
      const rects = this.getBarRects().split(';');
      return svg`
        <svg class="chart-svg" viewBox="0 0 200 50" preserveAspectRatio="none">
          ${rects.map(rect => {
            const [x, y, w, h] = rect.split(',');
            return svg`
              <rect
                x=${x}
                y=${y}
                width=${w}
                height=${h}
                fill="var(--sc-primary, #3b82f6)"
                rx="2"
              />
            `;
          })}
        </svg>
      `;
    }

    return null;
  }

  // ============ 渲染 ============

  private renderLoading() {
    return html`
      <div class="metric-card">
        <div class="card-header">
          <div class="header-left">
            <div class="skeleton loading-title"></div>
            <div class="skeleton loading-value"></div>
          </div>
        </div>
        <div class="skeleton loading-chart"></div>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return this.renderLoading();
    }

    return html`
      <div class="metric-card status-${this.status}">
        <div class="card-header">
          <div class="header-left">
            <span class="card-title">${this.title}</span>
            <div class="card-value-container">
              <span class="card-value">${this.value.toLocaleString()}</span>
              ${this.unit ? html`<span class="card-unit">${this.unit}</span>` : ''}
            </div>
          </div>
          ${this.icon ? html`<span class="card-icon">${this.icon}</span>` : ''}
        </div>

        ${this.target !== undefined ? html`
          <div class="target-section">
            <span class="target-label">目标: ${this.target.toLocaleString()} ${this.unit || ''}</span>
            <div class="progress-bar">
              <div 
                class="progress-fill ${this.status}" 
                style="width: ${this.getProgressPercentage()}%"
              ></div>
            </div>
          </div>
        ` : ''}

        ${this.dataPoints.length >= 2 ? html`
          <div class="mini-chart">
            ${this.renderChart()}
          </div>
        ` : ''}

        ${this.aiInsight ? html`
          <div class="ai-insight">
            <span class="ai-icon">🤖</span>
            <span class="ai-text">${this.aiInsight}</span>
          </div>
        ` : ''}

        ${this.description ? html`
          <div class="card-description">${this.description}</div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-metric-card': ScMetricCard;
  }
}

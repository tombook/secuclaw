/**
 * SecuClaw Trend Chart Component - 趋势图表组件
 * 
 * 支持多数据系列、实时更新、AI洞察叠加
 * 用于展示安全指标趋势变化
 */

import { LitElement, html, css, svg, SVGTemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';

// ============ 类型定义 ============

export interface DataPoint {
  label: string;
  value: number;
  timestamp?: number;
}

export interface DataSeries {
  id: string;
  name: string;
  color: string;
  data: DataPoint[];
  visible?: boolean;
}

export interface ChartConfig {
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
  fillArea?: boolean;
  smooth?: boolean;
  showPoints?: boolean;
  showLabels?: boolean;
  yAxisFormat?: (value: number) => string;
  xAxisFormat?: (label: string) => string;
}

export interface TrendInsight {
  type: 'spike' | 'drop' | 'anomaly' | 'threshold';
  position: number;
  value: number;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

// ============ 组件定义 ============

@customElement('sc-trend-chart')
export class ScTrendChart extends LitElement {
  // ============ 属性 ============

  @property({ type: Array })
  series: DataSeries[] = [];

  @property({ type: Object })
  config: ChartConfig = {};

  @property({ type: Array })
  insights: TrendInsight[] = [];

  @property({ type: String })
  title: string = '';

  @property({ type: Number })
  height: number = 300;

  @property({ type: Boolean })
  loading: boolean = false;

  @property({ type: Boolean })
  realtime: boolean = false;

  // ============ 状态 ============

  @state()
  private hoveredPoint: { seriesId: string; index: number } | null = null;

  @state()
  private selectedSeries: Set<string> = new Set();

  @state()
  private animationProgress: number = 1;

  private i18n = new I18nController(this);
  private resizeObserver?: ResizeObserver;
  private chartWidth: number = 600;

  // ============ 样式 ============

  static styles = css`
    :host {
      display: block;
      font-family: var(--sc-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    }

    .chart-container {
      position: relative;
      width: 100%;
      height: var(--chart-height, 300px);
      background: var(--sc-bg-secondary, #1a1a2e);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-md, 16px);
      overflow: hidden;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-sm, 8px);
    }

    .chart-title {
      font-size: var(--sc-font-size-md, 14px);
      font-weight: 600;
      color: var(--sc-text-primary, #fff);
    }

    .chart-controls {
      display: flex;
      gap: var(--sc-spacing-xs, 4px);
    }

    .control-btn {
      background: transparent;
      border: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
      color: var(--sc-text-secondary, rgba(255, 255, 255, 0.6));
      padding: 4px 8px;
      border-radius: var(--sc-radius-sm, 4px);
      cursor: pointer;
      font-size: var(--sc-font-size-xs, 12px);
      transition: all 0.2s;
    }

    .control-btn:hover {
      background: var(--sc-bg-hover, rgba(255, 255, 255, 0.05));
      color: var(--sc-text-primary, #fff);
    }

    .control-btn.active {
      background: var(--sc-primary, #6366f1);
      border-color: var(--sc-primary, #6366f1);
      color: #fff;
    }

    .chart-body {
      position: relative;
      width: 100%;
      height: calc(100% - 40px);
    }

    svg {
      width: 100%;
      height: 100%;
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sc-spacing-sm, 8px);
      margin-top: var(--sc-spacing-sm, 8px);
      padding-top: var(--sc-spacing-sm, 8px);
      border-top: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs, 4px);
      cursor: pointer;
      padding: 4px 8px;
      border-radius: var(--sc-radius-sm, 4px);
      transition: background 0.2s;
    }

    .legend-item:hover {
      background: var(--sc-bg-hover, rgba(255, 255, 255, 0.05));
    }

    .legend-item.disabled {
      opacity: 0.4;
    }

    .legend-color {
      width: 12px;
      height: 3px;
      border-radius: 2px;
    }

    .legend-label {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, rgba(255, 255, 255, 0.6));
    }

    .tooltip {
      position: absolute;
      background: var(--sc-bg-elevated, #2a2a4a);
      border: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
      border-radius: var(--sc-radius-md, 8px);
      padding: var(--sc-spacing-sm, 8px);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .tooltip.visible {
      opacity: 1;
    }

    .tooltip-title {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, rgba(255, 255, 255, 0.6));
      margin-bottom: 4px;
    }

    .tooltip-value {
      font-size: var(--sc-font-size-md, 14px);
      font-weight: 600;
      color: var(--sc-text-primary, #fff);
    }

    .tooltip-series {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
    }

    .insight-marker {
      cursor: pointer;
      transition: transform 0.2s;
    }

    .insight-marker:hover {
      transform: scale(1.3);
    }

    .grid-line {
      stroke: var(--sc-border-color, rgba(255, 255, 255, 0.05));
      stroke-dasharray: 4 4;
    }

    .axis-label {
      fill: var(--sc-text-tertiary, rgba(255, 255, 255, 0.4));
      font-size: var(--sc-font-size-xs, 10px);
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--sc-radius-lg, 12px);
    }

    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 2px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
      border-top-color: var(--sc-primary, #6366f1);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--sc-text-tertiary, rgba(255, 255, 255, 0.4));
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: var(--sc-spacing-sm, 8px);
    }

    .realtime-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: rgba(34, 197, 94, 0.2);
      border-radius: var(--sc-radius-full, 999px);
      font-size: var(--sc-font-size-xs, 10px);
      color: #22c55e;
    }

    .realtime-dot {
      width: 6px;
      height: 6px;
      background: #22c55e;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;

  // ============ 生命周期 ============

  connectedCallback(): void {
    super.connectedCallback();
    // 初始化所有系列为可见
    this.series.forEach(s => {
      if (s.visible !== false) {
        this.selectedSeries.add(s.id);
      }
    });

    // 监听尺寸变化
    this.resizeObserver = new ResizeObserver(() => {
      this.requestUpdate();
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.resizeObserver?.disconnect();
  }

  // ============ 计算属性 ============

  private get chartConfig(): Required<ChartConfig> {
    return {
      showGrid: true,
      showLegend: true,
      showTooltip: true,
      animate: true,
      fillArea: true,
      smooth: true,
      showPoints: true,
      showLabels: false,
      yAxisFormat: (v) => v.toString(),
      xAxisFormat: (l) => l,
      ...this.config,
    };
  }

  private get visibleSeries(): DataSeries[] {
    return this.series.filter(s => this.selectedSeries.has(s.id));
  }

  private get allDataPoints(): DataPoint[] {
    const points: DataPoint[] = [];
    this.visibleSeries.forEach(s => {
      s.data.forEach(d => {
        if (!points.find(p => p.label === d.label)) {
          points.push(d);
        }
      });
    });
    return points.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }

  private get valueRange(): [number, number] {
    let min = Infinity;
    let max = -Infinity;
    this.visibleSeries.forEach(s => {
      s.data.forEach(d => {
        if (d.value < min) min = d.value;
        if (d.value > max) max = d.value;
      });
    });
    // 添加10%边距
    const padding = (max - min) * 0.1 || 1;
    return [min - padding, max + padding];
  }

  // ============ 渲染方法 ============

  render() {
    if (this.loading) {
      return html`
        <div class="chart-container" style="--chart-height: ${this.height}px">
          <div class="loading-overlay">
            <div class="loading-spinner"></div>
          </div>
        </div>
      `;
    }

    if (this.series.length === 0) {
      return html`
        <div class="chart-container" style="--chart-height: ${this.height}px">
          <div class="empty-state">
            <div class="empty-icon">📈</div>
            <div>${this.i18n.t('common.noData') || '暂无数据'}</div>
          </div>
        </div>
      `;
    }

    return html`
      <div class="chart-container" style="--chart-height: ${this.height}px">
        ${this.renderHeader()}
        <div class="chart-body" @mousemove=${this.handleMouseMove} @mouseleave=${this.handleMouseLeave}>
          ${this.renderChart()}
          ${this.renderTooltip()}
        </div>
        ${this.chartConfig.showLegend ? this.renderLegend() : ''}
      </div>
    `;
  }

  private renderHeader() {
    return html`
      <div class="chart-header">
        <div class="chart-title">${this.title}</div>
        <div class="chart-controls">
          ${this.realtime ? html`
            <div class="realtime-indicator">
              <span class="realtime-dot"></span>
              <span>${this.i18n.t('chart.realtime') || '实时'}</span>
            </div>
          ` : ''}
          <button class="control-btn" @click=${this.toggleAllSeries}>
            ${this.i18n.t('chart.toggleAll') || '全部'}
          </button>
        </div>
      </div>
    `;
  }

  private renderChart(): SVGTemplateResult {
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = this.chartWidth - padding.left - padding.right;
    const height = this.height - 60 - padding.top - padding.bottom;

    if (width <= 0 || height <= 0) {
      return svg``;
    }

    const [minVal, maxVal] = this.valueRange;
    const points = this.allDataPoints;
    const xScale = (i: number) => padding.left + (i / Math.max(points.length - 1, 1)) * width;
    const yScale = (v: number) => padding.top + height - ((v - minVal) / (maxVal - minVal)) * height;

    return svg`
      <svg viewBox="0 0 ${this.chartWidth} ${this.height - 60}" preserveAspectRatio="xMidYMid meet">
        <defs>
          ${this.visibleSeries.map(s => this.renderGradient(s, yScale)).join('')}
        </defs>
        
        ${this.chartConfig.showGrid ? this.renderGrid(padding, width, height, minVal, maxVal) : ''}
        
        ${this.visibleSeries.map(s => this.renderSeries(s, xScale, yScale, points)).join('')}
        
        ${this.renderInsights(xScale, yScale)}
      </svg>
    `;
  }

  private renderGradient(series: DataSeries, yScale: (v: number) => number): SVGTemplateResult {
    const [minVal] = this.valueRange;
    return svg`
      <linearGradient id="gradient-${series.id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${series.color}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${series.color}" stop-opacity="0.05"/>
      </linearGradient>
    `;
  }

  private renderGrid(
    padding: { top: number; right: number; bottom: number; left: number },
    width: number,
    height: number,
    minVal: number,
    maxVal: number
  ): SVGTemplateResult {
    const lines: SVGTemplateResult[] = [];
    const steps = 5;
    
    // 水平网格线
    for (let i = 0; i <= steps; i++) {
      const y = padding.top + (i / steps) * height;
      const value = maxVal - (i / steps) * (maxVal - minVal);
      lines.push(svg`
        <line class="grid-line" x1="${padding.left}" y1="${y}" x2="${padding.left + width}" y2="${y}"/>
        <text class="axis-label" x="${padding.left - 5}" y="${y + 4}" text-anchor="end">
          ${this.chartConfig.yAxisFormat(value)}
        </text>
      `);
    }

    // 垂直网格线（X轴标签）
    const points = this.allDataPoints;
    const labelStep = Math.ceil(points.length / 6);
    for (let i = 0; i < points.length; i += labelStep) {
      const x = padding.left + (i / Math.max(points.length - 1, 1)) * width;
      lines.push(svg`
        <line class="grid-line" x1="${x}" y1="${padding.top}" x2="${x}" y2="${padding.top + height}"/>
        <text class="axis-label" x="${x}" y="${padding.top + height + 15}" text-anchor="middle">
          ${this.chartConfig.xAxisFormat(points[i].label)}
        </text>
      `);
    }

    return svg`<g>${lines}</g>`;
  }

  private renderSeries(
    series: DataSeries,
    xScale: (i: number) => number,
    yScale: (v: number) => number,
    allPoints: DataPoint[]
  ): SVGTemplateResult {
    const points = series.data;
    const pathPoints: string[] = [];
    const areaPoints: string[] = [];

    points.forEach((d, i) => {
      const x = xScale(allPoints.findIndex(p => p.label === d.label));
      const y = yScale(d.value);
      
      if (this.chartConfig.smooth && i > 0 && i < points.length - 1) {
        // 贝塞尔曲线控制点
        const prev = points[i - 1];
        const next = points[i + 1];
        const cpx1 = xScale(allPoints.findIndex(p => p.label === prev.label)) + (x - xScale(allPoints.findIndex(p => p.label === prev.label))) / 2;
        const cpx2 = x + (xScale(allPoints.findIndex(p => p.label === next.label)) - x) / 2;
        pathPoints.push(`Q ${cpx1} ${yScale(prev.value)}, ${x} ${y}`);
      } else {
        pathPoints.push(`L ${x} ${y}`);
      }
    });

    const linePath = `M ${pathPoints.join(' ')}`;
    const areaPath = `${linePath} L ${xScale(points.length - 1)} ${yScale(this.valueRange[0])} L ${xScale(0)} ${yScale(this.valueRange[0])} Z`;

    return svg`
      <g class="series-${series.id}">
        ${this.chartConfig.fillArea ? svg`
          <path d="${areaPath}" fill="url(#gradient-${series.id})" opacity="${this.animationProgress}"/>
        ` : ''}
        <path d="${linePath}" fill="none" stroke="${series.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="${this.animationProgress}"/>
        
        ${this.chartConfig.showPoints ? points.map((d, i) => {
          const x = xScale(allPoints.findIndex(p => p.label === d.label));
          const y = yScale(d.value);
          return svg`
            <circle 
              cx="${x}" 
              cy="${y}" 
              r="${this.hoveredPoint?.seriesId === series.id && this.hoveredPoint?.index === i ? 6 : 4}" 
              fill="${series.color}"
              stroke="var(--sc-bg-secondary, #1a1a2e)"
              stroke-width="2"
              style="cursor: pointer; transition: r 0.2s;"
              @mouseenter=${() => this.handlePointHover(series.id, i)}
            />
          `;
        }) : ''}
      </g>
    `;
  }

  private renderInsights(
    xScale: (i: number) => number,
    yScale: (v: number) => number
  ): SVGTemplateResult {
    if (this.insights.length === 0) return svg``;

    return svg`
      <g class="insights">
        ${this.insights.map(insight => {
          const x = xScale(insight.position);
          const y = yScale(insight.value);
          const color = insight.severity === 'critical' ? '#ef4444' : insight.severity === 'warning' ? '#f59e0b' : '#22c55e';
          
          return svg`
            <g class="insight-marker" @click=${() => this.handleInsightClick(insight)}>
              <circle cx="${x}" cy="${y}" r="10" fill="${color}" opacity="0.2"/>
              <circle cx="${x}" cy="${y}" r="5" fill="${color}"/>
              <text x="${x}" y="${y - 15}" text-anchor="middle" fill="${color}" font-size="10">
                ${insight.type === 'spike' ? '📈' : insight.type === 'drop' ? '📉' : insight.type === 'anomaly' ? '⚠️' : '🎯'}
              </text>
            </g>
          `;
        })}
      </g>
    `;
  }

  private renderLegend() {
    return html`
      <div class="legend">
        ${this.series.map(s => html`
          <div 
            class="legend-item ${this.selectedSeries.has(s.id) ? '' : 'disabled'}"
            @click=${() => this.toggleSeries(s.id)}
          >
            <span class="legend-color" style="background: ${s.color}"></span>
            <span class="legend-label">${s.name}</span>
          </div>
        `)}
      </div>
    `;
  }

  private renderTooltip() {
    if (!this.hoveredPoint) return html``;

    const series = this.series.find(s => s.id === this.hoveredPoint!.seriesId);
    if (!series) return html``;

    const point = series.data[this.hoveredPoint.index];
    const tooltipStyle = `
      left: 50%;
      top: 20px;
      transform: translateX(-50%);
    `;

    return html`
      <div class="tooltip visible" style="${tooltipStyle}">
        <div class="tooltip-title">${this.chartConfig.xAxisFormat(point.label)}</div>
        <div class="tooltip-series">
          <span class="legend-color" style="background: ${series.color}"></span>
          <span class="tooltip-value">${this.chartConfig.yAxisFormat(point.value)}</span>
        </div>
      </div>
    `;
  }

  // ============ 事件处理 ============

  private toggleSeries(seriesId: string): void {
    if (this.selectedSeries.has(seriesId)) {
      this.selectedSeries.delete(seriesId);
    } else {
      this.selectedSeries.add(seriesId);
    }
    this.requestUpdate();
  }

  private toggleAllSeries(): void {
    if (this.selectedSeries.size === this.series.length) {
      this.selectedSeries.clear();
    } else {
      this.series.forEach(s => this.selectedSeries.add(s.id));
    }
    this.requestUpdate();
  }

  private handlePointHover(seriesId: string, index: number): void {
    this.hoveredPoint = { seriesId, index };
  }

  private handleMouseMove(e: MouseEvent): void {
    // 可以添加更复杂的悬停逻辑
  }

  private handleMouseLeave(): void {
    this.hoveredPoint = null;
  }

  private handleInsightClick(insight: TrendInsight): void {
    this.dispatchEvent(new CustomEvent('insight-click', {
      detail: insight,
      bubbles: true,
      composed: true,
    }));
  }

  // ============ 公共方法 ============

  /**
   * 添加新的数据点（用于实时更新）
   */
  addDataPoint(seriesId: string, point: DataPoint): void {
    const series = this.series.find(s => s.id === seriesId);
    if (series) {
      series.data.push(point);
      // 保持最近N个点
      if (series.data.length > 100) {
        series.data.shift();
      }
      this.requestUpdate();
    }
  }

  /**
   * 更新整个系列数据
   */
  updateSeries(seriesId: string, data: DataPoint[]): void {
    const series = this.series.find(s => s.id === seriesId);
    if (series) {
      series.data = data;
      this.requestUpdate();
    }
  }

  /**
   * 触发动画
   */
  async playAnimation(): Promise<void> {
    this.animationProgress = 0;
    const duration = 1000;
    const startTime = Date.now();

    return new Promise(resolve => {
      const animate = () => {
        const elapsed = Date.now() - startTime;
        this.animationProgress = Math.min(elapsed / duration, 1);
        
        if (this.animationProgress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
        this.requestUpdate();
      };
      requestAnimationFrame(animate);
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-trend-chart': ScTrendChart;
  }
}

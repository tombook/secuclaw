/**
 * SecuClaw Shared Chart Components
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('severity-badge')
export class SeverityBadge extends LitElement {
  static styles = css`
    :host { display: inline-block; }
    .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid; }
    .critical { background: var(--severity-critical-bg, rgba(239,68,68,0.15)); color: var(--severity-critical, #ef4444); border-color: var(--severity-critical-border, rgba(239,68,68,0.4)); }
    .high { background: var(--severity-high-bg, rgba(249,115,22,0.15)); color: var(--severity-high, #f97316); border-color: var(--severity-high-border, rgba(249,115,22,0.4)); }
    .medium { background: var(--severity-medium-bg, rgba(245,158,11,0.15)); color: var(--severity-medium, #f59e0b); border-color: var(--severity-medium-border, rgba(245,158,11,0.4)); }
    .low { background: var(--severity-low-bg, rgba(34,197,94,0.15)); color: var(--severity-low, #22c55e); border-color: var(--severity-low-border, rgba(34,197,94,0.4)); }
    .info { background: var(--severity-info-bg, rgba(59,130,246,0.15)); color: var(--severity-info, #3b82f6); border-color: var(--severity-info-border, rgba(59,130,246,0.4)); }
  `;
  @property({ type: String }) severity: 'critical' | 'high' | 'medium' | 'low' | 'info' = 'info';
  render() { return html`<span class="badge ${this.severity}">${this.severity}</span>`; }
}

@customElement('progress-ring')
export class ProgressRing extends LitElement {
  static styles = css`
    :host { display: inline-block; }
    .ring-container { position: relative; display: inline-flex; align-items: center; justify-content: center; }
    svg { transform: rotate(-90deg); }
    .ring-bg { fill: none; stroke: var(--border-color, #374151); }
    .ring-fill { fill: none; stroke-linecap: round; transition: stroke-dashoffset 1s ease-out; }
    .center-content { position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .value { font-size: 24px; font-weight: 700; color: var(--text-primary, #f9fafb); }
    .label { font-size: 10px; color: var(--text-secondary, #9ca3af); }
  `;
  @property({ type: Number }) value = 0;
  @property({ type: Number }) size = 100;
  @property({ type: Number }) strokeWidth = 8;
  @property({ type: String }) label = '';
  private getColor(): string { if (this.value >= 90) return 'var(--success, #22c55e)'; if (this.value >= 70) return 'var(--info, #3b82f6)'; if (this.value >= 50) return 'var(--warning, #f59e0b)'; return 'var(--danger, #ef4444)'; }
  render() { const r = (this.size - this.strokeWidth) / 2; const c = 2 * Math.PI * r; const o = c - (this.value / 100) * c; return html`<div class="ring-container" style="width:${this.size}px;height:${this.size}px;"><svg width="${this.size}" height="${this.size}"><circle class="ring-bg" cx="${this.size/2}" cy="${this.size/2}" r="${r}" stroke-width="${this.strokeWidth}"/><circle class="ring-fill" cx="${this.size/2}" cy="${this.size/2}" r="${r}" stroke="${this.getColor()}" stroke-width="${this.strokeWidth}" stroke-dasharray="${c}" stroke-dashoffset="${o}"/></svg><div class="center-content"><span class="value">${this.value}%</span>${this.label ? html`<span class="label">${this.label}</span>` : nothing}</div></div>`; }
}

@customElement('status-indicator')
export class StatusIndicator extends LitElement {
  static styles = css`
    :host { display: inline-flex; }
    .indicator { display: inline-flex; align-items: center; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .online { background: var(--success, #22c55e); box-shadow: 0 0 6px var(--success, #22c55e); }
    .warning { background: var(--warning, #f59e0b); box-shadow: 0 0 6px var(--warning, #f59e0b); }
    .error { background: var(--danger, #ef4444); box-shadow: 0 0 6px var(--danger, #ef4444); }
    .offline { background: var(--text-muted, #6b7280); }
    .pulse { animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .label { font-size: 12px; color: var(--text-secondary, #9ca3af); }
  `;
  @property({ type: String }) status: 'online' | 'warning' | 'error' | 'offline' = 'offline';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) pulse = false;
  render() { return html`<div class="indicator"><span class="dot ${this.status} ${this.pulse ? 'pulse' : ''}"></span>${this.label ? html`<span class="label">${this.label}</span>` : nothing}</div>`; }
}

@customElement('live-clock')
export class LiveClock extends LitElement {
  static styles = css`:host { display: inline-block; } .clock { font-family: monospace; font-size: 14px; color: var(--text-muted, #6b7280); }`;
  @property({ type: String }) time = '';
  private interval: number | null = null;
  connectedCallback() { super.connectedCallback(); this.updateTime(); this.interval = window.setInterval(() => this.updateTime(), 1000); }
  disconnectedCallback() { super.disconnectedCallback(); if (this.interval) clearInterval(this.interval); }
  private updateTime() { this.time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); }
  render() { return html`<span class="clock">${this.time}</span>`; }
}

declare global { interface HTMLElementTagNameMap { 'severity-badge': SeverityBadge; 'progress-ring': ProgressRing; 'status-indicator': StatusIndicator; 'live-clock': LiveClock; 'svg-gauge': SvgGauge; 'sparkline-chart': SparklineChart; 'mini-bar-chart': MiniBarChart; 'status-dot': StatusDot; 'heatmap-grid': HeatmapGrid; 'donut-chart': DonutChart; } }

/**
 * SVG Gauge Component - Half-circle arc gauge with value display
 */
@customElement('svg-gauge')
export class SvgGauge extends LitElement {
  static styles = css`
    :host { display: inline-block; }
    .gauge-wrap { position: relative; display: inline-flex; flex-direction: column; align-items: center; }
    .gauge-svg { overflow: visible; }
    .gauge-bg { fill: none; stroke: #1f2937; stroke-linecap: round; }
    .gauge-fill { fill: none; stroke-linecap: round; transition: stroke-dashoffset 0.8s ease-out; }
    .gauge-center { position: absolute; bottom: 0; display: flex; flex-direction: column; align-items: center; }
    .gauge-value { font-size: 20px; font-weight: 700; color: #f9fafb; font-family: 'Inter', system-ui, sans-serif; }
    .gauge-label { font-size: 10px; color: #6b7280; margin-top: 2px; font-family: 'Inter', system-ui, sans-serif; }
  `;
  @property({ type: Number }) value = 0;
  @property({ type: Number }) max = 100;
  @property({ type: Number }) size = 120;
  @property({ type: Number }) strokeWidth = 10;
  @property({ type: String }) label = '';
  @property({ type: String }) color = '';

  private getColor(): string {
    if (this.color) return this.color;
    const pct = (this.value / this.max) * 100;
    if (pct >= 80) return '#22c55e';
    if (pct >= 60) return '#3b82f6';
    if (pct >= 40) return '#f59e0b';
    return '#ef4444';
  }

  render() {
    const r = this.size / 2 - this.strokeWidth;
    const cx = this.size / 2;
    const cy = this.size / 2;
    const circumference = Math.PI * r;
    const pct = Math.min(this.value / this.max, 1);
    const filled = circumference * pct;
    const col = this.getColor();

    return html`
      <div class="gauge-wrap" style="width:${this.size}px;height:${this.size / 2 + 10}px;">
        <svg class="gauge-svg" width="${this.size}" height="${this.size / 2}" viewBox="0 0 ${this.size} ${this.size / 2}">
          <circle class="gauge-bg" cx="${cx}" cy="${cy}" r="${r}" stroke-width="${this.strokeWidth}"
            stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"
            transform="rotate(180 ${cx} ${cy})" />
          <circle class="gauge-fill" cx="${cx}" cy="${cy}" r="${r}" stroke-width="${this.strokeWidth}"
            stroke="${col}" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference - filled}"
            transform="rotate(180 ${cx} ${cy})" />
        </svg>
        <div class="gauge-center">
          <span class="gauge-value">${this.value}</span>
          ${this.label ? html`<span class="gauge-label">${this.label}</span>` : nothing}
        </div>
      </div>`;
  }
}

/**
 * Sparkline Chart - Minimal inline line chart from data points
 */
@customElement('sparkline-chart')
export class SparklineChart extends LitElement {
  static styles = css`
    :host { display: inline-block; }
    .sparkline-wrap { display: inline-flex; align-items: flex-end; gap: 0; }
    svg { overflow: visible; }
    .spark-line { fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .spark-area { opacity: 0.15; }
    .spark-dot { transition: r 0.15s ease; }
  `;
  @property({ type: Array }) data: number[] = [];
  @property({ type: Number }) width = 120;
  @property({ type: Number }) height = 32;
  @property({ type: String }) color = '#00d4ff';
  @property({ type: Boolean }) showArea = true;
  @property({ type: Boolean }) showDots = false;

  render() {
    if (this.data.length < 2) return nothing;
    const min = Math.min(...this.data);
    const max = Math.max(...this.data);
    const range = max - min || 1;
    const stepX = this.width / (this.data.length - 1);
    const pad = 2;

    const points = this.data.map((v, i) => {
      const x = i * stepX;
      const y = pad + (1 - (v - min) / range) * (this.height - pad * 2);
      return `${x},${y}`;
    });

    const linePath = 'M' + points.join(' L');
    const areaPath = linePath + ` L${this.width},${this.height} L0,${this.height} Z`;

    return html`
      <svg width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">
        ${this.showArea ? html`<path class="spark-area" d="${areaPath}" fill="${this.color}" />` : nothing}
        <path class="spark-line" d="${linePath}" stroke="${this.color}" />
        ${this.showDots ? this.data.map((v, i) => {
          const x = i * stepX;
          const y = pad + (1 - (v - min) / range) * (this.height - pad * 2);
          return html`<circle class="spark-dot" cx="${x}" cy="${y}" r="2.5" fill="${this.color}" />`;
        }) : nothing}
      </svg>`;
  }
}

/**
 * Mini Bar Chart - Compact horizontal or vertical bar chart
 */
@customElement('mini-bar-chart')
export class MiniBarChart extends LitElement {
  static styles = css`
    :host { display: inline-block; }
    .bar-chart { display: flex; gap: 3px; align-items: flex-end; }
    .bar-chart.vertical { flex-direction: row; align-items: flex-end; height: var(--chart-height, 40px); }
    .bar-chart.horizontal { flex-direction: column; align-items: flex-start; width: var(--chart-width, 100px); gap: 2px; }
    .bar { border-radius: 2px; transition: height 0.4s ease-out, width 0.4s ease-out; min-height: 2px; min-width: 2px; }
    .bar-chart.vertical .bar { width: var(--bar-width, 6px); }
    .bar-chart.horizontal .bar { height: var(--bar-height, 6px); }
  `;
  @property({ type: Array }) data: number[] = [];
  @property({ type: Array }) colors: string[] = [];
  @property({ type: String }) direction: 'vertical' | 'horizontal' = 'vertical';
  @property({ type: Number }) chartHeight = 40;
  @property({ type: Number }) chartWidth = 100;
  @property({ type: Number }) barSize = 6;

  render() {
    if (this.data.length === 0) return nothing;
    const max = Math.max(...this.data) || 1;
    const defaultColors = ['#00d4ff', '#3b82f6', '#7c3aed', '#f59e0b', '#ef4444', '#22c55e'];
    const style = this.direction === 'vertical'
      ? `--chart-height:${this.chartHeight}px;--bar-width:${this.barSize}px`
      : `--chart-width:${this.chartWidth}px;--bar-height:${this.barSize}px`;

    return html`
      <div class="bar-chart ${this.direction}" style="${style}">
        ${this.data.map((v, i) => {
          const pct = (v / max) * 100;
          const col = (this.colors && this.colors[i]) || defaultColors[i % defaultColors.length];
          const dimStyle = this.direction === 'vertical'
            ? `height:${pct}%;background:${col}`
            : `width:${pct}%;background:${col}`;
          return html`<div class="bar" style="${dimStyle}"></div>`;
        })}
      </div>`;
  }
}

/**
 * Status Dot - Enhanced status indicator with pulse ring animation
 */
@customElement('status-dot')
export class StatusDot extends LitElement {
  static styles = css`
    :host { display: inline-flex; align-items: center; }
    .dot-wrap { position: relative; display: inline-flex; align-items: center; justify-content: center; }
    .dot { border-radius: 50%; position: relative; z-index: 1; }
    .dot-sm { width: 8px; height: 8px; }
    .dot-md { width: 12px; height: 12px; }
    .dot-lg { width: 16px; height: 16px; }
    .dot-online { background: #22c55e; }
    .dot-warning { background: #f59e0b; }
    .dot-error { background: #ef4444; }
    .dot-offline { background: #6b7280; }
    .dot-info { background: #3b82f6; }
    .pulse-ring {
      position: absolute; border-radius: 50%; opacity: 0;
      animation: statusPulse 2s ease-out infinite;
    }
    .dot-sm .pulse-ring { width: 16px; height: 16px; }
    .dot-md .pulse-ring { width: 22px; height: 22px; }
    .dot-lg .pulse-ring { width: 28px; height: 28px; }
    .dot-online .pulse-ring { border: 2px solid #22c55e; }
    .dot-warning .pulse-ring { border: 2px solid #f59e0b; }
    .dot-error .pulse-ring { border: 2px solid #ef4444; }
    .dot-info .pulse-ring { border: 2px solid #3b82f6; }
    @keyframes statusPulse {
      0% { transform: scale(0.5); opacity: 0.8; }
      100% { transform: scale(1.2); opacity: 0; }
    }
    .label { font-size: 12px; color: #9ca3af; margin-left: 6px; }
  `;
  @property({ type: String }) status: 'online' | 'warning' | 'error' | 'offline' | 'info' = 'offline';
  @property({ type: String }) size: 'sm' | 'md' | 'lg' = 'sm';
  @property({ type: Boolean }) pulse = false;
  @property({ type: String }) label = '';

  render() {
    return html`
      <div class="dot-wrap">
        ${this.pulse ? html`<span class="pulse-ring"></span>` : nothing}
        <span class="dot dot-${this.size} dot-${this.status}"></span>
      </div>
      ${this.label ? html`<span class="label">${this.label}</span>` : nothing}`;
  }
}

/**
 * Heatmap Grid - Security heatmap visualization for activity/frequency data
 */
@customElement('heatmap-grid')
export class HeatmapGrid extends LitElement {
  static styles = css`
    :host { display: block; }
    .heatmap-wrap { display: flex; flex-direction: column; gap: 8px; }
    .heatmap-header { display: flex; justify-content: space-between; align-items: center; }
    .heatmap-title { font-size: 12px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .heatmap-legend { display: flex; gap: 4px; align-items: center; }
    .legend-cell { width: 12px; height: 12px; border-radius: 2px; }
    .legend-label { font-size: 10px; color: #6b7280; margin: 0 2px; }
    .heatmap-grid {
      display: grid;
      gap: 2px;
    }
    .heatmap-cell {
      width: 14px;
      height: 14px;
      border-radius: 2px;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      cursor: pointer;
      position: relative;
    }
    .heatmap-cell:hover {
      transform: scale(1.6);
      z-index: 2;
      box-shadow: 0 0 8px rgba(0, 212, 255, 0.4);
    }
    .heatmap-row-labels { display: flex; flex-direction: column; gap: 2px; margin-right: 6px; }
    .heatmap-col-labels { display: flex; gap: 2px; margin-bottom: 4px; }
    .row-label, .col-label { font-size: 10px; color: #6b7280; display: flex; align-items: center; justify-content: center; }
    .row-label { height: 14px; }
    .col-label { width: 14px; }
    .tooltip-box {
      position: fixed;
      padding: 6px 10px;
      background: #1f2937;
      color: #f9fafb;
      font-size: 11px;
      border-radius: 6px;
      border: 1px solid #374151;
      pointer-events: none;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }
  `;

  @property({ type: Array }) data: number[][] = [];
  @property({ type: Array }) rowLabels: string[] = [];
  @property({ type: Array }) colLabels: string[] = [];
  @property({ type: Number }) max = 100;
  @property({ type: String }) title = '';
  @property({ type: String }) color = '#00d4ff';

  @state() private _tooltipX = 0;
  @state() private _tooltipY = 0;
  @state() private _tooltipText = '';
  @state() private _showTooltip = false;

  private getHeatLevel(value: number): number {
    if (value <= 0) return 0;
    const pct = value / (this.max || 1);
    if (pct < 0.2) return 1;
    if (pct < 0.4) return 2;
    if (pct < 0.65) return 3;
    return 4;
  }

  private getHeatColor(level: number): string {
    const alpha = [0.05, 0.2, 0.4, 0.6, 0.85][level] || 0.05;
    return this.color.replace('#', '');
    const hex = this.color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  private _cellEnter(e: MouseEvent, value: number, row: number, col: number) {
    const rLabel = this.rowLabels[row] || ('Row ' + row);
    const cLabel = this.colLabels[col] || ('Col ' + col);
    this._tooltipText = rLabel + ' / ' + cLabel + ': ' + value;
    this._tooltipX = e.clientX + 12;
    this._tooltipY = e.clientY - 30;
    this._showTooltip = true;
  }

  private _cellLeave() { this._showTooltip = false; }

  render() {
    const cols = this.data[0] ? this.data[0].length : 0;
    return html`
      <div class="heatmap-wrap">
        ${this.title ? html`<div class="heatmap-header"><span class="heatmap-title">${this.title}</span>
          <div class="heatmap-legend">
            <span class="legend-label">Less</span>
            <span class="legend-cell" style="background:rgba(0,212,255,0.05)"></span>
            <span class="legend-cell" style="background:rgba(0,212,255,0.2)"></span>
            <span class="legend-cell" style="background:rgba(0,212,255,0.4)"></span>
            <span class="legend-cell" style="background:rgba(0,212,255,0.6)"></span>
            <span class="legend-cell" style="background:rgba(0,212,255,0.85)"></span>
            <span class="legend-label">More</span>
          </div>
        </div>` : nothing}
        <div style="display:flex;">
          ${this.rowLabels.length ? html`<div class="heatmap-row-labels">
            ${this.rowLabels.map(l => html`<span class="row-label">${l}</span>`)}
          </div>` : nothing}
          <div>
            ${this.colLabels.length ? html`<div class="heatmap-col-labels">
              ${this.colLabels.map(l => html`<span class="col-label">${l}</span>`)}
            </div>` : nothing}
            <div class="heatmap-grid" style="grid-template-columns:repeat(${cols}, 14px);">
              ${this.data.map((row, ri) => row.map((val, ci) => {
                const lvl = this.getHeatLevel(val);
                const alpha = [0.05, 0.2, 0.4, 0.6, 0.85][lvl];
                return html`<div class="heatmap-cell"
                  style="background:rgba(0,212,255,${alpha})"
                  @mouseenter=${(e: MouseEvent) => this._cellEnter(e, val, ri, ci)}
                  @mouseleave=${() => this._cellLeave()}></div>`;
              }))}
            </div>
          </div>
        </div>
        ${this._showTooltip ? html`<div class="tooltip-box" style="left:${this._tooltipX}px;top:${this._tooltipY}px;">${this._tooltipText}</div>` : nothing}
      </div>`;
  }
}

/**
 * Donut Chart - Percentage ring with segments for security dashboards
 */
@customElement('donut-chart')
export class DonutChart extends LitElement {
  static styles = css`
    :host { display: inline-block; }
    .donut-wrap { position: relative; display: inline-flex; flex-direction: column; align-items: center; }
    .donut-svg { transform: rotate(-90deg); }
    .donut-segment { transition: stroke-dashoffset 0.8s ease-out; }
    .donut-center { position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .donut-value { font-size: 22px; font-weight: 800; color: #f9fafb; line-height: 1; }
    .donut-label { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .donut-legend { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; justify-content: center; }
    .legend-item { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #9ca3af; }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
  `;

  @property({ type: Array }) segments: Array<{ value: number; color: string; label: string }> = [];
  @property({ type: Number }) size = 120;
  @property({ type: Number }) strokeWidth = 12;
  @property({ type: String }) centerValue = '';
  @property({ type: String }) centerLabel = '';

  render() {
    if (this.segments.length === 0) return nothing;
    const total = this.segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) return nothing;
    const r = (this.size - this.strokeWidth) / 2;
    const c = 2 * Math.PI * r;
    const cx = this.size / 2;
    const cy = this.size / 2;

    let offset = 0;
    const arcs = this.segments.map(seg => {
      const segLen = (seg.value / total) * c;
      const gap = 2;
      const arc = {
        dasharray: (segLen - gap) + ' ' + (c - segLen + gap),
        dashoffset: -offset,
        color: seg.color,
        label: seg.label,
        pct: Math.round((seg.value / total) * 100),
      };
      offset += segLen;
      return arc;
    });

    return html`
      <div class="donut-wrap">
        <div style="position:relative;width:${this.size}px;height:${this.size}px;">
          <svg class="donut-svg" width="${this.size}" height="${this.size}" viewBox="0 0 ${this.size} ${this.size}">
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1f2937" stroke-width="${this.strokeWidth}" />
            ${arcs.map(a => html`<circle class="donut-segment" cx="${cx}" cy="${cy}" r="${r}" fill="none"
              stroke="${a.color}" stroke-width="${this.strokeWidth}"
              stroke-dasharray="${a.dasharray}" stroke-dashoffset="${a.dashoffset}" />`)}
          </svg>
          <div class="donut-center">
            <span class="donut-value">${this.centerValue || (arcs[0] ? arcs[0].pct + '%' : '0%')}</span>
            ${this.centerLabel ? html`<span class="donut-label">${this.centerLabel}</span>` : nothing}
          </div>
        </div>
        <div class="donut-legend">
          ${arcs.map(a => html`<span class="legend-item"><span class="legend-dot" style="background:${a.color}"></span>${a.label} ${a.pct}%</span>`)}
        </div>
      </div>`;
  }
}

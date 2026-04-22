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

declare global { interface HTMLElementTagNameMap { 'severity-badge': SeverityBadge; 'progress-ring': ProgressRing; 'status-indicator': StatusIndicator; 'live-clock': LiveClock; } }

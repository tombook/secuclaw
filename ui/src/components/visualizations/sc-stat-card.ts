import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sc-stat-card')
export class ScStatCard extends LitElement {
  static styles = css`
    :host { display: block; }
    .card {
      padding: 14px 16px;
      background: var(--sc-bg-secondary, #111827);
      border: 1px solid var(--sc-border, #374151);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .label { font-size: 11px; color: var(--sc-text-muted, #6b7280); text-transform: uppercase; letter-spacing: 0.5px; }
    .value { font-size: 24px; font-weight: 800; color: var(--sc-text-primary, #f9fafb); }
    .delta { font-size: 11px; font-weight: 600; }
    .delta.up { color: var(--sc-critical, #ef4444); }
    .delta.down { color: var(--sc-low, #22c55e); }
    .delta.neutral { color: var(--sc-text-muted, #6b7280); }
  `;
  @property({ type: String }) label = '';
  @property({ type: String }) value = '';
  @property({ type: Number }) trend: number | null = null;
  @property({ type: String }) trendLabel = '';

  render() {
    const trendClass = this.trend === null ? 'neutral' : this.trend > 0 ? 'up' : this.trend < 0 ? 'down' : 'neutral';
    const trendSign = this.trend && this.trend > 0 ? '↑' : this.trend && this.trend < 0 ? '↓' : '→';
    return html`
      <div class="card" aria-label="${this.label}">
        <div class="label">${this.label}</div>
        <div class="value">${this.value}</div>
        ${this.trend !== null ? html`<div class="delta ${trendClass}">${trendSign} ${Math.abs(this.trend)}${this.trendLabel ? ' · ' + this.trendLabel : ''}</div>` : ''}
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-stat-card': ScStatCard; } }

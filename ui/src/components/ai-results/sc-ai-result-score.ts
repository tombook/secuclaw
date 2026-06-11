import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sc-ai-result-score')
export class ScAiResultScore extends LitElement {
  static styles = css`
    :host { display: block; }
    .wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px; background: var(--sc-bg-secondary, #111827); border: 1px solid var(--sc-border, #374151); border-radius: 8px; }
    .value { font-size: 32px; font-weight: 800; }
    .label { font-size: 11px; color: var(--sc-text-muted, #6b7280); text-transform: uppercase; letter-spacing: 0.5px; }
    .delta { font-size: 10px; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
  `;
  @property({ type: Number }) score = 0;
  @property({ type: Number }) max = 100;
  @property({ type: String }) label = '评分';
  @property({ type: Number }) delta: number | null = null;

  render() {
    const pct = (this.score / this.max) * 100;
    const color = pct >= 80 ? 'var(--sc-low, #22c55e)' : pct >= 60 ? 'var(--sc-medium, #f59e0b)' : 'var(--sc-critical, #ef4444)';
    return html`
      <div class="wrap" role="meter" aria-valuenow="${this.score}" aria-valuemax="${this.max}">
        <div class="value" style="color:${color};">${this.score}<span style="font-size:14px;color:var(--sc-text-muted);">/${this.max}</span></div>
        <div class="label">${this.label}</div>
        ${this.delta !== null ? html`<div class="delta" style="background:${this.delta >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'};color:${this.delta >= 0 ? 'var(--sc-low, #22c55e)' : 'var(--sc-critical, #ef4444)'};">${this.delta >= 0 ? '↑' : '↓'} ${Math.abs(this.delta)}</div>` : ''}
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-ai-result-score': ScAiResultScore; } }

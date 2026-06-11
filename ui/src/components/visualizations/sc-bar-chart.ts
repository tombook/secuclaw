import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

interface BarItem { label: string; value: number; color?: string; }

@customElement('sc-bar-chart')
export class ScBarChart extends LitElement {
  static styles = css`
    :host { display: block; }
    .wrap { display: flex; flex-direction: column; gap: 8px; }
    .row { display: flex; align-items: center; gap: 8px; }
    .label { font-size: 11px; color: var(--sc-text-secondary, #9ca3af); min-width: 70px; text-align: right; }
    .track { flex: 1; height: 14px; background: var(--sc-bg-tertiary, #1f2937); border-radius: 3px; overflow: hidden; }
    .fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
    .value { font-size: 11px; color: var(--sc-text-primary, #f9fafb); min-width: 32px; font-weight: 600; }
  `;
  @property({ type: Array }) data: BarItem[] = [];
  @property({ type: String }) color = 'var(--sc-info, #3b82f6)';
  @property({ type: Number }) max: number | null = null;
  @property({ type: String }) unit = '';

  render() {
    const max = this.max ?? Math.max(1, ...this.data.map(d => d.value));
    return html`
      <div class="wrap" role="img" aria-label="Bar chart">
        ${this.data.map(d => html`
          <div class="row">
            <div class="label">${d.label}</div>
            <div class="track"><div class="fill" style="width: ${(d.value / max) * 100}%; background: ${d.color || this.color};"></div></div>
            <div class="value">${d.value}${this.unit}</div>
          </div>
        `)}
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-bar-chart': ScBarChart; } }

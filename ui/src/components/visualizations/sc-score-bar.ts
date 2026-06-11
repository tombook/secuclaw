import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sc-score-bar')
export class ScScoreBar extends LitElement {
  static styles = css`
    :host { display: block; }
    .wrap { display: flex; align-items: center; gap: 8px; }
    .label { font-size: 11px; color: var(--sc-text-secondary, #9ca3af); min-width: 80px; }
    .track { flex: 1; height: 8px; background: var(--sc-bg-tertiary, #1f2937); border-radius: 4px; overflow: hidden; }
    .fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
    .value { font-size: 11px; font-weight: 600; color: var(--sc-text-primary, #f9fafb); min-width: 32px; text-align: right; }
  `;
  @property({ type: String }) label = '';
  @property({ type: Number }) value = 0;
  @property({ type: Number }) max = 100;
  @property({ type: String }) color = 'var(--sc-info, #3b82f6)';

  render() {
    const pct = (this.value / this.max) * 100;
    return html`
      <div class="wrap" role="meter" aria-valuenow="${this.value}" aria-valuemax="${this.max}">
        <div class="label">${this.label}</div>
        <div class="track"><div class="fill" style="width: ${pct}%; background: ${this.color};"></div></div>
        <div class="value">${this.value}${this.max === 100 ? '%' : ''}</div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-score-bar': ScScoreBar; } }

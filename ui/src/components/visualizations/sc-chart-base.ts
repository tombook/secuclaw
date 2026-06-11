import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sc-chart-base')
export class ScChartBase extends LitElement {
  static styles = css`
    :host { display: block; }
    .wrap { background: var(--sc-bg-secondary, #111827); border: 1px solid var(--sc-border, #374151); border-radius: 8px; padding: 12px 14px; }
    .head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .title { font-size: 13px; font-weight: 700; color: var(--sc-text-primary, #f9fafb); }
    .subtitle { font-size: 11px; color: var(--sc-text-muted, #6b7280); }
    .body { display: flex; align-items: center; justify-content: center; min-height: 60px; }
  `;
  @property({ type: String }) title = '';
  @property({ type: String }) subtitle = '';

  render() {
    return html`
      <div class="wrap">
        ${this.title || this.subtitle ? html`
          <div class="head">
            ${this.title ? html`<div class="title">${this.title}</div>` : ''}
            ${this.subtitle ? html`<div class="subtitle">${this.subtitle}</div>` : ''}
          </div>
        ` : ''}
        <div class="body"><slot></slot></div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-chart-base': ScChartBase; } }

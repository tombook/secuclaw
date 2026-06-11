import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sc-ai-result-card')
export class ScAiResultCard extends LitElement {
  static styles = css`
    :host { display: block; }
    .card { background: var(--sc-bg-secondary, #111827); border: 1px solid var(--sc-border, #374151); border-radius: 8px; padding: 12px 14px; transition: all 0.2s; }
    .card:hover { border-color: var(--sc-border-focus, #00d4ff); }
    .head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .title { font-size: 13px; font-weight: 700; color: var(--sc-text-primary, #f9fafb); }
    .badge { font-size: 10px; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
    .body { font-size: 12px; color: var(--sc-text-secondary, #9ca3af); line-height: 1.5; }
  `;
  @property({ type: String }) title = '';
  @property({ type: String }) badge = '';
  @property({ type: String }) badgeColor = 'var(--sc-info, #3b82f6)';

  render() {
    return html`
      <div class="card" role="article" aria-label="${this.title}">
        <div class="head">
          <div class="title">${this.title}</div>
          ${this.badge ? html`<span class="badge" style="background:${this.badgeColor}22;color:${this.badgeColor};">${this.badge}</span>` : ''}
        </div>
        <div class="body"><slot></slot></div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-ai-result-card': ScAiResultCard; } }

import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';

@customElement('sc-knowledge-base')
export class ScKnowledgeBase extends LitElement {
  private i18n = new I18nController(this);

  static styles = css`
    :host { display: block; }
    .page-title { font-size: var(--sc-font-size-2xl); font-weight: 600; color: var(--sc-text-primary); margin-bottom: var(--sc-spacing-lg); }
    .placeholder { padding: var(--sc-spacing-xl); text-align: center; color: var(--sc-text-tertiary); background: var(--sc-bg-card); border-radius: var(--sc-radius-lg); border: 1px solid var(--sc-border-color); }
  `;

  render() {
    return html`
      <h1 class="page-title">${this.i18n.t('nav.knowledgeBase')}</h1>
      <div class="placeholder">
        <p>📚 Knowledge Base</p>
        <p>Security knowledge base and documentation</p>
      </div>
    `;
  }
}

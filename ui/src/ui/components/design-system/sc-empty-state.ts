import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sc-empty-state')
export class ScEmptyState extends LitElement {
  @property({ type: String })
  icon = '📭';

  @property({ type: String })
  title = 'No Data';

  @property({ type: String })
  description = 'There is no data to display at the moment.';

  @property({ type: String })
  actionText = '';

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-8, 2rem);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 320px;
    }

    .empty-state .icon {
      font-size: 3rem;
      margin-bottom: var(--space-4, 1rem);
      opacity: 0.8;
    }

    .empty-state .title {
      font-size: var(--font-size-lg, 1.125rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text, #f8fafc);
      margin: 0 0 var(--space-2, 0.5rem) 0;
    }

    .empty-state .description {
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-text-secondary, #cbd5e1);
      margin: 0 0 var(--space-4, 1rem) 0;
      line-height: 1.5;
    }

    .empty-state .action {
      padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
      background-color: var(--color-primary, #3b82f6);
      color: white;
      border: none;
      border-radius: var(--radius-md, 0.375rem);
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      cursor: pointer;
      transition: background-color var(--transition-fast, 150ms ease);
    }

    .empty-state .action:hover {
      background-color: var(--color-primary-hover, #60a5fa);
    }

    .empty-state .action:focus {
      outline: 2px solid var(--color-primary, #3b82f6);
      outline-offset: 2px;
    }
  `;

  private handleAction() {
    this.dispatchEvent(new CustomEvent('action-click', {
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    return html`
      <div class="empty-state">
        <div class="icon">${this.icon}</div>
        <h3 class="title">${this.title}</h3>
        <p class="description">${this.description}</p>
        ${this.actionText ? html`
          <button class="action" @click=${this.handleAction}>
            ${this.actionText}
          </button>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-empty-state': ScEmptyState;
  }
}

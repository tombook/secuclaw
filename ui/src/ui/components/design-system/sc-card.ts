import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type CardElevation = 'flat' | 'raised' | 'elevated';

@customElement('sc-card')
export class ScCard extends LitElement {
  @property({ type: String })
  elevation: CardElevation = 'flat';

  static styles = css`
    :host {
      display: block;
    }

    .card {
      background-color: var(--color-bg-card, #1e293b);
      border: 1px solid var(--color-border, #334155);
      border-radius: var(--radius-lg, 0.5rem);
      overflow: hidden;
      transition: box-shadow var(--transition-normal, 250ms ease);
    }

    .card.flat {
      box-shadow: none;
    }

    .card.raised {
      box-shadow: var(--shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1));
    }

    .card.elevated {
      box-shadow: var(--shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
    }

    .card:hover {
      border-color: var(--color-border-focus, #3b82f6);
    }

    .header {
      padding: var(--space-4, 1rem);
      border-bottom: 1px solid var(--color-border, #334155);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text, #f8fafc);
    }

    .body {
      padding: var(--space-4, 1rem);
      color: var(--color-text-secondary, #cbd5e1);
    }

    .footer {
      padding: var(--space-4, 1rem);
      border-top: 1px solid var(--color-border, #334155);
      background-color: var(--color-bg-secondary, #1e293b);
    }

    slot[name='header']::slotted(*) {
      display: block;
      padding: var(--space-4, 1rem);
      border-bottom: 1px solid var(--color-border, #334155);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text, #f8fafc);
    }

    slot[name='footer']::slotted(*) {
      display: block;
      padding: var(--space-4, 1rem);
      border-top: 1px solid var(--color-border, #334155);
      background-color: var(--color-bg-secondary, #1e293b);
    }

    ::slotted(*) {
      color: var(--color-text, #f8fafc);
    }
  `;

  render() {
    return html`
      <div class="card ${this.elevation}">
        <slot name="header"></slot>
        <div class="body">
          <slot></slot>
        </div>
        <slot name="footer"></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-card': ScCard;
  }
}

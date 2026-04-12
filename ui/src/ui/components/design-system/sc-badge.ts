import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info';

@customElement('sc-badge')
export class ScBadge extends LitElement {
  @property({ type: String })
  variant: BadgeVariant = 'info';

  @property({ type: String })
  size: 'sm' | 'md' = 'md';

  static styles = css`
    :host {
      display: inline-block;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1, 0.25rem);
      font-family: var(--font-family, -apple-system, BlinkMacSystemFont, sans-serif);
      font-weight: var(--font-weight-medium, 500);
      border-radius: var(--radius-full, 9999px);
      white-space: nowrap;
    }

    .badge.sm {
      padding: 0 var(--space-2, 0.5rem);
      font-size: var(--font-size-xs, 0.75rem);
      height: 20px;
    }

    .badge.md {
      padding: var(--space-1, 0.25rem) var(--space-3, 0.75rem);
      font-size: var(--font-size-sm, 0.875rem);
      height: 24px;
    }

    /* Variants */
    .badge.success {
      background-color: var(--color-success-bg, #14532d);
      color: var(--color-success, #22c55e);
    }

    .badge.warning {
      background-color: var(--color-warning-bg, #78350f);
      color: var(--color-warning, #f59e0b);
    }

    .badge.error {
      background-color: var(--color-error-bg, #7f1d1d);
      color: var(--color-error, #ef4444);
    }

    .badge.info {
      background-color: var(--color-info-bg, #1e3a5f);
      color: var(--color-info, #3b82f6);
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }
  `;

  render() {
    return html`
      <span class="badge ${this.variant} ${this.size}">
        <span class="dot"></span>
        <slot></slot>
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-badge': ScBadge;
  }
}

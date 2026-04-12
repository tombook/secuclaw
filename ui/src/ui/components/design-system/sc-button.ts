import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@customElement('sc-button')
export class ScButton extends LitElement {
  @property({ type: String })
  variant: ButtonVariant = 'primary';

  @property({ type: String })
  size: ButtonSize = 'md';

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  loading = false;

  static styles = css`
    :host {
      display: inline-block;
    }

    button {
      font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      font-weight: var(--font-weight-medium, 500);
      border: none;
      border-radius: var(--radius-md, 0.375rem);
      cursor: pointer;
      transition: all var(--transition-fast, 150ms ease);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2, 0.5rem);
    }

    button:focus-visible {
      outline: 2px solid var(--color-primary, #3b82f6);
      outline-offset: 2px;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Sizes */
    :host([size='sm']) button {
      padding: var(--space-1, 0.25rem) var(--space-3, 0.75rem);
      font-size: var(--font-size-sm, 0.875rem);
      height: 32px;
    }

    :host([size='md']) button {
      padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
      font-size: var(--font-size-base, 1rem);
      height: 40px;
    }

    :host([size='lg']) button {
      padding: var(--space-3, 0.75rem) var(--space-6, 1.5rem);
      font-size: var(--font-size-lg, 1.125rem);
      height: 48px;
    }

    /* Variants */
    button.primary {
      background-color: var(--color-primary, #3b82f6);
      color: white;
    }

    button.primary:hover:not(:disabled) {
      background-color: var(--color-primary-hover, #60a5fa);
    }

    button.secondary {
      background-color: var(--color-bg-tertiary, #334155);
      color: var(--color-text, #f8fafc);
      border: 1px solid var(--color-border, #334155);
    }

    button.secondary:hover:not(:disabled) {
      background-color: var(--color-bg-hover, #334155);
      border-color: var(--color-border-focus, #3b82f6);
    }

    button.danger {
      background-color: var(--color-error, #ef4444);
      color: white;
    }

    button.danger:hover:not(:disabled) {
      background-color: #dc2626;
    }

    button.ghost {
      background-color: transparent;
      color: var(--color-text-secondary, #cbd5e1);
    }

    button.ghost:hover:not(:disabled) {
      background-color: var(--color-bg-hover, #334155);
      color: var(--color-text, #f8fafc);
    }

    /* Loading state */
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  render() {
    return html`
      <button
        class=${this.variant}
        ?disabled=${this.disabled || this.loading}
        type="button"
      >
        ${this.loading ? html`<span class="spinner"></span>` : ''}
        <slot></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-button': ScButton;
  }
}

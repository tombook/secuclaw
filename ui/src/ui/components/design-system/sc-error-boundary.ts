import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

interface ErrorInfo {
  message: string;
  stack?: string;
  timestamp: Date;
}

@customElement('sc-error-boundary')
export class ScErrorBoundary extends LitElement {
  @property({ type: String })
  fallbackMessage = 'Something went wrong. Please try again.';

  @property({ type: Boolean })
  showDetails = false;

  @state()
  private hasError = false;

  @state()
  private errorInfo: ErrorInfo | null = null;

  static styles = css`
    :host {
      display: block;
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-8, 2rem);
      text-align: center;
    }

    .error-icon {
      font-size: 3rem;
      margin-bottom: var(--space-4, 1rem);
    }

    .error-title {
      font-size: var(--font-size-lg, 1.125rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-error, #ef4444);
      margin: 0 0 var(--space-2, 0.5rem) 0;
    }

    .error-message {
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-text-secondary, #cbd5e1);
      margin: 0 0 var(--space-4, 1rem) 0;
      max-width: 400px;
      line-height: 1.5;
    }

    .error-details {
      width: 100%;
      max-width: 600px;
      margin-top: var(--space-4, 1rem);
      padding: var(--space-3, 0.75rem);
      background-color: var(--color-bg-secondary, #1e293b);
      border: 1px solid var(--color-border, #334155);
      border-radius: var(--radius-md, 0.375rem);
      text-align: left;
      overflow-x: auto;
    }

    .error-details pre {
      margin: 0;
      font-family: var(--font-family, monospace);
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-text-secondary, #cbd5e1);
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .error-details .timestamp {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-text-tertiary, #64748b);
      margin-bottom: var(--space-2, 0.5rem);
    }

    .actions {
      display: flex;
      gap: var(--space-3, 0.75rem);
      margin-top: var(--space-4, 1rem);
    }

    .btn {
      padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
      border-radius: var(--radius-md, 0.375rem);
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      cursor: pointer;
      transition: all var(--transition-fast, 150ms ease);
    }

    .btn-primary {
      background-color: var(--color-primary, #3b82f6);
      color: white;
      border: none;
    }

    .btn-primary:hover {
      background-color: var(--color-primary-hover, #60a5fa);
    }

    .btn-secondary {
      background-color: transparent;
      color: var(--color-text-secondary, #cbd5e1);
      border: 1px solid var(--color-border, #334155);
    }

    .btn-secondary:hover {
      background-color: var(--color-bg-hover, #334155);
    }

    .btn:focus {
      outline: 2px solid var(--color-primary, #3b82f6);
      outline-offset: 2px;
    }
  `;

  public static get observedAttributes() {
    return [];
  }

  public connectedCallback() {
    super.connectedCallback();
    this.setupErrorHandling();
  }

  private setupErrorHandling() {
    const inner = this.querySelector('*:not(script):not(style)');
    if (inner) {
      this.wrapComponent(inner as HTMLElement);
    }
  }

  private wrapComponent(element: HTMLElement) {
    const litEl = element as any;
    const originalRender = litEl.render?.bind(litEl);
    if (originalRender) {
      try {
        litEl.render = () => {
          try {
            return originalRender();
          } catch (error: any) {
            this.handleError(error);
            return html`<div>Error rendering content</div>`;
          }
        };
      } catch { }
    }
  }

  private handleError(error: Error) {
    this.hasError = true;
    this.errorInfo = {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      timestamp: new Date(),
    };

    this.dispatchEvent(new CustomEvent('error-caught', {
      detail: { error: this.errorInfo },
      bubbles: true,
      composed: true,
    }));

    console.error('ScErrorBoundary caught:', error);
  }

  private handleRetry() {
    this.hasError = false;
    this.errorInfo = null;
    this.dispatchEvent(new CustomEvent('retry', {
      bubbles: true,
      composed: true,
    }));
  }

  private handleToggleDetails() {
    this.showDetails = !this.showDetails;
  }

  public reset() {
    this.hasError = false;
    this.errorInfo = null;
    this.showDetails = false;
  }

  render() {
    if (this.hasError && this.errorInfo) {
      return html`
        <div class="error-container" role="alert" aria-live="polite">
          <div class="error-icon">⚠️</div>
          <h3 class="error-title">Error</h3>
          <p class="error-message">${this.fallbackMessage}</p>
          
          ${this.showDetails ? html`
            <div class="error-details">
              <div class="timestamp">${this.errorInfo.timestamp.toLocaleString()}</div>
              <pre>${this.errorInfo.message}</pre>
              ${this.errorInfo.stack ? html`
                <pre>${this.errorInfo.stack}</pre>
              ` : ''}
            </div>
          ` : ''}

          <div class="actions">
            <button class="btn btn-primary" @click=${this.handleRetry}>
              Try Again
            </button>
            <button class="btn btn-secondary" @click=${this.handleToggleDetails}>
              ${this.showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
        </div>
      `;
    }

    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-error-boundary': ScErrorBoundary;
  }
}

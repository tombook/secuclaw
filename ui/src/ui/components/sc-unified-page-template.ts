import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '../components/design-system/sc-button.js';
import '../components/design-system/sc-card.js';
import '../components/design-system/sc-empty-state.js';
import '../components/design-system/sc-skeleton.js';
import '../components/design-system/sc-error-boundary.js';

export type PageLayout = 'full' | 'two-column' | 'sidebar-only';

/**
 * Unified Page Template
 * Provides consistent layout structure for all pages
 */
@customElement('sc-unified-page-template')
export class ScUnifiedPageTemplate extends LitElement {
  @property({ type: String })
  pageTitle = '';

  @property({ type: String })
  pageIcon = '📄';

  @property({ type: Boolean })
  showBreadcrumbs = true;

  @property({ type: Boolean })
  showHeader = true;

  @property({ type: String })
  layout: PageLayout = 'full';

  @property({ type: Boolean })
  loading = false;

  @property({ type: String })
  errorMessage = '';

  @state()
  private breadcrumbs: { label: string; href?: string }[] = [];

  static styles = css`
    :host {
      display: block;
    }

    .page-container {
      padding: var(--sc-spacing-lg, 20px);
      max-width: 1600px;
      margin: 0 auto;
    }

    /* Breadcrumbs */
    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
      margin-bottom: var(--sc-spacing-md, 16px);
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-tertiary, #64748b);
    }

    .breadcrumb-item {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs, 4px);
    }

    .breadcrumb-link {
      color: var(--sc-text-secondary, #94a3b8);
      text-decoration: none;
      cursor: pointer;
      transition: color 0.2s;
    }

    .breadcrumb-link:hover {
      color: var(--sc-primary, #3b82f6);
    }

    .breadcrumb-separator {
      color: var(--sc-text-tertiary, #64748b);
    }

    .breadcrumb-current {
      color: var(--sc-text-primary, #f1f5f9);
      font-weight: 500;
    }

    /* Page Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--sc-spacing-lg, 20px);
      padding-bottom: var(--sc-spacing-md, 16px);
      border-bottom: 1px solid var(--sc-border-color, #334155);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md, 16px);
    }

    .page-icon {
      font-size: 2rem;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--sc-primary-alpha-10, rgba(59, 130, 246, 0.1));
      border-radius: var(--sc-radius-md, 8px);
    }

    .header-info {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-xs, 4px);
    }

    .page-title {
      font-size: var(--sc-font-size-xl, 20px);
      font-weight: 600;
      color: var(--sc-text-primary, #f1f5f9);
      margin: 0;
    }

    .page-subtitle {
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #94a3b8);
    }

    .header-actions {
      display: flex;
      gap: var(--sc-spacing-sm, 8px);
      align-items: center;
    }

    /* Layout variants */
    .layout-full {
      width: 100%;
    }

    .layout-two-column {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: var(--sc-spacing-lg, 20px);
    }

    .layout-sidebar-only {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: var(--sc-spacing-lg, 20px);
    }

    @media (max-width: 1024px) {
      .layout-two-column,
      .layout-sidebar-only {
        grid-template-columns: 1fr;
      }
    }

    .main-content {
      min-width: 0;
    }

    .sidebar-content {
      min-width: 0;
    }

    /* Loading state */
    .skeleton-header {
      display: flex;
      gap: var(--sc-spacing-md, 16px);
      margin-bottom: var(--sc-spacing-lg, 20px);
    }

    .skeleton-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--sc-radius-md, 8px);
      background: var(--sc-bg-tertiary, #334155);
    }

    .skeleton-title {
      width: 200px;
      height: 24px;
      border-radius: var(--sc-radius-sm, 4px);
      background: var(--sc-bg-tertiary, #334155);
    }

    .skeleton-content {
      display: grid;
      gap: var(--sc-spacing-md, 16px);
    }

    .skeleton-line {
      height: 16px;
      border-radius: var(--sc-radius-sm, 4px);
      background: var(--sc-bg-tertiary, #334155);
    }

    .skeleton-line.short {
      width: 60%;
    }

    .skeleton-line.medium {
      width: 80%;
    }

    .skeleton-card {
      height: 120px;
      border-radius: var(--sc-radius-lg, 12px);
      background: var(--sc-bg-tertiary, #334155);
    }
  `;

  setBreadcrumbs(breadcrumbs: { label: string; href?: string }[]) {
    this.breadcrumbs = breadcrumbs;
    this.requestUpdate();
  }

  private renderBreadcrumbs() {
    if (!this.showBreadcrumbs || this.breadcrumbs.length === 0) return '';

    return html`
      <div class="breadcrumbs">
        <span class="breadcrumb-item">
          <a class="breadcrumb-link" href="/">首页</a>
        </span>
        ${this.breadcrumbs.map((crumb, index) => html`
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-item">
            ${crumb.href 
              ? html`<a class="breadcrumb-link" href="${crumb.href}">${crumb.label}</a>`
              : html`<span class="breadcrumb-current">${crumb.label}</span>`
            }
          </span>
        `)}
      </div>
    `;
  }

  private renderHeader() {
    if (!this.showHeader) return '';

    return html`
      <div class="page-header">
        <div class="header-left">
          <div class="page-icon">${this.pageIcon}</div>
          <div class="header-info">
            <h1 class="page-title">${this.pageTitle}</h1>
          </div>
        </div>
        <div class="header-actions">
          <slot name="actions"></slot>
        </div>
      </div>
    `;
  }

  private renderLoading() {
    return html`
      <div class="skeleton-header">
        <div class="skeleton-icon"></div>
        <div class="skeleton-title"></div>
      </div>
      <div class="skeleton-content">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-line medium"></div>
        <div class="skeleton-card"></div>
      </div>
    `;
  }

  private renderError() {
    if (!this.errorMessage) return '';

    return html`
      <sc-error-boundary>
        <div slot="fallback" style="padding: 2rem; text-align: center; color: var(--sc-error, #ef4444);">
          <p>${this.errorMessage}</p>
          <sc-button @click=${this.handleRetry}>重试</sc-button>
        </div>
      </sc-error-boundary>
    `;
  }

  private handleRetry() {
    this.dispatchEvent(new CustomEvent('retry', {
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    return html`
      <div class="page-container">
        ${this.renderBreadcrumbs()}
        
        ${this.loading 
          ? this.renderLoading()
          : html`
            ${this.errorMessage 
              ? this.renderError()
              : html`
                ${this.renderHeader()}
                <div class="layout-${this.layout}">
                  <div class="main-content">
                    <slot></slot>
                  </div>
                  <div class="sidebar-content">
                    <slot name="sidebar"></slot>
                  </div>
                </div>
              `
            }
          `
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-unified-page-template': ScUnifiedPageTemplate;
  }
}

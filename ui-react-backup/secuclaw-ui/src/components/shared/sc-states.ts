/**
 * sc-states — 加载/错误/空状态 UI
 * @see v2.1 文档 3.10 错误状态设计
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// ─── Loading Skeleton ─────────────────────────────────────────

@customElement('sc-skeleton')
export class ScSkeleton extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .skeleton {
      background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .line { height: 14px; margin-bottom: 8px; }
    .line:last-child { width: 60%; }
    .card { height: 80px; border-radius: 8px; }
  `;

  @property({ type: String }) type: 'line' | 'card' = 'line';
  @property({ type: Number }) lines = 3;

  render() {
    if (this.type === 'card') {
      return html`<div class="skeleton card"></div>`;
    }
    return html`${Array.from({ length: this.lines }, () => html`<div class="skeleton line"></div>`)}`;
  }
}

// ─── Error State ───────────────────────────────────────────────

@customElement('sc-error-state')
export class ScErrorState extends LitElement {
  static styles = css`
    :host { display: block; }
    .error {
      text-align: center;
      padding: 24px;
    }
    .icon { font-size: 32px; margin-bottom: 8px; }
    .message {
      font-size: 13px;
      color: var(--role-text-muted, #94a3b8);
      margin-bottom: 12px;
    }
    .retry-btn {
      padding: 6px 16px;
      border-radius: 6px;
      border: 1px solid var(--role-secondary, #3b82f6);
      background: transparent;
      color: var(--role-secondary, #3b82f6);
      font-size: 12px;
      cursor: pointer;
      transition: all 150ms ease;
    }
    .retry-btn:hover {
      background: var(--role-secondary, #3b82f6);
      color: white;
    }
  `;

  @property({ type: String }) message = '数据加载失败';

  render() {
    return html`
      <div class="error">
        <div class="icon">⚠️</div>
        <div class="message">${this.message}</div>
        <button class="retry-btn" @click=${() => this.dispatchEvent(new CustomEvent('retry', { bubbles: true, composed: true }))}>
          重试
        </button>
      </div>
    `;
  }
}

// ─── Empty State ───────────────────────────────────────────────

@customElement('sc-empty-state')
export class ScEmptyState extends LitElement {
  static styles = css`
    :host { display: block; }
    .empty {
      text-align: center;
      padding: 24px;
    }
    .icon { font-size: 36px; margin-bottom: 8px; }
    .message {
      font-size: 13px;
      color: var(--role-text-muted, #94a3b8);
    }
    .hint {
      font-size: 11px;
      color: var(--role-text-muted, #94a3b8);
      opacity: 0.7;
      margin-top: 4px;
    }
  `;

  @property({ type: String }) icon = '📭';
  @property({ type: String }) message = '暂无数据';
  @property({ type: String }) hint = '';

  render() {
    return html`
      <div class="empty">
        <div class="icon">${this.icon}</div>
        <div class="message">${this.message}</div>
        ${this.hint ? html`<div class="hint">${this.hint}</div>` : ''}
      </div>
    `;
  }
}

// ─── Toast Notification ────────────────────────────────────────

@customElement('sc-toast-container')
export class ScToastContainer extends LitElement {
  static styles = css`
    :host {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    }
  `;

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-skeleton': ScSkeleton;
    'sc-error-state': ScErrorState;
    'sc-empty-state': ScEmptyState;
    'sc-toast-container': ScToastContainer;
  }
}

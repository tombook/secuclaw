/**
 * sc-badge — 徽章组件
 * 显示待办数量 / 状态标签
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sc-badge')
export class ScBadge extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 9px;
      font-size: 10px;
      font-weight: 700;
      line-height: 1;
      color: white;
      background: var(--role-danger, #ef4444);
    }

    :host([variant="warning"]) {
      background: var(--role-warning, #f59e0b);
    }

    :host([variant="success"]) {
      background: var(--role-success, #22c55e);
    }

    :host([variant="info"]) {
      background: var(--role-secondary, #3b82f6);
    }

    :host([variant="muted"]) {
      background: var(--role-text-muted, #6b7280);
    }

    :host([dot]) {
      min-width: 8px;
      height: 8px;
      padding: 0;
      border-radius: 4px;
    }
  `;

  @property({ type: Number }) count = 0;
  @property({ type: String, reflect: true }) variant: 'danger' | 'warning' | 'success' | 'info' | 'muted' = 'danger';
  @property({ type: Boolean, reflect: true }) dot = false;

  render() {
    if (this.dot) return html`<span></span>`;
    if (this.count <= 0) return nothing;
    return html`${this.count > 99 ? '99+' : this.count}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-badge': ScBadge;
  }
}

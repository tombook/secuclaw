/**
 * sc-card — 通用卡片组件
 * 支持标题、状态边框、插槽内容
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sc-card')
export class ScCard extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: var(--role-bg-elevated, #1e293b);
      border: 1px solid var(--role-border, #334155);
      border-radius: 8px;
      padding: 12px;
      transition: all 150ms ease;
    }

    :host([hoverable]:hover) {
      transform: translateY(-2px);
      border-color: var(--role-secondary, #3b82f6);
      cursor: pointer;
    }

    :host([status="danger"]) {
      border-color: var(--role-danger, #ef4444);
    }
    :host([status="warning"]) {
      border-color: var(--role-warning, #f59e0b);
    }
    :host([status="success"]) {
      border-color: var(--role-success, #22c55e);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }

    .card-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--role-text-muted, #94a3b8);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .card-header ::slotted(*) {
      margin-left: auto;
    }
  `;

  @property({ type: String }) title = '';
  @property({ type: String, reflect: true }) status?: 'danger' | 'warning' | 'success';
  @property({ type: Boolean, reflect: true }) hoverable = false;

  render() {
    return html`
      ${this.title ? html`
        <div class="card-header">
          <span class="card-title">${this.title}</span>
          <slot name="header-actions"></slot>
        </div>
      ` : ''}
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-card': ScCard;
  }
}

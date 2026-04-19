/**
 * sc-tooltip — 提示气泡组件
 * 包裹任意元素，hover 时显示提示文本
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sc-tooltip')
export class ScTooltip extends LitElement {
  static styles = css`
    :host {
      position: relative;
      display: inline-flex;
    }

    .trigger {
      display: inline-flex;
    }

    .tip {
      position: absolute;
      bottom: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      padding: 4px 10px;
      background: #1e293b;
      color: #f8fafc;
      font-size: 11px;
      border-radius: 4px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 150ms ease;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    .tip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 4px solid transparent;
      border-top-color: #1e293b;
    }

    :host(:hover) .tip,
    :host([show]) .tip {
      opacity: 1;
    }

    /* Flip below if needed */
    :host([position="bottom"]) .tip {
      bottom: auto;
      top: calc(100% + 6px);
    }
    :host([position="bottom"]) .tip::after {
      top: auto;
      bottom: 100%;
      border-top-color: transparent;
      border-bottom-color: #1e293b;
    }
  `;

  @property({ type: String }) text = '';
  @property({ type: String, reflect: true }) position: 'top' | 'bottom' = 'top';

  render() {
    return html`
      <div class="trigger">
        <slot></slot>
      </div>
      <div class="tip" role="tooltip">${this.text}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-tooltip': ScTooltip;
  }
}

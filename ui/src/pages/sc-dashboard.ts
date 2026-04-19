/**
 * sc-dashboard — 入口 Dashboard
 * 管理统一总览 ↔ 角色指挥台的切换 + 键盘快捷键导航
 * @see v2.1 文档 3.1 页面结构 + 3.9 无障碍
 */

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { RoleId } from '../config/role-tool-config';
import { ROLE_THEMES, applyTheme } from '../config/role-theme-config';

@customElement('sc-dashboard')
export class ScDashboard extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 100vh;
      overflow: auto;
      background: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* Breadcrumb */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      font-size: 12px;
      color: #94a3b8;
      border-bottom: 1px solid #1e293b;
      background: #0f172a;
    }

    .breadcrumb .link {
      cursor: pointer;
      color: #3b82f6;
      text-decoration: none;
      transition: color 150ms ease;
    }

    .breadcrumb .link:hover {
      color: #60a5fa;
    }

    .breadcrumb .sep { color: #475569; }

    .breadcrumb .current {
      color: #f8fafc;
      font-weight: 600;
    }

    .breadcrumb .shortcut-hint {
      margin-left: auto;
      font-size: 10px;
      color: #475569;
    }

    /* ARIA live region */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  `;

  @state() private _view: 'overview' | 'role' = 'overview';
  @state() private _currentRoleId: RoleId | null = null;
  @state() private _ariaMessage = '';

  connectedCallback() {
    super.connectedCallback();
    // Listen for keyboard navigation events from bootstrap
    this.addEventListener('navigate', this._onNavigate as EventListener);
  }

  disconnectedCallback() {
    this.removeEventListener('navigate', this._onNavigate as EventListener);
    super.disconnectedCallback();
  }

  private _onNavigate(e: CustomEvent<{ view: string; roleId?: RoleId }>) {
    if (e.detail.view === 'overview') {
      this._goToOverview();
    } else if (e.detail.view === 'role' && e.detail.roleId) {
      this._switchToRole(e.detail.roleId);
    }
  }

  private _onRoleSelected(e: CustomEvent<{ roleId: RoleId }>) {
    this._switchToRole(e.detail.roleId);
  }

  private _switchToRole(roleId: RoleId) {
    this._currentRoleId = roleId;
    this._view = 'role';
    applyTheme(this, roleId);
    this._ariaMessage = `已切换到 ${ROLE_THEMES[roleId].label} 指挥台`;
  }

  private _goToOverview() {
    this._view = 'overview';
    this._currentRoleId = null;
    this.style.removeProperty('--role-primary');
    this.style.background = '#0f172a';
    this._ariaMessage = '已返回安全指挥中心总览';
  }

  render() {
    const roleLabel = this._currentRoleId ? ROLE_THEMES[this._currentRoleId]?.label : '';

    return html`
      <!-- ARIA live region for screen readers -->
      <div class="sr-only" role="status" aria-live="polite">${this._ariaMessage}</div>

      ${this._view === 'role' ? html`
        <nav class="breadcrumb" aria-label="导航">
          <a class="link" @click=${this._goToOverview} role="button" tabindex="0">SecuClaw</a>
          <span class="sep">›</span>
          <span class="current">${roleLabel} 指挥台</span>
          <span class="shortcut-hint">Ctrl+Shift+0 返回总览</span>
        </nav>
        <sc-role-commander .roleId=${this._currentRoleId!}></sc-role-commander>
      ` : html`
        <sc-smart-recommendation-bar></sc-smart-recommendation-bar>
        <sc-overview @role-selected=${this._onRoleSelected}></sc-overview>
      `}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-dashboard': ScDashboard;
  }
}

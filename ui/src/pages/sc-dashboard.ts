/**
 * sc-dashboard — 入口 Dashboard
 * 管理统一总览 ↔ 角色指挥台的切换 + 键盘快捷键导航
 * @see v2.1 文档 3.1 页面结构 + 3.9 无障碍
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { RoleId } from '../config/role-tool-config';
import { ROLE_THEMES, applyTheme } from '../config/role-theme-config';

const ROLE_NAV: { roleId: RoleId; label: string; icon: string }[] = [
  { roleId: 'ciso', label: 'CISO', icon: '👔' },
  { roleId: 'secuclaw-commander', label: '安全指挥官', icon: '🎯' },
  { roleId: 'security-ops', label: '安全运营', icon: '🚨' },
  { roleId: 'security-expert', label: '安全专家', icon: '🔍' },
  { roleId: 'privacy-officer', label: '隐私官', icon: '🔐' },
  { roleId: 'security-architect', label: '安全架构师', icon: '🏗️' },
  { roleId: 'business-security-officer', label: '业务安全官', icon: '💼' },
  { roleId: 'supply-chain-security', label: '供应链安全', icon: '🔗' },
];

@customElement('sc-dashboard')
export class ScDashboard extends LitElement {
  static styles = css`
    :host {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* Sidebar */
    .sidebar {
      width: 160px;
      min-width: 160px;
      background: #060a13;
      border-right: 1px solid #1e293b;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      overflow-x: hidden;
    }
    .sidebar-inner {
      display: flex;
      flex-direction: column;
      padding: 8px 0;
    }
    .sidebar-brand {
      font-size: 14px;
      font-weight: 800;
      color: #e2e8f0;
      padding: 10px 12px 6px;
      letter-spacing: 0.3px;
    }
    .section-label {
      font-size: 9px;
      font-weight: 600;
      color: #475569;
      padding: 10px 12px 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .sidebar-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 7px 12px;
      border: none;
      background: transparent;
      color: #94a3b8;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: left;
      border-radius: 0;
    }
    .sidebar-btn:hover {
      background: rgba(59, 130, 246, 0.08);
      color: #e2e8f0;
    }
    .sidebar-btn.active {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border-right: 2px solid #3b82f6;
    }
    .sidebar-btn.home-active {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border-right: 2px solid #3b82f6;
    }
    .sidebar-icon {
      font-size: 14px;
      flex-shrink: 0;
      width: 20px;
      text-align: center;
    }
    .sidebar-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sidebar-spacer { flex: 1; }
    .raci-section {
      border-top: 1px solid #1e293b;
      margin-top: 4px;
    }

    /* Main area */
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: auto;
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
      flex-shrink: 0;
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

    /* Content area */
    .content {
      flex: 1;
      overflow: auto;
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

    @media (max-width: 768px) {
      .sidebar { width: 48px; min-width: 48px; }
      .sidebar .section-label, .sidebar .raci-section, .sidebar-brand .brand-text, .sidebar-text { display: none; }
    }
    @media (max-width: 480px) {
      .sidebar { display: none; }
    }
  `;

  @state() private _view: 'overview' | 'role' = 'overview';
  @state() private _currentRoleId: RoleId | null = null;
  @state() private _ariaMessage = '';

  connectedCallback() {
    super.connectedCallback();
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

  private _renderSidebar() {
    return html`
      <nav class="sidebar" aria-label="主导航">
        <div class="sidebar-inner">
          <div class="sidebar-brand">🛡️ <span class="brand-text">SecuClaw</span></div>
          <button
            class="sidebar-btn ${this._view === 'overview' ? 'home-active' : ''}"
            @click=${this._goToOverview}
          >
            <span class="sidebar-icon">🏠</span>
            <span class="sidebar-text">安全总览</span>
          </button>
          <div class="section-label">角色切换</div>
          ${ROLE_NAV.map(r => html`
            <button
              class="sidebar-btn ${this._currentRoleId === r.roleId ? 'active' : ''}"
              @click=${() => this._switchToRole(r.roleId)}
            >
              <span class="sidebar-icon">${r.icon}</span>
              <span class="sidebar-text">${r.label}</span>
            </button>
          `)}
          <div class="sidebar-spacer"></div>
          <div class="raci-section">
            <div class="section-label">RACI 任务</div>
            <button class="sidebar-btn" title="RACI 协作矩阵">
              <span class="sidebar-icon">📋</span>
              <span class="sidebar-text">协作矩阵</span>
            </button>
          </div>
        </div>
      </nav>
    `;
  }

  render() {
    const roleLabel = this._currentRoleId ? ROLE_THEMES[this._currentRoleId]?.label : '';

    return html`
      <div class="sr-only" role="status" aria-live="polite">${this._ariaMessage}</div>

      ${this._renderSidebar()}

      <div class="main-area">
        ${this._view === 'role' ? html`
          <nav class="breadcrumb" aria-label="导航">
            <a class="link" @click=${this._goToOverview} role="button" tabindex="0">SecuClaw</a>
            <span class="sep">›</span>
            <span class="current">${roleLabel} 指挥台</span>
            <span class="shortcut-hint">Ctrl+Shift+0 返回总览</span>
          </nav>
        ` : nothing}
        <div class="content">
          ${this._view === 'role' ? html`
            <sc-role-commander .roleId=${this._currentRoleId!}></sc-role-commander>
          ` : html`
            <sc-smart-recommendation-bar></sc-smart-recommendation-bar>
            <sc-overview @role-selected=${this._onRoleSelected}></sc-overview>
          `}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-dashboard': ScDashboard;
  }
}

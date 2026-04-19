/**
 * sc-role-toolbar — PC 横向工具条
 * 角色名 + 核心工具按钮 + 更多下拉
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { RoleId, ToolDef } from '../../config/role-tool-config';
import { ROLE_TOOL_CONFIGS } from '../../config/role-tool-config';
import { ROLE_THEMES } from '../../config/role-theme-config';
import { roleStore } from '../../stores/role-store';

@customElement('sc-role-toolbar')
export class ScRoleToolbar extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      height: 40px;
      padding: 0 14px;
      background: #0d1320;
      border-bottom: 1px solid #1e293b;
      gap: 2px;
      flex-shrink: 0;
      position: relative;
    }

    .role-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 10px 0 0;
      margin-right: 8px;
      border-right: 1px solid #1e293b;
      height: 24px;
    }

    .role-badge .dot {
      width: 8px;
      height: 8px;
      border-radius: 4px;
    }

    .role-badge .name {
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }

    .tool-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 12px;
      border-radius: 4px;
      border: none;
      background: transparent;
      color: #94a3b8;
      font-size: 12px;
      cursor: pointer;
      transition: all 100ms ease;
      white-space: nowrap;
      position: relative;
    }

    .tool-btn:hover {
      background: #1e293b;
      color: #f8fafc;
    }

    .tool-btn.active {
      background: var(--role-primary, #3b82f6);
      color: white;
    }

    .tool-btn .badge {
      position: absolute;
      top: -2px;
      right: -2px;
      min-width: 14px;
      height: 14px;
      border-radius: 7px;
      background: #ef4444;
      color: white;
      font-size: 9px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 3px;
    }

    .more-btn {
      margin-left: 4px;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #1e293b;
      background: transparent;
      color: #64748b;
      font-size: 11px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .more-btn:hover {
      background: #1e293b;
      color: #94a3b8;
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 100;
      min-width: 200px;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 6px;
      padding: 4px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      display: flex;
      flex-direction: column;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border: none;
      background: transparent;
      color: #94a3b8;
      font-size: 12px;
      cursor: pointer;
      border-radius: 4px;
      white-space: nowrap;
    }

    .dropdown-item:hover {
      background: #1e293b;
      color: #f1f5f9;
    }

    .spacer { flex: 1; }

    /* Quick actions */
    .quick-action {
      padding: 3px 8px;
      border-radius: 3px;
      border: 1px solid #1e293b;
      background: transparent;
      color: #64748b;
      font-size: 10px;
      cursor: pointer;
    }

    .quick-action:hover {
      background: #1e293b;
      color: #94a3b8;
    }
  `;

  @property({ type: String }) roleId: RoleId = 'secuclaw-commander';
  /** Callback: tool selected → parent commander */
  onToolClick?: (toolId: string) => void;
  @state() private _showMore = false;
  @state() private _activeTool = '';

  render() {
    const config = ROLE_TOOL_CONFIGS[this.roleId];
    const theme = ROLE_THEMES[this.roleId];
    if (!config) return nothing;

    const badges = roleStore.getState().toolBadges;

    return html`
      <div class="role-badge">
        <span class="dot" style="background: ${theme['--role-primary']}"></span>
        <span class="name" style="color: ${theme['--role-secondary']}">${config.label}</span>
      </div>

      ${config.coreTools.map((tool: ToolDef) => html`
        <button
          class="tool-btn ${this._activeTool === tool.id ? 'active' : ''}"
          @click=${() => {
            this._activeTool = this._activeTool === tool.id ? '' : tool.id;
            this.onToolClick?.(tool.id);
            this.dispatchEvent(new CustomEvent('tool-click', { detail: { toolId: tool.id }, bubbles: true, composed: true }));
          }}
          title="${(tool as any).description || tool.label}"
        >
          <span>${tool.icon}</span>
          <span>${tool.label}</span>
          ${badges[tool.id] ? html`<span class="badge">${badges[tool.id]}</span>` : nothing}
        </button>
      `)}

      ${config.secondaryTools.length > 0 ? html`
        <button class="more-btn" @click=${() => { this._showMore = !this._showMore; }}>
          更多 ▾
        </button>
        ${this._showMore ? html`
          <div class="dropdown-menu">
            ${config.secondaryTools.map((tool: ToolDef) => html`
              <button
                class="dropdown-item"
                @click=${() => {
                  // Dispatch event FIRST, then close dropdown
                  this.onToolClick?.(tool.id);
                  this.dispatchEvent(new CustomEvent('tool-click', { detail: { toolId: tool.id }, bubbles: true, composed: true }));
                  // Delay state change to avoid removing dropdown before event propagates
                  requestAnimationFrame(() => { this._showMore = false; });
                }}
              >
                <span>${tool.icon}</span>
                <span>${tool.label}</span>
              </button>
            `)}
          </div>
        ` : nothing}
      ` : nothing}

      <span class="spacer"></span>

      <button class="quick-action" title="AI 助手">🤖 AI</button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-role-toolbar': ScRoleToolbar;
  }
}

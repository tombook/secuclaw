/**
 * sc-role-toolbar — 角色工具栏组件
 * 随角色动态渲染核心工具（≤5），次级折叠
 *
 * @see v2.0 文档 第 3.6 节 工具栏
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import type { RoleId, ToolDef } from '../../config/role-tool-config';
import { ROLE_TOOL_CONFIGS } from '../../config/role-tool-config';
import { ROLE_THEMES } from '../../config/role-theme-config';
import { roleStore } from '../../stores/role-store';

// Lucide icon registry (simplified - in production use @ lucide/lit)
const ICON_REGISTRY: Record<string, string> = {
  ShieldAlert: '🛡️', Radio: '📡', Search: '🔍', Bug: '🐛',
  PackageCheck: '📦', FileCheck: '📋', Map: '🗺️', ClipboardCheck: '✅',
  UserCheck: '👤', ScrollText: '📜', AlertTriangle: '⚠️', PenTool: '✏️',
  KeyRound: '🔑', Fingerprint: '🖐️', Database: '🗄️', ShieldCheck: '✓',
  RotateCcw: '🔄', Calculator: '🧮', FileBarChart: '📊', Landmark: '🏛️',
  Globe: '🌐', Users: '👥', ArrowUpCircle: '⬆️', Megaphone: '📢',
  Bot: '🤖', BarChart3: '📈', Target: '🎯', PiggyBank: '🐷',
  FileText: '📄', BookMarked: '🔖', BellRing: '🔔', Siren: '🚨',
  Play: '▶️', Ban: '🚫', PackageSearch: '🔍', Building: '🏢',
  // fallback
  default: '🔧',
};

@customElement('sc-role-toolbar')
export class ScRoleToolbar extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--role-bg-surface);
      border-bottom: 1px solid var(--role-border);
      transition: background 300ms ease, border-color 300ms ease;
    }

    .tool-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border: 1px solid var(--role-border);
      border-radius: 6px;
      background: var(--role-bg-elevated);
      color: var(--role-text);
      cursor: pointer;
      font-size: 13px;
      transition: all 150ms ease;
      position: relative;
      white-space: nowrap;
    }

    .tool-btn:hover {
      border-color: var(--role-secondary);
      background: var(--role-secondary);
      color: var(--role-bg);
    }

    .tool-btn.active {
      border-color: var(--role-accent);
      box-shadow: 0 0 8px var(--role-accent);
    }

    .tool-btn .icon {
      font-size: 16px;
    }

    .tool-btn .badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      border-radius: 9px;
      background: var(--role-danger);
      color: white;
      padding: 0 4px;
    }

    .more-btn {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      border: 1px dashed var(--role-border);
      border-radius: 6px;
      background: transparent;
      color: var(--role-text-muted);
      cursor: pointer;
      font-size: 12px;
      transition: all 150ms ease;
    }

    .more-btn:hover {
      border-color: var(--role-secondary);
      color: var(--role-text);
    }

    .dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 4px;
      background: var(--role-bg-elevated);
      border: 1px solid var(--role-border);
      border-radius: 8px;
      padding: 4px;
      min-width: 160px;
      z-index: 100;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }

    .dropdown .tool-btn {
      width: 100%;
      margin: 2px 0;
    }

    /* 入场动画 */
    @keyframes slide-in {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .tool-btn.animate-in {
      animation: slide-in 300ms ease-out;
    }
  `;

  @property({ type: String }) roleId: RoleId = 'secuclaw-commander';
  @state() private _showMore = false;
  @state() private _activeToolId: string | null = null;
  @state() private _animate = true;

  private get coreTools(): ToolDef[] {
    return ROLE_TOOL_CONFIGS[this.roleId]?.coreTools ?? [];
  }

  private get secondaryTools(): ToolDef[] {
    return ROLE_TOOL_CONFIGS[this.roleId]?.secondaryTools ?? [];
  }

  private getIcon(iconName: string): string {
    return ICON_REGISTRY[iconName] ?? ICON_REGISTRY.default;
  }

  private getBadge(toolId: string): number | undefined {
    const badges = roleStore.getState().toolBadges;
    return badges[toolId];
  }

  connectedCallback() {
    super.connectedCallback();
    // 角色切换时触发入场动画
    this._animate = true;
    setTimeout(() => { this._animate = false; }, 2000);
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('roleId') && changed.get('roleId') !== undefined) {
      this._animate = true;
      setTimeout(() => { this._animate = false; }, 2000);
    }
  }

  private _onToolClick(toolId: string) {
    this._activeToolId = toolId;
    this.dispatchEvent(new CustomEvent('tool-execute', {
      detail: { toolId, roleId: this.roleId },
      bubbles: true,
      composed: true,
    }));
  }

  private _toggleMore() {
    this._showMore = !this._showMore;
  }

  render() {
    const theme = ROLE_THEMES[this.roleId];

    return html`
      <div class="toolbar" style="animation: ${this._animate ? 'slide-in 300ms ease-out' : 'none'}">
        ${this.coreTools.map((tool, i) => html`
          <button
            class="tool-btn ${this._activeToolId === tool.id ? 'active' : ''} ${this._animate ? 'animate-in' : ''}"
            style="animation-delay: ${i * 50}ms"
            @click=${() => this._onToolClick(tool.id)}
            title=${tool.label}
          >
            <span class="icon">${this.getIcon(tool.icon)}</span>
            <span class="label">${tool.label}</span>
            ${this.getBadge(tool.id) ? html`
              <span class="badge">${this.getBadge(tool.id)}</span>
            ` : nothing}
          </button>
        `)}

        ${this.secondaryTools.length > 0 ? html`
          <div style="position: relative; margin-left: auto;">
            <button class="more-btn" @click=${this._toggleMore}>
              更多 ▾
            </button>
            ${this._showMore ? html`
              <div class="dropdown">
                ${this.secondaryTools.map((tool) => html`
                  <button
                    class="tool-btn"
                    @click=${() => { this._onToolClick(tool.id); this._showMore = false; }}
                    title=${tool.label}
                  >
                    <span class="icon">${this.getIcon(tool.icon)}</span>
                    <span class="label">${tool.label}</span>
                    ${this.getBadge(tool.id) ? html`
                      <span class="badge">${this.getBadge(tool.id)}</span>
                    ` : nothing}
                  </button>
                `)}
              </div>
            ` : nothing}
          </div>
        ` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-role-toolbar': ScRoleToolbar;
  }
}

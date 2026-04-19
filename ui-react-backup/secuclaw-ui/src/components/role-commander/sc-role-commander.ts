/**
 * sc-role-commander — 角色指挥台主组件
 * 融合工具栏 + RACI 面板 + 专业指标 + 协作区
 * 根据角色 ID 动态切换布局和主题
 *
 * @see v2.0 文档 第 3.1-3.6 节
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { RoleId } from '../../config/role-tool-config';
import { ROLE_THEMES, applyTheme } from '../../config/role-theme-config';
import { ROLE_LAYOUTS, getGridTemplate } from '../../config/role-layout-config';
import './sc-role-toolbar';
import './sc-raci-panel';
import './sc-metrics-grid';
import './sc-collab-hub';

@customElement('sc-role-commander')
export class ScRoleCommander extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      color: var(--role-text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      transition: background 300ms ease;
    }

    .commander-grid {
      display: grid;
      gap: 12px;
      padding: 12px;
      height: calc(100% - 52px);
      transition: grid-template 300ms ease;
      overflow: auto;
    }

    .zone {
      background: var(--role-bg-surface);
      border: 1px solid var(--role-border);
      border-radius: 10px;
      padding: 12px;
      overflow: auto;
      min-height: 0;
    }

    .zone-title {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--role-text-muted);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .zone-title .dot {
      width: 8px;
      height: 8px;
      border-radius: 4px;
      background: var(--role-primary);
    }

    .empty-state {
      text-align: center;
      padding: 24px;
      color: var(--role-text-muted);
      font-size: 13px;
    }

    .empty-state .icon {
      font-size: 32px;
      margin-bottom: 8px;
    }

    .empty-state .hint {
      font-size: 11px;
      margin-top: 4px;
    }

    /* Status bar for war-room */
    .status-bar {
      display: flex;
      gap: 16px;
      align-items: center;
      font-size: 13px;
      font-weight: 600;
    }

    .status-bar .danger {
      color: var(--role-danger);
    }
  `;

  @property({ type: String }) roleId: RoleId = 'secuclaw-commander';

  connectedCallback() {
    super.connectedCallback();
    this._applyTheme();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('roleId')) {
      this._applyTheme();
    }
  }

  private _applyTheme() {
    applyTheme(this, this.roleId);
  }

  render() {
    const layout = ROLE_LAYOUTS[this.roleId];
    const theme = ROLE_THEMES[this.roleId];

    return html`
      <sc-role-toolbar .roleId=${this.roleId}></sc-role-toolbar>
      <div class="commander-grid" style="grid-template: ${getGridTemplate(this.roleId)}">

        <!-- Metrics Zone -->
        <div class="zone" style="grid-area: metrics">
          <div class="zone-title">
            <span class="dot"></span>
            专业指标 · ${theme.label}
          </div>
          <sc-metrics-grid .roleId=${this.roleId}></sc-metrics-grid>
        </div>

        <!-- RACI Task Zone -->
        <div class="zone" style="grid-area: raci">
          <div class="zone-title">
            <span class="dot"></span>
            RACI 任务
          </div>
          <sc-raci-panel .roleId=${this.roleId}></sc-raci-panel>
        </div>

        <!-- Main Work Area -->
        <div class="zone" style="grid-area: main">
          <div class="zone-title">
            <span class="dot"></span>
            ${layout.mainAreaLabel}
          </div>
          <div class="empty-state">
            <div class="icon">🛠️</div>
            ${layout.label}
            <div class="hint">核心工作区组件待开发</div>
          </div>
        </div>

        <!-- Collaboration Zone -->
        <div class="zone" style="grid-area: collab">
          <div class="zone-title">
            <span class="dot"></span>
            协作指挥
          </div>
          <sc-collab-hub .roleId=${this.roleId}></sc-collab-hub>
        </div>

        <!-- War Room Status Bar (commander only) -->
        ${layout.type === 'war-room' ? html`
          <div class="zone" style="grid-area: statusbar">
            <div class="status-bar">
              <span class="danger">全域威胁等级: 橙色</span>
              <span>活跃事件: 7</span>
              <span>人员待命: 12</span>
              <span style="margin-left: auto; font-size: 11px; color: var(--role-text-muted);">
                实时更新中...
              </span>
            </div>
          </div>
        ` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-role-commander': ScRoleCommander;
  }
}

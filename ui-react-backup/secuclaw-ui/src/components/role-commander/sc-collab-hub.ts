/**
 * sc-collab-hub — 协作指挥区
 * 跨角色协调请求、专家会诊、任务协作
 *
 * @see v2.0 文档 第 4.3 节 协作指挥区
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { RoleId } from '../../config/role-tool-config';
import { ROLE_TOOL_CONFIGS } from '../../config/role-tool-config';
import { ROLE_THEMES } from '../../config/role-theme-config';

// ─── Types ────────────────────────────────────────────────────

interface CollabItem {
  id: string;
  type: 'request' | 'mention' | 'decision' | 'log';
  fromRole: RoleId;
  content: string;
  timestamp: number;
  actions?: { label: string; action: string }[];
}

@customElement('sc-collab-hub')
export class ScCollabHub extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .collab-container {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .collab-item {
      padding: 10px;
      border-radius: 6px;
      background: var(--role-bg-elevated);
      border: 1px solid var(--role-border);
      transition: border-color 150ms ease;
    }

    .collab-item:hover {
      border-color: var(--role-secondary);
    }

    .collab-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .collab-type-badge {
      font-size: 9px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .collab-type-badge.request { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .collab-type-badge.mention  { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .collab-type-badge.decision { background: rgba(34,197,94,0.15); color: #22c55e; }
    .collab-type-badge.log      { background: rgba(107,114,128,0.15); color: #6b7280; }

    .collab-from {
      font-size: 10px;
      color: var(--role-text-muted);
    }

    .collab-time {
      font-size: 10px;
      color: var(--role-text-muted);
      margin-left: auto;
    }

    .collab-content {
      font-size: 13px;
      color: var(--role-text);
      line-height: 1.4;
    }

    .mention-tag {
      color: var(--role-accent);
      font-weight: 600;
    }

    .collab-actions {
      display: flex;
      gap: 6px;
      margin-top: 8px;
    }

    .action-btn {
      padding: 4px 10px;
      font-size: 11px;
      border-radius: 4px;
      border: 1px solid var(--role-border);
      background: transparent;
      color: var(--role-text);
      cursor: pointer;
      transition: all 150ms ease;
    }

    .action-btn:hover {
      background: var(--role-secondary);
      color: var(--role-bg);
      border-color: var(--role-secondary);
    }

    .action-btn.primary {
      background: var(--role-primary);
      border-color: var(--role-primary);
      color: white;
    }

    .empty-state {
      text-align: center;
      padding: 20px;
      color: var(--role-text-muted);
      font-size: 12px;
    }

    .section-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--role-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 10px;
      margin-bottom: 4px;
    }
  `;

  @property({ type: String }) roleId: RoleId = 'secuclaw-commander';

  private _getMockItems(): CollabItem[] {
    const now = Date.now();
    const currentLabel = ROLE_TOOL_CONFIGS[this.roleId]?.label ?? '';

    return [
      {
        id: 'c1', type: 'request', fromRole: 'security-expert',
        content: `P1 事件需要 ${currentLabel} 协助分析漏洞影响范围`,
        timestamp: now - 1200000,
        actions: [
          { label: '查看详情', action: 'view' },
          { label: '接受协作', action: 'accept' },
        ],
      },
      {
        id: 'c2', type: 'mention', fromRole: 'secuclaw-commander',
        content: `@${currentLabel} 会诊：零信任架构迁移方案需要评估`,
        timestamp: now - 3600000,
        actions: [
          { label: '查看', action: 'view' },
          { label: '提供意见', action: 'respond' },
        ],
      },
      {
        id: 'c3', type: 'decision', fromRole: 'ciso',
        content: '安全预算追加审批已通过',
        timestamp: now - 7200000,
      },
      {
        id: 'c4', type: 'log', fromRole: 'security-ops',
        content: 'SOAR 剧本执行完成：木马遏制剧本处置 3 条告警',
        timestamp: now - 10800000,
      },
    ];
  }

  private _formatTime(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
  }

  private _getRoleLabel(roleId: RoleId): string {
    return ROLE_TOOL_CONFIGS[roleId]?.label ?? roleId;
  }

  private _onAction(itemId: string, action: string) {
    this.dispatchEvent(new CustomEvent('collab-action', {
      detail: { itemId, action, roleId: this.roleId },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    const items = this._getMockItems();
    const activeItems = items.filter(i => i.type === 'request' || i.type === 'mention');
    const historyItems = items.filter(i => i.type === 'decision' || i.type === 'log');

    return html`
      <div class="collab-container">
        ${activeItems.length > 0 ? html`
          <div class="section-label">待处理</div>
          ${activeItems.map(item => html`
            <div class="collab-item">
              <div class="collab-meta">
                <span class="collab-type-badge ${item.type}">
                  ${item.type === 'request' ? '协调请求' : '@提及'}
                </span>
                <span class="collab-from">来自 ${this._getRoleLabel(item.fromRole)}</span>
                <span class="collab-time">${this._formatTime(item.timestamp)}</span>
              </div>
              <div class="collab-content">${item.content}</div>
              ${item.actions ? html`
                <div class="collab-actions">
                  ${item.actions.map(a => html`
                    <button
                      class="action-btn ${a.action === 'accept' || a.action === 'respond' ? 'primary' : ''}"
                      @click=${() => this._onAction(item.id, a.action)}
                    >${a.label}</button>
                  `)}
                </div>
              ` : nothing}
            </div>
          `)}
        ` : nothing}

        ${historyItems.length > 0 ? html`
          <div class="section-label">协作历史</div>
          ${historyItems.map(item => html`
            <div class="collab-item">
              <div class="collab-meta">
                <span class="collab-type-badge ${item.type}">
                  ${item.type === 'decision' ? '决策' : '日志'}
                </span>
                <span class="collab-from">${this._getRoleLabel(item.fromRole)}</span>
                <span class="collab-time">${this._formatTime(item.timestamp)}</span>
              </div>
              <div class="collab-content" style="color: var(--role-text-muted); font-size: 12px;">
                ${item.content}
              </div>
            </div>
          `)}
        ` : nothing}

        ${items.length === 0 ? html`
          <div class="empty-state">暂无协作请求</div>
        ` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-collab-hub': ScCollabHub;
  }
}

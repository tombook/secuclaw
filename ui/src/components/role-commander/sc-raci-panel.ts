/**
 * sc-raci-panel — RACI 任务面板
 * 四个并列卡片：R（执行）、A（审批）、C（咨询）、I（通知）
 *
 * @see v2.0 文档 第 4.1 节 RACI 任务区
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { RoleId } from '../../config/role-tool-config';

// ─── Types ────────────────────────────────────────────────────

export type RaciType = 'R' | 'A' | 'C' | 'I';

export interface RaciTask {
  id: string;
  type: RaciType;
  title: string;
  description?: string;
  assignee?: string;
  createdAt: number;
  status: 'pending' | 'in-progress' | 'done';
}

// ─── Colors ───────────────────────────────────────────────────

const RACI_STYLES: Record<RaciType, { color: string; label: string; bg: string }> = {
  R: { color: '#3b82f6', label: '执行', bg: 'rgba(59,130,246,0.12)' },
  A: { color: '#f59e0b', label: '审批', bg: 'rgba(245,158,11,0.12)' },
  C: { color: '#8b5cf6', label: '咨询', bg: 'rgba(139,92,246,0.12)' },
  I: { color: '#6b7280', label: '通知', bg: 'rgba(107,114,128,0.12)' },
};

@customElement('sc-raci-panel')
export class ScRaciPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .raci-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .raci-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    .raci-card {
      background: var(--role-bg-elevated);
      border: 1px solid var(--role-border);
      border-radius: 8px;
      padding: 10px;
      cursor: pointer;
      transition: all 150ms ease;
      text-align: center;
    }

    .raci-card:hover {
      transform: translateY(-2px);
      border-color: var(--role-secondary);
    }

    .raci-card.active {
      border-color: var(--role-accent);
      box-shadow: 0 0 0 1px var(--role-accent);
    }

    .raci-type {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 4px;
    }

    .raci-count {
      font-size: 22px;
      font-weight: 700;
      color: var(--role-text);
    }

    .raci-label {
      font-size: 10px;
      color: var(--role-text-muted);
      margin-top: 2px;
    }

    /* Task list */
    .task-list {
      margin-top: 8px;
    }

    .task-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      background: var(--role-bg-elevated);
      border-radius: 6px;
      margin-bottom: 4px;
      font-size: 12px;
      color: var(--role-text);
      cursor: pointer;
      transition: background 150ms ease;
    }

    .task-item:hover {
      background: var(--role-border);
    }

    .task-item .dot {
      width: 6px;
      height: 6px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .task-item .title {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .task-item .time {
      font-size: 10px;
      color: var(--role-text-muted);
      white-space: nowrap;
    }

    .empty-tasks {
      text-align: center;
      padding: 12px;
      color: var(--role-text-muted);
      font-size: 12px;
    }
  `;

  @property({ type: String }) roleId: RoleId = 'secuclaw-commander';
  @state() private _activeType: RaciType | null = null;

  // Mock data — in production, data comes from store/API
  private _getMockTasks(): RaciTask[] {
    const now = Date.now();
    return [
      { id: 't1', type: 'R', title: '执行漏洞扫描任务', createdAt: now - 3600000, status: 'in-progress' },
      { id: 't2', type: 'R', title: '处理 P1 告警事件', createdAt: now - 7200000, status: 'pending' },
      { id: 't3', type: 'R', title: '更新防火墙规则', createdAt: now - 10800000, status: 'pending' },
      { id: 't4', type: 'A', title: '审批架构变更申请', createdAt: now - 1800000, status: 'pending' },
      { id: 't5', type: 'A', title: '审批安全预算追加', createdAt: now - 5400000, status: 'pending' },
      { id: 't6', type: 'C', title: '咨询零信任方案', createdAt: now - 14400000, status: 'pending' },
      { id: 't7', type: 'C', title: '评估新系统安全风险', createdAt: now - 9000000, status: 'pending' },
      { id: 't8', type: 'I', title: '知悉安全评分下降', createdAt: now - 600000, status: 'done' },
      { id: 't9', type: 'I', title: '知悉合规审计报告', createdAt: now - 21600000, status: 'done' },
    ];
  }

  private _getCounts(tasks: RaciTask[]): Record<RaciType, number> {
    return {
      R: tasks.filter(t => t.type === 'R' && t.status !== 'done').length,
      A: tasks.filter(t => t.type === 'A' && t.status !== 'done').length,
      C: tasks.filter(t => t.type === 'C' && t.status !== 'done').length,
      I: tasks.filter(t => t.type === 'I' && t.status !== 'done').length,
    };
  }

  private _formatTime(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
  }

  render() {
    const tasks = this._getMockTasks();
    const counts = this._getCounts(tasks);
    const types: RaciType[] = ['R', 'A', 'C', 'I'];

    const filteredTasks = this._activeType
      ? tasks.filter(t => t.type === this._activeType)
      : [];

    return html`
      <div class="raci-container">
        <div class="raci-cards">
          ${types.map(type => {
            const style = RACI_STYLES[type];
            return html`
              <div
                class="raci-card ${this._activeType === type ? 'active' : ''}"
                @click=${() => { this._activeType = this._activeType === type ? null : type; }}
              >
                <div class="raci-type" style="color: ${style.color}">${type} · ${style.label}</div>
                <div class="raci-count">${counts[type]}</div>
                <div class="raci-label">${style.label}任务</div>
              </div>
            `;
          })}
        </div>

        ${this._activeType ? html`
          <div class="task-list">
            ${filteredTasks.length > 0
              ? filteredTasks.map(task => html`
                <div class="task-item">
                  <span class="dot" style="background: ${RACI_STYLES[task.type].color}"></span>
                  <span class="title">${task.title}</span>
                  <span class="time">${this._formatTime(task.createdAt)}</span>
                </div>
              `)
              : html`<div class="empty-tasks">暂无${RACI_STYLES[this._activeType].label}任务</div>`
            }
          </div>
        ` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-raci-panel': ScRaciPanel;
  }
}

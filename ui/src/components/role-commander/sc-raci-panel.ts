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

/** 从 assignedRole 推导 RACI type — 与 core/src/raci/task-engine.ts 保持一致 */
const ROLE_RACI_MAP: Record<string, RaciType> = {
  'security-ops':       'R',
  'security-expert':   'R',
  'ciso':               'A',
  'compliance-lead':    'A',
  'threat-intel':       'C',
  'network-security':   'C',
  'secuclaw-commander': 'I',
  'security-analyst':   'I',
};

function toRaciType(roleId: string): RaciType {
  return ROLE_RACI_MAP[roleId] ?? 'I';
}

/**
 * Display-friendly task — mirrors core/src/raci/types.ts RaciTask
 * with computed `type` derived from `assignedRole`.
 */
export interface RaciTask {
  id: string;
  sessionId: string;
  title: string;
  description?: string;
  assignedRole: string;
  assignedBy?: string;
  status: 'created' | 'assigned' | 'in_progress' | 'pending_handoff' | 'completed' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  eventId?: string;
  eventType?: 'incident' | 'vulnerability' | 'threat';
  nextRole?: string;
  escalationLevel?: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
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

    .task-item .delete-btn {
      opacity: 0;
      background: none;
      border: none;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 4px;
      color: var(--role-text-muted);
      font-size: 14px;
      line-height: 1;
      transition: opacity 150ms, color 150ms;
      flex-shrink: 0;
    }

    .task-item:hover .delete-btn {
      opacity: 1;
    }

    .task-item .delete-btn:hover {
      color: #ef4444;
    }

    .task-item .status-badge {
      font-size: 9px;
      padding: 1px 5px;
      border-radius: 8px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .status-badge.pending {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
    }

    .status-badge.in-progress {
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
    }

    .status-badge.done {
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
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
  @state() private _tasks: RaciTask[] = [];
  @state() private _deleting = new Set<string>();

  private _getMockTasks(): RaciTask[] {
    const now = Date.now();
    const sessionId = 'session-default';
    const all: RaciTask[] = [
      { id: 't1', sessionId, assignedRole: 'security-ops', title: '执行漏洞扫描任务', createdAt: now - 3600000, updatedAt: now - 3600000, status: 'in_progress', priority: 'high' },
      { id: 't2', sessionId, assignedRole: 'security-ops', title: '处理 P1 告警事件', createdAt: now - 7200000, updatedAt: now - 7200000, status: 'assigned', priority: 'critical' },
      { id: 't3', sessionId, assignedRole: 'security-expert', title: '更新防火墙规则', createdAt: now - 10800000, updatedAt: now - 10800000, status: 'created', priority: 'medium' },
      { id: 't4', sessionId, assignedRole: 'ciso', title: '审批架构变更申请', createdAt: now - 1800000, updatedAt: now - 1800000, status: 'assigned', priority: 'high' },
      { id: 't5', sessionId, assignedRole: 'compliance-lead', title: '审批安全预算追加', createdAt: now - 5400000, updatedAt: now - 5400000, status: 'assigned', priority: 'medium' },
      { id: 't6', sessionId, assignedRole: 'threat-intel', title: '咨询零信任方案', createdAt: now - 14400000, updatedAt: now - 14400000, status: 'created', priority: 'low' },
      { id: 't7', sessionId, assignedRole: 'network-security', title: '评估新系统安全风险', createdAt: now - 9000000, updatedAt: now - 9000000, status: 'created', priority: 'medium' },
      { id: 't8', sessionId, assignedRole: 'secuclaw-commander', title: '知悉安全评分下降', createdAt: now - 600000, updatedAt: now - 600000, status: 'completed', priority: 'low', completedAt: now - 500000 },
      { id: 't9', sessionId, assignedRole: 'security-analyst', title: '知悉合规审计报告', createdAt: now - 21600000, updatedAt: now - 21600000, status: 'completed', priority: 'low', completedAt: now - 21000000 },
    ];
    // Filter by current role when API is unavailable
    if (!this.roleId || this.roleId === 'secuclaw-commander') return all;
    return all.filter(t => t.assignedRole === this.roleId);
  }

  private async _loadTasks(): Promise<void> {
    try {
      const params: Record<string, string> = {};
      if (this.roleId) params['role'] = this.roleId;

      const body = Object.keys(params).length
        ? JSON.stringify({ method: 'raci.task.list', params })
        : JSON.stringify({ method: 'raci.task.list', params: {} });

      const res = await fetch('/api/v1/gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as { result?: RaciTask[] };
      this._tasks = json.result ?? [];
    } catch {
      // Fallback to mock when API is unavailable
      this._tasks = this._getMockTasks();
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._loadTasks();
  }

  /** 当 roleId prop 变化时重新加载任务列表 */
  updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('roleId')) {
      this._activeType = null; // 切换角色时重置筛选
      this._loadTasks();
    }
  }

  private async _deleteTask(e: Event, taskId: string): Promise<void> {
    e.stopPropagation();
    if (this._deleting.has(taskId)) return;
    this._deleting = new Set([...this._deleting, taskId]);

    try {
      const res = await fetch('/api/v1/gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'raci.task.delete',
          params: { taskId },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Reload full list to stay in sync with server state
      await this._loadTasks();
    } catch {
      // Non-fatal: remove from UI optimistically even on network failure
      this._tasks = this._tasks.filter(t => t.id !== taskId);
    } finally {
      this._deleting = new Set([...this._deleting].filter(id => id !== taskId));
    }
  }

  private _statusLabel(status: RaciTask['status']): string {
    return {
      created:         '已创建',
      assigned:        '已分派',
      in_progress:      '进行中',
      pending_handoff:  '待交接',
      completed:        '已完成',
      escalated:        '已升级',
    }[status] ?? status;
  }

  private _taskType(task: RaciTask): RaciType {
    return toRaciType(task.assignedRole);
  }

  private _isTaskActive(task: RaciTask): boolean {
    return task.status !== 'completed';
  }

  private _getCounts(tasks: RaciTask[]): Record<RaciType, number> {
    return {
      R: tasks.filter(t => this._taskType(t) === 'R' && this._isTaskActive(t)).length,
      A: tasks.filter(t => this._taskType(t) === 'A' && this._isTaskActive(t)).length,
      C: tasks.filter(t => this._taskType(t) === 'C' && this._isTaskActive(t)).length,
      I: tasks.filter(t => this._taskType(t) === 'I' && this._isTaskActive(t)).length,
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
    const tasks = this._tasks.length > 0 ? this._tasks : this._getMockTasks();
    const counts = this._getCounts(tasks);
    const types: RaciType[] = ['R', 'A', 'C', 'I'];

    const filteredTasks = this._activeType
      ? tasks.filter(t => this._taskType(t) === this._activeType)
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
                  <span class="dot" style="background: ${RACI_STYLES[this._taskType(task)].color}"></span>
                  <span class="title">${task.title}</span>
                  <span class="status-badge ${task.status}">${this._statusLabel(task.status)}</span>
                  <span class="time">${this._formatTime(task.createdAt)}</span>
                  <button
                    class="delete-btn"
                    title="删除任务"
                    @click=${(e: Event) => this._deleteTask(e, task.id)}
                  >×</button>
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

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { RoleId } from '../config/role-themes.js';
import { raciStore, type RaciTask as StoreRaciTask } from '../store/raci-store.js';

export interface RaciTask {
  id: string;
  type: 'R' | 'A' | 'C' | 'I';
  title: string;
  description: string;
  scenario: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: number;
  assignees: RoleId[];
}

@customElement('sc-raci-task-section')
export class ScRaciTaskSection extends LitElement {
  @state() private tasks: RaciTask[] = [];
  @state() private expandedType: 'R' | 'A' | 'C' | 'I' | null = null;
  @state() private loading = false;
  @state() private dragOverStatus: string | null = null;
  @state() private draggedTaskId: string | null = null;
  
  private unsubscribe?: () => void;
  private currentRoleId: RoleId = 'security-expert';

  connectedCallback() {
    super.connectedCallback();
    this.loading = true;
    this.unsubscribe = raciStore.subscribe((state) => {
      this.tasks = this.transformTasks(state.tasks);
      this.loading = false;
    });
    raciStore.loadSessions()
      .catch(() => {})
      .finally(() => { this.loading = false; });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  protected override willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('currentRoleId')) {
      const state = raciStore.getState();
      this.tasks = this.transformTasks(state.tasks);
    }
    super.willUpdate(changedProperties);
  }

  private transformTasks(storeTasks: StoreRaciTask[]): RaciTask[] {
    return storeTasks
      .filter(t => t.assignedRole === this.currentRoleId)
      .map(t => ({
        id: t.id,
        type: t.assignedRole as 'R' | 'A' | 'C' | 'I',
        title: t.title,
        description: t.description || '',
        scenario: t.scenario,
        status: this.convertStatus(t.status),
        dueDate: t.completedAt,
        assignees: [t.assignedRole],
      }));
  }

  private convertStatus(storeStatus: string): 'pending' | 'in-progress' | 'completed' {
    switch (storeStatus) {
      case 'completed': return 'completed';
      case 'in_progress': return 'in-progress';
      default: return 'pending';
    }
  }

  static styles = css`
    :host {
      display: block;
      contain: layout style;
    }

    .raci-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .raci-title {
      font-size: 16px;
      font-weight: 600;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .raci-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    @media (max-width: 768px) {
      .raci-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .raci-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .raci-card:hover {
      border-color: var(--role-primary, #3b82f6);
      transform: translateY(-2px);
    }

    .raci-card.R {
      border-left: 3px solid #3b82f6;
    }

    .raci-card.A {
      border-left: 3px solid #ef4444;
    }

    .raci-card.C {
      border-left: 3px solid #10b981;
    }

    .raci-card.I {
      border-left: 3px solid #f59e0b;
    }

    .raci-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .raci-type-badge {
      font-size: 12px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .raci-type-badge.R {
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
    }

    .raci-type-badge.A {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }

    .raci-type-badge.C {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
    }

    .raci-type-badge.I {
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
    }

    .raci-count {
      font-size: 24px;
      font-weight: 700;
      color: #f1f5f9;
    }

    .raci-type-label {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 4px;
    }

    .raci-type-full {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }

    .task-list {
      margin-top: 16px;
      max-height: 300px;
      overflow-y: auto;
    }

    .task-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: #0f172a;
      border-radius: 6px;
      margin-bottom: 8px;
    }

    .task-status {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: 6px;
      flex-shrink: 0;
    }

    .task-status.pending { background: #f59e0b; }
    .task-status.in-progress { background: #3b82f6; }
    .task-status.completed { background: #10b981; }

    .task-content {
      flex: 1;
    }

    .task-title {
      font-size: 14px;
      font-weight: 500;
      color: #f1f5f9;
    }

    .task-description {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 4px;
    }

    .task-scenario {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
      padding: 2px 6px;
      background: #1e293b;
      border-radius: 4px;
      display: inline-block;
    }

    .task-actions {
      display: flex;
      gap: 8px;
    }

    .task-action-btn {
      background: none;
      border: 1px solid #334155;
      color: #94a3b8;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    }

    .task-action-btn:hover {
      border-color: var(--role-primary, #3b82f6);
      color: var(--role-primary, #3b82f6);
    }

    .status-drop-zones {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .drop-zone {
      flex: 1;
      padding: 8px 12px;
      border-radius: 6px;
      text-align: center;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s;
      border: 2px dashed transparent;
    }

    .drop-zone.pending {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    .drop-zone.in-progress {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .drop-zone.completed {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .drop-zone.drag-over {
      border-color: currentColor;
      transform: scale(1.02);
      box-shadow: 0 0 20px currentColor;
    }

    .task-item.dragging {
      opacity: 0.5;
      cursor: grabbing;
    }

    .task-item[draggable="true"] {
      cursor: grab;
    }

    .task-item:active[draggable="true"] {
      cursor: grabbing;
    }

    .task-item.drag-over {
      background: rgba(59, 130, 246, 0.1);
      border-color: #3b82f6;
    }
  `;

  setTasks(tasks: RaciTask[]) {
    this.tasks = tasks;
    this.requestUpdate();
  }

  set roleId(val: RoleId) {
    this.currentRoleId = val;
    const state = raciStore.getState();
    this.tasks = this.transformTasks(state.tasks);
  }

  private getTasksByType(type: 'R' | 'A' | 'C' | 'I'): RaciTask[] {
    return this.tasks.filter(t => t.type === type);
  }

  private getTypeLabel(type: 'R' | 'A' | 'C' | 'I'): string {
    const labels: Record<string, string> = {
      R: '执行',
      A: '审批',
      C: '咨询',
      I: '通知'
    };
    return labels[type];
  }

  private getTypeFullLabel(type: 'R' | 'A' | 'C' | 'I'): string {
    const labels: Record<string, string> = {
      R: 'Responsible - 执行/做事',
      A: 'Accountable - 负责/拍板',
      C: 'Consulted - 咨询/征求意见',
      I: 'Informed - 通知/知晓结果'
    };
    return labels[type];
  }

  private toggleExpanded(type: 'R' | 'A' | 'C' | 'I') {
    this.expandedType = this.expandedType === type ? null : type;
  }

  private handleDragStart(e: DragEvent, task: RaciTask) {
    this.draggedTaskId = task.id;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', task.id);
    }
  }

  private handleDragEnd() {
    this.draggedTaskId = null;
    this.dragOverStatus = null;
  }

  private handleDragOver(e: DragEvent, status: string) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    this.dragOverStatus = status;
  }

  private handleDragLeave() {
    this.dragOverStatus = null;
  }

  private handleDrop(e: DragEvent, newStatus: 'pending' | 'in-progress' | 'completed') {
    e.preventDefault();
    e.stopPropagation();
    const taskId = this.draggedTaskId;
    if (taskId && newStatus) {
      const task = this.tasks.find(t => t.id === taskId);
      if (task) {
        if (task.status === newStatus) {
          this.draggedTaskId = null;
          this.dragOverStatus = null;
          return;
        }
        raciStore.updateTaskStatus(taskId, newStatus, 'current-user')
          .then(() => {
            this.dispatchEvent(new CustomEvent('task-action', {
              detail: { task, newStatus, success: true },
              bubbles: true,
              composed: true,
            }));
          })
          .catch((err) => {
            console.error('[ScRaciTaskSection] Failed to update task status via drag:', err);
          });
      }
    }
    this.draggedTaskId = null;
    this.dragOverStatus = null;
  }

  private handleTaskAction(task: RaciTask, action: string) {
    const actor = 'current-user';
    let newStatus: 'pending' | 'in-progress' | 'completed' = task.status;
    
    switch (action) {
      case 'execute':
      case 'approve':
        newStatus = 'in-progress';
        break;
      case 'reject':
        newStatus = 'completed';
        break;
      case 'respond':
      case 'acknowledge':
        newStatus = 'completed';
        break;
    }
    
    raciStore.updateTaskStatus(task.id, newStatus, actor)
      .then(() => {
        this.dispatchEvent(new CustomEvent('task-action', {
          detail: { task, action, success: true },
          bubbles: true,
          composed: true,
        }));
      })
      .catch((err) => {
        console.error('[ScRaciTaskSection] Failed to update task:', err);
        this.dispatchEvent(new CustomEvent('task-action', {
          detail: { task, action, success: false, error: err },
          bubbles: true,
          composed: true,
        }));
      });
  }

  render() {
    const types: Array<'R' | 'A' | 'C' | 'I'> = ['R', 'A', 'C', 'I'];

    if (this.loading) {
      return html`
        <div class="raci-header">
          <h3 class="raci-title">
            <span>🎯</span>
            RACI 任务概览
          </h3>
        </div>
        <div class="raci-grid">
          ${types.map(() => html`
            <div class="raci-card" style="opacity: 0.5;">
              <div class="raci-card-header">
                <span class="raci-type-badge">...</span>
                <span class="raci-count">-</span>
              </div>
              <div class="raci-type-label">加载中...</div>
            </div>
          `)}
        </div>
      `;
    }

    return html`
      <div class="raci-header">
        <h3 class="raci-title">
          <span>🎯</span>
          RACI 任务概览
        </h3>
      </div>

      <div class="raci-grid">
        ${types.map(type => {
          const tasks = this.getTasksByType(type);
          
          return html`
            <div 
              class="raci-card ${type}" 
              @click=${() => this.toggleExpanded(type)}
              role="button"
              aria-expanded=${this.expandedType === type}
              aria-label="${this.getTypeLabel(type)}: ${tasks.length}个任务"
              tabindex="0"
            >
              <div class="raci-card-header">
                <span class="raci-type-badge ${type}">${type}</span>
                <span class="raci-count">${tasks.length}</span>
              </div>
              <div class="raci-type-label">${this.getTypeLabel(type)}</div>
              <div class="raci-type-full">${this.getTypeFullLabel(type)}</div>
            </div>
          `;
        })}
      </div>

      ${this.expandedType ? html`
        <div class="task-list" role="list" aria-label="${this.getTypeLabel(this.expandedType)} 任务列表">
          <h4 style="color: #f1f5f9; margin-bottom: 12px;">
            ${this.getTypeLabel(this.expandedType)} 任务详情
          </h4>
          
          <div class="status-drop-zones" role="group" aria-label="拖拽任务到以下状态">
            ${(['pending', 'in-progress', 'completed'] as const).map(status => html`
              <div 
                class="drop-zone ${status} ${this.dragOverStatus === status ? 'drag-over' : ''}"
                role="button"
                aria-label="放置到 ${status === 'in-progress' ? '进行中' : status === 'completed' ? '已完成' : '待处理'} 状态"
                @dragover=${(e: DragEvent) => this.handleDragOver(e, status)}
                @dragleave=${this.handleDragLeave}
                @drop=${(e: DragEvent) => this.handleDrop(e, status)}
              >
                ${status === 'pending' ? '📋 待处理' : status === 'in-progress' ? '🔄 进行中' : '✅ 已完成'}
              </div>
            `)}
          </div>

          ${this.getTasksByType(this.expandedType).length === 0 ? html`
            <div class="empty-tasks" role="status">
              <div style="text-align: center; padding: 24px; color: #64748b;">
                暂无${this.getTypeLabel(this.expandedType)}任务
              </div>
            </div>
          ` : this.getTasksByType(this.expandedType).map(task => html`
            <div 
              class="task-item ${this.draggedTaskId === task.id ? 'dragging' : ''}"
              role="listitem"
              draggable="true"
              aria-label="任务: ${task.title}, 当前状态: ${task.status}"
              @dragstart=${(e: DragEvent) => this.handleDragStart(e, task)}
              @dragend=${this.handleDragEnd}
            >
              <div class="task-status ${task.status}" aria-label="状态: ${task.status}"></div>
              <div class="task-content">
                <div class="task-title">${task.title}</div>
                <div class="task-description">${task.description}</div>
                <span class="task-scenario">${task.scenario}</span>
              </div>
              <div class="task-actions">
                ${this.expandedType === 'R' ? html`
                  <button class="task-action-btn" aria-label="执行任务" @click=${(e: Event) => { e.stopPropagation(); this.handleTaskAction(task, 'execute'); }}>
                    执行
                  </button>
                ` : ''}
                ${this.expandedType === 'A' ? html`
                  <button class="task-action-btn" aria-label="审批任务" @click=${(e: Event) => { e.stopPropagation(); this.handleTaskAction(task, 'approve'); }}>
                    审批
                  </button>
                  <button class="task-action-btn" aria-label="驳回任务" @click=${(e: Event) => { e.stopPropagation(); this.handleTaskAction(task, 'reject'); }}>
                    驳回
                  </button>
                ` : ''}
                ${this.expandedType === 'C' ? html`
                  <button class="task-action-btn" aria-label="回复任务" @click=${(e: Event) => { e.stopPropagation(); this.handleTaskAction(task, 'respond'); }}>
                    回复
                  </button>
                ` : ''}
                ${this.expandedType === 'I' ? html`
                  <button class="task-action-btn" aria-label="确认任务" @click=${(e: Event) => { e.stopPropagation(); this.handleTaskAction(task, 'acknowledge'); }}>
                    确认
                  </button>
                ` : ''}
              </div>
            </div>
          `)}
        </div>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-raci-task-section': ScRaciTaskSection;
  }
}

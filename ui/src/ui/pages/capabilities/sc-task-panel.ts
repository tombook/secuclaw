/**
 * sc-task-panel.ts
 * Task State Machine Visualization Panel
 * 
 * Displays task details with visual state machine, SLA countdown, and status transitions
 */

import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { I18nController } from '../../../i18n/lib/lit-controller.js';
import type { SecurityTask, TaskStatus, TaskPriority } from '../../capabilities-client.js';

// Valid state transitions
const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  'todo': ['in_progress', 'blocked'],
  'in_progress': ['done', 'blocked'],
  'blocked': ['in_progress', 'todo'],
  'done': ['closed'],
  'closed': [], // Can reopen via special action
};

// Status colors
const STATUS_COLORS: Record<TaskStatus, string> = {
  'todo': '#6B7280',
  'in_progress': '#3B82F6',
  'blocked': '#EF4444',
  'done': '#10B981',
  'closed': '#059669',
};

// Priority colors
const PRIORITY_COLORS: Record<TaskPriority, string> = {
  'P0': '#EF4444',
  'P1': '#F59E0B',
  'P2': '#3B82F6',
  'P3': '#6B7280',
};

@customElement('sc-task-panel')
export class ScTaskPanel extends LitElement {
  private i18n = new I18nController(this);

  @property({ type: Object })
  task: SecurityTask | null = null;

  @state()
  private selectedNewStatus: TaskStatus | null = null;

  @state()
  private reviewComment = '';

  @state()
  private blockReason = '';

  @state()
  private showReviewInput = false;

  @state()
  private showBlockInput = false;

  @state()
  private slaRemaining: number | null = null;

  private slaInterval: ReturnType<typeof setInterval> | null = null;

  static styles = css`
    :host {
      display: block;
      height: 100%;
    }

    .panel-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--sc-bg-primary, #ffffff);
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--sc-spacing-lg, 16px);
      border-bottom: 1px solid var(--sc-border-color, #e5e7eb);
    }

    .panel-title {
      font-size: var(--sc-font-size-lg, 18px);
      font-weight: 600;
      color: var(--sc-text-primary, #111827);
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: var(--sc-radius-md, 6px);
      color: var(--sc-text-secondary, #6b7280);
      transition: background 0.2s;
    }

    .close-btn:hover {
      background: var(--sc-bg-tertiary, #f3f4f6);
    }

    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: var(--sc-spacing-lg, 16px);
    }

    /* Task Info Section */
    .task-info {
      margin-bottom: var(--sc-spacing-xl, 24px);
    }

    .task-title {
      font-size: var(--sc-font-size-xl, 20px);
      font-weight: 600;
      color: var(--sc-text-primary, #111827);
      margin-bottom: var(--sc-spacing-sm, 8px);
    }

    .task-meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sc-spacing-sm, 8px);
      margin-bottom: var(--sc-spacing-md, 12px);
    }

    .meta-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: var(--sc-radius-full, 9999px);
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 500;
    }

    .priority-badge {
      color: white;
    }

    .status-badge {
      color: white;
    }

    .task-description {
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #6b7280);
      line-height: 1.5;
    }

    /* State Machine Section */
    .section-title {
      font-size: var(--sc-font-size-md, 16px);
      font-weight: 600;
      color: var(--sc-text-primary, #111827);
      margin-bottom: var(--sc-spacing-md, 12px);
    }

    .state-machine {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--sc-spacing-xs, 4px);
      margin-bottom: var(--sc-spacing-xl, 24px);
      padding: var(--sc-spacing-lg, 16px);
      background: var(--sc-bg-secondary, #f9fafb);
      border-radius: var(--sc-radius-lg, 8px);
    }

    .state-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 12px);
      border-radius: var(--sc-radius-md, 6px);
      background: var(--sc-bg-primary, #ffffff);
      border: 2px solid var(--sc-border-color, #e5e7eb);
      transition: all 0.3s;
      min-width: 80px;
    }

    .state-node.active {
      border-color: var(--sc-primary, #3b82f6);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    .state-node.completed {
      background: var(--sc-success-bg, #d1fae5);
      border-color: var(--sc-success, #10b981);
    }

    .state-icon {
      font-size: 20px;
      margin-bottom: 4px;
    }

    .state-label {
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 500;
      color: var(--sc-text-secondary, #6b7280);
    }

    .state-arrow {
      color: var(--sc-text-tertiary, #9ca3af);
      font-size: 16px;
    }

    /* SLA Section */
    .sla-section {
      margin-bottom: var(--sc-spacing-xl, 24px);
    }

    .sla-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--sc-spacing-md, 12px);
      border-radius: var(--sc-radius-md, 6px);
      border: 1px solid var(--sc-border-color, #e5e7eb);
    }

    .sla-label {
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #6b7280);
    }

    .sla-timer {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs, 4px);
      font-size: var(--sc-font-size-lg, 18px);
      font-weight: 600;
    }

    .sla-timer.on-track {
      color: var(--sc-success, #10b981);
    }

    .sla-timer.warning {
      color: var(--sc-warning, #f59e0b);
    }

    .sla-timer.breached {
      color: var(--sc-error, #ef4444);
    }

    /* Transition Section */
    .transition-section {
      margin-bottom: var(--sc-spacing-xl, 24px);
    }

    .transition-options {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sc-spacing-sm, 8px);
    }

    .transition-btn {
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 12px);
      border: 1px solid var(--sc-border-color, #e5e7eb);
      border-radius: var(--sc-radius-md, 6px);
      background: var(--sc-bg-primary, #ffffff);
      font-size: var(--sc-font-size-sm, 14px);
      cursor: pointer;
      transition: all 0.2s;
    }

    .transition-btn:hover {
      border-color: var(--sc-primary, #3b82f6);
      background: var(--sc-primary-bg, #eff6ff);
    }

    .transition-btn.selected {
      border-color: var(--sc-primary, #3b82f6);
      background: var(--sc-primary, #3b82f6);
      color: white;
    }

    /* Input Section */
    .input-section {
      margin-bottom: var(--sc-spacing-xl, 24px);
      padding: var(--sc-spacing-md, 12px);
      background: var(--sc-bg-secondary, #f9fafb);
      border-radius: var(--sc-radius-md, 6px);
    }

    .input-label {
      display: block;
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      color: var(--sc-text-primary, #111827);
      margin-bottom: var(--sc-spacing-xs, 4px);
    }

    .input-field {
      width: 100%;
      padding: var(--sc-spacing-sm, 8px);
      border: 1px solid var(--sc-border-color, #e5e7eb);
      border-radius: var(--sc-radius-md, 6px);
      font-size: var(--sc-font-size-sm, 14px);
      resize: vertical;
      min-height: 80px;
    }

    .input-field:focus {
      outline: none;
      border-color: var(--sc-primary, #3b82f6);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    /* Actions */
    .panel-actions {
      display: flex;
      gap: var(--sc-spacing-sm, 8px);
      padding: var(--sc-spacing-lg, 16px);
      border-top: 1px solid var(--sc-border-color, #e5e7eb);
    }

    .btn {
      flex: 1;
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 12px);
      border: none;
      border-radius: var(--sc-radius-md, 6px);
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: var(--sc-primary, #3b82f6);
      color: white;
    }

    .btn-primary:hover {
      background: var(--sc-primary-hover, #2563eb);
    }

    .btn-primary:disabled {
      background: var(--sc-border-color, #e5e7eb);
      cursor: not-allowed;
    }

    .btn-secondary {
      background: var(--sc-bg-tertiary, #f3f4f6);
      color: var(--sc-text-primary, #111827);
    }

    .btn-secondary:hover {
      background: var(--sc-border-color, #e5e7eb);
    }

    /* Quick Actions */
    .quick-actions {
      display: flex;
      gap: var(--sc-spacing-sm, 8px);
      margin-top: var(--sc-spacing-md, 12px);
    }

    .quick-btn {
      flex: 1;
      padding: var(--sc-spacing-sm, 8px);
      border: 1px solid var(--sc-border-color, #e5e7eb);
      border-radius: var(--sc-radius-md, 6px);
      background: var(--sc-bg-primary, #ffffff);
      font-size: var(--sc-font-size-xs, 12px);
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    .quick-btn:hover {
      border-color: var(--sc-primary, #3b82f6);
      background: var(--sc-primary-bg, #eff6ff);
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--sc-text-tertiary, #9ca3af);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.startSlaTimer();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopSlaTimer();
  }

  private startSlaTimer() {
    if (this.task?.slaMinutes && this.task.status !== 'closed') {
      this.updateSlaRemaining();
      this.slaInterval = setInterval(() => this.updateSlaRemaining(), 1000);
    }
  }

  private stopSlaTimer() {
    if (this.slaInterval) {
      clearInterval(this.slaInterval);
      this.slaInterval = null;
    }
  }

  private updateSlaRemaining() {
    if (!this.task?.slaMinutes) {
      this.slaRemaining = null;
      return;
    }

    const createdAt = this.task.createdAt;
    const slaMs = this.task.slaMinutes * 60 * 1000;
    const deadline = createdAt + slaMs;
    const remaining = deadline - Date.now();
    
    this.slaRemaining = remaining > 0 ? remaining : 0;
  }

  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  private getSlaStatus(): 'on-track' | 'warning' | 'breached' {
    if (!this.slaRemaining || !this.task?.slaMinutes) return 'on-track';
    
    const total = this.task.slaMinutes * 60 * 1000;
    const remaining = this.slaRemaining;
    const ratio = remaining / total;

    if (ratio <= 0) return 'breached';
    if (ratio <= 0.2) return 'warning';
    return 'on-track';
  }

  private getValidTransitions(): TaskStatus[] {
    if (!this.task) return [];
    return VALID_TRANSITIONS[this.task.status] || [];
  }

  private handleStatusSelect(status: TaskStatus) {
    this.selectedNewStatus = status;
    this.showReviewInput = status === 'closed';
    this.showBlockInput = status === 'blocked';
    this.reviewComment = '';
    this.blockReason = '';
  }

  private handleTransition() {
    if (!this.task || !this.selectedNewStatus) return;

    // Validate review comment for closed status
    if (this.selectedNewStatus === 'closed' && !this.reviewComment.trim()) {
      return;
    }

    // Validate block reason for blocked status
    if (this.selectedNewStatus === 'blocked' && !this.blockReason.trim()) {
      return;
    }

    this.dispatchEvent(new CustomEvent('task-status-change', {
      detail: {
        taskId: this.task.id,
        newStatus: this.selectedNewStatus,
        comment: this.reviewComment || this.blockReason,
      },
      bubbles: true,
      composed: true,
    }));

    // Reset state
    this.selectedNewStatus = null;
    this.reviewComment = '';
    this.blockReason = '';
    this.showReviewInput = false;
    this.showBlockInput = false;
  }

  private handleClose() {
    this.dispatchEvent(new CustomEvent('close-panel', {
      bubbles: true,
      composed: true,
    }));
  }

  private handleViewLogs() {
    this.dispatchEvent(new CustomEvent('view-logs', {
      detail: { taskId: this.task?.id },
      bubbles: true,
      composed: true,
    }));
  }

  private handleViewEvidence() {
    this.dispatchEvent(new CustomEvent('view-evidence', {
      detail: { taskId: this.task?.id },
      bubbles: true,
      composed: true,
    }));
  }

  private getStateIcon(status: TaskStatus): string {
    const icons: Record<TaskStatus, string> = {
      'todo': '📋',
      'in_progress': '🔄',
      'blocked': '🚫',
      'done': '✅',
      'closed': '🔒',
    };
    return icons[status] || '📋';
  }

  private renderStateMachine() {
    const states: TaskStatus[] = ['todo', 'in_progress', 'done', 'closed'];
    const currentStatus = this.task?.status || 'todo';

    return html`
      <div class="state-machine">
        ${states.map((status, index) => {
          const isActive = status === currentStatus;
          const isCompleted = states.indexOf(currentStatus) > index;
          
          return html`
            <div class="state-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}">
              <span class="state-icon">${this.getStateIcon(status)}</span>
              <span class="state-label">${this.i18n.t(`capabilities.status.${status}`)}</span>
            </div>
            ${index < states.length - 1 ? html`<span class="state-arrow">→</span>` : ''}
          `;
        })}
        ${currentStatus === 'blocked' ? html`
          <span class="state-arrow">←</span>
          <div class="state-node active" style="border-color: #EF4444;">
            <span class="state-icon">🚫</span>
            <span class="state-label">${this.i18n.t('capabilities.status.blocked')}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  render() {
    if (!this.task) {
      return html`
        <div class="panel-container">
          <div class="empty-state">
            <p>${this.i18n.t('common.noData')}</p>
          </div>
        </div>
      `;
    }

    const validTransitions = this.getValidTransitions();
    const canTransition = validTransitions.length > 0;
    const slaStatus = this.getSlaStatus();

    return html`
      <div class="panel-container">
        <div class="panel-header">
          <h2 class="panel-title">${this.i18n.t('capabilities.taskPanel.title')}</h2>
          <button class="close-btn" @click=${this.handleClose}>✕</button>
        </div>

        <div class="panel-content">
          <!-- Task Info -->
          <div class="task-info">
            <h3 class="task-title">${this.task.title}</h3>
            <div class="task-meta">
              <span class="meta-badge priority-badge" style="background: ${PRIORITY_COLORS[this.task.priority]}">
                ${this.task.priority}
              </span>
              <span class="meta-badge status-badge" style="background: ${STATUS_COLORS[this.task.status]}">
                ${this.i18n.t(`capabilities.status.${this.task.status}`)}
              </span>
            </div>
            ${this.task.description ? html`
              <p class="task-description">${this.task.description}</p>
            ` : ''}
          </div>

          <!-- State Machine -->
          <h4 class="section-title">${this.i18n.t('capabilities.taskPanel.stateMachine')}</h4>
          ${this.renderStateMachine()}

          <!-- SLA Countdown -->
          ${this.task.slaMinutes && this.task.status !== 'closed' ? html`
            <div class="sla-section">
              <h4 class="section-title">${this.i18n.t('capabilities.taskPanel.slaCountdown')}</h4>
              <div class="sla-card">
                <span class="sla-label">剩余时间</span>
                <span class="sla-timer ${slaStatus}">
                  ${this.slaRemaining !== null ? this.formatDuration(this.slaRemaining) : '--'}
                  ${slaStatus === 'breached' ? '⚠️' : slaStatus === 'warning' ? '⏰' : '✓'}
                </span>
              </div>
            </div>
          ` : ''}

          <!-- Status Transition -->
          ${canTransition ? html`
            <div class="transition-section">
              <h4 class="section-title">${this.i18n.t('capabilities.taskPanel.transitionTo')}</h4>
              <div class="transition-options">
                ${validTransitions.map(status => html`
                  <button 
                    class="transition-btn ${this.selectedNewStatus === status ? 'selected' : ''}"
                    @click=${() => this.handleStatusSelect(status)}
                  >
                    ${this.getStateIcon(status)} ${this.i18n.t(`capabilities.status.${status}`)}
                  </button>
                `)}
              </div>

              <!-- Review Comment Input (for closed status) -->
              ${this.showReviewInput ? html`
                <div class="input-section">
                  <label class="input-label">${this.i18n.t('capabilities.taskPanel.reviewRequired')}</label>
                  <textarea 
                    class="input-field"
                    placeholder=${this.i18n.t('capabilities.taskPanel.reviewPlaceholder')}
                    .value=${this.reviewComment}
                    @input=${(e: Event) => this.reviewComment = (e.target as HTMLTextAreaElement).value}
                  ></textarea>
                </div>
              ` : ''}

              <!-- Block Reason Input -->
              ${this.showBlockInput ? html`
                <div class="input-section">
                  <label class="input-label">${this.i18n.t('capabilities.taskPanel.blockReason')}</label>
                  <textarea 
                    class="input-field"
                    placeholder=${this.i18n.t('capabilities.taskPanel.blockReasonPlaceholder')}
                    .value=${this.blockReason}
                    @input=${(e: Event) => this.blockReason = (e.target as HTMLTextAreaElement).value}
                  ></textarea>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <!-- Quick Actions -->
          <div class="quick-actions">
            <button class="quick-btn" @click=${this.handleViewLogs}>
              📋 ${this.i18n.t('capabilities.taskPanel.viewLogs')}
            </button>
            <button class="quick-btn" @click=${this.handleViewEvidence}>
              📁 ${this.i18n.t('capabilities.taskPanel.viewEvidence')}
            </button>
          </div>
        </div>

        <!-- Actions -->
        ${this.selectedNewStatus ? html`
          <div class="panel-actions">
            <button class="btn btn-secondary" @click=${() => this.selectedNewStatus = null}>
              ${this.i18n.t('common.cancel')}
            </button>
            <button 
              class="btn btn-primary"
              @click=${this.handleTransition}
              ?disabled=${(this.showReviewInput && !this.reviewComment.trim()) || (this.showBlockInput && !this.blockReason.trim())}
            >
              ${this.i18n.t('common.confirm')}
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-task-panel': ScTaskPanel;
  }
}

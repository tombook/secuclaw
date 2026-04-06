/**
 * sc-domain-board.ts
 * Domain Board Component (Enhanced V2)
 * 
 * Integrates task panel, run log panel, evidence panel, approval dialog, and KPI drawer
 */

import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { I18nController } from '../../../i18n/lib/lit-controller.js';
import { 
  capabilitiesClient, 
  type CapabilityItem, 
  type CapabilityDomain, 
  type SecurityTask, 
  type ExecutionRun, 
  type EvidencePack,
  type Approval,
  type DomainId 
} from '../../capabilities-client.js';

// Import new components
import './sc-task-panel.js';
import './sc-run-log-panel.js';
import './sc-evidence-panel.js';
import './sc-approval-dialog.js';
import './sc-kpi-explain-drawer.js';

type PanelType = 'task' | 'runs' | 'evidence' | 'kpi' | null;

@customElement('sc-domain-board')
export class ScDomainBoard extends LitElement {
  private i18n = new I18nController(this);

  @property({ type: Object })
  domain: CapabilityDomain | null = null;

  @state()
  private items: CapabilityItem[] = [];

  @state()
  private tasks: SecurityTask[] = [];

  @state()
  private loading = false;

  // Panel states
  @state()
  private activePanel: PanelType = null;

  @state()
  private selectedTask: SecurityTask | null = null;

  @state()
  private selectedRuns: ExecutionRun[] = [];

  @state()
  private selectedEvidence: EvidencePack[] = [];

  @state()
  private showApprovalDialog = false;

  @state()
  private pendingCapability: CapabilityItem | null = null;

  @state()
  private existingApproval: Approval | null = null;

  @state()
  private showKpiDrawer = false;

  static styles = css`
    :host { display: block; padding: var(--sc-spacing-xl); }
    
    .domain-header {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md);
      margin-bottom: var(--sc-spacing-xl);
      padding-bottom: var(--sc-spacing-lg);
      border-bottom: 1px solid var(--sc-border-color);
    }
    
    .domain-icon {
      font-size: 32px;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--sc-radius-lg);
    }
    
    .domain-info h2 {
      margin: 0;
      font-size: var(--sc-font-size-xl);
      font-weight: 600;
      color: var(--sc-text-primary);
    }
    
    .domain-info p {
      margin: var(--sc-spacing-xs) 0 0;
      color: var(--sc-text-secondary);
      font-size: var(--sc-font-size-sm);
    }
    
    /* KPI Bar */
    .kpi-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--sc-spacing-md);
      margin-bottom: var(--sc-spacing-xl);
    }
    
    .kpi-card {
      background: var(--sc-bg-card);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      padding: var(--sc-spacing-md);
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }
    
    .kpi-card:hover {
      border-color: var(--sc-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .kpi-info-icon {
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 14px;
      color: var(--sc-text-tertiary);
    }
    
    .kpi-value {
      font-size: var(--sc-font-size-2xl);
      font-weight: 600;
    }
    
    .kpi-label {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-tertiary);
      margin-top: var(--sc-spacing-xs);
    }
    
    .kpi-positive { color: var(--sc-success); }
    .kpi-negative { color: var(--sc-error); }
    .kpi-neutral { color: var(--sc-text-secondary); }
    
    .section-title {
      font-size: var(--sc-font-size-lg);
      font-weight: 600;
      color: var(--sc-text-primary);
      margin-bottom: var(--sc-spacing-md);
    }
    
    /* Capabilities Grid */
    .capabilities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--sc-spacing-md);
      margin-bottom: var(--sc-spacing-xl);
    }
    
    .capability-card {
      background: var(--sc-bg-card);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-lg);
      padding: var(--sc-spacing-md);
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    
    .capability-card:hover {
      border-color: var(--sc-primary);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .capability-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--sc-spacing-sm);
    }
    
    .capability-name {
      font-size: var(--sc-font-size-md);
      font-weight: 600;
      color: var(--sc-text-primary);
    }
    
    .approval-badge {
      background: var(--sc-warning-bg);
      color: var(--sc-warning);
      padding: 2px 8px;
      border-radius: var(--sc-radius-full);
      font-size: var(--sc-font-size-xs);
    }
    
    .capability-desc {
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-secondary);
      margin-bottom: var(--sc-spacing-md);
    }
    
    .capability-roles {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sc-spacing-xs);
      margin-bottom: var(--sc-spacing-md);
    }
    
    .role-tag {
      padding: 2px 8px;
      background: var(--sc-bg-tertiary);
      border-radius: var(--sc-radius-sm);
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-secondary);
    }
    
    .role-tag.owner {
      background: var(--sc-primary-bg);
      color: var(--sc-primary);
    }
    
    /* Buttons */
    .btn {
      padding: var(--sc-spacing-sm) var(--sc-spacing-md);
      border: none;
      border-radius: var(--sc-radius-md);
      font-size: var(--sc-font-size-sm);
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .btn-primary {
      background: var(--sc-primary);
      color: white;
    }
    
    .btn-primary:hover {
      background: var(--sc-primary-hover);
    }
    
    .btn-secondary {
      background: var(--sc-bg-tertiary);
      color: var(--sc-text-primary);
    }
    
    .btn-secondary:hover {
      background: var(--sc-border-color);
    }
    
    .btn-sm {
      padding: 4px 8px;
      font-size: var(--sc-font-size-xs);
    }
    
    /* Tasks Section */
    .tasks-section {
      margin-top: var(--sc-spacing-xl);
    }
    
    .task-list {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-sm);
    }
    
    .task-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--sc-spacing-sm) var(--sc-spacing-md);
      background: var(--sc-bg-secondary);
      border-radius: var(--sc-radius-md);
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .task-item:hover {
      background: var(--sc-bg-tertiary);
    }
    
    .task-info {
      flex: 1;
    }
    
    .task-title {
      font-weight: 500;
      color: var(--sc-text-primary);
    }
    
    .task-meta {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-tertiary);
      margin-top: 2px;
    }
    
    .task-actions {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm);
    }
    
    .task-status {
      padding: 4px 8px;
      border-radius: var(--sc-radius-sm);
      font-size: var(--sc-font-size-xs);
      font-weight: 500;
    }
    
    .status-todo { background: var(--sc-bg-tertiary); color: var(--sc-text-secondary); }
    .status-in_progress { background: var(--sc-primary-bg); color: var(--sc-primary); }
    .status-done { background: var(--sc-success-bg); color: var(--sc-success); }
    .status-blocked { background: var(--sc-error-bg); color: var(--sc-error); }
    .status-closed { background: var(--sc-success-bg); color: var(--sc-success); }
    
    .empty-state {
      text-align: center;
      color: var(--sc-text-tertiary);
      padding: var(--sc-spacing-xl);
    }
    
    /* Drawer Overlay */
    .drawer-overlay {
      position: fixed;
      top: 0;
      right: 0;
      width: 480px;
      height: 100vh;
      background: var(--sc-bg-primary, #ffffff);
      border-left: 1px solid var(--sc-border-color, #e5e7eb);
      box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      overflow-y: auto;
    }
    
    .drawer-overlay.open {
      transform: translateX(0);
    }
    
    .drawer-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 999;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    if (this.domain) {
      this.loadDomainData();
    }
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('domain') && this.domain) {
      this.closePanel();
      this.loadDomainData();
    }
  }

  private async loadDomainData() {
    if (!this.domain) return;
    
    this.loading = true;
    try {
      const [items, tasks] = await Promise.all([
        capabilitiesClient.listItems({ domainId: this.domain.id }),
        capabilitiesClient.listTasks({ domainId: this.domain.id }),
      ]);
      this.items = items;
      this.tasks = tasks;
    } catch (error) {
      console.error('[sc-domain-board] Failed to load data, using mock data:', error);
      // Mock data fallback
      this.items = [
        { id: 'item-1', name: '威胁检测', description: '实时威胁检测能力', category: 'detection', enabled: true, config: {}, ownerRoles: ['security-expert'], partnerRoles: ['secuclaw-commander'], requiresApproval: false },
        { id: 'item-2', name: '漏洞扫描', description: '自动化漏洞扫描', category: 'scanning', enabled: true, config: {}, ownerRoles: ['security-expert'], partnerRoles: [], requiresApproval: false },
      ] as unknown as CapabilityItem[];
      this.tasks = [
        { id: 'task-1', title: '执行安全扫描', description: '对目标系统进行安全扫描', status: 'todo', priority: 'P1', domainId: this.domain.id as DomainId, capabilityId: 'item-1', assigneeRole: 'security-expert', createdAt: Date.now(), updatedAt: Date.now() },
        { id: 'task-2', title: '分析威胁情报', description: '分析最新威胁情报', status: 'in_progress', priority: 'P2', domainId: this.domain.id as DomainId, capabilityId: 'item-1', assigneeRole: 'security-expert', createdAt: Date.now(), updatedAt: Date.now() },
      ] as unknown as SecurityTask[];
    }
    this.loading = false;
  }

  // ==================== Panel Handlers ====================

  private handleTaskClick(task: SecurityTask) {
    this.selectedTask = task;
    this.activePanel = 'task';
  }

  private async handleViewLogs(task: SecurityTask) {
    try {
      const runs = await capabilitiesClient.listRunsByTask(task.id);
      this.selectedRuns = runs;
    } catch (error) {
      console.error('[sc-domain-board] Failed to load runs:', error);
      this.selectedRuns = [];
    }
    this.selectedTask = task;
    this.activePanel = 'runs';
  }

  private async handleViewEvidence(task: SecurityTask) {
    try {
      const evidence = await capabilitiesClient.listEvidence({ taskId: task.id });
      this.selectedEvidence = evidence;
    } catch (error) {
      console.error('[sc-domain-board] Failed to load evidence:', error);
      this.selectedEvidence = [];
    }
    this.selectedTask = task;
    this.activePanel = 'evidence';
  }

  private handleKpiClick() {
    this.showKpiDrawer = true;
  }

  private closePanel() {
    this.activePanel = null;
    this.selectedTask = null;
    this.selectedRuns = [];
    this.selectedEvidence = [];
  }

  // ==================== Approval Handlers ====================

  private async handleExecuteCapability(item: CapabilityItem) {
    // For dark domain, show approval dialog (per spec section 13.3)
    if (this.domain?.id === 'dark') {
      this.pendingCapability = item;
      this.showApprovalDialog = true;
      return;
    }
    
    // For non-dark domains, create task directly
    await this.createTaskForCapability(item);
  }

  private async createTaskForCapability(item: CapabilityItem) {
    try {
      await capabilitiesClient.createTask({
        domainId: this.domain!.id,
        capabilityId: item.id,
        title: item.name,
        priority: 'P2',
        assigneeRole: item.ownerRoles[0] || 'security-expert',
      });
      await this.loadDomainData();
    } catch (error) {
      console.error('[sc-domain-board] Failed to create task:', error);
    }
  }

  private handleApprovalCreated(e: CustomEvent) {
    const { approval } = e.detail;
    this.existingApproval = approval;
    
    // If approved, proceed with execution
    if (approval.status === 'approved' && this.pendingCapability) {
      this.createTaskForCapability(this.pendingCapability);
    }
  }

  private handleApprovalClosed() {
    this.showApprovalDialog = false;
    this.pendingCapability = null;
  }

  // ==================== Task Status Handler ====================

  private async handleTaskStatusChange(e: CustomEvent) {
    const { taskId, newStatus, comment } = e.detail;
    
    try {
      await capabilitiesClient.updateTaskStatus({
        id: taskId,
        status: newStatus,
        comment,
      });
      await this.loadDomainData();
      this.closePanel();
    } catch (error) {
      console.error('[sc-domain-board] Failed to update task status:', error);
    }
  }

  private async handleStatusChange(task: SecurityTask, newStatus: string) {
    try {
      await capabilitiesClient.updateTaskStatus({
        id: task.id,
        status: newStatus as any,
      });
      await this.loadDomainData();
    } catch (error) {
      console.error('[sc-domain-board] Failed to update task:', error);
    }
  }

  // ==================== Render Methods ====================

  render() {
    if (this.loading) {
      return html`<div class="empty-state">${this.i18n.t('common.loading')}</div>`;
    }

    if (!this.domain) {
      return html`<div class="empty-state">${this.i18n.t('common.noData')}</div>`;
    }

    const kpi = this.domain.kpi;
    const domainColor = this.getDomainColor(this.domain.id);

    return html`
      <div class="domain-header">
        <div class="domain-icon" style="background: ${domainColor}20">
          ${this.getDomainIcon(this.domain.id)}
        </div>
        <div class="domain-info">
          <h2>${this.domain.name}</h2>
          <p>${this.domain.description}</p>
        </div>
      </div>
      
      <!-- KPI Bar with info icons -->
      <div class="kpi-bar">
        <div class="kpi-card" @click=${this.handleKpiClick}>
          <span class="kpi-info-icon">ℹ️</span>
          <div class="kpi-value ${kpi.riskScore > 70 ? 'kpi-negative' : 'kpi-neutral'}">${kpi.riskScore}</div>
          <div class="kpi-label">${this.i18n.t('capabilities.metrics.riskScore')}</div>
        </div>
        <div class="kpi-card" @click=${this.handleKpiClick}>
          <span class="kpi-info-icon">ℹ️</span>
          <div class="kpi-value kpi-positive">${kpi.closureRate}%</div>
          <div class="kpi-label">${this.i18n.t('capabilities.metrics.closureRate')}</div>
        </div>
        <div class="kpi-card" @click=${this.handleKpiClick}>
          <span class="kpi-info-icon">ℹ️</span>
          <div class="kpi-value kpi-positive">${kpi.slaRate}%</div>
          <div class="kpi-label">${this.i18n.t('capabilities.metrics.slaRate')}</div>
        </div>
        <div class="kpi-card" @click=${this.handleKpiClick}>
          <span class="kpi-info-icon">ℹ️</span>
          <div class="kpi-value ${kpi.trend >= 0 ? 'kpi-positive' : 'kpi-negative'}">
            ${kpi.trend >= 0 ? '↑' : '↓'} ${Math.abs(kpi.trend * 100).toFixed(0)}%
          </div>
          <div class="kpi-label">${this.i18n.t('capabilities.metrics.trend')}</div>
        </div>
      </div>
      
      <!-- Capabilities Grid -->
      <h3 class="section-title">${this.i18n.t('capabilities.capabilities')} (${this.items.length})</h3>
      
      ${this.items.length === 0 ? html`
        <div class="empty-state">${this.i18n.t('common.noData')}</div>
      ` : html`
        <div class="capabilities-grid">
          ${this.items.map(item => html`
            <div class="capability-card">
              <div class="capability-header">
                <span class="capability-name">${item.name}</span>
                ${item.requiresApproval ? html`
                  <span class="approval-badge">⚠️ ${this.i18n.t('capabilities.requiresApproval')}</span>
                ` : ''}
              </div>
              <p class="capability-desc">${item.description}</p>
              <div class="capability-roles">
                ${item.ownerRoles.map(role => html`
                  <span class="role-tag owner">${this.i18n.t(`roles.${role}`)}</span>
                `)}
                ${item.partnerRoles.map(role => html`
                  <span class="role-tag">${this.i18n.t(`roles.${role}`)}</span>
                `)}
              </div>
              <button class="btn btn-primary" @click=${() => this.handleExecuteCapability(item)}>
                ${this.i18n.t('capabilities.execute')}
              </button>
            </div>
          `)}
        </div>
      `}
      
      <!-- Tasks Section with action buttons -->
      <div class="tasks-section">
        <h3 class="section-title">${this.i18n.t('capabilities.tasks')} (${this.tasks.length})</h3>
        
        ${this.tasks.length === 0 ? html`
          <div class="empty-state">${this.i18n.t('capabilities.noTasks')}</div>
        ` : html`
          <div class="task-list">
            ${this.tasks.map(task => html`
              <div class="task-item" @click=${() => this.handleTaskClick(task)}>
                <div class="task-info">
                  <div class="task-title">${task.title}</div>
                  <div class="task-meta">
                    ${task.priority} · ${this.i18n.t(`roles.${task.assigneeRole}`)} · 
                    ${new Date(task.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div class="task-actions">
                  <button 
                    class="btn btn-secondary btn-sm" 
                    @click=${(e: Event) => { e.stopPropagation(); this.handleViewLogs(task); }}
                    title="${this.i18n.t('capabilities.taskPanel.viewLogs')}"
                  >
                    📋
                  </button>
                  <button 
                    class="btn btn-secondary btn-sm" 
                    @click=${(e: Event) => { e.stopPropagation(); this.handleViewEvidence(task); }}
                    title="${this.i18n.t('capabilities.taskPanel.viewEvidence')}"
                  >
                    📁
                  </button>
                  <select 
                    class="task-status status-${task.status}"
                    @click=${(e: Event) => e.stopPropagation()}
                    @change=${(e: Event) => this.handleStatusChange(task, (e.target as HTMLSelectElement).value)}
                  >
                    <option value="todo" ?selected=${task.status === 'todo'}>${this.i18n.t('capabilities.status.todo')}</option>
                    <option value="in_progress" ?selected=${task.status === 'in_progress'}>${this.i18n.t('capabilities.status.in_progress')}</option>
                    <option value="done" ?selected=${task.status === 'done'}>${this.i18n.t('capabilities.status.done')}</option>
                    <option value="blocked" ?selected=${task.status === 'blocked'}>${this.i18n.t('capabilities.status.blocked')}</option>
                    <option value="closed" ?selected=${task.status === 'closed'}>${this.i18n.t('capabilities.status.closed')}</option>
                  </select>
                </div>
              </div>
            `)}
          </div>
        `}
      </div>

      <!-- Drawer Panels -->
      ${this.renderDrawer()}

      <!-- KPI Drawer -->
      <sc-kpi-explain-drawer
        .isOpen=${this.showKpiDrawer}
        .domainId=${this.domain?.id}
        .kpi=${this.domain?.kpi}
        @close-drawer=${() => this.showKpiDrawer = false}
      ></sc-kpi-explain-drawer>

      <!-- Approval Dialog -->
      ${this.showApprovalDialog ? html`
        <sc-approval-dialog
          .task=${null}
          .existingApproval=${this.existingApproval}
          .mode=${'create'}
          .currentUser=${'security-expert'}
          @close-dialog=${this.handleApprovalClosed}
          @approval-created=${this.handleApprovalCreated}
        ></sc-approval-dialog>
      ` : ''}
    `;
  }

  private renderDrawer() {
    if (!this.activePanel) return null;

    return html`
      <div class="drawer-backdrop" @click=${this.closePanel}></div>
      <div class="drawer-overlay open">
        ${this.activePanel === 'task' && this.selectedTask ? html`
          <sc-task-panel
            .task=${this.selectedTask}
            @close-panel=${this.closePanel}
            @task-status-change=${this.handleTaskStatusChange}
            @view-logs=${() => this.handleViewLogs(this.selectedTask!)}
            @view-evidence=${() => this.handleViewEvidence(this.selectedTask!)}
          ></sc-task-panel>
        ` : ''}
        
        ${this.activePanel === 'runs' && this.selectedRuns.length > 0 ? html`
          <sc-run-log-panel
            .run=${this.selectedRuns[0]}
            .allRuns=${this.selectedRuns}
            @close-panel=${this.closePanel}
          ></sc-run-log-panel>
        ` : ''}
        
        ${this.activePanel === 'evidence' ? html`
          <sc-evidence-panel
            .evidence=${this.selectedEvidence}
            .taskId=${this.selectedTask?.id}
            @close-panel=${this.closePanel}
          ></sc-evidence-panel>
        ` : ''}
      </div>
    `;
  }

  private getDomainColor(domainId: DomainId): string {
    const colors: Record<DomainId, string> = {
      light: '#10B981',
      dark: '#EF4444',
      security: '#3B82F6',
      legal: '#8B5CF6',
      technology: '#F59E0B',
      business: '#EC4899',
    };
    return colors[domainId] || '#6B7280';
  }

  private getDomainIcon(domainId: DomainId): string {
    const icons: Record<DomainId, string> = {
      light: '🛡️',
      dark: '⚔️',
      security: '🔍',
      legal: '⚖️',
      technology: '🔧',
      business: '📊',
    };
    return icons[domainId] || '📋';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-domain-board': ScDomainBoard;
  }
}

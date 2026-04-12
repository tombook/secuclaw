/**
 * SecuClaw Capabilities Center Page - 能力中心页面
 * 
 * 6大能力域管理、任务执行、审批流程、证据收集
 * AI能力: 任务推荐、执行建议
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { dataService } from '../data-service.js';
import '../components/sc-ai-assistant.js';
import '../components/sc-metric-card.js';
import '../components/sc-smart-recommendation-bar.js';

// ============ 类型定义 ============

type DomainId = 'light' | 'dark' | 'security' | 'legal' | 'technology' | 'business';

interface Domain {
  id: DomainId;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  taskCount: number;
  kpi: {
    riskScore: number;
    closureRate: number;
    slaRate: number;
  };
}

interface Task {
  id: string;
  title: string;
  domainId: DomainId;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'todo' | 'in_progress' | 'blocked' | 'done' | 'closed';
  assigneeRole: string;
  dueAt?: number;
  slaMinutes?: number;
}

// ============ 页面组件 ============

@customElement('sc-capabilities-page')
export class ScCapabilitiesPage extends LitElement {
  // ============ 状态 ============

  // @ts-ignore - Reserved for i18n
  private i18n = new I18nController(this);

  @state()
  private loading = true;

  @state()
  private domains: Domain[] = [];

  @state()
  private tasks: Task[] = [];

  @state()
  private selectedDomain: DomainId | 'all' = 'all';

  @state()
  private taskStats = {
    total: 0,
    todo: 0,
    inProgress: 0,
    done: 0,
    closed: 0
  };

  // @ts-ignore - Reserved for AI recommendations
  @state()
  private _recommendations: any[] = [];

  // Modal states
  @state()
  private showTaskModal = false;

  @state()
  private editingTask: Task | null = null;

  @state()
  private taskForm = {
    title: '',
    domainId: 'security' as DomainId,
    priority: 'P1' as Task['priority'],
    assigneeRole: '',
    description: '',
    slaMinutes: 480
  };

  // Approval modal for dark side
  @state()
  private showApprovalModal = false;

  @state()
  private approvalTask: Task | null = null;

  @state()
  private approvalForm = {
    scope: '',
    ticketNo: '',
    reason: '',
    expiresDays: 7
  };

  // Evidence panel (reserved for future use)
  // @state() private showEvidencePanel = false;
  // @state() private selectedTaskEvidence: { runId?: string; taskId?: string } | null = null;

  // Toast
  @state()
  private toastMessage = '';

  @state()
  private toastType: 'success' | 'error' | 'info' = 'info';

  // ============ 样式 ============

  static styles = css`
    :host {
      display: block;
      height: 100%;
    }

    .page-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 20px;
      height: 100%;
      overflow-y: auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background-color: var(--sc-primary, #3b82f6);
      color: white;
    }

    .btn-primary:hover {
      background-color: var(--sc-primary-dark, #2563eb);
    }

    .btn-secondary {
      background-color: var(--sc-bg-secondary, #f1f5f9);
      color: var(--sc-text-primary, #1e293b);
    }

    /* Domains Grid */
    .domains-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .domain-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: all 0.2s ease;
      border: 2px solid transparent;
    }

    .domain-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateY(-2px);
    }

    .domain-card.selected {
      border-color: var(--sc-primary, #3b82f6);
    }

    .domain-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .domain-icon {
      font-size: 32px;
    }

    .domain-name {
      font-size: 18px;
      font-weight: 600;
    }

    .domain-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 16px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 600;
    }

    .stat-label {
      font-size: 12px;
      color: var(--sc-text-secondary, #64748b);
    }

    /* Tasks Section */
    .tasks-section {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .tasks-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .tasks-title {
      font-size: 18px;
      font-weight: 600;
    }

    .task-filters {
      display: flex;
      gap: 8px;
    }

    .filter-btn {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      border: 1px solid var(--sc-border, #e2e8f0);
      background: white;
      cursor: pointer;
    }

    .filter-btn.active {
      background: var(--sc-primary, #3b82f6);
      color: white;
      border-color: var(--sc-primary, #3b82f6);
    }

    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .task-item {
      display: flex;
      align-items: center;
      padding: 12px;
      border-radius: 8px;
      background: var(--sc-bg-secondary, #f8fafc);
      gap: 12px;
    }

    .task-priority {
      width: 4px;
      height: 40px;
      border-radius: 2px;
    }

    .task-priority.P0 { background: #dc2626; }
    .task-priority.P1 { background: #f97316; }
    .task-priority.P2 { background: #eab308; }
    .task-priority.P3 { background: #22c55e; }

    .task-content {
      flex: 1;
    }

    .task-title {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .task-meta {
      font-size: 12px;
      color: var(--sc-text-secondary, #64748b);
    }

    .task-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .task-status.todo { background: #fef3c7; color: #92400e; }
    .task-status.in_progress { background: #dbeafe; color: #1e40af; }
    .task-status.done { background: #dcfce7; color: #166534; }
    .task-status.closed { background: #f1f5f9; color: #64748b; }

    /* KPI Cards */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    @media (max-width: 1024px) {
      .kpi-row {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--sc-text-secondary, #64748b);
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: var(--sc-bg-primary, #ffffff);
      border-radius: var(--sc-radius-lg, 12px);
      width: 480px;
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
      box-shadow: var(--sc-shadow-lg, 0 10px 25px rgba(0, 0, 0, 0.15));
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--sc-border-color, #e5e7eb);
    }

    .modal-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--sc-text-primary, #111827);
    }

    .modal-close {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      font-size: 24px;
      cursor: pointer;
      color: var(--sc-text-secondary, #6b7280);
      border-radius: var(--sc-radius-md, 8px);
    }

    .modal-close:hover {
      background: var(--sc-bg-hover, #f3f4f6);
    }

    .modal-body {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: var(--sc-text-primary, #111827);
      margin-bottom: 6px;
    }

    .form-input, .form-select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--sc-border-color, #e5e7eb);
      border-radius: var(--sc-radius-md, 8px);
      font-size: 14px;
      background: var(--sc-bg-primary, #ffffff);
      color: var(--sc-text-primary, #111827);
      box-sizing: border-box;
    }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: var(--sc-primary, #3b82f6);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid var(--sc-border-color, #e5e7eb);
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: var(--sc-radius-md, 8px);
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }

    .btn-primary {
      background: var(--sc-primary, #3b82f6);
      color: white;
    }

    .btn-primary:hover {
      background: color-mix(in srgb, var(--sc-primary, #3b82f6) 85%, black);
    }

    .btn-secondary {
      background: var(--sc-bg-secondary, #f3f4f6);
      color: var(--sc-text-primary, #111827);
    }

    .btn-danger {
      background: var(--sc-danger, #ef4444);
      color: white;
    }

    .btn-warning {
      background: var(--sc-warning, #f59e0b);
      color: white;
    }

    /* Toast Styles */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 20px;
      border-radius: var(--sc-radius-md, 8px);
      font-size: 14px;
      font-weight: 500;
      z-index: 1001;
      animation: slideIn 0.3s ease;
      box-shadow: var(--sc-shadow-lg);
    }

    .toast.success { background: var(--sc-success, #10b981); color: white; }
    .toast.error { background: var(--sc-danger, #ef4444); color: white; }
    .toast.info { background: var(--sc-primary, #3b82f6); color: white; }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    /* Dark domain warning */
    .dark-warning {
      background: rgba(124, 58, 237, 0.1);
      border: 1px solid #7c3aed;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
      font-size: 13px;
      color: #7c3aed;
    }
  `;

  // ============ 生命周期 ============

  constructor() {
    super();
    this.loadData();
  }

  private async loadData() {
    this.loading = true;
    try {
      await Promise.all([
        this.loadDomains(),
        this.loadTasks()
      ]);
    } catch (error) {
      console.error('Failed to load capabilities data:', error);
    } finally {
      this.loading = false;
    }
  }

  private async loadDomains() {
    // Mock domains data
    this.domains = [
      { id: 'light', name: '光明能力域', nameEn: 'Light', icon: '☀️', color: '#fbbf24', taskCount: 12, kpi: { riskScore: 72, closureRate: 85, slaRate: 92 } },
      { id: 'dark', name: '黑暗能力域', nameEn: 'Dark', icon: '🌑', color: '#7c3aed', taskCount: 5, kpi: { riskScore: 45, closureRate: 60, slaRate: 78 } },
      { id: 'security', name: '安全能力域', nameEn: 'Security', icon: '🛡️', color: '#3b82f6', taskCount: 28, kpi: { riskScore: 68, closureRate: 80, slaRate: 88 } },
      { id: 'legal', name: '合规能力域', nameEn: 'Legal', icon: '⚖️', color: '#10b981', taskCount: 15, kpi: { riskScore: 55, closureRate: 90, slaRate: 95 } },
      { id: 'technology', name: '技术能力域', nameEn: 'Technology', icon: '🔧', color: '#06b6d4', taskCount: 20, kpi: { riskScore: 62, closureRate: 75, slaRate: 82 } },
      { id: 'business', name: '业务能力域', nameEn: 'Business', icon: '📊', color: '#f97316', taskCount: 10, kpi: { riskScore: 48, closureRate: 88, slaRate: 90 } }
    ];
  }

  private async loadTasks() {
    // Get tasks from capabilities API
    try {
      const response = await dataService.getIncidents({ pageSize: 100 });
      // Map to task format
      this.tasks = response.slice(0, 20).map((inc) => ({
        id: inc.id,
        title: inc.info.title,
        domainId: 'security',
        priority: this.mapPriority(inc.info.severity),
        status: this.mapStatus(inc.workflow.status),
        assigneeRole: inc.workflow.assigneeRole || 'analyst',
        dueAt: inc.sla.resolutionDeadline,
        slaMinutes: 240
      }));
    } catch (error) {
      console.error('Failed to load tasks:', error);
      // Mock data fallback
      this.tasks = [
        { id: '1', title: 'Log4j漏洞修复跟踪', domainId: 'security', priority: 'P0', status: 'in_progress', assigneeRole: '安全专家', dueAt: Date.now() + 86400000, slaMinutes: 240 },
        { id: '2', title: '钓鱼邮件事件调查', domainId: 'security', priority: 'P1', status: 'todo', assigneeRole: '安全运营官', slaMinutes: 480 },
        { id: '3', title: '合规审计证据收集', domainId: 'legal', priority: 'P2', status: 'done', assigneeRole: '隐私安全官', slaMinutes: 1440 },
        { id: '4', title: '渗透测试执行', domainId: 'dark', priority: 'P1', status: 'todo', assigneeRole: '安全专家', slaMinutes: 1440 },
        { id: '5', title: 'SOC升级扩容评估', domainId: 'technology', priority: 'P2', status: 'todo', assigneeRole: '安全架构师', slaMinutes: 4320 }
      ];
    }
    
    // Calculate stats
    this.taskStats = {
      total: this.tasks.length,
      todo: this.tasks.filter(t => t.status === 'todo').length,
      inProgress: this.tasks.filter(t => t.status === 'in_progress').length,
      done: this.tasks.filter(t => t.status === 'done').length,
      closed: this.tasks.filter(t => t.status === 'closed').length
    };
  }

  private mapPriority(sev: string): 'P0' | 'P1' | 'P2' | 'P3' {
    const map: Record<string, 'P0' | 'P1' | 'P2' | 'P3'> = {
      'P0': 'P0', 'P1': 'P1', 'P2': 'P2', 'P3': 'P3', 'critical': 'P0', 'high': 'P1', 'medium': 'P2', 'low': 'P3'
    };
    return map[sev] || 'P2';
  }

  private mapStatus(status: string): Task['status'] {
    const map: Record<string, Task['status']> = {
      'detected': 'todo', 'reported': 'todo', 'acknowledged': 'todo',
      'investigating': 'in_progress', 'containing': 'in_progress',
      'eradicating': 'in_progress', 'recovering': 'in_progress',
      'closed': 'closed', 'done': 'done'
    };
    return map[status] || 'todo';
  }

  // ============ Task Operations ============

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => { this.toastMessage = ''; }, 3000);
  }

  private openCreateTaskModal(domainId?: DomainId) {
    this.editingTask = null;
    this.taskForm = {
      title: '',
      domainId: domainId || 'security',
      priority: 'P1',
      assigneeRole: '',
      description: '',
      slaMinutes: 480
    };
    this.showTaskModal = true;
  }

  private openEditTaskModal(task: Task) {
    this.editingTask = task;
    this.taskForm = {
      title: task.title,
      domainId: task.domainId,
      priority: task.priority,
      assigneeRole: task.assigneeRole,
      description: '',
      slaMinutes: task.slaMinutes || 480
    };
    this.showTaskModal = true;
  }

  private closeTaskModal() {
    this.showTaskModal = false;
    this.editingTask = null;
  }

  private updateTaskFormField(field: string, value: string | number) {
    this.taskForm = { ...this.taskForm, [field]: value };
  }

  private async handleSaveTask() {
    if (!this.taskForm.title.trim()) {
      this.showToast('请输入任务标题', 'error');
      return;
    }

    try {
      if (this.editingTask) {
        // Update existing task - would call API here
        const index = this.tasks.findIndex(t => t.id === this.editingTask!.id);
        if (index >= 0) {
          this.tasks[index] = { ...this.tasks[index], ...this.taskForm as any };
          this.tasks = [...this.tasks];
        }
        this.showToast('任务已更新', 'success');
      } else {
        // Create new task
        const newTask: Task = {
          id: `task-${Date.now()}`,
          ...this.taskForm as any,
          status: 'todo'
        };
        this.tasks = [newTask, ...this.tasks];
        this.showToast('任务已创建', 'success');
      }
      this.updateTaskStats();
      this.closeTaskModal();
    } catch (error) {
      console.error('Failed to save task:', error);
      this.showToast('保存失败', 'error');
    }
  }

  private async handleStatusChange(task: Task, newStatus: Task['status']) {
    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'todo': ['in_progress', 'blocked'],
      'in_progress': ['done', 'blocked', 'todo'],
      'blocked': ['in_progress', 'todo'],
      'done': ['closed'],
      'closed': ['todo'] // reopen
    };

    if (!validTransitions[task.status]?.includes(newStatus)) {
      this.showToast('无效的状态转换', 'error');
      return;
    }

    // For dark domain, require approval before execution
    if (task.domainId === 'dark' && newStatus === 'in_progress') {
      this.openApprovalModal(task);
      return;
    }

    await this.updateTaskStatus(task, newStatus);
  }

  private async updateTaskStatus(task: Task, newStatus: Task['status']) {
    const prevStatus = task.status;
    task.status = newStatus;
    this.tasks = [...this.tasks];
    this.updateTaskStats();

    try {
      this.showToast(`状态已更新为 ${this.getStatusLabel(newStatus)}`, 'success');
    } catch (error) {
      task.status = prevStatus;
      this.tasks = [...this.tasks];
      this.updateTaskStats();
      this.showToast('状态更新失败', 'error');
    }
  }

  private getStatusLabel(status: Task['status']): string {
    const labels: Record<string, string> = {
      'todo': '待处理',
      'in_progress': '进行中',
      'blocked': '已阻塞',
      'done': '已完成',
      'closed': '已关闭'
    };
    return labels[status] || status;
  }

  private openApprovalModal(task: Task) {
    this.approvalTask = task;
    this.approvalForm = {
      scope: task.title,
      ticketNo: '',
      reason: '',
      expiresDays: 7
    };
    this.showApprovalModal = true;
  }

  private closeApprovalModal() {
    this.showApprovalModal = false;
    this.approvalTask = null;
  }

  private async handleSubmitApproval() {
    if (!this.approvalForm.scope.trim() || !this.approvalForm.ticketNo.trim()) {
      this.showToast('请填写完整信息', 'error');
      return;
    }

    try {
      // In real implementation, would call capabilitiesClient.createApproval()
      this.showToast('审批请求已提交', 'success');
      this.closeApprovalModal();
    } catch (error) {
      console.error('Failed to create approval:', error);
      this.showToast('审批提交失败', 'error');
    }
  }

  private updateTaskStats() {
    this.taskStats = {
      total: this.tasks.length,
      todo: this.tasks.filter(t => t.status === 'todo').length,
      inProgress: this.tasks.filter(t => t.status === 'in_progress').length,
      done: this.tasks.filter(t => t.status === 'done').length,
      closed: this.tasks.filter(t => t.status === 'closed').length
    };
  }

  private getDomainName(domainId: DomainId): string {
    const names: Record<string, string> = {
      'light': '光明能力域',
      'dark': '黑暗能力域',
      'security': '安全能力域',
      'legal': '合规能力域',
      'technology': '技术能力域',
      'business': '业务能力域'
    };
    return names[domainId] || domainId;
  }

  // ============ 渲染 ============

  render() {
    if (this.loading) {
      return html`
        <div style="text-align: center; padding: 2rem;">
          <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
          <div style="color: var(--sc-text-secondary);">加载中...</div>
        </div>
      `;
    }

    const filteredTasks = this.selectedDomain === 'all' 
      ? this.tasks 
      : this.tasks.filter(t => t.domainId === this.selectedDomain);

    return html`
      <sc-smart-recommendation-bar></sc-smart-recommendation-bar>
      <div class="page-container">
        <!-- Header -->
        <div class="page-header">
          <div class="page-title">⚔️ 能力中心</div>
          <div class="header-actions">
            <sc-button variant="secondary">📊 报告</sc-button>
            <sc-button variant="primary" @click=${() => this.openCreateTaskModal()}>➕ 新建任务</sc-button>
          </div>
        </div>

        <!-- KPI Cards -->
        <div class="kpi-row">
          <sc-metric-card
            title="总任务数"
            value=${this.taskStats.total}
            icon="📋"
            status="healthy"
          ></sc-metric-card>
          <sc-metric-card
            title="待处理"
            value=${this.taskStats.todo}
            icon="⏳"
            status=${this.taskStats.todo > 5 ? 'critical' : 'warning'}
          ></sc-metric-card>
          <sc-metric-card
            title="进行中"
            value=${this.taskStats.inProgress}
            icon="🔄"
            status="healthy"
          ></sc-metric-card>
          <sc-metric-card
            title="已完成"
            value=${this.taskStats.done + this.taskStats.closed}
            icon="✅"
            status="healthy"
          ></sc-metric-card>
        </div>

        <!-- Domains Grid -->
        <div class="domains-grid">
          ${this.domains.map(domain => html`
            <div 
              class="domain-card ${this.selectedDomain === domain.id ? 'selected' : ''}"
              style="border-left: 4px solid ${domain.color}"
              @click=${() => this.selectedDomain = domain.id}
            >
              <div class="domain-header">
                <span class="domain-icon">${domain.icon}</span>
                <span class="domain-name">${domain.name}</span>
              </div>
              <div style="color: var(--sc-text-secondary); font-size: 14px;">
                ${domain.taskCount} 个任务
              </div>
              <div class="domain-stats">
                <div class="stat-item">
                  <div class="stat-value" style="color: ${domain.kpi.riskScore > 70 ? '#dc2626' : '#22c55e'}">
                    ${domain.kpi.riskScore}%
                  </div>
                  <div class="stat-label">风险</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">${domain.kpi.closureRate}%</div>
                  <div class="stat-label">闭环</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">${domain.kpi.slaRate}%</div>
                  <div class="stat-label">SLA</div>
                </div>
              </div>
            </div>
          `)}
        </div>

        <!-- Tasks Section -->
        <div class="tasks-section">
          <div class="tasks-header">
            <div class="tasks-title">任务列表</div>
            <div class="task-filters">
              <button 
                class="filter-btn ${this.selectedDomain === 'all' ? 'active' : ''}"
                @click=${() => this.selectedDomain = 'all'}
              >全部</sc-button>
              ${this.domains.map(d => html`
                <button 
                  class="filter-btn ${this.selectedDomain === d.id ? 'active' : ''}"
                  @click=${() => this.selectedDomain = d.id}
                >${d.name}</sc-button>
              `)}
            </div>
          </div>

          ${filteredTasks.length === 0 ? html`
            <div class="empty-state">
              <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
              <div>暂无任务</div>
            </div>
          ` : html`
            <div class="tasks-list">
              ${filteredTasks.map(task => html`
                <div class="task-item">
                  <div class="task-priority ${task.priority}"></div>
                  <div class="task-content">
                    <div class="task-title">
                      ${task.domainId === 'dark' ? '🌑 ' : '☀️ '}
                      ${task.title}
                    </div>
                    <div class="task-meta">
                      ${task.assigneeRole || this.getDomainName(task.domainId)} • 
                      ${task.slaMinutes ? `SLA: ${Math.floor(task.slaMinutes/60)}h` : ''}
                    </div>
                  </div>
                  <div class="task-status ${task.status}">
                    ${this.getStatusLabel(task.status)}
                  </div>
                  <div style="display: flex; gap: 4px; margin-left: 8px;">
                    ${task.status === 'todo' ? html`
                      <button class="btn" style="padding: 4px 8px; font-size: 12px;" @click=${() => this.handleStatusChange(task, 'in_progress')}>
                        ▶️ 开始
                      </sc-button>
                    ` : ''}
                    ${task.status === 'in_progress' ? html`
                      <button class="btn" style="padding: 4px 8px; font-size: 12px; background: #dcfce7;" @click=${() => this.handleStatusChange(task, 'done')}>
                        ✅ 完成
                      </sc-button>
                    ` : ''}
                    ${task.status === 'done' ? html`
                      <button class="btn" style="padding: 4px 8px; font-size: 12px; background: #f1f5f9;" @click=${() => this.handleStatusChange(task, 'closed')}>
                        🔒 关闭
                      </sc-button>
                    ` : ''}
                    <button class="btn" style="padding: 4px 8px; font-size: 12px;" @click=${() => this.openEditTaskModal(task)}>
                      ✏️
                    </sc-button>
                  </div>
                </div>
              `)}
            </div>
          `}
        </div>
      </div>

      ${this.renderTaskModal()}
      ${this.renderApprovalModal()}
      ${this.renderToast()}
    `;
  }

  private renderTaskModal() {
    if (!this.showTaskModal) return html``;

    return html`
      <div class="modal-overlay" @click=${(e: Event) => e.target === e.currentTarget && this.closeTaskModal()}>
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">
              ${this.editingTask ? '✏️ 编辑任务' : '➕ 新建任务'}
            </h2>
            <button class="modal-close" @click=${this.closeTaskModal}>×</sc-button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">任务标题 *</label>
              <input type="text" class="form-input" 
                .value=${this.taskForm.title}
                @input=${(e: Event) => this.updateTaskFormField('title', (e.target as HTMLInputElement).value)}
                placeholder="输入任务标题" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">能力域</label>
                <select class="form-select" 
                  .value=${this.taskForm.domainId}
                  @change=${(e: Event) => this.updateTaskFormField('domainId', (e.target as HTMLSelectElement).value)}>
                  <option value="light">☀️ 光明能力域</option>
                  <option value="dark">🌑 黑暗能力域</option>
                  <option value="security">🛡️ 安全能力域</option>
                  <option value="legal">⚖️ 合规能力域</option>
                  <option value="technology">🔧 技术能力域</option>
                  <option value="business">📊 业务能力域</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">优先级</label>
                <select class="form-select" 
                  .value=${this.taskForm.priority}
                  @change=${(e: Event) => this.updateTaskFormField('priority', (e.target as HTMLSelectElement).value)}>
                  <option value="P0">P0 - 紧急</option>
                  <option value="P1">P1 - 高</option>
                  <option value="P2">P2 - 中</option>
                  <option value="P3">P3 - 低</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">负责人角色</label>
              <input type="text" class="form-input" 
                .value=${this.taskForm.assigneeRole}
                @input=${(e: Event) => this.updateTaskFormField('assigneeRole', (e.target as HTMLInputElement).value)}
                placeholder="如: 安全专家、安全运营官" />
            </div>
            <div class="form-group">
              <label class="form-label">SLA (小时)</label>
              <input type="number" class="form-input" 
                .value=${String(this.taskForm.slaMinutes / 60)}
                @input=${(e: Event) => this.updateTaskFormField('slaMinutes', parseInt((e.target as HTMLInputElement).value) * 60)}
                min="1" />
            </div>
          </div>
          <div class="modal-footer">
            <sc-button variant="secondary" @click=${this.closeTaskModal}>取消</sc-button>
            <sc-button variant="primary" @click=${this.handleSaveTask}>
              ${this.editingTask ? '保存' : '创建'}
            </sc-button>
          </div>
        </div>
      </div>
    `;
  }

  private renderApprovalModal() {
    if (!this.showApprovalModal || !this.approvalTask) return html``;

    return html`
      <div class="modal-overlay" @click=${(e: Event) => e.target === e.currentTarget && this.closeApprovalModal()}>
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">🌑 黑暗能力域 - 执行审批</h2>
            <button class="modal-close" @click=${this.closeApprovalModal}>×</sc-button>
          </div>
          <div class="modal-body">
            <div class="dark-warning">
              ⚠️ 黑暗能力域操作需要审批。请填写以下信息提交审批请求。
            </div>
            <div class="form-group">
              <label class="form-label">任务</label>
              <div style="padding: 8px 12px; background: #f3f4f6; border-radius: 6px; font-size: 14px;">
                ${this.approvalTask.title}
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">操作范围 *</label>
              <input type="text" class="form-input" 
                .value=${this.approvalForm.scope}
                @input=${(e: Event) => this.approvalForm = { ...this.approvalForm, scope: (e.target as HTMLInputElement).value }}
                placeholder="描述操作的具体范围和目标" />
            </div>
            <div class="form-group">
              <label class="form-label">工单号 *</label>
              <input type="text" class="form-input" 
                .value=${this.approvalForm.ticketNo}
                @input=${(e: Event) => this.approvalForm = { ...this.approvalForm, ticketNo: (e.target as HTMLInputElement).value }}
                placeholder="关联的审批工单号" />
            </div>
            <div class="form-group">
              <label class="form-label">申请理由</label>
              <input type="text" class="form-input" 
                .value=${this.approvalForm.reason}
                @input=${(e: Event) => this.approvalForm = { ...this.approvalForm, reason: (e.target as HTMLInputElement).value }}
                placeholder="简要说明操作目的和预期结果" />
            </div>
            <div class="form-group">
              <label class="form-label">审批有效期 (天)</label>
              <select class="form-select" 
                .value=${String(this.approvalForm.expiresDays)}
                @change=${(e: Event) => this.approvalForm = { ...this.approvalForm, expiresDays: parseInt((e.target as HTMLSelectElement).value) }}>
                <option value="1">1天</option>
                <option value="3">3天</option>
                <option value="7">7天</option>
                <option value="14">14天</option>
                <option value="30">30天</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <sc-button variant="secondary" @click=${this.closeApprovalModal}>取消</sc-button>
            <sc-button variant="warning" @click=${this.handleSubmitApproval}>
              📤 提交审批
            </sc-button>
          </div>
        </div>
      </div>
    `;
  }

  private renderToast() {
    if (!this.toastMessage) return html``;

    return html`
      <div class="toast ${this.toastType}">
        ${this.toastType === 'success' ? '✅ ' : this.toastType === 'error' ? '❌ ' : 'ℹ️ '}
        ${this.toastMessage}
      </div>
    `;
  }
}

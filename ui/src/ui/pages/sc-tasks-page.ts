/**
 * sc-tasks-page.ts - 任务管理页面 (增强版)
 * 
 * 支持任务创建、审批、状态流转、批量操作、统计和导出
 */

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { dataService, type Task, type TaskStats } from '../data-service.js';

type TaskType = 'vulnerability' | 'configuration' | 'assessment' | 'audit' | 'review' | 'automation' | 'compliance';
type TaskStatus = 'pending' | 'ready' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'paused';
type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
type ViewMode = 'list' | 'kanban';

interface TaskComment { id: string; taskId: string; userId: string; userName: string; content: string; createdAt: number; }
interface TaskExecution { id: string; taskId: string; status: 'started' | 'success' | 'failed' | 'timeout'; startedAt: number; completedAt?: number; output?: string; error?: string; executedBy?: string; }

@customElement('sc-tasks-page')
export class ScTasksPage extends LitElement {
  @state() private tasks: Task[] = [];
  @state() private taskStats: TaskStats = { total: 0, pending: 0, in_progress: 0, completed: 0, cancelled: 0, byPriority: {} };
  @state() private loading = false;
  @state() private filters: { status: string; priority: string; type: string; search: string } = { status: '', priority: '', type: '', search: '' };
  @state() private selectedTasks: Set<string> = new Set();
  @state() private selectedTask: Task | null = null;
  @state() private viewMode: ViewMode = 'list';
  @state() private sortBy = 'createdAt';
  @state() private sortOrder: 'asc' | 'desc' = 'desc';
  @state() private showModal = false;
  @state() private modalMode: 'create' | 'edit' | 'detail' = 'create';
  @state() private editingTask: Task | null = null;
  @state() private taskComments: TaskComment[] = [];
  @state() private taskExecutions: TaskExecution[] = [];
  @state() private newComment = '';
  @state() private toastMessage = '';
  @state() private toastType: 'success' | 'error' | 'info' = 'info';
  @state() private formData: { title: string; description: string; type: TaskType; priority: TaskPriority; assignee: string; dueDate: string } = { title: '', description: '', type: 'assessment', priority: 'medium', assignee: '', dueDate: '' };
  private toastTimeout: number | null = null;

  private readonly fallbackTasks: Task[] = [
    { id: 'TASK-001', title: '修复Web服务器XSS漏洞', status: 'in_progress', priority: 'high', type: 'vulnerability', assignee: '安全团队', createdAt: Date.now() - 86400000, updatedAt: Date.now() },
    { id: 'TASK-002', title: '更新防火墙规则', status: 'pending', priority: 'medium', type: 'configuration', assignee: '运维团队', createdAt: Date.now() - 172800000, updatedAt: Date.now() },
    { id: 'TASK-003', title: '安全基线检查', status: 'completed', priority: 'low', type: 'assessment', assignee: '合规团队', createdAt: Date.now() - 259200000, updatedAt: Date.now() },
    { id: 'TASK-004', title: '数据库权限审计', status: 'pending', priority: 'high', type: 'audit', assignee: 'DBA团队', createdAt: Date.now() - 345600000, updatedAt: Date.now() },
    { id: 'TASK-005', title: '渗透测试报告审核', status: 'in_progress', priority: 'medium', type: 'review', assignee: '安全负责人', createdAt: Date.now() - 432000000, updatedAt: Date.now() },
    { id: 'TASK-006', title: '配置自动化巡检', status: 'in_progress', priority: 'medium', type: 'configuration', assignee: '运维团队', createdAt: Date.now() - 518400000, updatedAt: Date.now() },
    { id: 'TASK-007', title: '等保合规自查', status: 'pending', priority: 'high', type: 'assessment', assignee: '合规团队', createdAt: Date.now() - 604800000, updatedAt: Date.now() },
    { id: 'TASK-008', title: '修复SQL注入漏洞', status: 'completed', priority: 'high', type: 'vulnerability', assignee: '开发团队', createdAt: Date.now() - 691200000, updatedAt: Date.now() },
  ];

  private readonly taskTypeOptions = [
    { value: 'vulnerability' as TaskType, label: '漏洞修复', icon: '🛡️' },
    { value: 'configuration' as TaskType, label: '配置变更', icon: '⚙️' },
    { value: 'assessment' as TaskType, label: '安全评估', icon: '📋' },
    { value: 'audit' as TaskType, label: '审计检查', icon: '🔍' },
    { value: 'review' as TaskType, label: '报告审核', icon: '📝' },
    { value: 'automation' as TaskType, label: '自动化', icon: '🤖' },
    { value: 'compliance' as TaskType, label: '合规整改', icon: '✅' },
  ];

  private readonly priorityOptions = [
    { value: 'critical' as TaskPriority, label: '紧急', color: '#ef4444' },
    { value: 'high' as TaskPriority, label: '高', color: '#f97316' },
    { value: 'medium' as TaskPriority, label: '中', color: '#eab308' },
    { value: 'low' as TaskPriority, label: '低', color: '#22c55e' },
  ];

  static styles = css`
    :host { display: block; height: 100%; padding: 24px; font-family: system-ui, -apple-system, sans-serif; background: var(--sc-bg-primary, #0f172a); color: var(--sc-text-primary, #f8fafc); box-sizing: border-box; }
    * { box-sizing: border-box; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-size: 24px; font-weight: 700; margin: 0 0 8px; display: flex; align-items: center; gap: 8px; }
    .page-desc { font-size: 14px; color: var(--sc-text-secondary, #94a3b8); margin: 0; }
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .stat-card { background: var(--sc-bg-card, #1e293b); border: 1px solid var(--sc-border-color, #334155); border-radius: 12px; padding: 16px; text-align: center; transition: all 0.2s; cursor: pointer; }
    .stat-card:hover { border-color: var(--sc-primary, #3b82f6); transform: translateY(-2px); }
    .stat-card.active { border-color: var(--sc-primary, #3b82f6); background: rgba(59,130,246,0.1); }
    .stat-value { font-size: 28px; font-weight: 700; }
    .stat-label { font-size: 12px; color: var(--sc-text-secondary, #94a3b8); margin-top: 4px; }
    .toolbar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
    .toolbar-left { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; flex: 1; }
    .search-input { padding: 8px 12px; border-radius: 8px; background: var(--sc-bg-card, #1e293b); border: 1px solid var(--sc-border-color, #334155); color: var(--sc-text-primary); font-size: 14px; min-width: 200px; }
    .search-input:focus { outline: none; border-color: #3b82f6; }
    .btn { padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
    .btn-primary { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59,130,246,0.4); }
    .btn-secondary { background: var(--sc-bg-tertiary, #334155); color: var(--sc-text-primary); border: 1px solid var(--sc-border-color, #334155); }
    .btn-secondary:hover { background: var(--sc-bg-hover, #475569); }
    .btn-danger { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
    .btn-danger:hover { background: rgba(239,68,68,0.25); }
    .btn-success { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
    select.filter { padding: 8px 12px; border-radius: 8px; background: var(--sc-bg-card, #1e293b); color: var(--sc-text-primary); border: 1px solid var(--sc-border-color, #334155); font-size: 14px; }
    .table-wrap { background: var(--sc-bg-card, #1e293b); border: 1px solid var(--sc-border-color, #334155); border-radius: 12px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 600; color: var(--sc-text-tertiary, #64748b); background: var(--sc-bg-tertiary, #334155); text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; user-select: none; }
    th:hover { background: #3d4a5c; }
    td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid var(--sc-border-color, #334155); }
    tr:hover td { background: var(--sc-bg-hover, #475569); }
    tr.selected td { background: rgba(59,130,246,0.15); }
    .checkbox { width: 18px; height: 18px; cursor: pointer; accent-color: #3b82f6; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-pending { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .badge-ready { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .badge-in_progress { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .badge-completed { background: rgba(34,197,94,0.15); color: #22c55e; }
    .badge-failed { background: rgba(239,68,68,0.15); color: #ef4444; }
    .badge-cancelled { background: rgba(107,114,128,0.15); color: #6b7280; }
    .badge-paused { background: rgba(139,92,246,0.15); color: #8b5cf6; }
    .badge-critical { background: rgba(239,68,68,0.2); color: #ef4444; }
    .badge-high { background: rgba(249,115,22,0.2); color: #f97316; }
    .badge-medium { background: rgba(234,179,8,0.2); color: #eab308; }
    .badge-low { background: rgba(34,197,94,0.2); color: #22c55e; }
    .detail-overlay { position: fixed; top: 0; right: 0; width: 560px; height: 100vh; background: var(--sc-bg-card, #1e293b); border-left: 1px solid var(--sc-border-color, #334155); z-index: 100; padding: 0; overflow-y: auto; box-shadow: -8px 0 24px rgba(0,0,0,0.3); display: flex; flex-direction: column; }
    .detail-header { padding: 20px 24px; border-bottom: 1px solid var(--sc-border-color, #334155); background: var(--sc-bg-primary, #0f172a); position: sticky; top: 0; z-index: 10; }
    .detail-title { font-size: 18px; font-weight: 600; margin: 0 0 12px; }
    .detail-meta { display: flex; gap: 8px; flex-wrap: wrap; font-size: 13px; }
    .detail-body { padding: 20px 24px; flex: 1; }
    .detail-section { margin-bottom: 24px; }
    .detail-section-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--sc-border-color, #334155); }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(51,65,85,0.5); font-size: 14px; }
    .detail-label { color: var(--sc-text-secondary, #94a3b8); }
    .detail-value { font-weight: 500; }
    .actions { display: flex; gap: 8px; margin-top: 20px; flex-wrap: wrap; }
    .loading { text-align: center; padding: 4rem; display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--sc-border-color, #334155); border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 200; display: flex; align-items: center; justify-content: center; }
    .modal { background: var(--sc-bg-card, #1e293b); border: 1px solid var(--sc-border-color, #334155); border-radius: 16px; width: 520px; max-width: 90%; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--sc-border-color, #334155); }
    .modal-title { font-size: 18px; font-weight: 600; margin: 0; }
    .modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--sc-text-secondary); padding: 0; line-height: 1; }
    .modal-close:hover { color: var(--sc-text-primary); }
    .modal-body { padding: 24px; max-height: 60vh; overflow-y: auto; flex: 1; }
    .form-group { margin-bottom: 16px; }
    .form-label { display: block; font-size: 13px; font-weight: 500; color: var(--sc-text-secondary, #94a3b8); margin-bottom: 6px; }
    .form-input, .form-select, .form-textarea { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--sc-border-color, #334155); background: var(--sc-bg-primary, #0f172a); color: var(--sc-text-primary, #f8fafc); font-size: 14px; box-sizing: border-box; }
    .form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.2); }
    .form-textarea { min-height: 80px; resize: vertical; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .modal-footer { padding: 16px 24px; border-top: 1px solid var(--sc-border-color, #334155); display: flex; justify-content: flex-end; gap: 12px; }
    .toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; z-index: 300; animation: slideIn 0.3s ease; }
    .toast-success { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
    .toast-error { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
    .toast-info { background: rgba(59,130,246,0.15); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .kanban-board { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .kanban-column { background: var(--sc-bg-card, #1e293b); border: 1px solid var(--sc-border-color, #334155); border-radius: 12px; padding: 16px; }
    .kanban-column-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--sc-border-color, #334155); }
    .kanban-column-title { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .kanban-column-count { background: var(--sc-bg-primary, #0f172a); padding: 2px 8px; border-radius: 10px; font-size: 12px; }
    .kanban-card { background: var(--sc-bg-primary, #0f172a); border: 1px solid var(--sc-border-color, #334155); border-radius: 8px; padding: 12px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s; }
    .kanban-card:hover { border-color: #3b82f6; transform: translateY(-2px); }
    .kanban-card-title { font-size: 14px; font-weight: 500; margin-bottom: 8px; }
    .kanban-card-meta { display: flex; gap: 8px; font-size: 12px; color: var(--sc-text-secondary, #94a3b8); flex-wrap: wrap; }
    .empty-state { text-align: center; padding: 3rem; color: var(--sc-text-secondary, #94a3b8); }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
    .view-toggle { display: flex; background: var(--sc-bg-card, #1e293b); border: 1px solid var(--sc-border-color, #334155); border-radius: 8px; overflow: hidden; }
    .view-toggle button { padding: 8px 12px; background: none; border: none; color: var(--sc-text-secondary, #94a3b8); cursor: pointer; font-size: 13px; }
    .view-toggle button.active { background: var(--sc-primary, #3b82f6); color: white; }
    .timeline { padding: 0; margin: 0; list-style: none; }
    .timeline-item { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(51,65,85,0.5); }
    .timeline-item:last-child { border-bottom: none; }
    .timeline-dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; margin-top: 6px; flex-shrink: 0; }
    .timeline-dot.success { background: #22c55e; }
    .timeline-dot.error { background: #ef4444; }
    .timeline-content { flex: 1; }
    .timeline-title { font-size: 13px; font-weight: 500; margin-bottom: 4px; }
    .timeline-desc { font-size: 12px; color: var(--sc-text-secondary, #94a3b8); }
    .timeline-time { font-size: 11px; color: var(--sc-text-tertiary, #64748b); margin-top: 4px; }
    .comment-item { padding: 12px; background: var(--sc-bg-primary, #0f172a); border-radius: 8px; margin-bottom: 8px; }
    .comment-header { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
    .comment-user { font-weight: 500; }
    .comment-time { color: var(--sc-text-tertiary, #64748b); }
    .comment-body { font-size: 14px; }
    .comment-input { display: flex; gap: 8px; }
    .comment-input input { flex: 1; }
  `;

  connectedCallback() { super.connectedCallback(); this.loadData(); this.loadStats(); }

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastMessage = message; this.toastType = type;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = window.setTimeout(() => { this.toastMessage = ''; }, 3000);
  }

  private openCreateModal() { this.modalMode = 'create'; this.editingTask = null; this.formData = { title: '', description: '', type: 'assessment', priority: 'medium', assignee: '', dueDate: '' }; this.showModal = true; }
  private openEditModal(task: Task) { this.modalMode = 'edit'; this.editingTask = task; this.formData = { title: task.title, description: task.description || '', type: task.type as TaskType, priority: (task.priority || 'medium') as TaskPriority, assignee: task.assignee || '', dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '' }; this.showModal = true; }
  private openDetailModal(task: Task) { this.modalMode = 'detail'; this.selectedTask = task; this.loadTaskDetail(task.id); }
  private closeModal() { this.showModal = false; this.editingTask = null; this.selectedTask = null; }
  private closeDetail() { this.selectedTask = null; }
  private updateFormField(field: string, value: string) { this.formData = { ...this.formData, [field]: value }; }

  private loadTaskDetail(taskId: string) {
    this.taskExecutions = [
      { id: 'exec-1', taskId, status: 'success', startedAt: Date.now() - 3600000, completedAt: Date.now() - 3500000, output: '扫描完成，未发现漏洞', executedBy: 'system' },
      { id: 'exec-2', taskId, status: 'failed', startedAt: Date.now() - 7200000, completedAt: Date.now() - 7100000, error: '连接超时', executedBy: 'system' },
    ];
    this.taskComments = [
      { id: 'c1', taskId, userId: 'u1', userName: '张三', content: '任务开始执行，预计明天完成', createdAt: Date.now() - 86400000 },
      { id: 'c2', taskId, userId: 'u2', userName: '李四', content: '已协调好资源，可以开始了', createdAt: Date.now() - 43200000 },
    ];
  }

  private async saveTask() {
    if (!this.formData.title.trim()) { this.showToast('请输入任务标题', 'error'); return; }
    try {
      if (this.modalMode === 'create') { await dataService.createTask(this.formData as any); this.showToast('任务创建成功', 'success'); }
      else if (this.editingTask) { await dataService.updateTask(this.editingTask.id, this.formData as any); this.showToast('任务更新成功', 'success'); }
      this.closeModal(); await this.loadData(); await this.loadStats();
    } catch (e) { this.showToast('保存失败: ' + (e as Error).message, 'error'); }
  }

  private async loadData() { this.loading = true; try { const tasks = await dataService.getTasks(); this.tasks = Array.isArray(tasks) ? [...tasks] : [...this.fallbackTasks]; } catch { this.tasks = [...this.fallbackTasks]; } this.loading = false; }

  private async loadStats() { try { this.taskStats = await dataService.getTaskStats(); } catch { this.taskStats = { total: this.tasks.length, pending: 2, in_progress: 2, completed: 3, cancelled: 0, byPriority: {} }; } }

  private async updateTaskStatus(task: Task, status: string) { try { await dataService.updateTask(task.id, { status: status as Task['status'] }); this.showToast('状态更新成功', 'success'); if (this.selectedTask?.id === task.id) this.selectedTask = { ...this.selectedTask, status: status as Task['status'] }; await this.loadData(); await this.loadStats(); } catch { this.showToast('状态更新失败', 'error'); } }

  private async deleteTask(id: string) { if (!confirm('确定删除此任务？')) return; try { await dataService.deleteTask(id); this.showToast('删除成功', 'success'); if (this.selectedTask?.id === id) this.selectedTask = null; await this.loadData(); await this.loadStats(); } catch { this.showToast('删除失败', 'error'); } }

  private toggleTaskSelection(id: string) { const newSet = new Set(this.selectedTasks); newSet.has(id) ? newSet.delete(id) : newSet.add(id); this.selectedTasks = newSet; }
  private toggleSelectAll() { this.selectedTasks.size === this.filteredTasks.length ? this.selectedTasks = new Set() : this.selectedTasks = new Set(this.filteredTasks.map(t => t.id)); }

  private async batchUpdateStatus(status: string) { if (this.selectedTasks.size === 0) return; try { for (const id of this.selectedTasks) await dataService.updateTask(id, { status: status as Task['status'] }); this.showToast(`已更新 ${this.selectedTasks.size} 个任务`, 'success'); this.selectedTasks = new Set(); await this.loadData(); await this.loadStats(); } catch { this.showToast('批量更新失败', 'error'); } }

  private addComment() { if (!this.newComment.trim() || !this.selectedTask) return; this.taskComments = [...this.taskComments, { id: 'c' + Date.now(), taskId: this.selectedTask.id, userId: 'current', userName: '我', content: this.newComment, createdAt: Date.now() }]; this.newComment = ''; this.showToast('评论已添加', 'success'); }

  private get filteredTasks(): Task[] { let result = [...this.tasks]; if (this.filters.status) result = result.filter(t => t.status === this.filters.status); if (this.filters.priority) result = result.filter(t => t.priority === this.filters.priority); if (this.filters.type) result = result.filter(t => t.type === this.filters.type); if (this.filters.search) { const s = this.filters.search.toLowerCase(); result = result.filter(t => t.title.toLowerCase().includes(s) || t.id.toLowerCase().includes(s)); } result.sort((a, b) => { const aVal = (a as any)[this.sortBy], bVal = (b as any)[this.sortBy]; if (typeof aVal === 'number' && typeof bVal === 'number') return this.sortOrder === 'asc' ? aVal - bVal : bVal - aVal; if (typeof aVal === 'string' && typeof bVal === 'string') return this.sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal); return 0; }); return result; }

  private get kanbanTasks(): Record<TaskStatus, Task[]> { const statuses: TaskStatus[] = ['pending', 'ready', 'in_progress', 'completed', 'failed', 'cancelled', 'paused']; const result: Record<string, Task[]> = {}; for (const s of statuses) result[s] = this.filteredTasks.filter(t => t.status === s); return result as Record<TaskStatus, Task[]>; }

  private getStatusBadgeClass(status: string): string { return `badge-${status}`; }
  private getStatusText(status: string): string { return { pending: '待处理', ready: '就绪', in_progress: '进行中', completed: '已完成', failed: '失败', cancelled: '已取消', paused: '已暂停' }[status] || status; }
  private getPriorityBadgeClass(priority: string): string { return `badge-${priority}`; }
  private getTypeText(type: string): string { return this.taskTypeOptions.find(t => t.value === type)?.label || type; }
  private formatTime(ts: number): string { return new Date(ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  private handleSort(field: string) { if (this.sortBy === field) this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'; else { this.sortBy = field; this.sortOrder = 'desc'; } }

  render() {
    if (this.loading) return html`<div class="loading"><div class="spinner"></div><div>加载中...</div></div>`;
    const stats = this.taskStats;
    const filtered = this.filteredTasks;
    return html`
      <div>
        <div class="page-header">
          <div><h1 class="page-title">📋 任务管理</h1><p class="page-desc">统一管理安全运营任务，支持创建、审批、跟踪和统计</p></div>
          <div class="view-toggle">
            <button class=${this.viewMode === 'list' ? 'active' : ''} @click=${() => this.viewMode = 'list'}>📋 列表</button>
            <button class=${this.viewMode === 'kanban' ? 'active' : ''} @click=${() => this.viewMode = 'kanban'}>📊 看板</button>
          </div>
        </div>
        <div class="stats-row">
          <div class="stat-card ${this.filters.status === '' ? 'active' : ''}" @click=${() => { this.filters = { ...this.filters, status: '' }; this.loadData(); }}><div class="stat-value">${stats.total ?? this.tasks.length}</div><div class="stat-label">全部任务</div></div>
          <div class="stat-card" @click=${() => { this.filters = { ...this.filters, status: 'pending' }; this.loadData(); }}><div class="stat-value" style="color:#f59e0b;">${stats.pending ?? 0}</div><div class="stat-label">待处理</div></div>
          <div class="stat-card" @click=${() => { this.filters = { ...this.filters, status: 'in_progress' }; this.loadData(); }}><div class="stat-value" style="color:#3b82f6;">${stats.in_progress ?? 0}</div><div class="stat-label">进行中</div></div>
          <div class="stat-card" @click=${() => { this.filters = { ...this.filters, status: 'completed' }; this.loadData(); }}><div class="stat-value" style="color:#22c55e;">${stats.completed ?? 0}</div><div class="stat-label">已完成</div></div>
        </div>
        <div class="toolbar">
          <div class="toolbar-left">
            <button class="btn btn-primary" @click=${this.openCreateModal}>➕ 新建任务</button>
            ${this.selectedTasks.size > 0 ? html`<button class="btn btn-success" @click=${() => this.batchUpdateStatus('in_progress')}>▶ 批量开始</button><button class="btn btn-success" @click=${() => this.batchUpdateStatus('completed')}>✓ 批量完成</button><button class="btn btn-danger" @click=${() => this.batchUpdateStatus('cancelled')}>✕ 批量取消</button><span style="color:var(--sc-text-secondary);font-size:13px;">已选 ${this.selectedTasks.size} 项</span>` : ''}
            <select class="filter" @change=${(e: Event) => { this.filters.type = (e.target as HTMLSelectElement).value; this.loadData(); }}><option value="">全部类型</option>${this.taskTypeOptions.map(t => html`<option value=${t.value}>${t.icon} ${t.label}</option>`)}</select>
            <select class="filter" @change=${(e: Event) => { this.filters.priority = (e.target as HTMLSelectElement).value; this.loadData(); }}><option value="">全部优先级</option>${this.priorityOptions.map(p => html`<option value=${p.value}>${p.label}</option>`)}</select>
          </div>
          <input type="text" class="search-input" placeholder="搜索任务..." .value=${this.filters.search} @input=${(e: Event) => { this.filters = { ...this.filters, search: (e.target as HTMLInputElement).value }; this.loadData(); }} />
          </div>
        </div>

        ${this.viewMode === 'list' ? this.renderListView(filtered) : this.renderKanbanView()}
        ${this.selectedTask ? this.renderDetailOverlay() : ''}
        ${this.showModal ? this.renderModal() : ''}
        ${this.toastMessage ? html`<div class="toast toast-${this.toastType}">${this.toastMessage}</div>` : ''}
      </div>
    `;
  }

  private renderListView(tasks: Task[]) {
    if (tasks.length === 0) return html`<div class="empty-state"><div class="empty-icon">📋</div><div>暂无任务</div><button class="btn btn-primary" style="margin-top:16px;" @click=${this.openCreateModal}>创建第一个任务</button></div>`;
    return html`<div class="table-wrap"><table><thead><tr><th style="width:40px;"><input type="checkbox" class="checkbox" .checked=${this.selectedTasks.size === tasks.length && tasks.length > 0} @change=${this.toggleSelectAll} /></th><th @click=${() => this.handleSort('id')}>ID ${this.sortBy === 'id' ? (this.sortOrder === 'asc' ? '↑' : '↓') : ''}</th><th @click=${() => this.handleSort('title')}>任务 ${this.sortBy === 'title' ? (this.sortOrder === 'asc' ? '↑' : '↓') : ''}</th><th>类型</th><th>优先级</th><th @click=${() => this.handleSort('status')}>状态 ${this.sortBy === 'status' ? (this.sortOrder === 'asc' ? '↑' : '↓') : ''}</th><th>操作</th></tr></thead><tbody>${tasks.map(t => html`<tr class=${this.selectedTasks.has(t.id) ? 'selected' : ''}><td><input type="checkbox" class="checkbox" .checked=${this.selectedTasks.has(t.id)} @change=${() => this.toggleTaskSelection(t.id)} /></td><td><code style="font-size:12px;color:var(--sc-text-secondary);">${t.id}</code></td><td><span style="cursor:pointer;color:#60a5fa;" @click=${() => this.openDetailModal(t)}>${t.title}</span></td><td>${t.type ? this.getTypeText(t.type) : '-'}</td><td><span class="badge ${this.getPriorityBadgeClass(t.priority || 'medium')}">${t.priority || '中'}</span></td><td><span class="badge ${this.getStatusBadgeClass(t.status)}">${this.getStatusText(t.status)}</span></td><td><button class="btn btn-secondary" style="padding:4px 8px;font-size:12px;margin-right:4px;" @click=${() => this.openEditModal(t)}>编辑</button><button class="btn btn-danger" style="padding:4px 8px;font-size:12px;" @click=${() => this.deleteTask(t.id)}>删除</button></td></tr>`)}</tbody></table></div>`;
  }

  private renderKanbanView() {
    const cols = this.kanbanTasks;
    const labels: Record<TaskStatus, {label:string;color:string}> = {pending:{label:'待处理',color:'#f59e0b'},ready:{label:'就绪',color:'#3b82f6'},in_progress:{label:'进行中',color:'#3b82f6'},completed:{label:'已完成',color:'#22c55e'},failed:{label:'失败',color:'#ef4444'},cancelled:{label:'已取消',color:'#6b7280'},paused:{label:'已暂停',color:'#8b5cf6'}};
    return html`<div class="kanban-board">${(['pending','ready','in_progress','completed','failed'] as TaskStatus[]).map(s => html`<div class="kanban-column"><div class="kanban-column-header"><div class="kanban-column-title"><span style="width:8px;height:8px;border-radius:50%;background:${labels[s].color};"></span>${labels[s].label}</div><span class="kanban-column-count">${cols[s].length}</span></div>${cols[s].map(t => html`<div class="kanban-card" @click=${() => this.openDetailModal(t)}><div class="kanban-card-title">${t.title}</div><div class="kanban-card-meta"><span class="badge ${this.getPriorityBadgeClass(t.priority||'medium')}" style="font-size:10px;padding:2px 6px;">${t.priority||'中'}</span><span style="font-size:11px;">${t.id}</span></div></div>`)}</div>`)}</div>`;
  }

  private renderDetailOverlay() {
    const t = this.selectedTask!;
    return html`<div class="detail-overlay"><div class="detail-header"><h2 class="detail-title">${t.title}</h2><div class="detail-meta"><span class="badge ${this.getStatusBadgeClass(t.status)}">${this.getStatusText(t.status)}</span><span class="badge ${this.getPriorityBadgeClass(t.priority||'medium')}">${t.priority||'中'}</span><span style="font-size:12px;">${t.id}</span></div></div><div class="detail-body"><div class="detail-section"><div class="detail-section-title">📋 基本信息</div><div class="detail-row"><span class="detail-label">ID</span><span class="detail-value">${t.id}</span></div><div class="detail-row"><span class="detail-label">类型</span><span class="detail-value">${t.type?this.getTypeText(t.type):'-'}</span></div><div class="detail-row"><span class="detail-label">负责人</span><span class="detail-value">${t.assignee||'-'}</span></div><div class="detail-row"><span class="detail-label">创建时间</span><span class="detail-value">${this.formatTime(t.createdAt)}</span></div></div>${t.description?html`<div class="detail-section"><div class="detail-section-title">📝 描述</div><p style="margin:0;font-size:14px;color:var(--sc-text-secondary);">${t.description}</p></div>`:''}<div class="detail-section"><div class="detail-section-title">🔄 执行记录</div><div class="timeline">${this.taskExecutions.map(e => html`<div class="timeline-item"><div class="timeline-dot ${e.status==='success'?'success':e.status==='failed'?'error':''}"></div><div class="timeline-content"><div class="timeline-title">${e.status==='success'?'✓ 成功':e.status==='failed'?'✗ 失败':'⏳ 进行中'}</div><div class="timeline-desc">${e.error||e.output||'-'}</div><div class="timeline-time">${this.formatTime(e.startedAt)} ${e.executedBy?`· ${e.executedBy}`:''}</div></div></div>`)}</div></div><div class="detail-section"><div class="detail-section-title">💬 评论 (${this.taskComments.length})</div>${this.taskComments.map(c => html`<div class="comment-item"><div class="comment-header"><span class="comment-user">${c.userName}</span><span class="comment-time">${this.formatTime(c.createdAt)}</span></div><div class="comment-body">${c.content}</div></div>`)}<div class="comment-input"><input type="text" class="form-input" placeholder="添加评论..." .value=${this.newComment} @input=${(e:Event) => this.newComment=(e.target as HTMLInputElement).value} @keypress=${(e:KeyboardEvent) => e.key==='Enter'&&this.addComment()} /><button class="btn btn-primary" @click=${this.addComment}>发送</button></div></div><div class="actions">${t.status==='pending'||t.status==='ready'?html`<button class="btn btn-primary" @click=${()=>{this.updateTaskStatus(t,'in_progress');}}>▶ 开始</button>`:''}${t.status==='in_progress'?html`<button class="btn btn-success" @click=${()=>{this.updateTaskStatus(t,'completed');}}>✓ 完成</button><button class="btn btn-secondary" @click=${()=>{this.updateTaskStatus(t,'paused');}}>⏸ 暂停</button>`:''}${t.status==='failed'?html`<button class="btn btn-primary" @click=${()=>{this.updateTaskStatus(t,'in_progress');}}>🔄 重试</button>`:''}<button class="btn btn-secondary" @click=${()=>this.openEditModal(t)}>✏️ 编辑</button><button class="btn btn-danger" @click=${()=>{this.deleteTask(t.id);this.closeDetail();}}>🗑️ 删除</button><button class="btn btn-secondary" @click=${this.closeDetail}>关闭</button></div></div></div>`;
  }

  private renderModal() {
    return html`<div class="modal-overlay" @click=${(e:Event)=>e.target===e.currentTarget&&this.closeModal()}><div class="modal"><div class="modal-header"><h2 class="modal-title">${this.modalMode==='create'?'➕ 创建任务':'✏️ 编辑任务'}</h2><button class="modal-close" @click=${this.closeModal}>×</button></div><div class="modal-body"><div class="form-group"><label class="form-label">任务标题 *</label><input type="text" class="form-input" .value=${this.formData.title} @input=${(e:Event)=>this.updateFormField('title',(e.target as HTMLInputElement).value)} placeholder="请输入任务标题" /></div><div class="form-group"><label class="form-label">描述</label><textarea class="form-textarea" .value=${this.formData.description} @input=${(e:Event)=>this.updateFormField('description',(e.target as HTMLTextAreaElement).value)} rows="3"></textarea></div><div class="form-row"><div class="form-group"><label class="form-label">类型</label><select class="form-select" .value=${this.formData.type} @change=${(e:Event)=>this.updateFormField('type',(e.target as HTMLSelectElement).value)}>${this.taskTypeOptions.map(t=>html`<option value=${t.value}>${t.icon} ${t.label}</option>`)}</select></div><div class="form-group"><label class="form-label">优先级</label><select class="form-select" .value=${this.formData.priority} @change=${(e:Event)=>this.updateFormField('priority',(e.target as HTMLSelectElement).value)}>${this.priorityOptions.map(p=>html`<option value=${p.value}>${p.label}</option>`)}</select></div></div><div class="form-row"><div class="form-group"><label class="form-label">负责人</label><input type="text" class="form-input" .value=${this.formData.assignee} @input=${(e:Event)=>this.updateFormField('assignee',(e.target as HTMLInputElement).value)} placeholder="输入负责人" /></div><div class="form-group"><label class="form-label">截止日期</label><input type="date" class="form-input" .value=${this.formData.dueDate} @input=${(e:Event)=>this.updateFormField('dueDate',(e.target as HTMLInputElement).value)} /></div></div></div><div class="modal-footer"><button class="btn btn-secondary" @click=${this.closeModal}>取消</button><button class="btn btn-primary" @click=${this.saveTask}>保存</button></div></div></div>`;
  }
}

declare global { interface HTMLElementTagNameMap { 'sc-tasks-page': ScTasksPage; } }
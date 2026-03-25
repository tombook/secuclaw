/**
 * SecuClaw Capabilities Center Page - 能力中心页面
 * 
 * 6大能力域管理、任务执行、审批流程、证据收集
 * AI能力: 任务推荐、执行建议
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { aiService, type AIRecommendation } from '../ai-service.js';
import { dataService, type IncidentStats, type VulnerabilityStats } from '../data-service.js';
import '../components/sc-ai-assistant.js';
import '../components/sc-metric-card.js';

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

  @state()
  private recommendations: AIRecommendation[] = [];

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
      this.tasks = response.slice(0, 20).map((inc, i) => ({
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
      <div class="page-container">
        <!-- Header -->
        <div class="page-header">
          <div class="page-title">⚔️ 能力中心</div>
          <div class="header-actions">
            <button class="btn btn-secondary">📊 报告</button>
            <button class="btn btn-primary">➕ 新建任务</button>
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
              >全部</button>
              ${this.domains.map(d => html`
                <button 
                  class="filter-btn ${this.selectedDomain === d.id ? 'active' : ''}"
                  @click=${() => this.selectedDomain = d.id}
                >${d.name}</button>
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
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                      ${task.assigneeRole} • 
                      ${task.slaMinutes ? `SLA: ${Math.floor(task.slaMinutes/60)}h` : ''}
                    </div>
                  </div>
                  <div class="task-status ${task.status}">
                    ${task.status === 'todo' ? '待处理' : 
                      task.status === 'in_progress' ? '进行中' : 
                      task.status === 'done' ? '已完成' : '已关闭'}
                  </div>
                </div>
              `)}
            </div>
          `}
        </div>
      </div>
    `;
  }
}

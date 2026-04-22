import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * Remediation Tracking Component
 * @element sc-remediation-tracking
 */
@customElement('sc-remediation-tracking')
export class ScRemediationTracking extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      --primary: #00ff88;
      --secondary: #00aaff;
      --danger: #ff4444;
      --warning: #ffaa00;
      --bg-dark: #0d1117;
      --bg-card: #161b22;
      --bg-hover: #21262d;
      --text-primary: #f0f6fc;
      --text-secondary: #8b949e;
      --border-color: #30363d;
    }

    * {
      box-sizing: border-box;
    }

    .container {
      background: var(--bg-card);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color);
      background: linear-gradient(180deg, rgba(255,170,0,0.05) 0%, transparent 100%);
    }

    .header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header h2::before {
      content: '';
      width: 4px;
      height: 20px;
      background: var(--warning);
      border-radius: 2px;
    }

    .actions {
      display: flex;
      gap: 12px;
    }

    .btn {
      padding: 10px 18px;
      border-radius: 8px;
      border: none;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-primary {
      background: var(--warning);
      color: #000;
    }

    .btn-primary:hover {
      background: #e69900;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255,170,0,0.3);
    }

    .btn-secondary {
      background: var(--bg-hover);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .btn-secondary:hover {
      border-color: var(--secondary);
      background: rgba(0,170,255,0.1);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1px;
      background: var(--border-color);
    }

    .stat-card {
      background: var(--bg-card);
      padding: 20px;
      text-align: center;
      transition: background 0.2s;
    }

    .stat-card:hover {
      background: var(--bg-hover);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 12px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon.pending {
      background: rgba(255,170,0,0.15);
      color: var(--warning);
    }

    .stat-icon.in-progress {
      background: rgba(0,170,255,0.15);
      color: var(--secondary);
    }

    .stat-icon.completed {
      background: rgba(0,255,136,0.15);
      color: var(--primary);
    }

    .stat-icon.overdue {
      background: rgba(255,68,68,0.15);
      color: var(--danger);
    }

    .stat-icon.total {
      background: rgba(255,255,255,0.05);
      color: var(--text-secondary);
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .tabs-container {
      display: flex;
      border-bottom: 1px solid var(--border-color);
    }

    .tab {
      padding: 16px 24px;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      position: relative;
      transition: color 0.2s;
    }

    .tab:hover {
      color: var(--text-primary);
    }

    .tab.active {
      color: var(--warning);
    }

    .tab.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--warning);
    }

    .tab-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      background: var(--bg-hover);
      border-radius: 10px;
      font-size: 11px;
      margin-left: 8px;
    }

    .tab.active .tab-count {
      background: rgba(255,170,0,0.2);
      color: var(--warning);
    }

    .remediation-list {
      max-height: 450px;
      overflow-y: auto;
    }

    .remediation-item {
      display: grid;
      grid-template-columns: auto 1fr auto auto auto;
      align-items: center;
      gap: 16px;
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-color);
      transition: background 0.2s;
    }

    .remediation-item:hover {
      background: var(--bg-hover);
    }

    .remediation-item:last-child {
      border-bottom: none;
    }

    .severity-indicator {
      width: 4px;
      height: 40px;
      border-radius: 2px;
    }

    .severity-critical {
      background: var(--danger);
    }

    .severity-high {
      background: var(--warning);
    }

    .severity-medium {
      background: var(--secondary);
    }

    .severity-low {
      background: var(--primary);
    }

    .remediation-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .remediation-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .remediation-meta {
      font-size: 12px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .assignee {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .assignee-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--secondary), var(--primary));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 600;
      color: #000;
    }

    .due-date {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }

    .due-date.safe {
      background: rgba(0,255,136,0.1);
      color: var(--primary);
    }

    .due-date.warning {
      background: rgba(255,170,0,0.1);
      color: var(--warning);
    }

    .due-date.danger {
      background: rgba(255,68,68,0.1);
      color: var(--danger);
    }

    .progress-bar {
      width: 100px;
      height: 6px;
      background: var(--bg-dark);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--primary);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      text-transform: capitalize;
    }

    .status-pending {
      background: rgba(255,170,0,0.15);
      color: var(--warning);
    }

    .status-in-progress {
      background: rgba(0,170,255,0.15);
      color: var(--secondary);
    }

    .status-completed {
      background: rgba(0,255,136,0.15);
      color: var(--primary);
    }

    .status-blocked {
      background: rgba(255,68,68,0.15);
      color: var(--danger);
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .icon-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .icon-btn:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }

    .priority-filter {
      display: flex;
      gap: 12px;
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-color);
      overflow-x: auto;
    }

    .filter-chip {
      padding: 8px 16px;
      border-radius: 20px;
      background: var(--bg-hover);
      color: var(--text-secondary);
      font-size: 13px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .filter-chip:hover,
    .filter-chip.active {
      background: rgba(255,170,0,0.1);
      color: var(--warning);
      border-color: var(--warning);
    }

    .empty-state {
      padding: 60px 24px;
      text-align: center;
      color: var(--text-secondary);
    }

    .empty-state svg {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 0 0 8px;
      color: var(--text-primary);
    }

    /* Timeline for details */
    .timeline-detail {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px dashed var(--border-color);
    }

    .timeline-entry {
      display: flex;
      gap: 12px;
      padding: 8px 0;
      font-size: 12px;
      color: var(--text-secondary);
    }

    .timeline-time {
      color: var(--text-secondary);
      min-width: 60px;
    }

    .timeline-content {
      color: var(--text-primary);
    }

    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .remediation-item {
        grid-template-columns: auto 1fr auto;
        gap: 12px;
      }

      .progress-bar,
      .progress-text,
      .due-date {
        display: none;
      }
    }

    /* Keyboard focus styles */
    .btn:focus-visible,
    .tab:focus-visible,
    .filter-chip:focus-visible,
    .icon-btn:focus-visible {
      outline: 2px solid var(--warning);
      outline-offset: 2px;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `;

  @state() private remediations = [
    {
      id: 1,
      title: 'Critical vulnerability in Apache Log4j',
      vulnerability: 'CVE-2024-1234',
      severity: 'critical',
      assignee: 'John Smith',
      assigneeInitials: 'JS',
      status: 'in-progress',
      progress: 75,
      dueDate: '2024-01-20',
      created: '2024-01-10',
      affectedAssets: 12,
      sla: '24 hours'
    },
    {
      id: 2,
      title: 'Misconfigured S3 bucket permissions',
      vulnerability: 'AWS-SEC-456',
      severity: 'high',
      assignee: 'Sarah Chen',
      assigneeInitials: 'SC',
      status: 'pending',
      progress: 0,
      dueDate: '2024-01-22',
      created: '2024-01-12',
      affectedAssets: 5,
      sla: '72 hours'
    },
    {
      id: 3,
      title: 'Outdated TLS certificate on prod-api',
      vulnerability: 'CERT-EXP-789',
      severity: 'high',
      assignee: 'Mike Johnson',
      assigneeInitials: 'MJ',
      status: 'in-progress',
      progress: 45,
      dueDate: '2024-01-18',
      created: '2024-01-08',
      affectedAssets: 3,
      sla: '48 hours'
    },
    {
      id: 4,
      title: 'Exposed admin panel on staging environment',
      vulnerability: 'EXP-ADMIN-101',
      severity: 'critical',
      assignee: 'Emily Davis',
      assigneeInitials: 'ED',
      status: 'completed',
      progress: 100,
      dueDate: '2024-01-15',
      created: '2024-01-05',
      affectedAssets: 1,
      sla: '24 hours'
    },
    {
      id: 5,
      title: 'Missing WAF rules for SQL injection',
      vulnerability: 'WAF-SQL-202',
      severity: 'medium',
      assignee: 'Alex Turner',
      assigneeInitials: 'AT',
      status: 'in-progress',
      progress: 30,
      dueDate: '2024-01-25',
      created: '2024-01-14',
      affectedAssets: 8,
      sla: '7 days'
    },
    {
      id: 6,
      title: 'Overprivileged IAM role detected',
      vulnerability: 'IAM-PRIV-333',
      severity: 'high',
      assignee: 'John Smith',
      assigneeInitials: 'JS',
      status: 'blocked',
      progress: 20,
      dueDate: '2024-01-17',
      created: '2024-01-07',
      affectedAssets: 4,
      sla: '48 hours'
    },
    {
      id: 7,
      title: 'Unencrypted database backups',
      vulnerability: 'BACKUP-ENC-444',
      severity: 'medium',
      assignee: 'Lisa Wang',
      assigneeInitials: 'LW',
      status: 'pending',
      progress: 0,
      dueDate: '2024-01-28',
      created: '2024-01-15',
      affectedAssets: 2,
      sla: '7 days'
    },
    {
      id: 8,
      title: 'Insufficient logging for auth events',
      vulnerability: 'LOG-AUTH-555',
      severity: 'low',
      assignee: 'Mike Johnson',
      assigneeInitials: 'MJ',
      status: 'completed',
      progress: 100,
      dueDate: '2024-01-12',
      created: '2024-01-02',
      affectedAssets: 6,
      sla: '14 days'
    }
  ];

  @state() private selectedTab: 'all' | 'pending' | 'in-progress' | 'completed' = 'all';
  @state() private selectedPriority = 'all';
  @state() private selectedRemediation: number | null = null;

  @property({ type: String }) accessiblename = 'Security Remediation Tracking Dashboard';

  private priorityFilters = [
    { id: 'all', label: 'All Priorities' },
    { id: 'critical', label: 'Critical' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' }
  ];

  private tabs = [
    { id: 'all', label: 'All Items', count: 0 },
    { id: 'pending', label: 'Pending', count: 0 },
    { id: 'in-progress', label: 'In Progress', count: 0 },
    { id: 'completed', label: 'Completed', count: 0 }
  ];

  private get filteredRemediations() {
    return this.remediations.filter(item => {
      const matchesTab = this.selectedTab === 'all' || item.status === this.selectedTab;
      const matchesPriority = this.selectedPriority === 'all' || item.severity === this.selectedPriority;
      return matchesTab && matchesPriority;
    });
  }

  private getStats() {
    return {
      pending: this.remediations.filter(r => r.status === 'pending').length,
      inProgress: this.remediations.filter(r => r.status === 'in-progress').length,
      completed: this.remediations.filter(r => r.status === 'completed').length,
      overdue: this.remediations.filter(r => new Date(r.dueDate) < new Date() && r.status !== 'completed').length,
      total: this.remediations.length
    };
  }

  private getDaysUntilDue(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getDueDateClass(dueDate: string, status: string): string {
    if (status === 'completed') return 'safe';
    const daysLeft = this.getDaysUntilDue(dueDate);
    if (daysLeft < 0) return 'danger';
    if (daysLeft <= 2) return 'danger';
    if (daysLeft <= 5) return 'warning';
    return 'safe';
  }

  private getTabCounts() {
    const stats = this.getStats();
    return {
      all: stats.total,
      pending: stats.pending,
      'in-progress': stats.inProgress,
      completed: stats.completed
    };
  }

  private toggleDetails(id: number) {
    this.selectedRemediation = this.selectedRemediation === id ? null : id;
  }

  private handleKeyDown(e: KeyboardEvent, id: number) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.toggleDetails(id);
    }
  }

  render() {
    const stats = this.getStats();
    const tabCounts = this.getTabCounts();

    return html`
      <div 
        class="container" 
        role="region" 
        aria-label="${this.accessiblename}"
        aria-describedby="remediation-desc"
      >
        <span id="remediation-desc" class="sr-only">
          Track security remediation tasks, monitor progress, and manage SLA compliance
        </span>

        <div class="stats-grid" role="status" aria-live="polite">
          <div class="stat-card">
            <div class="stat-icon pending">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="stat-value">${stats.pending}</div>
            <div class="stat-label">Pending</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon in-progress">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
            <div class="stat-value">${stats.inProgress}</div>
            <div class="stat-label">In Progress</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon completed">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div class="stat-value">${stats.completed}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon overdue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div class="stat-value">${stats.overdue}</div>
            <div class="stat-label">Overdue</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon total">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Total</div>
          </div>
        </div>

        <div class="header">
          <h2>Remediation Tracking</h2>
          <div class="actions">
            <button class="btn btn-secondary" aria-label="Export remediation report">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
            <button class="btn btn-primary" aria-label="Create new remediation task">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Task
            </button>
          </div>
        </div>

        <div class="tabs-container" role="tablist" aria-label="Remediation status tabs">
          <button
            class="tab ${this.selectedTab === 'all' ? 'active' : ''}"
            role="tab"
            aria-selected="${this.selectedTab === 'all'}"
            @click="${() => this.selectedTab = 'all'}"
          >
            All
            <span class="tab-count">${tabCounts.all}</span>
          </button>
          <button
            class="tab ${this.selectedTab === 'pending' ? 'active' : ''}"
            role="tab"
            aria-selected="${this.selectedTab === 'pending'}"
            @click="${() => this.selectedTab = 'pending'}"
          >
            Pending
            <span class="tab-count">${tabCounts.pending}</span>
          </button>
          <button
            class="tab ${this.selectedTab === 'in-progress' ? 'active' : ''}"
            role="tab"
            aria-selected="${this.selectedTab === 'in-progress'}"
            @click="${() => this.selectedTab = 'in-progress'}"
          >
            In Progress
            <span class="tab-count">${tabCounts['in-progress']}</span>
          </button>
          <button
            class="tab ${this.selectedTab === 'completed' ? 'active' : ''}"
            role="tab"
            aria-selected="${this.selectedTab === 'completed'}"
            @click="${() => this.selectedTab = 'completed'}"
          >
            Completed
            <span class="tab-count">${tabCounts.completed}</span>
          </button>
        </div>

        <div class="priority-filter">
          ${this.priorityFilters.map(filter => html`
            <button
              class="filter-chip ${this.selectedPriority === filter.id ? 'active' : ''}"
              @click="${() => this.selectedPriority = filter.id}"
              aria-pressed="${this.selectedPriority === filter.id}"
            >
              ${filter.label}
            </button>
          `)}
        </div>

        <div class="remediation-list" role="list" aria-label="Remediation tasks">
          ${this.filteredRemediations.length > 0 ?
            this.filteredRemediations.map(item => html`
              <div 
                class="remediation-item" 
                role="listitem"
                tabindex="0"
                @click="${() => this.toggleDetails(item.id)}"
                @keydown="${(e: KeyboardEvent) => this.handleKeyDown(e, item.id)}"
                aria-expanded="${this.selectedRemediation === item.id}"
                aria-label="${item.title}, ${item.severity} severity, ${item.status.replace('-', ' ')}, ${item.progress}% complete"
              >
                <div class="severity-indicator severity-${item.severity}"></div>
                <div class="remediation-info">
                  <span class="remediation-title">${item.title}</span>
                  <span class="remediation-meta">
                    <span>${item.vulnerability}</span>
                    <span>•</span>
                    <span>${item.affectedAssets} affected assets</span>
                    <span>•</span>
                    <span class="assignee">
                      <span class="assignee-avatar">${item.assigneeInitials}</span>
                      ${item.assignee}
                    </span>
                  </span>
                  ${this.selectedRemediation === item.id ? html`
                    <div class="timeline-detail">
                      <div class="timeline-entry">
                        <span class="timeline-time">${item.created}</span>
                        <span class="timeline-content">Created remediation task</span>
                      </div>
                      <div class="timeline-entry">
                        <span class="timeline-time">SLA</span>
                        <span class="timeline-content">${item.sla} - Due ${item.dueDate}</span>
                      </div>
                    </div>
                  ` : ''}
                </div>
                <div class="due-date ${this.getDueDateClass(item.dueDate, item.status)}">
                  ${item.status === 'completed' ? 'Completed' : 
                    (this.getDaysUntilDue(item.dueDate) < 0 ? 
                      `${Math.abs(this.getDaysUntilDue(item.dueDate))}d overdue` : 
                      `${this.getDaysUntilDue(item.dueDate)}d left`)}
                </div>
                <div>
                  <div class="progress-bar" role="progressbar" aria-valuenow="${item.progress}" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-fill" style="width: ${item.progress}%"></div>
                  </div>
                  <div class="progress-text">${item.progress}% complete</div>
                </div>
                <span class="status-badge status-${item.status}">
                  ${item.status.replace('-', ' ')}
                </span>
                <div class="action-buttons">
                  <button 
                    class="icon-btn" 
                    aria-label="Edit ${item.title}"
                    @click="${(e: Event) => e.stopPropagation()}"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button 
                    class="icon-btn" 
                    aria-label="View details for ${item.title}"
                    @click="${(e: Event) => e.stopPropagation()}"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </div>
              </div>
            `) : html`
              <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <h3>No remediation tasks found</h3>
                <p>Try adjusting your filters or create a new task</p>
              </div>
            `
          }
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-remediation-tracking': ScRemediationTracking;
  }
}

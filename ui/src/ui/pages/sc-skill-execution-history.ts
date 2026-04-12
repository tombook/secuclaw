import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { roleContext } from '../store/role-context.js';
import '../components/sc-smart-recommendation-bar.js';
import { historyStore } from '../store/history-store.js';
import type { ExecutionResult } from '../store/history-store.js';

type FilterStatus = 'all' | 'completed' | 'failed' | 'running' | 'pending';

@customElement('sc-skill-execution-history')
export class ScSkillExecutionHistory extends LitElement {
  @state()
  private executions: ExecutionResult[] = [];

  @state()
  private selectedExecution: ExecutionResult | null = null;

  @state()
  private filterStatus: FilterStatus = 'all';

  static styles = css`
    :host {
      display: block;
      font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      padding: var(--space-4, 1rem);
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4, 1rem);
    }

    .title {
      font-size: var(--font-size-xl, 1.25rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text, #f8fafc);
      margin: 0;
    }

    .filter-select {
      padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
      background-color: var(--color-bg-secondary, #1e293b);
      border: 1px solid var(--color-border, #334155);
      border-radius: var(--radius-md, 0.375rem);
      color: var(--color-text, #f8fafc);
      font-size: var(--font-size-sm, 0.875rem);
      cursor: pointer;
    }

    .filter-select:focus {
      outline: none;
      border-color: var(--color-border-focus, #3b82f6);
    }

    .execution-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3, 0.75rem);
    }

    .execution-item {
      display: flex;
      align-items: center;
      padding: var(--space-4, 1rem);
      background-color: var(--color-bg-card, #1e293b);
      border: 1px solid var(--color-border, #334155);
      border-radius: var(--radius-lg, 0.5rem);
      cursor: pointer;
      transition: all var(--transition-fast, 150ms ease);
    }

    .execution-item:hover {
      border-color: var(--color-border-focus, #3b82f6);
      box-shadow: var(--shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1));
    }

    .execution-item.selected {
      border-color: var(--color-primary, #3b82f6);
      background-color: var(--color-bg-hover, #334155);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
      border-radius: var(--radius-full, 9999px);
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-medium, 500);
      text-transform: capitalize;
    }

    .status-badge.completed { 
      background-color: var(--color-success-bg, #14532d); 
      color: var(--color-success, #22c55e); 
    }

    .status-badge.failed { 
      background-color: var(--color-error-bg, #7f1d1d); 
      color: var(--color-error, #ef4444); 
    }

    .status-badge.pending { 
      background-color: var(--color-warning-bg, #78350f); 
      color: var(--color-warning, #f59e0b); 
    }

    .status-badge.running { 
      background-color: var(--color-info-bg, #1e3a5f); 
      color: var(--color-info, #3b82f6); 
      animation: pulse 1s infinite;
    }

    .execution-info {
      flex: 1;
      margin-left: var(--space-4, 1rem);
      min-width: 0;
    }

    .execution-skill {
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text, #f8fafc);
    }

    .execution-meta {
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-text-secondary, #cbd5e1);
      margin-top: var(--space-1, 0.25rem);
    }

    .detail-panel {
      margin-top: var(--space-4, 1rem);
      padding: var(--space-4, 1rem);
      background-color: var(--color-bg-card, #1e293b);
      border: 1px solid var(--color-border, #334155);
      border-radius: var(--radius-lg, 0.5rem);
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3, 0.75rem);
    }

    .detail-title {
      font-size: var(--font-size-lg, 1.125rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text, #f8fafc);
      margin: 0;
    }

    .detail-content {
      font-family: var(--font-family, monospace);
      font-size: var(--font-size-sm, 0.875rem);
      white-space: pre-wrap;
      word-wrap: break-word;
      background-color: var(--color-bg-secondary, #1e293b);
      padding: var(--space-3, 0.75rem);
      border-radius: var(--radius-md, 0.375rem);
      overflow-x: auto;
      color: var(--color-text, #f8fafc);
    }

    .empty-state {
      text-align: center;
      padding: var(--space-10, 2.5rem);
      color: var(--color-text-tertiary, #64748b);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadHistory();
    this.cleanupOldEntries();
  }

  private loadHistory() {
    this.executions = historyStore.getAll();
  }

  private cleanupOldEntries() {
    historyStore.cleanupOlderThan(30);
  }

  private selectExecution(execution: ExecutionResult) {
    this.selectedExecution = execution;
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private filteredExecutions(): ExecutionResult[] {
    if (this.filterStatus === 'all') return this.executions;
    return this.executions.filter(e => e.status === this.filterStatus);
  }

  render() {
    return html`
      <sc-smart-recommendation-bar></sc-smart-recommendation-bar>
      <div class="history-header">
        <h2 class="title">技能执行历史</h2>
        <select 
          class="filter-select" 
          @change=${(e: Event) => this.filterStatus = (e.target as HTMLSelectElement).value as FilterStatus}
        >
          <option value="all">全部</option>
          <option value="completed">成功</option>
          <option value="failed">失败</option>
          <option value="running">执行中</option>
          <option value="pending">等待中</option>
        </select>
      </div>

      <div class="execution-list">
        ${this.filteredExecutions().length === 0 ? html`
          <div class="empty-state">
            <div>暂无执行记录</div>
          </div>
        ` : this.filteredExecutions().map(exec => html`
          <div
            class="execution-item ${this.selectedExecution?.executionId === exec.executionId ? 'selected' : ''}"
            @click=${() => this.selectExecution(exec)}
          >
            <span class="status-badge ${exec.status}">${exec.status}</span>
            <div class="execution-info">
              <div class="execution-skill">${exec.skill}</div>
              <div class="execution-meta">
                ${this.formatDate(exec.timestamp)} · ${exec.duration ? `${exec.duration}ms` : '-'}
              </div>
            </div>
          </div>
        `)}
      </div>

      ${this.selectedExecution ? html`
        <div class="detail-panel">
          <div class="detail-header">
            <h3 class="detail-title">执行详情</h3>
          </div>
          <div class="detail-content">
${JSON.stringify(this.selectedExecution, null, 2)}
          </div>
        </div>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-skill-execution-history': ScSkillExecutionHistory;
  }
}

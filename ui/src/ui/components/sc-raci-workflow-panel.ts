import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { roleContext, type RoleId } from '../store/role-context.js';

interface WorkflowStep {
  id: string;
  title: string;
  description?: string;
  type: 'manual' | 'automated' | 'approval';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

@customElement('sc-raci-workflow-panel')
export class ScRaciWorkflowPanel extends LitElement {
  @property({ type: String })
  roleId: RoleId = 'security-expert';

  @property({ type: String })
  scenario: string = 'incident-response';

  @state()
  private steps: WorkflowStep[] = [];

  @state()
  private loading = false;

  static styles = css`
    :host {
      display: block;
      font-family: var(--sc-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    }

    .panel {
      background-color: var(--sc-bg-card, #1e293b);
      border: 1px solid var(--sc-border-color, #334155);
      border-radius: var(--sc-radius-lg, 0.75rem);
      padding: var(--sc-spacing-md, 1rem);
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-md, 1rem);
      padding-bottom: var(--sc-spacing-sm, 0.5rem);
      border-bottom: 1px solid var(--sc-border-color, #334155);
    }

    .panel-title {
      font-size: var(--sc-font-size-md, 1rem);
      font-weight: 600;
      color: var(--sc-text-primary, #f8fafc);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 0.5rem);
    }

    .workflow-steps {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-sm, 0.5rem);
    }

    .workflow-step {
      display: flex;
      align-items: flex-start;
      gap: var(--sc-spacing-sm, 0.5rem);
      padding: var(--sc-spacing-sm, 0.5rem);
      background-color: var(--sc-bg-secondary, #0f172a);
      border-radius: var(--sc-radius-md, 0.5rem);
      transition: all var(--sc-transition-fast, 150ms ease);
    }

    .workflow-step:hover {
      background-color: var(--sc-bg-hover, #334155);
    }

    .step-indicator {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid var(--sc-border-color, #334155);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--sc-font-size-xs, 0.75rem);
      font-weight: 600;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .step-indicator.pending {
      border-color: var(--sc-text-tertiary, #64748b);
      color: var(--sc-text-tertiary, #64748b);
    }

    .step-indicator.in_progress {
      border-color: var(--sc-primary, #3b82f6);
      color: var(--sc-primary, #3b82f6);
      animation: pulse 1.5s ease-in-out infinite;
    }

    .step-indicator.completed {
      border-color: #22c55e;
      background-color: #22c55e;
      color: white;
    }

    .step-indicator.failed {
      border-color: #ef4444;
      background-color: #ef4444;
      color: white;
    }

    .step-content {
      flex: 1;
    }

    .step-title {
      font-size: var(--sc-font-size-sm, 0.875rem);
      font-weight: 500;
      color: var(--sc-text-primary, #f8fafc);
      margin-bottom: var(--sc-spacing-xs, 0.25rem);
    }

    .step-description {
      font-size: var(--sc-font-size-xs, 0.75rem);
      color: var(--sc-text-secondary, #cbd5e1);
    }

    .step-type-badge {
      padding: 2px 6px;
      border-radius: var(--sc-radius-full, 999px);
      font-size: var(--sc-font-size-xs, 0.75rem);
      font-weight: 500;
      text-transform: uppercase;
    }

    .step-type-badge.manual {
      background-color: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    .step-type-badge.automated {
      background-color: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }

    .step-type-badge.approval {
      background-color: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: var(--sc-text-tertiary, #64748b);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @media (max-width: 768px) {
      .panel {
        padding: var(--sc-spacing-sm, 0.75rem);
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadWorkflowSteps();
  }

  private async loadWorkflowSteps() {
    this.loading = true;
    // Mock workflow steps - in real implementation, this would come from the backend
    this.steps = [
      {
        id: 'step-1',
        title: '接收事件通知',
        description: '接收并解析安全事件通知',
        type: 'automated',
        status: 'completed',
      },
      {
        id: 'step-2',
        title: '验证事件真实性',
        description: '验证安全事件的真实性和严重性',
        type: 'manual',
        status: 'in_progress',
      },
      {
        id: 'step-3',
        title: '评估风险等级',
        description: '评估事件的风险等级',
        type: 'automated',
        status: 'pending',
      },
      {
        id: 'step-4',
        title: '制定修复方案',
        description: '制定事件的修复方案',
        type: 'manual',
        status: 'pending',
      },
      {
        id: 'step-5',
        title: '执行修复',
        description: '执行修复或协调修复',
        type: 'automated',
        status: 'pending',
      },
    ];
    this.loading = false;
  }

  render() {
    return html`
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">
            <span>⚙️</span>
            <span>角色工作流</span>
          </div>
        </div>
        ${this.loading ? html`
          <div class="loading-state">
            加载中...
          </div>
        ` : html`
          <div class="workflow-steps">
            ${this.steps.map(step => html`
              <div class="workflow-step">
                <div class="step-indicator ${step.status}">
                  ${step.status === 'completed' ? '✓' : ''}
                  ${step.status === 'failed' ? '✕' : ''}
                </div>
                <div class="step-content">
                  <div class="step-title">
                    ${step.title}
                    <span class="step-type-badge ${step.type}">${step.type}</span>
                  </div>
                  ${step.description ? html`
                    <div class="step-description">${step.description}</div>
                  ` : ''}
                </div>
              </div>
            `)}
          </div>
        `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-raci-workflow-panel': ScRaciWorkflowPanel;
  }
}

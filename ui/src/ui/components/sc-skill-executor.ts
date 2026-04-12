import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { roleContext } from '../store/role-context.js';
import { skillStore } from '../store/skill-store.js';
import type { SkillDefinition } from '../store/skill-store.js';
import { gatewayClient } from '../gateway-client.js';
import { ScSkeleton, ScSkeletonGroup, ScEmptyState, ScErrorBoundary } from './design-system/index.js';

interface Skill {
  id: string;
  name: string;
  description: string;
  params: { name: string; type: string; required: boolean; description: string; default?: any }[];
}

@customElement('sc-skill-executor')
export class ScSkillExecutor extends LitElement {
  @property({ type: String })
  skillId = '';

  @state()
  private skills: Skill[] = [];

  @state()
  private selectedSkill: Skill | null = null;

  @state()
  private params: Record<string, any> = {};

  @state()
  private executing = false;

  @state()
  private executionStatus: 'idle' | 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' = 'idle';

  @state()
  private executionResult: any = null;

  @state()
  private error = '';

  @state()
  private progress = 0;

  @state()
  private isLoading = false;

  @state()
  private loadError: string | null = null;

  private currentExecutionId: string | null = null;

  static styles = css`
    :host {
      display: block;
      font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    }

    .skill-executor {
      background-color: var(--color-bg-card, #1e293b);
      border: 1px solid var(--color-border, #334155);
      border-radius: var(--radius-lg, 0.5rem);
      padding: var(--space-4, 1rem);
    }

    .skill-list {
      display: grid;
      gap: var(--space-3, 0.75rem);
      margin-bottom: var(--space-4, 1rem);
    }

    .skill-item {
      padding: var(--space-3, 0.75rem);
      background-color: var(--color-bg-secondary, #1e293b);
      border: 1px solid var(--color-border, #334155);
      border-radius: var(--radius-md, 0.375rem);
      cursor: pointer;
      transition: all var(--transition-fast, 150ms ease);
    }

    .skill-item:hover {
      border-color: var(--color-border-focus, #3b82f6);
      background-color: var(--color-bg-hover, #334155);
    }

    .skill-item.selected {
      border-color: var(--color-primary, #3b82f6);
      background-color: var(--color-primary-light, #1e3a5f);
    }

    .skill-item-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-1, 0.25rem);
    }

    .skill-name {
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text, #f8fafc);
    }

    .skill-description {
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-text-secondary, #cbd5e1);
    }

    .param-group {
      margin-bottom: var(--space-4, 1rem);
    }

    .param-label {
      display: block;
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text, #f8fafc);
      margin-bottom: var(--space-1, 0.25rem);
    }

    .param-required {
      color: var(--color-error, #ef4444);
    }

    .param-input {
      width: 100%;
      padding: var(--space-2, 0.5rem);
      background-color: var(--color-bg-secondary, #1e293b);
      border: 1px solid var(--color-border, #334155);
      border-radius: var(--radius-md, 0.375rem);
      font-size: var(--font-size-base, 1rem);
      color: var(--color-text, #f8fafc);
      box-sizing: border-box;
    }

    .param-input:focus {
      outline: none;
      border-color: var(--color-border-focus, #3b82f6);
    }

    .status-bar {
      display: flex;
      align-items: center;
      gap: var(--space-3, 0.75rem);
      padding: var(--space-3, 0.75rem);
      background-color: var(--color-bg-secondary, #1e293b);
      border-radius: var(--radius-md, 0.375rem);
      margin-bottom: var(--space-4, 1rem);
    }

    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-indicator.pending { background-color: var(--color-warning, #f59e0b); }
    .status-indicator.running { background-color: var(--color-primary, #3b82f6); animation: pulse 1s infinite; }
    .status-indicator.completed { background-color: var(--color-success, #22c55e); }
    .status-indicator.failed { background-color: var(--color-error, #ef4444); }
    .status-indicator.cancelled { background-color: var(--color-text-tertiary, #64748b); }

    .status-text {
      flex: 1;
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-text-secondary, #cbd5e1);
    }

    .progress-bar {
      flex: 1;
      height: 4px;
      background-color: var(--color-bg-tertiary, #334155);
      border-radius: var(--radius-full, 9999px);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background-color: var(--color-primary, #3b82f6);
      transition: width var(--transition-fast, 150ms ease);
    }

    .cancel-btn {
      padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
      background-color: transparent;
      border: 1px solid var(--color-border, #334155);
      border-radius: var(--radius-sm, 0.25rem);
      color: var(--color-text-secondary, #cbd5e1);
      cursor: pointer;
      font-size: var(--font-size-sm, 0.875rem);
      transition: all var(--transition-fast, 150ms ease);
    }

    .cancel-btn:hover {
      border-color: var(--color-error, #ef4444);
      color: var(--color-error, #ef4444);
    }

    .execute-btn {
      width: 100%;
      padding: var(--space-3, 0.75rem);
      background-color: var(--color-primary, #3b82f6);
      color: white;
      border: none;
      border-radius: var(--radius-md, 0.375rem);
      font-size: var(--font-size-base, 1rem);
      font-weight: var(--font-weight-medium, 500);
      cursor: pointer;
      transition: background-color var(--transition-fast, 150ms ease);
    }

    .execute-btn:hover:not(:disabled) {
      background-color: var(--color-primary-hover, #60a5fa);
    }

    .execute-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .result {
      margin-top: var(--space-4, 1rem);
      padding: var(--space-4, 1rem);
      background-color: var(--color-bg-secondary, #1e293b);
      border-radius: var(--radius-md, 0.375rem);
    }

    .result pre {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: var(--font-family, monospace);
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-text, #f8fafc);
    }

    .error-message {
      margin-top: var(--space-4, 1rem);
      padding: var(--space-3, 0.75rem);
      background-color: var(--color-error-bg, #7f1d1d);
      color: var(--color-error, #ef4444);
      border-radius: var(--radius-md, 0.375rem);
      font-size: var(--font-size-sm, 0.875rem);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadSkills();
    this.setupWebSocketListeners();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeWebSocketListeners();
  }

  private async loadSkills() {
    const roleId = roleContext.getState().currentRole;
    if (!roleId) return;

    this.isLoading = true;
    this.loadError = null;

    try {
      await skillStore.loadSkills();
      const allSkills = skillStore.getAllSkills();
      
      this.skills = allSkills
        .filter(skill => {
          const roles = skill.metadata?.openclaw?.role;
          return roles === roleId;
        })
        .map(skill => this.mapToSkill(skill));
    } catch (err: any) {
      this.loadError = err.message || 'Failed to load skills';
    } finally {
      this.isLoading = false;
    }
  }

  private mapToSkill(skillDef: SkillDefinition): Skill {
    return {
      id: (skillDef as any).id || skillDef.name,
      name: skillDef.name,
      description: skillDef.description,
      params: (skillDef as any).params || [],
    };
  }

  private setupWebSocketListeners() {
    gatewayClient.on('skill.execution.progress', (data: unknown) => {
      const d = data as { executionId: string; progress: number };
      if (d.executionId === this.currentExecutionId) {
        this.progress = d.progress;
      }
    });

    gatewayClient.on('skill.execution.completed', (data: unknown) => {
      const d = data as { executionId: string; result: any };
      if (d.executionId === this.currentExecutionId) {
        this.executing = false;
        this.executionStatus = 'completed';
        this.executionResult = d.result;
        this.progress = 100;
      }
    });

    gatewayClient.on('skill.execution.failed', (data: unknown) => {
      const d = data as { executionId: string; error?: { message: string } };
      if (d.executionId === this.currentExecutionId) {
        this.executing = false;
        this.executionStatus = 'failed';
        this.error = d.error?.message || 'Execution failed';
      }
    });
  }

  private removeWebSocketListeners() {
    gatewayClient.off('skill.execution.progress');
    gatewayClient.off('skill.execution.completed');
    gatewayClient.off('skill.execution.failed');
  }

  private selectSkill(skill: Skill) {
    this.selectedSkill = skill;
    this.params = {};
    this.executionResult = null;
    this.error = '';
    this.executionStatus = 'idle';
    this.progress = 0;

    skill.params.forEach(param => {
      if (param.default !== undefined) {
        this.params[param.name] = param.default;
      }
    });
  }

  private handleParamChange(paramName: string, value: any) {
    this.params = { ...this.params, [paramName]: value };
  }

  private validateParams(): boolean {
    if (!this.selectedSkill) return false;

    for (const param of this.selectedSkill.params) {
      if (param.required && !this.params[param.name]) {
        return false;
      }
    }
    return true;
  }

  private async execute() {
    if (!this.selectedSkill || !this.validateParams()) return;

    this.executing = true;
    this.executionStatus = 'pending';
    this.error = '';
    this.executionResult = null;
    this.progress = 0;

    try {
      const roleId = roleContext.getState().currentRole;
      if (!roleId) {
        throw new Error('No role selected');
      }

      this.executionStatus = 'running';
      
      const result = await gatewayClient.executeSkill({
        skillId: this.selectedSkill.id,
        roleId,
        params: this.params,
      });

      this.currentExecutionId = result.executionId;

    } catch (err: any) {
      this.executing = false;
      this.executionStatus = 'failed';
      this.error = err.message || 'Execution failed';
    }
  }

  private cancel() {
    if (this.currentExecutionId) {
      gatewayClient.cancelSkillExecution(this.currentExecutionId);
    }
    this.executing = false;
    this.executionStatus = 'cancelled';
    this.currentExecutionId = null;
  }

  private getStatusText(): string {
    const statusMap: Record<string, string> = {
      idle: '',
      pending: '等待执行',
      running: '执行中...',
      completed: '执行完成',
      failed: '执行失败',
      cancelled: '已取消',
    };
    return statusMap[this.executionStatus] || this.executionStatus;
  }

  render() {
    const isValid = this.validateParams();

    return html`
      <sc-error-boundary
        .fallbackMessage=${'Failed to render skill executor'}
        @retry=${() => this.loadSkills()}
      >
        <div class="skill-executor">
          ${this.isLoading ? html`
            <div class="skill-list">
              <sc-skeleton-group count="4" skeleton-variant="rounded"></sc-skeleton-group>
            </div>
          ` : this.loadError ? html`
            <sc-empty-state
              icon="⚠️"
              title="Failed to Load"
              description=${this.loadError}
              actionText="Retry"
              @action-click=${() => this.loadSkills()}
            ></sc-empty-state>
          ` : this.skills.length === 0 ? html`
            <sc-empty-state
              icon="🛠️"
              title="No Skills Available"
              description="There are no skills configured for your current role."
            ></sc-empty-state>
          ` : html`
            <div class="skill-list">
              ${this.skills.map(skill => html`
                <div 
                  class="skill-item ${this.selectedSkill?.id === skill.id ? 'selected' : ''}"
                  @click=${() => this.selectSkill(skill)}
                  role="button"
                  tabindex="0"
                  aria-pressed=${this.selectedSkill?.id === skill.id}
                >
                  <div class="skill-item-header">
                    <span class="skill-name">${skill.name}</span>
                  </div>
                  <div class="skill-description">${skill.description}</div>
                </div>
              `)}
            </div>
          `}

          ${this.selectedSkill ? html`
            <div class="params">
              ${this.selectedSkill.params.map(param => html`
                <div class="param-group">
                  <label class="param-label">
                    ${param.name}${param.required ? html`<span class="param-required"> *</span>` : ''}
                  </label>
                  <input
                    class="param-input"
                    type=${param.type === 'number' ? 'number' : 'text'}
                    .value=${this.params[param.name] || ''}
                    @input=${(e: Event) => this.handleParamChange(param.name, (e.target as HTMLInputElement).value)}
                    ?required=${param.required}
                    aria-required=${param.required}
                  />
                </div>
              `)}
            </div>

            ${this.executionStatus !== 'idle' ? html`
              <div class="status-bar">
                <span class="status-indicator ${this.executionStatus}"></span>
                <span class="status-text">${this.getStatusText()}</span>
                ${this.executionStatus === 'running' ? html`
                  <div class="progress-bar" role="progressbar" aria-valuenow=${this.progress} aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-fill" style="width: ${this.progress}%"></div>
                  </div>
                ` : ''}
                ${this.executing ? html`
                  <button class="cancel-btn" @click=${this.cancel} aria-label="Cancel execution">
                    取消
                  </button>
                ` : ''}
              </div>
            ` : ''}

            <button
              class="execute-btn"
              ?disabled=${!isValid || this.executing}
              @click=${this.execute}
              aria-busy=${this.executing}
            >
              ${this.executing ? '执行中...' : '执行'}
            </button>
          ` : ''}

          ${this.error ? html`
            <div class="error-message" role="alert">${this.error}</div>
          ` : ''}

          ${this.executionResult ? html`
            <div class="result">
              <pre>${JSON.stringify(this.executionResult, null, 2)}</pre>
            </div>
          ` : ''}
        </div>
      </sc-error-boundary>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-skill-executor': ScSkillExecutor;
  }
}

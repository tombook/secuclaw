import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { RoleId, ScenarioType } from '../store/role-context.js';
import { getWorkflowForRole, type WorkflowStep, type WorkflowStepType } from '../config/role-workflow-config.js';

export type StepStatus = 'pending' | 'in-progress' | 'completed';

export interface WorkflowStepState {
  stepId: string;
  status: StepStatus;
  suggestion?: string;
}

@customElement('sc-workflow-panel')
export class ScWorkflowPanel extends LitElement {
  @property({ type: String })
  roleId: RoleId = 'security-expert';

  @property({ type: String })
  scenarioType: ScenarioType = 'incident-response';

  @property({ type: String })
  eventId: string = 'default';

  @state()
  private steps: WorkflowStep[] = [];

  @state()
  private stepStates: Map<string, WorkflowStepState> = new Map();

  @state()
  private isAutoRunning = false;

  private storageKey: string = '';

  static styles = css`
    :host {
      display: block;
      font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    }

    .workflow-panel {
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }

    .workflow-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-lg, 20px);
      padding-bottom: var(--sc-spacing-md, 16px);
      border-bottom: 1px solid var(--sc-border-color, #e2e8f0);
    }

    .workflow-title {
      font-size: var(--sc-font-size-xl, 20px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
    }

    .workflow-progress {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #64748b);
    }

    .progress-bar {
      width: 100px;
      height: 8px;
      background-color: var(--sc-bg-tertiary, #f1f5f9);
      border-radius: var(--sc-radius-full, 999px);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background-color: var(--sc-primary, #3b82f6);
      transition: width 0.3s ease;
    }

    .steps-list {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-md, 16px);
    }

    .step-card {
      background-color: var(--sc-bg-secondary, #f8fafc);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-md, 8px);
      padding: var(--sc-spacing-md, 16px);
      transition: all 0.2s ease;
    }

    .step-card.in-progress {
      border-color: var(--sc-primary, #3b82f6);
      background-color: var(--sc-primary-light, #eff6ff);
    }

    .step-card.completed {
      border-color: var(--sc-success, #22c55e);
      background-color: rgba(34, 197, 94, 0.05);
    }

    .step-header {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md, 16px);
      margin-bottom: var(--sc-spacing-sm, 8px);
    }

    .step-status {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      flex-shrink: 0;
    }

    .step-status.pending {
      background-color: var(--sc-bg-tertiary, #f1f5f9);
      color: var(--sc-text-tertiary, #94a3b8);
      border: 2px solid var(--sc-border-color, #e2e8f0);
    }

    .step-status.in-progress {
      background-color: var(--sc-primary, #3b82f6);
      color: white;
      animation: pulse 1.5s infinite;
    }

    .step-status.completed {
      background-color: var(--sc-success, #22c55e);
      color: white;
    }

    .step-info {
      flex: 1;
    }

    .step-name {
      font-size: var(--sc-font-size-base, 16px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
      margin-bottom: var(--sc-spacing-xs, 4px);
    }

    .step-description {
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #64748b);
    }

    .step-meta {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md, 16px);
      margin-top: var(--sc-spacing-sm, 8px);
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-tertiary, #94a3b8);
    }

    .step-type {
      padding: 2px 8px;
      border-radius: var(--sc-radius-sm, 4px);
      font-weight: 500;
    }

    .step-type.manual {
      background-color: rgba(59, 130, 246, 0.1);
      color: var(--sc-primary, #3b82f6);
    }

    .step-type.auto {
      background-color: rgba(16, 185, 129, 0.1);
      color: var(--sc-success, #10b981);
    }

    .step-type.ai-suggest {
      background-color: rgba(139, 92, 246, 0.1);
      color: var(--sc-purple, #8b5cf6);
    }

    .step-estimated-time {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs, 4px);
    }

    .ai-suggestion-panel {
      margin-top: var(--sc-spacing-md, 16px);
      padding: var(--sc-spacing-md, 16px);
      background-color: rgba(139, 92, 246, 0.05);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: var(--sc-radius-md, 8px);
    }

    .ai-suggestion-header {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
      margin-bottom: var(--sc-spacing-sm, 8px);
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 600;
      color: var(--sc-purple, #8b5cf6);
    }

    .ai-suggestion-content {
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #64748b);
      margin-bottom: var(--sc-spacing-md, 16px);
      line-height: 1.5;
    }

    .ai-suggestion-actions {
      display: flex;
      gap: var(--sc-spacing-sm, 8px);
    }

    .btn {
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 16px);
      border-radius: var(--sc-radius-md, 8px);
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn-accept {
      background-color: var(--sc-purple, #8b5cf6);
      color: white;
    }

    .btn-accept:hover {
      background-color: #7c3aed;
    }

    .btn-reject {
      background-color: var(--sc-bg-tertiary, #f1f5f9);
      color: var(--sc-text-primary, #1e293b);
      border: 1px solid var(--sc-border-color, #e2e8f0);
    }

    .btn-reject:hover {
      background-color: #e2e8f0;
    }

    .completion-banner {
      margin-top: var(--sc-spacing-lg, 20px);
      padding: var(--sc-spacing-lg, 20px);
      background: linear-gradient(135deg, var(--sc-success, #22c55e) 0%, #16a34a 100%);
      color: white;
      border-radius: var(--sc-radius-md, 8px);
      text-align: center;
      animation: slideIn 0.3s ease;
    }

    .completion-icon {
      font-size: 48px;
      margin-bottom: var(--sc-spacing-md, 16px);
    }

    .completion-title {
      font-size: var(--sc-font-size-xl, 20px);
      font-weight: 600;
      margin-bottom: var(--sc-spacing-sm, 8px);
    }

    .completion-description {
      font-size: var(--sc-font-size-sm, 14px);
      opacity: 0.9;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(59, 130, 246, 0.2);
      border-top-color: var(--sc-primary, #3b82f6);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadWorkflow();
  }

  updated(changedProperties: Map<PropertyKey, unknown>) {
    super.updated(changedProperties);
    
    if (changedProperties.has('roleId') || changedProperties.has('scenarioType') || changedProperties.has('eventId')) {
      this.loadWorkflow();
    }
  }

  private loadWorkflow() {
    this.storageKey = `secuclaw-workflow-${this.eventId}-${this.roleId}-${this.scenarioType}`;
    
    this.steps = getWorkflowForRole(this.roleId, this.scenarioType);
    this.loadWorkflowState();
    this.checkAutoSteps();
  }

  private loadWorkflowState() {
    try {
      const saved = sessionStorage.getItem(this.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        this.stepStates = new Map(data.steps.map((s: WorkflowStepState) => [s.stepId, s]));
      } else {
        this.stepStates = new Map(
          this.steps.map(step => [step.id, { stepId: step.id, status: 'pending' }])
        );
      }
    } catch {
      this.stepStates = new Map(
        this.steps.map(step => [step.id, { stepId: step.id, status: 'pending' }])
      );
    }
  }

  private saveWorkflowState() {
    const data = {
      steps: Array.from(this.stepStates.values()),
      savedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  private checkAutoSteps() {
    if (this.isAutoRunning) return;

    for (const step of this.steps) {
      if (step.type === 'auto') {
        const stepState = this.stepStates.get(step.id);
        if (stepState?.status === 'pending' && this.areDependenciesComplete(step)) {
          this.triggerAutoStep(step);
          return;
        }
      }
    }
  }

  private areDependenciesComplete(step: WorkflowStep): boolean {
    if (!step.dependsOn || step.dependsOn.length === 0) return true;
    
    return step.dependsOn.every(depId => {
      const depState = this.stepStates.get(depId);
      return depState?.status === 'completed';
    });
  }

  private triggerAutoStep(step: WorkflowStep) {
    this.isAutoRunning = true;
    const stepState = this.stepStates.get(step.id);
    if (stepState) {
      stepState.status = 'in-progress';
      this.saveWorkflowState();
      this.requestUpdate();
    }

    setTimeout(() => {
      const state = this.stepStates.get(step.id);
      if (state) {
        state.status = 'completed';
        this.saveWorkflowState();
        this.requestUpdate();
        this.checkWorkflowCompletion();
      }
      this.isAutoRunning = false;
      this.checkAutoSteps();
    }, 2000);
  }

  private handleManualStepClick(step: WorkflowStep) {
    const stepState = this.stepStates.get(step.id);
    if (!stepState) return;

    if (stepState.status === 'pending') {
      if (this.areDependenciesComplete(step)) {
        stepState.status = 'in-progress';
        this.saveWorkflowState();
        this.requestUpdate();
      }
    } else if (stepState.status === 'in-progress') {
      stepState.status = 'completed';
      this.saveWorkflowState();
      this.requestUpdate();
      this.checkAutoSteps();
      this.checkWorkflowCompletion();
    }
  }

  private handleAiSuggestionAccept(step: WorkflowStep) {
    const stepState = this.stepStates.get(step.id);
    if (stepState) {
      stepState.status = 'completed';
      this.saveWorkflowState();
      this.requestUpdate();
      this.checkAutoSteps();
      this.checkWorkflowCompletion();
    }
  }

  private handleAiSuggestionReject(step: WorkflowStep) {
    const stepState = this.stepStates.get(step.id);
    if (stepState) {
      stepState.status = 'pending';
      this.saveWorkflowState();
      this.requestUpdate();
    }
  }

  private checkWorkflowCompletion() {
    const allCompleted = Array.from(this.stepStates.values()).every(s => s.status === 'completed');
    if (allCompleted) {
      const event = new CustomEvent('workflow-complete', {
        detail: {
          roleId: this.roleId,
          scenarioType: this.scenarioType,
          completedAt: new Date(),
          stepCount: this.steps.length,
        },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    }
  }

  private isStepClickable(step: WorkflowStep): boolean {
    const stepState = this.stepStates.get(step.id);
    if (!stepState) return false;
    if (step.type !== 'manual') return false;
    if (stepState.status === 'completed') return false;
    return this.areDependenciesComplete(step);
  }

  private renderStepTypeBadge(type: WorkflowStepType) {
    const typeLabels = {
      manual: '手动',
      auto: '自动',
      'ai-suggest': 'AI建议',
    };
    
    return html`
      <span class="step-type ${type}">${typeLabels[type]}</span>
    `;
  }

  private renderStep(step: WorkflowStep, index: number) {
    const stepState = this.stepStates.get(step.id);
    const status = stepState?.status || 'pending';
    const isClickable = this.isStepClickable(step);
    const isRunningAuto = step.type === 'auto' && status === 'in-progress';
    const dependenciesMet = this.areDependenciesComplete(step);

    let statusIcon = '○';
    if (status === 'in-progress') {
      statusIcon = isRunningAuto ? '' : '⟳';
    } else if (status === 'completed') {
      statusIcon = '✓';
    }

    return html`
      <div 
        class="step-card ${status} ${!dependenciesMet ? 'disabled' : ''}"
        style="${!dependenciesMet ? 'opacity: 0.6; cursor: not-allowed;' : ''}"
      >
        <div class="step-header">
          <div class="step-status ${status}">
            ${isRunningAuto ? html`<div class="spinner"></div>` : statusIcon}
          </div>
          <div class="step-info">
            <div class="step-name">${index + 1}. ${step.name}</div>
            <div class="step-description">${step.description}</div>
            <div class="step-meta">
              ${this.renderStepTypeBadge(step.type)}
              ${step.estimatedDuration ? html`
                <span class="step-estimated-time">
                  ⏱ ${step.estimatedDuration}
                </span>
              ` : ''}
            </div>
          </div>
          ${step.type === 'manual' ? html`
            <button
              class="btn ${status === 'completed' ? 'btn-accept' : 'btn-reject'}"
              ?disabled=${!isClickable}
              @click=${() => this.handleManualStepClick(step)}
            >
              ${status === 'pending' ? '开始' : status === 'in-progress' ? '完成' : '已完成'}
            </button>
          ` : ''}
        </div>
        
        ${step.type === 'ai-suggest' && status === 'in-progress' ? html`
          <div class="ai-suggestion-panel">
            <div class="ai-suggestion-header">
              <span>🤖</span>
              <span>AI 智能建议</span>
            </div>
            <div class="ai-suggestion-content">
              基于当前情况分析，AI 建议执行以下操作：${step.skillId ? '调用 ' + step.skillId + ' 技能' : ''}
            </div>
            <div class="ai-suggestion-actions">
              <button
                class="btn btn-accept"
                @click=${() => this.handleAiSuggestionAccept(step)}
              >
                ✓ 接受建议
              </button>
              <button
                class="btn btn-reject"
                @click=${() => this.handleAiSuggestionReject(step)}
              >
                ✕ 拒绝建议
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  render() {
    const completedSteps = Array.from(this.stepStates.values()).filter(s => s.status === 'completed').length;
    const totalSteps = this.steps.length;
    const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
    const isComplete = completedSteps === totalSteps && totalSteps > 0;

    return html`
      <div class="workflow-panel">
        <div class="workflow-header">
          <div class="workflow-title">
            <span>📋</span>
            <span>工作流程 - ${this.scenarioType}</span>
          </div>
          <div class="workflow-progress">
            <span>${completedSteps}/${totalSteps}</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>
          </div>
        </div>

        ${isComplete ? html`
          <div class="completion-banner">
            <div class="completion-icon">🎉</div>
            <div class="completion-title">工作流程已完成</div>
            <div class="completion-description">所有步骤已成功执行完毕</div>
          </div>
        ` : html`
          <div class="steps-list">
            ${this.steps.map((step, index) => this.renderStep(step, index))}
          </div>
        `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-workflow-panel': ScWorkflowPanel;
  }
}

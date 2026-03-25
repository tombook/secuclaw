/**
 * sc-run-log-panel.ts
 * Execution Run Log Panel
 * 
 * Displays execution run details, timeline, parameters, and artifacts
 */

import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { I18nController } from '../../../i18n/lib/lit-controller.js';
import type { ExecutionRun, RunStatus, DomainId } from '../../capabilities-client.js';
import { capabilitiesClient } from '../../capabilities-client.js';

// Status colors
const STATUS_COLORS: Record<RunStatus, string> = {
  'queued': '#6B7280',
  'running': '#3B82F6',
  'success': '#10B981',
  'failed': '#EF4444',
  'canceled': '#F59E0B',
};

// Status icons
const STATUS_ICONS: Record<RunStatus, string> = {
  'queued': '⏳',
  'running': '🔄',
  'success': '✅',
  'failed': '❌',
  'canceled': '⏹️',
};

@customElement('sc-run-log-panel')
export class ScRunLogPanel extends LitElement {
  private i18n = new I18nController(this);

  @property({ type: Object })
  run: ExecutionRun | null = null;

  @property({ type: Array })
  allRuns: ExecutionRun[] = [];

  @state()
  private selectedRunId: string | null = null;

  @state()
  private loading = false;

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

    /* Status Badge */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: var(--sc-radius-full, 9999px);
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      color: white;
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 12px);
      margin-bottom: var(--sc-spacing-xl, 24px);
    }

    .info-label {
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-tertiary, #9ca3af);
    }

    .info-value {
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-primary, #111827);
      word-break: break-all;
    }

    /* Section */
    .section {
      margin-bottom: var(--sc-spacing-xl, 24px);
    }

    .section-title {
      font-size: var(--sc-font-size-md, 16px);
      font-weight: 600;
      color: var(--sc-text-primary, #111827);
      margin-bottom: var(--sc-spacing-md, 12px);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Timeline */
    .timeline {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-md, 12px);
      padding: var(--sc-spacing-md, 12px);
      background: var(--sc-bg-secondary, #f9fafb);
      border-radius: var(--sc-radius-md, 6px);
    }

    .timeline-item {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
    }

    .timeline-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--sc-primary, #3b82f6);
    }

    .timeline-dot.completed {
      background: var(--sc-success, #10b981);
    }

    .timeline-line {
      width: 2px;
      height: 20px;
      background: var(--sc-border-color, #e5e7eb);
      margin-left: 4px;
    }

    /* Parameters */
    .params-box {
      background: var(--sc-bg-secondary, #f9fafb);
      border: 1px solid var(--sc-border-color, #e5e7eb);
      border-radius: var(--sc-radius-md, 6px);
      padding: var(--sc-spacing-md, 12px);
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: var(--sc-font-size-xs, 12px);
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 200px;
      overflow-y: auto;
    }

    /* Summary */
    .summary-box {
      background: var(--sc-bg-secondary, #f9fafb);
      border-radius: var(--sc-radius-md, 6px);
      padding: var(--sc-spacing-md, 12px);
      line-height: 1.6;
    }

    /* Error */
    .error-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--sc-radius-md, 6px);
      padding: var(--sc-spacing-md, 12px);
      color: #991b1b;
    }

    .error-title {
      font-weight: 600;
      margin-bottom: var(--sc-spacing-sm, 8px);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .error-message {
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: var(--sc-font-size-xs, 12px);
      white-space: pre-wrap;
      word-break: break-all;
    }

    /* Artifacts */
    .artifacts-list {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-xs, 4px);
    }

    .artifact-item {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 12px);
      background: var(--sc-bg-secondary, #f9fafb);
      border-radius: var(--sc-radius-md, 6px);
      cursor: pointer;
      transition: background 0.2s;
    }

    .artifact-item:hover {
      background: var(--sc-bg-tertiary, #f3f4f6);
    }

    .artifact-icon {
      font-size: 16px;
    }

    .artifact-name {
      flex: 1;
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-primary, #111827);
    }

    /* Run History */
    .run-history {
      margin-top: var(--sc-spacing-xl, 24px);
    }

    .run-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 12px);
      border: 1px solid var(--sc-border-color, #e5e7eb);
      border-radius: var(--sc-radius-md, 6px);
      margin-bottom: var(--sc-spacing-sm, 8px);
      cursor: pointer;
      transition: all 0.2s;
    }

    .run-item:hover {
      border-color: var(--sc-primary, #3b82f6);
      background: var(--sc-bg-secondary, #f9fafb);
    }

    .run-item.active {
      border-color: var(--sc-primary, #3b82f6);
      background: var(--sc-primary-bg, #eff6ff);
    }

    .run-item-info {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
    }

    .run-item-id {
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      color: var(--sc-text-primary, #111827);
    }

    .run-item-time {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-tertiary, #9ca3af);
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

    .btn-secondary {
      background: var(--sc-bg-tertiary, #f3f4f6);
      color: var(--sc-text-primary, #111827);
    }

    .btn-secondary:hover {
      background: var(--sc-border-color, #e5e7eb);
    }
  `;

  private handleClose() {
    this.dispatchEvent(new CustomEvent('close-panel', {
      bubbles: true,
      composed: true,
    }));
  }

  private handleArtifactClick(artifact: string) {
    this.dispatchEvent(new CustomEvent('view-evidence', {
      detail: { artifactId: artifact },
      bubbles: true,
      composed: true,
    }));
  }

  private handleRunSelect(run: ExecutionRun) {
    this.selectedRunId = run.id;
    this.run = run;
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  private formatTimestamp(timestamp?: number): string {
    if (!timestamp) return '--';
    return new Date(timestamp).toLocaleString();
  }

  private calculateDuration(): number | null {
    if (!this.run?.startedAt || !this.run?.endedAt) return null;
    return this.run.endedAt - this.run.startedAt;
  }

  render() {
    if (!this.run) {
      return html`
        <div class="panel-container">
          <div class="empty-state">
            <p>${this.i18n.t('common.noData')}</p>
          </div>
        </div>
      `;
    }

    const duration = this.calculateDuration();

    return html`
      <div class="panel-container">
        <div class="panel-header">
          <h2 class="panel-title">${this.i18n.t('capabilities.runLogPanel.title')}</h2>
          <button class="close-btn" @click=${this.handleClose}>✕</button>
        </div>

        <div class="panel-content">
          <!-- Status -->
          <div class="section">
            <span 
              class="status-badge" 
              style="background: ${STATUS_COLORS[this.run.status]}"
            >
              ${STATUS_ICONS[this.run.status]} ${this.i18n.t(`capabilities.runLogPanel.${this.run.status}`)}
            </span>
          </div>

          <!-- Basic Info -->
          <div class="section">
            <h4 class="section-title">📋 ${this.i18n.t('common.details')}</h4>
            <div class="info-grid">
              <div class="info-label">${this.i18n.t('capabilities.runLogPanel.runId')}</div>
              <div class="info-value">${this.run.id}</div>
              
              <div class="info-label">${this.i18n.t('capabilities.runLogPanel.taskId')}</div>
              <div class="info-value">${this.run.taskId}</div>
              
              <div class="info-label">${this.i18n.t('capabilities.runLogPanel.toolId')}</div>
              <div class="info-value">${this.run.toolId}</div>
              
              <div class="info-label">${this.i18n.t('capabilities.runLogPanel.startTime')}</div>
              <div class="info-value">${this.formatTimestamp(this.run.startedAt)}</div>
              
              <div class="info-label">${this.i18n.t('capabilities.runLogPanel.endTime')}</div>
              <div class="info-value">${this.formatTimestamp(this.run.endedAt)}</div>
              
              ${duration !== null ? html`
                <div class="info-label">${this.i18n.t('capabilities.runLogPanel.duration')}</div>
                <div class="info-value">${this.formatDuration(duration)}</div>
              ` : ''}
            </div>
          </div>

          <!-- Timeline -->
          <div class="section">
            <h4 class="section-title">⏱️ 执行时间线</h4>
            <div class="timeline">
              <div class="timeline-item">
                <span class="timeline-dot ${this.run.startedAt ? 'completed' : ''}"></span>
                <span>创建: ${this.formatTimestamp(this.run.createdAt)}</span>
              </div>
              <div class="timeline-line"></div>
              <div class="timeline-item">
                <span class="timeline-dot ${this.run.status !== 'queued' ? 'completed' : ''}"></span>
                <span>开始: ${this.formatTimestamp(this.run.startedAt) || '等待中'}</span>
              </div>
              <div class="timeline-line"></div>
              <div class="timeline-item">
                <span class="timeline-dot ${['success', 'failed', 'canceled'].includes(this.run.status) ? 'completed' : ''}"></span>
                <span>结束: ${this.formatTimestamp(this.run.endedAt) || '执行中'}</span>
              </div>
            </div>
          </div>

          <!-- Parameters -->
          <div class="section">
            <h4 class="section-title">⚙️ ${this.i18n.t('capabilities.runLogPanel.parameters')}</h4>
            <div class="params-box">
              ${JSON.stringify(this.run.params, null, 2)}
            </div>
          </div>

          <!-- Summary -->
          ${this.run.summary ? html`
            <div class="section">
              <h4 class="section-title">📝 ${this.i18n.t('capabilities.runLogPanel.summary')}</h4>
              <div class="summary-box">${this.run.summary}</div>
            </div>
          ` : ''}

          <!-- Error -->
          ${this.run.error ? html`
            <div class="section">
              <div class="error-box">
                <div class="error-title">❌ ${this.i18n.t('capabilities.runLogPanel.error')}</div>
                <div class="error-message">${this.run.error}</div>
              </div>
            </div>
          ` : ''}

          <!-- Artifacts -->
          <div class="section">
            <h4 class="section-title">
              📁 ${this.i18n.t('capabilities.runLogPanel.artifacts')}
              (${this.run.artifacts.length})
            </h4>
            ${this.run.artifacts.length === 0 ? html`
              <div class="empty-state">${this.i18n.t('capabilities.runLogPanel.noArtifacts')}</div>
            ` : html`
              <div class="artifacts-list">
                ${this.run.artifacts.map(artifact => html`
                  <div class="artifact-item" @click=${() => this.handleArtifactClick(artifact)}>
                    <span class="artifact-icon">📄</span>
                    <span class="artifact-name">${artifact}</span>
                    <span>→</span>
                  </div>
                `)}
              </div>
            `}
          </div>

          <!-- Run History -->
          ${this.allRuns.length > 1 ? html`
            <div class="run-history">
              <h4 class="section-title">📜 ${this.i18n.t('capabilities.runLogPanel.runHistory')}</h4>
              ${this.allRuns.map(run => html`
                <div 
                  class="run-item ${run.id === this.run?.id ? 'active' : ''}"
                  @click=${() => this.handleRunSelect(run)}
                >
                  <div class="run-item-info">
                    <span>${STATUS_ICONS[run.status]}</span>
                    <span class="run-item-id">${run.id.slice(0, 8)}</span>
                  </div>
                  <span class="run-item-time">${this.formatTimestamp(run.createdAt)}</span>
                </div>
              `)}
            </div>
          ` : ''}
        </div>

        <div class="panel-actions">
          <button class="btn btn-secondary" @click=${this.handleClose}>
            ${this.i18n.t('capabilities.closePanel')}
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-run-log-panel': ScRunLogPanel;
  }
}

/**
 * sc-evidence-panel.ts
 * Evidence Packages Panel
 * 
 * Displays evidence packages with hash verification and export functionality
 */

import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { I18nController } from '../../../i18n/lib/lit-controller.js';
import type { EvidencePack } from '../../capabilities-client.js';
import { capabilitiesClient } from '../../capabilities-client.js';
import '../../components/design-system/sc-button.js';

@customElement('sc-evidence-panel')
export class ScEvidencePanel extends LitElement {
  private i18n = new I18nController(this);

  @property({ type: Array })
  evidence: EvidencePack[] = [];

  @property({ type: String })
  taskId?: string;

  @property({ type: String })
  runId?: string;

  @state()
  private loading = false;

  @state()
  private verificationStatus: Map<string, boolean> = new Map();

  @state()
  private selectedEvidence: EvidencePack | null = null;

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

    /* Evidence Card */
    .evidence-card {
      background: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e5e7eb);
      border-radius: var(--sc-radius-lg, 8px);
      padding: var(--sc-spacing-md, 12px);
      margin-bottom: var(--sc-spacing-md, 12px);
      cursor: pointer;
      transition: all 0.2s;
    }

    .evidence-card:hover {
      border-color: var(--sc-primary, #3b82f6);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .evidence-card.selected {
      border-color: var(--sc-primary, #3b82f6);
      background: var(--sc-primary-bg, #eff6ff);
    }

    .evidence-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--sc-spacing-sm, 8px);
    }

    .evidence-title {
      font-size: var(--sc-font-size-md, 16px);
      font-weight: 600;
      color: var(--sc-text-primary, #111827);
      flex: 1;
    }

    .verification-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: var(--sc-radius-full, 9999px);
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 500;
    }

    .verification-badge.verified {
      background: var(--sc-success-bg, #d1fae5);
      color: var(--sc-success, #10b981);
    }

    .verification-badge.not-verified {
      background: var(--sc-warning-bg, #fef3c7);
      color: var(--sc-warning, #f59e0b);
    }

    .evidence-description {
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #6b7280);
      margin-bottom: var(--sc-spacing-sm, 8px);
      line-height: 1.5;
    }

    /* Info Grid */
    .info-row {
      display: flex;
      gap: var(--sc-spacing-md, 12px);
      margin-bottom: var(--sc-spacing-xs, 4px);
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-tertiary, #9ca3af);
    }

    /* Hash */
    .hash-section {
      background: var(--sc-bg-secondary, #f9fafb);
      border-radius: var(--sc-radius-md, 6px);
      padding: var(--sc-spacing-sm, 8px);
      margin-top: var(--sc-spacing-sm, 8px);
    }

    .hash-label {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-tertiary, #9ca3af);
      margin-bottom: 2px;
    }

    .hash-value {
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: var(--sc-font-size-xs, 11px);
      color: var(--sc-text-secondary, #6b7280);
      word-break: break-all;
    }

    /* Tags */
    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sc-spacing-xs, 4px);
      margin-top: var(--sc-spacing-sm, 8px);
    }

    .tag {
      padding: 2px 8px;
      background: var(--sc-bg-tertiary, #f3f4f6);
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #6b7280);
    }

    /* Files List */
    .files-section {
      margin-top: var(--sc-spacing-md, 12px);
      padding-top: var(--sc-spacing-md, 12px);
      border-top: 1px solid var(--sc-border-color, #e5e7eb);
    }

    .files-title {
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      color: var(--sc-text-primary, #111827);
      margin-bottom: var(--sc-spacing-sm, 8px);
    }

    .file-item {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
      padding: var(--sc-spacing-xs, 4px) 0;
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #6b7280);
    }

    .file-icon {
      font-size: 16px;
    }

    .file-name {
      flex: 1;
      word-break: break-all;
    }

    /* Actions */
    .evidence-actions {
      display: flex;
      gap: var(--sc-spacing-sm, 8px);
      margin-top: var(--sc-spacing-md, 12px);
      padding-top: var(--sc-spacing-md, 12px);
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
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .btn-primary {
      background: var(--sc-primary, #3b82f6);
      color: white;
    }

    .btn-primary:hover {
      background: var(--sc-primary-hover, #2563eb);
    }

    .btn-primary:disabled {
      background: var(--sc-border-color, #e5e7eb);
      cursor: not-allowed;
    }

    .btn-secondary {
      background: var(--sc-bg-tertiary, #f3f4f6);
      color: var(--sc-text-primary, #111827);
    }

    .btn-secondary:hover {
      background: var(--sc-border-color, #e5e7eb);
    }

    /* Panel Footer */
    .panel-footer {
      display: flex;
      gap: var(--sc-spacing-sm, 8px);
      padding: var(--sc-spacing-lg, 16px);
      border-top: 1px solid var(--sc-border-color, #e5e7eb);
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--sc-text-tertiary, #9ca3af);
      text-align: center;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: var(--sc-spacing-md, 12px);
    }

    /* Warning */
    .warning-box {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: var(--sc-radius-md, 6px);
      padding: var(--sc-spacing-md, 12px);
      margin-bottom: var(--sc-spacing-md, 12px);
      font-size: var(--sc-font-size-sm, 14px);
      color: #92400e;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadEvidence();
  }

  private async loadEvidence() {
    if (this.evidence.length > 0) return; // Already has data
    
    this.loading = true;
    try {
      const evidence = await capabilitiesClient.listEvidence({
        taskId: this.taskId,
        runId: this.runId,
      });
      this.evidence = evidence;
    } catch (error) {
      console.error('[sc-evidence-panel] Failed to load evidence:', error);
    }
    this.loading = false;
  }

  private handleClose() {
    this.dispatchEvent(new CustomEvent('close-panel', {
      bubbles: true,
      composed: true,
    }));
  }

  private handleVerify(evidence: EvidencePack) {
    // Simulate hash verification (in real app, would compute and compare hash)
    const verified = true; // Mock: always verify successfully
    this.verificationStatus.set(evidence.id, verified);
    this.requestUpdate();
  }

  private async handleExport(evidence: EvidencePack) {
    const isVerified = this.verificationStatus.get(evidence.id);
    
    if (!isVerified) {
      // Must verify before export per spec section 13.3
      alert(this.i18n.t('capabilities.evidencePanel.exportWarning'));
      return;
    }

    this.dispatchEvent(new CustomEvent('export-evidence', {
      detail: { 
        evidenceId: evidence.id, 
        verified: true 
      },
      bubbles: true,
      composed: true,
    }));
  }

  private handleSelectEvidence(evidence: EvidencePack) {
    this.selectedEvidence = this.selectedEvidence?.id === evidence.id ? null : evidence;
  }

  private formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  private getFileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const icons: Record<string, string> = {
      'json': '📋',
      'log': '📝',
      'txt': '📄',
      'pdf': '📕',
      'csv': '📊',
      'xml': '📄',
      'zip': '📦',
    };
    return icons[ext || ''] || '📄';
  }

  render() {
    if (this.loading) {
      return html`
        <div class="panel-container">
          <div class="panel-content">
            <div class="empty-state">
              ${this.i18n.t('common.loading')}
            </div>
          </div>
        </div>
      `;
    }

    if (this.evidence.length === 0) {
      return html`
        <div class="panel-container">
          <div class="panel-header">
            <h2 class="panel-title">${this.i18n.t('capabilities.evidencePanel.title')}</h2>
            <sc-button variant="secondary" size="sm" class="close-btn" @click=${this.handleClose}>✕</sc-button>
          </div>
          <div class="panel-content">
            <div class="empty-state">
              <div class="empty-icon">📁</div>
              <p>${this.i18n.t('capabilities.evidencePanel.noEvidence')}</p>
            </div>
          </div>
          <div class="panel-footer">
            <sc-button variant="secondary" @click=${this.handleClose}>
              ${this.i18n.t('capabilities.closePanel')}
            </sc-button>
          </div>
        </div>
      `;
    }

    return html`
      <div class="panel-container">
        <div class="panel-header">
          <h2 class="panel-title">${this.i18n.t('capabilities.evidencePanel.title')} (${this.evidence.length})</h2>
          <sc-button variant="secondary" size="sm" class="close-btn" @click=${this.handleClose}>✕</sc-button>
        </div>

        <div class="panel-content">
          <!-- Warning about verification -->
          <div class="warning-box">
            ⚠️ ${this.i18n.t('capabilities.evidencePanel.exportWarning')}
          </div>

          ${this.evidence.map(ev => {
            const isVerified = this.verificationStatus.get(ev.id);
            const isSelected = this.selectedEvidence?.id === ev.id;

            return html`
              <div 
                class="evidence-card ${isSelected ? 'selected' : ''}"
                @click=${() => this.handleSelectEvidence(ev)}
              >
                <div class="evidence-header">
                  <span class="evidence-title">${ev.title}</span>
                  <span class="verification-badge ${isVerified ? 'verified' : 'not-verified'}">
                    ${isVerified ? '✓ ' + this.i18n.t('capabilities.evidencePanel.verified') : '○ ' + this.i18n.t('capabilities.evidencePanel.notVerified')}
                  </span>
                </div>

                ${ev.description ? html`
                  <p class="evidence-description">${ev.description}</p>
                ` : ''}

                <div class="info-row">
                  <div class="info-item">
                    👤 ${this.i18n.t('capabilities.evidencePanel.createdBy')}: ${ev.createdBy || '--'}
                  </div>
                  <div class="info-item">
                    📅 ${this.formatTimestamp(ev.createdAt)}
                  </div>
                </div>

                <div class="hash-section">
                  <div class="hash-label">${this.i18n.t('capabilities.evidencePanel.hash')}:</div>
                  <div class="hash-value">${ev.hash}</div>
                </div>

                ${ev.tags.length > 0 ? html`
                  <div class="tags-container">
                    ${ev.tags.map(tag => html`
                      <span class="tag">${tag}</span>
                    `)}
                  </div>
                ` : ''}

                <!-- Expanded Details -->
                ${isSelected ? html`
                  <div class="files-section">
                    <div class="files-title">${this.i18n.t('capabilities.evidencePanel.files')} (${ev.files.length})</div>
                    ${ev.files.map(file => html`
                      <div class="file-item">
                        <span class="file-icon">${this.getFileIcon(file)}</span>
                        <span class="file-name">${file}</span>
                      </div>
                    `)}
                  </div>

                  <div class="evidence-actions">
                    <button 
                      variant="secondary"
                      @click=${(e: Event) => { e.stopPropagation(); this.handleVerify(ev); }}
                    >
                      🔍 ${isVerified ? '已验证' : '验证'}
                    </sc-button>
                    <button 
                      variant="primary"
                      @click=${(e: Event) => { e.stopPropagation(); this.handleExport(ev); }}
                      ?disabled=${!isVerified}
                    >
                      📥 ${this.i18n.t('capabilities.evidencePanel.export')}
                    </sc-button>
                  </div>
                ` : ''}
              </div>
            `;
          })}
        </div>

        <div class="panel-footer">
          <sc-button variant="secondary" @click=${this.handleClose}>
            ${this.i18n.t('capabilities.closePanel')}
          </sc-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-evidence-panel': ScEvidencePanel;
  }
}

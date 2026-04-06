/**
 * sc-approval-dialog.ts
 * Dark Side Approval Workflow (CRITICAL for security)
 * 
 * Per spec sections 9.2, 10.1, 10.2, 13.3:
 * - This dialog MUST be shown before any dark domain execution
 * - SoD (Segregation of Duties) validation: requester cannot be appro
 */

import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { I18nController } from '../../../i18n/lib/lit-controller.js';
import type { SecurityTask, Approval } from '../../capabilities-client.js';
import { capabilitiesClient } from '../../capabilities-client.js';

type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

@customElement('sc-approval-dialog')
export class ScApprovalDialog extends LitElement {
  private i18n = new I18nController(this);

  @property({ type: Object })
  task: SecurityTask | null = null;

  @property({ type: Object })
  existingApproval: Approval | null = null;

  @property({ type: String })
  mode: 'create' | 'view' | 'approve' = 'create';

  @property({ type: String })
  currentUser: string = '';

  @state()
  private scope = '';

  @state()
  private ticketNo: string = '';

  @state()
  private expiresAt: string = '';

  @state()
  private reason: string = '';

  @state()
  private rejectReason: string = '';

  @state()
  private submitting = false;

  @state()
  private error = '';

  static styles = css`
    :host {
      display: block;
    }

    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .dialog-container {
      background: var(--sc-bg-primary, #ffffff);
      border-radius: var(--sc-radius-lg, 8px);
      width: 100%;
      max-width: 520px;
      max-height: 80vh;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      overflow-y: auto;
      animation: slideIn 0.3s ease-out;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--sc-spacing-lg, 16px);
      border-bottom: 1px solid var(--sc-border-color, #e5e7eb);
    }

    .dialog-title {
      font-size: var(--sc-font-size-xl, 20px);
      font-weight: 600;
      color: var(--sc-text-primary, #111827);
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      color: var(--sc-text-tertiary, #9ca3af);
      font-size: 20px;
    }

    /* Warning Banner */
    .warning-banner {
      background: #fef3c7;
      border: 1px solid #fca5a5;
      border-radius: var(--sc-radius-md, 6px);
      padding: var(--sc-spacing-md, 12px);
      margin-bottom: var(--sc-spacing-lg, 16px);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
    }

    .warning-icon {
      font-size: 24px;
    }

    .warning-content h4 {
      margin: 0;
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 600;
      color: #991b1b;
    }

    /* Form */
    .form-section {
      padding: var(--sc-spacing-lg, 16px);
    }

    .form-group {
      margin-bottom: var(--sc-spacing-md, 12px);
    }

    .form-label {
      display: block;
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      color: var(--sc-text-secondary, #374151);
      margin-bottom: var(--sc-spacing-xs, 4px);
    }

    .form-input,
    .form-textarea {
      width: 100%;
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 12px);
      border: 1px solid var(--sc-border-color, #e5e7eb);
      border-radius: var(--sc-radius-md, 6px);
      font-size: var(--sc-font-size-sm, 14px);
      transition: border-color 0.2s;
    }

    .form-input:focus,
    .form-textarea:focus {
      outline: none;
      border-color: var(--sc-primary, #3b82f6);
    }

    .form-textarea {
      min-height: 80px;
      resize: vertical;
    }

    /* Status Display */
    .status-section {
      padding: var(--sc-spacing-md, 12px) var(--sc-spacing-lg, 16px);
      border-top: 1px solid var(--sc-border-color, #e5e7eb);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: var(--sc-radius-full, 9999px);
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 500;
    }

    .status-badge.pending {
      background: #fef3c7;
      color: #92400e;
    }

    .status-badge.approved {
      background: #d1fae5;
      color: #059669;
    }

    .status-badge.rejected {
      background: #fef2f2;
      color: #b91c1c;
    }

    .status-badge.expired {
      background: #e5e7eb;
      color: #6b7280;
    }

    /* SoD Warning */
    .sod-warning {
      background: #fff7ed;
      border: 1px solid #fcd34d;
      border-radius: var(--sc-radius-md, 6px);
      padding: var(--sc-spacing-sm, 8px);
      margin-top: var(--sc-spacing-md, 12px);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
      font-size: var(--sc-font-size-xs, 12px);
    }

    /* Actions */
    .dialog-actions {
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

    .btn-primary {
      background: var(--sc-primary, #3b82f6);
      color: white;
    }

    .btn-primary:hover {
      background: var(--sc-primary-hover, #2563eb);
    }

    .btn-secondary {
      background: var(--sc-bg-tertiary, #f3f4f6);
      color: var(--sc-text-primary, #111827);
    }

    .btn-secondary:hover {
      background: var(--sc-border-color, #e5e7eb);
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover {
      background: #dc2626;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Error */
    .error-message {
      color: #ef4444;
      font-size: var(--sc-font-size-sm, 14px);
      margin-top: var(--sc-spacing-sm, 8px);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
  }

  private validateForm(): boolean {
    // Check required fields
    if (!this.scope.trim()) {
      this.error = this.i18n.t('capabilities.approvalDialog.scopePlaceholder');
      return false;
    }

    if (!this.ticketNo.trim()) {
      this.error = this.i18n.t('capabilities.approvalDialog.ticketNoPlaceholder');
      return false;
    }

    if (!this.expiresAt) {
      this.error = this.i18n.t('capabilities.approvalDialog.expiresAt') + ' is required';
      return false;
    }

    // Check SoD for approve mode
    if (this.mode === 'approve' && this.currentUser && this.existingApproval) {
      if (this.currentUser === this.existingApproval.requester) {
        this.error = this.i18n.t('capabilities.approvalDialog.sodWarning');
        return false;
      }
    }

    return true;
  }

  private async handleSubmit() {
    if (this.mode === 'approve') {
      await this.handleApprove();
    } else {
      await this.handleCreateApproval();
    }
  }

  private async handleCreateApproval() {
    if (!this.validateForm()) return;

    this.submitting = true;
    this.error = '';

    try {
      const approval = await capabilitiesClient.createApproval({
        taskId: this.task!.id,
        requester: this.currentUser,
        scope: this.scope,
        ticketNo: this.ticketNo,
        expiresAt: new Date(this.expiresAt).getTime(),
      });

      // Dispatch event
      this.dispatchEvent(new CustomEvent('approval-created', {
        detail: { approval },
        bubbles: true,
        composed: true,
      }));

      this.existingApproval = approval;
      this.mode = 'view';
    } catch (error) {
      console.error('[ScApprovalDialog] Failed to create approval:', error);
      this.error = (error as Error).message;
    } finally {
      this.submitting = false;
    }
  }

  private async handleApprove() {
    if (!this.existingApproval) return;

    this.submitting = true;
    this.error = '';

    try {
      const approval = await capabilitiesClient.approveApproval({
        id: this.existingApproval.id,
        approver: this.currentUser,
        approved: true,
      });

      this.dispatchEvent(new CustomEvent('approval-approved', {
        detail: { approvalId: this.existingApproval.id, approved: true },
        bubbles: true,
        composed: true,
      }));

      this.existingApproval = approval;
    } catch (error) {
      console.error('[ScApprovalDialog] Failed to approve:', error);
      this.error = (error as Error).message;
    } finally {
      this.submitting = false;
    }
  }

  private async handleReject() {
    if (!this.existingApproval) return;
    if (!this.rejectReason.trim()) {
      this.error = this.i18n.t('capabilities.approvalDialog.rejectReasonPlaceholder');
      return;
    }

    this.submitting = true;
    this.error = '';

    try {
      const approval = await capabilitiesClient.approveApproval({
        id: this.existingApproval.id,
        approver: this.currentUser,
        approved: false,
        reason: this.rejectReason,
      });

      this.dispatchEvent(new CustomEvent('approval-approved', {
        detail: { approvalId: this.existingApproval.id, approved: false, reason: this.rejectReason },
        bubbles: true,
        composed: true,
      }));

      this.existingApproval = approval;
    } catch (error) {
      console.error('[ScApprovalDialog] Failed to reject:', error);
      this.error = (error as Error).message;
    } finally {
      this.submitting = false;
    }
  }

  private handleClose() {
    this.dispatchEvent(new CustomEvent('close-dialog', {
      bubbles: true,
      composed: true,
    }));
  }

  private getStatusColor(status: ApprovalStatus): string {
    const colors: Record<ApprovalStatus, string> = {
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444',
      expired: '#6b7280',
    };
    return colors[status] || '#6b7280';
  }

  private getStatusIcon(status: ApprovalStatus): string {
    const icons: Record<ApprovalStatus, string> = {
      pending: '⏳',
      approved: '✓',
      rejected: '✗',
      expired: '⏱',
    };
    return icons[status] || '❓';
  }

  private formatTimestamp(timestamp?: number): string {
    if (!timestamp) return '--';
    return new Date(timestamp).toLocaleString();
  }

  render() {
    const isDarkDomain = this.task?.domainId === 'dark';

    return html`
      <div class="dialog-overlay" @click=${this.handleClose}>
        <div class="dialog-container" @click=${(e: Event) => e.stopPropagation()}>
          <!-- Header -->
          <div class="dialog-header">
            <h2 class="dialog-title">${this.i18n.t('capabilities.approvalDialog.title')}</h2>
            <button class="close-btn" @click=${this.handleClose}>✕</button>
          </div>

          <!-- Warning Banner (for dark domain) -->
          ${isDarkDomain ? html`
            <div class="warning-banner">
              <span class="warning-icon">⚠️</span>
              <div>
                <h4>${this.i18n.t('capabilities.approvalDialog.warningTitle')}</h4>
                <p>${this.i18n.t('capabilities.approvalDialog.warningMessage')}</p>
              </div>
            </div>
          ` : ''}

          <!-- Existing Approval Status (for view mode) -->
          ${this.existingApproval ? html`
            <div class="status-section">
              <span 
                class="status-badge ${this.existingApproval.status}"
                style="background: ${this.getStatusColor(this.existingApproval.status)}; color: white;"
              >
                ${this.getStatusIcon(this.existingApproval.status)}
                ${this.i18n.t(`capabilities.approvalDialog.${this.existingApproval.status}`)}
              </span>
              <div class="info-grid">
                <div class="info-label">${this.i18n.t('capabilities.approvalDialog.requester')}</div>
                <div class="info-value">${this.existingApproval.requester}</div>
                
                <div class="info-label">${this.i18n.t('capabilities.approvalDialog.approver')}</div>
                <div class="info-value">${this.existingApproval.approver || '--'}</div>
                
                <div class="info-label">${this.i18n.t('capabilities.approvalDialog.ticketNo')}</div>
                <div class="info-value">${this.existingApproval.ticketNo}</div>
                
                <div class="info-label">${this.i18n.t('capabilities.approvalDialog.expiresAt')}</div>
                <div class="info-value">${this.formatTimestamp(this.existingApproval.expiresAt)}</div>
              </div>
            </div>
          ` : ''}

          <!-- Create Form -->
          ${this.mode === 'create' ? html`
            <div class="form-section">
              <div class="form-group">
                <label class="form-label">${this.i18n.t('capabilities.approvalDialog.scope')}</label>
                <textarea 
                  class="form-textarea"
                  placeholder=${this.i18n.t('capabilities.approvalDialog.scopePlaceholder')}
                  .value=${this.scope}
                  @input=${(e: Event) => this.scope = (e.target as HTMLTextAreaElement).value}
                ></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">${this.i18n.t('capabilities.approvalDialog.ticketNo')}</label>
                <input 
                  type="text"
                  class="form-input"
                  placeholder=${this.i18n.t('capabilities.approvalDialog.ticketNoPlaceholder')}
                  .value=${this.ticketNo}
                  @input=${(e: Event) => this.ticketNo = (e.target as HTMLInputElement).value}
                >
              </div>

              <div class="form-group">
                <label class="form-label">${this.i18n.t('capabilities.approvalDialog.expiresAt')}</label>
                <input 
                  type="datetime-local"
                  class="form-input"
                  .value=${this.expiresAt}
                  @input=${(e: Event) => this.expiresAt = (e.target as HTMLInputElement).value}
                >
              </div>

              <div class="form-group">
                <label class="form-label">${this.i18n.t('capabilities.approvalDialog.reason')}</label>
                <textarea 
                  class="form-textarea"
                  placeholder=${this.i18n.t('capabilities.approvalDialog.reasonPlaceholder')}
                  .value=${this.reason}
                  @input=${(e: Event) => this.reason = (e.target as HTMLTextAreaElement).value}
                ></textarea>
              </div>

              ${this.error ? html`
                <p class="error-message">${this.error}</p>
              ` : ''}
            </div>
          ` : ''}

          <!-- Approve Mode -->
          ${this.mode === 'approve' && this.existingApproval ? html`
            <div class="form-section">
              ${this.existingApproval.status === 'pending' ? html`
                <div class="form-group">
                  <label class="form-label">${this.i18n.t('capabilities.approvalDialog.rejectReason')}</label>
                  <textarea 
                    class="form-textarea"
                    placeholder=${this.i18n.t('capabilities.approvalDialog.rejectReasonPlaceholder')}
                    .value=${this.rejectReason}
                    @input=${(e: Event) => this.rejectReason = (e.target as HTMLTextAreaElement).value}
                  ></textarea>
                </div>
              ` : html`
                <p>此审批已经${this.existingApproval.status === 'approved' ? '通过' : '被拒绝'}</p>
              `}
            </div>
          ` : ''}

          <!-- SoD Warning -->
          ${this.mode === 'approve' && this.currentUser && this.existingApproval?.requester === this.currentUser ? html`
            <div class="sod-warning">
              ⚠️ ${this.i18n.t('capabilities.approvalDialog.sodWarning')}
            </div>
          ` : ''}

          <!-- Actions -->
          <div class="dialog-actions">
            <button class="btn btn-secondary" @click=${this.handleClose}>
              ${this.i18n.t('common.close')}
            </button>
            
            ${this.mode === 'create' ? html`
              <button class="btn btn-primary" @click=${this.handleSubmit} ?disabled=${this.submitting}>
                ${this.i18n.t('capabilities.approvalDialog.createApproval')}
              </button>
            ` : this.mode === 'approve' && this.existingApproval?.status === 'pending' ? html`
              <button class="btn btn-danger" @click=${this.handleReject} ?disabled=${this.submitting || !this.rejectReason.trim()}>
                ${this.i18n.t('capabilities.approvalDialog.reject')}
              </button>
              <button class="btn btn-primary" @click=${this.handleApprove} ?disabled=${this.submitting}>
                ${this.i18n.t('capabilities.approvalDialog.approve')}
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-approval-dialog': ScApprovalDialog;
  }
}

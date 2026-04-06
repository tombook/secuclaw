import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { gatewayClient } from '../gateway-client.js';

@customElement('sc-approval-page')
export class ScApprovalPage extends LitElement {
  @state() private approvals: any[] = [];
  @state() private loading = false;
  @state() private filterStatus = '';
  @state() private selectedApproval: any = null;

  static styles = css`
    :host { display: block; min-height: 100vh; background: var(--sc-bg-primary, #0f172a); color: var(--sc-text-primary, #f8fafc); font-family: system-ui, -apple-system, sans-serif; }
    .container { max-width: 1600px; margin: 0 auto; padding: 24px; }
    .hero { display: flex; gap: 24px; align-items: flex-start; padding: 32px; background: linear-gradient(135deg, var(--sc-bg-card, #1e293b) 0%, rgba(239, 68, 68, 0.1) 100%); border: 1px solid var(--sc-border-color, #334155); border-radius: 16px; margin-bottom: 32px; }
    .hero-icon { width: 72px; height: 72px; background: linear-gradient(135deg, #EF4444, #DC2626); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 36px; flex-shrink: 0; }
    .hero-title { font-size: 28px; font-weight: 700; margin: 0 0 8px; }
    .hero-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(239, 68, 68, 0.15); color: #EF4444; border-radius: 20px; font-size: 12px; font-weight: 500; margin-bottom: 12px; }
    .hero-desc { font-size: 15px; line-height: 1.6; color: var(--sc-text-secondary, #cbd5e1); margin: 0; max-width: 600px; }
    .filters { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; align-items: center; }
    .filter-select { padding: 10px 14px; background: var(--sc-bg-card, #1e293b); border: 1px solid var(--sc-border-color, #334155); border-radius: 8px; color: var(--sc-text-primary, #f8fafc); font-size: 14px; }
    .filter-select:focus { outline: none; border-color: #EF4444; }
    .btn { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all 200ms ease; }
    .btn-primary { background: linear-gradient(135deg, #EF4444, #DC2626); color: white; }
    .btn-success { background: linear-gradient(135deg, #10B981, #059669); color: white; }
    .btn-danger { background: linear-gradient(135deg, #F59E0B, #D97706); color: white; }
    .btn-secondary { background: var(--sc-bg-tertiary, #334155); color: var(--sc-text-primary, #f8fafc); border: 1px solid var(--sc-border-color, #334155); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 16px; }
    .card { background: var(--sc-bg-card, #1e293b); border: 1px solid var(--sc-border-color, #334155); border-radius: 12px; padding: 24px; transition: all 200ms ease; }
    .card:hover { border-color: #EF4444; transform: translateY(-2px); }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .card-title { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
    .card-id { font-size: 11px; color: var(--sc-text-tertiary, #94a3b8); font-family: monospace; }
    .status { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .status-pending { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
    .status-approved { background: rgba(16, 185, 129, 0.15); color: #10B981; }
    .status-rejected { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
    .status-expired { background: rgba(107, 114, 128, 0.15); color: #6B7280; }
    .card-body { font-size: 13px; color: var(--sc-text-secondary, #cbd5e1); line-height: 1.6; margin-bottom: 16px; }
    .card-meta { display: flex; gap: 16px; font-size: 12px; color: var(--sc-text-tertiary, #94a3b8); margin-bottom: 16px; }
    .card-actions { display: flex; gap: 8px; }
    .detail-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .detail-panel { background: var(--sc-bg-card, #1e293b); border: 1px solid var(--sc-border-color, #334155); border-radius: 16px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; }
    .detail-header { padding: 24px; border-bottom: 1px solid var(--sc-border-color, #334155); display: flex; justify-content: space-between; align-items: center; }
    .detail-title { font-size: 20px; font-weight: 700; }
    .detail-close { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--sc-text-tertiary, #94a3b8); }
    .detail-close:hover { color: var(--sc-text-primary, #f8fafc); }
    .detail-body { padding: 24px; }
    .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--sc-border-color, #334155); }
    .detail-label { font-size: 13px; color: var(--sc-text-tertiary, #94a3b8); }
    .detail-value { font-size: 14px; font-weight: 500; }
    .detail-actions { padding: 24px; border-top: 1px solid var(--sc-border-color, #334155); display: flex; gap: 12px; justify-content: flex-end; }
    .empty { text-align: center; padding: 48px; color: var(--sc-text-tertiary, #94a3b8); }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadApprovals();
  }

  private async loadApprovals() {
    this.loading = true;
    try {
      const res = await gatewayClient.request('approval.list', {
        status: this.filterStatus || undefined,
        limit: 50
      });
      const d = res as Record<string, unknown>;
      this.approvals = Array.isArray(d?.data) ? [...d.data as unknown as any[]] : Array.isArray(d) ? [...d as unknown as any[]] : [];
    } catch (e) {
      console.error('[approval-page] Load failed:', e);
      this.approvals = [];
    }
    this.loading = false;
  }

  // Compatibility alias used by other components
  private async loadData() {
    return this.loadApprovals();
  }

  private async createApproval() {
    const taskId = prompt('关联任务ID:');
    if (!taskId) return;
    const type = prompt('审批类型:', 'task_approval') || 'task_approval';
    const reason = prompt('申请原因:') || '';
    try {
      await gatewayClient.request('approval.create', { taskId, type, reason });
      this.loadData();
    } catch (e) { console.error('[approval] Create failed:', e); }
  }

  private async _viewApprovalDetail(id: string) {
    try {
      const res = await gatewayClient.request('approval.get', { id });
      this.selectedApproval = (res as any)?.data ?? res;
    } catch (e) { console.error('[approval] Get failed:', e); }
  }

  // Old name kept for compatibility; implement new name as requested
  private async _viewByTaskId() {
    const taskId = prompt('任务ID:');
    if (!taskId) return;
    try {
      const res = await gatewayClient.request('approval.getByTaskId', { taskId });
      this.selectedApproval = (res as any)?.data ?? res;
    } catch (e) { console.error('[approval] GetByTaskId failed:', e); }
  }

  private async getApprovalDetail(id: string) {
    try {
      const res = await gatewayClient.request('approval.get', { id });
      this.selectedApproval = (res as any)?.data ?? res;
    } catch (e) { console.error('[approval-page] Get detail failed:', e); }
  }

  private async getApprovalByTaskId(taskId: string) {
    try {
      const res = await gatewayClient.request('approval.getByTaskId', { taskId });
      const d = res as Record<string, unknown>;
      this.approvals = Array.isArray(d?.data) ? [...d.data as unknown as any[]] : Array.isArray(d) ? [...d as unknown as any[]] : this.approvals;
    } catch (e) { console.error('[approval-page] GetByTaskId failed:', e); }
  }

  private async handleApprove(approvalId: string) {
    try {
      await gatewayClient.request('approval.approve', { approvalId, approver: 'current-user' });
      this.approvals = this.approvals.map((a: any) =>
        (a.id || a.approvalId) === approvalId ? { ...a, status: 'approved' } : a
      );
      if (this.selectedApproval?.id === approvalId || this.selectedApproval?.approvalId === approvalId) {
        this.selectedApproval = { ...this.selectedApproval, status: 'approved' };
      }
    } catch (e) {
      console.error('[approval-page] Approve failed:', e);
    }
  }

  private async handleReject(approvalId: string) {
    const reason = prompt('拒绝原因:');
    if (!reason) return;
    try {
      await gatewayClient.request('approval.reject', { approvalId, approver: 'current-user', reason });
      this.approvals = this.approvals.map((a: any) =>
        (a.id || a.approvalId) === approvalId ? { ...a, status: 'rejected' } : a
      );
      if (this.selectedApproval?.id === approvalId || this.selectedApproval?.approvalId === approvalId) {
        this.selectedApproval = { ...this.selectedApproval, status: 'rejected' };
      }
    } catch (e) {
      console.error('[approval-page] Reject failed:', e);
    }
  }

  private formatTime(ts: number | string) {
    if (!ts) return '-';
    const d = new Date(typeof ts === 'string' ? parseInt(ts) : ts);
    return isNaN(d.getTime()) ? String(ts) : d.toLocaleString('zh-CN');
  }

  render() {
    if (this.selectedApproval) return this.renderDetail();
    const pending = this.approvals.filter((a: any) => a.status === 'pending').length;

    return html`
      <div class="container">
        <div class="hero">
          <div class="hero-icon">🔐</div>
          <div>
            <h1 class="hero-title">审批管理</h1>
            <span class="hero-badge">🌑 黑暗面审批</span>
            <p class="hero-desc">管理黑暗面操作的审批流程。所有高危操作（渗透测试、攻击模拟等）需要经过审批后方可执行。</p>
          </div>
        </div>

         <div class="filters">
           <select class="filter-select" @change=${(e: Event) => { this.filterStatus = (e.target as HTMLSelectElement).value; this.loadApprovals(); }}>
             <option value="">全部状态</option>
             <option value="pending" ?selected=${this.filterStatus === 'pending'}>待审批 (${pending})</option>
             <option value="approved" ?selected=${this.filterStatus === 'approved'}>已批准</option>
             <option value="rejected" ?selected=${this.filterStatus === 'rejected'}>已拒绝</option>
             <option value="expired" ?selected=${this.filterStatus === 'expired'}>已过期</option>
           </select>
           <button class="btn btn-primary" style="padding:6px 12px;font-size:12px;margin-left:8px;" @click=${this.createApproval}>+ 新建审批</button>
           <button class="btn btn-secondary" style="padding:6px 12px;font-size:12px;" @click=${() => { const tid = prompt('按任务ID查询:'); if (tid) this.getApprovalByTaskId(tid); }}>🔍 按任务查询</button>
           <span style="font-size:14px;color:var(--sc-text-tertiary, #94a3b8);margin-left:8px;">共 ${this.approvals.length} 条审批</span>
         </div>

        ${this.loading ? html`<div class="empty">加载中...</div>` : this.approvals.length === 0 ? html`<div class="empty">暂无审批记录</div>` : html`
          <div class="grid">
            ${this.approvals.map((a: any) => {
              const id = a.id || a.approvalId || '-';
              const statusCls = `status-${a.status || 'pending'}`;
              const statusText: string = ({ pending: '待审批', approved: '已批准', rejected: '已拒绝', expired: '已过期' } as Record<string, string>)[a.status as string] || a.status || '未知';
              return html`
                <div class="card" @click=${() => { this.selectedApproval = a; this.getApprovalDetail(a.id || a.approvalId || ''); }}>
                  <div class="card-header">
                    <div>
                      <div class="card-title">${a.scope || a.ticketNo || '审批请求'}</div>
                      <div class="card-id">${id}</div>
                    </div>
                    <span class="status ${statusCls}">${statusText}</span>
                  </div>
                  <div class="card-body">
                    ${a.reason || a.description || '任务执行审批'}
                  </div>
                  <div class="card-meta">
                    <span>👤 ${a.requester || '-'}</span>
                    <span>📋 任务: ${a.taskId || '-'}</span>
                    <span>🕐 ${this.formatTime(a.createdAt || a.created_at)}</span>
                  </div>
                  ${a.status === 'pending' ? html`
                    <div class="card-actions" @click=${(e: Event) => e.stopPropagation()}>
                      <button class="btn btn-success" @click=${() => this.handleApprove(id)}>✓ 批准</button>
                      <button class="btn btn-danger" @click=${() => this.handleReject(id)}>✗ 拒绝</button>
                    </div>
                  ` : ''}
                </div>
              `;
            })}
          </div>
        `}
      </div>
    `;
  }

  private renderDetail() {
    const a = this.selectedApproval;
    const id = a.id || a.approvalId || '-';
    return html`
      <div class="detail-overlay" @click=${(e: Event) => e.target === e.currentTarget && (this.selectedApproval = null)}>
        <div class="detail-panel">
          <div class="detail-header">
            <span class="detail-title">审批详情</span>
            <button class="detail-close" @click=${() => { this.selectedApproval = null; }}>×</button>
          </div>
          <div class="detail-body">
            <div class="detail-row"><span class="detail-label">审批ID</span><span class="detail-value" style="font-family:monospace;">${id}</span></div>
            <div class="detail-row"><span class="detail-label">状态</span><span class="status status-${a.status || 'pending'}">${({ pending: '待审批', approved: '已批准', rejected: '已拒绝', expired: '已过期' } as Record<string, string>)[a.status as string] || a.status || '未知'}</span></div>
            <div class="detail-row"><span class="detail-label">任务ID</span><span class="detail-value">${a.taskId || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">申请人</span><span class="detail-value">${a.requester || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">审批角色</span><span class="detail-value">${a.approverRole || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">审批人</span><span class="detail-value">${a.approver || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">操作范围</span><span class="detail-value">${a.scope || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">工单号</span><span class="detail-value">${a.ticketNo || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">创建时间</span><span class="detail-value">${this.formatTime(a.createdAt || a.created_at)}</span></div>
            ${a.expiresAt ? html`<div class="detail-row"><span class="detail-label">过期时间</span><span class="detail-value">${this.formatTime(a.expiresAt)}</span></div>` : ''}
            ${a.approvedAt ? html`<div class="detail-row"><span class="detail-label">审批时间</span><span class="detail-value">${this.formatTime(a.approvedAt)}</span></div>` : ''}
            ${a.reason ? html`<div class="detail-row"><span class="detail-label">原因</span><span class="detail-value">${a.reason}</span></div>` : ''}
          </div>
          ${a.status === 'pending' ? html`
            <div class="detail-actions">
              <button class="btn btn-secondary" @click=${() => { this.selectedApproval = null; }}>关闭</button>
              <button class="btn btn-danger" @click=${() => { this.handleReject(id); }}>✗ 拒绝</button>
              <button class="btn btn-success" @click=${() => { this.handleApprove(id); }}>✓ 批准执行</button>
            </div>
          ` : html`
            <div class="detail-actions">
              <button class="btn btn-secondary" @click=${() => { this.selectedApproval = null; }}>关闭</button>
            </div>
          `}
        </div>
      </div>
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'sc-approval-page': ScApprovalPage; } }

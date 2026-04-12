import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { gatewayClient } from '../gateway-client.js';
import { roleContext } from '../store/role-context.js';
import '../components/design-system/sc-button.js';
import '../components/design-system/sc-card.js';
import '../components/design-system/sc-badge.js';
import '../components/sc-smart-recommendation-bar.js';

@customElement('sc-audit-page')
export class ScAuditPage extends LitElement {
  @state() private logs: any[] = [];
  @state() private stats: any = null;
  @state() private loading = false;
  @state() private filterAction = '';
  @state() private filterResource = '';
  @state() private page = 1;
  @state() private pageSize = 20;

  static styles = css`
    :host { display: block; min-height: 100vh; background: var(--sc-bg-primary, #0f172a); color: var(--sc-text-primary, #f8fafc); font-family: system-ui, -apple-system, sans-serif; }
    .container { max-width: 1600px; margin: 0 auto; padding: 24px; }
    .hero { display: flex; gap: 24px; align-items: flex-start; padding: 32px; background: linear-gradient(135deg, var(--sc-bg-card, #1e293b) 0%, rgba(245, 158, 11, 0.1) 100%); border: 1px solid var(--sc-border-color, #334155); border-radius: 16px; margin-bottom: 32px; }
    .hero-icon { width: 72px; height: 72px; background: linear-gradient(135deg, #F59E0B, #D97706); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 36px; flex-shrink: 0; }
    .hero-title { font-size: 28px; font-weight: 700; margin: 0 0 8px; }
    .hero-desc { font-size: 15px; line-height: 1.6; color: var(--sc-text-secondary, #cbd5e1); margin: 0; max-width: 600px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: var(--sc-bg-card, #1e293b); border: 1px solid var(--sc-border-color, #334155); border-radius: 12px; padding: 20px; }
    .stat-value { font-size: 28px; font-weight: 700; color: #F59E0B; }
    .stat-label { font-size: 13px; color: var(--sc-text-secondary, #cbd5e1); margin-top: 4px; }
    .filters { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .filter-input, .filter-select { padding: 10px 14px; background: var(--sc-bg-card, #1e293b); border: 1px solid var(--sc-border-color, #334155); border-radius: 8px; color: var(--sc-text-primary, #f8fafc); font-size: 14px; }
    .filter-input:focus, .filter-select:focus { outline: none; border-color: #F59E0B; }
    .btn { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all 200ms ease; }
    .btn-primary { background: linear-gradient(135deg, #F59E0B, #D97706); color: white; }
    .btn-secondary { background: var(--sc-bg-tertiary, #334155); color: var(--sc-text-primary, #f8fafc); border: 1px solid var(--sc-border-color, #334155); }
    .table-container { background: var(--sc-bg-card, #1e293b); border: 1px solid var(--sc-border-color, #334155); border-radius: 16px; overflow: hidden; }
    .table-header { padding: 16px 24px; background: var(--sc-bg-secondary, #1e293b); border-bottom: 1px solid var(--sc-border-color, #334155); font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 600; color: var(--sc-text-tertiary, #94a3b8); background: var(--sc-bg-tertiary, #334155); text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
    td { padding: 14px 16px; font-size: 13px; border-bottom: 1px solid var(--sc-border-color, #334155); }
    tr:hover td { background: var(--sc-bg-hover, #475569); }
    .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
    .badge-create { background: rgba(16, 185, 129, 0.15); color: #10B981; }
    .badge-update { background: rgba(59, 130, 246, 0.15); color: #3B82F6; }
    .badge-delete { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
    .badge-configure { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
    .badge-other { background: rgba(139, 92, 246, 0.15); color: #8B5CF6; }
    .pagination { display: flex; justify-content: center; gap: 8px; margin-top: 24px; }
    .page-btn { padding: 8px 14px; border-radius: 8px; background: var(--sc-bg-card, #1e293b); border: 1px solid var(--sc-border-color, #334155); color: var(--sc-text-secondary, #cbd5e1); cursor: pointer; font-size: 13px; }
    .page-btn.active { background: rgba(245, 158, 11, 0.15); border-color: #F59E0B; color: #F59E0B; }
    .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .empty { text-align: center; padding: 48px; color: var(--sc-text-tertiary, #94a3b8); }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
  }

  private async loadData() {
    this.loading = true;
    try {
      const [queryRes, statsRes] = await Promise.allSettled([
        gatewayClient.request('audit.query', {
          action: this.filterAction || undefined,
          resource: this.filterResource || undefined,
          page: this.page,
          pageSize: this.pageSize,
        }),
        gatewayClient.request('audit.stats', {}),
      ]);
      if (queryRes.status === 'fulfilled') {
        const d = queryRes.value as Record<string, unknown>;
        this.logs = Array.isArray(d?.logs) ? [...d.logs as unknown as any[]] : Array.isArray(d) ? [...d as unknown as any[]] : [];
      }
      if (statsRes.status === 'fulfilled') {
        this.stats = statsRes.value;
      }
    } catch (e) {
      console.error('[audit-page] Load failed:', e);
    }
    this.loading = false;
  }

  private async getByResource(resourceType: string, resourceId: string) {
    try {
      const res = await gatewayClient.request('audit.getByResource', { resourceType, resourceId });
      const d = res as Record<string, unknown>;
      this.logs = Array.isArray(d?.data) ? [...d.data as unknown as any[]] : Array.isArray(d) ? [...d as unknown as any[]] : [];
    } catch (e) { console.error('[audit-page] getByResource failed:', e); }
  }

  private async getResourceHistory(resourceType: string, resourceId: string) {
    try {
      const res = await gatewayClient.request('audit.getResourceHistory', { resourceType, resourceId });
      return (res as any)?.data ?? res;
    } catch (e) { console.error('[audit-page] getResourceHistory failed:', e); return null; }
  }

  private async logAudit(action: string, resource: string, details: string) {
    try {
      await gatewayClient.request('audit.log', { action, resource, details });
    } catch (e) { console.error('[audit-page] Log failed:', e); }
  }

  private getActionBadge(action: string) {
    const cls = action === 'create' ? 'create' : action === 'update' ? 'update' : action === 'delete' ? 'delete' : action === 'configure' ? 'configure' : 'other';
    return html`<span class="badge badge-${cls}">${action}</span>`;
  }

  private formatTime(ts: number | string) {
    if (!ts) return '-';
    const d = new Date(typeof ts === 'string' ? parseInt(ts) : ts);
    return isNaN(d.getTime()) ? String(ts) : d.toLocaleString('zh-CN');
  }

  render() {
    return html`
      <sc-smart-recommendation-bar></sc-smart-recommendation-bar>
      <div class="container">
        <div class="hero">
          <div class="hero-icon">📋</div>
          <div>
            <h1 class="hero-title">审计日志</h1>
            <p class="hero-desc">记录系统中所有关键操作的完整审计轨迹，支持按操作类型、资源类型筛选查询。</p>
          </div>
        </div>

        ${this.stats ? html`
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${this.stats.totalLogs || this.stats.total || this.logs.length}</div>
              <div class="stat-label">总日志数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${this.stats.todayLogs || this.stats.today || '-'}</div>
              <div class="stat-label">今日操作</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${this.stats.uniqueActors || this.stats.actors || '-'}</div>
              <div class="stat-label">操作者</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${this.stats.uniqueResources || this.stats.resources || '-'}</div>
              <div class="stat-label">涉及资源</div>
            </div>
          </div>
        ` : ''}

        <div class="filters">
          <select class="filter-select" @change=${(e: Event) => { this.filterAction = (e.target as HTMLSelectElement).value; this.page = 1; this.loadData(); }}>
            <option value="">全部操作</option>
            <option value="create" ?selected=${this.filterAction === 'create'}>创建</option>
            <option value="update" ?selected=${this.filterAction === 'update'}>更新</option>
            <option value="delete" ?selected=${this.filterAction === 'delete'}>删除</option>
            <option value="configure" ?selected=${this.filterAction === 'configure'}>配置</option>
            <option value="login" ?selected=${this.filterAction === 'login'}>登录</option>
            <option value="execute" ?selected=${this.filterAction === 'execute'}>执行</option>
          </select>
          <input class="filter-input" type="text" placeholder="资源类型 (incident/vulnerability/asset...)" .value=${this.filterResource} @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && (this.page = 1, this.loadData())} />
          <sc-button size="sm" variant="primary" @click=${() => { this.page = 1; this.loadData(); }}>🔍 查询</sc-button>
          <sc-button size="sm" variant="secondary" @click=${() => { this.filterAction = ''; this.filterResource = ''; this.page = 1; this.loadData(); }}>重置</sc-button>
          <sc-button size="sm" variant="secondary" @click=${() => { const rt = prompt('资源类型 (incident/asset/role):'); const ri = prompt('资源ID:'); if (rt && ri) this.getByResource(rt, ri); }}>📦 资源查询</sc-button>
          <sc-button size="sm" variant="secondary" @click=${() => { const rt = prompt('资源类型:'); const ri = prompt('资源ID:'); if (rt && ri) this.getResourceHistory(rt, ri).then(h => { if (h) alert(JSON.stringify(h, null, 2)); }); }}>📜 资源历史</sc-button>
          <sc-button size="sm" variant="secondary" @click=${() => { const a = prompt('操作:'); const r = prompt('资源:'); const d = prompt('详情:'); if (a && r) this.logAudit(a, r, d || ''); }}>📝 记录审计</sc-button>
        </div>

        <div class="table-container">
          <div class="table-header">
            <span>📋 审计记录</span>
            <span style="font-size:13px;color:var(--sc-text-tertiary, #94a3b8);">第 ${this.page} 页</span>
          </div>
          ${this.loading ? html`<div class="empty">加载中...</div>` : this.logs.length === 0 ? html`<div class="empty">暂无审计记录</div>` : html`
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>操作</th>
                  <th>资源</th>
                  <th>资源ID</th>
                  <th>操作者</th>
                  <th>详情</th>
                </tr>
              </thead>
              <tbody>
                ${this.logs.map((log: any) => html`
                  <tr>
                    <td style="white-space:nowrap;">${this.formatTime(log.timestamp || log.createdAt || log.created_at)}</td>
                    <td>${this.getActionBadge(log.action)}</td>
                    <td>${log.resource || '-'}</td>
                    <td style="font-family:monospace;font-size:12px;">${log.resourceId || log.resource_id || '-'}</td>
                    <td>${log.actor || '-'}</td>
                    <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title=${JSON.stringify(log.details || log.newValue || '')}>${log.details ? (typeof log.details === 'string' ? log.details : JSON.stringify(log.details).slice(0, 80)) : '-'}</td>
                  </tr>
                `)}
              </tbody>
            </table>
          `}
        </div>

        <div class="pagination">
          <button class="page-btn" ?disabled=${this.page <= 1} @click=${() => { this.page--; this.loadData(); }}>← 上一页</button>
          <button class="page-btn active">第 ${this.page} 页</button>
          <button class="page-btn" ?disabled=${this.logs.length < this.pageSize} @click=${() => { this.page++; this.loadData(); }}>下一页 →</button>
        </div>
      </div>
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'sc-audit-page': ScAuditPage; } }

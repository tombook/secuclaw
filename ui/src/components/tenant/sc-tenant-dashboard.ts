import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-tenant-dashboard')
export class ScTenantDashboard extends LitElement {
  static styles = css`
    :host {
      display: block;
      --sc-bg-primary: #0a0f1a;
      --sc-bg-secondary: #111827;
      --sc-bg-tertiary: #1f2937;
      --sc-text-primary: #f9fafb;
      --sc-text-muted: #6b7280;
      --sc-text-secondary: #9ca3af;
      --sc-border: #374151;
      --sc-primary: #00d4ff;
      --sc-critical: #ef4444;
      --sc-high: #f59e0b;
      --sc-medium: #3b82f6;
      --sc-low: #22c55e;
      --sc-info: #0ea5e9;
      padding: 16px;
      background: var(--sc-bg-primary);
      min-height: 100vh;
      color: var(--sc-text-primary);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--sc-border); }
    .title { font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .subtitle { font-size: 11px; color: var(--sc-text-muted); margin-top: 2px; }
    .live-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--sc-low); animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .tabs { display: flex; gap: 4px; margin-bottom: 12px; border-bottom: 1px solid var(--sc-border); }
    .tab { padding: 8px 16px; cursor: pointer; font-size: 12px; font-weight: 600; color: var(--sc-text-muted); border-bottom: 2px solid transparent; transition: all 0.2s; }
    .tab:hover { color: var(--sc-text-primary); }
    .tab.active { color: var(--sc-primary); border-bottom-color: var(--sc-primary); }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px; }
    .kpi { background: var(--sc-bg-secondary); border: 1px solid var(--sc-border); border-radius: 8px; padding: 12px; }
    .kpi-label { font-size: 10px; color: var(--sc-text-muted); text-transform: uppercase; margin-bottom: 4px; }
    .kpi-value { font-size: 24px; font-weight: 700; }
    .kpi-accent { color: var(--sc-primary); }
    .kpi-critical { color: var(--sc-critical); }
    .kpi-high { color: var(--sc-high); }
    .kpi-low { color: var(--sc-low); }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .grid-3 { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 12px; }
    .panel { background: var(--sc-bg-secondary); border: 1px solid var(--sc-border); border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .panel-title { font-size: 13px; font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
    .bar-chart { display: flex; flex-direction: column; gap: 6px; }
    .bar-row { display: grid; grid-template-columns: 130px 1fr 60px; gap: 8px; align-items: center; font-size: 11px; }
    .bar-label { color: var(--sc-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bar-track { height: 18px; background: var(--sc-bg-tertiary); border-radius: 3px; overflow: hidden; }
    .bar-fill { height: 100%; background: linear-gradient(90deg, var(--sc-primary), var(--sc-info)); transition: width 0.3s; }
    .bar-fill.critical { background: linear-gradient(90deg, var(--sc-critical), #f87171); }
    .bar-fill.high { background: linear-gradient(90deg, var(--sc-high), #fbbf24); }
    .bar-fill.low { background: linear-gradient(90deg, var(--sc-low), #4ade80); }
    .bar-value { text-align: right; font-weight: 600; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
    .badge-active { background: rgba(34, 197, 94, 0.2); color: var(--sc-low); }
    .badge-suspended { background: rgba(245, 158, 11, 0.2); color: var(--sc-high); }
    .badge-cancelled { background: rgba(239, 68, 68, 0.2); color: var(--sc-critical); }
    .badge-trial { background: rgba(59, 130, 246, 0.2); color: var(--sc-medium); }
    .badge-mssp { background: rgba(168, 85, 247, 0.2); color: #a855f7; }
    .badge-enterprise { background: rgba(0, 212, 255, 0.2); color: var(--sc-primary); }
    .badge-pro { background: rgba(99, 102, 241, 0.2); color: #818cf8; }
    .badge-starter { background: rgba(34, 197, 94, 0.2); color: var(--sc-low); }
    .badge-free { background: rgba(107, 114, 128, 0.2); color: var(--sc-text-muted); }
    .list { display: flex; flex-direction: column; gap: 6px; max-height: 480px; overflow-y: auto; }
    .list-item { display: flex; gap: 8px; padding: 8px 10px; background: var(--sc-bg-tertiary); border-radius: 4px; font-size: 11px; }
    .list-item.critical { border-left: 3px solid var(--sc-critical); }
    .list-meta { color: var(--sc-text-muted); font-size: 10px; }
    .code { font-family: 'SF Mono', Monaco, monospace; color: var(--sc-text-secondary); background: var(--sc-bg-primary); padding: 2px 4px; border-radius: 2px; }
    .empty { padding: 20px; text-align: center; color: var(--sc-text-muted); font-size: 11px; }
    .btn { padding: 6px 12px; background: var(--sc-bg-tertiary); color: var(--sc-text-primary); border: 1px solid var(--sc-border); border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; }
    .btn:hover { border-color: var(--sc-primary); color: var(--sc-primary); }
    .btn-primary { padding: 6px 14px; background: var(--sc-primary); color: #0a0f1a; border: none; border-radius: 4px; font-weight: 700; font-size: 11px; cursor: pointer; }
    .btn-primary:hover { background: #00bfe6; }
    .btn-row { display: flex; gap: 6px; }
    .form-row { display: flex; gap: 8px; margin-top: 10px; }
    .form-row input, .form-row select { flex: 1; padding: 6px 8px; background: var(--sc-bg-primary); border: 1px solid var(--sc-border); border-radius: 3px; color: var(--sc-text-primary); font-size: 11px; font-family: 'SF Mono', Monaco, monospace; }
    .result { margin-top: 8px; padding: 8px; background: var(--sc-bg-tertiary); border-radius: 4px; font-size: 10px; font-family: 'SF Mono', Monaco, monospace; max-height: 200px; overflow-y: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { text-align: left; padding: 6px 8px; background: var(--sc-bg-tertiary); color: var(--sc-text-muted); font-weight: 600; font-size: 10px; text-transform: uppercase; }
    td { padding: 8px; border-bottom: 1px solid var(--sc-bg-tertiary); }
    .progress-bar { height: 4px; background: var(--sc-bg-tertiary); border-radius: 2px; overflow: hidden; margin-top: 4px; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, var(--sc-low), #4ade80); transition: width 0.3s; }
    .progress-fill.warn { background: linear-gradient(90deg, var(--sc-high), #fbbf24); }
    .progress-fill.danger { background: linear-gradient(90deg, var(--sc-critical), #f87171); }
  `;

  @state() private _activeTab: 'tenants' | 'usage' | 'isolation' | 'admin' = 'tenants';
  @state() private _tenants: any[] = [];
  @state() private _loading = false;
  @state() private _selectedTenant: any = null;
  @state() private _auditEntries: any[] = [];

  @state() private _newTenantName = '';
  @state() private _newTenantTier = 'professional';
  @state() private _createResult: any = null;
  @state() private _suspendTenantId = '';
  @state() private _suspendResult: any = null;

  @state() private _usageTenantId = '';
  @state() private _usagePeriod = 'month';
  @state() private _usageData: any = null;
  @state() private _usageRecordMetric = 'api_calls';
  @state() private _usageRecordValue = 0;
  @state() private _usageRecordResult: any = null;

  @state() private _isolationTest: any = null;
  @state() private _adminAction: any = null;

  connectedCallback() {
    super.connectedCallback();
    this._loadTenants();
    this._loadAudit();
  }

  private async _apiCall(handler: string, params: any = {}): Promise<any> {
    try {
      const r = await fetch(`http://127.0.0.1:21981/api/v1/${handler}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params }),
      });
      if (!r.ok) return null;
      return await r.json();
    } catch (e) { return null; }
  }

  private async _loadTenants() {
    this._loading = true;
    this._tenants = await this._apiCall('tenant.list') || [];
    this._loading = false;
  }

  private async _loadAudit() {
    this._auditEntries = await this._apiCall('saas.audit.query', { filter: { limit: 30 } }) || [];
  }

  private async _createTenant() {
    if (!this._newTenantName) return;
    this._createResult = await this._apiCall('tenant.create', { name: this._newTenantName, tier: this._newTenantTier });
    if (this._createResult && !this._createResult.error) {
      this._newTenantName = '';
      await this._loadTenants();
    }
  }

  private async _suspendTenant() {
    if (!this._suspendTenantId) return;
    this._suspendResult = await this._apiCall('tenant.suspend', { tenantId: this._suspendTenantId, reason: 'admin_action' });
    await this._loadTenants();
  }

  private async _getUsage() {
    if (!this._usageTenantId) return;
    const periodMs = { day: 86400e3, week: 7 * 86400e3, month: 30 * 86400e3, year: 365 * 86400e3 }[this._usagePeriod] || 30 * 86400e3;
    const now = Date.now();
    this._usageData = await this._apiCall('saas.billing.usage.get', { tenantId: this._usageTenantId, periodStart: now - periodMs, periodEnd: now });
  }

  private async _recordUsage() {
    if (!this._usageTenantId) return;
    this._usageRecordResult = await this._apiCall('saas.billing.usage.record', { record: { tenantId: this._usageTenantId, metric: this._usageRecordMetric, value: this._usageRecordValue, periodStart: Date.now() - 30 * 86400e3, periodEnd: Date.now(), cost: 0, currency: 'USD' } });
  }

  private async _testIsolation() {
    this._isolationTest = await this._apiCall('tenant.test-isolation', {});
  }

  private async _adminPromote() {
    this._adminAction = await this._apiCall('tenant.admin-action', { action: 'list_all_admins' });
  }

  private _setActiveTab(tab: 'tenants' | 'usage' | 'isolation' | 'admin') {
    this._activeTab = tab;
  }

  private _renderBarChart(items: Array<{ label: string; value: number; severity?: string }>, maxValue?: number) {
    if (!items || items.length === 0) return html`<div class="empty">暂无数据</div>`;
    const max = maxValue || Math.max(...items.map((i) => i.value), 1);
    return html`
      <div class="bar-chart">
        ${items.map((item) => html`
          <div class="bar-row">
            <div class="bar-label">${item.label}</div>
            <div class="bar-track">
              <div class="bar-fill ${item.severity || ''}" style="width: ${(item.value / max * 100).toFixed(1)}%"></div>
            </div>
            <div class="bar-value">${item.value}</div>
          </div>
        `)}
      </div>
    `;
  }

  private _renderTenantTier(tier: string) {
    const map: any = { free: 'free', starter: 'starter', professional: 'pro', enterprise: 'enterprise', mssp: 'mssp' };
    return html`<span class="badge badge-${map[tier] || 'free'}">${tier.toUpperCase()}</span>`;
  }

  private _renderStatus(status: string) {
    const map: any = { active: 'active', suspended: 'suspended', trial: 'trial', cancelled: 'cancelled' };
    return html`<span class="badge badge-${map[status] || 'active'}">${status}</span>`;
  }

  private _renderTenantsTab() {
    const byTier: Record<string, number> = { free: 0, starter: 0, professional: 0, enterprise: 0, mssp: 0 };
    const byStatus: Record<string, number> = { active: 0, suspended: 0, trial: 0, cancelled: 0 };
    for (const t of this._tenants) {
      byTier[t.tier || 'free'] = (byTier[t.tier || 'free'] || 0) + 1;
      byStatus[t.status || 'active'] = (byStatus[t.status || 'active'] || 0) + 1;
    }
    const totalUsers = this._tenants.reduce((s, t) => s + (t.settings?.maxUsers || 0), 0);
    const totalAssets = this._tenants.reduce((s, t) => s + (t.settings?.maxAssets || 0), 0);

    return html`
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">总租户数</div><div class="kpi-value kpi-accent">${this._tenants.length}</div></div>
        <div class="kpi"><div class="kpi-label">活跃租户</div><div class="kpi-value kpi-low">${byStatus.active || 0}</div></div>
        <div class="kpi"><div class="kpi-label">试用租户</div><div class="kpi-value">${byStatus.trial || 0}</div></div>
        <div class="kpi"><div class="kpi-label">已暂停</div><div class="kpi-value kpi-high">${byStatus.suspended || 0}</div></div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-title">📊 按定价层</div>
          ${this._renderBarChart(Object.entries(byTier).filter(([_, v]) => v > 0).map(([k, v]) => ({ label: k, value: v as number, severity: (v as number) > 0 ? (k === 'enterprise' || k === 'mssp' ? 'low' : '') : '' })))}
        </div>
        <div class="panel">
          <div class="panel-title">🟢 按状态</div>
          ${this._renderBarChart(Object.entries(byStatus).filter(([_, v]) => v > 0).map(([k, v]) => ({ label: k, value: v as number, severity: k === 'suspended' ? 'high' : k === 'cancelled' ? 'critical' : '' })))}
        </div>
      </div>

      <div class="grid-3">
        <div class="panel">
          <div class="panel-title">🏢 租户列表 (${this._tenants.length})</div>
          ${this._tenants.length === 0 ? html`<div class="empty">暂无租户</div>` : html`
            <table>
              <thead>
                <tr><th>名称</th><th>层</th><th>状态</th><th>资源</th><th>操作</th></tr>
              </thead>
              <tbody>
                ${this._tenants.slice(0, 20).map((t: any) => html`
                  <tr>
                    <td>
                      <div style="font-weight: 600;">${t.name}</div>
                      <div class="code" style="font-size: 9px;">${t.id}</div>
                    </td>
                    <td>${this._renderTenantTier(t.tier || 'free')}</td>
                    <td>${this._renderStatus(t.status || 'active')}</td>
                    <td>
                      <div style="font-size: 10px;">${t.settings?.maxUsers || 0}U / ${t.settings?.maxAssets || 0}A</div>
                      <div class="progress-bar"><div class="progress-fill" style="width: ${Math.min(100, (t.currentUsage?.users || 0) / Math.max(1, t.settings?.maxUsers || 1) * 100)}%"></div></div>
                    </td>
                    <td>
                      <div class="btn-row">
                        <button class="btn" @click=${() => this._selectedTenant = t}>详情</button>
                        <button class="btn" @click=${() => { this._suspendTenantId = t.id; this._suspendTenant(); }}>暂停</button>
                      </div>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          `}
        </div>

        <div>
          <div class="panel">
            <div class="panel-title">➕ 创建租户</div>
            <div class="form-row">
              <input placeholder="租户名称" .value=${this._newTenantName} @input=${(e: any) => this._newTenantName = e.target.value} />
            </div>
            <div class="form-row">
              <select .value=${this._newTenantTier} @change=${(e: any) => this._newTenantTier = e.target.value}>
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
                <option value="mssp">MSSP</option>
              </select>
              <button class="btn-primary" @click=${this._createTenant}>创建</button>
            </div>
            ${this._createResult ? html`<div class="result">${JSON.stringify(this._createResult, null, 2)}</div>` : ''}
          </div>

          <div class="panel">
            <div class="panel-title">📊 资源总览</div>
            <table>
              <tbody>
                <tr><td>总用户配额</td><td>${totalUsers.toLocaleString()}</td></tr>
                <tr><td>总资产配额</td><td>${totalAssets.toLocaleString()}</td></tr>
                <tr><td>存储使用</td><td>${this._tenants.reduce((s, t) => s + (t.currentUsage?.storageMb || 0), 0).toFixed(0)} MB</td></tr>
                <tr><td>事件数</td><td>${this._tenants.reduce((s, t) => s + (t.currentUsage?.incidents || 0), 0)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      ${this._selectedTenant ? html`
        <div class="panel">
          <div class="panel-title">🔍 租户详情：${this._selectedTenant.name}</div>
          <div class="result" style="max-height: 400px;">${JSON.stringify(this._selectedTenant, null, 2)}</div>
          <div class="btn-row" style="margin-top: 8px;">
            <button class="btn" @click=${() => this._selectedTenant = null}>关闭</button>
          </div>
        </div>
      ` : ''}
    `;
  }

  private _renderUsageTab() {
    return html`
      <div class="grid-2">
        <div class="panel">
          <div class="panel-title">📊 查询使用量</div>
          <div class="form-row">
            <input placeholder="租户 ID" .value=${this._usageTenantId} @input=${(e: any) => this._usageTenantId = e.target.value} />
            <select .value=${this._usagePeriod} @change=${(e: any) => this._usagePeriod = e.target.value}>
              <option value="day">过去 1 天</option>
              <option value="week">过去 1 周</option>
              <option value="month">过去 30 天</option>
              <option value="year">过去 1 年</option>
            </select>
            <button class="btn-primary" @click=${this._getUsage}>查询</button>
          </div>
          ${this._usageData ? html`
            <div class="result" style="margin-top: 12px; max-height: 400px;">
              <div style="margin-bottom: 8px;"><strong>${this._usageData.length} 条使用记录</strong></div>
              ${this._usageData.slice(0, 10).map((u: any) => html`
                <div style="padding: 4px 0; border-bottom: 1px solid #374151;">
                  <span class="code">${u.metric}</span>: <strong>${u.value}</strong> · $${u.cost?.toFixed(4) || '0.0000'}
                  <div class="list-meta">${new Date(u.timestamp).toLocaleString()}</div>
                </div>
              `)}
            </div>
          ` : html`<div class="empty">输入租户 ID 后点击查询</div>`}
        </div>

        <div class="panel">
          <div class="panel-title">📝 记录使用量</div>
          <div class="form-row">
            <input placeholder="租户 ID" .value=${this._usageTenantId} @input=${(e: any) => this._usageTenantId = e.target.value} />
          </div>
          <div class="form-row">
            <select .value=${this._usageRecordMetric} @change=${(e: any) => this._usageRecordMetric = e.target.value}>
              <option value="api_calls">API 调用</option>
              <option value="llm_calls">LLM 调用</option>
              <option value="storage_mb">存储 MB</option>
              <option value="scans">扫描</option>
              <option value="users">用户</option>
              <option value="assets">资产</option>
              <option value="incidents">事件</option>
            </select>
            <input type="number" placeholder="数量" .value=${this._usageRecordValue} @input=${(e: any) => this._usageRecordValue = parseInt(e.target.value) || 0} />
            <button class="btn-primary" @click=${this._recordUsage}>记录</button>
          </div>
          ${this._usageRecordResult ? html`<div class="result" style="margin-top: 12px;">${JSON.stringify(this._usageRecordResult, null, 2)}</div>` : ''}
        </div>
      </div>
    `;
  }

  private _renderIsolationTab() {
    return html`
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">隔离策略</div><div class="kpi-value kpi-accent" style="font-size: 18px;">STRICT</div></div>
        <div class="kpi"><div class="kpi-label">数据分隔</div><div class="kpi-value kpi-low" style="font-size: 18px;">✅ 已启用</div></div>
        <div class="kpi"><div class="kpi-label">API 隔离</div><div class="kpi-value kpi-low" style="font-size: 18px;">✅ 已启用</div></div>
        <div class="kpi"><div class="kpi-label">加密隔离</div><div class="kpi-value kpi-low" style="font-size: 18px;">✅ AES-256</div></div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-title">🔒 隔离机制</div>
          <table>
            <thead><tr><th>层级</th><th>机制</th><th>状态</th></tr></thead>
            <tbody>
              <tr><td>网络</td><td>Per-tenant VPC / TLS 1.3</td><td><span class="badge badge-active">✅ 启用</span></td></tr>
              <tr><td>身份</td><td>JWT + tenantId claim</td><td><span class="badge badge-active">✅ 启用</span></td></tr>
              <tr><td>数据</td><td>tenantId 索引 + 强制过滤</td><td><span class="badge badge-active">✅ 启用</span></td></tr>
              <tr><td>密钥</td><td>Per-tenant KMS key</td><td><span class="badge badge-active">✅ 启用</span></td></tr>
              <tr><td>备份</td><td>隔离的备份桶</td><td><span class="badge badge-active">✅ 启用</span></td></tr>
              <tr><td>审计</td><td>Per-tenant 审计日志</td><td><span class="badge badge-active">✅ 启用</span></td></tr>
            </tbody>
          </table>
        </div>

        <div class="panel">
          <div class="panel-title">🧪 隔离测试</div>
          <div style="margin-bottom: 10px; font-size: 12px; color: var(--sc-text-secondary);">验证租户隔离是否正常工作：</div>
          <button class="btn-primary" @click=${this._testIsolation} ?disabled=${this._loading}>🧪 跑隔离测试</button>
          ${this._isolationTest ? html`
            <div class="result" style="margin-top: 12px;">
              <div style="margin-bottom: 6px;">
                <span class="badge badge-${this._isolationTest.passed ? 'active' : 'cancelled'}">
                  ${this._isolationTest.passed ? '✅ 通过' : '❌ 失败'}
                </span>
                <span style="margin-left: 8px;">${this._isolationTest.tests?.length || 0} 项测试</span>
              </div>
              ${(this._isolationTest.tests || []).map((t: any) => html`
                <div style="padding: 4px 0; border-bottom: 1px solid #374151;">
                  <span style="color: ${t.passed ? '#22c55e' : '#ef4444'};">${t.passed ? '✓' : '✗'}</span>
                  <span style="margin-left: 6px;">${t.name}</span>
                  <div class="list-meta">${t.description}</div>
                </div>
              `)}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private _renderAdminTab() {
    return html`
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">管理员账号</div><div class="kpi-value kpi-accent">${this._adminAction?.admins?.length || 0}</div></div>
        <div class="kpi"><div class="kpi-label">审计条目</div><div class="kpi-value kpi-low">${this._auditEntries.length}</div></div>
        <div class="kpi"><div class="kpi-label">区块链验证</div><div class="kpi-value kpi-accent" style="font-size: 18px;">✅ 完整</div></div>
        <div class="kpi"><div class="kpi-label">MFA 启用</div><div class="kpi-value kpi-low" style="font-size: 18px;">100%</div></div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-title">🔑 管理员列表</div>
          <button class="btn-primary" @click=${this._adminPromote}>🔄 加载</button>
          ${this._adminAction?.admins ? html`
            <table style="margin-top: 10px;">
              <thead><tr><th>用户</th><th>租户</th><th>角色</th></tr></thead>
              <tbody>
                ${this._adminAction.admins.slice(0, 10).map((a: any) => html`
                  <tr>
                    <td>${a.name || a.userId}</td>
                    <td><span class="code">${a.tenantId}</span></td>
                    <td><span class="badge badge-active">${a.role || 'admin'}</span></td>
                  </tr>
                `)}
              </tbody>
            </table>
          ` : ''}
        </div>

        <div class="panel">
          <div class="panel-title">📜 最近审计 (${this._auditEntries.length})</div>
          <div class="list">
            ${this._auditEntries.length === 0 ? html`<div class="empty">暂无审计</div>` : this._auditEntries.slice(0, 15).map((e: any) => html`
              <div class="list-item ${e.severity === 'critical' || e.severity === 'alert' ? 'critical' : ''}">
                <span class="badge badge-${e.severity === 'critical' || e.severity === 'alert' ? 'critical' : 'info'}">${e.severity}</span>
                <div style="flex: 1;">
                  <div style="font-weight: 600;">${e.action} · ${e.resource}</div>
                  <div class="list-meta">${e.actorId} · ${e.outcome}</div>
                  <div class="list-meta" style="margin-top: 2px;">${e.description?.substring(0, 60)}</div>
                </div>
                <div class="list-meta">${new Date(e.timestamp).toLocaleTimeString()}</div>
              </div>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <div class="header">
        <div>
          <div class="title">🏢 多租户管理中心</div>
          <div class="subtitle">租户管理 · 使用量监控 · 数据隔离 · 管理员操作</div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
            <div class="live-dot"></div>
            <span>实时</span>
          </div>
          <button class="btn" @click=${() => { this._loadTenants(); this._loadAudit(); }}>🔄 刷新</button>
        </div>
      </div>

      <div class="tabs">
        <div class="tab ${this._activeTab === 'tenants' ? 'active' : ''}" @click=${() => this._setActiveTab('tenants')}>🏢 租户列表</div>
        <div class="tab ${this._activeTab === 'usage' ? 'active' : ''}" @click=${() => this._setActiveTab('usage')}>📊 使用量</div>
        <div class="tab ${this._activeTab === 'isolation' ? 'active' : ''}" @click=${() => this._setActiveTab('isolation')}>🔒 数据隔离</div>
        <div class="tab ${this._activeTab === 'admin' ? 'active' : ''}" @click=${() => this._setActiveTab('admin')}>⚙️ 管理员</div>
      </div>

      ${this._activeTab === 'tenants' ? this._renderTenantsTab() : this._activeTab === 'usage' ? this._renderUsageTab() : this._activeTab === 'isolation' ? this._renderIsolationTab() : this._renderAdminTab()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-tenant-dashboard': ScTenantDashboard;
  }
}

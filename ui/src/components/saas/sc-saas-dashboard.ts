import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-saas-dashboard')
export class ScSaasDashboard extends LitElement {
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
    .bar-row { display: grid; grid-template-columns: 130px 1fr 80px; gap: 8px; align-items: center; font-size: 11px; }
    .bar-label { color: var(--sc-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bar-track { height: 18px; background: var(--sc-bg-tertiary); border-radius: 3px; overflow: hidden; }
    .bar-fill { height: 100%; background: linear-gradient(90deg, var(--sc-primary), var(--sc-info)); transition: width 0.3s; }
    .bar-fill.critical { background: linear-gradient(90deg, var(--sc-critical), #f87171); }
    .bar-fill.high { background: linear-gradient(90deg, var(--sc-high), #fbbf24); }
    .bar-value { text-align: right; font-weight: 600; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
    .badge-critical { background: rgba(239, 68, 68, 0.2); color: var(--sc-critical); }
    .badge-high { background: rgba(245, 158, 11, 0.2); color: var(--sc-high); }
    .badge-medium { background: rgba(59, 130, 246, 0.2); color: var(--sc-medium); }
    .badge-low { background: rgba(34, 197, 94, 0.2); color: var(--sc-low); }
    .badge-info { background: rgba(107, 114, 128, 0.2); color: var(--sc-text-muted); }
    .list { display: flex; flex-direction: column; gap: 6px; max-height: 380px; overflow-y: auto; }
    .list-item { display: flex; gap: 8px; padding: 8px 10px; background: var(--sc-bg-tertiary); border-radius: 4px; font-size: 11px; }
    .list-item.critical { border-left: 3px solid var(--sc-critical); }
    .list-meta { color: var(--sc-text-muted); font-size: 10px; }
    .code { font-family: 'SF Mono', Monaco, monospace; color: var(--sc-text-secondary); background: var(--sc-bg-primary); padding: 2px 4px; border-radius: 2px; }
    .empty { padding: 20px; text-align: center; color: var(--sc-text-muted); font-size: 11px; }
    .btn { padding: 6px 14px; background: var(--sc-primary); color: #0f172a; border: none; border-radius: 4px; font-weight: 600; font-size: 11px; cursor: pointer; }
    .btn:hover { background: #00bfe6; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .audit-verified { color: var(--sc-low); font-size: 10px; }
    .audit-tampered { color: var(--sc-critical); font-size: 10px; }
  `;

  @state() private _activeTab: 'billing' | 'notification' | 'audit' | 'deployment' = 'billing';
  @state() private _billingStats: any = null;
  @state() private _notificationStats: any = null;
  @state() private _auditStats: any = null;
  @state() private _deployStats: any = null;
  @state() private _plans: any[] = [];
  @state() private _invoices: any[] = [];
  @state() private _notifications: any[] = [];
  @state() private _auditEntries: any[] = [];
  @state() private _auditChainValid: any = null;
  @state() private _nodes: any[] = [];
  @state() private _incidents: any[] = [];
  @state() private _loading = false;

  connectedCallback() {
    super.connectedCallback();
    this._loadAllStats();
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

  private async _loadAllStats() {
    this._loading = true;
    await Promise.all([this._loadBilling(), this._loadNotification(), this._loadAudit(), this._loadDeployment()]);
    this._loading = false;
  }

  private async _loadBilling() {
    this._billingStats = await this._apiCall('saas.billing.stats');
    this._plans = await this._apiCall('saas.billing.plans.list') || [];
    this._invoices = await this._apiCall('saas.billing.invoice.list', { limit: 10 }) || [];
  }

  private async _loadNotification() {
    this._notificationStats = await this._apiCall('saas.notification.stats');
    this._notifications = await this._apiCall('saas.notification.list', { limit: 15 }) || [];
  }

  private async _loadAudit() {
    this._auditStats = await this._apiCall('saas.audit.stats');
    this._auditChainValid = await this._apiCall('saas.audit.verify-chain');
    this._auditEntries = await this._apiCall('saas.audit.query', { filter: { limit: 15 } }) || [];
  }

  private async _loadDeployment() {
    this._deployStats = await this._apiCall('saas.deploy.stats');
    this._nodes = await this._apiCall('saas.deploy.node.list') || [];
    this._incidents = await this._apiCall('saas.deploy.incident.list', { limit: 10 }) || [];
  }

  private _setActiveTab(tab: 'billing' | 'notification' | 'audit' | 'deployment') {
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

  private _renderBillingTab() {
    const stats = this._billingStats;
    const byPlan = stats?.byPlan ? Object.entries(stats.byPlan).filter(([_, v]) => (v as any).count > 0).map(([k, v]) => ({ label: k, value: (v as any).count })) : [];
    const byCurrency = stats?.byCurrency ? Object.entries(stats.byCurrency).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number })) : [];
    const invoicesByStatus = stats?.invoicesByStatus ? Object.entries(stats.invoicesByStatus).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: k === 'overdue' ? 'critical' : k === 'pending' ? 'high' : '' })) : [];

    return html`
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">MRR</div><div class="kpi-value kpi-accent">$${(stats?.monthlyRecurringRevenue || 0).toFixed(0)}</div></div>
        <div class="kpi"><div class="kpi-label">ARR</div><div class="kpi-value kpi-low">$${(stats?.annualRecurringRevenue || 0).toFixed(0)}</div></div>
        <div class="kpi"><div class="kpi-label">活跃订阅</div><div class="kpi-value kpi-high">${stats?.activeSubscriptions || 0}</div></div>
        <div class="kpi"><div class="kpi-label">未付发票</div><div class="kpi-value kpi-critical">$${(stats?.outstandingAmount || 0).toFixed(0)}</div></div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-title">📊 按计划</div>
          ${this._renderBarChart(byPlan)}
        </div>
        <div class="panel">
          <div class="panel-title">💰 按货币</div>
          ${this._renderBarChart(byCurrency)}
        </div>
      </div>

      <div class="grid-3">
        <div class="panel">
          <div class="panel-title">📋 定价计划 (${this._plans.length})</div>
          <div class="list">
            ${this._plans.map((p: any) => html`
              <div class="list-item">
                <div style="flex: 1;">
                  <div style="font-weight: 600;">${p.name} <span class="code">${p.code}</span></div>
                  <div class="list-meta">${p.description}</div>
                  <div class="list-meta" style="margin-top: 2px;">限制: ${p.limits?.users} 用户 · ${p.limits?.apiCallsPerDay} API/day · ${p.limits?.retentionDays} 天保留</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 18px; font-weight: 700; color: var(--sc-primary);">$${p.price}</div>
                  <div class="list-meta">/ ${p.supportedCycles?.[0] || 'mo'}</div>
                </div>
              </div>
            `)}
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">🧾 发票 (${this._invoices.length})</div>
          <div class="list">
            ${this._invoices.length === 0 ? html`<div class="empty">暂无发票</div>` : this._invoices.map((inv: any) => html`
              <div class="list-item">
                <div style="flex: 1;">
                  <div class="code">${inv.number}</div>
                  <div class="list-meta" style="margin-top: 2px;">${inv.currency} ${inv.total.toFixed(2)} · ${new Date(inv.issuedAt).toLocaleDateString()}</div>
                </div>
                <span class="badge badge-${inv.status === 'paid' ? 'low' : inv.status === 'overdue' ? 'critical' : inv.status === 'pending' ? 'high' : 'medium'}">${inv.status}</span>
              </div>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  private _renderNotificationTab() {
    const stats = this._notificationStats;
    const byChannel = stats?.byChannel ? Object.entries(stats.byChannel).filter(([_, v]) => (v as any).sent + (v as any).failed + (v as any).pending > 0).map(([k, v]) => ({ label: k, value: (v as any).sent + (v as any).failed })) : [];
    const byStatus = stats?.byStatus ? Object.entries(stats.byStatus).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: k === 'failed' ? 'critical' : k === 'bounced' ? 'high' : '' })) : [];
    const byPriority = stats?.byPriority ? Object.entries(stats.byPriority).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: k === 'critical' || k === 'urgent' ? 'critical' : k === 'high' ? 'high' : '' })) : [];
    const successRate = stats?.successRate !== undefined ? (stats.successRate * 100).toFixed(1) : '0';

    return html`
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">总通知</div><div class="kpi-value kpi-accent">${stats?.totalNotifications || 0}</div></div>
        <div class="kpi"><div class="kpi-label">今日发送</div><div class="kpi-value kpi-low">${stats?.sentToday || 0}</div></div>
        <div class="kpi"><div class="kpi-label">成功率</div><div class="kpi-value kpi-high">${successRate}%</div></div>
        <div class="kpi"><div class="kpi-label">订阅者</div><div class="kpi-value kpi-critical">${stats?.totalSubscribers || 0}</div></div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-title">📡 按通道</div>
          ${this._renderBarChart(byChannel)}
        </div>
        <div class="panel">
          <div class="panel-title">📊 按状态</div>
          ${this._renderBarChart(byStatus)}
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">📨 最近通知 (${this._notifications.length})</div>
        <div class="list">
          ${this._notifications.length === 0 ? html`<div class="empty">暂无通知</div>` : this._notifications.map((n: any) => html`
            <div class="list-item ${n.priority === 'critical' || n.priority === 'urgent' ? 'critical' : ''}">
              <span class="badge badge-${n.priority === 'critical' || n.priority === 'urgent' ? 'critical' : n.priority === 'high' ? 'high' : 'medium'}">${n.priority}</span>
              <div style="flex: 1;">
                <div style="font-weight: 600;">${n.subject}</div>
                <div class="list-meta">${n.channel} · ${n.recipient}</div>
                <div class="list-meta" style="margin-top: 2px;">${n.body?.substring(0, 80)}</div>
              </div>
              <span class="badge badge-${n.status === 'sent' || n.status === 'delivered' ? 'low' : n.status === 'failed' || n.status === 'bounced' ? 'critical' : n.status === 'pending' || n.status === 'retrying' ? 'medium' : 'info'}">${n.status}</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderAuditTab() {
    const stats = this._auditStats;
    const bySeverity = stats?.bySeverity ? Object.entries(stats.bySeverity).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: k === 'critical' || k === 'alert' || k === 'emergency' ? 'critical' : k === 'error' || k === 'warning' ? 'high' : '' })) : [];
    const byAction = stats?.byAction ? Object.entries(stats.byAction).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number })) : [];
    const byOutcome = stats?.byOutcome ? Object.entries(stats.byOutcome).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: k === 'failure' || k === 'denied' ? 'critical' : '' })) : [];

    return html`
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">审计条目数</div><div class="kpi-value kpi-accent">${stats?.totalEntries || 0}</div></div>
        <div class="kpi"><div class="kpi-label">独立用户</div><div class="kpi-value kpi-low">${stats?.uniqueActors || 0}</div></div>
        <div class="kpi"><div class="kpi-label">存储占用</div><div class="kpi-value kpi-high">${stats?.storageSizeMb || 0} MB</div></div>
        <div class="kpi"><div class="kpi-label">区块链</div>
          <div class="kpi-value ${stats?.verifiedChain ? 'kpi-low' : 'kpi-critical'}" style="font-size: 18px;">${stats?.verifiedChain ? '✅ 完整' : '❌ 被篡改'}</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-title">📊 按严重性</div>
          ${this._renderBarChart(bySeverity)}
        </div>
        <div class="panel">
          <div class="panel-title">🎬 按操作类型</div>
          ${this._renderBarChart(byAction)}
        </div>
      </div>

      <div class="grid-3">
        <div class="panel">
          <div class="panel-title">📜 审计记录 (${this._auditEntries.length})</div>
          <div class="list">
            ${this._auditEntries.length === 0 ? html`<div class="empty">暂无审计记录</div>` : this._auditEntries.map((e: any) => html`
              <div class="list-item ${e.severity === 'critical' || e.severity === 'alert' || e.severity === 'emergency' ? 'critical' : e.severity === 'error' ? 'high' : ''}">
                <span class="badge badge-${e.severity === 'critical' || e.severity === 'alert' || e.severity === 'emergency' ? 'critical' : e.severity === 'error' || e.severity === 'warning' ? 'high' : 'info'}">${e.severity}</span>
                <div style="flex: 1;">
                  <div style="font-weight: 600;">${e.action} · ${e.resource}</div>
                  <div class="list-meta">${e.actorId} · ${e.outcome}</div>
                  <div class="list-meta" style="margin-top: 2px;">${e.description?.substring(0, 80)}</div>
                  <div class="list-meta" style="margin-top: 2px;">hash: <span class="code">${e.hash?.substring(0, 16)}...</span></div>
                </div>
                <div class="list-meta">${new Date(e.timestamp).toLocaleString()}</div>
              </div>
            `)}
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">🔗 区块链完整性</div>
          <div class="list">
            ${this._auditChainValid ? html`
              <div class="list-item">
                <div style="flex: 1;">
                  <div class="audit-verified">✅ 链完整</div>
                  <div class="list-meta" style="margin-top: 4px;">已验证 ${this._auditChainValid.checked} 个条目</div>
                  <div class="list-meta">所有 hash 完整，prevHash 引用正确</div>
                </div>
              </div>
            ` : html`<div class="empty">尚未验证</div>`}
            <div class="list-item">
              <div style="flex: 1;">
                <div style="font-weight: 600;">📊 按结果</div>
                ${this._renderBarChart(byOutcome)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private _renderDeploymentTab() {
    const stats = this._deployStats;
    const byRegion = stats?.byRegion ? Object.entries(stats.byRegion).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number })) : [];
    const byStatus = stats?.byStatus ? Object.entries(stats.byStatus).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: k === 'failed' ? 'critical' : k === 'degraded' || k === 'maintenance' ? 'high' : '' })) : [];
    const byHealth = stats?.byHealth ? Object.entries(stats.byHealth).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: k === 'critical' ? 'critical' : k === 'warning' ? 'high' : '' })) : [];

    return html`
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">总节点</div><div class="kpi-value kpi-accent">${stats?.totalNodes || 0}</div></div>
        <div class="kpi"><div class="kpi-label">活跃</div><div class="kpi-value kpi-low">${stats?.activeNodes || 0}</div></div>
        <div class="kpi"><div class="kpi-label">当前版本</div><div class="kpi-value kpi-high" style="font-size: 18px;">${stats?.currentVersion || 'n/a'}</div></div>
        <div class="kpi"><div class="kpi-label">开放事件</div><div class="kpi-value kpi-critical">${stats?.openIncidents || 0}</div></div>
      </div>

      <div class="grid-3">
        <div class="panel">
          <div class="panel-title">🌍 节点分布 (${this._nodes.length})</div>
          <div class="list">
            ${this._nodes.length === 0 ? html`<div class="empty">暂无节点</div>` : this._nodes.map((n: any) => html`
              <div class="list-item ${n.healthStatus === 'critical' ? 'critical' : n.healthStatus === 'warning' ? 'high' : ''}">
                <div style="flex: 1;">
                  <div style="font-weight: 600;">${n.name} <span class="code">${n.version}</span></div>
                  <div class="list-meta">${n.region} · ${n.status} · ${n.url}</div>
                  <div class="list-meta" style="margin-top: 2px;">CPU ${n.cpu.toFixed(0)}% · MEM ${n.memory.toFixed(0)}% · DISK ${n.disk.toFixed(0)}%</div>
                  <div class="list-meta">请求: ${n.requestsPerMinute.toFixed(0)}/min · 错误: ${n.errorsPerMinute.toFixed(0)}/min</div>
                </div>
                <span class="badge badge-${n.healthStatus === 'healthy' ? 'low' : n.healthStatus === 'critical' ? 'critical' : 'high'}">${n.healthStatus}</span>
              </div>
            `)}
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">📊 状态分布</div>
          ${this._renderBarChart(byStatus)}
          <div class="panel-title" style="margin-top: 12px;">💓 健康状态</div>
          ${this._renderBarChart(byHealth)}
        </div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-title">🌍 按区域</div>
          ${this._renderBarChart(byRegion)}
        </div>
        <div class="panel">
          <div class="panel-title">🚨 事件 (${this._incidents.length})</div>
          <div class="list">
            ${this._incidents.length === 0 ? html`<div class="empty">暂无事件</div>` : this._incidents.map((i: any) => html`
              <div class="list-item ${i.severity}">
                <span class="badge badge-${i.severity}">${i.severity}</span>
                <div style="flex: 1;">
                  <div style="font-weight: 600;">${i.title}</div>
                  <div class="list-meta">${i.region || 'global'} · ${i.status}</div>
                  <div class="list-meta" style="margin-top: 2px;">${i.description?.substring(0, 80)}</div>
                </div>
                <div class="list-meta">${new Date(i.startedAt).toLocaleString()}</div>
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
          <div class="title">💼 SaaS 运营中心</div>
          <div class="subtitle">计费订阅 · 通知推送 · 审计合规 · 多区部署</div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
            <div class="live-dot"></div>
            <span>实时</span>
          </div>
          <button class="btn" @click=${this._loadAllStats}>🔄 刷新</button>
        </div>
      </div>

      <div class="tabs">
        <div class="tab ${this._activeTab === 'billing' ? 'active' : ''}" @click=${() => this._setActiveTab('billing')}>💰 计费订阅</div>
        <div class="tab ${this._activeTab === 'notification' ? 'active' : ''}" @click=${() => this._setActiveTab('notification')}>📨 通知推送</div>
        <div class="tab ${this._activeTab === 'audit' ? 'active' : ''}" @click=${() => this._setActiveTab('audit')}>📜 审计合规</div>
        <div class="tab ${this._activeTab === 'deployment' ? 'active' : ''}" @click=${() => this._setActiveTab('deployment')}>🌍 多区部署</div>
      </div>

      ${this._activeTab === 'billing' ? this._renderBillingTab() : this._activeTab === 'notification' ? this._renderNotificationTab() : this._activeTab === 'audit' ? this._renderAuditTab() : this._renderDeploymentTab()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-saas-dashboard': ScSaasDashboard;
  }
}

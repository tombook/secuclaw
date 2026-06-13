import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-notification-center')
export class ScNotificationCenter extends LitElement {
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
    .badge-critical { background: rgba(239, 68, 68, 0.2); color: var(--sc-critical); }
    .badge-urgent { background: rgba(239, 68, 68, 0.2); color: var(--sc-critical); }
    .badge-high { background: rgba(245, 158, 11, 0.2); color: var(--sc-high); }
    .badge-medium { background: rgba(59, 130, 246, 0.2); color: var(--sc-medium); }
    .badge-normal { background: rgba(107, 114, 128, 0.2); color: var(--sc-text-muted); }
    .badge-low { background: rgba(34, 197, 94, 0.2); color: var(--sc-low); }
    .badge-sent { background: rgba(34, 197, 94, 0.2); color: var(--sc-low); }
    .badge-delivered { background: rgba(34, 197, 94, 0.2); color: var(--sc-low); }
    .badge-pending { background: rgba(245, 158, 11, 0.2); color: var(--sc-high); }
    .badge-failed { background: rgba(239, 68, 68, 0.2); color: var(--sc-critical); }
    .badge-retrying { background: rgba(59, 130, 246, 0.2); color: var(--sc-medium); }
    .badge-bounced { background: rgba(239, 68, 68, 0.2); color: var(--sc-critical); }
    .badge-suppressed { background: rgba(107, 114, 128, 0.2); color: var(--sc-text-muted); }
    .badge-info { background: rgba(107, 114, 128, 0.2); color: var(--sc-text-muted); }
    .list { display: flex; flex-direction: column; gap: 6px; max-height: 600px; overflow-y: auto; }
    .list-item { display: flex; gap: 8px; padding: 8px 10px; background: var(--sc-bg-tertiary); border-radius: 4px; font-size: 11px; }
    .list-item.critical { border-left: 3px solid var(--sc-critical); }
    .list-item.high { border-left: 3px solid var(--sc-high); }
    .list-meta { color: var(--sc-text-muted); font-size: 10px; }
    .code { font-family: 'SF Mono', Monaco, monospace; color: var(--sc-text-secondary); background: var(--sc-bg-primary); padding: 2px 4px; border-radius: 2px; }
    .empty { padding: 20px; text-align: center; color: var(--sc-text-muted); font-size: 11px; }
    .btn { padding: 6px 12px; background: var(--sc-bg-tertiary); color: var(--sc-text-primary); border: 1px solid var(--sc-border); border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; }
    .btn:hover { border-color: var(--sc-primary); color: var(--sc-primary); }
    .btn-primary { padding: 6px 14px; background: var(--sc-primary); color: #0a0f1a; border: none; border-radius: 4px; font-weight: 700; font-size: 11px; cursor: pointer; }
    .btn-primary:hover { background: #00bfe6; }
    .form-row { display: flex; gap: 8px; margin-bottom: 8px; }
    .form-row input, .form-row select, .form-row textarea { flex: 1; padding: 8px 10px; background: var(--sc-bg-primary); border: 1px solid var(--sc-border); border-radius: 4px; color: var(--sc-text-primary); font-size: 11px; font-family: inherit; }
    .form-row textarea { min-height: 60px; resize: vertical; }
    .form-label { font-size: 10px; color: var(--sc-text-muted); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
    .result-block { margin-top: 12px; padding: 10px; background: var(--sc-bg-tertiary); border-radius: 4px; font-size: 11px; }
    .channel-icon { font-size: 20px; }
    .switch { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
    .switch-track { width: 32px; height: 18px; background: var(--sc-bg-tertiary); border-radius: 9px; position: relative; transition: background 0.2s; }
    .switch-track.on { background: var(--sc-low); }
    .switch-thumb { width: 14px; height: 14px; background: white; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: left 0.2s; }
    .switch-track.on .switch-thumb { left: 16px; }
  `;

  @state() private _activeTab: 'inbox' | 'compose' | 'channels' | 'preferences' = 'inbox';
  @state() private _stats: any = null;
  @state() private _notifications: any[] = [];
  @state() private _preferences: any[] = [];
  @state() private _subscribers: any[] = [];
  @state() private _loading = false;

  @state() private _newNotifTenantId = 't1';
  @state() private _newNotifChannel = 'email';
  @state() private _newNotifPriority = 'normal';
  @state() private _newNotifTemplate = 'alert';
  @state() private _newNotifSubject = '';
  @state() private _newNotifBody = '';
  @state() private _newNotifRecipient = '';
  @state() private _sendResult: any = null;

  @state() private _subTenantId = 't1';
  @state() private _subUserId = 'u1';
  @state() private _subName = 'Alice Chen';
  @state() private _subEmail = 'alice@example.com';
  @state() private _subPhone = '+8613812345678';
  @state() private _subChannels: string[] = ['email'];
  @state() private _subResult: any = null;

  connectedCallback() {
    super.connectedCallback();
    this._loadAll();
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

  private async _loadAll() {
    this._loading = true;
    const [stats, notifs, prefs, subs] = await Promise.all([
      this._apiCall('saas.notification.stats'),
      this._apiCall('saas.notification.list', { limit: 50 }),
      this._apiCall('saas.notification.preferences.list'),
      this._apiCall('saas.notification.subscriber.list'),
    ]);
    this._stats = stats;
    this._notifications = notifs || [];
    this._preferences = prefs || [];
    this._subscribers = subs || [];
    this._loading = false;
  }

  private async _sendNotif() {
    if (!this._newNotifRecipient || !this._newNotifSubject) return;
    this._sendResult = await this._apiCall('saas.notification.send', { params: { tenantId: this._newNotifTenantId, channel: this._newNotifChannel, priority: this._newNotifPriority, template: this._newNotifTemplate, subject: this._newNotifSubject, body: this._newNotifBody, recipient: this._newNotifRecipient } });
    this._newNotifSubject = '';
    this._newNotifBody = '';
    await this._loadAll();
  }

  private async _addSubscriber() {
    this._subResult = await this._apiCall('saas.notification.subscriber.add', { params: { tenantId: this._subTenantId, userId: this._subUserId, name: this._subName, email: this._subEmail, phone: this._subPhone || undefined, channels: this._subChannels } });
    await this._loadAll();
  }

  private async _setPreferences(tenantId: string, userId: string | null, enabled: boolean) {
    await this._apiCall('saas.notification.preferences.set', { params: { tenantId, userId, channels: ['email', 'slack', 'webhook'], priorities: ['critical', 'urgent', 'high', 'normal', 'low'], templates: ['alert', 'incident', 'vulnerability', 'compliance', 'billing', 'welcome', 'password_reset', 'mfa_required', 'system', 'custom'], quietHoursStart: 22, quietHoursEnd: 7, enabled, rateLimitPerHour: 100 } });
    await this._loadAll();
  }

  private _setActiveTab(tab: 'inbox' | 'compose' | 'channels' | 'preferences') {
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

  private _channelIcon(channel: string): string {
    const icons: any = { email: '📧', sms: '📱', webhook: '🔗', slack: '💬', teams: '👥', pagerduty: '🚨', in_app: '🔔', push: '📲' };
    return icons[channel] || '📤';
  }

  private _priorityBadge(priority: string) {
    return html`<span class="badge badge-${priority}">${priority.toUpperCase()}</span>`;
  }

  private _statusBadge(status: string) {
    return html`<span class="badge badge-${status}">${status}</span>`;
  }

  private _renderInboxTab() {
    const s = this._stats;
    const byChannel = s?.byChannel ? Object.entries(s.byChannel).filter(([_, v]) => (v as any).sent + (v as any).failed + (v as any).pending > 0).map(([k, v]) => ({ label: k, value: (v as any).sent + (v as any).failed })) : [];
    const byStatus = s?.byStatus ? Object.entries(s.byStatus).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: k === 'failed' ? 'critical' : k === 'bounced' ? 'high' : '' })) : [];
    const byPriority = s?.byPriority ? Object.entries(s.byPriority).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: k === 'critical' || k === 'urgent' ? 'critical' : k === 'high' ? 'high' : '' })) : [];
    const successRate = s?.successRate !== undefined ? (s.successRate * 100).toFixed(1) : '0';
    const avgDelivery = s?.averageDeliveryTime !== undefined ? s.averageDeliveryTime.toFixed(0) : '0';

    return html`
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">总通知</div><div class="kpi-value kpi-accent">${s?.totalNotifications || 0}</div></div>
        <div class="kpi"><div class="kpi-label">今日发送</div><div class="kpi-value kpi-low">${s?.sentToday || 0}</div></div>
        <div class="kpi"><div class="kpi-label">成功率</div><div class="kpi-value">${successRate}%</div></div>
        <div class="kpi"><div class="kpi-label">平均延迟</div><div class="kpi-value">${avgDelivery}ms</div></div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-title">📡 按通道</div>
          ${this._renderBarChart(byChannel)}
        </div>
        <div class="panel">
          <div class="panel-title">🎯 按优先级</div>
          ${this._renderBarChart(byPriority)}
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">📊 按状态</div>
        ${this._renderBarChart(byStatus)}
      </div>

      <div class="panel">
        <div class="panel-title">📨 收件箱 (${this._notifications.length})</div>
        ${this._notifications.length === 0 ? html`<div class="empty">暂无通知</div>` : html`
          <div class="list">
            ${this._notifications.map((n: any) => html`
              <div class="list-item ${n.priority === 'critical' || n.priority === 'urgent' ? 'critical' : n.priority === 'high' ? 'high' : ''}">
                <span class="channel-icon">${this._channelIcon(n.channel)}</span>
                <div style="flex: 1;">
                  <div style="font-weight: 600; display: flex; gap: 6px; align-items: center;">
                    ${n.subject}
                    ${this._priorityBadge(n.priority)}
                  </div>
                  <div class="list-meta" style="margin-top: 2px;">${n.channel} · ${n.recipient}</div>
                  <div class="list-meta" style="margin-top: 2px;">${n.body?.substring(0, 80)}</div>
                </div>
                <div style="text-align: right;">
                  ${this._statusBadge(n.status)}
                  <div class="list-meta" style="margin-top: 4px;">${new Date(n.createdAt).toLocaleTimeString()}</div>
                </div>
              </div>
            `)}
          </div>
        `}
      </div>
    `;
  }

  private _renderComposeTab() {
    return html`
      <div class="grid-3">
        <div class="panel">
          <div class="panel-title">✉️ 发送新通知</div>
          <div class="form-label">租户 ID</div>
          <div class="form-row">
            <input .value=${this._newNotifTenantId} @input=${(e: any) => this._newNotifTenantId = e.target.value} placeholder="t1" />
          </div>
          <div class="form-label">通道 + 优先级</div>
          <div class="form-row">
            <select .value=${this._newNotifChannel} @change=${(e: any) => this._newNotifChannel = e.target.value}>
              <option value="email">📧 Email</option>
              <option value="sms">📱 SMS</option>
              <option value="webhook">🔗 Webhook</option>
              <option value="slack">💬 Slack</option>
              <option value="teams">👥 Teams</option>
              <option value="pagerduty">🚨 PagerDuty</option>
              <option value="in_app">🔔 In-App</option>
              <option value="push">📲 Push</option>
            </select>
            <select .value=${this._newNotifPriority} @change=${(e: any) => this._newNotifPriority = e.target.value}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div class="form-label">模板</div>
          <div class="form-row">
            <select .value=${this._newNotifTemplate} @change=${(e: any) => this._newNotifTemplate = e.target.value}>
              <option value="alert">🚨 安全告警</option>
              <option value="incident">⚠️ 安全事件</option>
              <option value="vulnerability">🐛 漏洞</option>
              <option value="compliance">📜 合规</option>
              <option value="billing">💰 计费</option>
              <option value="welcome">👋 欢迎</option>
              <option value="password_reset">🔑 密码重置</option>
              <option value="mfa_required">📱 MFA 必填</option>
              <option value="system">🖥️ 系统</option>
              <option value="custom">✏️ 自定义</option>
            </select>
          </div>
          <div class="form-label">主题</div>
          <div class="form-row">
            <input .value=${this._newNotifSubject} @input=${(e: any) => this._newNotifSubject = e.target.value} placeholder="安全告警：检测到 Brute Force 攻击" />
          </div>
          <div class="form-label">正文</div>
          <div class="form-row">
            <textarea .value=${this._newNotifBody} @input=${(e: any) => this._newNotifBody = e.target.value} placeholder="详细描述..."></textarea>
          </div>
          <div class="form-label">收件人</div>
          <div class="form-row">
            <input .value=${this._newNotifRecipient} @input=${(e: any) => this._newNotifRecipient = e.target.value} placeholder="alice@example.com / +8613812345678 / https://hooks.slack.com/..." />
            <button class="btn-primary" @click=${this._sendNotif}>🚀 发送</button>
          </div>

          ${this._sendResult ? html`
            <div class="result-block">
              <div style="font-weight: 700; margin-bottom: 4px;">
                ${this._sendResult.status === 'sent' ? '✅ 已发送' : this._sendResult.status === 'suppressed' ? '⚠️ 已抑制' : '❌ 失败'}
              </div>
              <div class="list-meta">ID: <span class="code">${this._sendResult.id}</span></div>
              <div class="list-meta">通道: ${this._sendResult.channel}</div>
              <div class="list-meta">状态: ${this._sendResult.status}</div>
              ${this._sendResult.failureReason ? html`<div class="list-meta">原因: ${this._sendResult.failureReason}</div>` : ''}
            </div>
          ` : ''}
        </div>

        <div class="panel">
          <div class="panel-title">📋 模板参考</div>
          <div style="font-size: 11px; line-height: 1.8;">
            <div><strong>alert</strong> - 安全告警（SQL 注入等）</div>
            <div><strong>incident</strong> - 事件（已升级的事件）</div>
            <div><strong>vulnerability</strong> - 漏洞（CVE）</div>
            <div><strong>compliance</strong> - 合规（违规）</div>
            <div><strong>billing</strong> - 计费（发票、续费）</div>
            <div><strong>welcome</strong> - 欢迎（新用户）</div>
            <div><strong>password_reset</strong> - 密码重置</div>
            <div><strong>mfa_required</strong> - MFA 必填</div>
            <div><strong>system</strong> - 系统维护</div>
            <div><strong>custom</strong> - 自定义</div>
          </div>
          <div style="margin-top: 16px; font-size: 10px; color: var(--sc-text-muted);">
            提示：通知会自动适配通道格式。<br/>
            • Email: HTML 邮件<br/>
            • SMS: 纯文本（限 160 字符）<br/>
            • Slack: Markdown<br/>
            • Webhook: JSON POST<br/>
            • PagerDuty: 紧急告警
          </div>
        </div>
      </div>
    `;
  }

  private _renderChannelsTab() {
    return html`
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">活跃通道</div><div class="kpi-value kpi-accent">8</div></div>
        <div class="kpi"><div class="kpi-label">订阅者</div><div class="kpi-value kpi-low">${this._subscribers.length}</div></div>
        <div class="kpi"><div class="kpi-label">偏好配置</div><div class="kpi-value">${this._preferences.length}</div></div>
        <div class="kpi"><div class="kpi-label">总发送</div><div class="kpi-value kpi-accent">${this._stats?.totalNotifications || 0}</div></div>
      </div>

      <div class="grid-3">
        <div class="panel">
          <div class="panel-title">➕ 添加订阅者</div>
          <div class="form-label">租户 + 用户</div>
          <div class="form-row">
            <input .value=${this._subTenantId} @input=${(e: any) => this._subTenantId = e.target.value} placeholder="t1" />
            <input .value=${this._subUserId} @input=${(e: any) => this._subUserId = e.target.value} placeholder="u1" />
          </div>
          <div class="form-label">姓名 + Email</div>
          <div class="form-row">
            <input .value=${this._subName} @input=${(e: any) => this._subName = e.target.value} placeholder="Alice Chen" />
            <input .value=${this._subEmail} @input=${(e: any) => this._subEmail = e.target.value} placeholder="alice@example.com" />
          </div>
          <div class="form-label">手机号（可选）</div>
          <div class="form-row">
            <input .value=${this._subPhone} @input=${(e: any) => this._subPhone = e.target.value} placeholder="+8613812345678" />
          </div>
          <div class="form-label">通道（逗号分隔）</div>
          <div class="form-row">
            <input .value=${this._subChannels.join(',')} @input=${(e: any) => this._subChannels = e.target.value.split(',').map(s => s.trim())} placeholder="email,sms,slack" />
          </div>
          <button class="btn-primary" @click=${this._addSubscriber} style="width: 100%;">➕ 添加订阅者</button>
          ${this._subResult ? html`<div class="result-block" style="margin-top: 10px;">ID: <span class="code">${this._subResult.id}</span></div>` : ''}
        </div>

        <div class="panel">
          <div class="panel-title">👥 当前订阅者 (${this._subscribers.length})</div>
          <div class="list">
            ${this._subscribers.length === 0 ? html`<div class="empty">暂无订阅者</div>` : this._subscribers.slice(0, 20).map((s: any) => html`
              <div class="list-item">
                <div style="flex: 1;">
                  <div style="font-weight: 600;">${s.name}</div>
                  <div class="list-meta">${s.email}${s.phone ? ' · ' + s.phone : ''}</div>
                  <div class="list-meta" style="margin-top: 4px;">
                    ${(s.channels || []).map((c: string) => html`<span style="margin-right: 4px;">${this._channelIcon(c)}</span>`)}
                  </div>
                </div>
              </div>
            `)}
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">📡 通道详情</div>
        <table>
          <thead><tr><th>通道</th><th>状态</th><th>延迟</th><th>成功率</th><th>描述</th></tr></thead>
          <tbody>
            <tr><td>📧 Email</td><td><span class="badge badge-sent">✅ 启用</span></td><td>~500ms</td><td>99.5%</td><td>SMTP / SendGrid / Mailgun</td></tr>
            <tr><td>📱 SMS</td><td><span class="badge badge-sent">✅ 启用</span></td><td>~1s</td><td>99.0%</td><td>Twilio / 阿里云 / 腾讯云</td></tr>
            <tr><td>🔗 Webhook</td><td><span class="badge badge-sent">✅ 启用</span></td><td>~200ms</td><td>99.9%</td><td>自定义 HTTP POST</td></tr>
            <tr><td>💬 Slack</td><td><span class="badge badge-sent">✅ 启用</span></td><td>~500ms</td><td>99.5%</td><td>Webhook 集成</td></tr>
            <tr><td>👥 Teams</td><td><span class="badge badge-sent">✅ 启用</span></td><td>~500ms</td><td>99.5%</td><td>Office 365 Connector</td></tr>
            <tr><td>🚨 PagerDuty</td><td><span class="badge badge-sent">✅ 启用</span></td><td>~300ms</td><td>99.9%</td><td>紧急事件升级</td></tr>
            <tr><td>🔔 In-App</td><td><span class="badge badge-sent">✅ 启用</span></td><td>实时</td><td>100%</td><td>应用内消息</td></tr>
            <tr><td>📲 Push</td><td><span class="badge badge-sent">✅ 启用</span></td><td>~2s</td><td>98.0%</td><td>FCM / APNs</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }

  private _renderPreferencesTab() {
    return html`
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">总偏好配置</div><div class="kpi-value kpi-accent">${this._preferences.length}</div></div>
        <div class="kpi"><div class="kpi-label">已启用</div><div class="kpi-value kpi-low">${this._preferences.filter((p: any) => p.enabled).length}</div></div>
        <div class="kpi"><div class="kpi-label">已禁用</div><div class="kpi-value kpi-high">${this._preferences.filter((p: any) => !p.enabled).length}</div></div>
        <div class="kpi"><div class="kpi-label">速率限制</div><div class="kpi-value">100/h</div></div>
      </div>

      <div class="grid-3">
        <div class="panel">
          <div class="panel-title">⚙️ 偏好配置 (${this._preferences.length})</div>
          ${this._preferences.length === 0 ? html`<div class="empty">暂无偏好配置</div>` : html`
            <table>
              <thead><tr><th>租户</th><th>用户</th><th>通道</th><th>优先级</th><th>静默</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>
                ${this._preferences.map((p: any) => html`
                  <tr>
                    <td><span class="code">${p.tenantId}</span></td>
                    <td>${p.userId || '全局'}</td>
                    <td>${(p.channels || []).length} 个</td>
                    <td>${(p.priorities || []).length} 级</td>
                    <td>${p.quietHoursStart !== null ? `${p.quietHoursStart}-${p.quietHoursEnd}` : '无'}</td>
                    <td>
                      <div class="switch" @click=${() => this._setPreferences(p.tenantId, p.userId, !p.enabled)}>
                        <div class="switch-track ${p.enabled ? 'on' : ''}">
                          <div class="switch-thumb"></div>
                        </div>
                        <span>${p.enabled ? '启用' : '禁用'}</span>
                      </div>
                    </td>
                    <td>${p.rateLimitPerHour}/h</td>
                  </tr>
                `)}
              </tbody>
            </table>
          `}
        </div>

        <div class="panel">
          <div class="panel-title">📊 偏好概览</div>
          <table>
            <tbody>
              <tr><td>启用数量</td><td><span class="badge badge-sent">${this._preferences.filter((p: any) => p.enabled).length}</span></td></tr>
              <tr><td>禁用数量</td><td><span class="badge badge-failed">${this._preferences.filter((p: any) => !p.enabled).length}</span></td></tr>
              <tr><td>总限制</td><td>100/h</td></tr>
              <tr><td>静默时段</td><td>22:00-07:00 (默认)</td></tr>
            </tbody>
          </table>
          <div style="margin-top: 12px; font-size: 11px; color: var(--sc-text-muted);">
            💡 提示：点击开关快速启用/禁用某个租户或用户的通知。
          </div>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <div class="header">
        <div>
          <div class="title">📨 通知中心</div>
          <div class="subtitle">多通道推送 · 订阅者管理 · 偏好配置 · 实时统计</div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
            <div class="live-dot"></div>
            <span>实时</span>
          </div>
          <button class="btn" @click=${this._loadAll}>🔄 刷新</button>
        </div>
      </div>

      <div class="tabs">
        <div class="tab ${this._activeTab === 'inbox' ? 'active' : ''}" @click=${() => this._setActiveTab('inbox')}>📥 收件箱</div>
        <div class="tab ${this._activeTab === 'compose' ? 'active' : ''}" @click=${() => this._setActiveTab('compose')}>✉️ 撰写</div>
        <div class="tab ${this._activeTab === 'channels' ? 'active' : ''}" @click=${() => this._setActiveTab('channels')}>📡 通道 & 订阅者</div>
        <div class="tab ${this._activeTab === 'preferences' ? 'active' : ''}" @click=${() => this._setActiveTab('preferences')}>⚙️ 偏好</div>
      </div>

      ${this._activeTab === 'inbox' ? this._renderInboxTab() : this._activeTab === 'compose' ? this._renderComposeTab() : this._activeTab === 'channels' ? this._renderChannelsTab() : this._renderPreferencesTab()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-notification-center': ScNotificationCenter;
  }
}
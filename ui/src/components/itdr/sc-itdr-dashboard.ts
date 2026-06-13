import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-itdr-dashboard')
export class ScItrdDashboard extends LitElement {
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
    .list-item.high { border-left: 3px solid var(--sc-high); }
    .list-meta { color: var(--sc-text-muted); font-size: 10px; }
    .code { font-family: 'SF Mono', Monaco, monospace; color: var(--sc-text-secondary); background: var(--sc-bg-primary); padding: 2px 4px; border-radius: 2px; }
    .empty { padding: 20px; text-align: center; color: var(--sc-text-muted); font-size: 11px; }
    .test-panel { background: var(--sc-bg-secondary); border: 1px solid var(--sc-border); border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    textarea, select { width: 100%; padding: 8px; background: var(--sc-bg-tertiary); border: 1px solid var(--sc-border); border-radius: 4px; color: var(--sc-text-primary); font-family: 'SF Mono', Monaco, monospace; font-size: 11px; }
    textarea { min-height: 60px; resize: vertical; }
    .btn { padding: 6px 14px; background: var(--sc-primary); color: #0f172a; border: none; border-radius: 4px; font-weight: 600; font-size: 11px; cursor: pointer; }
    .btn:hover { background: #00bfe6; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-row { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
    .result-block { margin-top: 10px; padding: 10px; background: var(--sc-bg-tertiary); border-radius: 4px; font-size: 11px; }
    .mitre { color: var(--sc-info); font-size: 10px; }
  `;

  @state() private _activeTab: 'credential' | 'mfa' | 'lateral' | 'responder' = 'credential';
  @state() private _credentialStats: any = null;
  @state() private _mfaStats: any = null;
  @state() private _lateralStats: any = null;
  @state() private _responderStats: any = null;
  @state() private _credentialDetections: any[] = [];
  @state() private _mfaDetections: any[] = [];
  @state() private _lateralDetections: any[] = [];
  @state() private _responderExecutions: any[] = [];
  @state() private _policies: any[] = [];
  @state() private _loading = false;
  @state() private _ipInput = '8.8.8.8';
  @state() private _ipResult: any = null;
  @state() private _userInput = 'alice';
  @state() private _compromisedResult: any = null;

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
    await Promise.all([this._loadCredentialStats(), this._loadMfaStats(), this._loadLateralStats(), this._loadResponderStats()]);
    this._loading = false;
  }

  private async _loadCredentialStats() {
    this._credentialStats = await this._apiCall('itdr.credential.stats');
    this._credentialDetections = await this._apiCall('itdr.credential.detections', { limit: 15 }) || [];
  }

  private async _loadMfaStats() {
    this._mfaStats = await this._apiCall('itdr.mfa.stats');
    this._mfaDetections = await this._apiCall('itdr.mfa.detections', { limit: 15 }) || [];
  }

  private async _loadLateralStats() {
    this._lateralStats = await this._apiCall('itdr.lateral.stats');
    this._lateralDetections = await this._apiCall('itdr.lateral.detections', { limit: 15 }) || [];
  }

  private async _loadResponderStats() {
    this._responderStats = await this._apiCall('itdr.responder.stats');
    this._responderExecutions = await this._apiCall('itdr.responder.execution.list', { limit: 10 }) || [];
    this._policies = await this._apiCall('itdr.responder.policy.list') || [];
  }

  private async _checkIpReputation() {
    this._ipResult = await this._apiCall('itdr.credential.ip-reputation', { ip: this._ipInput });
  }

  private async _checkCompromised() {
    this._compromisedResult = await this._apiCall('itdr.credential.compromised-check', { userId: this._userInput });
  }

  private _setActiveTab(tab: 'credential' | 'mfa' | 'lateral' | 'responder') {
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

  private _renderCredentialTab() {
    const stats = this._credentialStats;
    const byAttackType = stats?.byAttackType ? Object.entries(stats.byAttackType).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: (v as number) > 5 ? 'critical' : 'high' })) : [];
    const bySeverity = stats?.bySeverity ? Object.entries(stats.bySeverity).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: k })) : [];

    return html`
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">总登录尝试</div><div class="kpi-value kpi-accent">${stats?.totalAttempts || 0}</div></div>
        <div class="kpi"><div class="kpi-label">总检测</div><div class="kpi-value kpi-high">${stats?.totalDetections || 0}</div></div>
        <div class="kpi"><div class="kpi-label">被阻断</div><div class="kpi-value kpi-critical">${stats?.blockedAttempts || 0}</div></div>
        <div class="kpi"><div class="kpi-label">受损凭证</div><div class="kpi-value kpi-low">${stats?.compromisedCredentials || 0}</div></div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-title">📊 按攻击类型</div>
          ${this._renderBarChart(byAttackType)}
        </div>
        <div class="panel">
          <div class="panel-title">⚠️ 按严重性</div>
          ${this._renderBarChart(bySeverity)}
        </div>
      </div>

      <div class="grid-3">
        <div class="panel">
          <div class="panel-title">🚨 凭证检测 (${this._credentialDetections.length})</div>
          <div class="list">
            ${this._credentialDetections.length === 0 ? html`<div class="empty">暂无检测</div>` : this._credentialDetections.map((d: any) => html`
              <div class="list-item ${d.severity}">
                <span class="badge badge-${d.severity}">${d.severity}</span>
                <div style="flex: 1;">
                  <div style="font-weight: 600;">${d.attackType}</div>
                  <div class="list-meta">${d.title}</div>
                  <div class="list-meta" style="margin-top: 2px;">${d.description?.substring(0, 80)}</div>
                  <div class="list-meta">用户数: <span class="code">${d.userIds?.length || 0}</span> · IP: <span class="code">${d.sourceIp || 'n/a'}</span></div>
                </div>
                <span class="badge badge-${d.recommendedAction === 'block_ip' || d.recommendedAction === 'disable_account' || d.recommendedAction === 'force_password_reset' ? 'critical' : d.recommendedAction === 'require_mfa' ? 'high' : 'medium'}">${d.recommendedAction}</span>
              </div>
            `)}
          </div>
        </div>

        <div>
          <div class="test-panel">
            <div class="panel-title">🕵️ IP 信誉查询</div>
            <input .value=${this._ipInput} @input=${(e: any) => this._ipInput = e.target.value} />
            <div class="btn-row">
              <button class="btn" @click=${this._checkIpReputation} ?disabled=${this._loading}>查询</button>
            </div>
            ${this._ipResult ? html`
              <div class="result-block">
                <div>IP: <span class="code">${this._ipResult.ip}</span></div>
                <div>信誉: <span class="badge badge-${this._ipResult.reputation === 'malicious' ? 'critical' : this._ipResult.reputation === 'suspicious' ? 'high' : 'low'}">${this._ipResult.reputation}</span> 评分: ${this._ipResult.score}</div>
                <div class="list-meta" style="margin-top: 4px;">Tor: ${this._ipResult.isTor ? '✅' : '❌'} · VPN: ${this._ipResult.isVpn ? '✅' : '❌'} · 代理: ${this._ipResult.isProxy ? '✅' : '❌'} · 数据中心: ${this._ipResult.isDatacenter ? '✅' : '❌'}</div>
                <div class="list-meta">国家: ${this._ipResult.country || '?'} · ASN: ${this._ipResult.asn || '?'} · ISP: ${this._ipResult.isp || '?'}</div>
              </div>
            ` : ''}
          </div>

          <div class="test-panel">
            <div class="panel-title">🔐 受损凭证查询</div>
            <input .value=${this._userInput} @input=${(e: any) => this._userInput = e.target.value} />
            <div class="btn-row">
              <button class="btn" @click=${this._checkCompromised} ?disabled=${this._loading}>查询</button>
            </div>
            ${this._compromisedResult ? html`
              <div class="result-block">
                <div>用户 <span class="code">${this._userInput}</span> 的受损凭证: <span class="badge badge-${this._compromisedResult.length > 0 ? 'critical' : 'low'}">${this._compromisedResult.length}</span></div>
                ${(this._compromisedResult || []).slice(0, 3).map((c: any) => html`
                  <div class="list-meta" style="margin-top: 4px;">${c.source} · ${c.severity} · ${c.passwordReset ? '✅ 已重置' : '⚠️ 未重置'}</div>
                `)}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  private _renderMfaTab() {
    const stats = this._mfaStats;
    const byAttackType = stats?.byAttackType ? Object.entries(stats.byAttackType).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: (v as number) > 3 ? 'critical' : 'high' })) : [];
    const byMethod = stats?.byMethod ? Object.entries(stats.byMethod).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number })) : [];
    const successRate = stats?.successRate !== undefined ? (stats.successRate * 100).toFixed(1) : '0';

    return html`
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">MFA 挑战数</div><div class="kpi-value kpi-accent">${stats?.totalChallenges || 0}</div></div>
        <div class="kpi"><div class="kpi-label">MFA 攻击检测</div><div class="kpi-value kpi-high">${stats?.totalDetections || 0}</div></div>
        <div class="kpi"><div class="kpi-label">成功率</div><div class="kpi-value kpi-low">${successRate}%</div></div>
        <div class="kpi"><div class="kpi-label">SIM Swap 指标</div><div class="kpi-value kpi-critical">${stats?.simSwapIndicators || 0}</div></div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-title">📊 按 MFA 攻击类型</div>
          ${this._renderBarChart(byAttackType)}
        </div>
        <div class="panel">
          <div class="panel-title">🔐 按 MFA 方法</div>
          ${this._renderBarChart(byMethod)}
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">🚨 MFA 攻击检测 (${this._mfaDetections.length})</div>
        <div class="list">
          ${this._mfaDetections.length === 0 ? html`<div class="empty">暂无检测</div>` : this._mfaDetections.map((d: any) => html`
            <div class="list-item ${d.severity}">
              <span class="badge badge-${d.severity}">${d.severity}</span>
              <div style="flex: 1;">
                <div style="font-weight: 600;">${d.attackType}</div>
                <div class="list-meta">${d.title}</div>
                <div class="list-meta" style="margin-top: 2px;">${d.description?.substring(0, 80)}</div>
                <div class="list-meta">用户: <span class="code">${d.userId}</span> · 方法: <span class="code">${d.method}</span> · 挑战数: ${d.attemptCount}</div>
              </div>
              <span class="badge badge-${d.recommendation === 'block' || d.recommendation === 'lock_account' ? 'critical' : d.recommendation === 'force_reenroll' ? 'high' : 'medium'}">${d.recommendation}</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderLateralTab() {
    const stats = this._lateralStats;
    const byTechnique = stats?.byTechnique ? Object.entries(stats.byTechnique).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: (v as number) > 0 ? 'critical' : 'high' })) : [];
    const bySeverity = stats?.bySeverity ? Object.entries(stats.bySeverity).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: k })) : [];

    return html`
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">认证事件数</div><div class="kpi-value kpi-accent">${stats?.totalEvents || 0}</div></div>
        <div class="kpi"><div class="kpi-label">横向移动检测</div><div class="kpi-value kpi-high">${stats?.totalDetections || 0}</div></div>
        <div class="kpi"><div class="kpi-label">攻击路径</div><div class="kpi-value kpi-critical">${stats?.attackPaths || 0}</div></div>
        <div class="kpi"><div class="kpi-label">已隔离主机</div><div class="kpi-value kpi-low">${stats?.isolatedHosts || 0}</div></div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-title">🎯 按 AD 攻击技术</div>
          ${this._renderBarChart(byTechnique)}
        </div>
        <div class="panel">
          <div class="panel-title">⚠️ 按严重性</div>
          ${this._renderBarChart(bySeverity)}
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">🕸️ 横向移动检测 (${this._lateralDetections.length})</div>
        <div class="list">
          ${this._lateralDetections.length === 0 ? html`<div class="empty">暂无检测</div>` : this._lateralDetections.map((d: any) => html`
            <div class="list-item ${d.severity}">
              <span class="badge badge-${d.severity}">${d.severity}</span>
              <div style="flex: 1;">
                <div style="font-weight: 600;">${d.technique}</div>
                <div class="list-meta">${d.title}</div>
                <div class="list-meta" style="margin-top: 2px;">${d.description?.substring(0, 80)}</div>
                <div class="list-meta">用户: <span class="code">${d.userId}</span> · 主机: <span class="code">${d.sourceHost}</span> · 目标: ${d.targetHosts?.length || 0}</div>
                ${d.mitreTechnique ? html`<div class="mitre">MITRE: ${d.mitreTechnique} · ${d.mitreTactic}</div>` : ''}
              </div>
              <span class="badge badge-${d.recommendedAction === 'isolate_host' || d.recommendedAction === 'disable_account' || d.recommendedAction === 'revoke_tickets' ? 'critical' : d.recommendedAction === 'force_password_reset' || d.recommendedAction === 'alert_soc' ? 'high' : 'medium'}">${d.recommendedAction}</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderResponderTab() {
    const stats = this._responderStats;
    const byStatus = stats?.byStatus ? Object.entries(stats.byStatus).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: k === 'failed' ? 'critical' : k === 'pending' ? 'high' : '' })) : [];
    const byAction = stats?.byAction ? Object.entries(stats.byAction).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number })) : [];

    return html`
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">总策略数</div><div class="kpi-value kpi-accent">${stats?.totalPolicies || 0}</div></div>
        <div class="kpi"><div class="kpi-label">活跃策略</div><div class="kpi-value kpi-low">${stats?.activePolicies || 0}</div></div>
        <div class="kpi"><div class="kpi-label">总执行数</div><div class="kpi-value kpi-high">${stats?.totalExecutions || 0}</div></div>
        <div class="kpi"><div class="kpi-label">成功率</div><div class="kpi-value kpi-low">${((stats?.successRate || 0) * 100).toFixed(1)}%</div></div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-title">📊 按执行状态</div>
          ${this._renderBarChart(byStatus)}
        </div>
        <div class="panel">
          <div class="panel-title">🎯 按动作类型</div>
          ${this._renderBarChart(byAction)}
        </div>
      </div>

      <div class="grid-3">
        <div class="panel">
          <div class="panel-title">⚙️ 响应策略 (${this._policies.length})</div>
          <div class="list">
            ${this._policies.length === 0 ? html`<div class="empty">暂无策略</div>` : this._policies.map((p: any) => html`
              <div class="list-item">
                <div style="flex: 1;">
                  <div style="font-weight: 600;">${p.name}</div>
                  <div class="list-meta">${p.trigger?.threatType} · ${p.trigger?.severity || 'any'} · 触发 ${p.triggerCount || 0} 次</div>
                  <div class="list-meta" style="margin-top: 2px;">动作: ${(p.actions || []).join(', ')}</div>
                </div>
                <span class="badge badge-${p.requiresApproval ? 'high' : 'low'}">${p.requiresApproval ? '需审批' : '自动'}</span>
              </div>
            `)}
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">🛡️ 最近执行 (${this._responderExecutions.length})</div>
          <div class="list">
            ${this._responderExecutions.length === 0 ? html`<div class="empty">暂无执行</div>` : this._responderExecutions.map((e: any) => html`
              <div class="list-item ${e.severity}">
                <span class="badge badge-${e.status === 'completed' ? 'low' : e.status === 'failed' ? 'critical' : 'medium'}">${e.status}</span>
                <div style="flex: 1;">
                  <div style="font-weight: 600;">${e.threatType}</div>
                  <div class="list-meta">${e.policyName}</div>
                  <div class="list-meta" style="margin-top: 2px;">动作数: ${e.actions?.length || 0} · 用户: ${e.userId || 'n/a'}</div>
                </div>
                <div class="list-meta">${new Date(e.triggeredAt).toLocaleTimeString()}</div>
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
          <div class="title">🛡️ ITDR — Identity Threat Detection & Response</div>
          <div class="subtitle">凭证滥用 · MFA 攻击 · 横向移动 · 自动化响应</div>
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
        <div class="tab ${this._activeTab === 'credential' ? 'active' : ''}" @click=${() => this._setActiveTab('credential')}>🔑 凭证滥用</div>
        <div class="tab ${this._activeTab === 'mfa' ? 'active' : ''}" @click=${() => this._setActiveTab('mfa')}>📱 MFA 攻击</div>
        <div class="tab ${this._activeTab === 'lateral' ? 'active' : ''}" @click=${() => this._setActiveTab('lateral')}>🕸️ 横向移动</div>
        <div class="tab ${this._activeTab === 'responder' ? 'active' : ''}" @click=${() => this._setActiveTab('responder')}>⚡ 响应引擎</div>
      </div>

      ${this._activeTab === 'credential' ? this._renderCredentialTab() : this._activeTab === 'mfa' ? this._renderMfaTab() : this._activeTab === 'lateral' ? this._renderLateralTab() : this._renderResponderTab()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-itdr-dashboard': ScItrdDashboard;
  }
}

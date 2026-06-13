import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-dspm-dashboard')
export class ScDspmDashboard extends LitElement {
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
    .badge-public { background: rgba(34, 197, 94, 0.2); color: var(--sc-low); }
    .badge-internal { background: rgba(59, 130, 246, 0.2); color: var(--sc-medium); }
    .badge-confidential { background: rgba(245, 158, 11, 0.2); color: var(--sc-high); }
    .badge-restricted { background: rgba(239, 68, 68, 0.2); color: var(--sc-critical); }
    .badge-top_secret { background: rgba(168, 85, 247, 0.2); color: #a855f7; }
    .list { display: flex; flex-direction: column; gap: 6px; max-height: 400px; overflow-y: auto; }
    .list-item { display: flex; gap: 8px; padding: 8px 10px; background: var(--sc-bg-tertiary); border-radius: 4px; font-size: 11px; }
    .list-item.critical { border-left: 3px solid var(--sc-critical); }
    .list-item.high { border-left: 3px solid var(--sc-high); }
    .list-item.medium { border-left: 3px solid var(--sc-medium); }
    .list-meta { color: var(--sc-text-muted); font-size: 10px; }
    .test-panel { background: var(--sc-bg-secondary); border: 1px solid var(--sc-border); border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    textarea { width: 100%; padding: 8px; background: var(--sc-bg-tertiary); border: 1px solid var(--sc-border); border-radius: 4px; color: var(--sc-text-primary); font-family: 'SF Mono', Monaco, monospace; font-size: 11px; min-height: 60px; resize: vertical; }
    .btn { padding: 6px 14px; background: var(--sc-primary); color: #0f172a; border: none; border-radius: 4px; font-weight: 600; font-size: 11px; cursor: pointer; }
    .btn:hover { background: #00bfe6; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-row { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
    .code { font-family: 'SF Mono', Monaco, monospace; color: var(--sc-text-secondary); background: var(--sc-bg-primary); padding: 2px 4px; border-radius: 2px; }
    .empty { padding: 20px; text-align: center; color: var(--sc-text-muted); font-size: 11px; }
  `;

  @state() private _activeTab: 'assets' | 'access' | 'residency' | 'flow' = 'assets';
  @state() private _assetStats: any = null;
  @state() private _accessStats: any = null;
  @state() private _residencyStats: any = null;
  @state() private _flowStats: any = null;
  @state() private _assets: any[] = [];
  @state() private _anomalies: any[] = [];
  @state() private _violations: any[] = [];
  @state() private _flows: any[] = [];
  @state() private _policies: any[] = [];
  @state() private _sampleInput = "Email: john@example.com, Phone: 13812345678, ID: 110101199003078811, Card: 4111-1111-1111-1111, diagnosis: hypertension";
  @state() private _sampleResult: any = null;
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
    await Promise.all([this._loadAssetStats(), this._loadAccessStats(), this._loadResidencyStats(), this._loadFlowStats()]);
    this._loading = false;
  }

  private async _loadAssetStats() {
    this._assetStats = await this._apiCall('dspm.asset.stats');
    this._assets = await this._apiCall('dspm.asset.list', { limit: 10, minRiskScore: 0 }) || [];
  }

  private async _loadAccessStats() {
    this._accessStats = await this._apiCall('dspm.access.stats');
    this._anomalies = await this._apiCall('dspm.access.anomalies', { limit: 10 }) || [];
  }

  private async _loadResidencyStats() {
    this._residencyStats = await this._apiCall('dspm.residency.stats');
    this._policies = await this._apiCall('dspm.residency.policy.list') || [];
    this._violations = await this._apiCall('dspm.residency.violations', { limit: 10 }) || [];
  }

  private async _loadFlowStats() {
    this._flowStats = await this._apiCall('dspm.flow.stats');
    this._flows = await this._apiCall('dspm.flow.list', { limit: 10 }) || [];
  }

  private async _handleScanSample() {
    this._sampleResult = await this._apiCall('dspm.asset.scan-sample', { sample: this._sampleInput });
  }

  private async _handleInitDefaults() {
    const policies = await this._apiCall('dspm.residency.policy.init-defaults');
    if (policies) {
      this._policies = policies;
      await this._loadResidencyStats();
    }
  }

  private _setActiveTab(tab: 'assets' | 'access' | 'residency' | 'flow') {
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

  private _renderAssetsTab() {
    const stats = this._assetStats;
    const byClassification = stats?.byClassification ? Object.entries(stats.byClassification).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: k === 'top_secret' || k === 'restricted' ? 'critical' : k === 'confidential' ? 'high' : '' })) : [];
    const byEncryption = stats?.byEncryption ? Object.entries(stats.byEncryption).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: k === 'unencrypted' ? 'critical' : k === 'unknown' ? 'high' : '' })) : [];
    const byType = stats?.byType ? Object.entries(stats.byType).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number })) : [];

    return html`
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">总资产</div><div class="kpi-value kpi-accent">${stats?.totalAssets || 0}</div></div>
        <div class="kpi"><div class="kpi-label">高风险</div><div class="kpi-value kpi-critical">${stats?.highRiskCount || 0}</div></div>
        <div class="kpi"><div class="kpi-label">未加密 PII</div><div class="kpi-value kpi-high">${stats?.unencryptedPii || 0}</div></div>
        <div class="kpi"><div class="kpi-label">公开访问 PII</div><div class="kpi-value kpi-low">${stats?.publicAccessPii || 0}</div></div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-title">🏷️ 按敏感级别</div>
          ${this._renderBarChart(byClassification)}
        </div>
        <div class="panel">
          <div class="panel-title">🔐 按加密状态</div>
          ${this._renderBarChart(byEncryption)}
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">📦 按资产类型</div>
        ${this._renderBarChart(byType)}
      </div>

      <div class="grid-3">
        <div class="panel">
          <div class="panel-title">⚠️ 顶级风险资产 (${this._assets.length})</div>
          <div class="list">
            ${this._assets.length === 0 ? html`<div class="empty">暂无资产</div>` : this._assets.map((a: any) => html`
              <div class="list-item">
                <span class="badge badge-${a.classification}">${a.classification}</span>
                <div style="flex: 1;">
                  <div style="font-weight: 600;">${a.name}</div>
                  <div class="list-meta">${a.type} · ${a.region || 'no-region'} · ${(a.sizeBytes / 1_000_000).toFixed(1)}MB</div>
                </div>
                <span class="badge badge-${a.riskScore >= 70 ? 'critical' : a.riskScore >= 40 ? 'high' : 'medium'}">${a.riskScore}</span>
              </div>
            `)}
          </div>
        </div>

        <div class="test-panel">
          <div class="panel-title">🧪 扫描数据样本</div>
          <textarea .value=${this._sampleInput} @input=${(e: any) => this._sampleInput = e.target.value}></textarea>
          <div class="btn-row">
            <button class="btn" @click=${this._handleScanSample} ?disabled=${this._loading}>🔍 扫描</button>
          </div>
          ${this._sampleResult ? html`
            <div class="list" style="margin-top: 10px;">
              <div class="list-item">
                <div style="flex: 1;">
                  <div>建议分类: <span class="badge badge-${this._sampleResult.recommendedClassification}">${this._sampleResult.recommendedClassification}</span></div>
                  <div class="list-meta" style="margin-top: 4px;">PII: ${(this._sampleResult.piiTypes || []).join(', ') || '无'}</div>
                  <div class="list-meta">PHI: ${this._sampleResult.phi ? '✅' : '❌'} · PCI: ${this._sampleResult.pci ? '✅' : '❌'}</div>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private _renderAccessTab() {
    const stats = this._accessStats;
    const byAction = stats?.byAction ? Object.entries(stats.byAction).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number })) : [];
    const bySubject = stats?.bySubject ? Object.entries(stats.bySubject).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number })) : [];
    const byAnomalyType = stats?.byAnomalyType ? Object.entries(stats.byAnomalyType).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: v as number > 5 ? 'critical' : 'high' })) : [];

    return html`
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">总访问事件</div><div class="kpi-value kpi-accent">${stats?.totalEvents || 0}</div></div>
        <div class="kpi"><div class="kpi-label">异常数</div><div class="kpi-value kpi-high">${stats?.totalAnomalies || 0}</div></div>
        <div class="kpi"><div class="kpi-label">未授权访问</div><div class="kpi-value kpi-critical">${stats?.unapprovedAccess || 0}</div></div>
        <div class="kpi"><div class="kpi-label">跨境访问</div><div class="kpi-value kpi-low">${stats?.crossBorderAccess || 0}</div></div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-title">📊 按动作</div>
          ${this._renderBarChart(byAction)}
        </div>
        <div class="panel">
          <div class="panel-title">👤 按主体类型</div>
          ${this._renderBarChart(bySubject)}
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">🚨 按异常类型</div>
        ${this._renderBarChart(byAnomalyType)}
      </div>

      <div class="grid-3">
        <div class="panel">
          <div class="panel-title">🔍 最近异常 (${this._anomalies.length})</div>
          <div class="list">
            ${this._anomalies.length === 0 ? html`<div class="empty">暂无异常</div>` : this._anomalies.map((a: any) => html`
              <div class="list-item severity-${a.severity}">
                <span class="badge badge-${a.severity}">${a.severity}</span>
                <div style="flex: 1;">
                  <div style="font-weight: 600;">${a.anomalyType}</div>
                  <div class="list-meta">${a.subjectId} · ${a.description?.substring(0, 80)}</div>
                </div>
                <span class="badge badge-${a.recommendedAction === 'block' ? 'critical' : a.recommendedAction === 'alert' ? 'high' : 'medium'}">${a.recommendedAction}</span>
              </div>
            `)}
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">🏆 顶级主体</div>
          <div class="list">
            ${(stats?.topSubjects || []).length === 0 ? html`<div class="empty">暂无</div>` : (stats.topSubjects || []).map((s: any) => html`
              <div class="list-item">
                <div style="flex: 1;">
                  <div class="code">${s.subjectId}</div>
                  <div class="list-meta">${s.events} 事件 · ${s.anomalies} 异常</div>
                </div>
              </div>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  private _renderResidencyTab() {
    const stats = this._residencyStats;
    const byFramework = stats?.byFramework ? Object.entries(stats.byFramework).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: v as number > 5 ? 'critical' : 'high' })) : [];
    const bySeverity = stats?.bySeverity ? Object.entries(stats.bySeverity).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: k })) : [];

    return html`
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">策略数</div><div class="kpi-value kpi-accent">${stats?.totalPolicies || 0}</div></div>
        <div class="kpi"><div class="kpi-label">未处理违规</div><div class="kpi-value kpi-high">${stats?.openViolations || 0}</div></div>
        <div class="kpi"><div class="kpi-label">严重违规</div><div class="kpi-value kpi-critical">${stats?.criticalViolations || 0}</div></div>
        <div class="kpi"><div class="kpi-label">罚款估算</div><div class="kpi-value kpi-low">¥${(stats?.finesEstimate || 0).toFixed(0)}M</div></div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-title">📜 按合规框架</div>
          ${this._renderBarChart(byFramework)}
        </div>
        <div class="panel">
          <div class="panel-title">⚠️ 按严重性</div>
          ${this._renderBarChart(bySeverity)}
        </div>
      </div>

      <div class="grid-3">
        <div class="panel">
          <div class="panel-title">📋 居住地策略 (${this._policies.length})</div>
          <div class="list">
            ${this._policies.length === 0 ? html`
              <div class="empty">
                <div>暂无策略</div>
                <button class="btn" style="margin-top: 8px;" @click=${this._handleInitDefaults}>+ 加载默认策略</button>
              </div>
            ` : this._policies.map((p: any) => html`
              <div class="list-item">
                <div style="flex: 1;">
                  <div style="font-weight: 600;">${p.name}</div>
                  <div class="list-meta">${p.framework} · ${p.enforcementLevel} · ${p.dataClassification}</div>
                  <div class="list-meta" style="margin-top: 2px;">${p.allowedRegions.length} 允许区域 · ${p.blockedRegions.length} 禁止区域</div>
                </div>
                <span class="badge badge-${p.enforcementLevel === 'blocking' ? 'critical' : p.enforcementLevel === 'warning' ? 'high' : 'medium'}">${p.enforcementLevel}</span>
              </div>
            `)}
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">🚨 居住地违规 (${this._violations.length})</div>
          <div class="list">
            ${this._violations.length === 0 ? html`<div class="empty">暂无违规</div>` : this._violations.map((v: any) => html`
              <div class="list-item severity-${v.severity}">
                <span class="badge badge-${v.severity}">${v.severity}</span>
                <div style="flex: 1;">
                  <div style="font-weight: 600;">${v.framework}</div>
                  <div class="list-meta">${v.policyName}</div>
                  <div class="list-meta" style="margin-top: 2px;">${v.assetName} · ${v.currentRegion}/${v.currentCountry || '?'}</div>
                  <div class="list-meta">罚款: ${v.fine || 'N/A'}</div>
                </div>
              </div>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  private _renderFlowTab() {
    const stats = this._flowStats;
    const byFlowType = stats?.byFlowType ? Object.entries(stats.byFlowType).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number })) : [];
    const byStatus = stats?.byStatus ? Object.entries(stats.byStatus).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: k === 'failed' ? 'critical' : k === 'rate_limited' ? 'high' : '' })) : [];
    const byEncryption = stats?.byEncryption ? Object.entries(stats.byEncryption).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: k === 'none' ? 'critical' : k === 'tls' ? 'medium' : '' })) : [];

    return html`
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">总流</div><div class="kpi-value kpi-accent">${stats?.totalFlows || 0}</div></div>
        <div class="kpi"><div class="kpi-label">活跃</div><div class="kpi-value kpi-low">${stats?.activeFlows || 0}</div></div>
        <div class="kpi"><div class="kpi-label">失败</div><div class="kpi-value kpi-critical">${stats?.failedFlows || 0}</div></div>
        <div class="kpi"><div class="kpi-label">跨区域</div><div class="kpi-value kpi-high">${stats?.crossRegionFlows || 0}</div></div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-title">🔄 按流类型</div>
          ${this._renderBarChart(byFlowType)}
        </div>
        <div class="panel">
          <div class="panel-title">📊 按状态</div>
          ${this._renderBarChart(byStatus)}
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">🔐 按加密</div>
        ${this._renderBarChart(byEncryption)}
      </div>

      <div class="panel">
        <div class="panel-title">🌐 数据流 (${this._flows.length})</div>
        <div class="list">
          ${this._flows.length === 0 ? html`<div class="empty">暂无数据流</div>` : this._flows.map((f: any) => html`
            <div class="list-item">
              <div style="flex: 1;">
                <div style="font-weight: 600;">${f.name} <span class="badge badge-${f.status === 'active' ? 'low' : f.status === 'failed' ? 'critical' : 'medium'}">${f.status}</span></div>
                <div class="list-meta">${f.sourceRegion} → ${f.destinationRegion}${f.destinationCloud ? ' (' + f.destinationCloud + ')' : ''}</div>
                <div class="list-meta" style="margin-top: 2px;">${f.encryption} · ${f.flowType} · ${(f.recordsPerRun || 0).toLocaleString()} records/run</div>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <div class="header">
        <div>
          <div class="title">💾 DSPM — Data Security Posture Management</div>
          <div class="subtitle">数据资产发现 · 访问分析 · 居住地合规 · 数据流监控</div>
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
        <div class="tab ${this._activeTab === 'assets' ? 'active' : ''}" @click=${() => this._setActiveTab('assets')}>📦 数据资产</div>
        <div class="tab ${this._activeTab === 'access' ? 'active' : ''}" @click=${() => this._setActiveTab('access')}>👁️ 访问分析</div>
        <div class="tab ${this._activeTab === 'residency' ? 'active' : ''}" @click=${() => this._setActiveTab('residency')}>🌍 数据居住地</div>
        <div class="tab ${this._activeTab === 'flow' ? 'active' : ''}" @click=${() => this._setActiveTab('flow')}>🌊 数据流</div>
      </div>

      ${this._activeTab === 'assets' ? this._renderAssetsTab() : this._activeTab === 'access' ? this._renderAccessTab() : this._activeTab === 'residency' ? this._renderResidencyTab() : this._renderFlowTab()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-dspm-dashboard': ScDspmDashboard;
  }
}

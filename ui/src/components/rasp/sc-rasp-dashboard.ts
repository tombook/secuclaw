import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-rasp-dashboard')
export class ScRaspDashboard extends LitElement {
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
    .bar-row { display: grid; grid-template-columns: 120px 1fr 50px; gap: 8px; align-items: center; font-size: 11px; }
    .bar-label { color: var(--sc-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bar-track { height: 20px; background: var(--sc-bg-tertiary); border-radius: 3px; overflow: hidden; position: relative; }
    .bar-fill { height: 100%; background: linear-gradient(90deg, var(--sc-primary), var(--sc-info)); transition: width 0.3s; }
    .bar-fill.critical { background: linear-gradient(90deg, var(--sc-critical), #f87171); }
    .bar-fill.high { background: linear-gradient(90deg, var(--sc-high), #fbbf24); }
    .bar-fill.medium { background: linear-gradient(90deg, var(--sc-medium), #60a5fa); }
    .bar-fill.low { background: linear-gradient(90deg, var(--sc-low), #4ade80); }
    .bar-value { text-align: right; font-weight: 600; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
    .badge-critical { background: rgba(239, 68, 68, 0.2); color: var(--sc-critical); }
    .badge-high { background: rgba(245, 158, 11, 0.2); color: var(--sc-high); }
    .badge-medium { background: rgba(59, 130, 246, 0.2); color: var(--sc-medium); }
    .badge-low { background: rgba(34, 197, 94, 0.2); color: var(--sc-low); }
    .badge-info { background: rgba(107, 114, 128, 0.2); color: var(--sc-text-muted); }
    .badge-block { background: rgba(239, 68, 68, 0.2); color: var(--sc-critical); }
    .badge-sanitize { background: rgba(245, 158, 11, 0.2); color: var(--sc-high); }
    .badge-log { background: rgba(107, 114, 128, 0.2); color: var(--sc-text-muted); }
    .list { display: flex; flex-direction: column; gap: 6px; max-height: 360px; overflow-y: auto; }
    .list-item { display: flex; gap: 8px; padding: 8px 10px; background: var(--sc-bg-tertiary); border-radius: 4px; font-size: 11px; }
    .list-item.severity-critical { border-left: 3px solid var(--sc-critical); }
    .list-item.severity-high { border-left: 3px solid var(--sc-high); }
    .list-item.severity-medium { border-left: 3px solid var(--sc-medium); }
    .list-item.severity-low { border-left: 3px solid var(--sc-low); }
    .list-meta { color: var(--sc-text-muted); font-size: 10px; }
    .test-panel { background: var(--sc-bg-secondary); border: 1px solid var(--sc-border); border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    textarea, select, input { width: 100%; padding: 8px; background: var(--sc-bg-tertiary); border: 1px solid var(--sc-border); border-radius: 4px; color: var(--sc-text-primary); font-family: 'SF Mono', Monaco, monospace; font-size: 11px; }
    textarea { min-height: 60px; resize: vertical; }
    .btn { padding: 6px 14px; background: var(--sc-primary); color: #0f172a; border: none; border-radius: 4px; font-weight: 600; font-size: 11px; cursor: pointer; }
    .btn:hover { background: #00bfe6; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-row { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
    .result-block { margin-top: 10px; padding: 10px; background: var(--sc-bg-tertiary); border-radius: 4px; font-size: 11px; }
    .code { font-family: 'SF Mono', Monaco, monospace; color: var(--sc-text-secondary); background: var(--sc-bg-primary); padding: 2px 4px; border-radius: 2px; }
    .empty { padding: 20px; text-align: center; color: var(--sc-text-muted); font-size: 11px; }
    .filter-row { display: flex; gap: 8px; margin-bottom: 10px; }
  `;

  @state() private _activeTab: 'sql' | 'xss' | 'abuse' = 'sql';
  @state() private _sqlStats: any = null;
  @state() private _xssStats: any = null;
  @state() private _abuseStats: any = null;
  @state() private _abuseDetections: any[] = [];
  @state() private _sqlTestInput = "1' OR '1'='1' UNION SELECT password FROM users--";
  @state() private _sqlTestDb = 'mysql';
  @state() private _sqlTestResult: any = null;
  @state() private _xssTestInput = '<script>alert("xss")</script><img src=x onerror=alert(1)>';
  @state() private _xssTestCtx = 'html_body';
  @state() private _xssTestResult: any = null;
  @state() private _xssSanitizeInput = '<script>alert(1)</script>';
  @state() private _xssSanitizeCtx = 'html_body';
  @state() private _xssSanitizeResult: any = null;
  @state() private _loading = false;

  connectedCallback() {
    super.connectedCallback();
    this._loadAllStats();
  }

  private async _loadAllStats() {
    this._loading = true;
    await Promise.all([this._loadSqlStats(), this._loadXssStats(), this._loadAbuseStats()]);
    this._loading = false;
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

  private async _loadSqlStats() {
    this._sqlStats = await this._apiCall('rasp.sql.stats');
  }

  private async _loadXssStats() {
    this._xssStats = await this._apiCall('rasp.xss.stats');
  }

  private async _loadAbuseStats() {
    const stats = await this._apiCall('rasp.abuse.stats');
    this._abuseStats = stats;
    if (stats) {
      this._abuseDetections = await this._apiCall('rasp.abuse.detections', { limit: 10 }) || [];
    }
  }

  private async _handleTestSql() {
    this._sqlTestResult = await this._apiCall('rasp.sql.inspect', {
      request: {
        id: 'test-' + Date.now(), timestamp: Date.now(), applicationId: 'dashboard-test',
        endpoint: '/api/test', method: 'GET', userId: null, sessionId: 's1', sourceIp: '127.0.0.1',
        userAgent: 'dashboard', parameters: { input: this._sqlTestInput }, query: null, database: this._sqlTestDb,
        context: { source: 'http', route: '/api/test', referer: null },
      },
    });
  }

  private async _handleTestXss() {
    this._xssTestResult = await this._apiCall('rasp.xss.inspect', {
      request: {
        id: 'test-' + Date.now(), timestamp: Date.now(), applicationId: 'dashboard-test',
        endpoint: '/api/test', method: 'POST', userId: null, sessionId: 's1', sourceIp: '127.0.0.1',
        userAgent: 'dashboard', parameters: { input: this._xssTestInput }, context: this._xssTestCtx,
        renderLocation: 'response_body', outputEncoding: 'none', metadata: {},
      },
    });
  }

  private async _handleSanitize() {
    this._xssSanitizeResult = await this._apiCall('rasp.xss.sanitize', {
      value: this._xssSanitizeInput, context: this._xssSanitizeCtx,
    });
  }

  private _setActiveTab(tab: 'sql' | 'xss' | 'abuse') {
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

  private _renderSqlTab() {
    const stats = this._sqlStats;
    const byAttackType = stats?.byAttackType ? Object.entries(stats.byAttackType).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: (v as number) > 50 ? 'critical' : 'high' })) : [];
    const bySeverity = stats?.bySeverity ? Object.entries(stats.bySeverity).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: k })) : [];
    const byAction = stats?.byAction ? Object.entries(stats.byAction).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number })) : [];

    return html`
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">总检测数</div><div class="kpi-value kpi-accent">${stats?.totalRequests || 0}</div></div>
        <div class="kpi"><div class="kpi-label">已阻断</div><div class="kpi-value kpi-critical">${stats?.byAction?.block || 0}</div></div>
        <div class="kpi"><div class="kpi-label">严重发现</div><div class="kpi-value kpi-high">${(stats?.bySeverity?.critical || 0) + (stats?.bySeverity?.high || 0)}</div></div>
        <div class="kpi"><div class="kpi-label">平均检测时间</div><div class="kpi-value kpi-low">${(stats?.averageDetectionTimeMs || 0).toFixed(2)}ms</div></div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-title">📊 按攻击类型</div>
          ${this._renderBarChart(byAttackType)}
        </div>
        <div class="panel">
          <div class="panel-title">🛡️ 按动作</div>
          ${this._renderBarChart(byAction)}
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">⚠️ 按严重性</div>
        ${this._renderBarChart(bySeverity)}
      </div>

      <div class="test-panel">
        <div class="panel-title">🧪 测试 SQL 注入检测</div>
        <textarea .value=${this._sqlTestInput} @input=${(e: any) => this._sqlTestInput = e.target.value}></textarea>
        <div class="btn-row">
          <select .value=${this._sqlTestDb} @change=${(e: any) => this._sqlTestDb = e.target.value} style="width: 150px;">
            <option value="mysql">MySQL</option>
            <option value="postgres">PostgreSQL</option>
            <option value="oracle">Oracle</option>
            <option value="sqlserver">SQL Server</option>
            <option value="sqlite">SQLite</option>
          </select>
          <button class="btn" @click=${this._handleTestSql} ?disabled=${this._loading}>🔍 检测</button>
        </div>
        ${this._sqlTestResult ? html`
          <div class="result-block">
            <div>动作: <span class="badge badge-${this._sqlTestResult.action === 'block' ? 'block' : this._sqlTestResult.action === 'sanitize' ? 'sanitize' : 'log'}">${this._sqlTestResult.action}</span>
            允许: <span class="badge badge-${this._sqlTestResult.allowed ? 'low' : 'critical'}">${this._sqlTestResult.allowed ? 'yes' : 'no'}</span></div>
            <div style="margin-top: 6px;">发现 (${this._sqlTestResult.findings?.length || 0}):</div>
            ${(this._sqlTestResult.findings || []).map((f: any) => html`
              <div class="list-item severity-${f.severity}">
                <span class="badge badge-${f.severity}">${f.severity}</span>
                <span style="font-weight: 600;">${f.attackType}</span>
                <span class="code">${f.matchedValue?.substring(0, 40)}</span>
                <span class="list-meta">置信度: ${(f.confidence * 100).toFixed(0)}%</span>
              </div>
            `)}
          </div>
        ` : ''}
      </div>
    `;
  }

  private _renderXssTab() {
    const stats = this._xssStats;
    const byAttackType = stats?.byAttackType ? Object.entries(stats.byAttackType).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: (v as number) > 50 ? 'critical' : 'high' })) : [];
    const byContext = stats?.byContext ? Object.entries(stats.byContext).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number })) : [];
    const byAction = stats?.byAction ? Object.entries(stats.byAction).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number })) : [];

    return html`
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">总检测数</div><div class="kpi-value kpi-accent">${stats?.totalRequests || 0}</div></div>
        <div class="kpi"><div class="kpi-label">已净化</div><div class="kpi-value kpi-high">${stats?.byAction?.sanitize || 0}</div></div>
        <div class="kpi"><div class="kpi-label">已阻断</div><div class="kpi-value kpi-critical">${stats?.byAction?.block || 0}</div></div>
        <div class="kpi"><div class="kpi-label">存储型 XSS</div><div class="kpi-value kpi-low">${stats?.storedXssDetected || 0}</div></div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-title">📊 按攻击类型</div>
          ${this._renderBarChart(byAttackType)}
        </div>
        <div class="panel">
          <div class="panel-title">🎯 按上下文</div>
          ${this._renderBarChart(byContext)}
        </div>
      </div>

      <div class="test-panel">
        <div class="panel-title">🧪 测试 XSS 检测</div>
        <textarea .value=${this._xssTestInput} @input=${(e: any) => this._xssTestInput = e.target.value}></textarea>
        <div class="btn-row">
          <select .value=${this._xssTestCtx} @change=${(e: any) => this._xssTestCtx = e.target.value} style="width: 150px;">
            <option value="html_body">HTML Body</option>
            <option value="html_attribute">HTML Attribute</option>
            <option value="javascript">JavaScript</option>
            <option value="url">URL</option>
            <option value="css">CSS</option>
          </select>
          <button class="btn" @click=${this._handleTestXss} ?disabled=${this._loading}>🔍 检测</button>
        </div>
        ${this._xssTestResult ? html`
          <div class="result-block">
            <div>动作: <span class="badge badge-${this._xssTestResult.action === 'block' ? 'block' : this._xssTestResult.action === 'sanitize' ? 'sanitize' : 'log'}">${this._xssTestResult.action}</span></div>
            <div style="margin-top: 6px;">发现 (${this._xssTestResult.findings?.length || 0}):</div>
            ${(this._xssTestResult.findings || []).map((f: any) => html`
              <div class="list-item severity-${f.severity}">
                <span class="badge badge-${f.severity}">${f.severity}</span>
                <span style="font-weight: 600;">${f.attackType}</span>
                <span class="code">${f.matchedValue?.substring(0, 30)}</span>
                <span class="list-meta">${f.context}</span>
              </div>
            `)}
          </div>
        ` : ''}
      </div>

      <div class="test-panel">
        <div class="panel-title">🛡️ XSS 净化器</div>
        <textarea .value=${this._xssSanitizeInput} @input=${(e: any) => this._xssSanitizeInput = e.target.value}></textarea>
        <div class="btn-row">
          <select .value=${this._xssSanitizeCtx} @change=${(e: any) => this._xssSanitizeCtx = e.target.value} style="width: 150px;">
            <option value="html_body">HTML Body</option>
            <option value="html_attribute">HTML Attribute</option>
            <option value="javascript">JavaScript</option>
            <option value="url">URL</option>
          </select>
          <button class="btn" @click=${this._handleSanitize}>✨ 净化</button>
        </div>
        ${this._xssSanitizeResult ? html`
          <div class="result-block">
            <div>净化结果:</div>
            <div class="code" style="display: block; margin-top: 6px; padding: 8px; word-break: break-all;">${this._xssSanitizeResult.sanitized}</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private _renderAbuseTab() {
    const stats = this._abuseStats;
    const byType = stats?.byType ? Object.entries(stats.byType).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: (v as number) > 5 ? 'critical' : 'high' })) : [];
    const bySeverity = stats?.bySeverity ? Object.entries(stats.bySeverity).filter(([_, v]) => (v as number) > 0).map(([k, v]) => ({ label: k, value: v as number, severity: k })) : [];

    return html`
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">总请求</div><div class="kpi-value kpi-accent">${stats?.totalRequests || 0}</div></div>
        <div class="kpi"><div class="kpi-label">总检测</div><div class="kpi-value kpi-high">${stats?.totalDetections || 0}</div></div>
        <div class="kpi"><div class="kpi-label">阻断率</div><div class="kpi-value kpi-critical">${((stats?.blockRate || 0) * 100).toFixed(1)}%</div></div>
        <div class="kpi"><div class="kpi-label">唯一滥用者</div><div class="kpi-value kpi-low">${stats?.topAbusers?.length || 0}</div></div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-title">📊 按类型</div>
          ${this._renderBarChart(byType)}
        </div>
        <div class="panel">
          <div class="panel-title">⚠️ 按严重性</div>
          ${this._renderBarChart(bySeverity)}
        </div>
      </div>

      <div class="grid-3">
        <div class="panel">
          <div class="panel-title">🚨 最近检测 (${this._abuseDetections.length})</div>
          <div class="list">
            ${this._abuseDetections.length === 0 ? html`<div class="empty">暂无检测</div>` : this._abuseDetections.map((d: any) => html`
              <div class="list-item severity-${d.severity}">
                <span class="badge badge-${d.severity}">${d.severity}</span>
                <div style="flex: 1;">
                  <div style="font-weight: 600;">${d.type}</div>
                  <div class="list-meta">${d.subjectType}: <span class="code">${d.subjectId}</span> · ${d.actionTaken}</div>
                  <div class="list-meta" style="margin-top: 2px;">${d.description?.substring(0, 100)}</div>
                </div>
                <div class="list-meta">${new Date(d.timestamp).toLocaleTimeString()}</div>
              </div>
            `)}
          </div>
        </div>
        <div class="panel">
          <div class="panel-title">🏆 顶级滥用者</div>
          <div class="list">
            ${(stats?.topAbusers || []).length === 0 ? html`<div class="empty">暂无数据</div>` : (stats.topAbusers || []).map((u: any) => html`
              <div class="list-item">
                <div style="flex: 1;">
                  <div class="code">${u.subjectId}</div>
                  <div class="list-meta">${u.subjectType} · ${u.detections} 次检测</div>
                </div>
                <span class="badge badge-${u.riskScore >= 75 ? 'critical' : u.riskScore >= 50 ? 'high' : 'medium'}">${u.riskScore}</span>
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
          <div class="title">🛡️ RASP — Runtime Application Self-Protection</div>
          <div class="subtitle">SQL 注入拦截 · XSS 拦截 · API 滥用检测</div>
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
        <div class="tab ${this._activeTab === 'sql' ? 'active' : ''}" @click=${() => this._setActiveTab('sql')}>💉 SQL 注入</div>
        <div class="tab ${this._activeTab === 'xss' ? 'active' : ''}" @click=${() => this._setActiveTab('xss')}>🎯 XSS 拦截</div>
        <div class="tab ${this._activeTab === 'abuse' ? 'active' : ''}" @click=${() => this._setActiveTab('abuse')}>🚨 API 滥用</div>
      </div>

      ${this._activeTab === 'sql' ? this._renderSqlTab() : this._activeTab === 'xss' ? this._renderXssTab() : this._renderAbuseTab()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-rasp-dashboard': ScRaspDashboard;
  }
}

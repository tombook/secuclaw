import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-sigma-dashboard')
export class ScSigmaDashboard extends LitElement {
  static styles = css`
    :host { display: block; --sc-bg-primary: #0a0e17; --sc-bg-secondary: #141b26; --sc-text-primary: #ffffff; --sc-text-muted: #8899aa; --sc-border: #2a3a4a; --sc-primary: #00ff88; --sc-critical: #ff4444; --sc-high: #ffaa00; --sc-medium: #fbbf24; --sc-low: #00aaff; --sc-info: #10b981; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .dashboard { background: var(--sc-bg-primary); min-height: 100vh; color: var(--sc-text-primary); padding: 24px; font-family: Inter, system-ui, sans-serif; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--sc-border); }
    .title { font-size: 24px; font-weight: 700; color: var(--sc-primary); display: flex; align-items: center; gap: 12px; }
    .subtitle { font-size: 13px; color: var(--sc-text-muted); }
    .header-actions { display: flex; gap: 12px; }
    .btn { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--sc-border); background: var(--sc-bg-secondary); color: var(--sc-text-primary); font-size: 13px; cursor: pointer; transition: all 0.2s; font-family: inherit; }
    .btn:hover { border-color: var(--sc-primary); }
    .btn-primary { background: linear-gradient(135deg, var(--sc-primary), #00cc6a); color: var(--sc-bg-primary); border: none; font-weight: 600; }
    .btn-sm { padding: 4px 10px; font-size: 11px; }
    .btn-secondary { background: var(--sc-bg-primary); border: 1px solid var(--sc-border); }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: var(--sc-bg-secondary); border-radius: 12px; padding: 20px; border: 1px solid var(--sc-border); }
    .stat-icon { font-size: 22px; margin-bottom: 8px; }
    .stat-value { font-size: 32px; font-weight: 700; }
    .stat-label { font-size: 11px; color: var(--sc-text-muted); text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px; }
    .stat-trend { font-size: 11px; color: var(--sc-info); margin-top: 8px; }
    .main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 24px; }
    .card { background: var(--sc-bg-secondary); border-radius: 12px; padding: 20px; border: 1px solid var(--sc-border); margin-bottom: 20px; }
    .card:last-child { margin-bottom: 0; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--sc-border); }
    .card-title { font-size: 15px; font-weight: 600; color: var(--sc-text-primary); }
    .toolbar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
    .search-box { flex: 1; min-width: 200px; padding: 8px 12px; background: var(--sc-bg-primary); border: 1px solid var(--sc-border); border-radius: 8px; color: var(--sc-text-primary); font-size: 13px; font-family: inherit; }
    .search-box:focus { outline: none; border-color: var(--sc-primary); }
    .filter-group { display: flex; gap: 6px; flex-wrap: wrap; }
    .filter-btn { padding: 6px 12px; border-radius: 16px; border: 1px solid var(--sc-border); background: var(--sc-bg-primary); color: var(--sc-text-muted); font-size: 11px; cursor: pointer; text-transform: uppercase; font-weight: 600; font-family: inherit; transition: all 0.2s; }
    .filter-btn:hover { border-color: var(--sc-text-muted); color: var(--sc-text-primary); }
    .filter-btn.active { background: var(--sc-primary); color: var(--sc-bg-primary); border-color: var(--sc-primary); }
    .rules-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .rules-table th { text-align: left; padding: 10px 12px; background: var(--sc-bg-primary); color: var(--sc-text-muted); font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; border-bottom: 1px solid var(--sc-border); }
    .rules-table td { padding: 12px; border-bottom: 1px solid var(--sc-border); }
    .rules-table tr:hover { background: var(--sc-bg-primary); }
    .rule-title { font-weight: 600; color: var(--sc-text-primary); margin-bottom: 4px; }
    .rule-id { font-size: 10px; color: var(--sc-text-muted); font-family: monospace; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
    .level-critical { background: rgba(255,68,68,0.2); color: var(--sc-critical); }
    .level-high { background: rgba(255,170,0,0.2); color: var(--sc-high); }
    .level-medium { background: rgba(251,191,36,0.2); color: var(--sc-medium); }
    .level-low { background: rgba(0,170,255,0.2); color: var(--sc-low); }
    .level-informational { background: rgba(16,185,129,0.2); color: var(--sc-info); }
    .status-stable { background: rgba(16,185,129,0.2); color: var(--sc-info); }
    .status-test { background: rgba(251,191,36,0.2); color: var(--sc-medium); }
    .status-experimental { background: rgba(168,85,247,0.2); color: #a855f7; }
    .status-deprecated { background: rgba(255,68,68,0.2); color: var(--sc-critical); }
    .mitre-tags { display: flex; gap: 4px; flex-wrap: wrap; max-width: 240px; }
    .mitre-tag { font-size: 10px; padding: 2px 6px; background: var(--sc-bg-primary); border: 1px solid var(--sc-border); border-radius: 4px; color: var(--sc-low); font-family: monospace; }
    .last-modified { font-size: 11px; color: var(--sc-text-muted); }
    .stats-panel-section { margin-bottom: 24px; }
    .stats-panel-section:last-child { margin-bottom: 0; }
    .section-label { font-size: 11px; color: var(--sc-text-muted); text-transform: uppercase; margin-bottom: 12px; font-weight: 600; letter-spacing: 0.5px; }
    .bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; font-size: 12px; }
    .bar-label { min-width: 80px; color: var(--sc-text-muted); text-transform: capitalize; font-size: 11px; }
    .bar-track { flex: 1; height: 8px; background: var(--sc-bg-primary); border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
    .bar-value { min-width: 32px; text-align: right; font-weight: 600; font-size: 12px; }
    .status-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .status-tile { background: var(--sc-bg-primary); border-radius: 8px; padding: 12px; border: 1px solid var(--sc-border); }
    .status-tile-value { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .status-tile-label { font-size: 10px; color: var(--sc-text-muted); text-transform: uppercase; }
    .test-section { background: var(--sc-bg-secondary); border-radius: 12px; padding: 20px; border: 1px solid var(--sc-border); margin-bottom: 20px; }
    .test-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
    .form-label { font-size: 11px; color: var(--sc-text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
    .form-select, .form-textarea { padding: 8px 12px; background: var(--sc-bg-primary); border: 1px solid var(--sc-border); border-radius: 8px; color: var(--sc-text-primary); font-size: 12px; font-family: inherit; resize: vertical; }
    .form-select:focus, .form-textarea:focus { outline: none; border-color: var(--sc-primary); }
    .form-textarea { font-family: 'Menlo', 'Monaco', monospace; min-height: 120px; }
    .form-textarea.query-output { min-height: 100px; color: var(--sc-primary); }
    .test-result { background: var(--sc-bg-primary); border-radius: 8px; padding: 12px; border: 1px solid var(--sc-border); margin-top: 12px; font-size: 12px; }
    .test-result.match { border-left: 4px solid var(--sc-critical); }
    .test-result.no-match { border-left: 4px solid var(--sc-info); }
    .result-line { display: flex; justify-content: space-between; padding: 4px 0; }
    .result-line + .result-line { border-top: 1px dashed var(--sc-border); }
    .result-key { color: var(--sc-text-muted); font-size: 11px; }
    .result-value { font-weight: 600; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: var(--sc-bg-secondary); border-radius: 12px; padding: 24px; border: 1px solid var(--sc-border); max-width: 600px; width: 90%; }
    .modal-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--sc-text-primary); }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
    .empty { padding: 40px; text-align: center; color: var(--sc-text-muted); font-size: 13px; }
    .error-banner { background: rgba(255,68,68,0.15); color: var(--sc-critical); padding: 10px 14px; border-radius: 8px; border: 1px solid var(--sc-critical); font-size: 12px; margin-bottom: 16px; }
    @media (max-width: 1200px) { .main-grid { grid-template-columns: 1fr; } .stats-row { grid-template-columns: repeat(2, 1fr); } .test-grid { grid-template-columns: 1fr; } }
  `;

  @state() private stats: any = null;
  @state() private rules: any[] = [];
  @state() private filteredRules: any[] = [];
  @state() private levelFilter: string = 'all';
  @state() private statusFilter: string = 'all';
  @state() private searchQuery: string = '';
  @state() private selectedRuleId: string = '';
  @state() private convertTarget: string = 'splunk';
  @state() private testLog: string = '{"EventID": 4624, "User": "admin", "SourceIP": "10.0.0.5"}';
  @state() private testResult: any = null;
  @state() private convertedQuery: string = '';
  @state() private showImportModal: boolean = false;
  @state() private importYaml: string = '';
  @state() private error: string = '';
  @state() private loading: boolean = false;

  private apiBase = 'http://127.0.0.1:21981/api/v1/sigma';

  connectedCallback() {
    super.connectedCallback();
    this._loadStats();
    this._loadRules();
  }

  private async _loadStats() {
    try {
      const res = await fetch(`${this.apiBase}/stats`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.stats = await res.json();
    } catch (e: any) {
      this.stats = this._mockStats();
      this.error = `Stats API unavailable, showing mock data (${e.message})`;
    }
  }

  private async _loadRules() {
    this.loading = true;
    try {
      const res = await fetch(`${this.apiBase}/rules`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.rules = Array.isArray(data) ? data : (data.rules || []);
      this._applyFilters();
    } catch (e: any) {
      this.rules = this._mockRules();
      this._applyFilters();
      this.error = `Rules API unavailable, showing mock data (${e.message})`;
    } finally {
      this.loading = false;
    }
  }

  private _applyFilters() {
    const q = this.searchQuery.toLowerCase();
    this.filteredRules = this.rules.filter(r => {
      if (this.levelFilter !== 'all' && r.level !== this.levelFilter) return false;
      if (this.statusFilter !== 'all' && r.status !== this.statusFilter) return false;
      if (q && !r.title?.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  private _mockStats() {
    return {
      total: 184,
      stable: 142,
      tactics: 12,
      techniques: 87,
      byLevel: { critical: 18, high: 47, medium: 64, low: 38, informational: 17 },
      byStatus: { stable: 142, test: 26, experimental: 11, deprecated: 5 }
    };
  }

  private _mockRules() {
    return [
      { id: 'sigma-001', title: 'Suspicious PowerShell Encoded Command', level: 'critical', status: 'stable', mitre: ['T1059.001', 'T1027'], lastModified: '2026-05-20' },
      { id: 'sigma-002', title: 'LSASS Memory Access by Untrusted Process', level: 'critical', status: 'stable', mitre: ['T1003.001'], lastModified: '2026-05-18' },
      { id: 'sigma-003', title: 'RDP Lateral Movement Attempt', level: 'high', status: 'stable', mitre: ['T1021.001', 'T1570'], lastModified: '2026-05-15' },
      { id: 'sigma-004', title: 'Scheduled Task Created From Suspicious Path', level: 'high', status: 'stable', mitre: ['T1053.005'], lastModified: '2026-05-12' },
      { id: 'sigma-005', title: 'Windows Defender Tampering Detected', level: 'critical', status: 'stable', mitre: ['T1562.001'], lastModified: '2026-05-10' },
      { id: 'sigma-006', title: 'Outbound DNS to Known C2 Server', level: 'high', status: 'test', mitre: ['T1071.004', 'T1568'], lastModified: '2026-05-08' },
      { id: 'sigma-007', title: 'Mimikatz Tool Execution Indicator', level: 'critical', status: 'stable', mitre: ['T1003', 'T1555'], lastModified: '2026-05-05' },
      { id: 'sigma-008', title: 'Pass-the-Hash Authentication Pattern', level: 'high', status: 'stable', mitre: ['T1550.003'], lastModified: '2026-05-02' },
      { id: 'sigma-009', title: 'Suspicious Office Macro Execution', level: 'medium', status: 'stable', mitre: ['T1566.001', 'T1204.002'], lastModified: '2026-04-28' },
      { id: 'sigma-010', title: 'Kerberoasting Activity Detected', level: 'high', status: 'experimental', mitre: ['T1558.003'], lastModified: '2026-04-25' },
      { id: 'sigma-011', title: 'PsExec Remote Service Installation', level: 'high', status: 'stable', mitre: ['T1569.002'], lastModified: '2026-04-22' },
      { id: 'sigma-012', title: 'Linux Sudoers File Modification', level: 'medium', status: 'test', mitre: ['T1548.003'], lastModified: '2026-04-20' },
      { id: 'sigma-013', title: 'Unusual Cloud API Call Volume', level: 'medium', status: 'stable', mitre: ['T1078.004'], lastModified: '2026-04-18' },
      { id: 'sigma-014', title: 'Disabling Windows Event Logging', level: 'critical', status: 'stable', mitre: ['T1562.008'], lastModified: '2026-04-15' },
      { id: 'sigma-015', title: 'Browser Extension Installation', level: 'low', status: 'stable', mitre: ['T1176'], lastModified: '2026-04-10' },
      { id: 'sigma-016', title: 'Data Staging in Temp Directory', level: 'medium', status: 'stable', mitre: ['T1074.001'], lastModified: '2026-04-05' },
      { id: 'sigma-017', title: 'NTDSUtil Domain Dump Activity', level: 'critical', status: 'deprecated', mitre: ['T1003.003'], lastModified: '2026-04-01' },
      { id: 'sigma-018', title: 'Suspicious WMI Subscription', level: 'high', status: 'stable', mitre: ['T1546.003'], lastModified: '2026-03-28' },
    ];
  }

  private _handleLevelFilter(level: string) {
    this.levelFilter = level;
    this._applyFilters();
  }

  private _handleStatusFilter(status: string) {
    this.statusFilter = status;
    this._applyFilters();
  }

  private _handleSearch(query: string) {
    this.searchQuery = query;
    this._applyFilters();
  }

  private _renderLevelBadge(level: string) {
    const cls = `badge level-${level || 'informational'}`;
    return html`<span class=${cls}>${level || 'informational'}</span>`;
  }

  private _renderStatusBadge(status: string) {
    const cls = `badge status-${status || 'experimental'}`;
    return html`<span class=${cls}>${status || 'experimental'}</span>`;
  }

  private _getLevelColor(level: string): string {
    const map: Record<string, string> = {
      critical: 'var(--sc-critical)',
      high: 'var(--sc-high)',
      medium: 'var(--sc-medium)',
      low: 'var(--sc-low)',
      informational: 'var(--sc-info)'
    };
    return map[level] || 'var(--sc-info)';
  }

  private _getMaxLevelCount(): number {
    if (!this.stats?.byLevel) return 1;
    return Math.max(...Object.values(this.stats.byLevel).map(v => Number(v) || 0), 1);
  }

  private async _handleTestRule() {
    if (!this.selectedRuleId) {
      this.error = 'Please select a rule to test';
      return;
    }
    this.error = '';
    try {
      let logObj;
      try { logObj = JSON.parse(this.testLog); } catch { throw new Error('Invalid JSON in log field'); }
      const res = await fetch(`${this.apiBase}/rules/${this.selectedRuleId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log: logObj })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.testResult = await res.json();
    } catch (e: any) {
      const matched = this._mockTest(this.selectedRuleId, this.testLog);
      this.testResult = { match: matched, confidence: matched ? 0.92 : 0.05, rule: this.selectedRuleId, note: `Mock result (${e.message})` };
    }
  }

  private _mockTest(ruleId: string, log: string): boolean {
    try {
      const obj = JSON.parse(log);
      if (ruleId === 'sigma-001' && obj.User === 'admin') return true;
      if (ruleId === 'sigma-004' && obj.Path && /temp/i.test(obj.Path)) return true;
      if (ruleId === 'sigma-009' && obj.EventID === 4624) return Math.random() > 0.5;
    } catch {}
    return false;
  }

  private async _handleConvert() {
    if (!this.selectedRuleId) {
      this.error = 'Please select a rule to convert';
      return;
    }
    this.error = '';
    try {
      const res = await fetch(`${this.apiBase}/rules/${this.selectedRuleId}/convert?target=${this.convertTarget}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.convertedQuery = data.query || data.converted || '';
    } catch (e: any) {
      this.convertedQuery = this._mockConvert(this.selectedRuleId, this.convertTarget);
    }
  }

  private _mockConvert(ruleId: string, target: string): string {
    const templates: Record<string, string> = {
      splunk: 'index=windows source="WinEventLog:Security" EventCode=4624 | stats count by user, src_ip',
      elasticsearch: 'event.code:4624 AND user.name:admin AND source.ip:*',
      wazuh: '<rule id="100001" level="10">\n  <decoded_as>json</decoded_as>\n  <field name="EventID">4624</field>\n</rule>',
      kql: 'EventID == 4624 and User == "admin"',
      sql: "SELECT * FROM events WHERE event_id = 4624 AND user = 'admin';",
      lucene: '+EventID:4624 +User:admin'
    };
    return `[MOCK ${target.toUpperCase()} for ${ruleId}]\n${templates[target] || templates.splunk}`;
  }

  private async _handleImport() {
    if (!this.importYaml.trim()) {
      this.error = 'Please paste YAML content';
      return;
    }
    try {
      const res = await fetch(`${this.apiBase}/rules/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-yaml' },
        body: this.importYaml
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.showImportModal = false;
      this.importYaml = '';
      await this._loadRules();
      await this._loadStats();
    } catch (e: any) {
      this.error = `Import failed: ${e.message}`;
    }
  }

  render() {
    return html`
      <div class="dashboard" role="main" aria-label="Sigma Detection Rules Dashboard">
        <header class="header">
          <div>
            <h1 class="title"><span>🎯</span> Sigma Detection Rules</h1>
            <div class="subtitle">${this.filteredRules.length} of ${this.rules.length} rules | Backend: ${this.apiBase}</div>
          </div>
          <div class="header-actions">
            <button class="btn" @click=${() => this._loadRules()}>🔄 Refresh</button>
            <button class="btn btn-primary" @click=${() => this.showImportModal = true}>+ Import Rule</button>
          </div>
        </header>

        ${this.error ? html`<div class="error-banner">⚠️ ${this.error}</div>` : ''}

        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-value" style="color: var(--sc-primary)">${this.stats?.total ?? '—'}</div>
            <div class="stat-label">Total Rules</div>
            <div class="stat-trend">+12 this month</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✓</div>
            <div class="stat-value" style="color: var(--sc-info)">${this.stats?.stable ?? '—'}</div>
            <div class="stat-label">Stable Rules</div>
            <div class="stat-trend">${this.stats ? Math.round((this.stats.stable / this.stats.total) * 100) : 0}% of total</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⚔️</div>
            <div class="stat-value" style="color: var(--sc-low)">${this.stats?.tactics ?? '—'}</div>
            <div class="stat-label">MITRE Tactics Covered</div>
            <div class="stat-trend">of 14 total</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🛡️</div>
            <div class="stat-value" style="color: var(--sc-medium)">${this.stats?.techniques ?? '—'}</div>
            <div class="stat-label">MITRE Techniques Covered</div>
            <div class="stat-trend">across all rules</div>
          </div>
        </div>

        <div class="main-grid">
          <div>
            <section class="card">
              <div class="card-header">
                <h2 class="card-title">Detection Rules</h2>
                <span style="font-size: 11px; color: var(--sc-text-muted)">${this.filteredRules.length} matching</span>
              </div>
              <div class="toolbar">
                <input
                  type="text"
                  class="search-box"
                  placeholder="🔍 Search by title..."
                  .value=${this.searchQuery}
                  @input=${(e: any) => this._handleSearch(e.target.value)}
                />
                <div class="filter-group">
                  ${['all', 'critical', 'high', 'medium', 'low', 'informational'].map(lvl => html`
                    <button
                      class="filter-btn ${this.levelFilter === lvl ? 'active' : ''}"
                      @click=${() => this._handleLevelFilter(lvl)}
                    >${lvl}</button>
                  `)}
                </div>
                <div class="filter-group">
                  ${['all', 'stable', 'test', 'experimental', 'deprecated'].map(st => html`
                    <button
                      class="filter-btn ${this.statusFilter === st ? 'active' : ''}"
                      @click=${() => this._handleStatusFilter(st)}
                    >${st}</button>
                  `)}
                </div>
              </div>
              ${this.filteredRules.length === 0
                ? html`<div class="empty">No rules match the current filters</div>`
                : html`
                  <table class="rules-table">
                    <thead>
                      <tr>
                        <th>Rule</th>
                        <th>Level</th>
                        <th>Status</th>
                        <th>MITRE</th>
                        <th>Modified</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${this.filteredRules.map(r => html`
                        <tr>
                          <td>
                            <div class="rule-title">${r.title}</div>
                            <div class="rule-id">${r.id}</div>
                          </td>
                          <td>${this._renderLevelBadge(r.level)}</td>
                          <td>${this._renderStatusBadge(r.status)}</td>
                          <td>
                            <div class="mitre-tags">
                              ${(r.mitre || []).map((t: string) => html`<span class="mitre-tag">${t}</span>`)}
                            </div>
                          </td>
                          <td><span class="last-modified">${r.lastModified || '—'}</span></td>
                          <td>
                            <button class="btn btn-sm btn-secondary" @click=${() => { this.selectedRuleId = r.id; }}>View</button>
                          </td>
                        </tr>
                      `)}
                    </tbody>
                  </table>
                `}
            </section>
          </div>

          <aside>
            <section class="card">
              <div class="card-header"><h2 class="card-title">Rules by Level</h2></div>
              <div class="stats-panel-section">
                ${this.stats?.byLevel ? Object.entries(this.stats.byLevel).map(([lvl, count]) => {
                  const max = this._getMaxLevelCount();
                  const pct = (Number(count) / max) * 100;
                  return html`
                    <div class="bar-row">
                      <span class="bar-label">${lvl}</span>
                      <div class="bar-track">
                        <div class="bar-fill" style="width: ${pct}%; background: ${this._getLevelColor(lvl)}"></div>
                      </div>
                      <span class="bar-value">${count}</span>
                    </div>
                  `;
                }) : html`<div class="empty">Loading...</div>`}
              </div>
              <div class="section-label" style="margin-top: 20px">Rules by Status</div>
              <div class="status-grid">
                ${this.stats?.byStatus ? Object.entries(this.stats.byStatus).map(([st, count]) => html`
                  <div class="status-tile">
                    <div class="status-tile-value" style="color: ${st === 'stable' ? 'var(--sc-info)' : st === 'deprecated' ? 'var(--sc-critical)' : st === 'test' ? 'var(--sc-medium)' : '#a855f7'}">${count}</div>
                    <div class="status-tile-label">${st}</div>
                  </div>
                `) : html`<div class="empty">Loading...</div>`}
              </div>
            </section>
          </aside>
        </div>

        <section class="test-section">
          <div class="card-header">
            <h2 class="card-title">Test Rule & Convert</h2>
            <span style="font-size: 11px; color: var(--sc-text-muted)">Selected: ${this.selectedRuleId || 'none'}</span>
          </div>
          <div class="test-grid">
            <div>
              <div class="section-label">Test a Rule</div>
              <div class="form-group">
                <label class="form-label">Rule</label>
                <select class="form-select" .value=${this.selectedRuleId} @change=${(e: any) => this.selectedRuleId = e.target.value}>
                  <option value="">— select a rule —</option>
                  ${this.rules.map(r => html`<option value=${r.id}>${r.id}: ${r.title}</option>`)}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Log (JSON)</label>
                <textarea class="form-textarea" .value=${this.testLog} @input=${(e: any) => this.testLog = e.target.value}></textarea>
              </div>
              <button class="btn btn-primary" @click=${() => this._handleTestRule()}>▶ Test Rule</button>
              ${this.testResult ? html`
                <div class="test-result ${this.testResult.match ? 'match' : 'no-match'}">
                  <div class="result-line">
                    <span class="result-key">Match</span>
                    <span class="result-value" style="color: ${this.testResult.match ? 'var(--sc-critical)' : 'var(--sc-info)'}">${this.testResult.match ? 'YES' : 'NO'}</span>
                  </div>
                  <div class="result-line">
                    <span class="result-key">Confidence</span>
                    <span class="result-value">${(this.testResult.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div class="result-line">
                    <span class="result-key">Rule</span>
                    <span class="result-value">${this.testResult.rule}</span>
                  </div>
                  ${this.testResult.note ? html`
                    <div class="result-line">
                      <span class="result-key">Note</span>
                      <span class="result-value" style="font-size: 11px; color: var(--sc-text-muted)">${this.testResult.note}</span>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
            <div>
              <div class="section-label">Convert Rule to Query</div>
              <div class="form-group">
                <label class="form-label">Rule</label>
                <select class="form-select" .value=${this.selectedRuleId} @change=${(e: any) => this.selectedRuleId = e.target.value}>
                  <option value="">— select a rule —</option>
                  ${this.rules.map(r => html`<option value=${r.id}>${r.id}: ${r.title}</option>`)}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Target Backend</label>
                <select class="form-select" .value=${this.convertTarget} @change=${(e: any) => this.convertTarget = e.target.value}>
                  <option value="splunk">Splunk SPL</option>
                  <option value="elasticsearch">Elasticsearch DSL</option>
                  <option value="wazuh">Wazuh XML</option>
                  <option value="kql">KQL (Kusto)</option>
                  <option value="sql">SQL</option>
                  <option value="lucene">Lucene</option>
                </select>
              </div>
              <button class="btn btn-primary" @click=${() => this._handleConvert()}>🔄 Convert</button>
              ${this.convertedQuery ? html`
                <div class="form-group" style="margin-top: 12px">
                  <label class="form-label">Generated Query</label>
                  <textarea class="form-textarea query-output" readonly .value=${this.convertedQuery}></textarea>
                </div>
              ` : ''}
            </div>
          </div>
        </section>

        ${this.showImportModal ? html`
          <div class="modal-overlay" @click=${(e: any) => { if (e.target.classList.contains('modal-overlay')) this.showImportModal = false; }}>
            <div class="modal">
              <h3 class="modal-title">Import Sigma Rule (YAML)</h3>
              <div class="form-group">
                <label class="form-label">Paste Sigma YAML</label>
                <textarea class="form-textarea" style="min-height: 200px" .value=${this.importYaml} @input=${(e: any) => this.importYaml = e.target.value} placeholder="title: My Detection&#10;id: my-rule-001&#10;level: high&#10;detection:&#10;  selection:&#10;    EventID: 4624&#10;  condition: selection"></textarea>
              </div>
              <div class="modal-actions">
                <button class="btn btn-secondary" @click=${() => { this.showImportModal = false; this.importYaml = ''; }}>Cancel</button>
                <button class="btn btn-primary" @click=${() => this._handleImport()}>Import</button>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-sigma-dashboard': ScSigmaDashboard; } }

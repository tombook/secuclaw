/**
 * sc-attack-surface-dashboard — Attack Surface Management Dashboard
 * Comprehensive external exposure monitoring and attack surface analysis
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface ExposedAsset {
  id: string;
  hostname: string;
  ip: string;
  port: number;
  service: string;
  version: string;
  exposure: 'critical' | 'high' | 'medium' | 'low';
  risk: number;
  lastScan: string;
  ssl: boolean;
  vulnCount: number;
}

interface Subdomain {
  name: string;
  type: 'web' | 'api' | 'cdn' | 'cloud' | 'internal';
  status: 'active' | 'inactive' | 'unknown';
  hasWAF: boolean;
  pointsTo: string;
}

interface CertHealth {
  hostname: string;
  issuer: string;
  expiresIn: number;
  algorithm: string;
  status: 'valid' | 'expiring' | 'expired' | 'weak';
}

@customElement('sc-attack-surface-dashboard')
export class ScAttackSurfaceDashboard extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .card { background: #1f2937; border-radius: 8px; padding: 14px; }
    .cv { font-size: 22px; font-weight: 700; }
    .cl { font-size: 10px; color: #94a3b8; margin-top: 2px; }
    .warn { color: #f97316; }
    .danger { color: #ef4444; }
    .success { color: #22c55e; }
    .tabs { display: flex; gap: 4px; margin-bottom: 14px; border-bottom: 1px solid #374151; padding-bottom: 8px; }
    .tab { padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: transparent; border: 1px solid transparent; color: #94a3b8; transition: all 0.15s; }
    .tab:hover { background: #374151; }
    .tab.active { background: #f59e0b; color: #111827; border-color: #f59e0b; }
    .sb { padding: 8px 12px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 12px; width: 100%; margin-bottom: 12px; outline: none; }
    .sb:focus { border-color: #f59e0b; }
    .tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
    .tbl th { text-align: left; padding: 8px 10px; background: #0f172a; color: #94a3b8; font-weight: 600; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #374151; }
    .tbl td { padding: 10px; border-bottom: 1px solid #1f2937; }
    .tbl tr:hover td { background: #1f2937; }
    .badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .b-critical { background: #450a0a; color: #fca5a5; }
    .b-high { background: #431407; color: #fdba74; }
    .b-medium { background: #422006; color: #fde047; }
    .b-low { background: #052e16; color: #86efac; }
    .b-active { background: #172554; color: #93c5fd; }
    .b-inactive { background: #1f2937; color: #6b7280; }
    .b-valid { background: #052e16; color: #86efac; }
    .b-expiring { background: #422006; color: #fde047; }
    .b-expired { background: #450a0a; color: #fca5a5; }
    .b-weak { background: #431407; color: #fdba74; }
    .risk-bar { width: 60px; height: 6px; background: #374151; border-radius: 3px; display: inline-block; }
    .risk-fill { height: 100%; border-radius: 3px; }
    .empty { text-align: center; padding: 40px; color: #6b7280; }
    .scan-btn { background: #f59e0b; color: #111827; border: none; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .scan-btn:hover { background: #d97706; }

    .wizard-num { width: 24px; height: 24px; border-radius: 50%; background: #374151; color: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .wizard-num.active { background: #8b5cf6; }
    .wizard-num.done { background: #22c55e; }
    .mitre-tag { display: inline-block; font-size: 9px; padding: 1px 5px; border-radius: 3px; background: #312e81; color: #a5b4fc; margin-right: 3px; }
    .export-panel { background: #0f172a; border: 1px solid #374151; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
    .export-btn { padding: 8px 16px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 11px; font-weight: 600; cursor: pointer; margin-right: 6px; }
    .export-btn:hover { border-color: #8b5cf6; background: #8b5cf620; }
    .risk-bar-track { flex: 1; height: 6px; background: #1f2937; border-radius: 3px; overflow: hidden; }
    .risk-bar-fill { height: 100%; border-radius: 3px; }
    .cb { width: 14px; height: 14px; accent-color: #8b5cf6; cursor: pointer; }
    .batch-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #1e1b4b; border-radius: 8px; margin-bottom: 10px; font-size: 11px; }
    .batch-bar button { padding: 4px 12px; border-radius: 5px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 10px; font-weight: 600; cursor: pointer; }
    .batch-bar button:hover { background: #8b5cf630; border-color: #8b5cf6; }
    .approval-modal { background: #0f172a; border: 1px solid #374151; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
    .heatmap-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
    .heatmap-cell { width: 100%; aspect-ratio: 1; border-radius: 3px; }
    .sla-bar { display: flex; align-items: center; gap: 12px; background: #1f2937; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; }
    .sla-indicator { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  `;

  @state() private _tab: 'exposed' | 'subdomains' | 'cert' | 'metrics' = 'exposed';
  @state() private _search = '';
  @state() private _scanning = false;

  @state() private _showExport = false;
  @state() private _showApproval = false;
  @state() private _selectedForBatch: Set<string> = new Set();
  @state() private _showRiskScoring = false;
  // Enhanced features
  @state() private _auditTrail: Array<{id:string;timestamp:string;action:string;user:string;details:string;category:string}> = [];
  @state() private _auditFilter = 'all';
  @state() private _execHistory: Array<{id:string;timestamp:string;itemsScanned:number;findings:number;criticalCount:number;duration:number;status:string}> = [];
  @state() private _execRunning = false;
  @state() private _execProgress = 0;
  @state() private _settingsTab: string = 'general';
  @state() private _autoInterval = 24;
  @state() private _criticalThreshold = 3;
  @state() private _escalationEmail = '';
  @state() private _webhookUrl = '';
  @state() private _slaTargetHours = 72;
  @state() private _tablePage = 0;
  @state() private _tablePageSize = 10;
  @state() private _showEnhanced = false;


  private _exposedAssets: ExposedAsset[] = [
    { id: 'ea1', hostname: 'api.acme.com', ip: '203.0.113.45', port: 443, service: 'HTTPS', version: 'nginx 1.24', exposure: 'critical', risk: 92, lastScan: '2h ago', ssl: true, vulnCount: 5 },
    { id: 'ea2', hostname: 'www.acme.com', ip: '203.0.113.10', port: 443, service: 'HTTPS', version: 'Cloudflare', exposure: 'high', risk: 68, lastScan: '2h ago', ssl: true, vulnCount: 1 },
    { id: 'ea3', hostname: 'vpn.acme.com', ip: '203.0.113.20', port: 443, service: 'OpenVPN', version: '2.5.9', exposure: 'critical', risk: 88, lastScan: '2h ago', ssl: true, vulnCount: 3 },
    { id: 'ea4', hostname: 'mail.acme.com', ip: '203.0.113.30', port: 993, service: 'IMAPS', version: 'Dovecot 2.3', exposure: 'medium', risk: 42, lastScan: '2h ago', ssl: true, vulnCount: 0 },
    { id: 'ea5', hostname: 'ftp.acme.com', ip: '203.0.113.40', port: 21, service: 'FTP', version: 'vsftpd 3.0', exposure: 'critical', risk: 95, lastScan: '2h ago', ssl: false, vulnCount: 8 },
    { id: 'ea6', hostname: 'db.acme.com', ip: '10.0.50.5', port: 5432, service: 'PostgreSQL', version: '15.2', exposure: 'critical', risk: 98, lastScan: '2h ago', ssl: false, vulnCount: 2 },
    { id: 'ea7', hostname: 's3.acme.com', ip: '203.0.113.50', port: 443, service: 'S3', version: 'AWS', exposure: 'low', risk: 15, lastScan: '2h ago', ssl: true, vulnCount: 0 },
    { id: 'ea8', hostname: 'ssh.acme.com', ip: '203.0.113.25', port: 22, service: 'SSH', version: 'OpenSSH 9.2', exposure: 'high', risk: 55, lastScan: '2h ago', ssl: false, vulnCount: 1 },
  ];

  private _subdomains: Subdomain[] = [
    { name: 'api.acme.com', type: 'api', status: 'active', hasWAF: true, pointsTo: '203.0.113.45' },
    { name: 'www.acme.com', type: 'web', status: 'active', hasWAF: true, pointsTo: 'Cloudflare' },
    { name: 'cdn.acme.com', type: 'cdn', status: 'active', hasWAF: true, pointsTo: 'CloudFront' },
    { name: 'dev.acme.com', type: 'web', status: 'inactive', hasWAF: false, pointsTo: '203.0.113.60' },
    { name: 'staging.acme.com', type: 'web', status: 'active', hasWAF: false, pointsTo: '203.0.113.65' },
    { name: 'internal.acme.com', type: 'internal', status: 'active', hasWAF: false, pointsTo: '10.0.1.100' },
    { name: 'git.acme.com', type: 'api', status: 'active', hasWAF: true, pointsTo: '203.0.113.70' },
    { name: 'jenkins.acme.com', type: 'internal', status: 'active', hasWAF: false, pointsTo: '10.0.2.50' },
    { name: 'grafana.acme.com', type: 'internal', status: 'active', hasWAF: false, pointsTo: '10.0.2.60' },
    { name: 'admin.acme.com', type: 'web', status: 'inactive', hasWAF: false, pointsTo: '203.0.113.80' },
  ];

  private _certHealth: CertHealth[] = [
    { hostname: 'api.acme.com', issuer: 'DigiCert', expiresIn: 45, algorithm: 'RSA-2048', status: 'expiring' },
    { hostname: 'www.acme.com', issuer: "Let's Encrypt", expiresIn: 89, algorithm: 'RSA-2048', status: 'valid' },
    { hostname: 'cdn.acme.com', issuer: 'Cloudflare', expiresIn: 365, algorithm: 'RSA-2048', status: 'valid' },
    { hostname: 'mail.acme.com', issuer: 'DigiCert', expiresIn: 12, algorithm: 'RSA-2048', status: 'expiring' },
    { hostname: 'vpn.acme.com', issuer: 'Internal CA', expiresIn: 180, algorithm: 'RSA-4096', status: 'valid' },
    { hostname: 'git.acme.com', issuer: "Let's Encrypt", expiresIn: 67, algorithm: 'ECDSA-256', status: 'valid' },
    { hostname: 'legacy.acme.com', issuer: 'Thawte', expiresIn: -5, algorithm: 'SHA-1', status: 'expired' },
  ];

  private _getRiskFillWidth(risk: number): string {
    const color = risk > 70 ? '#ef4444' : risk > 40 ? '#f97316' : '#22c55e';
    return `background: ${color}; width: ${risk}%;`;
  }

  private _renderExposedTab() {
    const q = this._search.toLowerCase();
    const filtered = q ? this._exposedAssets.filter(a => 
      a.hostname.toLowerCase().includes(q) || a.ip.includes(q) || a.service.toLowerCase().includes(q)
    ) : this._exposedAssets;

    return html`
      <table class="tbl">
        <thead>
          <tr>
            <th>Asset</th><th>Port/Service</th><th>SSL</th><th>Risk Score</th><th>Vulns</th><th>Exposure</th><th>Last Scan</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(a => html`
            <tr>
              <td><div style="font-weight:600">${a.hostname}</div><div style="font-size:10px;color:#6b7280">${a.ip}</div></td>
              <td>${a.port}/${a.service}<div style="font-size:10px;color:#6b7280">${a.version}</div></td>
              <td>${a.ssl ? html`<span class="badge b-valid">✓ TLS</span>` : html`<span class="badge b-expired">✗ No SSL</span>`}</td>
              <td>
                <div class="risk-bar"><div class="risk-fill" style="${this._getRiskFillWidth(a.risk)}"></div></div>
                <div style="font-size:10px;color:#94a3b8">${a.risk}/100</div>
              </td>
              <td><span class="badge ${a.vulnCount > 3 ? 'b-critical' : a.vulnCount > 0 ? 'b-high' : 'b-low'}">${a.vulnCount}</span></td>
              <td><span class="badge b-${a.exposure}">${a.exposure}</span></td>
              <td style="color:#94a3b8">${a.lastScan}</td>
            </tr>
          `)}
        </tbody>
      </table>
      ${filtered.length === 0 ? html`<div class="empty">No assets match your search</div>` : nothing}
    `;
  }

  private _renderSubdomainsTab() {
    const q = this._search.toLowerCase();
    const filtered = q ? this._subdomains.filter(s => s.name.includes(q) || s.type.includes(q)) : this._subdomains;

    return html`
      <table class="tbl">
        <thead>
          <tr><th>Subdomain</th><th>Type</th><th>Status</th><th>WAF</th><th>Points To</th></tr>
        </thead>
        <tbody>
          ${filtered.map(s => html`
            <tr>
              <td style="font-weight:600">${s.name}</td>
              <td><span class="badge b-active">${s.type}</span></td>
              <td><span class="badge ${s.status === 'active' ? 'b-valid' : 'b-inactive'}">${s.status}</span></td>
              <td>${s.hasWAF ? html`<span class="badge b-valid">✓ Protected</span>` : html`<span class="badge b-expired">✗ Unprotected</span>`}</td>
              <td style="color:#94a3b8">${s.pointsTo}</td>
            </tr>
          `)}
        </tbody>
      </table>
    `;
  }

  private _renderCertTab() {
    const q = this._search.toLowerCase();
    const filtered = q ? this._certHealth.filter(c => c.hostname.includes(q)) : this._certHealth;

    return html`
      <table class="tbl">
        <thead>
          <tr><th>Hostname</th><th>Issuer</th><th>Algorithm</th><th>Expires In</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${filtered.map(c => html`
            <tr>
              <td style="font-weight:600">${c.hostname}</td>
              <td style="color:#94a3b8">${c.issuer}</td>
              <td><span class="badge ${c.algorithm.includes('SHA-1') ? 'b-high' : 'b-valid'}">${c.algorithm}</span></td>
              <td style="color:${c.expiresIn < 30 ? '#ef4444' : c.expiresIn < 60 ? '#f97316' : '#94a3b8'}">${c.expiresIn > 0 ? `${c.expiresIn} days` : `Expired ${Math.abs(c.expiresIn)} days ago`}</td>
              <td><span class="badge b-${c.status}">${c.status}</span></td>
            </tr>
          `)}
        </tbody>
      </table>
    `;
  }

  private _renderMetricsTab() {
    const total = this._exposedAssets.length;
    const critical = this._exposedAssets.filter(a => a.exposure === 'critical').length;
    const high = this._exposedAssets.filter(a => a.exposure === 'high').length;
    const medium = this._exposedAssets.filter(a => a.exposure === 'medium').length;
    const low = this._exposedAssets.filter(a => a.exposure === 'low').length;
    const sslScore = Math.round((this._exposedAssets.filter(a => a.ssl).length / total) * 100);
    const wafCoverage = Math.round((this._subdomains.filter(s => s.hasWAF).length / this._subdomains.length) * 100);

    return html`
      <div class="grid">
        <div class="card"><div class="cv danger">${critical}</div><div class="cl">Critical Exposure</div></div>
        <div class="card"><div class="cv warn">${high}</div><div class="cl">High Exposure</div></div>
        <div class="card"><div class="cv">${medium}</div><div class="cl">Medium Exposure</div></div>
        <div class="card"><div class="cv success">${low}</div><div class="cl">Low Exposure</div></div>
        <div class="card"><div class="cv">${total}</div><div class="cl">Total Exposed Assets</div></div>
        <div class="card"><div class="cv">${sslScore}%</div><div class="cl">SSL Coverage</div></div>
        <div class="card"><div class="cv">${wafCoverage}%</div><div class="cl">WAF Coverage</div></div>
        <div class="card"><div class="cv">${this._certHealth.filter(c => c.expiresIn < 30).length}</div><div class="cl">Certs Expiring Soon</div></div>
      </div>
      <div style="background:#1f2937;border-radius:8px;padding:16px;margin-top:12px">
        <div style="font-weight:600;margin-bottom:12px">Exposure Trend (30 days)</div>
        <svg viewBox="0 0 500 120" style="width:100%;height:120px">
          <polyline points="0,80 50,75 100,70 150,78 200,60 250,55 300,65 350,45 400,40 450,35 500,30" fill="none" stroke="#f59e0b" stroke-width="2"/>
          <text x="10" y="100" fill="#94a3b8" font-size="10">30d ago</text>
          <text x="460" y="100" fill="#94a3b8" font-size="10">Today</text>
          <text x="230" y="15" fill="#94a3b8" font-size="10">Risk Score: 78 → 65 (17% improvement)</text>
        </svg>
      </div>
    `;
  }


  private _kpiCards = [
    { title: 'Primary KPI', value: '92%', change: '+5%', positive: true, color: '#22c55e' },
    { title: 'Secondary KPI', value: '78%', change: '+3%', positive: true, color: '#3b82f6' },
    { title: 'Risk Indicator', value: '12', change: '-2', positive: true, color: '#f97316' },
    { title: 'Compliance Score', value: '95%', change: '+1%', positive: true, color: '#06b6d4' },
  ];

  private _recommendations = [
    { priority: '#ef4444', text: 'Address 3 critical findings identified in latest assessment', meta: 'Due: 2026-04-30 | Owner: Security Team' },
    { priority: '#f97316', text: 'Complete semi-annual review for all Attack Surface Dashboard items', meta: 'Due: 2026-05-15 | Owner: Compliance' },
    { priority: '#eab308', text: 'Update policies to reflect recent regulatory changes', meta: 'Due: 2026-06-01 | Owner: Legal' },
    { priority: '#22c55e', text: 'Schedule next quarterly review with stakeholders', meta: 'Due: 2026-06-15 | Owner: PMO' },
  ];

  private _mitreTechniques = ['T1059', 'T1078', 'T1566', 'T1190'];

  private _computeRiskScore(item: { id: string; risk: string; status: string }): number {
    const riskW: Record<string, number> = { critical: 40, high: 30, medium: 20, low: 10 };
    const statusW: Record<string, number> = { active: 0, reviewing: -5, flagged: 10, completed: -15, expired: 5 };
    return Math.max(0, Math.min(100, (riskW[item.risk] || 20) + (statusW[item.status] || 0)));
  }

  private _riskColor(score: number): string {
    if (score >= 80) return '#ef4444';
    if (score >= 60) return '#f97316';
    if (score >= 40) return '#eab308';
    return '#22c55e';
  }

  private _riskLabel(score: number): string {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  }

  private _exportData(format: string) {
    const blob = new Blob(['attack-surface-dashboard export'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'attack-surface-dashboard-export.' + (format === 'markdown' ? 'md' : format); a.click();
    URL.revokeObjectURL(url);
    this._showExport = false;
  }

  private _renderExportPanel() {
    return html`<div class="export-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:13px;font-weight:700">Export Data</div>
        <button class="detail-close" style="background:#374151;border:none;color:#94a3b8;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:11px" @click=${() => { this._showExport = false; }}>\u2715</button>
      </div>
      <div style="display:flex;gap:8px">
        <button class="export-btn" @click=${() => this._exportData('csv')}>CSV</button>
        <button class="export-btn" @click=${() => this._exportData('json')}>JSON</button>
        <button class="export-btn" @click=${() => this._exportData('markdown')}>Markdown</button>
      </div>
    </div>`;
  }

  private _renderPlaybook() {
    const steps: [string, string][] = [
      ['Identify', 'Identify relevant items and scope the analysis'],
      ['Assess', 'Evaluate current state against security requirements'],
      ['Plan', 'Develop prioritized remediation plan'],
      ['Implement', 'Execute remediation actions with proper controls'],
      ['Verify', 'Validate remediation effectiveness through testing'],
      ['Report', 'Document results, metrics, and lessons learned'],
    ];
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Attack Surface Dashboard Playbook</div>
      ${steps.map((s: [string, string], i: number) => html`
        <div style="display:flex;align-items:center;gap:10px;${i < steps.length - 1 ? 'margin-bottom:4px' : ''}">
          <div class="wizard-num ${i < 3 ? 'done' : i === 3 ? 'active' : ''}">${i < 3 ? '\u2713' : (i + 1).toString()}</div>
          <div style="flex:1">
            <div style="font-size:12px;font-weight:600;${i === 3 ? 'color:#8b5cf6' : i < 3 ? 'color:#22c55e' : 'color:#6b7280'}">${s[0]}</div>
            <div style="font-size:10px;color:#6b7280">${s[1]}</div>
          </div>
        </div>
      `)}
    </div>`;
  }

  private _renderDecisionTree() {
    const nodes: [string, string][] = [
      ['Is the item high-risk or critical?', 'YES -> Immediate action required | NO -> Standard process'],
      ['Is there an existing control?', 'YES -> Verify effectiveness | NO -> Implement new control'],
      ['Is remediation within SLA?', 'YES -> Continue monitoring | NO -> Escalate to management'],
      ['Is the item recurring?', 'YES -> Automate detection and response | NO -> One-time remediation'],
    ];
    return html`<div style="background:#0f172a;border-radius:8px;padding:12px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Decision Tree</div>
      ${nodes.map((n: [string, string]) => html`
        <div style="margin-bottom:8px">
          <div style="font-size:11px;color:#e2e8f0;font-weight:600">${n[0]}</div>
          <div style="margin-left:20px;font-size:10px;color:#94a3b8;margin-top:2px">${n[1]}</div>
        </div>
      `)}
    </div>`;
  }

  private _renderKPIs() {
    const kpis: [string, string, string, string][] = [
      ['Total Items', '142', '+5', '#3b82f6'],
      ['High Risk', '23', '-2', '#ef4444'],
      ['Compliance Rate', '94%', '+3%', '#22c55e'],
      ['Pending Actions', '12', '-4', '#f97316'],
    ];
    return html`<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px">
      ${kpis.map((k: [string, string, string, string]) => html`
        <div style="background:#0f172a;border-radius:8px;padding:12px;border-left:3px solid ${k[3]}">
          <div style="font-size:10px;color:#6b7280;text-transform:uppercase">${k[0]}</div>
          <div style="font-size:20px;font-weight:700;color:${k[3]}">${k[1]}</div>
          <div style="font-size:10px;color:${k[2].startsWith('+') ? '#22c55e' : '#ef4444'}">${k[2].startsWith('+') ? '\u25B2' : '\u25BC'} ${k[2]} vs last period</div>
        </div>
      `)}
    </div>`;
  }

  private _renderHeatmap() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const heatColor = (v: number) => v >= 10 ? '#ef4444' : v >= 7 ? '#f97316' : v >= 4 ? '#eab308' : v >= 2 ? '#22c55e80' : '#22c55e30';
    const grouped: { day: string; hours: { hour: number; value: number }[] }[] = [];
    for (const d of days) {
      const hours: { hour: number; value: number }[] = [];
      for (let h = 0; h < 24; h++) {
        const base = (h >= 8 && h <= 18) ? 5 : 1;
        const wknd = (d === 'Sat' || d === 'Sun') ? 0.3 : 1;
        hours.push({ hour: h, value: Math.round((base + Math.random() * 8) * wknd) });
      }
      grouped.push({ day: d, hours });
    }
    return html`<div style="background:#0f172a;border-radius:8px;padding:12px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">Activity Heatmap</div>
      <div style="display:flex;gap:4px;align-items:center;margin-bottom:4px">
        <span style="width:30px;font-size:9px;color:#6b7280"></span>
        ${Array.from({ length: 24 }, (_, i) => html`<div style="flex:1;text-align:center;font-size:8px;color:#6b7280">${i}</div>`)}
      </div>
      ${grouped.map(d => html`<div style="display:flex;gap:4px;align-items:center;margin-bottom:2px">
        <span style="width:30px;font-size:9px;color:#6b7280">${d.day}</span>
        ${d.hours.map(h => html`<div class="heatmap-cell" style="flex:1;background:${heatColor(h.value)}" title="${d.day} ${h.hour}:00 - ${h.value} events"></div>`)}
      </div>`)}
      <div style="display:flex;gap:8px;margin-top:6px;font-size:9px;color:#6b7280;align-items:center">
        <span>Low</span><div style="width:12px;height:8px;border-radius:2px;background:#22c55e30"></div>
        <div style="width:12px;height:8px;border-radius:2px;background:#eab308"></div>
        <div style="width:12px;height:8px;border-radius:2px;background:#ef4444"></div><span>High</span>
      </div>
    </div>`;
  }

  private _approvalQueue = [
    { id: 'APR-001', item: 'Review pending', requestor: 'Team Lead', action: 'Approve changes', status: 'pending', submittedAt: '2026-04-21T10:00:00' },
    { id: 'APR-002', item: 'Policy update', requestor: 'Compliance', action: 'Update document', status: 'pending', submittedAt: '2026-04-20T14:00:00' },
    { id: 'APR-003', item: 'Access request', requestor: 'IT Ops', action: 'Grant access', status: 'approved', submittedAt: '2026-04-19T09:00:00' },
  ];

  private _renderApprovalWorkflow() {
    const pending = this._approvalQueue.filter(a => a.status === 'pending');
    const resolved = this._approvalQueue.filter(a => a.status !== 'pending');
    return html`<div class="approval-modal">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px">Approval Queue (${pending.length} pending)</div>
      ${pending.map(a => html`<div style="background:#1f2937;border-radius:8px;padding:10px;margin-bottom:8px;border-left:3px solid #f97316">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-weight:600;font-size:12px">${a.id}: ${a.action}</div>
          <div style="font-size:10px;color:#6b7280;margin-top:2px">By: ${a.requestor} | ${a.submittedAt}</div></div>
          <div style="display:flex;gap:4px">
            <button class="export-btn" style="border-color:#22c55e;color:#22c55e;padding:4px 10px" @click=${() => { a.status = 'approved'; this.requestUpdate(); }}>Approve</button>
            <button class="export-btn" style="border-color:#ef4444;color:#ef4444;padding:4px 10px" @click=${() => { a.status = 'rejected'; this.requestUpdate(); }}>Reject</button>
          </div>
        </div>
      </div>`)}
      ${resolved.map(a => html`<div style="background:#1f2937;border-radius:6px;padding:8px;margin-bottom:4px;opacity:0.6">
        <div style="display:flex;justify-content:space-between;font-size:11px"><span>${a.id}: ${a.action}</span>
        <span style="color:${a.status === 'approved' ? '#22c55e' : '#ef4444'}">${a.status}</span></div>
      </div>`)}
    </div>`;
  }

  private _renderRiskScoringTable() {
    const items = this._items || [];
    return html`<div class="approval-modal">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px">Risk Scoring Analysis</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead><tr><th style="text-align:left;padding:6px 8px;background:#0f172a;color:#94a3b8;font-size:9px;text-transform:uppercase;border-bottom:1px solid #374151">Item</th><th style="text-align:left;padding:6px 8px;background:#0f172a;color:#94a3b8;font-size:9px;text-transform:uppercase;border-bottom:1px solid #374151">Score</th><th style="text-align:left;padding:6px 8px;background:#0f172a;color:#94a3b8;font-size:9px;text-transform:uppercase;border-bottom:1px solid #374151">Level</th></tr></thead>
        <tbody>${items.map((item: { id: string; name: string; risk: string; status: string }) => {
          const score = this._computeRiskScore(item);
          return html`<tr><td style="padding:6px 8px;border-bottom:1px solid #1f2937">${item.name}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #1f2937"><div style="display:flex;align-items:center;gap:6px">
              <span style="font-weight:700;color:${this._riskColor(score)}">${score}</span>
              <div class="risk-bar-track"><div class="risk-bar-fill" style="width:${score}%;background:${this._riskColor(score)}"></div></div></div></td>
            <td style="padding:6px 8px;border-bottom:1px solid #1f2937"><span style="color:${this._riskColor(score)};font-size:10px;font-weight:600">${this._riskLabel(score)}</span></td></tr>`;
        })}</tbody></table>
    </div>`;
  }

  private _addAudit(category: string, details: string): void {
    this._auditTrail = [{ id: 'a-' + Date.now(), timestamp: new Date().toISOString(), action: category, user: 'Current User', details, category }, ...this._auditTrail].slice(0, 50);
  }

  private _runScanWithHistory(): void {
    this._execRunning = true;
    this._execProgress = 0;
    this._addAudit('scan', 'Starting analysis');
    const record: any = { id: 'ex-' + Date.now(), timestamp: new Date().toISOString(), itemsScanned: 0, findings: 0, criticalCount: 0, duration: 0, status: 'running' };
    const start = Date.now();
    const iv = setInterval(() => {
      this._execProgress = Math.min(this._execProgress + 12, 100);
      record.duration = Math.round((Date.now() - start) / 1000);
      if (this._execProgress >= 100) {
        clearInterval(iv);
        record.status = 'success';
        record.itemsScanned = this._items.length;
        record.findings = this._items.filter((x: any) => x.risk && x.risk !== 'low').length;
        record.criticalCount = this._items.filter((x: any) => x.risk === 'critical').length;
        this._execHistory = [record, ...this._execHistory].slice(0, 20);
        this._execRunning = false;
        this._addAudit('scan', 'Scan completed: ' + record.findings + ' findings');
      }
    }, 200);
  }

  private _renderAuditPanel(): any {
    const filtered = this._auditFilter === 'all' ? this._auditTrail : this._auditTrail.filter((e: any) => e.category === this._auditFilter);
    return html`<div>
      <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
        ${['all', 'scan', 'review', 'config', 'export'].map((f: string) => html`<button class="btn btn-sm ${this._auditFilter === f ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._auditFilter = f; }}>${f}</button>`)}
      </div>
      <div style="max-height:400px;overflow-y:auto">
        ${filtered.map((e: any) => html`<div style="display:flex;gap:10px;padding:8px 10px;background:#0f172a;border-radius:6px;margin-bottom:4px;font-size:12px">
          <span style="padding:2px 6px;border-radius:3px;font-size:9px;font-weight:600;background:${((({scan:'#3b82f6',review:'#f59e0b',config:'#8b5cf6',export:'#22c55e'}}) as any)[e.category]) || '#374151'}20;color:${((({scan:'#60a5fa',review:'#fbbf24',config:'#a78bfa',export:'#34d399'}}) as any)[e.category]) || '#9ca3af'}">${e.category}</span>
          <div style="flex:1"><div style="color:#e2e8f0;font-weight:500">${e.details}</div><div style="font-size:10px;color:#6b7280;margin-top:2px">${e.user} | ${new Date(e.timestamp).toLocaleString()}</div></div>
        </div>`)}
      </div>
    </div>`;
  }

  private _renderExecHistory(): any {
    if (this._execHistory.length === 0) return html`<div class="empty-state"><div>No scan history</div></div>`;
    const sorted = [...this._execHistory].sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp));
    const totalPages = Math.max(1, Math.ceil(sorted.length / this._tablePageSize));
    const start = this._tablePage * this._tablePageSize;
    const records = sorted.slice(start, start + this._tablePageSize);
    return html`<div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
        <span style="font-weight:600;font-size:12px;color:#94a3b8">History (${this._execHistory.length})</span>
        <select style="background:#1f2937;border:1px solid #374151;border-radius:4px;padding:4px 8px;color:#e2e8f0;font-size:11px" .value=${String(this._tablePageSize)} @change=${(e: Event) => { this._tablePageSize = parseInt((e.target as HTMLSelectElement).value); this._tablePage = 0; }}>
          <option value="5">5/page</option><option value="10">10/page</option><option value="25">25/page</option>
        </select>
      </div>
      ${this._execRunning ? html`<div class="progress-bar"><div class="progress-fill" style="width:${this._execProgress}%"></div></div>` : nothing}
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Time</th><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Items</th><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Findings</th><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Duration</th><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Status</th></tr></thead>
        <tbody>${records.map((r: any) => html`<tr style="border-bottom:1px solid #1f2937">
          <td style="padding:7px 8px;font-size:11px;color:#6b7280">${new Date(r.timestamp).toLocaleString()}</td>
          <td style="padding:7px 8px">${r.itemsScanned}</td>
          <td style="padding:7px 8px;color:#f59e0b;font-weight:700">${r.findings}</td>
          <td style="padding:7px 8px">${r.duration}s</td>
          <td style="padding:7px 8px"><span style="font-size:10px;padding:2px 8px;border-radius:4px;font-weight:600;background:${r.status === 'success' ? '#22c55e20' : '#ef444420'};color:${r.status === 'success' ? '#34d399' : '#f87171'}">${r.status}</span></td>
        </tr>`)}</tbody>
      </table>
      ${totalPages > 1 ? html`<div style="display:flex;gap:4px;justify-content:center;margin-top:8px">${Array.from({ length: totalPages }, (_: any, i: number) => html`<button class="btn btn-sm ${this._tablePage === i ? 'btn-primary' : 'btn-secondary'}" style="padding:4px 10px" @click=${() => { this._tablePage = i; }}>${i + 1}</button>`)}
      </div>` : nothing}
    </div>`;
  }

  private _renderSettingsPanel(): any {
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px">
      <div style="font-weight:700;font-size:14px;margin-bottom:12px">Settings</div>
      <div style="display:flex;gap:4px;margin-bottom:12px">
        ${['general', 'thresholds', 'integrations'].map((t: string) => html`<button class="btn btn-sm ${this._settingsTab === t ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = t; }}>${t}</button>`)}
      </div>
      ${this._settingsTab === 'general' ? html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Auto-scan Interval</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="168" .value=${String(this._autoInterval)} @input=${(e: Event) => { this._autoInterval = parseInt((e.target as HTMLInputElement).value); } style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._autoInterval}h</span></div></div>
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">SLA Target</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="720" .value=${String(this._slaTargetHours)} @input=${(e: Event) => { this._slaTargetHours = parseInt((e.target as HTMLInputElement).value); } style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._slaTargetHours}h</span></div></div>
      </div>` : nothing}
      ${this._settingsTab === 'thresholds' ? html`<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Critical Threshold</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="20" .value=${String(this._criticalThreshold)} @input=${(e: Event) => { this._criticalThreshold = parseInt((e.target as HTMLInputElement).value); } style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._criticalThreshold}</span></div></div>` : nothing}
      ${this._settingsTab === 'integrations' ? html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Escalation Email</div><input type="email" .value=${this._escalationEmail} @input=${(e: Event) => { this._escalationEmail = (e.target as HTMLInputElement).value; } style="background:#0f172a;border:1px solid #374151;border-radius:6px;padding:8px;color:#e2e8f0;font-size:12px;width:100%"></div>
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Webhook URL</div><input type="url" .value=${this._webhookUrl} @input=${(e: Event) => { this._webhookUrl = (e.target as HTMLInputElement).value; } style="background:#0f172a;border:1px solid #374151;border-radius:6px;padding:8px;color:#e2e8f0;font-size:12px;width:100%"></div>
        <div style="grid-column:1/-1;display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-primary btn-sm" @click=${() => { this._addAudit('config', 'Settings saved'); }}>Save</button>
          <button class="btn btn-secondary btn-sm" @click=${() => { this._addAudit('config', 'Config exported'); }}>Export</button>
        </div>
      </div>` : nothing}
    </div>`;
  }

  private _renderRiskGauge(): any {
    const riskDist: any = { critical: 0, high: 0, medium: 0, low: 0 };
    this._items.forEach((item: any) => { const r = item.risk; if (riskDist[r] !== undefined) riskDist[r]++; else riskDist.medium++; });
    const total = this._items.length || 1;
    const score = Math.round(((riskDist.critical * 10 + riskDist.high * 7 + riskDist.medium * 4 + riskDist.low * 1) / (total * 10)) * 100);
    const scoreColor = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#22c55e';
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:8px">Risk Overview</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:${scoreColor}">${score}</div><div style="font-size:9px;color:#6b7280">Risk Score</div></div>
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:#ef4444">${riskDist.critical}</div><div style="font-size:9px;color:#6b7280">Critical</div></div>
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:#f59e0b">${riskDist.high}</div><div style="font-size:9px;color:#6b7280">High Risk</div></div>
      </div>
      <div style="display:flex;height:12px;border-radius:6px;overflow:hidden;gap:1px;margin-bottom:6px">
        <div style="width:${(riskDist.critical / total) * 100}%;background:#ef4444;border-radius:3px"></div>
        <div style="width:${(riskDist.high / total) * 100}%;background:#f97316"></div>
        <div style="width:${(riskDist.medium / total) * 100}%;background:#eab308"></div>
        <div style="width:${(riskDist.low / total) * 100}%;background:#22c55e;border-radius:3px"></div>
      </div>
      <div style="display:flex;gap:12px;font-size:9px;color:#6b7280">
        <span><span style="display:inline-block;width:8px;height:8px;background:#ef4444;border-radius:2px;margin-right:3px"></span>Critical</span>
        <span><span style="display:inline-block;width:8px;height:8px;background:#f97316;border-radius:2px;margin-right:3px"></span>High</span>
        <span><span style="display:inline-block;width:8px;height:8px;background:#eab308;border-radius:2px;margin-right:3px"></span>Medium</span>
        <span><span style="display:inline-block;width:8px;height:8px;background:#22c55e;border-radius:2px;margin-right:3px"></span>Low</span>
      </div>
    </div>`;
  }

  private _renderBarChart(): any {
    const data = this._items.slice(0, 10).map((item: any, i: number) => ({ name: (item.name || item.title || item.id || 'Item ' + i).substring(0, 8), score: ({critical: 10, high: 7, medium: 4, low: 1}}}}) as any)[item.risk]) || 2, risk: item.risk || 'medium' }));
    const w = 380, h = 160;
    const bw = Math.max(18, Math.floor((w - 50) / data.length) - 4);
    const colors: any = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:8px">Score Chart</div>
      <svg width="100%" viewBox="0 0 ${w} ${h}" style="max-width:440px">
        ${[0,5,10].map(v => html`<line x1="35" y1="${h - 20 - (v / 10) * (h - 45)}" x2="${w - 10}" y2="${h - 20 - (v / 10) * (h - 45)}" stroke="#1f2937" stroke-width="0.5"/><text x="30" y="${h - 18 - (v / 10) * (h - 45)}" text-anchor="end" fill="#6b7280" font-size="7">${v}</text>`)}
        ${data.map((d: any, i: number) => html`<g><rect x="${40 + i * (bw + 4)}" y="${h - 20 - (d.score / 10) * (h - 45)}" width="${bw}" height="${(d.score / 10) * (h - 45)}" fill="${(colors[d.risk] || '#8b5cf6')}60" rx="2" stroke="${colors[d.risk] || '#8b5cf6'}" stroke-width="0.5"/><text x="${40 + i * (bw + 4) + bw / 2}" y="${h - 6}" text-anchor="middle" fill="#6b7280" font-size="6" transform="rotate(-25, ${40 + i * (bw + 4) + bw / 2}, ${h - 6})">${d.name}</text></g>`)}
        <line x1="35" y1="${h - 20}" x2="${w - 10}" y2="${h - 20}" stroke="#374151" stroke-width="1"/>
      </svg>
    </div>`;
  }

  private _renderEnhancedSection(): any {
    if (!this._showEnhanced) return nothing;
    return html`<div style="margin-top:16px;border-top:1px solid #374151;padding-top:16px">
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #374151;padding-bottom:8px">
        <button class="btn btn-sm ${this._settingsTab === 'audit' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'audit'; }}>Audit</button>
        <button class="btn btn-sm ${this._settingsTab === 'history' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'history'; }}>History</button>
        <button class="btn btn-sm ${this._settingsTab === 'settings' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'settings'; }}>Settings</button>
      </div>
      ${this._settingsTab === 'audit' ? this._renderAuditPanel() : ''}
      ${this._settingsTab === 'history' ? this._renderExecHistory() : ''}
      ${this._settingsTab === 'settings' ? this._renderSettingsPanel() : ''}
      <div style="margin-top:12px">
        ${this._renderRiskGauge()}
        ${this._renderBarChart()}
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <div style="flex:1;padding:8px;border-radius:6px;border:1px solid #374151;background:#1f2937;color:#94a3b8;font-size:11px;cursor:pointer;text-align:center" @click=${() => { this._addAudit('export', 'Report exported'); }}>Export Report</div>
        <div style="flex:1;padding:8px;border-radius:6px;border:1px solid #374151;background:#1f2937;color:#94a3b8;font-size:11px;cursor:pointer;text-align:center" @click=${this._runScanWithHistory}>Run Analysis</div>
      </div>
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid #374151;display:flex;justify-content:space-between;font-size:10px;color:#6b7280">
        <span>Last scan: ${this._execHistory.length > 0 ? new Date(this._execHistory[0].timestamp).toLocaleString() : 'Never'}</span>
        <span>${this._items.length} items | ${this._auditTrail.length} audit entries</span>
      </div>
    </div>`;
  }


  render() {
    const totalAssets = this._exposedAssets.length;
    const criticalExposures = this._exposedAssets.filter(a => a.exposure === 'critical').length;
    const expiringCerts = this._certHealth.filter(c => c.expiresIn < 30).length;
    const unprotectedSubdomains = this._subdomains.filter(s => !s.hasWAF && s.status === 'active').length;

    return html`
      <div class="panel">
        <div class="pt">🎯 Attack Surface Dashboard</div>

      ${this._showExport ? this._renderExportPanel() : nothing}
      ${this._renderPlaybook()}
      ${this._renderDecisionTree()}
      ${this._renderKPIs()}
      ${this._renderHeatmap()}
      <div style="background:#0f172a;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">MITRE ATT&CK References</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px">
          ${this._mitreTechniques.map((t: string) => html`<span class="mitre-tag">${t}</span>`)}
        </div>
      </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
          <div style="background:#1f2937;border-radius:8px;padding:14px">
            <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Key Metrics Summary</div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">External Assets</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#06b6d4">234</div>              <div style="flex:1;font-size:10px;color:#6b7280">-12% this quarter</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Open Ports</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#f97316">89</div>              <div style="flex:1;font-size:10px;color:#6b7280">12 unauthorized</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">SSL Coverage</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#22c55e">98%</div>              <div style="flex:1;font-size:10px;color:#6b7280">4 expiring soon</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Shadow IT Found</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#ef4444">23</div>              <div style="flex:1;font-size:10px;color:#6b7280">15 remediated</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Vulns (External)</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#eab308">34</div>              <div style="flex:1;font-size:10px;color:#6b7280">6 critical</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">DNS Records</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#3b82f6">456</div>              <div style="flex:1;font-size:10px;color:#6b7280">15 orphaned</div>            </div>
          </div>
          <div style="background:#1f2937;border-radius:8px;padding:14px">
            <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Security Insights</div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">External attack surface reduced by 12% through asset consolidation.</span>            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">Shadow IT discovery identified 23 previously unknown internet-facing assets.</span>            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">SSL certificate coverage at 98% with automated renewal for 95% of certs.</span>            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">Subdomain enumeration found 15 orphaned subdomains requiring cleanup.</span>            </div>
          </div>
        </div>

        
        <div class="grid">
          <div class="card"><div class="cv">${totalAssets}</div><div class="cl">Exposed Assets</div></div>
          <div class="card"><div class="cv danger">${criticalExposures}</div><div class="cl">Critical</div></div>
          <div class="card"><div class="cv warn">${expiringCerts}</div><div class="cl">Certs Expiring</div></div>
          <div class="card"><div class="cv warn">${unprotectedSubdomains}</div><div class="cl">Unprotected</div></div>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:12px;align-items:center">
          <button class="scan-btn" @click=${() => { this._scanning = true; this.requestUpdate(); setTimeout(() => { this._scanning = false; this.requestUpdate(); }, 2000); } ?disabled=${this._scanning}>
            ${this._scanning ? '🔍 Scanning...' : '🔍 Run Attack Surface Scan'}
          </button>
          <input class="sb" style="flex:1;margin-bottom:0" placeholder="Search assets, IPs, services..." .value=${this._search} 
            @input=${(e: Event) => { this._search = (e.target as HTMLInputElement).value; this.requestUpdate(); }/>
        </div>

        
        <div class="kpi-grid">
          ${this._kpiCards.map(k => html`
            <div class="kpi-card" style="border-left-color:${k.color}">
              <div class="kpi-card-title">${k.title}</div>
              <div class="kpi-card-value" style="color:${k.color}">${k.value}</div>
              <div class="kpi-card-change ${k.positive ? 'kpi-change-up' : 'kpi-change-down'}">${k.positive ? '&#9650;' : '&#9660;'} ${k.change} vs last period</div>
            </div>
          `)}
        </div>
        <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:14px">
          <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Recommendations</div>
          ${this._recommendations.map(r => html`
            <div class="rec-row">
              <div class="rec-priority" style="background:${r.priority}"></div>
              <div style="flex:1">
                <div class="rec-text">${r.text}</div>
                <div class="rec-meta">${r.meta}</div>
              </div>
            </div>
          `)}
        </div>
<div class="tabs">
          <span class="tab ${this._tab === 'exposed' ? 'active' : ''}" @click=${() => { this._tab = 'exposed'; this.requestUpdate(); }}>Exposed (${this._exposedAssets.length})</span>
          <span class="tab ${this._tab === 'subdomains' ? 'active' : ''}" @click=${() => { this._tab = 'subdomains'; this.requestUpdate(); }}>Subdomains (${this._subdomains.length})</span>
          <span class="tab ${this._tab === 'cert' ? 'active' : ''}" @click=${() => { this._tab = 'cert'; this.requestUpdate(); }}>SSL (${this._certHealth.length})</span>
          <span class="tab ${this._tab === 'metrics' ? 'active' : ''}" @click=${() => { this._tab = 'metrics'; this.requestUpdate(); }}>Metrics</span>
        </div>

        ${this._tab === 'exposed' ? this._renderExposedTab() : ''}
        ${this._tab === 'subdomains' ? this._renderSubdomainsTab() : ''}
        ${this._tab === 'cert' ? this._renderCertTab() : ''}
        ${this._tab === 'metrics' ? this._renderMetricsTab() : ''}
      </div>
  
    .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px; }
    .kpi-card { background: #0f172a; border-radius: 8px; padding: 12px; border-left: 3px solid; }
    .kpi-card-title { font-size: 10px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase; }
    .kpi-card-value { font-size: 20px; font-weight: 700; }
    .kpi-card-change { font-size: 10px; margin-top: 4px; }
    .kpi-change-up { color: #22c55e; }
    .kpi-change-down { color: #ef4444; }
    .rec-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #0f172a; border-radius: 6px; margin-bottom: 6px; }
    .rec-priority { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .rec-text { flex: 1; font-size: 11px; }
    .rec-meta { font-size: 10px; color: #6b7280; }
    .status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 4px; }  `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-attack-surface-dashboard': ScAttackSurfaceDashboard; } }

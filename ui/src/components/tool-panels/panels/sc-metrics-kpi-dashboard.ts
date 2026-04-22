/**
 * sc-metrics-kpi-dashboard — Security Metrics and KPI Dashboard
 * Executive-level security metrics and trend analysis
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface KpiMetric {
  name: string;
  value: string;
  unit: string;
  trend: number;
  target: string;
  status: 'on-track' | 'at-risk' | 'critical';
}

@customElement('sc-metrics-kpi-dashboard')
export class ScMetricsKpiDashboard extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .kpi-card { background: #1f2937; border-radius: 8px; padding: 16px; }
    .kpi-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .kpi-name { font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 600; }
    .kpi-status { width: 8px; height: 8px; border-radius: 50%; }
    .status-on-track { background: #22c55e; }
    .status-at-risk { background: #f97316; }
    .status-critical { background: #ef4444; }
    .kpi-value { font-size: 28px; font-weight: 700; }
    .kpi-unit { font-size: 14px; color: #94a3b8; margin-left: 4px; }
    .kpi-trend { font-size: 11px; margin-top: 4px; }
    .trend-up { color: #22c55e; }
    .trend-down { color: #ef4444; }
    .kpi-target { font-size: 10px; color: #6b7280; margin-top: 4px; }
    .chart-section { background: #1f2937; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .chart-title { font-weight: 600; font-size: 13px; margin-bottom: 12px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 14px; }
    .tab { padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: transparent; color: #94a3b8; }
    .tab:hover { background: #374151; }
    .tab.active { background: #f59e0b; color: #111827; }
    .mini-chart { height: 60px; background: #0f172a; border-radius: 4px; margin-top: 8px; }
    .progress-bar { height: 8px; background: #374151; border-radius: 4px; overflow: hidden; margin-top: 8px; }
    .progress-fill { height: 100%; border-radius: 4px; }

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

  @state() private _tab: 'overview' | 'vuln' | 'training' | 'compliance' = 'overview';

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


  private _kpis: KpiMetric[] = [
    { name: 'MTTD', value: '12', unit: 'min', trend: -15, target: '< 15 min', status: 'on-track' },
    { name: 'MTTR', value: '2.3', unit: 'hours', trend: -8, target: '< 4 hours', status: 'on-track' },
    { name: 'MTTC', value: '4.5', unit: 'hours', trend: -12, target: '< 8 hours', status: 'on-track' },
    { name: 'Security Incidents', value: '23', unit: '/month', trend: -18, target: '< 30/mo', status: 'on-track' },
    { name: 'Vuln Remediation Rate', value: '87', unit: '%', trend: 5, target: '> 85%', status: 'on-track' },
    { name: 'Patch Compliance', value: '94', unit: '%', trend: 2, target: '> 95%', status: 'at-risk' },
    { name: 'Training Completion', value: '78', unit: '%', trend: 12, target: '> 90%', status: 'at-risk' },
    { name: 'Policy Compliance', value: '92', unit: '%', trend: 3, target: '> 90%', status: 'on-track' },
  ];

  private _getStatusClass(status: string): string {
    const m: Record<string, string> = { 'on-track': 'status-on-track', 'at-risk': 'status-at-risk', 'critical': 'status-critical' };
    return m[status] ?? '';
  }

  private _getTrendClass(trend: number): string {
    return trend < 0 ? 'trend-down' : 'trend-up';
  }

  private _renderOverview() {
    return html`
      <div class="kpi-grid">
        ${this._kpis.map(k => html`
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-name">${k.name}</span>
              <span class="kpi-status ${this._getStatusClass(k.status)}"></span>
            </div>
            <div>
              <span class="kpi-value">${k.value}</span>
              <span class="kpi-unit">${k.unit}</span>
            </div>
            <div class="kpi-trend ${this._getTrendClass(k.trend)}">
              ${k.trend > 0 ? '↑' : '↓'} ${Math.abs(k.trend)}% vs last month
            </div>
            <div class="kpi-target">Target: ${k.target}</div>
          </div>
        `)}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="chart-section">
          <div class="chart-title">Security Incidents Trend (12 months)</div>
          <svg viewBox="0 0 400 100" style="width:100%;height:100px">
            <defs>
              <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#ef4444" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#ef4444" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path d="M0,80 35,75 70,70 105,72 140,60 175,55 210,50 245,45 280,48 315,35 350,30 385,25 L385,100 L0,100 Z" fill="url(#incGrad)"/>
            <polyline points="0,80 35,75 70,70 105,72 140,60 175,55 210,50 245,45 280,48 315,35 350,30 385,25" fill="none" stroke="#ef4444" stroke-width="2"/>
            <text x="10" y="95" fill="#6b7280" font-size="9">May</text>
            <text x="370" y="95" fill="#6b7280" font-size="9">Apr</text>
          </svg>
        </div>
        <div class="chart-section">
          <div class="chart-title">Incident Categories (This Month)</div>
          <svg viewBox="0 0 400 100" style="width:100%;height:100px">
            <rect x="10" y="10" width="120" height="20" fill="#ef4444" rx="4"/>
            <text x="140" y="25" fill="#e2e8f0" font-size="11">Malware (8)</text>
            <rect x="10" y="40" width="80" height="20" fill="#f97316" rx="4"/>
            <text x="100" y="55" fill="#e2e8f0" font-size="11">Phishing (5)</text>
            <rect x="10" y="70" width="50" height="20" fill="#eab308" rx="4"/>
            <text x="70" y="85" fill="#e2e8f0" font-size="11">Data (3)</text>
          </svg>
        </div>
      </div>
    `;
  }

  private _renderVuln() {
    return html`
      <div class="chart-section">
        <div class="chart-title">Vulnerability Remediation Trend</div>
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:10px;margin-bottom:12px">
          <div style="background:#0f172a;border-radius:6px;padding:12px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#ef4444">156</div>
            <div style="font-size:10px;color:#6b7280">Open Critical</div>
          </div>
          <div style="background:#0f172a;border-radius:6px;padding:12px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#f97316">423</div>
            <div style="font-size:10px;color:#6b7280">Open High</div>
          </div>
          <div style="background:#0f172a;border-radius:6px;padding:12px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#22c55e">87%</div>
            <div style="font-size:10px;color:#6b7280">Remediation Rate</div>
          </div>
          <div style="background:#0f172a;border-radius:6px;padding:12px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#3b82f6">18d</div>
            <div style="font-size:10px;color:#6b7280">Avg Time to Patch</div>
          </div>
        </div>
        <svg viewBox="0 0 400 80" style="width:100%;height:80px">
          <polyline points="0,60 50,58 100,55 150,52 200,48 250,45 300,42 350,38 400,35" fill="none" stroke="#22c55e" stroke-width="2"/>
          <text x="10" y="75" fill="#6b7280" font-size="9">Q1</text>
          <text x="370" y="75" fill="#6b7280" font-size="9">Q2</text>
        </svg>
      </div>
    `;
  }

  private _renderTraining() {
    return html`
      <div class="chart-section">
        <div class="chart-title">Security Training Completion</div>
        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;margin-bottom:12px">
          <div style="background:#0f172a;border-radius:6px;padding:12px">
            <div style="font-size:20px;font-weight:700;color:#22c55e">78%</div>
            <div style="font-size:10px;color:#6b7280">Overall Completion</div>
            <div class="progress-bar"><div class="progress-fill" style="width:78%;background:#22c55e"></div></div>
          </div>
          <div style="background:#0f172a;border-radius:6px;padding:12px">
            <div style="font-size:20px;font-weight:700;color:#3b82f6">92%</div>
            <div style="font-size:10px;color:#6b7280">Phishing Sim Pass</div>
            <div class="progress-bar"><div class="progress-fill" style="width:92%;background:#3b82f6"></div></div>
          </div>
          <div style="background:#0f172a;border-radius:6px;padding:12px">
            <div style="font-size:20px;font-weight:700;color:#f97316">1,170</div>
            <div style="font-size:10px;color:#6b7280">Users Trained</div>
          </div>
        </div>
        <div style="font-size:11px;color:#94a3b8">Department breakdown: IT (95%), Finance (82%), HR (76%), Sales (68%), Operations (71%)</div>
      </div>
    `;
  }

  private _renderCompliance() {
    return html`
      <div class="chart-section">
        <div class="chart-title">Policy Compliance by Framework</div>
        ${['SOC 2', 'ISO 27001', 'PCI DSS', 'HIPAA', 'GDPR'].map(f => html`
          <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #374151">
            <div style="width:80px;font-size:12px;font-weight:600">${f}</div>
            <div style="flex:1">
              <div class="progress-bar"><div class="progress-fill" style="width:${85 + Math.random() * 10}%;background:${85 + Math.random() * 10 > 90 ? '#22c55e' : '#3b82f6'}"></div></div>
            </div>
            <div style="width:40px;text-align:right;font-weight:600">${Math.floor(85 + Math.random() * 10)}%</div>
          </div>
        `)}
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
    { priority: '#f97316', text: 'Complete semi-annual review for all Metrics Kpi Dashboard items', meta: 'Due: 2026-05-15 | Owner: Compliance' },
    { priority: '#eab308', text: 'Update policies to reflect recent regulatory changes', meta: 'Due: 2026-06-01 | Owner: Legal' },
    { priority: '#22c55e', text: 'Schedule next quarterly review with stakeholders', meta: 'Due: 2026-06-15 | Owner: PMO' },
  ];

  private _trendData = [
    { label: 'W1', value: 65, color: '#f97316' },
    { label: 'W2', value: 72, color: '#f97316' },
    { label: 'W3', value: 68, color: '#eab308' },
    { label: 'W4', value: 78, color: '#22c55e' },
    { label: 'W5', value: 82, color: '#22c55e' },
    { label: 'W6', value: 85, color: '#22c55e' },
    { label: 'W7', value: 88, color: '#22c55e' },
    { label: 'W8', value: 92, color: '#22c55e' },
  ];

  private _breakdownData = [
    { title: 'By Severity', items: [
      { label: 'Critical', value: '5', color: '#ef4444' },
      { label: 'High', value: '12', color: '#f97316' },
      { label: 'Medium', value: '28', color: '#eab308' },
      { label: 'Low', value: '22', color: '#22c55e' },
    ]},
    { title: 'By Status', items: [
      { label: 'Open', value: '34', color: '#f97316' },
      { label: 'In Progress', value: '18', color: '#3b82f6' },
      { label: 'Resolved', value: '15', color: '#22c55e' },
    ]},
    { title: 'By Owner', items: [
      { label: 'Security Team', value: '28', color: '#06b6d4' },
      { label: 'Engineering', value: '22', color: '#3b82f6' },
      { label: 'Operations', value: '17', color: '#a855f7' },
    ]},
  ];

  private _activityFeed = [
    { time: '10m', action: 'Created', desc: 'New assessment initiated for Q2 review', user: 'analyst' },
    { time: '1h', action: 'Updated', desc: 'Risk score recalculated after mitigation', user: 'system' },
    { time: '2h', action: 'Flagged', desc: 'Threshold breach detected in monitoring', user: 'scanner' },
    { time: '4h', action: 'Approved', desc: 'Policy change approved by compliance lead', user: 'manager' },
    { time: '8h', action: 'Resolved', desc: 'Critical finding remediated and verified', user: 'engineer' },
    { time: '1d', action: 'Reviewed', desc: 'Quarterly assessment completed successfully', user: 'auditor' },
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
    const blob = new Blob(['metrics-kpi-dashboard export'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'metrics-kpi-dashboard-export.' + (format === 'markdown' ? 'md' : format); a.click();
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
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Security Metrics & KPI Dashboard Playbook</div>
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
    return html`
      <div class="panel">
        <div class="pt">📊 Security Metrics & KPI Dashboard</div>

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
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Mean Time to Detect</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#22c55e">12min</div>              <div style="flex:1;font-size:10px;color:#6b7280">65% improvement</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Mean Time to Respond</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#22c55e">3.4h</div>              <div style="flex:1;font-size:10px;color:#6b7280">18% improvement</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Vuln SLA Compliance</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#22c55e">94%</div>              <div style="flex:1;font-size:10px;color:#6b7280">Above 90% target</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Phishing Resilience</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#3b82f6">92%</div>              <div style="flex:1;font-size:10px;color:#6b7280">8% improvement</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Patch Coverage</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#06b6d4">97%</div>              <div style="flex:1;font-size:10px;color:#6b7280">2% improvement</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Access Review Completion</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#eab308">88%</div>              <div style="flex:1;font-size:10px;color:#6b7280">Below 95% target</div>            </div>
          </div>
          <div style="background:#1f2937;border-radius:8px;padding:14px">
            <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Security Insights</div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">MTTR improved by 18% this quarter, down from 4.2h to 3.4h average.</span>            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">Vulnerability remediation SLA compliance at 94%, up from 87%.</span>            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">Security awareness training completion rate exceeds 85% target.</span>            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">Zero critical incidents in the last 30 days.</span>            </div>
          </div>
        </div>

        
        <div class="trend-chart">
          <div class="trend-title">Weekly Trend (Last 8 Weeks)</div>
          <div class="trend-line">
            ${this._trendData.map(d => html`<div class="trend-bar" style="height:${d.value}%;background:${d.color}"></div>`)}
          </div>
          <div class="trend-labels">
            ${this._trendData.map(d => html`<div class="trend-lbl">${d.label}</div>`)}
          </div>
        </div>
        <div class="breakdown">
          ${this._breakdownData.map(bd => html`
            <div class="bd-card">
              <div class="bd-card-title">${bd.title}</div>
              ${bd.items.map(item => html`
                <div class="bd-item">
                  <span class="bd-item-label">${item.label}</span>
                  <span class="bd-item-value" style="color:${item.color}">${item.value}</span>
                </div>
              `)}
            </div>
          `)}
        </div>
        <div class="activity-feed">
          <div class="af-title">Activity Feed</div>
          ${this._activityFeed.map(a => html`
            <div class="af-item">
              <span class="af-time">${a.time}</span>
              <span class="af-action">${a.action}</span>
              <span class="af-desc">${a.desc}</span>
              <span class="af-user">${a.user}</span>
            </div>
          `)}
        </div>
<div class="tabs">
          <span class="tab ${this._tab === 'overview' ? 'active' : ''}" @click=${() => { this._tab = 'overview'; this.requestUpdate(); }}>Overview</span>
          <span class="tab ${this._tab === 'vuln' ? 'active' : ''}" @click=${() => { this._tab = 'vuln'; this.requestUpdate(); }}>Vulnerabilities</span>
          <span class="tab ${this._tab === 'training' ? 'active' : ''}" @click=${() => { this._tab = 'training'; this.requestUpdate(); }}>Training</span>
          <span class="tab ${this._tab === 'compliance' ? 'active' : ''}" @click=${() => { this._tab = 'compliance'; this.requestUpdate(); }}>Compliance</span>
        </div>
        ${this._tab === 'overview' ? this._renderOverview() : ''}
        ${this._tab === 'vuln' ? this._renderVuln() : ''}
        ${this._tab === 'training' ? this._renderTraining() : ''}
        ${this._tab === 'compliance' ? this._renderCompliance() : ''}
      </div>
  
    .trend-chart { background: #1f2937; border-radius: 8px; padding: 12px; margin-bottom: 14px; }
    .trend-title { font-size: 11px; font-weight: 600; color: #94a3b8; margin-bottom: 8px; }
    .trend-line { display: flex; align-items: flex-end; gap: 4px; height: 50px; }
    .trend-bar { flex: 1; border-radius: 2px 2px 0 0; min-width: 8px; transition: height 0.3s ease; }
    .trend-labels { display: flex; gap: 4px; margin-top: 4px; }
    .trend-lbl { flex: 1; font-size: 8px; color: #6b7280; text-align: center; }
    .breakdown { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
    .bd-card { background: #0f172a; border-radius: 8px; padding: 10px; }
    .bd-card-title { font-size: 10px; color: #6b7280; margin-bottom: 6px; }
    .bd-item { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; font-size: 11px; }
    .bd-item-label { color: #94a3b8; }
    .bd-item-value { font-weight: 700; }
    .activity-feed { background: #0f172a; border-radius: 8px; padding: 12px; margin-bottom: 14px; }
    .af-title { font-size: 11px; font-weight: 600; color: #94a3b8; margin-bottom: 8px; }
    .af-item { display: flex; gap: 8px; padding: 5px 0; border-bottom: 1px solid #1f2937; font-size: 11px; }
    .af-time { color: #6b7280; width: 50px; flex-shrink: 0; font-size: 10px; }
    .af-action { font-weight: 600; color: #06b6d4; width: 55px; flex-shrink: 0; }
    .af-desc { flex: 1; color: #94a3b8; }
    .af-user { color: #6b7280; font-size: 10px; }

  `;;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-metrics-kpi-dashboard': ScMetricsKpiDashboard; } }

/**
 * sc-dlp-panel — Data Loss Prevention Panel
 * DLP policy violations, sensitive data discovery, remediation tracking,
 * user risk scoring, data flow analysis, and incident timeline.
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface DlpViolation {
  id: string;
  user: string;
  policy: string;
  category: 'email' | 'usb' | 'cloud' | 'print' | 'web' | 'clipboard';
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  status: 'detected' | 'blocked' | 'investigating' | 'resolved' | 'escalated';
  dataType: string;
  dataSize: string;
  destination: string;
  actionTaken: string;
}

interface DataFlow {
  source: string;
  destination: string;
  volume: number;
  risk: 'high' | 'medium' | 'low';
  type: string;
}

interface UserRiskProfile {
  user: string;
  department: string;
  violations: number;
  blocked: number;
  riskScore: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

@customElement('sc-dlp-panel')
export class ScDlpPanel extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 16px; }
    .stat { background: #1f2937; border-radius: 8px; padding: 10px; text-align: center; }
    .sv { font-size: 18px; font-weight: 700; }
    .sl { font-size: 9px; color: #94a3b8; margin-top: 2px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 14px; flex-wrap: wrap; }
    .tab { padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: transparent; color: #94a3b8; border: 1px solid transparent; }
    .tab:hover { background: #374151; }
    .tab.active { background: #f59e0b; color: #111827; }
    .section { background: #1f2937; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .stitle { font-weight: 600; font-size: 12px; margin-bottom: 10px; color: #94a3b8; }
    .badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .b-critical { background: #450a0a; color: #fca5a5; }
    .b-high { background: #431407; color: #fdba74; }
    .b-medium { background: #422006; color: #fde047; }
    .b-low { background: #052e16; color: #86efac; }
    .b-blocked { background: #052e16; color: #86efac; }
    .b-investigating { background: #422006; color: #fde047; }
    .b-escalated { background: #450a0a; color: #fca5a5; }
    .b-resolved { background: #172554; color: #93c5fd; }
    .b-detected { background: #431407; color: #fdba74; }
    .violation-row { background: #0f172a; border-radius: 6px; padding: 12px; margin-bottom: 8px; border-left: 3px solid; cursor: pointer; transition: all 0.2s; }
    .violation-row:hover { background: #1a2332; }
    .violation-row.critical { border-color: #ef4444; }
    .violation-row.high { border-color: #f97316; }
    .violation-row.medium { border-color: #eab308; }
    .violation-row.low { border-color: #22c55e; }
    .violation-title { font-weight: 600; font-size: 12px; margin-bottom: 4px; }
    .violation-meta { display: flex; gap: 12px; font-size: 10px; color: #6b7280; flex-wrap: wrap; }
    .category-icon { font-size: 14px; margin-right: 6px; }
    .chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .progress-bar { height: 8px; background: #374151; border-radius: 4px; overflow: hidden; margin-top: 6px; }
    .progress-fill { height: 100%; border-radius: 4px; }
    .action-btn { padding: 5px 12px; border-radius: 4px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 10px; font-weight: 600; cursor: pointer; margin-right: 4px; }
    .action-btn:hover { border-color: #f59e0b; }
    .action-btn.primary { background: #f59e0b; color: #111827; border-color: #f59e0b; }
    .risk-row { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #374151; gap: 10px; }
    .risk-row:last-child { border-bottom: none; }
    .risk-bar { width: 80px; height: 6px; background: #374151; border-radius: 3px; }
    .risk-fill { height: 100%; border-radius: 3px; }
    .flow-line { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 11px; }
    .flow-arrow { color: #6b7280; font-size: 14px; }
    .detail-panel { background: #0f172a; border: 1px solid #374151; border-radius: 10px; padding: 16px; margin-bottom: 14px; animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .timeline-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px; flex-shrink: 0; }
    .timeline-line { width: 2px; height: 20px; background: #374151; margin-left: 3px; }

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

  @state() private _tab: 'violations' | 'classification' | 'policies' | 'users' | 'flows' = 'violations';
  @state() private _severityFilter = 'all';
  @state() private _selectedViolation: DlpViolation | null = null;

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


  private _violations: DlpViolation[] = [
    { id: 'v1', user: 'zhang.san@acme.com', policy: 'PCI Data - Credit Card', category: 'email', severity: 'critical', timestamp: '10m ago', status: 'blocked', dataType: 'Credit Card #', dataSize: '2.4 KB', destination: 'external@gmail.com', actionTaken: 'Email quarantined, user notified' },
    { id: 'v2', user: 'li.si@acme.com', policy: 'PII - SSN', category: 'usb', severity: 'high', timestamp: '25m ago', status: 'blocked', dataType: 'SSN', dataSize: '15 MB', destination: 'USB Drive (SanDisk)', actionTaken: 'USB write blocked, incident logged' },
    { id: 'v3', user: 'wang.wei@acme.com', policy: 'Confidential - Source Code', category: 'cloud', severity: 'high', timestamp: '1h ago', status: 'investigating', dataType: 'Source Code', dataSize: '340 MB', destination: 'personal Dropbox', actionTaken: 'Upload suspended, pending review' },
    { id: 'v4', user: 'chen.li@acme.com', policy: 'PII - Address', category: 'print', severity: 'medium', timestamp: '2h ago', status: 'detected', dataType: 'Address', dataSize: '8 pages', destination: 'HP Printer 3rd Floor', actionTaken: 'Print logged for audit trail' },
    { id: 'v5', user: 'hr@acme.com', policy: 'Employee Records', category: 'email', severity: 'low', timestamp: '3h ago', status: 'resolved', dataType: 'Employee Data', dataSize: '1.2 MB', destination: 'internal-hr@acme.com', actionTaken: 'Approved internal transfer' },
    { id: 'v6', user: 'dev@acme.com', policy: 'IP - Trade Secrets', category: 'usb', severity: 'critical', timestamp: '4h ago', status: 'escalated', dataType: 'Design Docs', dataSize: '500 MB', destination: 'USB Drive (unknown)', actionTaken: 'USB blocked, HR notified, forensics initiated' },
    { id: 'v7', user: 'marketing@acme.com', policy: 'Customer Database', category: 'web', severity: 'medium', timestamp: '5h ago', status: 'blocked', dataType: 'Customer Records', dataSize: '50 MB', destination: 'mailchimp.com', actionTaken: 'Upload blocked, requires DLP exception' },
    { id: 'v8', user: 'finance@acme.com', policy: 'Financial Reports', category: 'clipboard', severity: 'low', timestamp: '6h ago', status: 'resolved', dataType: 'Revenue Data', dataSize: '45 KB', destination: 'Remote Desktop Session', actionTaken: 'Logged, within policy for remote work' },
  ];

  private _categoryStats = [
    { name: 'Email', count: 45, pct: 35, icon: 'email' },
    { name: 'USB', count: 28, pct: 22, icon: 'usb' },
    { name: 'Cloud Upload', count: 32, pct: 25, icon: 'cloud' },
    { name: 'Print', count: 15, pct: 12, icon: 'print' },
    { name: 'Web Upload', count: 8, pct: 6, icon: 'web' },
  ];

  private _dataTypes = [
    { name: 'PII (SSN, DOB, Address)', coverage: 92, policyCount: 12, incidents: 23 },
    { name: 'PCI (Credit Cards)', coverage: 98, policyCount: 8, incidents: 5 },
    { name: 'PHI (Health Data)', coverage: 85, policyCount: 6, incidents: 8 },
    { name: 'Intellectual Property', coverage: 78, policyCount: 10, incidents: 15 },
    { name: 'Financial Records', coverage: 90, policyCount: 7, incidents: 4 },
    { name: 'Trade Secrets', coverage: 82, policyCount: 5, incidents: 3 },
  ];

  private _userRisks: UserRiskProfile[] = [
    { user: 'dev@acme.com', department: 'Engineering', violations: 12, blocked: 10, riskScore: 92, trend: 'increasing' },
    { user: 'wang.wei@acme.com', department: 'Engineering', violations: 8, blocked: 5, riskScore: 75, trend: 'increasing' },
    { user: 'zhang.san@acme.com', department: 'Sales', violations: 5, blocked: 5, riskScore: 60, trend: 'stable' },
    { user: 'li.si@acme.com', department: 'Finance', violations: 3, blocked: 3, riskScore: 45, trend: 'decreasing' },
    { user: 'marketing@acme.com', department: 'Marketing', violations: 2, blocked: 2, riskScore: 30, trend: 'stable' },
  ];

  private _dataFlows: DataFlow[] = [
    { source: 'Internal Network', destination: 'Gmail / Yahoo', volume: 45, risk: 'high', type: 'Email' },
    { source: 'Endpoints', destination: 'USB Devices', volume: 28, risk: 'high', type: 'USB' },
    { source: 'Endpoints', destination: 'Dropbox / Google Drive', volume: 32, risk: 'medium', type: 'Cloud' },
    { source: 'Applications', destination: 'External APIs', volume: 18, risk: 'medium', type: 'Web' },
    { source: 'Databases', destination: 'Analytics Platforms', volume: 12, risk: 'low', type: 'Web' },
  ];

  private _getFilteredViolations(): DlpViolation[] {
    let filtered = this._violations;
    if (this._severityFilter !== 'all') filtered = filtered.filter(v => v.severity === this._severityFilter);
    return filtered;
  }

  private _renderCategoryDonut(): string {
    const total = this._categoryStats.reduce((s, c) => s + c.count, 0);
    if (!total) return '';
    const colors = ['#ef4444', '#f97316', '#3b82f6', '#eab308', '#22c55e'];
    let ca = 0;
    const arcs = this._categoryStats.map((c, i) => {
      const p = c.count / total, sa = ca * 2 * Math.PI, ea = (ca + p) * 2 * Math.PI;
      const x1 = 60 + 35 * Math.cos(sa - Math.PI / 2), y1 = 60 + 35 * Math.sin(sa - Math.PI / 2);
      const x2 = 60 + 35 * Math.cos(ea - Math.PI / 2), y2 = 60 + 35 * Math.sin(ea - Math.PI / 2);
      const lg = p > .5 ? 1 : 0; ca += p;
      return p >= .99 ? '<circle cx="60" cy="60" r="35" fill="none" stroke="' + colors[i] + '" stroke-width="14"/>' :
        '<path d="M ' + x1 + ' ' + y1 + ' A 35 35 0 ' + lg + ' 1 ' + x2 + ' ' + y2 + '" fill="none" stroke="' + colors[i] + '" stroke-width="14"/>';
    }).join('');
    return '<svg viewBox="0 0 120 120" width="120" height="120">' + arcs + '<circle cx="60" cy="60" r="24" fill="#1f2937"/><text x="60" y="60" fill="#e2e8f0" font-size="14" font-weight="700" text-anchor="middle">' + total + '</text><text x="60" y="72" fill="#6b7280" font-size="7" text-anchor="middle">30d</text></svg>';
  }

  private _renderTrendSparkline(): string {
    const vals = [65, 72, 58, 80, 75, 90, 85, 95];
    const max = Math.max(...vals), min = Math.min(...vals), range = max - min || 1;
    const w = 140, h = 30;
    const pts = vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return x + ',' + y;
    }).join(' ');
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '"><polyline points="' + pts + '" fill="none" stroke="#f59e0b" stroke-width="1.5"/><polyline points="0,' + h + ' ' + pts + ' ' + w + ',' + h + '" fill="#f59e0b10"/></svg>';
  }


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
    const blob = new Blob(['dlp-panel export'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'dlp-panel-export.' + (format === 'markdown' ? 'md' : format); a.click();
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
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Data Loss Prevention Panel Playbook</div>
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
    const filteredViolations = this._getFilteredViolations();
    const sel = this._selectedViolation;

    return html`
      <div class="panel">
        <div class="pt">🔒 Data Loss Prevention Panel</div>

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
        <div class="stats">
          <div class="stat"><div class="sv" style="color:#ef4444">128</div><div class="sl">Violations (30d)</div></div>
          <div class="stat"><div class="sv" style="color:#22c55e">94%</div><div class="sl">Blocked Rate</div></div>
          <div class="stat"><div class="sv">87%</div><div class="sl">Data Classified</div></div>
          <div class="stat"><div class="sv" style="color:#f97316">23</div><div class="sl">Under Review</div></div>
          <div class="stat"><div class="sv">12</div><div class="sl">Active Policies</div></div>
          <div class="stat"><div class="sv" style="color:#a78bfa">3</div><div class="sl">Escalated</div></div>
        </div>

        <div class="tabs">
          ${['violations', 'classification', 'policies', 'users', 'flows'].map(t => html`
            <span class="tab ${this._tab === t ? 'active' : ''}" @click=${() => { this._tab = t as any; this._selectedViolation = null; }}>${t.charAt(0).toUpperCase() + t.slice(1)}</span>
          `)}
        </div>

        ${this._tab === 'violations' ? html`
          <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">
            ${['all', 'critical', 'high', 'medium', 'low'].map(s => html`
              <span class="badge ${this._severityFilter === s ? '' : ''}" style="cursor:pointer;${this._severityFilter === s ? 'background:#f59e0b;color:#111827' : 'background:#374151;color:#94a3b8'}" @click=${() => { this._severityFilter = s; this.requestUpdate(); }}>${s === 'all' ? 'All Severities' : s}</span>
            `)}
          </div>

          ${sel ? html`
            <div class="detail-panel">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <span style="font-weight:700;font-size:14px">${sel.dataType} - ${sel.policy}</span>
                <button class="action-btn" @click=${() => { this._selectedViolation = null; }}>✕ Close</button>
              </div>
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px">
                <div style="background:#1f2937;padding:8px;border-radius:6px"><div style="font-size:10px;color:#6b7280">User</div><div style="font-weight:600;font-size:12px">${sel.user}</div></div>
                <div style="background:#1f2937;padding:8px;border-radius:6px"><div style="font-size:10px;color:#6b7280">Category</div><div style="font-weight:600;font-size:12px">${sel.category}</div></div>
                <div style="background:#1f2937;padding:8px;border-radius:6px"><div style="font-size:10px;color:#6b7280">Data Size</div><div style="font-weight:600;font-size:12px">${sel.dataSize}</div></div>
                <div style="background:#1f2937;padding:8px;border-radius:6px"><div style="font-size:10px;color:#6b7280">Destination</div><div style="font-weight:600;font-size:12px">${sel.destination}</div></div>
              </div>
              <div style="font-size:11px;color:#94a3b8;margin-bottom:8px">
                <span class="badge b-${sel.severity}">${sel.severity}</span>
                <span class="badge b-${sel.status}">${sel.status}</span>
                <span style="margin-left:8px">${sel.timestamp}</span>
              </div>
              <div style="background:#1f2937;padding:10px;border-radius:6px;border-left:3px solid #f59e0b">
                <div style="font-weight:600;font-size:11px;color:#f59e0b;margin-bottom:4px">Action Taken</div>
                <div style="font-size:12px">${sel.actionTaken}</div>
              </div>
              <div style="margin-top:10px">
                <button class="action-btn primary">📝 Update Status</button>
                <button class="action-btn">👤 Escalate to HR</button>
                <button class="action-btn">📋 Generate Report</button>
              </div>
            </div>
          ` : nothing}

          <div class="section">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
              <div style="font-size:11px;color:#94a3b8">Violation Distribution by Channel</div>
              ${this._renderCategoryDonut()}
            </div>
            <div class="chart-grid">
              ${this._categoryStats.map(c => html`
                <div style="background:#0f172a;border-radius:6px;padding:10px">
                  <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                    <span style="font-size:12px">${c.name}</span>
                    <span style="font-weight:600">${c.count}</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width:${c.pct * 2}%;background:${c.pct > 25 ? '#f97316' : '#3b82f6'}"></div>
                  </div>
                </div>
              `)}
            </div>
          </div>
          ${filteredViolations.map(v => html`
            <div class="violation-row ${v.severity}" @click=${() => { this._selectedViolation = v; }}>
              <div class="violation-title">${v.dataType} - ${v.policy}</div>
              <div class="violation-meta">
                <span>👤 ${v.user}</span>
                <span>⏱ ${v.timestamp}</span>
                <span>📋 ${v.category}</span>
                <span>📦 ${v.dataSize}</span>
                <span class="badge b-${v.severity}">${v.severity}</span>
                <span class="badge b-${v.status}">${v.status}</span>
              </div>
            </div>
          `)}
        ` : ''}

        ${this._tab === 'classification' ? html`
          <div class="section">
            <div class="stitle">Sensitive Data Discovery Coverage</div>
            ${this._dataTypes.map(d => html`
              <div style="padding:10px 0;border-bottom:1px solid #374151">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                  <span style="font-size:12px;font-weight:600">${d.name}</span>
                  <div style="display:flex;gap:12px;align-items:center">
                    <span style="font-size:10px;color:#6b7280">${d.incidents} incidents</span>
                    <span style="color:${d.coverage > 90 ? '#22c55e' : d.coverage > 80 ? '#3b82f6' : '#f97316'};font-weight:600">${d.coverage}%</span>
                  </div>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width:${d.coverage}%;background:${d.coverage > 90 ? '#22c55e' : d.coverage > 80 ? '#3b82f6' : '#f97316'}"></div>
                </div>
                <div style="font-size:10px;color:#6b7280;margin-top:4px">${d.policyCount} DLP policies active</div>
              </div>
            `)}
          </div>
        ` : ''}

        ${this._tab === 'policies' ? html`
          <div class="section">
            <div class="stitle">DLP Policy Status</div>
            ${[
              { name: 'Block Credit Card Data via Email', status: 'Active', violations: 5, hits: 128 },
              { name: 'USB Write Protection for PII', status: 'Active', violations: 12, hits: 28 },
              { name: 'Cloud Storage Encryption Check', status: 'Active', violations: 8, hits: 32 },
              { name: 'Print Restriction - Confidential', status: 'Review', violations: 3, hits: 15 },
              { name: 'Clipboard Monitoring - Remote', status: 'Active', violations: 2, hits: 18 },
              { name: 'Web Upload Filter - External', status: 'Active', violations: 6, hits: 22 }
            ].map(p => html`
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #374151">
                <span style="font-size:12px;flex:1">${p.name}</span>
                <div style="display:flex;gap:12px;align-items:center">
                  <span style="font-size:10px;color:#6b7280">${p.hits} hits (30d)</span>
                  <span class="badge ${p.status === 'Active' ? 'b-low' : 'b-medium'}">${p.status}</span>
                </div>
              </div>
            `)}
          </div>
        ` : ''}

        ${this._tab === 'users' ? html`
          <div class="section">
            <div class="stitle">High Risk Users (Top 5)</div>
            <div style="font-size:10px;color:#94a3b8;margin-bottom:8px">Violation trend (8 weeks) ${this._renderTrendSparkline()}</div>
            ${this._userRisks.map(u => html`
              <div class="risk-row">
                <span style="flex:1;font-size:12px">
                  <div style="font-weight:600">${u.user}</div>
                  <div style="font-size:10px;color:#6b7280">${u.department} | ${u.violations} violations | ${u.blocked} blocked</div>
                </span>
                <div class="risk-bar"><div class="risk-fill" style="width:${u.riskScore}%;background:${u.riskScore >= 80 ? '#ef4444' : u.riskScore >= 50 ? '#f97316' : '#eab308'}"></div></div>
                <span style="font-weight:700;font-size:12px;width:30px;text-align:right;color:${u.riskScore >= 80 ? '#ef4444' : u.riskScore >= 50 ? '#f97316' : '#eab308'}">${u.riskScore}</span>
                <span class="badge" style="background:${u.trend === 'increasing' ? '#450a0a' : u.trend === 'decreasing' ? '#052e16' : '#422006'};color:${u.trend === 'increasing' ? '#fca5a5' : u.trend === 'decreasing' ? '#86efac' : '#fde047'}">${u.trend}</span>
              </div>
            `)}
          </div>
        ` : ''}

        ${this._tab === 'flows' ? html`
          <div class="section">
            <div class="stitle">Data Flow Analysis</div>
            ${this._dataFlows.map(f => html`
              <div class="flow-line">
                <span style="flex:1;color:#e2e8f0">${f.source}</span>
                <span class="flow-arrow">→</span>
                <span style="flex:1;color:#e2e8f0">${f.destination}</span>
                <span class="badge ${f.risk === 'high' ? 'b-critical' : f.risk === 'medium' ? 'b-medium' : 'b-low'}">${f.risk}</span>
                <span style="font-size:10px;color:#6b7280;width:60px;text-align:right">${f.volume} events</span>
              </div>
            `)}
          </div>
        ` : ''}
      </div>
      </div>
      <div style="margin-top:12px;display:flex;justify-content:center">
        <button class="btn btn-sm ${this._showEnhanced ? 'btn-primary' : 'btn-secondary'}" @click=${() => {{ this._showEnhanced = !this._showEnhanced; this.requestUpdate(); }}>${this._showEnhanced ? 'Hide' : 'Show'} Advanced</button>
      </div>
      ${this._renderEnhancedSection()}
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-dlp-panel': ScDlpPanel; } }

/**
 * sc-security-awareness-tracker — Security Awareness Training Tracker
 * Training completion, phishing simulation, and compliance tracking
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface TrainingModule {
  id: string;
  name: string;
  type: 'phishing' | 'password' | 'compliance' | 'technical' | 'general';
  duration: string;
  required: boolean;
  completionRate: number;
}

interface PhishingResult {
  campaign: string;
  date: string;
  sent: number;
  clicked: number;
  reported: number;
  compromised: number;
}

interface Department {
  name: string;
  completion: number;
  phishingPass: number;
  users: number;
}

@customElement('sc-security-awareness-tracker')
export class ScSecurityAwarenessTracker extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 16px; }
    .stat { background: #1f2937; border-radius: 8px; padding: 12px; text-align: center; }
    .sv { font-size: 20px; font-weight: 700; }
    .sl { font-size: 9px; color: #94a3b8; margin-top: 2px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 14px; }
    .tab { padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: transparent; color: #94a3b8; }
    .tab:hover { background: #374151; }
    .tab.active { background: #f59e0b; color: #111827; }
    .section { background: #1f2937; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .stitle { font-weight: 600; font-size: 12px; margin-bottom: 10px; color: #94a3b8; }
    .progress-bar { height: 8px; background: #374151; border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 4px; }
    .badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .b-required { background: #450a0a; color: #fca5a5; }
    .b-optional { background: #1f2937; color: #6b7280; }
    .module-row { background: #0f172a; border-radius: 6px; padding: 12px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; }
    .module-info { flex: 1; }
    .module-name { font-weight: 600; font-size: 12px; }
    .module-meta { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .campaign-card { background: #0f172a; border-radius: 6px; padding: 12px; margin-bottom: 8px; }
    .campaign-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .campaign-name { font-weight: 600; font-size: 13px; }
    .campaign-date { font-size: 11px; color: #6b7280; }
    .campaign-stats { display: flex; gap: 16px; font-size: 11px; }
    .campaign-stat { text-align: center; }
    .stat-value { font-size: 18px; font-weight: 700; }
    .stat-label { font-size: 9px; color: #6b7280; }
    .dept-row { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #374151; }
    .dept-name { width: 120px; font-size: 12px; }
    .dept-bar { flex: 1; margin: 0 12px; }
    .dept-pct { width: 50px; text-align: right; font-weight: 600; }
    .risk-score-card { background: #0f172a; border-radius: 8px; padding: 14px; margin-bottom: 8px; display: flex; align-items: center; gap: 14px; }
    .risk-gauge { width: 60px; height: 60px; flex-shrink: 0; }
    .risk-info { flex: 1; }
    .risk-label { font-weight: 600; font-size: 13px; }
    .risk-sublabel { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .risk-factors { display: flex; gap: 12px; margin-top: 6px; flex-wrap: wrap; }
    .risk-factor { font-size: 10px; padding: 2px 8px; border-radius: 4px; background: #1f2937; }
    .leaderboard-row { display: flex; align-items: center; padding: 8px 12px; background: #0f172a; border-radius: 6px; margin-bottom: 6px; }
    .lb-rank { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; margin-right: 10px; flex-shrink: 0; }
    .lb-rank-gold { background: #eab308; color: #111827; }
    .lb-rank-silver { background: #94a3b8; color: #111827; }
    .lb-rank-bronze { background: #d97706; color: #111827; }
    .lb-rank-default { background: #374151; color: #94a3b8; }
    .lb-name { flex: 1; font-size: 12px; font-weight: 600; }
    .lb-score { font-size: 14px; font-weight: 700; color: #22c55e; }
    .lb-dept { font-size: 10px; color: #6b7280; width: 100px; text-align: right; }
    .monthly-bar-chart { display: flex; align-items: flex-end; gap: 6px; height: 80px; padding: 0 8px; }
    .bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; }
    .bar-fill { width: 100%; border-radius: 3px 3px 0 0; transition: height 0.3s ease; min-width: 16px; }
    .bar-label { font-size: 9px; color: #6b7280; margin-top: 4px; }
    .bar-value { font-size: 8px; font-weight: 700; margin-bottom: 2px; }

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

  @state() private _tab: 'overview' | 'modules' | 'phishing' | 'departments' | 'risk' | 'leaderboard' = 'overview';

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


  private _riskScores = [
    { label: 'Overall Security Culture', score: 72, color: '#22c55e', factors: ['Training completion', 'Phishing resilience', 'Policy adherence'] },
    { label: 'Insider Threat Risk', score: 35, color: '#f97316', factors: ['Privilege escalation attempts', 'Data access anomalies', 'Policy violations'] },
    { label: 'Social Engineering Resilience', score: 68, color: '#3b82f6', factors: ['Phishing click rate', 'Vishing susceptibility', 'Baiting resistance'] },
  ];

  private _leaderboard = [
    { name: 'Alice Chen', dept: 'IT Security', score: 98, modules: 6 },
    { name: 'Bob Martinez', dept: 'Engineering', score: 95, modules: 6 },
    { name: 'Carol White', dept: 'Finance', score: 93, modules: 6 },
    { name: 'David Kim', dept: 'IT Security', score: 91, modules: 5 },
    { name: 'Eva Thompson', dept: 'Operations', score: 88, modules: 6 },
    { name: 'Frank Lee', dept: 'Engineering', score: 85, modules: 5 },
    { name: 'Grace Patel', dept: 'Marketing', score: 82, modules: 5 },
    { name: 'Henry Zhang', dept: 'Sales', score: 79, modules: 4 },
  ];

  private _monthlyData = [
    { month: 'Nov', completion: 62, phishing: 82 },
    { month: 'Dec', completion: 65, phishing: 80 },
    { month: 'Jan', completion: 68, phishing: 78 },
    { month: 'Feb', completion: 71, phishing: 76 },
    { month: 'Mar', completion: 74, phishing: 74 },
    { month: 'Apr', completion: 78, phishing: 72 },
  ];

  private _gaugeSVG(score: number, color: string, size: number = 60): string {
    const r = 24, cx = size / 2, cy = size / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;
    return `<svg viewBox="0 0 ${size} ${size}" class="risk-gauge">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#374151" stroke-width="6"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="6"
        stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"
        transform="rotate(-90 ${cx} ${cy})"/>
      <text x="${cx}" y="${cy + 1}" fill="${color}" font-size="14" font-weight="700" text-anchor="middle" dominant-baseline="middle">${score}</text>
    </svg>`;
  }

  private _modules: TrainingModule[] = [
    { id: 'm1', name: 'Phishing Awareness 2026', type: 'phishing', duration: '30 min', required: true, completionRate: 78 },
    { id: 'm2', name: 'Password Security Best Practices', type: 'password', duration: '20 min', required: true, completionRate: 92 },
    { id: 'm3', name: 'GDPR Data Protection', type: 'compliance', duration: '45 min', required: true, completionRate: 85 },
    { id: 'm4', name: 'Secure Coding Fundamentals', type: 'technical', duration: '60 min', required: false, completionRate: 45 },
    { id: 'm5', name: 'Social Engineering Defense', type: 'phishing', duration: '25 min', required: true, completionRate: 71 },
    { id: 'm6', name: 'Physical Security Awareness', type: 'general', duration: '15 min', required: false, completionRate: 88 },
  ];

  private _phishingResults: PhishingResult[] = [
    { campaign: 'Q1 2026 - Executive Spoofing', date: '2026-01-15', sent: 500, clicked: 35, reported: 420, compromised: 8 },
    { campaign: 'Q1 2026 - Fake Password Reset', date: '2026-02-20', sent: 1200, clicked: 89, reported: 980, compromised: 15 },
    { campaign: 'Q2 2026 - Attachment Malware', date: '2026-04-10', sent: 1500, clicked: 67, reported: 1280, compromised: 5 },
  ];

  private _departments: Department[] = [
    { name: 'IT Security', completion: 98, phishingPass: 95, users: 25 },
    { name: 'Finance', completion: 87, phishingPass: 91, users: 45 },
    { name: 'Engineering', completion: 82, phishingPass: 88, users: 120 },
    { name: 'Marketing', completion: 76, phishingPass: 78, users: 60 },
    { name: 'Sales', completion: 71, phishingPass: 72, users: 85 },
    { name: 'Operations', completion: 68, phishingPass: 70, users: 40 },
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
    const blob = new Blob(['security-awareness-tracker export'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'security-awareness-tracker-export.' + (format === 'markdown' ? 'md' : format); a.click();
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
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Security Awareness Training Tracker Playbook</div>
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
        <div class="pt">🎓 Security Awareness Training Tracker</div>

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
          <div class="stat"><div class="sv" style="color:#22c55e">78%</div><div class="sl">Overall Completion</div></div>
          <div class="stat"><div class="sv" style="color:#3b82f6">92%</div><div class="sl">Phishing Pass Rate</div></div>
          <div class="stat"><div class="sv">1,470</div><div class="sl">Total Users</div></div>
          <div class="stat"><div class="sv">6</div><div class="sl">Active Modules</div></div>
          <div class="stat"><div class="sv" style="color:#22c55e">+8%</div><div class="sl">vs Last Quarter</div></div>
        </div>

        <div class="tabs">
          <span class="tab ${this._tab === 'overview' ? 'active' : ''}" @click=${() => { this._tab = 'overview'; this.requestUpdate(); }}>Overview</span>
          <span class="tab ${this._tab === 'modules' ? 'active' : ''}" @click=${() => { this._tab = 'modules'; this.requestUpdate(); }}>Modules</span>
          <span class="tab ${this._tab === 'phishing' ? 'active' : ''}" @click=${() => { this._tab = 'phishing'; this.requestUpdate(); }}>Phishing Sim</span>
          <span class="tab ${this._tab === 'departments' ? 'active' : ''}" @click=${() => { this._tab = 'departments'; this.requestUpdate(); }}>By Department</span>
          <span class="tab ${this._tab === 'risk' ? 'active' : ''}" @click=${() => { this._tab = 'risk'; this.requestUpdate(); }}>Risk Scores</span>
          <span class="tab ${this._tab === 'leaderboard' ? 'active' : ''}" @click=${() => { this._tab = 'leaderboard'; this.requestUpdate(); }}>Leaderboard</span>
        </div>

        ${this._tab === 'overview' ? html`
          <div class="section">
            <div class="stitle">Training Effectiveness Trend</div>
            <svg viewBox="0 0 400 80" style="width:100%;height:80px">
              <polyline points="0,60 50,55 100,50 150,48 200,42 250,38 300,32 350,28 400,25" fill="none" stroke="#22c55e" stroke-width="2"/>
              <text x="10" y="75" fill="#6b7280" font-size="9">Q1 '25</text>
              <text x="370" y="75" fill="#6b7280" font-size="9">Q2 '26</text>
            </svg>
            <div style="font-size:11px;color:#94a3b8;margin-top:8px">Completion rate improved from 62% to 78% (+16% YoY)</div>
          </div>
          <div class="section">
            <div class="stitle">Phishing Resilience Trend</div>
            <svg viewBox="0 0 400 80" style="width:100%;height:80px">
              <polyline points="0,40 50,42 100,38 150,35 200,30 250,28 300,25 350,22 400,18" fill="none" stroke="#3b82f6" stroke-width="2"/>
              <text x="10" y="75" fill="#6b7280" font-size="9">Q1 '25</text>
              <text x="370" y="75" fill="#6b7280" font-size="9">Q2 '26</text>
            </svg>
            <div style="font-size:11px;color:#94a3b8;margin-top:8px">Click rate decreased from 18% to 6% (-67% YoY)</div>
          </div>
        ` : ''}

        ${this._tab === 'modules' ? html`
          <div class="section">
            ${this._modules.map(m => html`
              <div class="module-row">
                <div class="module-info">
                  <div class="module-name">${m.name} ${m.required ? html`<span class="badge b-required">Required</span>` : html`<span class="badge b-optional">Optional</span>`}</div>
                  <div class="module-meta">${m.type} | ${m.duration}</div>
                </div>
                <div style="width:150px">
                  <div class="progress-bar">
                    <div class="progress-fill" style="width:${m.completionRate}%;background:${m.completionRate > 80 ? '#22c55e' : m.completionRate > 60 ? '#3b82f6' : '#f97316'}"></div>
                  </div>
                  <div style="font-size:10px;color:#6b7280;margin-top:2px">${m.completionRate}%</div>
                </div>
              </div>
            `)}
          </div>
        ` : ''}

        ${this._tab === 'phishing' ? html`
          <div class="section">
            ${this._phishingResults.map(p => html`
              <div class="campaign-card">
                <div class="campaign-header">
                  <span class="campaign-name">${p.campaign}</span>
                  <span class="campaign-date">${p.date}</span>
                </div>
                <div class="campaign-stats">
                  <div class="campaign-stat">
                    <div class="stat-value">${p.sent}</div>
                    <div class="stat-label">Sent</div>
                  </div>
                  <div class="campaign-stat">
                    <div class="stat-value" style="color:#f97316">${((p.clicked/p.sent)*100).toFixed(1)}%</div>
                    <div class="stat-label">Clicked</div>
                  </div>
                  <div class="campaign-stat">
                    <div class="stat-value" style="color:#22c55e">${((p.reported/p.sent)*100).toFixed(1)}%</div>
                    <div class="stat-label">Reported</div>
                  </div>
                  <div class="campaign-stat">
                    <div class="stat-value" style="color:#ef4444">${p.compromised}</div>
                    <div class="stat-label">Compromised</div>
                  </div>
                </div>
              </div>
            `)}
          </div>
        ` : ''}

        ${this._tab === 'departments' ? html`
          <div class="section">
            <div class="stitle">Training Completion by Department</div>
            ${this._departments.map(d => html`
              <div class="dept-row">
                <div class="dept-name">${d.name}</div>
                <div class="dept-bar">
                  <div class="progress-bar">
                    <div class="progress-fill" style="width:${d.completion}%;background:${d.completion > 85 ? '#22c55e' : d.completion > 70 ? '#3b82f6' : '#f97316'}"></div>
                  </div>
                </div>
                <div class="dept-pct" style="color:${d.completion > 85 ? '#22c55e' : '#94a3b8'}">${d.completion}%</div>
              </div>
            `)}
          </div>
        ` : ''}

        ${this._tab === 'risk' ? html`
          <div class="section">
            <div class="stitle">Security Culture Risk Scores</div>
            ${this._riskScores.map(r => html`
              <div class="risk-score-card">
                ${this._gaugeSVG(r.score, r.color)}
                <div class="risk-info">
                  <div class="risk-label" style="color:${r.score >= 70 ? '#22c55e' : r.score >= 50 ? '#eab308' : '#ef4444'}">${r.label}: ${r.score}/100</div>
                  <div class="risk-sublabel">${r.score >= 70 ? 'Good posture' : r.score >= 50 ? 'Needs improvement' : 'Critical attention required'}</div>
                  <div class="risk-factors">${r.factors.map(f => html`<span class="risk-factor">${f}</span>`)}</div>
                </div>
              </div>
            `)}
          </div>
          <div class="section">
            <div class="stitle">Monthly Progress</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div>
                <div style="font-size:10px;color:#6b7280;margin-bottom:6px">Training Completion %</div>
                <div class="monthly-bar-chart">
                  ${this._monthlyData.map(m => html`
                    <div class="bar-col">
                      <div class="bar-value" style="color:#22c55e">${m.completion}%</div>
                      <div class="bar-fill" style="height:${m.completion}%;background:#22c55e"></div>
                      <div class="bar-label">${m.month}</div>
                    </div>
                  `)}
                </div>
              </div>
              <div>
                <div style="font-size:10px;color:#6b7280;margin-bottom:6px">Phishing Resilience (lower = better)</div>
                <div class="monthly-bar-chart">
                  ${this._monthlyData.map(m => html`
                    <div class="bar-col">
                      <div class="bar-value" style="color:#3b82f6">${m.phishing}%</div>
                      <div class="bar-fill" style="height:${100 - m.phishing}%;background:#3b82f6"></div>
                      <div class="bar-label">${m.month}</div>
                    </div>
                  `)}
                </div>
              </div>
            </div>
          </div>
        ` : ''}

        ${this._tab === 'leaderboard' ? html`
          <div class="section">
            <div class="stitle">Top Performers (All-Time)</div>
            ${this._leaderboard.map((u, i) => html`
              <div class="leaderboard-row">
                <div class="lb-rank ${i === 0 ? 'lb-rank-gold' : i === 1 ? 'lb-rank-silver' : i === 2 ? 'lb-rank-bronze' : 'lb-rank-default'}">${i + 1}</div>
                <div class="lb-name">${u.name}</div>
                <div class="lb-dept">${u.dept}</div>
                <div class="lb-score">${u.score}</div>
                <div style="font-size:10px;color:#6b7280;margin-left:6px">${u.modules}/6</div>
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
declare global { interface HTMLElementTagNameMap { 'sc-security-awareness-tracker': ScSecurityAwarenessTracker; } }

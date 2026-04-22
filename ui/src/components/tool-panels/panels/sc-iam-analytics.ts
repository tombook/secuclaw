/**
 * sc-iam-analytics — Identity and Access Management Analytics
 * Identity hygiene, privileged accounts, access certification,
 * authentication events, role mining, and session analysis.
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface PrivilegedAccount {
  name: string;
  type: 'admin' | 'service' | 'emergency';
  lastLogin: string;
  mfaEnabled: boolean;
  risk: 'high' | 'medium' | 'low';
  permissions: number;
  groups: string[];
  lastPasswordChange: string;
  activeSessions: number;
}

interface OrphanedAccount {
  username: string;
  lastLogin: string;
  department: string;
  status: 'detected' | 'reviewing' | 'removed';
  riskScore: number;
  dataAccess: string[];
}

interface AuthEvent {
  user: string;
  action: string;
  source: string;
  timestamp: string;
  risk: 'high' | 'medium' | 'low';
  detail: string;
}

interface RoleInfo {
  name: string;
  members: number;
  permissions: number;
  lastUsed: string;
  risk: 'high' | 'medium' | 'low';
}

@customElement('sc-iam-analytics')
export class ScIamAnalytics extends LitElement {
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
    .b-high { background: #450a0a; color: #fca5a5; }
    .b-medium { background: #422006; color: #fde047; }
    .b-low { background: #052e16; color: #86efac; }
    .b-yes { background: #052e16; color: #86efac; }
    .b-no { background: #450a0a; color: #fca5a5; }
    .b-detected { background: #431407; color: #fdba74; }
    .b-reviewing { background: #422006; color: #fde047; }
    .b-removed { background: #1f2937; color: #6b7280; }
    .account-row { display: flex; align-items: center; padding: 10px; background: #0f172a; border-radius: 6px; margin-bottom: 6px; gap: 10px; cursor: pointer; transition: all 0.2s; }
    .account-row:hover { background: #1a2332; }
    .account-info { flex: 1; }
    .account-name { font-weight: 600; font-size: 12px; }
    .account-meta { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .progress-bar { height: 8px; background: #374151; border-radius: 4px; overflow: hidden; margin-top: 8px; }
    .progress-fill { height: 100%; border-radius: 4px; }
    .cert-campaign { background: #0f172a; border-radius: 6px; padding: 12px; margin-bottom: 8px; }
    .cert-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .cert-name { font-weight: 600; font-size: 13px; }
    .cert-progress { font-size: 11px; color: #94a3b8; }
    .event-row { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 1px solid #374151; }
    .event-row:last-child { border-bottom: none; }
    .event-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
    .event-content { flex: 1; }
    .event-title { font-size: 12px; font-weight: 600; }
    .event-meta { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .action-btn { padding: 5px 12px; border-radius: 4px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 10px; font-weight: 600; cursor: pointer; margin-right: 4px; }
    .action-btn:hover { border-color: #f59e0b; }
    .action-btn.primary { background: #f59e0b; color: #111827; border-color: #f59e0b; }
    .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .metric-item { padding: 10px; background: #0f172a; border-radius: 6px; }
    .metric-label { font-size: 11px; color: #94a3b8; margin-bottom: 6px; }
    .metric-value { font-size: 14px; font-weight: 700; }
    .role-row { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #374151; gap: 10px; font-size: 12px; }
    .role-row:last-child { border-bottom: none; }
    .role-bar { width: 80px; height: 6px; background: #374151; border-radius: 3px; }
    .role-fill { height: 100%; border-radius: 3px; }
    .group-tag { font-size: 9px; background: #172554; color: #93c5fd; padding: 2px 6px; border-radius: 3px; margin: 1px; display: inline-block; }
    .detail-panel { background: #0f172a; border: 1px solid #374151; border-radius: 10px; padding: 16px; margin-bottom: 14px; animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .detail-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
    .dm { background: #1f2937; border-radius: 6px; padding: 10px; }
    .dm-label { font-size: 10px; color: #6b7280; margin-bottom: 4px; }
    .dm-value { font-size: 13px; font-weight: 700; }

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

  @state() private _tab: 'overview' | 'privileged' | 'orphaned' | 'certification' | 'events' | 'roles' = 'overview';
  @state() private _selectedAccount: PrivilegedAccount | null = null;

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


  private _privilegedAccounts: PrivilegedAccount[] = [
    { name: 'domain\\admin-service', type: 'admin', lastLogin: '2h ago', mfaEnabled: true, risk: 'low', permissions: 45, groups: ['Domain Admins', 'Enterprise Admins'], lastPasswordChange: '14d ago', activeSessions: 3 },
    { name: 'svc-backup@acme.com', type: 'service', lastLogin: '1d ago', mfaEnabled: false, risk: 'high', permissions: 32, groups: ['Backup Operators', 'Domain Users'], lastPasswordChange: '90d ago', activeSessions: 0 },
    { name: 'domain\\enterprise-admin', type: 'admin', lastLogin: '3d ago', mfaEnabled: true, risk: 'medium', permissions: 67, groups: ['Enterprise Admins', 'Schema Admins'], lastPasswordChange: '7d ago', activeSessions: 1 },
    { name: 'emergency-break-glass', type: 'emergency', lastLogin: '30d ago', mfaEnabled: false, risk: 'high', permissions: 89, groups: ['Domain Admins', 'Enterprise Admins', 'Schema Admins'], lastPasswordChange: '60d ago', activeSessions: 0 },
    { name: 'svc-monitor@acme.com', type: 'service', lastLogin: '4h ago', mfaEnabled: true, risk: 'low', permissions: 12, groups: ['Monitoring Operators'], lastPasswordChange: '21d ago', activeSessions: 5 },
    { name: 'domain\\schema-admin', type: 'admin', lastLogin: '7d ago', mfaEnabled: true, risk: 'medium', permissions: 55, groups: ['Schema Admins', 'Domain Admins'], lastPasswordChange: '14d ago', activeSessions: 0 },
    { name: 'svc-deploy@acme.com', type: 'service', lastLogin: '6h ago', mfaEnabled: false, risk: 'medium', permissions: 28, groups: ['Server Operators', 'CI/CD'], lastPasswordChange: '45d ago', activeSessions: 2 },
  ];

  private _orphanedAccounts: OrphanedAccount[] = [
    { username: 'jsmith@acme.com', lastLogin: '180d ago', department: 'Sales', status: 'detected', riskScore: 72, dataAccess: ['CRM', 'Customer DB', 'Finance Reports'] },
    { username: 'former-emp@acme.com', lastLogin: '365d ago', department: 'Engineering', status: 'removed', riskScore: 90, dataAccess: ['Source Code', 'CI/CD', 'Production Servers'] },
    { username: 'contractor-2025@acme.com', lastLogin: '90d ago', department: 'Marketing', status: 'reviewing', riskScore: 45, dataAccess: ['Marketing Portal', 'Analytics'] },
    { username: 'intern-summer@acme.com', lastLogin: '270d ago', department: 'Engineering', status: 'detected', riskScore: 35, dataAccess: ['Dev Environment', 'Wiki'] },
    { username: 'vendor-support@acme.com', lastLogin: '120d ago', department: 'IT', status: 'reviewing', riskScore: 65, dataAccess: ['VPN', 'Helpdesk System', 'Network Devices'] },
  ];

  private _certCampaigns = [
    { name: 'Q2 2026 Access Certification', progress: 78, total: 1250, completed: 975, dueDate: '2026-05-15', status: 'In Progress', manager: 'CISO Office' },
    { name: 'Privileged Account Review', progress: 100, total: 45, completed: 45, dueDate: '2026-04-30', status: 'Completed', manager: 'IT Security' },
    { name: 'Service Account Audit', progress: 45, total: 120, completed: 54, dueDate: '2026-06-01', status: 'In Progress', manager: 'DevOps Lead' },
    { name: 'Contractor Access Review', progress: 20, total: 85, completed: 17, dueDate: '2026-04-25', status: 'At Risk', manager: 'HR & IT' },
  ];

  private _authEvents: AuthEvent[] = [
    { user: 'admin@acme.com', action: 'Privilege Escalation', source: '10.0.1.5 (VPN)', timestamp: '15m ago', risk: 'high', detail: 'Granted Domain Admin rights via sudo' },
    { user: 'svc-backup@acme.com', action: 'Unusual Login Location', source: '45.33.xx.xx (Russia)', timestamp: '1h ago', risk: 'high', detail: 'First login from this geolocation' },
    { user: 'contractor@acme.com', action: 'After-hours Access', source: 'VPN Gateway', timestamp: '3h ago', risk: 'medium', detail: 'Accessed production database at 02:15 local time' },
    { user: 'domain\\admin-service', action: 'Bulk Group Modification', source: '10.0.2.10', timestamp: '4h ago', risk: 'medium', detail: 'Added 15 users to Domain Admins group' },
    { user: 'unknown@external.com', action: 'Brute Force Attempt', source: '203.0.113.50', timestamp: '5h ago', risk: 'high', detail: '1,247 failed login attempts against RDP gateway' },
    { user: 'zhang.san@acme.com', action: 'Password Reset', source: 'SSO Portal', timestamp: '6h ago', risk: 'low', detail: 'User-initiated password change via self-service' },
    { user: 'svc-deploy@acme.com', action: 'MFA Bypass Attempt', source: 'CI/CD Pipeline', timestamp: '8h ago', risk: 'medium', detail: 'Service account attempted auth without MFA challenge' },
  ];

  private _roles: RoleInfo[] = [
    { name: 'Domain Admins', members: 8, permissions: 89, lastUsed: '2h ago', risk: 'high' },
    { name: 'Enterprise Admins', members: 3, permissions: 95, lastUsed: '3d ago', risk: 'high' },
    { name: 'Schema Admins', members: 2, permissions: 72, lastUsed: '7d ago', risk: 'high' },
    { name: 'Server Operators', members: 15, permissions: 45, lastUsed: '1h ago', risk: 'medium' },
    { name: 'Backup Operators', members: 12, permissions: 38, lastUsed: '4h ago', risk: 'medium' },
    { name: 'Account Operators', members: 20, permissions: 30, lastUsed: '30m ago', risk: 'low' },
    { name: 'VPN Users', members: 450, permissions: 10, lastUsed: '5m ago', risk: 'low' },
    { name: 'CI/CD Service Accounts', members: 8, permissions: 55, lastUsed: '10m ago', risk: 'medium' },
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
    const blob = new Blob(['iam-analytics export'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'iam-analytics-export.' + (format === 'markdown' ? 'md' : format); a.click();
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
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Identity & Access Management Analytics Playbook</div>
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
    const sel = this._selectedAccount;
    const totalPermissions = this._privilegedAccounts.reduce((s, a) => s + a.permissions, 0);
    const mfaMissing = this._privilegedAccounts.filter(a => !a.mfaEnabled).length;
    const highRiskEvents = this._authEvents.filter(e => e.risk === 'high').length;

    return html`
      <div class="panel">
        <div class="pt">🔑 Identity & Access Management Analytics</div>

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
          <div class="stat"><div class="sv" style="color:#22c55e">68%</div><div class="sl">Identity Score</div></div>
          <div class="stat"><div class="sv">1,450</div><div class="sl">Total Users</div></div>
          <div class="stat"><div class="sv">${this._privilegedAccounts.length}</div><div class="sl">Privileged</div></div>
          <div class="stat"><div class="sv" style="color:#f97316">${this._orphanedAccounts.filter(a => a.status !== 'removed').length}</div><div class="sl">Orphaned</div></div>
          <div class="stat"><div class="sv" style="color:#3b82f6">92%</div><div class="sl">MFA Coverage</div></div>
          <div class="stat"><div class="sv" style="color:#ef4444">${highRiskEvents}</div><div class="sl">High Risk Events</div></div>
        </div>

        <div class="tabs">
          ${['overview', 'privileged', 'orphaned', 'certification', 'events', 'roles'].map(t => html`
            <span class="tab ${this._tab === t ? 'active' : ''}" @click=${() => { this._tab = t as any; this._selectedAccount = null; }}>${t.charAt(0).toUpperCase() + t.slice(1)}</span>
          `)}
        </div>

        ${sel ? html`
          <div class="detail-panel">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
              <span style="font-weight:700;font-size:14px">${sel.name}</span>
              <button class="action-btn" @click=${() => { this._selectedAccount = null; }}>✕ Close</button>
            </div>
            <div class="detail-grid">
              <div class="dm"><div class="dm-label">Type</div><div class="dm-value">${sel.type}</div></div>
              <div class="dm"><div class="dm-label">Risk Level</div><div class="dm-value" style="color:${sel.risk === 'high' ? '#ef4444' : sel.risk === 'medium' ? '#f97316' : '#22c55e'}">${sel.risk}</div></div>
              <div class="dm"><div class="dm-label">MFA</div><div class="dm-value"><span class="badge ${sel.mfaEnabled ? 'b-yes' : 'b-no'}">${sel.mfaEnabled ? 'Enabled' : 'Disabled'}</span></div></div>
              <div class="dm"><div class="dm-label">Last Login</div><div class="dm-value" style="font-size:12px">${sel.lastLogin}</div></div>
              <div class="dm"><div class="dm-label">Permissions</div><div class="dm-value">${sel.permissions}</div></div>
              <div class="dm"><div class="dm-label">Active Sessions</div><div class="dm-value">${sel.activeSessions}</div></div>
              <div class="dm"><div class="dm-label">Last Password Change</div><div class="dm-value" style="font-size:12px">${sel.lastPasswordChange}</div></div>
              <div class="dm" style="grid-column:span 2"><div class="dm-label">Groups (${sel.groups.length})</div><div>${sel.groups.map(g => html`<span class="group-tag">${g}</span>`)}</div></div>
            </div>
            <div style="margin-top:10px;display:flex;gap:6px">
              <button class="action-btn primary">🔄 Rotate Password</button>
              <button class="action-btn">🔒 Disable Account</button>
              <button class="action-btn">📋 Audit Permissions</button>
              <button class="action-btn">📝 Add Comment</button>
            </div>
          </div>
        ` : nothing}

        ${this._tab === 'overview' ? html`
          <div class="section">
            <div class="stitle">Identity Hygiene Metrics</div>
            <div class="metric-grid">
              <div class="metric-item">
                <div class="metric-label">MFA Adoption</div>
                <div style="height:12px;background:#374151;border-radius:6px;overflow:hidden">
                  <div style="width:92%;height:100%;background:#22c55e;border-radius:6px"></div>
                </div>
                <div style="font-size:10px;color:#6b7280;margin-top:2px">92% (1,334/1,450)</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Password Policy Compliance</div>
                <div style="height:12px;background:#374151;border-radius:6px;overflow:hidden">
                  <div style="width:87%;height:100%;background:#3b82f6;border-radius:6px"></div>
                </div>
                <div style="font-size:10px;color:#6b7280;margin-top:2px">87%</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Privileged Account MFA</div>
                <div style="height:12px;background:#374151;border-radius:6px;overflow:hidden">
                  <div style="width:${Math.round((this._privilegedAccounts.filter(a => a.mfaEnabled).length / this._privilegedAccounts.length) * 100)}%;height:100%;background:${mfaMissing > 0 ? '#f97316' : '#22c55e'};border-radius:6px"></div>
                </div>
                <div style="font-size:10px;color:${mfaMissing > 0 ? '#f97316' : '#6b7280'};margin-top:2px">${mfaMissing} accounts without MFA</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Total Permissions (Privileged)</div>
                <div class="metric-value">${totalPermissions}</div>
                <div style="font-size:10px;color:#6b7280;margin-top:2px">Across ${this._privilegedAccounts.length} accounts</div>
              </div>
            </div>
          </div>
          <div class="section">
            <div class="stitle">Recent Access Anomaly Alerts</div>
            ${this._authEvents.slice(0, 4).map(e => html`
              <div class="event-row">
                <div class="event-dot" style="background:${e.risk === 'high' ? '#ef4444' : e.risk === 'medium' ? '#f97316' : '#22c55e'}"></div>
                <div class="event-content">
                  <div class="event-title">${e.action}</div>
                  <div class="event-meta">${e.user} | ${e.source} | ${e.timestamp}</div>
                  <div style="font-size:10px;color:#94a3b8;margin-top:2px">${e.detail}</div>
                </div>
                <span class="badge b-${e.risk}">${e.risk}</span>
              </div>
            `)}
          </div>
        ` : ''}

        ${this._tab === 'privileged' ? html`
          <div class="section">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
              <div class="stitle" style="margin-bottom:0">Privileged Account Inventory (${this._privilegedAccounts.length})</div>
              <button class="action-btn primary">+ Review All</button>
            </div>
            ${this._privilegedAccounts.map(a => html`
              <div class="account-row" @click=${() => { this._selectedAccount = a; }}>
                <div class="account-info">
                  <div class="account-name">${a.name}</div>
                  <div class="account-meta">${a.type} | Last login: ${a.lastLogin} | ${a.permissions} permissions | ${a.activeSessions} sessions</div>
                </div>
                <div style="display:flex;gap:6px;align-items:center">
                  <span class="badge ${a.mfaEnabled ? 'b-yes' : 'b-no'}">MFA ${a.mfaEnabled ? '✓' : '✗'}</span>
                  <span class="badge b-${a.risk}">${a.risk}</span>
                </div>
              </div>
            `)}
          </div>
        ` : ''}

        ${this._tab === 'orphaned' ? html`
          <div class="section">
            <div style="font-size:11px;color:#f97316;margin-bottom:10px">⚠ Orphaned accounts detected: review for deprovisioning</div>
            ${this._orphanedAccounts.map(a => html`
              <div class="account-row">
                <div class="account-info">
                  <div class="account-name">${a.username}</div>
                  <div class="account-meta">${a.department} | Last login: ${a.lastLogin} | Risk: ${a.riskScore}/100</div>
                  <div style="margin-top:4px">${a.dataAccess.map(d => html`<span class="group-tag">${d}</span>`)}</div>
                </div>
                <div style="display:flex;gap:6px;align-items:center">
                  <span class="badge b-${a.status}">${a.status}</span>
                  <button class="action-btn" style="font-size:9px">Deprovision</button>
                </div>
              </div>
            `)}
          </div>
        ` : ''}

        ${this._tab === 'certification' ? html`
          <div class="section">
            <div class="stitle">Access Certification Campaigns</div>
            ${this._certCampaigns.map(c => html`
              <div class="cert-campaign">
                <div class="cert-header">
                  <span class="cert-name">${c.name}</span>
                  <div style="display:flex;gap:6px;align-items:center">
                    <span style="font-size:10px;color:#6b7280">Manager: ${c.manager}</span>
                    <span class="badge b-${c.status === 'Completed' ? 'low' : c.status === 'At Risk' ? 'high' : 'medium'}">${c.status}</span>
                  </div>
                </div>
                <div style="font-size:10px;color:#6b7280;margin-bottom:6px">Due: ${c.dueDate}</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width:${c.progress}%;background:${c.progress === 100 ? '#22c55e' : c.status === 'At Risk' ? '#ef4444' : '#3b82f6'}"></div>
                </div>
                <div class="cert-progress">${c.completed}/${c.total} certified (${c.progress}%)</div>
              </div>
            `)}
          </div>
        ` : ''}

        ${this._tab === 'events' ? html`
          <div class="section">
            <div class="stitle">Authentication Event Timeline</div>
            ${this._authEvents.map(e => html`
              <div class="event-row">
                <div class="event-dot" style="background:${e.risk === 'high' ? '#ef4444' : e.risk === 'medium' ? '#f97316' : '#22c55e'}"></div>
                <div class="event-content">
                  <div class="event-title">${e.action}</div>
                  <div class="event-meta">${e.user} | ${e.source} | ${e.timestamp}</div>
                  <div style="font-size:10px;color:#94a3b8;margin-top:2px">${e.detail}</div>
                </div>
                <span class="badge b-${e.risk}">${e.risk}</span>
              </div>
            `)}
          </div>
        ` : ''}

        ${this._tab === 'roles' ? html`
          <div class="section">
            <div class="stitle">Role Mining Analysis</div>
            ${this._roles.map(r => html`
              <div class="role-row">
                <span style="flex:1;font-weight:600">${r.name}</span>
                <span style="font-size:10px;color:#6b7280;width:70px">${r.members} members</span>
                <div class="role-bar"><div class="role-fill" style="width:${r.permissions}%;background:${r.permissions >= 70 ? '#ef4444' : r.permissions >= 40 ? '#f97316' : '#22c55e'}"></div></div>
                <span style="font-size:10px;width:50px;text-align:right;color:#6b7280">${r.permissions} perms</span>
                <span style="font-size:10px;color:#6b7280;width:70px">Last: ${r.lastUsed}</span>
                <span class="badge b-${r.risk}">${r.risk}</span>
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
declare global { interface HTMLElementTagNameMap { 'sc-iam-analytics': ScIamAnalytics; } }

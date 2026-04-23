/**
 * sc-vendor-risk-assessment - Vendor Risk Assessment Panel
 * Third-party risk management with TPRM workflow, score gauges, trend sparklines
 * Extended: detail panel, computed stats, action buttons, sortable columns, pagination
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface Vendor {
  id: string; name: string; tier: 'critical' | 'high' | 'medium' | 'low';
  category: string; score: number; status: 'active' | 'under-review' | 'pending' | 'offboarded';
  soc2: boolean; iso27001: boolean; lastAssessment: string;
  contracts: number; dataShared: string; trend: number[];
  riskFactors: string[]; slaCompliance: number; incidents: number;
  contactName: string; contactEmail: string; renewalDate: string;
}

interface WorkflowTask {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'blocked';
  assignee: string;
  blockedBy: string[];
  slaDeadline: string;
  priority: Priority;
  createdAt: string;
  completedAt: string | null;
}

interface ExecutionStep {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'success' | 'error';
  startedAt: string | null;
  completedAt: string | null;
  duration: number;
  output: string;
}

interface ExecutionRecord {
  id: string;
  name: string;
  startedAt: string;
  completedAt: string | null;
  steps: ExecutionStep[];
  status: 'running' | 'success' | 'failed';
}

interface ChampionConfig {
  autoEscalationEnabled: boolean;
  escalationThresholdHours: number;
  criticalSlaMinutes: number;
  highSlaMinutes: number;
  mediumSlaMinutes: number;
  autoAssignEnabled: boolean;
  notificationChannels: string[];
  reportSchedule: string;
  maxConcurrentTasks: number;
}

interface CommentEntry {
  id: string;
  author: string;
  timestamp: string;
  text: string;
}

@customElement('sc-vendor-risk-assessment')
export class ScVendorRiskAssessment extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 16px; }
    .stat { background: #1f2937; border-radius: 8px; padding: 12px; text-align: center; }
    .sv { font-size: 20px; font-weight: 700; }
    .sl { font-size: 9px; color: #94a3b8; margin-top: 2px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 14px; }
    .tab { padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: #1f2937; border: 1px solid #374151; color: #94a3b8; transition: all 0.2s; }
    .tab:hover { border-color: #f59e0b; }
    .tab.active { background: #f59e0b; color: #111827; border-color: #f59e0b; }
    .section { background: #1f2937; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .stitle { font-weight: 600; font-size: 12px; margin-bottom: 10px; color: #94a3b8; }
    .badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .b-critical { background: #450a0a; color: #fca5a5; }
    .b-high { background: #431407; color: #fdba74; }
    .b-medium { background: #422006; color: #fde047; }
    .b-low { background: #052e16; color: #86efac; }
    .vendor-row { background: #0f172a; border-radius: 8px; padding: 12px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: border-color 0.2s; border: 1px solid transparent; }
    .vendor-row:hover { border-color: #f59e0b; }
    .vendor-info { flex: 1; min-width: 0; }
    .vendor-name { font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .vendor-meta { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .score-ring { width: 48px; height: 48px; flex-shrink: 0; }
    .workflow-step { display: flex; align-items: center; gap: 8px; padding: 8px 0; }
    .step-num { width: 24px; height: 24px; border-radius: 50%; background: #374151; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .step-line { flex: 1; height: 2px; background: #374151; }
    .detail-panel { background: #0a0e17; border: 1px solid #374151; border-radius: 10px; padding: 16px; margin-bottom: 14px; animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .detail-title { font-size: 15px; font-weight: 700; }
    .detail-close { background: #374151; border: none; color: #94a3b8; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-size: 11px; }
    .detail-close:hover { background: #4b5563; color: #fff; }
    .detail-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px; }
    .dm { background: #1f2937; border-radius: 6px; padding: 10px; }
    .dm-label { font-size: 10px; color: #6b7280; margin-bottom: 4px; }
    .dm-value { font-size: 15px; font-weight: 700; }
    .action-bar { display: flex; gap: 6px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #1f2937; }
    .action-btn { padding: 6px 14px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .action-btn:hover { border-color: #f59e0b; background: #f59e0b20; }
    svg.sparkline { width: 50px; height: 20px; display: inline-block; vertical-align: middle; }
    .table { width: 100%; font-size: 12px; border-collapse: collapse; }
    .table th { text-align: left; padding: 8px; color: #94a3b8; font-size: 10px; border-bottom: 2px solid #374151; cursor: pointer; }
    .table th:hover { color: #f59e0b; }
    .table td { padding: 8px; border-bottom: 1px solid #1f2937; }
    .sort-arrow { font-size: 9px; margin-left: 4px; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 6px; margin-top: 12px; }
    .pg-btn { background: #1f2937; border: 1px solid #374151; color: #94a3b8; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-size: 11px; }
    .pg-btn:hover { border-color: #f59e0b; }
    .pg-btn.active { background: #f59e0b; color: #111827; border-color: #f59e0b; }
    .bar-fill { height: 4px; border-radius: 2px; transition: width 0.3s; }
    .compliance-cell { width: 20px; height: 20px; border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; margin: 1px; }
    .risk-matrix { display: grid; grid-template-columns: 40px repeat(5, 1fr); gap: 2px; font-size: 9px; }
    .matrix-cell { aspect-ratio: 1; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-weight: 600; }
    .comparison-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid #1f2937; font-size: 11px; }
    .comp-label { width: 120px; color: #94a3b8; font-weight: 600; flex-shrink: 0; }
    .comp-bar { flex: 1; height: 10px; background: #1f2937; border-radius: 5px; overflow: hidden; position: relative; }
    .comp-fill { height: 100%; border-radius: 5px; }
    .notification { position: fixed; top: 20px; right: 20px; background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 12px 16px; font-size: 12px; z-index: 10000; animation: notifSlide 0.3s ease; max-width: 320px; border-left: 4px solid #22c55e; }
    @keyframes notifSlide { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .incident-timeline { display: flex; flex-direction: column; gap: 4px; }
    .incident-item { display: flex; gap: 8px; padding: 6px 10px; background: #0f172a; border-radius: 6px; font-size: 10px; }
    .incident-date { width: 60px; color: #6b7280; flex-shrink: 0; }
    .sla-bar { display: flex; align-items: center; gap: 12px; background: #1f2937; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; }
    .sla-indicator { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  `;

  @state() private _tab: 'inventory' | 'assessments' | 'workflow' | 'compliance' | 'compare' = 'inventory';
  @state() private _selected: Vendor | null = null;
  @state() private _sortKey: string = 'score';
  @state() private _sortDir: 'asc' | 'desc' = 'desc';
  @state() private _tierFilter: string = 'all';
  @state() private _page = 1;
  @state() private _notifications: Array<{id: string; message: string; timestamp: number}}> = [];
  @state() private _compareVendors: Set<string> = new Set();
  @state() private _showCompare = false;
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

  private readonly _perPage = 6;

  private _complianceRequirements = [
    { framework: 'SOC 2', control: 'CC6.1', title: 'Logical Access', vendors: ['v1','v2','v3','v4','v7','v9','v14','v15'] },
    { framework: 'SOC 2', control: 'CC6.3', title: 'Data Encryption', vendors: ['v1','v2','v3','v5','v7','v11','v14','v15'] },
    { framework: 'SOC 2', control: 'CC7.2', title: 'Incident Response', vendors: ['v1','v3','v4','v7','v9','v14','v15'] },
    { framework: 'ISO 27001', control: 'A.9.1', title: 'Access Control', vendors: ['v1','v2','v3','v4','v7','v9','v11','v13','v14','v15'] },
    { framework: 'ISO 27001', control: 'A.12.4', title: 'Event Logging', vendors: ['v1','v5','v7','v9','v13','v14'] },
    { framework: 'GDPR', control: 'Art. 28', title: 'Processor DPA', vendors: ['v1','v2','v3','v4','v7','v8','v15'] },
    { framework: 'GDPR', control: 'Art. 32', title: 'Security Measures', vendors: ['v1','v2','v3','v5','v11','v15'] },
    { framework: 'PCI DSS', control: 'Req 12', title: 'Security Policy', vendors: ['v3','v1','v2'] },
  ];

  private _vendorIncidents = [
    { vendorId: 'v4', date: '2026-03-15', title: 'Okta MFA bypass vulnerability', severity: 'high', status: 'resolved', impact: 'Affected SSO authentication for 2 hours' },
    { vendorId: 'v4', date: '2025-12-01', title: 'Okta support access incident', severity: 'critical', status: 'resolved', impact: 'Unauthorized access to customer org data' },
    { vendorId: 'v1', date: '2026-01-10', title: 'AWS us-east-1 region outage', severity: 'medium', status: 'resolved', impact: 'Service disruption for 45 minutes' },
    { vendorId: 'v5', date: '2026-02-20', title: 'Datadog query performance degradation', severity: 'low', status: 'resolved', impact: 'Dashboard loading delays' },
    { vendorId: 'v7', date: '2025-11-05', title: 'GitHub Actions secret leak', severity: 'high', status: 'resolved', impact: 'Exposed CI/CD secrets in public repos' },
    { vendorId: 'v10', date: '2026-01-25', title: 'Twilio SMS delivery failures', severity: 'medium', status: 'resolved', impact: 'OTP delivery delays affecting user login' },
    { vendorId: 'v16', date: '2026-03-01', title: 'Zendesk data access audit finding', severity: 'medium', status: 'investigating', impact: 'Agent access to unrelated tickets' },
  ];

  private _notify(message: string) {
    const n = { id: 'n' + Date.now(), message, timestamp: Date.now() };
    this._notifications = [n, ...this._notifications].slice(0, 3);
    setTimeout(() => { this._notifications = this._notifications.filter(x => x.id !== n.id); }, 4000);
  }

  private _toggleCompare(vendorId: string) {
    const s = new Set(this._compareVendors);
    if (s.has(vendorId)) s.delete(vendorId); else if (s.size < 4) s.add(vendorId);
    this._compareVendors = s;
    this._showCompare = s.size >= 2;
  }

  private _exportVendorData(format: string) {
    if (format === 'csv') {
      const headers = ['Name','Tier','Category','Score','Status','SOC2','ISO27001','SLA','Incidents'];
      const rows = this._vendors.map(v => [v.name,v.tier,v.category,v.score,v.status,v.soc2,v.iso27001,v.slaCompliance,v.incidents]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'vendor-risk.csv'; a.click(); URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([JSON.stringify(this._vendors, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'vendor-risk.json'; a.click(); URL.revokeObjectURL(url);
    }
    this._notify('Vendor data exported as ' + format.toUpperCase());
  }

  private _renderCompliance() {
    const vendorIds = this._vendors.filter(v => v.status !== 'offboarded').map(v => v.id);
    return html`
      <div class="section">
        <div class="stitle">Regulatory Compliance Mapping</div>
        <div style="overflow-x:auto">
          <table class="table" style="min-width:600px">
            <tr><th>Framework</th><th>Control</th><th>Title</th><th>Coverage</th><th>Vendors</th></tr>
            ${this._complianceRequirements.map(req => {
              const covered = req.vendors.filter(v => vendorIds.includes(v)).length;
              const pct = Math.round((covered / vendorIds.length) * 100);
              return html`<tr>
                <td><span class="badge b-medium">${req.framework}</span></td>
                <td style="font-family:monospace;color:#94a3b8;font-size:10px">${req.control}</td>
                <td>${req.title}</td>
                <td><div style="display:flex;align-items:center;gap:6px"><div style="width:60px;height:6px;background:#374151;border-radius:3px;overflow:hidden"><div style="width:${pct}%;height:100%;background:${pct > 80 ? '#22c55e' : pct > 50 ? '#eab308' : '#ef4444'};border-radius:3px"></div></div><span style="font-size:10px;color:#94a3b8">${pct}%</span></div></td>
                <td style="font-size:10px;color:#6b7280">${covered}/${vendorIds.length}</td>
              </tr>`;
            })}
          </table>
        </div>
      </div>
      <div class="section">
        <div class="stitle">Vendor Incident History</div>
        ${this._vendorIncidents.map(inc => {
          const vendor = this._vendors.find(v => v.id === inc.vendorId);
          return html`<div class="incident-item">
            <span class="incident-date">${inc.date}</span>
            <span style="flex-shrink:0;width:100px;font-weight:600;color:#e2e8f0">${vendor?.name || 'Unknown'}</span>
            <span style="flex:1">${inc.title}</span>
            <span class="badge b-${inc.severity}">${inc.severity}</span>
            <span class="badge ${inc.status === 'resolved' ? 'b-low' : 'b-medium'}">${inc.status}</span>
          </div>`;
        })}
      </div>
    `;
  }

  private _renderCompare() {
    const vendors = this._vendors.filter(v => this._compareVendors.has(v.id));
    if (vendors.length < 2) return html`<div style="text-align:center;padding:30px;color:#6b7280;font-size:12px">Select at least 2 vendors from the Inventory tab to compare</div>`;
    const metrics = [
      { label: 'Risk Score', key: 'score', max: 100, higher: true },
      { label: 'SLA Compliance', key: 'slaCompliance', max: 100, higher: true },
      { label: 'Contracts', key: 'contracts', max: 10, higher: false },
      { label: 'Incidents (12mo)', key: 'incidents', max: 5, higher: false },
    ];
    const colors = ['#22c55e', '#3b82f6', '#f97316', '#a855f7'];
    return html`
      <div class="section">
        <div class="stitle">Vendor Comparison</div>
        <div style="display:flex;gap:12px;margin-bottom:14px">
          ${vendors.map((v, i) => html`<div style="flex:1;background:#0f172a;border-radius:6px;padding:10px;text-align:center;border-top:3px solid ${colors[i]}">
            <div style="font-size:11px;font-weight:600">${v.name}</div>
            <div style="font-size:18px;font-weight:700;color:${this._scoreColor(v.score)}">${v.score}</div>
          </div>`)}
        </div>
        ${metrics.map(m => html`<div class="comparison-row">
          <span class="comp-label">${m.label}</span>
          ${vendors.map((v, i) => {
            const val = (v}} as any)[m.key];
            const pct = Math.min((val / m.max) * 100, 100);
            return html`<div style="flex:1;display:flex;align-items:center;gap:4px">
              <div class="comp-bar"><div class="comp-fill" style="width:${pct}%;background:${colors[i]}"></div></div>
              <span style="width:40px;text-align:right;font-weight:700;font-size:11px">${m.key === 'slaCompliance' ? val + '%' : val}</span>
            </div>`;
          })}
        </div>`)}
        <div class="comparison-row" style="margin-top:8px">
          <span class="comp-label">Security Certs</span>
          ${vendors.map((v, i) => html`<div style="flex:1;display:flex;gap:4px">
            <span class="badge ${v.soc2 ? 'b-low' : 'b-high'}" style="color:${colors[i]}">SOC2</span>
            <span class="badge ${v.iso27001 ? 'b-low' : 'b-medium'}" style="color:${colors[i]}">ISO</span>
          </div>`)}
        </div>
        <div style="display:flex;gap:6px;margin-top:12px">
          <button class="action-btn" @click=${() => { this._compareVendors = new Set(); this._showCompare = false; }}>Clear Comparison</button>
        </div>
      </div>
    `;
  }

  private _renderNotifications() {
    return this._notifications.map(n => html`<div class="notification">${n.message}</div>`);

  private _vendors: Vendor[] = [
    { id: 'v1', name: 'AWS Cloud Services', tier: 'critical', category: 'IaaS', score: 92, status: 'active', soc2: true, iso27001: true, lastAssessment: '2026-03-15', contracts: 5, dataShared: 'PII, Financial, Logs', trend: [88,89,90,91,91,92], riskFactors: ['Multi-tenant isolation', 'Data residency', 'Key management'], slaCompliance: 99.9, incidents: 1, contactName: 'J. Smith', contactEmail: 'j.smith@aws.com', renewalDate: '2027-01-15' },
    { id: 'v2', name: 'Salesforce CRM', tier: 'critical', category: 'SaaS', score: 88, status: 'active', soc2: true, iso27001: true, lastAssessment: '2026-02-20', contracts: 3, dataShared: 'Customer PII, Sales Data', trend: [85,86,87,87,88,88], riskFactors: ['Data export controls', 'API rate limits'], slaCompliance: 99.8, incidents: 0, contactName: 'M. Chen', contactEmail: 'm.chen@salesforce.com', renewalDate: '2026-12-01' },
    { id: 'v3', name: 'Stripe Payments', tier: 'critical', category: 'Payment', score: 95, status: 'active', soc2: true, iso27001: true, lastAssessment: '2026-04-01', contracts: 2, dataShared: 'PCI, Tokens, Financial', trend: [92,93,93,94,94,95], riskFactors: ['PCI DSS scope', 'Tokenization coverage'], slaCompliance: 99.99, incidents: 0, contactName: 'A. Patel', contactEmail: 'a.patel@stripe.com', renewalDate: '2027-03-01' },
    { id: 'v4', name: 'Okta Identity', tier: 'high', category: 'IAM', score: 85, status: 'active', soc2: true, iso27001: true, lastAssessment: '2026-03-01', contracts: 4, dataShared: 'Credentials, SSO, MFA', trend: [82,83,83,84,84,85], riskFactors: ['MFA bypass history', 'Directory sync failures'], slaCompliance: 99.7, incidents: 2, contactName: 'R. Kim', contactEmail: 'r.kim@okta.com', renewalDate: '2026-11-15' },
    { id: 'v5', name: 'Datadog Monitoring', tier: 'medium', category: 'Monitoring', score: 78, status: 'active', soc2: true, iso27001: false, lastAssessment: '2026-01-15', contracts: 2, dataShared: 'Logs, Metrics, Traces', trend: [75,75,76,77,77,78], riskFactors: ['Data retention limits', 'Query performance'], slaCompliance: 99.5, incidents: 1, contactName: 'L. Wang', contactEmail: 'l.wang@datadog.com', renewalDate: '2026-09-01' },
    { id: 'v6', name: 'NewRelic APM', tier: 'low', category: 'Monitoring', score: 72, status: 'under-review', soc2: false, iso27001: false, lastAssessment: '2025-06-01', contracts: 1, dataShared: 'App Performance Data', trend: [76,75,74,73,73,72], riskFactors: ['Outdated SOC 2', 'No ISO certification'], slaCompliance: 98.5, incidents: 0, contactName: 'D. Brown', contactEmail: 'd.brown@newrelic.com', renewalDate: '2026-07-01' },
    { id: 'v7', name: 'GitHub Enterprise', tier: 'high', category: 'Dev Tools', score: 83, status: 'active', soc2: true, iso27001: true, lastAssessment: '2026-03-20', contracts: 3, dataShared: 'Source Code, CI/CD Secrets', trend: [80,81,81,82,82,83], riskFactors: ['Secret scanning gaps', 'Supply chain risk'], slaCompliance: 99.6, incidents: 1, contactName: 'K. Lee', contactEmail: 'k.lee@github.com', renewalDate: '2027-02-01' },
    { id: 'v8', name: 'Zoom Communications', tier: 'medium', category: 'Comms', score: 80, status: 'active', soc2: true, iso27001: false, lastAssessment: '2026-02-10', contracts: 2, dataShared: 'Meeting Recordings, Chat Logs', trend: [77,78,78,79,79,80], riskFactors: ['E2E encryption gaps', 'Data residency'], slaCompliance: 99.3, incidents: 0, contactName: 'S. Garcia', contactEmail: 's.garcia@zoom.com', renewalDate: '2026-10-15' },
    { id: 'v9', name: 'Cloudflare CDN', tier: 'medium', category: 'Security', score: 86, status: 'active', soc2: true, iso27001: true, lastAssessment: '2026-04-05', contracts: 2, dataShared: 'DNS, Traffic Logs', trend: [83,84,84,85,85,86], riskFactors: ['WAF bypass potential', 'Origin IP exposure'], slaCompliance: 99.95, incidents: 0, contactName: 'T. Nguyen', contactEmail: 't.nguyen@cloudflare.com', renewalDate: '2027-01-01' },
    { id: 'v10', name: 'Twilio Messaging', tier: 'medium', category: 'Comms', score: 75, status: 'pending', soc2: true, iso27001: false, lastAssessment: '2025-09-01', contracts: 1, dataShared: 'Phone Numbers, SMS Content', trend: [78,77,76,76,75,75], riskFactors: ['SMS phishing vector', 'API key exposure'], slaCompliance: 99.1, incidents: 1, contactName: 'P. Wilson', contactEmail: 'p.wilson@twilio.com', renewalDate: '2026-08-01' },
    { id: 'v11', name: 'MongoDB Atlas', tier: 'high', category: 'Database', score: 82, status: 'active', soc2: true, iso27001: true, lastAssessment: '2026-03-10', contracts: 2, dataShared: 'Application Data, Analytics', trend: [79,80,80,81,81,82], riskFactors: ['Data encryption at rest', 'Backup integrity'], slaCompliance: 99.7, incidents: 0, contactName: 'J. Martinez', contactEmail: 'j.martinez@mongodb.com', renewalDate: '2026-12-15' },
    { id: 'v12', name: 'Legacy CRM System', tier: 'low', category: 'SaaS', score: 55, status: 'offboarded', soc2: false, iso27001: false, lastAssessment: '2024-01-01', contracts: 1, dataShared: 'Legacy Customer Data', trend: [68,65,62,60,58,55], riskFactors: ['No modern security certs', 'End of support'], slaCompliance: 95.0, incidents: 3, contactName: 'B. Taylor', contactEmail: 'b.taylor@legacy.com', renewalDate: '2026-06-01' },
    { id: 'v13', name: 'Jira Service Mgmt', tier: 'medium', category: 'ITSM', score: 79, status: 'active', soc2: true, iso27001: true, lastAssessment: '2026-02-25', contracts: 2, dataShared: 'Ticket Data, Project Info', trend: [76,77,77,78,78,79], riskFactors: ['Plugin security review', 'Data export controls'], slaCompliance: 99.4, incidents: 0, contactName: 'C. Anderson', contactEmail: 'c.anderson@atlassian.com', renewalDate: '2026-11-01' },
    { id: 'v14', name: 'Snyk Security', tier: 'high', category: 'Security', score: 84, status: 'active', soc2: true, iso27001: true, lastAssessment: '2026-03-28', contracts: 1, dataShared: 'Source Code, Dependencies', trend: [80,81,82,83,83,84], riskFactors: ['False positive rates', 'Code exposure'], slaCompliance: 99.6, incidents: 0, contactName: 'N. Thomas', contactEmail: 'n.thomas@snyk.com', renewalDate: '2027-04-01' },
    { id: 'v15', name: 'Workday HR', tier: 'critical', category: 'HRIS', score: 90, status: 'active', soc2: true, iso27001: true, lastAssessment: '2026-04-10', contracts: 2, dataShared: 'Employee PII, Payroll, Benefits', trend: [87,88,88,89,89,90], riskFactors: ['HR data breach impact', 'Integration security'], slaCompliance: 99.8, incidents: 0, contactName: 'H. Jackson', contactEmail: 'h.jackson@workday.com', renewalDate: '2027-02-15' },
    { id: 'v16', name: 'Zendesk Support', tier: 'medium', category: 'Support', score: 76, status: 'under-review', soc2: true, iso27001: false, lastAssessment: '2025-11-01', contracts: 1, dataShared: 'Customer Tickets, Chat Logs', trend: [78,77,77,76,76,76], riskFactors: ['Chat data retention', 'Agent access controls'], slaCompliance: 99.2, incidents: 1, contactName: 'W. White', contactEmail: 'w.white@zendesk.com', renewalDate: '2026-09-15' },
  ];

  private _scoreColor(score: number): string {
    if (score >= 85) return '#22c55e';
    if (score >= 70) return '#3b82f6';
    if (score >= 55) return '#f97316';
    return '#ef4444';
  }

  private _scoreGaugeSVG(score: number, size: number = 48): string {
    const r = (size - 8) / 2;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(score / 100, 1);
    const offset = circ * (1 - pct);
    const color = this._scoreColor(score);
    return `<svg class="score-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#1f2937" stroke-width="4"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="4"
        stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"
        transform="rotate(-90 ${size/2} ${size/2})"/>
      <text x="${size/2}" y="${size/2 + 4}" text-anchor="middle" fill="${color}" font-size="13" font-weight="700">${score}</text>
    </svg>`;
  }

  private _sparklineSVG(data: number[], color: string): string {
    if (!data || data.length < 2) return '';
    const w = 50, h = 20, pad = 2;
    const max = Math.max(...data), min = Math.min(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => `${pad + (i / (data.length - 1)) * (w - pad * 2)},${h - pad - ((v - min) / range) * (h - pad * 2)}`).join(' ');
    return `<svg class="sparkline" viewBox="0 0 ${w} ${h}"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  private _slaBarSVG(pct: number): string {
    const w = 60, h = 6, color = pct >= 99.5 ? '#22c55e' : pct >= 99.0 ? '#3b82f6' : '#f97316';
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <rect width="${w}" height="${h}" rx="3" fill="#1f2937"/>
      <rect width="${(pct / 100) * w}" height="${h}" rx="3" fill="${color}"/>
    </svg>`;
  }

  private _riskMatrixSVG(): string {
    const labels = ['Inherent Risk', 'Residual Risk', 'Vendor Score', 'SLA Compliance', 'Cert Coverage'];
    const values = [72, 45, 82, 94, 78];
    const cx = 80, cy = 80, maxR = 60, levels = 5;
    let svg = '';
    for (let l = 1; l <= levels; l++) {
      const r = (l / levels) * maxR;
      const pts = labels.map((_, i) => {
        const a = (Math.PI * 2 * i / labels.length) - Math.PI / 2;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      }).join(' ');
      svg += `<polygon points="${pts}" fill="none" stroke="#374151" stroke-width="0.5"/>`;
    }
    labels.forEach((_, i) => {
      const a = (Math.PI * 2 * i / labels.length) - Math.PI / 2;
      svg += `<line x1="${cx}" y1="${cy}" x2="${cx + maxR * Math.cos(a)}" y2="${cy + maxR * Math.sin(a)}" stroke="#374151" stroke-width="0.5"/>`;
      const lx = cx + (maxR + 14) * Math.cos(a), ly = cy + (maxR + 14) * Math.sin(a);
      svg += `<text x="${lx}" y="${ly}" fill="#94a3b8" font-size="7" text-anchor="middle" dominant-baseline="middle">${labels[i]}</text>`;
    });
    const dataPts = values.map((v, i) => {
      const a = (Math.PI * 2 * i / labels.length) - Math.PI / 2;
      const r = (v / 100) * maxR;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(' ');
    svg += `<polygon points="${dataPts}" fill="#f59e0b20" stroke="#f59e0b" stroke-width="1.5"/>`;
    values.forEach((v, i) => {
      const a = (Math.PI * 2 * i / labels.length) - Math.PI / 2;
      const r = (v / 100) * maxR;
      svg += `<circle cx="${cx + r * Math.cos(a)}" cy="${cy + r * Math.sin(a)}" r="3" fill="#f59e0b"/>`;
    });
    return `<svg viewBox="0 0 160 160" width="160" height="160">${svg}</svg>`;
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
        record.findings = this._items.filter((x: any) => x.severity && x.severity !== 'low').length;
        record.criticalCount = this._items.filter((x: any) => x.severity === 'critical').length;
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
    this._items.forEach((item: any) => { const r = item.severity; if (riskDist[r] !== undefined) riskDist[r]++; else riskDist.medium++; });
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
    const data = this._items.slice(0, 10).map((item: any, i: number) => ({ name: (item.name || item.title || item.id || 'Item ' + i).substring(0, 8), score: ({critical: 10, high: 7, medium: 4, low: 1}}}} as any)[item.severity] || 2, risk: item.severity || 'medium' }));
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


  private _workflowTasks: WorkflowTask[] = [
    { id: 'wt-1', title: 'Review Vendor Risk Assessment finding #1', status: 'active', assignee: 'soc-tier1', blockedBy: [], slaDeadline: '2026-04-23T12:00:00Z', priority: 'p1', createdAt: '2026-04-23T00:00:00Z', completedAt: null },
    { id: 'wt-2', title: 'Remediate critical endpoint misconfiguration', status: 'pending', assignee: 'security-eng', blockedBy: ['wt-1'], slaDeadline: '2026-04-23T16:00:00Z', priority: 'p1', createdAt: '2026-04-23T02:00:00Z', completedAt: null },
    { id: 'wt-3', title: 'Update Vendor Risk Assessment detection rules', status: 'blocked', assignee: 'soc-tier2', blockedBy: ['wt-2'], slaDeadline: '2026-04-24T00:00:00Z', priority: 'p2', createdAt: '2026-04-23T03:00:00Z', completedAt: null },
    { id: 'wt-4', title: 'Generate compliance report', status: 'pending', assignee: 'compliance', blockedBy: [], slaDeadline: '2026-04-24T08:00:00Z', priority: 'p3', createdAt: '2026-04-23T04:00:00Z', completedAt: null },
    { id: 'wt-5', title: 'Validate remediation for finding #6', status: 'completed', assignee: 'security-eng', blockedBy: [], slaDeadline: '2026-04-23T10:00:00Z', priority: 'p2', createdAt: '2026-04-22T18:00:00Z', completedAt: '2026-04-23T08:00:00Z' },
    { id: 'wt-6', title: 'Notify stakeholders of findings', status: 'completed', assignee: 'manager', blockedBy: [], slaDeadline: '2026-04-23T06:00:00Z', priority: 'p3', createdAt: '2026-04-22T20:00:00Z', completedAt: '2026-04-23T04:00:00Z' },
    { id: 'wt-7', title: 'Schedule follow-up scan', status: 'pending', assignee: 'ops', blockedBy: ['wt-2'], slaDeadline: '2026-04-25T00:00:00Z', priority: 'p4', createdAt: '2026-04-23T05:00:00Z', completedAt: null },
    { id: 'wt-8', title: 'Archive resolved Vendor Risk Assessment findings', status: 'failed', assignee: 'soc-tier1', blockedBy: [], slaDeadline: '2026-04-23T08:00:00Z', priority: 'p4', createdAt: '2026-04-22T22:00:00Z', completedAt: null },
  ];

  private _executionHistory: ExecutionRecord[] = [
    {
      id: 'exec-1', name: 'Vendor Risk Assessment Full Assessment Run', startedAt: '2026-04-22T10:00:00Z', completedAt: '2026-04-22T10:12:00Z', status: 'success',
      steps: [
        { id: 's1', name: 'Validate Scope', status: 'success', startedAt: '2026-04-22T10:00:00Z', completedAt: '2026-04-22T10:00:30Z', duration: 30, output: 'Scope validated: 142 targets' },
        { id: 's2', name: 'Collect Evidence', status: 'success', startedAt: '2026-04-22T10:00:30Z', completedAt: '2026-04-22T10:06:00Z', duration: 330, output: '1,847 events collected from 12 sources' },
        { id: 's3', name: 'Analyze Patterns', status: 'success', startedAt: '2026-04-22T10:06:00Z', completedAt: '2026-04-22T10:10:00Z', duration: 240, output: '23 patterns identified, 7 correlated' },
        { id: 's4', name: 'Generate Report', status: 'success', startedAt: '2026-04-22T10:10:00Z', completedAt: '2026-04-22T10:12:00Z', duration: 120, output: 'Report generated: 10 findings, 3 critical' },
      ],
    },
    {
      id: 'exec-2', name: 'Vendor Risk Assessment Delta Scan', startedAt: '2026-04-23T02:00:00Z', completedAt: '2026-04-23T02:05:00Z', status: 'failed',
      steps: [
        { id: 's5', name: 'Validate Scope', status: 'success', startedAt: '2026-04-23T02:00:00Z', completedAt: '2026-04-23T02:00:15Z', duration: 15, output: 'Delta scope: 23 changed targets' },
        { id: 's6', name: 'Collect Evidence', status: 'error', startedAt: '2026-04-23T02:00:15Z', completedAt: '2026-04-23T02:05:00Z', duration: 285, output: 'Timeout: EDR connector unreachable after 5m' },
        { id: 's7', name: 'Analyze Patterns', status: 'idle', startedAt: null, completedAt: null, duration: 0, output: '' },
        { id: 's8', name: 'Generate Report', status: 'idle', startedAt: null, completedAt: null, duration: 0, output: '' },
      ],
    },
  ];

  private _toggle(id: string) { this._expandedId = this._expandedId === id ? null : id; }

  private _getSevBadge(s: string): string { return `badge-${s}`; }

  private _getFiltered(): PanelItem[] {
    let result = [...this._items];
    if (this._severityFilter !== 'all') result = result.filter(i => i.severity === this._severityFilter);
    if (this._statusFilter !== 'all') result = result.filter(i => i.status === this._statusFilter);
    if (this._searchQuery) {
      const q = this._searchQuery.toLowerCase();
      result = result.filter(i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.assignee.toLowerCase().includes(q) || i.source.toLowerCase().includes(q));
    }
    const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    result.sort((a, b) => {
      if (this._sortField === 'severity') return this._sortAsc ? sevOrder[a.severity] - sevOrder[b.severity] : sevOrder[b.severity] - sevOrder[a.severity];
      if (this._sortField === 'date') return this._sortAsc ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt);
      return this._sortAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
    });
    return result;
  }

  private _renderDonut(): unknown {
    const crit = this._items.filter(i => i.severity === 'critical').length;
    const high = this._items.filter(i => i.severity === 'high').length;
    const med = this._items.filter(i => i.severity === 'medium').length;
    const low = this._items.filter(i => i.severity === 'low' || i.severity === 'info').length;
    const total = crit + high + med + low || 1;
    const data = [{ label: 'Critical', val: crit, color: '#ef4444' }, { label: 'High', val: high, color: '#f97316' }, { label: 'Medium', val: med, color: '#eab308' }, { label: 'Low/Info', val: low, color: '#22c55e' }];
    const cx = 60, cy = 60, r = 40, sw = 14;
    let cum = -90;
    return html`
      <div class="chart-container">
        <div class="chart-title">Severity Distribution</div>
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <svg viewBox="0 0 120 120" width="120" height="120">
            ${data.filter(d => d.val > 0).map(d => {
              const angle = (d.val / total) * 360;
              const s = (cum * Math.PI) / 180;
              const e = ((cum + angle) * Math.PI) / 180;
              cum += angle;
              const x1 = cx + r * Math.cos(s); const y1 = cy + r * Math.sin(s);
              const x2 = cx + r * Math.cos(e); const y2 = cy + r * Math.sin(e);
              return html`<path d="M${x1},${y1} A${r},${r} 0 ${angle > 180 ? 1 : 0},1 ${x2},${y2}" fill="none" stroke="${d.color}" stroke-width="${sw}" stroke-linecap="round"/>`;
            })}
            <text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="#e2e8f0" font-size="18" font-weight="700">${total}</text>
          </svg>
          <div style="display:flex;flex-direction:column;gap:4px;">
            ${data.map(d => html`<div style="display:flex;align-items:center;gap:6px;font-size:12px;"><span style="width:10px;height:10px;border-radius:2px;background:${d.color};"></span><span style="color:#94a3b8;">${d.label}:</span><span style="font-weight:700;">${d.val}</span></div>`)}
          </div>
        </div>
      </div>`;
  }

  private _renderBarChart(): unknown {
    const data = this._trends;
    const w = 500, h = 140, pad = 30;
    const maxVal = Math.max(...data.map(d => Math.max(d.opened, d.resolved)), 20);
    const barW = (w - pad * 2) / data.length - 8;
    return html`
      <div class="chart-container">
        <div class="chart-title">7-Day Trend</div>
        <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
          ${data.map((d, i) => {
            const x = pad + i * (barW + 8);
            const h1 = (d.opened / maxVal) * (h - pad - 20);
            const h2 = (d.resolved / maxVal) * (h - pad - 20);
            return html`<rect x="${x}" y="${h - pad - h1}" width="${barW / 2 - 1}" height="${h1}" rx="2" fill="#ef4444" opacity="0.7"/><rect x="${x + barW / 2 + 1}" y="${h - pad - h2}" width="${barW / 2 - 1}" height="${h2}" rx="2" fill="#22c55e" opacity="0.7"/><text x="${x + barW / 2}" y="${h - 6}" text-anchor="middle" fill="#94a3b8" font-size="9">${d.date}</text>`;
          })}
        </svg>
        <div style="display:flex;gap:16px;font-size:10px;color:#94a3b8;margin-top:8px;">
          <span><span style="display:inline-block;width:10px;height:10px;background:#ef4444;border-radius:2px;margin-right:4px;"></span>Opened</span>
          <span><span style="display:inline-block;width:10px;height:10px;background:#22c55e;border-radius:2px;margin-right:4px;"></span>Resolved</span>
        </div>
      </div>`;
  }

  private _renderGauge(value: number, max: number, label: string, color: string): unknown {
    const pct = Math.round((value / max) * 100);
    const cx = 60, cy = 70, r = 45, sw = 12;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - pct / 100);
    return html`
      <div class="score-card" style="text-align:center;">
        <svg viewBox="0 0 120 100" width="100" height="83">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1e293b" stroke-width="${sw}"/>
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
          <text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="#e2e8f0" font-size="16" font-weight="700">${value}</text>
        </svg>
        <div class="score-lbl">${label}</div>
      </div>`;
  }

  private _getSlaStatus(deadline: string): { remaining: number; status: 'expired' | 'warning' | 'ok' } {
    const now = Date.now();
    const end = new Date(deadline).getTime();
    const diff = end - now;
    if (diff < 0) return { remaining: 0, status: 'expired' };
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return { remaining: minutes, status: 'warning' };
    return { remaining: minutes, status: 'ok' };
  }

  private _formatSla(minutes: number): string {
    if (minutes >= 1440) return Math.floor(minutes / 1440) + 'd ' + Math.floor((minutes % 1440) / 60) + 'h';
    if (minutes >= 60) return Math.floor(minutes / 60) + 'h ' + (minutes % 60) + 'm';
    return minutes + 'm';
  }

  private _getPagedItems(items: PanelItem[]): { page: PanelItem[]; total: number; pages: number } {
    const total = items.length;
    const pages = Math.ceil(total / this._tablePageSize) || 1;
    const start = (this._tablePage - 1) * this._tablePageSize;
    return { page: items.slice(start, start + this._tablePageSize), total, pages };
  }

  private _toggleRowSelect(id: string) {
    const next = new Set(this._selectedRows);
    if (next.has(id)) next.delete(id); else next.add(id);
    this._selectedRows = next;
  }

  private _selectAllRows(items: PanelItem[]) {
    if (this._selectedRows.size === items.length) {
      this._selectedRows = new Set();
    } else {
      this._selectedRows = new Set(items.map(i => i.id));
    }
  }

  private _getSortedWorkflow(): WorkflowTask[] {
    const prioOrder: Record<string, number> = { p1: 0, p2: 1, p3: 2, p4: 3, p5: 4 };
    const statusOrder: Record<string, number> = { blocked: 0, pending: 1, active: 2, completed: 3, failed: 4 };
    return [...this._workflowTasks].sort((a, b) => {
      let cmp = 0;
      if (this._workflowSortField === 'status') cmp = statusOrder[a.status] - statusOrder[b.status];
      else if (this._workflowSortField === 'priority') cmp = prioOrder[a.priority] - prioOrder[b.priority];
      else if (this._workflowSortField === 'slaDeadline') cmp = a.slaDeadline.localeCompare(b.slaDeadline);
      else cmp = a.title.localeCompare(b.title);
      return this._workflowSortAsc ? cmp : -cmp;
    });
  }

  private _runExecution() {
    if (this._executionRunning) return;
    this._executionRunning = true;
    const steps: ExecutionStep[] = [
      { id: 'ns1', name: 'Validate Scope', status: 'idle', startedAt: null, completedAt: null, duration: 0, output: '' },
      { id: 'ns2', name: 'Collect Evidence', status: 'idle', startedAt: null, completedAt: null, duration: 0, output: '' },
      { id: 'ns3', name: 'Analyze Patterns', status: 'idle', startedAt: null, completedAt: null, duration: 0, output: '' },
      { id: 'ns4', name: 'Generate Report', status: 'idle', startedAt: null, completedAt: null, duration: 0, output: '' },
    ];
    const exec: ExecutionRecord = {
      id: 'exec-' + Date.now(), name: 'Vendor Risk Assessment Assessment ' + new Date().toISOString().slice(0, 10), startedAt: new Date().toISOString(), completedAt: null, status: 'running', steps,
    };
    this._currentExecution = exec;
    let stepIdx = 0;
    const outputs = ['Scope validated: 156 targets', '2,103 events collected from 14 sources', '31 patterns identified, 11 correlated', 'Report generated: 12 findings, 4 critical'];
    const durations = [25, 280, 195, 85];
    const runNext = () => {
      if (stepIdx >= steps.length) {
        exec.completedAt = new Date().toISOString();
        exec.status = 'success';
        this._executionRunning = false;
        this.requestUpdate();
        return;
      }
      const s = steps[stepIdx];
      s.status = 'running';
      s.startedAt = new Date().toISOString();
      this.requestUpdate();
      setTimeout(() => {
        s.status = 'success';
        s.completedAt = new Date().toISOString();
        s.duration = durations[stepIdx];
        s.output = outputs[stepIdx];
        stepIdx++;
        this.requestUpdate();
        runNext();
      }, 600 + Math.random() * 800);
    };
    runNext();
  }

  private _renderWorkflowTable(): unknown {
    const tasks = this._getSortedWorkflow();
    const sortArrow = (field: string) => field === this._workflowSortField ? (this._workflowSortAsc ? ' \u25B2' : ' \u25BC') : '';
    return html`
      <div class="form-section">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div class="form-title" style="margin-bottom:0;">Workflow Task Queue</div>
          <div style="display:flex;gap:6px;">
            <span class="badge badge-active">${tasks.filter(t => t.status === 'active').length} Active</span>
            <span class="badge badge-pending">${tasks.filter(t => t.status === 'pending').length} Pending</span>
            <span class="badge badge-blocked">${tasks.filter(t => t.status === 'blocked').length} Blocked</span>
            <span class="badge badge-completed">${tasks.filter(t => t.status === 'completed').length} Done</span>
          </div>
        </div>
        <div style="overflow-x:auto;">
          <table class="workflow-table">
            <thead>
              <tr>
                <th class="checkbox-cell"><input type="checkbox" ?checked=${this._selectedRows.size === tasks.length && tasks.length > 0} @change=${() => this._selectAllRows(tasks)} /></th>
                <th @click=${() => { this._workflowSortField = 'title'; this._workflowSortAsc = !this._workflowSortAsc; }}>Task${sortArrow('title')}</th>
                <th @click=${() => { this._workflowSortField = 'status'; this._workflowSortAsc = !this._workflowSortAsc; }}>Status${sortArrow('status')}</th>
                <th @click=${() => { this._workflowSortField = 'priority'; this._workflowSortAsc = !this._workflowSortAsc; }}>Priority${sortArrow('priority')}</th>
                <th>Assignee</th>
                <th>Dependencies</th>
                <th @click=${() => { this._workflowSortField = 'slaDeadline'; this._workflowSortAsc = !this._workflowSortAsc; }}>SLA${sortArrow('slaDeadline')}</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.map(t => {
                const sla = this._getSlaStatus(t.slaDeadline);
                return html`
                  <tr class=${this._selectedRows.has(t.id) ? 'selected' : ''}>
                    <td class="checkbox-cell"><input type="checkbox" ?checked=${this._selectedRows.has(t.id)} @change=${() => this._toggleRowSelect(t.id)} /></td>
                    <td style="font-weight:600;">${t.title}</td>
                    <td><span class="badge badge-${t.status}">${t.status}</span></td>
                    <td><span class="badge badge-${t.priority}">${t.priority.toUpperCase()}</span></td>
                    <td>${t.assignee}</td>
                    <td>${t.blockedBy.length ? t.blockedBy.map(b => html`<span style="font-size:10px;color:#f97316;margin-right:4px;">${b}</span>`) : html`<span style="color:#6b7280;">-</span>`}</td>
                    <td>
                      <div style="font-size:11px;color:#94a3b8;">${this._formatSla(sla.remaining)}</div>
                      <div class="sla-bar"><div class="sla-bar-fill sla-${sla.status}" style="width:${Math.min(sla.remaining / 480 * 100, 100)}%"></div></div>
                    </td>
                  </tr>`;
              })}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  private _renderExecutionPanel(): unknown {
    const running = this._currentExecution;
    const completedSteps = running ? running.steps.filter(s => s.status === 'success').length : 0;
    const totalSteps = running ? running.steps.length : 0;
    const pct = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0;
    return html`
      <div class="form-section">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div class="form-title" style="margin-bottom:0;">Execution Pipeline</div>
          <button class="btn primary" ?disabled=${this._executionRunning} @click=${() => this._runExecution()}>
            ${this._executionRunning ? 'Running...' : 'Run Assessment'}
          </button>
        </div>
        ${running ? html`
          <div class="pipeline-steps">
            ${running.steps.map(s => html`
              <div class="pipeline-step ${s.status}">
                <div style="font-size:13px;margin-bottom:2px;">${s.name}</div>
                <div style="font-size:10px;opacity:0.8;">${s.status === 'idle' ? 'Waiting' : s.status === 'running' ? 'Processing...' : s.status === 'success' ? s.duration + 'ms' : 'Error'}</div>
              </div>
            `)}
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div style="font-size:12px;color:#94a3b8;margin-bottom:12px;">Progress: ${pct}% (${completedSteps}/${totalSteps} steps)</div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:6px;">Step Output:</div>
          <div style="background:#0a0e17;border-radius:6px;padding:10px;font-size:11px;font-family:monospace;color:#94a3b8;max-height:120px;overflow-y:auto;">
            ${running.steps.filter(s => s.output).map(s => html`<div style="margin-bottom:4px;"><span style="color:#f59e0b;">[${s.status.toUpperCase()}]</span> ${s.name}: ${s.output}</div>`)}
          </div>
        ` : html`<div class="empty-state">Click "Run Assessment" to start the Vendor Risk Assessment analysis pipeline</div>`}
      </div>
      <div class="form-section">
        <div class="form-title">Execution History</div>
        <div class="exec-history">
          ${this._executionHistory.map(ex => html`
            <div style="padding:8px 0;border-bottom:1px solid #1e293b;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:12px;font-weight:600;">${ex.name}</span>
                <span class="badge badge-${ex.status === 'success' ? 'completed' : 'failed'}">${ex.status}</span>
              </div>
              <div style="font-size:10px;color:#6b7280;margin-top:2px;">
                Started: ${new Date(ex.startedAt).toLocaleString()} | Completed: ${ex.completedAt ? new Date(ex.completedAt).toLocaleString() : 'N/A'}
              </div>
              <div style="display:flex;gap:4px;margin-top:4px;">
                ${ex.steps.map(s => html`<span style="font-size:9px;padding:1px 6px;border-radius:3px;background:${s.status === 'success' ? '#052e16' : s.status === 'error' ? '#450a0a' : '#1e293b'};color:${s.status === 'success' ? '#86efac' : s.status === 'error' ? '#fca5a5' : '#6b7280'};">${s.name}: ${s.duration || '-'}ms</span>`)}
              </div>
            </div>
          `)}
        </div>
      </div>`;
  }

  private _renderSettingsTab(): unknown {
    const c = this._config;
    return html`
      <div class="settings-grid">
        <div class="settings-card">
          <h4>SLA Configuration</h4>
          <div class="settings-row"><label>Critical SLA (min)</label><input type="number" .value=${String(c.criticalSlaMinutes)} @input=${(e: Event) => { c.criticalSlaMinutes = Number((e.target as HTMLInputElement).value); this.requestUpdate(); }} /></div>
          <div class="settings-row"><label>High SLA (min)</label><input type="number" .value=${String(c.highSlaMinutes)} @input=${(e: Event) => { c.highSlaMinutes = Number((e.target as HTMLInputElement).value); this.requestUpdate(); }} /></div>
          <div class="settings-row"><label>Medium SLA (min)</label><input type="number" .value=${String(c.mediumSlaMinutes)} @input=${(e: Event) => { c.mediumSlaMinutes = Number((e.target as HTMLInputElement).value); this.requestUpdate(); }} /></div>
        </div>
        <div class="settings-card">
          <h4>Escalation Rules</h4>
          <div class="settings-row"><label>Auto Escalation</label><input type="checkbox" ?checked=${c.autoEscalationEnabled} @change=${(e: Event) => { c.autoEscalationEnabled = (e.target as HTMLInputElement).checked; this.requestUpdate(); }} /></div>
          <div class="settings-row"><label>Threshold (hours)</label><input type="number" .value=${String(c.escalationThresholdHours)} @input=${(e: Event) => { c.escalationThresholdHours = Number((e.target as HTMLInputElement).value); this.requestUpdate(); }} /></div>
          <div class="settings-row"><label>Auto Assign</label><input type="checkbox" ?checked=${c.autoAssignEnabled} @change=${(e: Event) => { c.autoAssignEnabled = (e.target as HTMLInputElement).checked; this.requestUpdate(); }} /></div>
        </div>
        <div class="settings-card">
          <h4>Notifications</h4>
          <div class="settings-row"><label>Report Schedule</label>
            <select .value=${c.reportSchedule} @change=${(e: Event) => { c.reportSchedule = (e.target as HTMLSelectElement).value; this.requestUpdate(); }}>
              <option value="hourly">Hourly</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
            </select>
          </div>
          <div class="settings-row"><label>Max Concurrent Tasks</label><input type="number" .value=${String(c.maxConcurrentTasks)} @input=${(e: Event) => { c.maxConcurrentTasks = Number((e.target as HTMLInputElement).value); this.requestUpdate(); }} /></div>
          <div class="settings-row"><label>Channels</label><span style="font-size:11px;color:#94a3b8;">${c.notificationChannels.join(', ')}</span></div>
        </div>
        <div class="settings-card">
          <h4>Import / Export Config</h4>
          <div style="display:flex;gap:8px;margin-top:4px;">
            <button class="btn primary" @click=${() => {
              const blob = new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'vendor-risk-assessment-config.json'; a.click();
              URL.revokeObjectURL(url);
            }}>Export</button>
            <button class="btn" @click=${() => { alert('Import: paste JSON config in console'); }}>Import</button>
          </div>
        </div>
      </div>`;
  }

  private _renderCommentThread(): unknown {
    return html`
      <div style="margin-top:12px;">
        <div style="font-size:12px;font-weight:700;margin-bottom:8px;">Discussion (${this._comments.length})</div>
        <div class="comment-thread">
          ${this._comments.map(c => html`
            <div class="comment-item">
              <span class="comment-author">${c.author}</span>
              <span class="comment-time">${c.timestamp}</span>
              <div class="comment-text">${c.text}</div>
            </div>
          `)}
        </div>
        <div style="display:flex;gap:6px;margin-top:8px;">
          <input class="search-box" type="text" placeholder="Add a comment..." style="min-width:auto;flex:1;" id="vendor-risk-assessment-comment-input" />
          <button class="btn primary" @click=${() => {
            const input = this.shadowRoot?.querySelector('#vendor-risk-assessment-comment-input') as HTMLInputElement;
            if (input && input.value.trim()) {
              this._comments = [...this._comments, { id: 'c' + Date.now(), author: 'current-user', timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '), text: input.value.trim() }];
              input.value = '';
            }
          }}>Post</button>
        </div>
      </div>`;
  }

  private _renderPaginatedTable(items: PanelItem[]): unknown {
    const { page, total, pages } = this._getPagedItems(items);
    const sortArrow = (field: string) => field === this._sortField ? (this._sortAsc ? ' \u25B2' : ' \u25BC') : '';
    return html`
      <div>
        ${this._selectedRows.size > 0 ? html`
          <div class="batch-toolbar">
            <span class="count">${this._selectedRows.size}</span> selected
            <button class="btn success" @click=${() => { this._selectedRows = new Set(); }}>Resolve Selected</button>
            <button class="btn" @click=${() => { this._selectedRows = new Set(); }}>Reassign</button>
            <button class="btn danger" @click=${() => { this._selectedRows = new Set(); }}>Dismiss Selected</button>
          </div>
        ` : nothing}
        <div style="overflow-x:auto;">
          <table class="workflow-table">
            <thead>
              <tr>
                <th class="checkbox-cell"><input type="checkbox" ?checked=${this._selectedRows.size === page.length && page.length > 0} @change=${() => this._selectAllRows(page)} /></th>
                <th @click=${() => { this._sortField = 'title'; this._sortAsc = !this._sortAsc; }}>Title${sortArrow('title')}</th>
                <th @click=${() => { this._sortField = 'severity'; this._sortAsc = !this._sortAsc; }}>Severity${sortArrow('severity')}</th>
                <th>Status</th>
                <th @click=${() => { this._sortField = 'priority'; this._sortAsc = !this._sortAsc; }}>Priority${sortArrow('priority')}</th>
                <th @click=${() => { this._sortField = 'assignee'; this._sortAsc = !this._sortAsc; }}>Assignee${sortArrow('assignee')}</th>
                <th @click=${() => { this._sortField = 'date'; this._sortAsc = !this._sortAsc; }}>Created${sortArrow('date')}</th>
              </tr>
            </thead>
            <tbody>
              ${page.map(i => html`
                <tr class=${this._selectedRows.has(i.id) ? 'selected' : ''} @click=${() => this._toggle(i.id)} style="cursor:pointer;">
                  <td class="checkbox-cell" @click=${(e: Event) => { e.stopPropagation(); this._toggleRowSelect(i.id); }}><input type="checkbox" ?checked=${this._selectedRows.has(i.id)} /></td>
                  <td style="font-weight:600;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${i.title}</td>
                  <td><span class="badge ${this._getSevBadge(i.severity)}">${i.severity}</span></td>
                  <td><span class="badge ${this._getSevBadge(i.status)}">${i.status}</span></td>
                  <td><span class="badge ${this._getSevBadge(i.priority)}">${i.priority.toUpperCase()}</span></td>
                  <td>${i.assignee}</td>
                  <td style="font-size:11px;color:#94a3b8;">${new Date(i.createdAt).toLocaleDateString()}</td>
                </tr>
                ${this._expandedId === i.id ? html`
                  <tr><td colspan="7" style="padding:0;border-bottom:1px solid #f59e0b;">
                    <div style="padding:12px;background:#1a2332;">
                      <div style="font-size:12px;color:#cbd5e1;line-height:1.6;margin-bottom:8px;">${i.description}</div>
                      <div class="detail-grid">
                        <div class="score-card"><div class="score-val" style="font-size:13px;">${i.category}</div><div class="score-lbl">Category</div></div>
                        <div class="score-card"><div class="score-val" style="font-size:13px;">${i.source}</div><div class="score-lbl">Source</div></div>
                        <div class="score-card"><div class="score-val" style="font-size:13px;">${i.slaMinutes}m</div><div class="score-lbl">SLA</div></div>
                        <div class="score-card"><div class="score-val" style="font-size:13px;">${i.tags.join(', ')}</div><div class="score-lbl">Tags</div></div>
                      </div>
                      ${this._renderCommentThread()}
                      <div style="display:flex;gap:6px;margin-top:10px;">
                        <button class="btn success" @click=${(e: Event) => { e.stopPropagation(); }}>Resolve</button>
                        <button class="btn" @click=${(e: Event) => { e.stopPropagation(); }}>Escalate</button>
                        <button class="btn danger" @click=${(e: Event) => { e.stopPropagation(); }}>Dismiss</button>
                      </div>
                    </div>
                  </td></tr>
                ` : nothing}
              `)}
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <button ?disabled=${this._tablePage <= 1} @click=${() => { this._tablePage--; }}>Prev</button>
          <span class="page-info">Page ${this._tablePage} of ${pages} (${total} items)</span>
          <select class="filter-select" style="padding:3px 6px;font-size:11px;" @change=${(e: Event) => { this._tablePageSize = Number((e.target as HTMLSelectElement).value); this._tablePage = 1; }}>
            <option value="5">5</option><option value="10">10</option><option value="20">20</option><option value="50">50</option>
          </select>
          <button ?disabled=${this._tablePage >= pages} @click=${() => { this._tablePage++; }}>Next</button>
        </div>
      </div>`;
  }



  render() {
    let filtered = this._vendors;
    if (this._tierFilter !== 'all') filtered = filtered.filter(v => v.tier === this._tierFilter);
    const sorted = [...filtered].sort((a, b) => {
      const ka = (a}} as any)[this._sortKey], kb = (b}} as any)[this._sortKey];
      const cmp = typeof ka === 'string' ? ka.localeCompare(kb) : ka - kb;
      return this._sortDir === 'asc' ? cmp : -cmp;
    });

    const critCount = filtered.filter(v => v.tier === 'critical').length;
    const highCount = filtered.filter(v => v.tier === 'high').length;
    const avgScore = filtered.length ? Math.round(filtered.reduce((s, v) => s + v.score, 0) / filtered.length) : 0;
    const reviewCount = filtered.filter(v => v.status === 'under-review' || v.status === 'pending').length;
    const soc2Count = filtered.filter(v => v.soc2).length;
    const avgSla = filtered.length ? (filtered.reduce((s, v) => s + v.slaCompliance, 0) / filtered.length).toFixed(2) : '0';

    const totalPages = Math.ceil(sorted.length / this._perPage) || 1;
    if (this._page > totalPages) this._page = totalPages;
    const pageData = sorted.slice((this._page - 1) * this._perPage, this._page * this._perPage);

    const sel = this._selected;
    return html`<div class="panel">
      <div class="pt">🔗 Vendor Risk Assessment</div>
      <div class="stats">
        <div class="stat"><div class="sv">${filtered.length}</div><div class="sl">Total Vendors</div></div>
        <div class="stat"><div class="sv" style="color:#ef4444">${critCount}</div><div class="sl">Critical Tier</div></div>
        <div class="stat"><div class="sv" style="color:#f97316">${highCount}</div><div class="sl">High Tier</div></div>
        <div class="stat"><div class="sv" style="color:#22c55e">${avgScore}</div><div class="sl">Avg Score</div></div>
        <div class="stat"><div class="sv" style="color:#f59e0b">${reviewCount}</div><div class="sl">Needs Review</div></div>
        <div class="stat"><div class="sv">${avgSla}%</div><div class="sl">Avg SLA</div></div>
      </div>

      <div class="tabs">
        <span class="tab ${this._tab === 'inventory' ? 'active' : ''}" @click=${() => { this._tab = 'inventory'; this.requestUpdate(); }}>Inventory</span>
        <span class="tab ${this._tab === 'assessments' ? 'active' : ''}" @click=${() => { this._tab = 'assessments'; this.requestUpdate(); }}>Assessments</span>
        <span class="tab ${this._tab === 'workflow' ? 'active' : ''}" @click=${() => { this._tab = 'workflow'; this.requestUpdate(); }}>TPRM Workflow</span>
        <span class="tab ${this._tab === 'compliance' ? 'active' : ''}" @click=${() => { this._tab = 'compliance'; this.requestUpdate(); }}>Compliance</span>
        <span class="tab ${this._tab === 'compare' ? 'active' : ''}" @click=${() => { this._tab = 'compare'; this.requestUpdate(); }}>Compare${this._compareVendors.size > 0 ? ' (' + this._compareVendors.size + ')' : ''}</span>
      </div>

      ${this._tab === 'inventory' ? html`
        ${sel ? html`<div class="detail-panel">
          <div class="detail-header">
            <div class="detail-title">${sel.name}</div>
            <button class="detail-close" @click=${() => { this._selected = null; }}>✕ Close</button>
          </div>
          <div style="font-size:12px;color:#94a3b8;margin-bottom:12px">${sel.category} | ${sel.contracts} contracts | Contact: ${sel.contactName} (${sel.contactEmail})</div>
          <div class="detail-grid">
            <div class="dm"><div class="dm-label">Risk Score</div><div style="display:flex;align-items:center;gap:8px">${this._scoreGaugeSVG(sel.score, 42)}<div class="dm-value" style="color:${this._scoreColor(sel.score)}">${sel.score}/100</div></div></div>
            <div class="dm"><div class="dm-label">Score Trend (6mo)</div><div style="margin-top:6px">${this._sparklineSVG(sel.trend, sel.trend[sel.trend.length - 1] >= sel.trend[0] ? '#22c55e' : '#ef4444')}</div><div style="font-size:10px;margin-top:2px;color:${sel.trend[sel.trend.length - 1] >= sel.trend[0] ? '#22c55e' : '#ef4444'}">${sel.trend[sel.trend.length - 1] >= sel.trend[0] ? '▲ +' + (sel.trend[sel.trend.length - 1] - sel.trend[0]) : '▼ ' + (sel.trend[sel.trend.length - 1] - sel.trend[0])} pts</div></div>
            <div class="dm"><div class="dm-label">SLA Compliance</div><div class="dm-value" style="color:${sel.slaCompliance >= 99.5 ? '#22c55e' : '#f97316'}">${sel.slaCompliance}%</div><div style="margin-top:4px">${this._slaBarSVG(sel.slaCompliance)}</div></div>
            <div class="dm"><div class="dm-label">Security Certs</div><div style="display:flex;flex-direction:column;gap:4px;margin-top:4px"><span class="badge ${sel.soc2 ? 'b-low' : 'b-high'}">SOC 2 ${sel.soc2 ? '✓' : '✗'}</span><span class="badge ${sel.iso27001 ? 'b-low' : 'b-medium'}">ISO 27001 ${sel.iso27001 ? '✓' : '✗'}</span></div></div>
          </div>
          <div style="margin-bottom:8px"><div style="font-size:11px;font-weight:600;margin-bottom:4px;color:#94a3b8">Data Shared</div><div style="font-size:11px;color:#e2e8f0">${sel.dataShared}</div></div>
          <div style="margin-bottom:8px"><div style="font-size:11px;font-weight:600;margin-bottom:4px;color:#94a3b8">Risk Factors</div>${sel.riskFactors.map(r => html`<div style="font-size:11px;padding:2px 0;color:#f97316;display:flex;gap:4px"><span>⚠</span>${r}</div>`)}</div>
          <div style="font-size:10px;color:#6b7280">Last Assessment: ${sel.lastAssessment} | Renewal: ${sel.renewalDate} | Incidents (12mo): ${sel.incidents}</div>
          <div class="action-bar">
            <button class="action-btn" @click=${() => { if (sel) { sel.status = 'active'; this.requestUpdate(); } }>✓ Approve</button>
            <button class="action-btn" @click=${() => { if (sel) { sel.status = 'under-review'; this.requestUpdate(); } }>↑ Flag for Review</button>
            <button class="action-btn">📋 Schedule Assessment</button>
            <button class="action-btn">📤 Export Report</button>
          </div>
        </div>` : nothing}

        <div style="display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap;align-items:center">
          ${['all','critical','high','medium','low'].map(t => html`<span class="tab ${this._tierFilter === t ? 'active' : ''}" style="padding:4px 10px;font-size:10px" @click=${() => { this._tierFilter = t; this._page = 1; }}>${t === 'all' ? 'All Tiers' : t}</span>`)}
          <div style="margin-left:auto;display:flex;gap:4px">
            <button class="action-btn" style="font-size:10px;padding:4px 8px" @click=${() => this._exportVendorData('csv')}>Export CSV</button>
            <button class="action-btn" style="font-size:10px;padding:4px 8px" @click=${() => this._exportVendorData('json')}>Export JSON</button>
          </div>
        </div>

        <div class="section">
          <table class="table">
            <tr>
              <th @click=${() => { this._sortKey = 'name'; this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc'; }}>Vendor ${this._sortKey === 'name' ? html`<span class="sort-arrow">${this._sortDir === 'asc' ? '▲' : '▼'}</span>` : nothing}</th>
              <th>Tier</th>
              <th @click=${() => { this._sortKey = 'score'; this._sortDir = this._sortDir === 'desc' ? 'asc' : 'desc'; }}>Score ${this._sortKey === 'score' ? html`<span class="sort-arrow">${this._sortDir === 'asc' ? '▲' : '▼'}</span>` : nothing}</th>
              <th>Trend</th>
              <th>Certs</th>
              <th @click=${() => { this._sortKey = 'slaCompliance'; this._sortDir = this._sortDir === 'desc' ? 'asc' : 'desc'; }}>SLA ${this._sortKey === 'slaCompliance' ? html`<span class="sort-arrow">${this._sortDir === 'asc' ? '▲' : '▼'}</span>` : nothing}</th>
              <th>Status</th>
            </tr>
            ${pageData.map(v => html`<tr @click=${() => { this._selected = v; }}>
              <td><div style="display:flex;align-items:center;gap:6px"><input type="checkbox" @click=${(e: Event) => { e.stopPropagation(); this._toggleCompare(v.id); } .checked=${this._compareVendors.has(v.id)} style="accent-color:#f59e0b"><div><div style="font-weight:600">${v.name}</div><div style="font-size:10px;color:#6b7280">${v.category} | ${v.contracts} contracts</div></div></div></td>
              <td><span class="badge b-${v.tier}">${v.tier}</span></td>
              <td>${this._scoreGaugeSVG(v.score, 36)}</td>
              <td>${this._sparklineSVG(v.trend, v.trend[v.trend.length - 1] >= v.trend[0] ? '#22c55e' : '#ef4444')}</td>
              <td><span class="badge ${v.soc2 ? 'b-low' : 'b-high'}" style="margin-right:2px">S2</span><span class="badge ${v.iso27001 ? 'b-low' : 'b-medium'}">ISO</span></td>
              <td><div style="font-size:11px">${v.slaCompliance}%</div><div>${this._slaBarSVG(v.slaCompliance)}</div></td>
              <td style="color:${v.status === 'active' ? '#22c55e' : v.status === 'under-review' ? '#f97316' : v.status === 'pending' ? '#eab308' : '#6b7280'}">${v.status}</td>
            </tr>`)}
          </table>
        </div>

        ${totalPages > 1 ? html`<div class="pagination">
          <button class="pg-btn" @click=${() => { if (this._page > 1) this._page--; }}>‹</button>
          ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => html`<button class="pg-btn ${this._page === p ? 'active' : ''}" @click=${() => { this._page = p; }}>${p}</button>`)}
          <button class="pg-btn" @click=${() => { if (this._page < totalPages) this._page++; }}>›</button>
          <span style="font-size:11px;color:#6b7280">${filtered.length} vendors</span>
        </div>` : nothing}
      ` : ''}

      ${this._tab === 'assessments' ? html`
        <div class="section">
          <div class="stitle">Assessment Schedule</div>
          ${[
            { vendor: 'Twilio Messaging', type: 'Full Security Assessment', due: '2026-05-01', status: 'Pending', priority: 'high' },
            { vendor: 'Zendesk Support', type: 'SOC 2 Review', due: '2026-05-15', status: 'Scheduled', priority: 'medium' },
            { vendor: 'Zoom Communications', type: 'Privacy Impact Assessment', due: '2026-06-01', status: 'In Progress', priority: 'medium' },
            { vendor: 'Legacy CRM System', type: 'Offboarding Security Review', due: '2026-06-15', status: 'Pending', priority: 'low' },
            { vendor: 'Workday HR', type: 'Annual Security Audit', due: '2026-07-01', status: 'Scheduled', priority: 'high' },
            { vendor: 'NewRelic APM', type: 'Re-certification Assessment', due: '2026-05-20', status: 'Pending', priority: 'high' },
          ].map(a => html`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #374151">
              <div style="flex:1">
                <div style="font-size:12px;font-weight:600">${a.vendor}</div>
                <div style="font-size:10px;color:#6b7280">${a.type} | Due: ${a.due}</div>
              </div>
              <span class="badge b-${a.priority}" style="margin-right:8px">${a.priority}</span>
              <span class="badge b-${a.status === 'In Progress' ? 'medium' : a.status === 'Pending' ? 'high' : 'low'}">${a.status}</span>
            </div>
          `)}
        </div>
        <div class="section">
          <div class="stitle">Assessment Statistics</div>
          <div style="display:flex;align-items:center;gap:20px;margin-bottom:14px">
            <div style="flex:1;display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
              <div style="background:#0f172a;border-radius:6px;padding:10px;text-align:center"><div style="font-size:18px;font-weight:700;color:#22c55e">${soc2Count}</div><div style="font-size:10px;color:#6b7280">SOC 2 Compliant</div></div>
              <div style="background:#0f172a;border-radius:6px;padding:10px;text-align:center"><div style="font-size:18px;font-weight:700;color:#3b82f6">${filtered.filter(v => v.iso27001).length}</div><div style="font-size:10px;color:#6b7280">ISO 27001</div></div>
              <div style="background:#0f172a;border-radius:6px;padding:10px;text-align:center"><div style="font-size:18px;font-weight:700;color:#f97316">${filtered.filter(v => v.score < 75).length}</div><div style="font-size:10px;color:#6b7280">Below Threshold</div></div>
              <div style="background:#0f172a;border-radius:6px;padding:10px;text-align:center"><div style="font-size:18px;font-weight:700">${filtered.reduce((s, v) => s + v.incidents, 0)}</div><div style="font-size:10px;color:#6b7280">Total Incidents</div></div>
            </div>
            <div style="flex-shrink:0">${this._riskMatrixSVG()}</div>
          </div>
        </div>
      ` : ''}

      ${this._tab === 'workflow' ? html`
        <div class="section">
          <div class="stitle">TPRM Workflow Steps</div>
          ${['Identify & Register Vendor', 'Risk Tier Classification', 'Security Questionnaire', 'Evidence Review & Validation', 'Risk Score Calculation', 'Contract & DPA Review', 'Executive Approval', 'Ongoing Monitoring'].map((step, i) => html`
            <div class="workflow-step">
              <div class="step-num" style="${i < 4 ? 'background:#22c55e;color:#111' : i < 6 ? 'background:#f59e0b;color:#111' : ''}">${i + 1}</div>
              <div style="flex:1;font-size:12px">${step}</div>
              ${i < 7 ? html`<div class="step-line" style="${i < 4 ? 'background:#22c55e' : i < 6 ? 'background:#f59e0b' : ''}"></div>` : nothing}
            </div>
          `)}
          <div style="margin-top:12px;font-size:11px;color:#6b7280">
            <div>● Completed: Steps 1-4 (Initial onboarding and assessment)</div>
            <div>● In Progress: Steps 5-6 (Scoring and contract review)</div>
            <div>○ Pending: Steps 7-8 (Approval and monitoring)</div>
          </div>
        </div>
        <div class="section">
          <div class="stitle">Vendor Distribution by Category</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${Object.entries(filtered.reduce((acc, v) => { acc[v.category] = (acc[v.category] || 0) + 1; return acc; }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
              const pct = Math.round((count / filtered.length) * 100);
              return html`<div style="display:flex;align-items:center;gap:8px">
                <div style="width:100px;font-size:11px;color:#94a3b8">${cat}</div>
                <div style="flex:1;height:8px;background:#1f2937;border-radius:4px;overflow:hidden"><div style="width:${pct}%;height:100%;background:#3b82f6;border-radius:4px"></div></div>
                <div style="font-size:11px;font-weight:600;width:40px;text-align:right">${count}</div>
              </div>`;
            })}
          </div>
        </div>
        <div class="section">
          <div class="stitle">Risk Tier Distribution</div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
            ${['critical','high','medium','low'].map(tier => {
              const count = filtered.filter(v => v.tier === tier).length;
              const avgScore = filtered.filter(v => v.tier === tier).reduce((s, v) => s + v.score, 0) / (count || 1);
              const tierColor = tier === 'critical' ? '#ef4444' : tier === 'high' ? '#f97316' : tier === 'medium' ? '#eab308' : '#22c55e';
              return html`<div style="background:#0f172a;border-radius:6px;padding:10px;text-align:center">
                <div style="font-size:20px;font-weight:700;color:${tierColor}">${count}</div>
                <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;margin-bottom:4px">${tier}</div>
                <div style="font-size:11px;font-weight:600">Avg: ${Math.round(avgScore)}</div>
              </div>`;
            })}
          </div>
        </div>
        <div class="section">
          <div class="stitle">Upcoming Renewals</div>
          ${[...this._vendors].filter(v => v.status !== 'offboarded').sort((a, b) => a.renewalDate.localeCompare(b.renewalDate)).slice(0, 5).map(v => {
            const daysUntil = Math.ceil((new Date(v.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const urgency = daysUntil < 60 ? '#ef4444' : daysUntil < 120 ? '#eab308' : '#22c55e';
            return html`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1f2937">
              <div style="width:6px;height:6px;border-radius:50%;background:${urgency}"></div>
              <span style="flex:1;font-size:12px;font-weight:600">${v.name}</span>
              <span style="font-size:11px;color:#6b7280">${v.renewalDate}</span>
              <span style="font-size:11px;font-weight:600;color:${urgency}">${daysUntil}d</span>
            </div>`;
          })}
        </div>
      ` : ''}

      ${this._tab === 'compliance' ? this._renderCompliance() : ''}
      ${this._tab === 'compare' ? this._renderCompare() : ''}

      ${this._showCompare && this._tab !== 'compare' ? html`
        <div style="position:sticky;bottom:0;background:#111827;padding:10px;border-top:1px solid #374151;display:flex;gap:8px;align-items:center;z-index:100;border-radius:0 0 12px 12px">
          <span style="font-size:11px;color:#94a3b8">${this._compareVendors.size} selected for comparison</span>
          <button class="action-btn" style="background:#f59e0b;color:#111827;border-color:#f59e0b" @click=${() => { this._tab = 'compare'; }}>Compare Now</button>
          <button class="action-btn" @click=${() => { this._compareVendors = new Set(); this._showCompare = false; }}>Clear</button>
        </div>
      ` : ''}

      ${this._renderNotifications()}
    </div>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-vendor-risk-assessment': ScVendorRiskAssessment; } }
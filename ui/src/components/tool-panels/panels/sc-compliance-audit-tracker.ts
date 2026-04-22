/**
 * sc-compliance-audit-tracker — Compliance Audit Tracker
 * Multi-framework compliance management with evidence tracking
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface Control {
  id: string;
  name: string;
  framework: string;
  category: string;
  status: 'implemented' | 'partial' | 'not-implemented' | 'na';
  evidence: string;
  lastReviewed: string;
  owner: string;
}

interface AuditFinding {
  id: string;
  title: string;
  framework: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'remediating' | 'closed';
  dueDate: string;
  owner: string;
}

interface RemediationTask {
  id: string;
  findingId: string;
  title: string;
  assignee: string;
  status: 'not-started' | 'in-progress' | 'testing' | 'completed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  progress: number;
  dueDate: string;
  evidence: string[];
  notes: string;
}

interface EvidenceItem {
  id: string;
  controlId: string;
  title: string;
  type: 'document' | 'screenshot' | 'log' | 'config' | 'policy';
  uploadedAt: string;
  uploadedBy: string;
  status: 'approved' | 'pending-review' | 'rejected';
  size: string;
}

interface PolicyMapping {
  regulation: string;
  controlRef: string;
  title: string;
  mappedTo: string[];
  status: 'mapped' | 'partial' | 'gap';
}

@customElement('sc-compliance-audit-tracker')
export class ScComplianceAuditTracker extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 16px; }
    .stat { background: #1f2937; border-radius: 8px; padding: 12px; text-align: center; }
    .sv { font-size: 20px; font-weight: 700; }
    .sl { font-size: 9px; color: #94a3b8; margin-top: 2px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 14px; flex-wrap: wrap; }
    .tab { padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: transparent; color: #94a3b8; }
    .tab:hover { background: #374151; }
    .tab.active { background: #f59e0b; color: #111827; }
    .badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .b-implemented { background: #052e16; color: #86efac; }
    .b-partial { background: #422006; color: #fde047; }
    .b-not-implemented { background: #450a0a; color: #fca5a5; }
    .b-na { background: #1f2937; color: #6b7280; }
    .b-open { background: #450a0a; color: #fca5a5; }
    .b-remediating { background: #422006; color: #fde047; }
    .b-closed { background: #052e16; color: #86efac; }
    .tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
    .tbl th { text-align: left; padding: 8px; background: #0f172a; color: #94a3b8; font-weight: 600; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #374151; }
    .tbl td { padding: 10px 8px; border-bottom: 1px solid #1f2937; }
    .tbl tr:hover td { background: #1f2937; }
    .compliance-card { background: #1f2937; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .comp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .comp-name { font-weight: 700; font-size: 14px; }
    .comp-score { font-size: 28px; font-weight: 700; }
    .progress-bar { height: 8px; background: #374151; border-radius: 4px; overflow: hidden; margin-top: 8px; }
    .progress-fill { height: 100%; border-radius: 4px; }
    .calendar { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
    .cal-day { aspect-ratio: 1; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; cursor: pointer; }
    .cal-audit { background: #3b82f6; color: white; }
    .cal-review { background: #22c55e; color: white; }
    .cal-today { border: 2px solid #f59e0b; }
    .cal-header { font-size: 9px; color: #6b7280; text-align: center; padding: 4px; }
    .finding-row { background: #0f172a; border-radius: 6px; padding: 10px; margin-bottom: 6px; border-left: 3px solid; }
    .finding-row.critical { border-color: #ef4444; }
    .finding-row.high { border-color: #f97316; }
    .finding-row.medium { border-color: #eab308; }
    .finding-row.low { border-color: #22c55e; }
    .finding-title { font-weight: 600; font-size: 12px; margin-bottom: 4px; }
    .finding-meta { display: flex; gap: 12px; font-size: 10px; color: #6b7280; }
    .rem-task { background: #0f172a; border-radius: 6px; padding: 10px; margin-bottom: 6px; border-left: 3px solid; }
    .rem-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .rem-title { font-weight: 600; font-size: 12px; }
    .rem-meta { display: flex; gap: 10px; font-size: 10px; color: #6b7280; flex-wrap: wrap; }
    .evidence-card { background: #0f172a; border-radius: 6px; padding: 10px; margin-bottom: 6px; display: flex; align-items: center; gap: 10px; }
    .evidence-icon { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
    .evidence-info { flex: 1; }
    .evidence-title { font-size: 12px; font-weight: 600; }
    .evidence-meta { font-size: 10px; color: #6b7280; }
    .mapping-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: #0f172a; border-radius: 6px; margin-bottom: 4px; font-size: 11px; }
    .mapping-reg { width: 70px; font-weight: 700; font-size: 10px; }
    .mapping-ctrl { width: 80px; font-family: monospace; color: #94a3b8; }
    .mapping-arrow { color: #6b7280; }
    .mapping-target { flex: 1; color: #e2e8f0; }
    .timeline-item { display: flex; gap: 12px; padding: 8px 0; position: relative; }
    .timeline-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
    .timeline-line { position: absolute; left: 4px; top: 22px; bottom: -8px; width: 2px; background: #374151; }
    .timeline-content { flex: 1; }
    .timeline-title { font-size: 12px; font-weight: 600; }
    .timeline-date { font-size: 10px; color: #6b7280; }
    .approval-row { background: #0f172a; border-radius: 8px; padding: 14px; margin-bottom: 8px; }
    .approval-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .approval-actions { display: flex; gap: 6px; margin-top: 8px; }
    .btn { padding: 6px 14px; border-radius: 6px; border: none; font-size: 11px; font-weight: 600; cursor: pointer; }
    .btn-primary { background: #f59e0b; color: #111827; }
    .btn-success { background: #22c55e; color: white; }
    .btn-danger { background: #dc2626; color: white; }
    .btn-secondary { background: #374151; color: #e2e8f0; }
    .form-input { width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid #374151; border-radius: 6px; color: #e2e8f0; font-size: 12px; outline: none; }
    .form-input:focus { border-color: #f59e0b; }
    .form-group { margin-bottom: 10px; }
    .form-label { display: block; font-size: 11px; font-weight: 600; color: #94a3b8; margin-bottom: 4px; }
    .heatmap-grid { display: grid; grid-template-columns: 80px repeat(5, 1fr); gap: 2px; font-size: 9px; }
    .heatmap-cell { padding: 6px 4px; text-align: center; border-radius: 3px; font-weight: 600; }
    .sla-bar { display: flex; align-items: center; gap: 12px; background: #1f2937; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; }
    .sla-indicator { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  `;

  @state() private _tab: 'overview' | 'soc2' | 'iso' | 'pci' | 'calendar' | 'remediation' | 'evidence' | 'mapping' = 'overview';
  @state() private _searchQuery = '';
  @state() private _selectedFinding: string | null = null;
  @state() private _approvalComment = '';
  @state() private _newEvidenceTitle = '';
  @state() private _newEvidenceType: 'document' | 'screenshot' | 'log' | 'config' | 'policy' = 'document';
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


  private _remediationTasks: RemediationTask[] = [
    { id: 'rt-1', findingId: 'f2', title: 'Implement comprehensive logging for payment processing', assignee: 'Payment Team', status: 'in-progress', priority: 'critical', progress: 60, dueDate: '2026-04-30', evidence: ['Logging config draft'], notes: 'Working with Splunk team for SIEM integration' },
    { id: 'rt-2', findingId: 'f1', title: 'Enforce password policy on legacy systems', assignee: 'IT Ops', status: 'in-progress', priority: 'high', progress: 40, dueDate: '2026-05-15', evidence: [], notes: 'Legacy AD domain requires schema update first' },
    { id: 'rt-3', findingId: 'f3', title: 'Document all third-party vendor access', assignee: 'Vendor Mgmt', status: 'not-started', priority: 'medium', progress: 0, dueDate: '2026-06-01', evidence: [], notes: 'Need to coordinate with procurement team' },
    { id: 'rt-4', findingId: 'f2', title: 'Deploy file integrity monitoring on payment servers', assignee: 'Security Ops', status: 'testing', priority: 'critical', progress: 85, dueDate: '2026-04-28', evidence: ['FIM deployment report'], notes: 'OSSEC agents deployed, pending validation' },
    { id: 'rt-5', findingId: 'f1', title: 'Deploy MFA on all legacy system access points', assignee: 'IT Security', status: 'not-started', priority: 'high', progress: 0, dueDate: '2026-05-30', evidence: [], notes: 'RADIUS integration required' },
  ];

  private _evidenceItems: EvidenceItem[] = [
    { id: 'ev-1', controlId: 'c1', title: 'Access Control Policy v3.2', type: 'policy', uploadedAt: '2026-04-10', uploadedBy: 'IT Security', status: 'approved', size: '2.4 MB' },
    { id: 'ev-2', controlId: 'c2', title: 'AWS KMS Configuration Export', type: 'config', uploadedAt: '2026-04-12', uploadedBy: 'Cloud Team', status: 'approved', size: '156 KB' },
    { id: 'ev-3', controlId: 'c3', title: 'Incident Response Plan Draft', type: 'document', uploadedAt: '2026-04-15', uploadedBy: 'SOC Lead', status: 'pending-review', size: '1.8 MB' },
    { id: 'ev-4', controlId: 'c4', title: 'Nessus Scan Report - Q1 2026', type: 'log', uploadedAt: '2026-04-10', uploadedBy: 'Vuln Mgmt', status: 'approved', size: '4.2 MB' },
    { id: 'ev-5', controlId: 'c5', title: 'Pentest Report - Web Application', type: 'document', uploadedAt: '2026-03-28', uploadedBy: 'Red Team', status: 'approved', size: '8.1 MB' },
    { id: 'ev-6', controlId: 'c2', title: 'Encryption Key Rotation Logs', type: 'log', uploadedAt: '2026-04-18', uploadedBy: 'Cloud Team', status: 'pending-review', size: '89 KB' },
  ];

  private _policyMappings: PolicyMapping[] = [
    { regulation: 'GDPR', controlRef: 'Art. 32', title: 'Security of Processing', mappedTo: ['SOC 2 CC6.1', 'ISO 27001 A.10.1'], status: 'mapped' },
    { regulation: 'GDPR', controlRef: 'Art. 33', title: 'Breach Notification', mappedTo: ['SOC 2 CC7.3'], status: 'partial' },
    { regulation: 'HIPAA', controlRef: '164.312(a)', title: 'Access Control', mappedTo: ['SOC 2 CC6.1', 'ISO 27001 A.9.1'], status: 'mapped' },
    { regulation: 'HIPAA', controlRef: '164.312(e)', title: 'Transmission Security', mappedTo: ['ISO 27001 A.10.1'], status: 'mapped' },
    { regulation: 'PCI DSS', controlRef: 'Req 1', title: 'Network Segmentation', mappedTo: ['SOC 2 CC6.6'], status: 'mapped' },
    { regulation: 'PCI DSS', controlRef: 'Req 10', title: 'Audit Logging', mappedTo: ['SOC 2 CC7.2', 'ISO 27001 A.12.4'], status: 'mapped' },
    { regulation: 'NIST CSF', controlRef: 'PR.DS-1', title: 'Data-at-Rest Protection', mappedTo: ['SOC 2 CC6.1', 'ISO 27001 A.10.1'], status: 'mapped' },
    { regulation: 'NIST CSF', controlRef: 'DE.CM-8', title: 'Vulnerability Scanning', mappedTo: ['SOC 2 CC7.1'], status: 'gap' },
  ];

  private _auditTimeline = [
    { date: '2026-01-15', title: 'SOC 2 Type II Kickoff Meeting', color: '#3b82f6' },
    { date: '2026-02-28', title: 'Internal Gap Assessment Completed', color: '#22c55e' },
    { date: '2026-03-15', title: 'Evidence Collection Phase Started', color: '#f59e0b' },
    { date: '2026-04-10', title: 'Remediation Sprint #1 Completed', color: '#22c55e' },
    { date: '2026-04-25', title: 'SOC 2 External Audit (Upcoming)', color: '#ef4444' },
    { date: '2026-05-10', title: 'ISO 27001 Surveillance Audit', color: '#3b82f6' },
    { date: '2026-05-20', title: 'PCI DSS QSA Assessment', color: '#a855f7' },
  ];

  private _frameworks = [
    { name: 'SOC 2', score: 87, implemented: 78, partial: 8, total: 90 },
    { name: 'ISO 27001', score: 92, implemented: 112, partial: 6, total: 125 },
    { name: 'PCI DSS', score: 95, implemented: 42, partial: 2, total: 47 },
    { name: 'HIPAA', score: 88, implemented: 35, partial: 3, total: 40 },
    { name: 'GDPR', score: 82, implemented: 48, partial: 7, total: 60 },
  ];

  private _controls: Control[] = [
    { id: 'c1', name: 'Access Control Policy', framework: 'SOC 2', category: 'Access Control', status: 'implemented', evidence: 'Policy document uploaded', lastReviewed: '2026-03-15', owner: 'IT Security' },
    { id: 'c2', name: 'Encryption at Rest', framework: 'SOC 2', category: 'Data Protection', status: 'implemented', evidence: 'AWS KMS configuration', lastReviewed: '2026-03-20', owner: 'Cloud Team' },
    { id: 'c3', name: 'Incident Response Plan', framework: 'SOC 2', category: 'IR', status: 'partial', evidence: 'Draft in progress', lastReviewed: '2026-04-01', owner: 'SOC Lead' },
    { id: 'c4', name: 'Vulnerability Scanning', framework: 'ISO 27001', category: 'Technical', status: 'implemented', evidence: 'Nessus scan reports', lastReviewed: '2026-04-10', owner: 'Vuln Mgmt' },
    { id: 'c5', name: 'Penetration Testing', framework: 'PCI DSS', category: 'Technical', status: 'implemented', evidence: 'Pentest report Q1 2026', lastReviewed: '2026-03-01', owner: 'Red Team' },
  ];

  private _findings: AuditFinding[] = [
    { id: 'f1', title: 'Password policy not enforced on legacy systems', framework: 'SOC 2', severity: 'high', status: 'remediating', dueDate: '2026-05-15', owner: 'IT Ops' },
    { id: 'f2', title: 'Logging gaps in payment processing system', framework: 'PCI DSS', severity: 'critical', status: 'open', dueDate: '2026-04-30', owner: 'Payment Team' },
    { id: 'f3', title: 'Third-party vendor access not documented', framework: 'ISO 27001', severity: 'medium', status: 'open', dueDate: '2026-06-01', owner: 'Vendor Mgmt' },
    { id: 'f4', title: 'Data retention policy not updated', framework: 'GDPR', severity: 'medium', status: 'closed', dueDate: '2026-04-15', owner: 'Legal' },
  ];

  private _auditCalendar = [
    { date: '2026-04-25', type: 'audit', name: 'SOC 2 External Audit' },
    { date: '2026-05-10', type: 'review', name: 'ISO 27001 Surveillance' },
    { date: '2026-05-20', type: 'audit', name: 'PCI DSS QSA Assessment' },
  ];

  private _getStatusClass(status: string): string {
    return `b-${status}`;
  }

  private _renderOverview() {
    return html`
      <div class="stats">
        <div class="stat"><div class="sv" style="color:#22c55e">89%</div><div class="sl">Avg Compliance</div></div>
        <div class="stat"><div class="sv">315</div><div class="sl">Controls Total</div></div>
        <div class="stat"><div class="sv" style="color:#22c55e">278</div><div class="sl">Implemented</div></div>
        <div class="stat"><div class="sv" style="color:#f97316">${this._findings.filter(f => f.status !== 'closed').length}</div><div class="sl">Open Findings</div></div>
        <div class="stat"><div class="sv" style="color:#ef4444">${this._findings.filter(f => f.severity === 'critical' && f.status !== 'closed').length}</div><div class="sl">Critical</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${this._frameworks.map(f => html`
          <div class="compliance-card">
            <div class="comp-header">
              <span class="comp-name">${f.name}</span>
              <span class="comp-score" style="color:${f.score > 90 ? '#22c55e' : f.score > 80 ? '#3b82f6' : '#f97316'}">${f.score}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${f.score}%;background:${f.score > 90 ? '#22c55e' : '#3b82f6'}"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;color:#6b7280;margin-top:6px">
              <span>${f.implemented} implemented</span>
              <span>${f.partial} partial</span>
              <span>${f.total - f.implemented - f.partial} pending</span>
            </div>
          </div>
        `)}
      </div>
      <div class="compliance-card" style="margin-top:12px">
        <div style="font-weight:600;margin-bottom:10px">Recent Audit Findings</div>
        ${this._findings.slice(0, 3).map(f => html`
          <div class="finding-row ${f.severity}">
            <div class="finding-title">${f.title} <span class="badge b-${f.framework.toLowerCase().replace(' ', '-')}">${f.framework}</span></div>
            <div class="finding-meta">
              <span>Severity: ${f.severity}</span>
              <span>Status: ${f.status}</span>
              <span>Due: ${f.dueDate}</span>
              <span>Owner: ${f.owner}</span>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  private _renderFrameworkControls(framework: string) {
    const filtered = this._controls.filter(c => c.framework === framework);
    return html`
      <div class="tbl">
        <thead>
          <tr><th>Control</th><th>Category</th><th>Status</th><th>Evidence</th><th>Last Reviewed</th><th>Owner</th></tr>
        </thead>
        <tbody>
          ${filtered.map(c => html`
            <tr>
              <td style="font-weight:600">${c.name}</td>
              <td style="color:#94a3b8">${c.category}</td>
              <td><span class="badge b-${c.status}">${c.status}</span></td>
              <td style="color:#94a3b8;font-size:11px">${c.evidence}</td>
              <td style="color:#6b7280;font-size:11px">${c.lastReviewed}</td>
              <td>${c.owner}</td>
            </tr>
          `)}
        </tbody>
      </div>
      ${filtered.length === 0 ? html`<div style="text-align:center;padding:40px;color:#6b7280">No controls found for ${framework}</div>` : nothing}
    `;
  }

  private _renderCalendar() {
    return html`
      <div style="background:#1f2937;border-radius:8px;padding:16px">
        <div style="font-weight:600;margin-bottom:12px">April 2026 Audit Calendar</div>
        <div class="calendar" style="margin-bottom:12px">
          ${['S','M','T','W','T','F','S'].map(d => html`<div class="cal-header">${d}</div>`)}
          ${Array.from({length: 30}, (_, i) => {
            const day = i + 1;
            const event = this._auditCalendar.find(a => new Date(a.date).getDate() === day);
            return html`<div class="cal-day ${event ? (event.type === 'audit' ? 'cal-audit' : 'cal-review') : ''} ${day === 21 ? 'cal-today' : ''}">${day}</div>`;
          })}
        </div>
        <div style="display:flex;gap:16px;font-size:11px">
          <span><span style="background:#3b82f6;padding:2px 6px;border-radius:3px;color:white">■</span> External Audit</span>
          <span><span style="background:#22c55e;padding:2px 6px;border-radius:3px;color:white">■</span> Internal Review</span>
          <span><span style="border:2px solid #f59e0b;padding:2px 6px;border-radius:3px">■</span> Today</span>
        </div>
      </div>
      <div class="compliance-card" style="margin-top:12px">
        <div style="font-weight:600;margin-bottom:10px">Audit Timeline</div>
        ${this._auditTimeline.map((t, i) => html`<div class="timeline-item">
          ${i < this._auditTimeline.length - 1 ? html`<div class="timeline-line"></div>` : nothing}
          <div class="timeline-dot" style="background:${t.color}"></div>
          <div class="timeline-content">
            <div class="timeline-title">${t.title}</div>
            <div class="timeline-date">${t.date}</div>
          </div>
        </div>`)}
      </div>
    `;
  }

  private _renderRemediation() {
    const tasks = this._searchQuery ? this._remediationTasks.filter(t => t.title.toLowerCase().includes(this._searchQuery.toLowerCase())) : this._remediationTasks;
    const notStarted = this._remediationTasks.filter(t => t.status === 'not-started').length;
    const inProgress = this._remediationTasks.filter(t => t.status === 'in-progress').length;
    const testing = this._remediationTasks.filter(t => t.status === 'testing').length;
    const completed = this._remediationTasks.filter(t => t.status === 'completed').length;
    const total = this._remediationTasks.length || 1;
    return html`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="stitle">Remediation Tracker</div>
        <div style="display:flex;gap:6px">
          <span class="badge b-not-implemented">Not Started: ${notStarted}</span>
          <span class="badge b-remediating">In Progress: ${inProgress}</span>
          <span class="badge b-partial">Testing: ${testing}</span>
          <span class="badge b-implemented">Completed: ${completed}</span>
        </div>
      </div>
      <div class="progress-bar" style="margin-bottom:14px"><div class="progress-fill" style="width:${(completed / total) * 100}%;background:#22c55e"></div></div>
      <div style="display:flex;gap:4px;margin-bottom:12px">
        <input class="form-input" style="flex:1" type="text" placeholder="Search remediation tasks..." .value=${this._searchQuery} @input=${(e: Event) => { this._searchQuery = (e.target as HTMLInputElement).value; }}>
      </div>
      ${tasks.map(t => {
        const statusColor = t.status === 'completed' ? '#22c55e' : t.status === 'in-progress' ? '#3b82f6' : t.status === 'testing' ? '#f59e0b' : '#6b7280';
        const prioColor = t.priority === 'critical' ? '#ef4444' : t.priority === 'high' ? '#f97316' : t.priority === 'medium' ? '#eab308' : '#22c55e';
        return html`<div class="rem-task" style="border-left-color:${prioColor}">
          <div class="rem-header">
            <span class="rem-title">${t.title}</span>
            <span class="badge" style="background:${statusColor}20;color:${statusColor}">${t.status.replace('-', ' ')}</span>
          </div>
          <div class="rem-meta">
            <span>Assignee: ${t.assignee}</span><span>Due: ${t.dueDate}</span><span>Finding: ${t.findingId}</span>
          </div>
          <div style="margin:6px 0"><div class="progress-bar"><div class="progress-fill" style="width:${t.progress}%;background:${statusColor}"></div></div><div style="font-size:9px;color:#6b7280;margin-top:2px">${t.progress}%</div></div>
          ${t.notes ? html`<div style="font-size:10px;color:#94a3b8;font-style:italic;margin-top:4px">${t.notes}</div>` : nothing}
          ${t.evidence.length > 0 ? html`<div style="font-size:10px;color:#6b7280;margin-top:4px">Evidence: ${t.evidence.join(', ')}</div>` : nothing}
        </div>`;
      })}
      <div class="compliance-card" style="margin-top:12px">
        <div style="font-weight:600;margin-bottom:8px">Approval Queue</div>
        ${this._remediationTasks.filter(t => t.status === 'testing').map(t => html`<div class="approval-row">
          <div class="approval-header">
            <div><div style="font-size:12px;font-weight:600">${t.title}</div><div style="font-size:10px;color:#6b7280">Assignee: ${t.assignee} | Due: ${t.dueDate}</div></div>
          </div>
          <div class="form-group"><label class="form-label">Review Comment</label><input class="form-input" type="text" placeholder="Add review comments..." .value=${this._approvalComment} @input=${(e: Event) => { this._approvalComment = (e.target as HTMLInputElement).value; }}></div>
          <div class="approval-actions">
            <button class="btn btn-success" @click=${() => { this._remediationTasks = this._remediationTasks.map(r => r.id === t.id ? { ...r, status: 'completed' as const, progress: 100 } : r); }}>Approve</button>
            <button class="btn btn-secondary" @click=${() => { this._remediationTasks = this._remediationTasks.map(r => r.id === t.id ? { ...r, status: 'in-progress' as const } : r); }}>Request Changes</button>
          </div>
        </div>`)}
        ${this._remediationTasks.filter(t => t.status === 'testing').length === 0 ? html`<div style="text-align:center;padding:20px;color:#6b7280;font-size:12px">No items pending approval</div>` : nothing}
      </div>
    `;
  }

  private _renderEvidence() {
    const typeIcons: Record<string, string> = { document: '\uD83D\uDCC4', screenshot: '\uD83D\uDCF7', log: '\uD83D\uDDC2', config: '\u2699\uFE0F', policy: '\uD83D\uDCDC' };
    const typeColors: Record<string, string> = { document: '#3b82f6', screenshot: '#a855f7', log: '#f97316', config: '#06b6d4', policy: '#22c55e' };
    const approved = this._evidenceItems.filter(e => e.status === 'approved').length;
    const pending = this._evidenceItems.filter(e => e.status === 'pending-review').length;
    return html`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="stitle">Evidence Repository (${this._evidenceItems.length} items)</div>
        <div style="display:flex;gap:6px">
          <span class="badge b-implemented">Approved: ${approved}</span>
          <span class="badge b-remediating">Pending: ${pending}</span>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <input class="form-input" style="flex:1" type="text" placeholder="Title..." .value=${this._newEvidenceTitle} @input=${(e: Event) => { this._newEvidenceTitle = (e.target as HTMLInputElement).value; }}>
        <select class="form-input" style="width:120px" .value=${this._newEvidenceType} @change=${(e: Event) => { this._newEvidenceType = (e.target as HTMLSelectElement).value as EvidenceItem['type']; }}>
          <option value="document">Document</option><option value="screenshot">Screenshot</option><option value="log">Log</option><option value="config">Config</option><option value="policy">Policy</option>
        </select>
        <button class="btn btn-primary" @click=${() => { if (this._newEvidenceTitle.trim()) { this._evidenceItems = [{ id: 'ev-' + Date.now(), controlId: 'c1', title: this._newEvidenceTitle.trim(), type: this._newEvidenceType, uploadedAt: new Date().toISOString().split('T')[0], uploadedBy: 'Current User', status: 'pending-review', size: '0 KB' }, ...this._evidenceItems]; this._newEvidenceTitle = ''; } }>Upload</button>
      </div>
      ${this._evidenceItems.map(e => html`<div class="evidence-card">
        <div class="evidence-icon" style="background:${typeColors[e.type]}20;color:${typeColors[e.type]}">${typeIcons[e.type]}</div>
        <div class="evidence-info">
          <div class="evidence-title">${e.title}</div>
          <div class="evidence-meta">Control: ${e.controlId} | ${e.uploadedBy} | ${e.uploadedAt} | ${e.size}</div>
        </div>
        <span class="badge ${e.status === 'approved' ? 'b-implemented' : e.status === 'pending-review' ? 'b-remediating' : 'b-not-implemented'}">${e.status.replace('-', ' ')}</span>
      </div>`)}
    `;
  }

  private _renderMapping() {
    const frameworks = ['GDPR', 'HIPAA', 'PCI DSS', 'NIST CSF'];
    const fwColors: Record<string, string> = { 'GDPR': '#3b82f6', 'HIPAA': '#22c55e', 'PCI DSS': '#ef4444', 'NIST CSF': '#a855f7' };
    return html`
      <div class="stitle" style="margin-bottom:12px">Cross-Framework Policy Mapping</div>
      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        ${frameworks.map(fw => html`<span class="badge" style="background:${fwColors[fw]}20;color:${fwColors[fw]}">${fw}: ${this._policyMappings.filter(m => m.regulation === fw).length} controls</span>`)}
      </div>
      <div style="background:#1f2937;border-radius:8px;padding:14px">
        <div class="heatmap-grid" style="margin-bottom:8px">
          <div style="font-weight:600;color:#94a3b8">Regulation</div>
          <div style="text-align:center;font-weight:600;color:#94a3b8">SOC 2</div>
          <div style="text-align:center;font-weight:600;color:#94a3b8">ISO 27001</div>
          <div style="text-align:center;font-weight:600;color:#94a3b8">PCI DSS</div>
          <div style="text-align:center;font-weight:600;color:#94a3b8">HIPAA</div>
          <div style="text-align:center;font-weight:600;color:#94a3b8">NIST</div>
          ${this._policyMappings.map(m => {
            const soc = m.mappedTo.some(t => t.startsWith('SOC')) ? 'mapped' : m.status === 'partial' ? 'partial' : 'gap';
            const iso = m.mappedTo.some(t => t.startsWith('ISO')) ? 'mapped' : m.status === 'partial' ? 'partial' : 'gap';
            const pci = m.mappedTo.some(t => t.startsWith('PCI')) ? 'mapped' : 'gap';
            const hip = m.mappedTo.some(t => t.startsWith('HIPAA')) ? 'mapped' : 'gap';
            const nist = m.mappedTo.some(t => t.startsWith('NIST')) ? 'mapped' : 'gap';
            const cellColor = (s: string) => s === 'mapped' ? '#052e16' : s === 'partial' ? '#422006' : '#450a0a';
            const textColor = (s: string) => s === 'mapped' ? '#86efac' : s === 'partial' ? '#fde047' : '#fca5a5';
            return html`<div class="mapping-reg" style="color:${fwColors[m.regulation]}">${m.regulation}</div>
              <div class="heatmap-cell" style="background:${cellColor(soc)};color:${textColor(soc)}">${soc === 'mapped' ? '\u2713' : soc === 'partial' ? '~' : '\u2717'}</div>
              <div class="heatmap-cell" style="background:${cellColor(iso)};color:${textColor(iso)}">${iso === 'mapped' ? '\u2713' : iso === 'partial' ? '~' : '\u2717'}</div>
              <div class="heatmap-cell" style="background:${cellColor(pci)};color:${textColor(pci)}">${pci === 'mapped' ? '\u2713' : pci === 'partial' ? '~' : '\u2717'}</div>
              <div class="heatmap-cell" style="background:${cellColor(hip)};color:${textColor(hip)}">${hip === 'mapped' ? '\u2713' : hip === 'partial' ? '~' : '\u2717'}</div>
              <div class="heatmap-cell" style="background:${cellColor(nist)};color:${textColor(nist)}">${nist === 'mapped' ? '\u2713' : nist === 'partial' ? '~' : '\u2717'}</div>`;
          })}
        </div>
        <div style="display:flex;gap:12px;font-size:9px;color:#6b7280;margin-top:8px">
          <span style="color:#86efac">\u2713 Mapped</span><span style="color:#fde047">~ Partial</span><span style="color:#fca5a5">\u2717 Gap</span>
        </div>
      </div>
      <div class="compliance-card" style="margin-top:12px">
        <div style="font-weight:600;margin-bottom:8px">Detailed Mappings</div>
        ${this._policyMappings.map(m => html`<div class="mapping-row">
          <span class="mapping-reg" style="color:${fwColors[m.regulation]}">${m.regulation}</span>
          <span class="mapping-ctrl">${m.controlRef}</span>
          <span style="flex:1;color:#e2e8f0;font-size:10px">${m.title}</span>
          <span class="mapping-arrow">\u2192</span>
          <span class="mapping-target">${m.mappedTo.join(', ')}</span>
          <span class="badge ${m.status === 'mapped' ? 'b-implemented' : m.status === 'partial' ? 'b-partial' : 'b-not-implemented'}">${m.status}</span>
        </div>`)}
      </div>
    `;
  }

  private _renderExportButton() {
    return html`<div style="display:flex;gap:6px;margin-bottom:12px">
      <button class="btn btn-secondary" @click=${() => { const data = { controls: this._controls, findings: this._findings, tasks: this._remediationTasks, evidence: this._evidenceItems }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'compliance-export.json'; a.click(); URL.revokeObjectURL(url); }}>Export JSON</button>
      <button class="btn btn-secondary" @click=${() => { const headers = ['ID','Name','Framework','Category','Status','Evidence','Owner']; const rows = this._controls.map(c => [c.id,c.name,c.framework,c.category,c.status,c.evidence,c.owner]); const csv = [headers.join(','),...rows.map(r=>r.map(v=>'"'+v+'"').join(','))].join('\n'); const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='compliance-controls.csv'; a.click(); URL.revokeObjectURL(url); }}>Export CSV</button>
    </div>`;
  }


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
    .status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 4px; }
  `;

  private _kpiCards = [
    { title: 'Primary KPI', value: '92%', change: '+5%', positive: true, color: '#22c55e' },
    { title: 'Secondary KPI', value: '78%', change: '+3%', positive: true, color: '#3b82f6' },
    { title: 'Risk Indicator', value: '12', change: '-2', positive: true, color: '#f97316' },
    { title: 'Compliance Score', value: '95%', change: '+1%', positive: true, color: '#06b6d4' },
  ];

  private _recommendations = [
    { priority: '#ef4444', text: 'Address 3 critical findings identified in latest assessment', meta: 'Due: 2026-04-30 | Owner: Security Team' },
    { priority: '#f97316', text: 'Complete semi-annual review for all Compliance Audit Tracker items', meta: 'Due: 2026-05-15 | Owner: Compliance' },
    { priority: '#eab308', text: 'Update policies to reflect recent regulatory changes', meta: 'Due: 2026-06-01 | Owner: Legal' },
    { priority: '#22c55e', text: 'Schedule next quarterly review with stakeholders', meta: 'Due: 2026-06-15 | Owner: PMO' },
  ];
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


  render() {
    return html`
      <div class="panel">
        <div class="pt">✅ Compliance Audit Tracker</div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
          <div style="background:#1f2937;border-radius:8px;padding:14px">
            <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Key Metrics Summary</div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Open Findings</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#f97316">18</div>              <div style="flex:1;font-size:10px;color:#6b7280">4 critical, 14 major</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Remediated (Q1)</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#22c55e">32</div>              <div style="flex:1;font-size:10px;color:#6b7280">85% closure rate</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Audit Score</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#22c55e">94%</div>              <div style="flex:1;font-size:10px;color:#6b7280">Above 90% target</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Frameworks Active</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#3b82f6">5</div>              <div style="flex:1;font-size:10px;color:#6b7280">SOC2, ISO, GDPR, PCI, HIPAA</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Evidence Items</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#06b6d4">245</div>              <div style="flex:1;font-size:10px;color:#6b7280">98% collection rate</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Next Audit</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#eab308">45d</div>              <div style="flex:1;font-size:10px;color:#6b7280">SOC2 Type II</div>            </div>
          </div>
          <div style="background:#1f2937;border-radius:8px;padding:14px">
            <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Security Insights</div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">SOC2 Type II audit scheduled for Q3 2026 with no open critical findings.</span>            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">ISO 27001 surveillance audit completed with 2 minor non-conformities.</span>            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">GDPR data mapping exercise 78% complete across all business units.</span>            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">PCI DSS v4.0 migration assessment on track for December deadline.</span>            </div>
          </div>
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
          <span class="tab ${this._tab === 'overview' ? 'active' : ''}" @click=${() => { this._tab = 'overview'; this._searchQuery = ''; }}>Overview</span>
          <span class="tab ${this._tab === 'soc2' ? 'active' : ''}" @click=${() => { this._tab = 'soc2'; this._searchQuery = ''; }}>SOC 2</span>
          <span class="tab ${this._tab === 'iso' ? 'active' : ''}" @click=${() => { this._tab = 'iso'; this._searchQuery = ''; }}>ISO 27001</span>
          <span class="tab ${this._tab === 'pci' ? 'active' : ''}" @click=${() => { this._tab = 'pci'; this._searchQuery = ''; }}>PCI DSS</span>
          <span class="tab ${this._tab === 'remediation' ? 'active' : ''}" @click=${() => { this._tab = 'remediation'; this._searchQuery = ''; }}>Remediation</span>
          <span class="tab ${this._tab === 'evidence' ? 'active' : ''}" @click=${() => { this._tab = 'evidence'; this._searchQuery = ''; }}>Evidence</span>
          <span class="tab ${this._tab === 'mapping' ? 'active' : ''}" @click=${() => { this._tab = 'mapping'; this._searchQuery = ''; }}>Mapping</span>
          <span class="tab ${this._tab === 'calendar' ? 'active' : ''}" @click=${() => { this._tab = 'calendar'; this._searchQuery = ''; }}>Calendar</span>
        </div>
        ${this._tab === 'overview' ? this._renderOverview() : ''}
        ${this._tab === 'soc2' ? html`${this._renderExportButton()}${this._renderFrameworkControls('SOC 2')}` : ''}
        ${this._tab === 'iso' ? html`${this._renderExportButton()}${this._renderFrameworkControls('ISO 27001')}` : ''}
        ${this._tab === 'pci' ? html`${this._renderExportButton()}${this._renderFrameworkControls('PCI DSS')}` : ''}
        ${this._tab === 'remediation' ? this._renderRemediation() : ''}
        ${this._tab === 'evidence' ? this._renderEvidence() : ''}
        ${this._tab === 'mapping' ? this._renderMapping() : ''}
        ${this._tab === 'calendar' ? this._renderCalendar() : ''}
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
declare global { interface HTMLElementTagNameMap { 'sc-compliance-audit-tracker': ScComplianceAuditTracker; } }

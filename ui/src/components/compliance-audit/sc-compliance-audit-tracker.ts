/**
 * sc-compliance-audit-tracker - Compliance Audit Tracker Dashboard
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-compliance-audit-tracker')
export class ScComplianceAuditTracker extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; --bg-primary: #0f172a; --bg-secondary: #1e293b; --bg-tertiary: #0a0e17; --text-primary: #f8fafc; --text-secondary: #94a3b8; --border: #334155; --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; --info: #3b82f6; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
    .title { font-size: 18px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
    .title-icon { width: 32px; height: 32px; background: linear-gradient(135deg, var(--success), var(--info)); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 12px; }
    .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
    .stat-card { background: var(--bg-secondary); border-radius: 8px; padding: 16px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: 700; }
    .stat-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; margin-top: 4px; }
    .framework-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .framework-card { background: var(--bg-secondary); border-radius: 8px; padding: 20px; position: relative; overflow: hidden; }
    .framework-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .framework-name { font-size: 16px; font-weight: 700; color: var(--text-primary); }
    .framework-status { font-size: 10px; padding: 3px 8px; border-radius: 4px; font-weight: 600; }
    .status-compliant { background: rgba(34,197,94,0.2); color: var(--success); }
    .status-non-compliant { background: rgba(239,68,68,0.2); color: var(--danger); }
    .status-in-progress { background: rgba(245,158,11,0.2); color: var(--warning); }
    .status-not-applicable { background: rgba(107,114,128,0.2); color: var(--text-secondary); }
    .progress-ring { width: 80px; height: 80px; margin: 0 auto 12px; position: relative; }
    .progress-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .progress-bg { fill: none; stroke: var(--bg-tertiary); stroke-width: 8; }
    .progress-fill { fill: none; stroke-width: 8; stroke-linecap: round; transition: stroke-dashoffset 1s; }
    .progress-value { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 18px; font-weight: 700; }
    .framework-controls { font-size: 12px; color: var(--text-secondary); }
    .framework-controls span { color: var(--text-primary); font-weight: 600; }
    .content-grid { display: grid; grid-template-columns: 1fr 350px; gap: 20px; }
    .card { background: var(--bg-secondary); border-radius: 8px; padding: 20px; margin-bottom: 16px; }
    .card-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 16px; }
    .audit-table { width: 100%; border-collapse: collapse; }
    .audit-table th { background: var(--bg-tertiary); padding: 10px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); }
    .audit-table td { padding: 10px; border-bottom: 1px solid var(--border); font-size: 12px; }
    .audit-table tr:hover td { background: var(--bg-tertiary); }
    .evidence-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
    .evidence-complete { background: rgba(34,197,94,0.2); color: var(--success); }
    .evidence-missing { background: rgba(239,68,68,0.2); color: var(--danger); }
    .evidence-pending { background: rgba(245,158,11,0.2); color: var(--warning); }
    .calendar-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .calendar-item { background: var(--bg-tertiary); border-radius: 6px; padding: 12px; text-align: center; }
    .calendar-date { font-size: 12px; font-weight: 600; color: var(--text-primary); }
    .calendar-event { font-size: 10px; color: var(--text-secondary); margin-top: 4px; }
    .calendar-item.audit { border-left: 3px solid var(--info); }
    .calendar-item.deadline { border-left: 3px solid var(--danger); }
    .calendar-item.completed { border-left: 3px solid var(--success); }
    .risk-item { display: flex; align-items: center; gap: 12px; padding: 10px; background: var(--bg-tertiary); border-radius: 6px; margin-bottom: 8px; }
    .risk-indicator { width: 4px; height: 36px; border-radius: 2px; }
    .risk-content { flex: 1; }
    .risk-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .risk-meta { font-size: 11px; color: var(--text-secondary); }
    .btn { padding: 8px 16px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-secondary); color: var(--text-primary); font-size: 13px; font-weight: 500; cursor: pointer; }
    .btn-primary { background: var(--info); border-color: var(--info); color: white; }
  `;

  private frameworks = [
    { name: 'SOC 2', status: 'compliant', score: 94, controls: 87, total: 91 },
    { name: 'ISO 27001', status: 'in-progress', score: 78, controls: 65, total: 84 },
    { name: 'GDPR', status: 'compliant', score: 96, controls: 45, total: 48 },
    { name: 'PCI-DSS', status: 'non-compliant', score: 62, controls: 38, total: 61 },
    { name: 'HIPAA', status: 'compliant', score: 89, controls: 34, total: 38 },
    { name: 'NIST CSF', status: 'in-progress', score: 72, controls: 52, total: 72 },
    { name: 'FedRAMP', status: 'not-applicable', score: 0, controls: 0, total: 85 },
    { name: 'COBIT', status: 'in-progress', score: 81, controls: 28, total: 34 },
  ];

  private upcomingAudits = [
    { framework: 'SOC 2', date: '2024-05-15', auditor: 'Ernst & Young', status: 'Scheduled' },
    { framework: 'ISO 27001', date: '2024-06-01', auditor: 'Bureau Veritas', status: 'Planning' },
    { framework: 'PCI-DSS', date: '2024-04-20', auditor: 'Coalfire', status: 'Remediation' },
  ];

  private controlEvidence = [
    { control: 'Access Control Policy', framework: 'SOC 2', status: 'complete', evidence: 12 },
    { control: 'Encryption at Rest', framework: 'PCI-DSS', status: 'missing', evidence: 0 },
    { control: 'Incident Response Plan', framework: 'ISO 27001', status: 'pending', evidence: 8 },
    { control: 'Data Retention Policy', framework: 'GDPR', status: 'complete', evidence: 15 },
    { control: 'Vulnerability Management', framework: 'NIST CSF', status: 'pending', evidence: 6 },
  ];

  private calendarEvents = [
    { date: 'Apr 15', type: 'audit', event: 'SOC 2 Audit Start' },
    { date: 'Apr 20', type: 'deadline', event: 'PCI-DSS QSA Review' },
    { date: 'Apr 25', type: 'audit', event: 'ISO Review Meeting' },
    { date: 'May 01', type: 'deadline', event: 'GDPR Assessment Due' },
    { date: 'May 10', type: 'completed', event: 'NIST Gap Analysis' },
    { date: 'May 15', type: 'audit', event: 'SOC 2 Final Review' },
    { date: 'Jun 01', type: 'deadline', event: 'ISO Certification' },
    { date: 'Jun 15', type: 'audit', event: 'PCI-DSS Audit' },
  ];

  private riskFindings = [
    { title: 'Multi-factor auth not enforced for all users', framework: 'SOC 2', risk: 'high', due: 'Apr 30' },
    { title: 'Backup procedures not documented', framework: 'ISO 27001', risk: 'medium', due: 'May 15' },
    { title: 'Vendor assessment incomplete', framework: 'GDPR', risk: 'high', due: 'Apr 25' },
    { title: 'Encryption key management gaps', framework: 'PCI-DSS', risk: 'critical', due: 'Apr 20' },
  ];

  private getStatusClass(status: string): string {
    const map: Record<string, string> = { 'compliant': 'status-compliant', 'non-compliant': 'status-non-compliant', 'in-progress': 'status-in-progress', 'not-applicable': 'status-not-applicable' };
    return map[status] || '';
  }

  private getRiskColor(risk: string): string {
    return risk === 'critical' ? 'var(--danger)' : risk === 'high' ? 'var(--warning)' : 'var(--info)';
  }

  render() {
    const circumference = 2 * Math.PI * 32;

    return html`
      <div class="panel" role="region" aria-label="Compliance Audit Tracker">
        <div class="header">
          <h2 class="title"><span class="title-icon">CA</span> Compliance Audit Tracker</h2>
          <div style="display: flex; gap: 8px;">
            <button class="btn">Generate Report</button>
            <button class="btn btn-primary">Schedule Audit</button>
          </div>
        </div>

        <div class="stats-grid" role="status">
          <div class="stat-card"><div class="stat-value" style="color: var(--success)">3</div><div class="stat-label">Compliant</div></div>
          <div class="stat-card"><div class="stat-value" style="color: var(--warning)">3</div><div class="stat-label">In Progress</div></div>
          <div class="stat-card"><div class="stat-value" style="color: var(--danger)">1</div><div class="stat-label">Non-Compliant</div></div>
          <div class="stat-card"><div class="stat-value">421</div><div class="stat-label">Controls Total</div></div>
          <div class="stat-card"><div class="stat-value">89%</div><div class="stat-label">Overall Score</div></div>
        </div>

        <div class="framework-grid">
          ${this.frameworks.map(f => {
            const offset = circumference - (f.score / 100) * circumference;
            const color = f.status === 'compliant' ? 'var(--success)' : f.status === 'non-compliant' ? 'var(--danger)' : 'var(--warning)';
            return html`
              <div class="framework-card">
                <div class="framework-header">
                  <span class="framework-name">${f.name}</span>
                  <span class="framework-status ${this.getStatusClass(f.status)}">${f.status.replace('-', ' ')}</span>
                </div>
                <div class="progress-ring">
                  <svg viewBox="0 0 80 80">
                    <circle class="progress-bg" cx="40" cy="40" r="32" />
                    <circle class="progress-fill" cx="40" cy="40" r="32" stroke="${color}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" />
                  </svg>
                  <div class="progress-value" style="color: ${color}">${f.score}%</div>
                </div>
                <div class="framework-controls"><span>${f.controls}</span> / ${f.total} controls</div>
              </div>
            `;
          })}
        </div>

        <div class="content-grid">
          <div>
            <div class="card">
              <div class="card-title">Control Evidence Status</div>
              <table class="audit-table">
                <thead><tr><th>Control</th><th>Framework</th><th>Status</th><th>Evidence</th></tr></thead>
                <tbody>
                  ${this.controlEvidence.map(c => html`
                    <tr>
                      <td>${c.control}</td>
                      <td>${c.framework}</td>
                      <td><span class="evidence-badge evidence-${c.status}">${c.status}</span></td>
                      <td>${c.evidence} files</td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>

            <div class="card">
              <div class="card-title">Upcoming Audits</div>
              <table class="audit-table">
                <thead><tr><th>Framework</th><th>Date</th><th>Auditor</th><th>Status</th></tr></thead>
                <tbody>
                  ${this.upcomingAudits.map(a => html`
                    <tr>
                      <td><strong>${a.framework}</strong></td>
                      <td>${a.date}</td>
                      <td>${a.auditor}</td>
                      <td><span class="framework-status status-in-progress">${a.status}</span></td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div class="card">
              <div class="card-title">Audit Calendar</div>
              <div class="calendar-grid">
                ${this.calendarEvents.map(e => html`
                  <div class="calendar-item ${e.type}">
                    <div class="calendar-date">${e.date}</div>
                    <div class="calendar-event">${e.event}</div>
                  </div>
                `)}
              </div>
            </div>

            <div class="card">
              <div class="card-title">Compliance Risks</div>
              ${this.riskFindings.map(r => html`
                <div class="risk-item">
                  <div class="risk-indicator" style="background: ${this.getRiskColor(r.risk)}"></div>
                  <div class="risk-content">
                    <div class="risk-title">${r.title}</div>
                    <div class="risk-meta">${r.framework} - Due ${r.due}</div>
                  </div>
                </div>
              `)}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-compliance-audit-tracker': ScComplianceAuditTracker; } }

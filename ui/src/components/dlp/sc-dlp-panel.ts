/**
 * sc-dlp-panel - Data Loss Prevention Dashboard
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-dlp-panel')
export class ScDlpPanel extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; --bg-primary: #0f172a; --bg-secondary: #1e293b; --bg-tertiary: #0a0e17; --text-primary: #f8fafc; --text-secondary: #94a3b8; --border: #334155; --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; --info: #3b82f6; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
    .title { font-size: 18px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
    .title-icon { width: 32px; height: 32px; background: linear-gradient(135deg, var(--danger), var(--warning)); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 12px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: var(--bg-secondary); border-radius: 8px; padding: 20px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: 700; }
    .stat-label { font-size: 12px; color: var(--text-secondary); text-transform: uppercase; margin-top: 4px; }
    .content-grid { display: grid; grid-template-columns: 1fr 350px; gap: 20px; }
    .card { background: var(--bg-secondary); border-radius: 8px; padding: 20px; margin-bottom: 16px; }
    .card-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 16px; }
    .incident-list { max-height: 350px; overflow-y: auto; }
    .incident-item { display: flex; gap: 12px; padding: 12px; background: var(--bg-tertiary); border-radius: 6px; margin-bottom: 8px; border-left: 3px solid; }
    .incident-item.critical { border-color: var(--danger); }
    .incident-item.high { border-color: var(--warning); }
    .incident-item.medium { border-color: var(--info); }
    .incident-icon { width: 36px; height: 36px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .incident-content { flex: 1; }
    .incident-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .incident-meta { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
    .incident-user { font-size: 11px; color: var(--text-secondary); margin-top: 4px; }
    .incident-action { font-size: 10px; padding: 3px 8px; border-radius: 4px; font-weight: 600; white-space: nowrap; }
    .action-blocked { background: rgba(239,68,68,0.2); color: var(--danger); }
    .action-warned { background: rgba(245,158,11,0.2); color: var(--warning); }
    .action-quarantined { background: rgba(59,130,246,0.2); color: var(--info); }
    .chart-area { height: 150px; display: flex; align-items: flex-end; gap: 4px; padding-top: 20px; }
    .chart-bar { flex: 1; border-radius: 4px 4px 0 0; transition: height 0.3s; }
    .policy-list { max-height: 250px; overflow-y: auto; }
    .policy-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); }
    .policy-item:last-child { border-bottom: none; }
    .policy-name { font-size: 13px; color: var(--text-primary); }
    .policy-status { font-size: 11px; padding: 3px 8px; border-radius: 4px; font-weight: 600; }
    .policy-active { background: rgba(34,197,94,0.2); color: var(--success); }
    .policy-inactive { background: rgba(107,114,128,0.2); color: var(--text-secondary); }
    .data-type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 12px; }
    .data-type-card { background: var(--bg-tertiary); border-radius: 6px; padding: 12px; text-align: center; }
    .data-type-icon { font-size: 24px; margin-bottom: 4px; }
    .data-type-count { font-size: 20px; font-weight: 700; }
    .data-type-label { font-size: 10px; color: var(--text-secondary); text-transform: uppercase; }
    .btn { padding: 8px 16px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-secondary); color: var(--text-primary); font-size: 13px; font-weight: 500; cursor: pointer; }
    .btn-primary { background: var(--info); border-color: var(--info); color: white; }
  `;

  private stats = [
    { label: 'Total Incidents', value: '342', color: 'var(--warning)' },
    { label: 'Blocked', value: '89', color: 'var(--danger)' },
    { label: 'Quarantined', value: '156', color: 'var(--info)' },
    { label: 'Policy Violations', value: '97', color: 'var(--warning)' },
  ];

  private incidents = [
    { title: 'PII Data Uploaded to Personal Cloud', type: 'email', user: 'john.doe@company.com', channel: 'Web Upload', action: 'blocked', severity: 'critical', time: '2 min ago' },
    { title: 'Credit Card Number in Slack', type: 'slack', user: 'sarah.chen@company.com', channel: 'Slack', action: 'warned', severity: 'high', time: '15 min ago' },
    { title: 'SSN Data Exported to USB', type: 'usb', user: 'mike.johnson@company.com', channel: 'USB', action: 'quarantined', severity: 'critical', time: '32 min ago' },
    { title: 'Confidential Document Printed', type: 'print', user: 'emily.davis@company.com', channel: 'Printer', action: 'warned', severity: 'medium', time: '1 hour ago' },
    { title: 'Source Code Sent via Email', type: 'email', user: 'alex.turner@company.com', channel: 'Outlook', action: 'blocked', severity: 'high', time: '2 hours ago' },
  ];

  private chartData = [12, 18, 15, 22, 28, 25, 32, 28, 35, 42, 38, 45, 40, 35, 42, 48, 52, 45, 38, 42, 35, 28, 22, 18];

  private policies = [
    { name: 'PII Protection', status: 'active', incidents: 89 },
    { name: 'PCI-DSS Compliance', status: 'active', incidents: 34 },
    { name: 'HIPAA Data Rule', status: 'active', incidents: 23 },
    { name: 'Source Code Protection', status: 'active', incidents: 67 },
    { name: 'Financial Data Rule', status: 'inactive', incidents: 12 },
  ];

  private dataTypes = [
    { icon: '#', count: '1,247', label: 'PII Matches', color: 'var(--danger)' },
    { icon: '$', count: '456', label: 'PCI Data', color: 'var(--warning)' },
    { icon: 'M', count: '892', label: 'Medical Records', color: 'var(--info)' },
    { icon: 'C', count: '2,341', label: 'Credentials', color: 'var(--danger)' },
    { icon: 'K', count: '567', label: 'Encryption Keys', color: 'var(--warning)' },
    { icon: 'S', count: '1,893', label: 'Source Code', color: 'var(--info)' },
  ];

  render() {
    const max = Math.max(...this.chartData);

    return html`
      <div class="panel" role="region" aria-label="Data Loss Prevention Dashboard">
        <div class="header">
          <h2 class="title"><span class="title-icon">DL</span> Data Loss Prevention</h2>
          <div style="display: flex; gap: 8px;">
            <button class="btn">Configure</button>
            <button class="btn btn-primary">View Reports</button>
          </div>
        </div>

        <div class="stats-grid" role="status">
          ${this.stats.map(s => html`
            <div class="stat-card">
              <div class="stat-value" style="color: ${s.color}">${s.value}</div>
              <div class="stat-label">${s.label}</div>
            </div>
          `)}
        </div>

        <div class="content-grid">
          <div>
            <div class="card">
              <div class="card-title">DLP Incidents (24h)</div>
              <div class="chart-area">
                ${this.chartData.map((val, i) => html`
                  <div class="chart-bar" style="height: ${(val / max) * 100}%; background: ${val > 40 ? 'var(--danger)' : val > 30 ? 'var(--warning)' : 'var(--info)'}"></div>
                `)}
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 10px; color: var(--text-secondary);">
                <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
              </div>
            </div>

            <div class="card">
              <div class="card-title">Recent Incidents</div>
              <div class="incident-list">
                ${this.incidents.map(inc => html`
                  <div class="incident-item ${inc.severity}">
                    <div class="incident-icon" style="background: ${inc.severity === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}">
                      ${inc.type === 'email' ? 'E' : inc.type === 'usb' ? 'U' : inc.type === 'slack' ? 'S' : 'P'}
                    </div>
                    <div class="incident-content">
                      <div class="incident-title">${inc.title}</div>
                      <div class="incident-meta">${inc.channel} - ${inc.time}</div>
                      <div class="incident-user">User: ${inc.user}</div>
                    </div>
                    <span class="incident-action action-${inc.action}">${inc.action}</span>
                  </div>
                `)}
              </div>
            </div>
          </div>

          <div>
            <div class="card">
              <div class="card-title">Data Types Detected</div>
              <div class="data-type-grid">
                ${this.dataTypes.map(d => html`
                  <div class="data-type-card">
                    <div class="data-type-icon" style="color: ${d.color}">${d.icon}</div>
                    <div class="data-type-count" style="color: ${d.color}">${d.count}</div>
                    <div class="data-type-label">${d.label}</div>
                  </div>
                `)}
              </div>
            </div>

            <div class="card">
              <div class="card-title">Active Policies</div>
              <div class="policy-list">
                ${this.policies.map(p => html`
                  <div class="policy-item">
                    <span class="policy-name">${p.name}</span>
                    <div style="text-align: right;">
                      <span class="policy-status policy-${p.status}">${p.status}</span>
                      <div style="font-size: 10px; color: var(--text-secondary); margin-top: 2px;">${p.incidents} incidents</div>
                    </div>
                  </div>
                `)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-dlp-panel': ScDlpPanel; } }

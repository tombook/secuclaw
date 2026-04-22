/**
 * sc-iam-analytics - IAM Analytics Dashboard
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-iam-analytics')
export class ScIamAnalytics extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; --bg-primary: #0f172a; --bg-secondary: #1e293b; --bg-tertiary: #0a0e17; --text-primary: #f8fafc; --text-secondary: #94a3b8; --border: #334155; --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; --info: #3b82f6; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
    .title { font-size: 18px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
    .title-icon { width: 32px; height: 32px; background: linear-gradient(135deg, var(--info), #8b5cf6); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 12px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: var(--bg-secondary); border-radius: 8px; padding: 20px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: 700; }
    .stat-label { font-size: 12px; color: var(--text-secondary); text-transform: uppercase; margin-top: 4px; }
    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .card { background: var(--bg-secondary); border-radius: 8px; padding: 20px; margin-bottom: 16px; }
    .card-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 16px; }
    .user-list { max-height: 300px; overflow-y: auto; }
    .user-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-tertiary); border-radius: 6px; margin-bottom: 8px; }
    .user-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; }
    .user-info { flex: 1; }
    .user-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .user-dept { font-size: 11px; color: var(--text-secondary); }
    .user-risk { font-size: 10px; padding: 3px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
    .risk-critical { background: rgba(239,68,68,0.2); color: var(--danger); }
    .risk-high { background: rgba(245,158,11,0.2); color: var(--warning); }
    .risk-medium { background: rgba(59,130,246,0.2); color: var(--info); }
    .risk-low { background: rgba(34,197,94,0.2); color: var(--success); }
    .privilege-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); }
    .privilege-item:last-child { border-bottom: none; }
    .privilege-name { font-size: 13px; color: var(--text-primary); }
    .privilege-count { font-size: 12px; color: var(--text-secondary); }
    .privilege-bar { width: 100%; height: 6px; background: var(--bg-tertiary); border-radius: 3px; margin-top: 8px; overflow: hidden; }
    .privilege-fill { height: 100%; border-radius: 3px; }
    .access-matrix { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 12px; }
    .access-cell { text-align: center; padding: 8px; background: var(--bg-tertiary); border-radius: 4px; font-size: 11px; }
    .access-cell.granted { background: rgba(34,197,94,0.2); color: var(--success); }
    .access-cell.denied { background: rgba(239,68,68,0.2); color: var(--danger); }
    .access-cell.pending { background: rgba(245,158,11,0.2); color: var(--warning); }
    .login-chart { height: 120px; display: flex; align-items: flex-end; gap: 4px; padding-top: 20px; }
    .login-bar { flex: 1; border-radius: 4px 4px 0 0; transition: height 0.3s; }
    .btn { padding: 8px 16px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-secondary); color: var(--text-primary); font-size: 13px; font-weight: 500; cursor: pointer; }
    .btn-primary { background: var(--info); border-color: var(--info); color: white; }
  `;

  @state() private activeTab = 'overview';

  private stats = [
    { label: 'Total Users', value: '4,521', color: 'var(--info)' },
    { label: 'Privileged Accounts', value: '127', color: 'var(--warning)' },
    { label: 'MFA Coverage', value: '94%', color: 'var(--success)' },
    { label: 'High Risk Users', value: '23', color: 'var(--danger)' },
  ];

  private highRiskUsers = [
    { name: 'John Smith', dept: 'Engineering', risk: 'critical', initials: 'JS', color: '#ef4444' },
    { name: 'Sarah Chen', dept: 'Finance', risk: 'high', initials: 'SC', color: '#f59e0b' },
    { name: 'Mike Johnson', dept: 'Sales', risk: 'high', initials: 'MJ', color: '#f59e0b' },
    { name: 'Emily Davis', dept: 'HR', risk: 'medium', initials: 'ED', color: '#3b82f6' },
    { name: 'Alex Turner', dept: 'IT', risk: 'low', initials: 'AT', color: '#22c55e' },
  ];

  private privilegeDistribution = [
    { name: 'Admin', users: 127, pct: 2.8 },
    { name: 'Power User', users: 342, pct: 7.6 },
    { name: 'Standard', users: 3892, pct: 86.1 },
    { name: 'Restricted', users: 160, pct: 3.5 },
  ];

  private resourceAccess = [
    { resource: 'Active Directory', access: 'granted' },
    { resource: 'Cloud Console', access: 'granted' },
    { resource: 'Database', access: 'denied' },
    { resource: 'Source Code', access: 'pending' },
    { resource: 'Production', access: 'denied' },
  ];

  private loginData = [45, 52, 48, 65, 72, 85, 92, 88, 75, 62, 58, 45];

  render() {
    const maxLogin = Math.max(...this.loginData);

    return html`
      <div class="panel" role="region" aria-label="IAM Analytics Dashboard">
        <div class="header">
          <h2 class="title"><span class="title-icon">IA</span> IAM Analytics</h2>
          <div style="display: flex; gap: 8px;">
            <button class="btn">Access Review</button>
            <button class="btn btn-primary">Run Assessment</button>
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
              <div class="card-title">High Risk Users</div>
              <div class="user-list">
                ${this.highRiskUsers.map(u => html`
                  <div class="user-item">
                    <div class="user-avatar" style="background: ${u.color}20; color: ${u.color}">${u.initials}</div>
                    <div class="user-info">
                      <div class="user-name">${u.name}</div>
                      <div class="user-dept">${u.dept}</div>
                    </div>
                    <span class="user-risk risk-${u.risk}">${u.risk}</span>
                  </div>
                `)}
              </div>
            </div>

            <div class="card">
              <div class="card-title">Login Activity (12h)</div>
              <div class="login-chart">
                ${this.loginData.map((val, i) => html`
                  <div class="login-bar" style="height: ${(val / maxLogin) * 100}%; background: var(--info)"></div>
                `)}
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 10px; color: var(--text-secondary);">
                <span>00:00</span><span>06:00</span><span>12:00</span>
              </div>
            </div>
          </div>

          <div>
            <div class="card">
              <div class="card-title">Privilege Distribution</div>
              ${this.privilegeDistribution.map(p => html`
                <div class="privilege-item">
                  <div>
                    <div class="privilege-name">${p.name}</div>
                    <div class="privilege-count">${p.users} users</div>
                    <div class="privilege-bar">
                      <div class="privilege-fill" style="width: ${p.pct}%; background: ${p.name === 'Admin' ? 'var(--danger)' : p.name === 'Power User' ? 'var(--warning)' : 'var(--success)'}"></div>
                    </div>
                  </div>
                  <span style="font-size: 14px; font-weight: 600;">${p.pct}%</span>
                </div>
              `)}
            </div>

            <div class="card">
              <div class="card-title">Sample Access Matrix</div>
              <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; font-size: 11px; color: var(--text-secondary); margin-bottom: 8px;">
                <span></span><span>AD</span><span>Cloud</span><span>DB</span><span>Code</span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px;">
                <span style="font-size: 11px; color: var(--text-primary);">Admin</span>
                ${this.resourceAccess.map(r => html`
                  <div class="access-cell ${r.access}">${r.access === 'granted' ? 'Y' : r.access === 'denied' ? 'N' : '-'}</div>
                `)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-iam-analytics': ScIamAnalytics; } }

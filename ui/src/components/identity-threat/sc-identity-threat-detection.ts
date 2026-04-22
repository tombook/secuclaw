/**
 * SecuClaw Identity Threat Detection Component
 * Anomalous login detection, privilege escalation, and identity posture
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-identity-threat-detection')
export class ScIdentityThreatDetection extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: var(--text-primary, #e2e8f0); }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary, #111827); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 16px; }
    .title { font-size: 16px; font-weight: 700; }
    .score-section { display: flex; align-items: center; gap: 20px; background: var(--bg-secondary, #1f2937); padding: 16px; border-radius: 12px; margin-bottom: 16px; }
    .identity-score { text-align: center; }
    .score-ring { width: 80px; height: 80px; border-radius: 50%; background: conic-gradient(var(--c, #22c55e) calc(var(--s, 0) * 1%), #1e293b 0); display: flex; align-items: center; justify-content: center; }
    .score-inner { width: 64px; height: 64px; border-radius: 50%; background: var(--bg-secondary, #1f2937); display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .score-val { font-size: 20px; font-weight: 700; }
    .score-lbl { font-size: 8px; color: #94a3b8; text-transform: uppercase; }
    .risk-factors { flex: 1; }
    .risk-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; }
    .risk-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #374151; }
    .risk-item:last-child { border-bottom: none; }
    .risk-name { font-size: 12px; }
    .risk-value { font-size: 12px; font-weight: 600; }
    .tabs { display: flex; gap: 4px; margin-bottom: 12px; }
    .tab { padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; background: var(--bg-secondary, #1f2937); border: 1px solid #374151; }
    .tab.active { background: #3b82f6; border-color: #3b82f6; color: white; }
    .alert-list { max-height: 300px; overflow-y: auto; }
    .alert-item { background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 12px; margin-bottom: 8px; border-left: 4px solid; }
    .alert-item.critical { border-color: #ef4444; }
    .alert-item.high { border-color: #f97316; }
    .alert-item.medium { border-color: #eab308; }
    .alert-item.low { border-color: #3b82f6; }
    .alert-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .alert-type { font-size: 13px; font-weight: 600; }
    .alert-time { font-size: 11px; color: #94a3b8; }
    .alert-user { font-size: 12px; color: #cbd5e1; margin-bottom: 4px; }
    .alert-details { font-size: 11px; color: #94a3b8; background: var(--bg-tertiary, #0a0e17); padding: 8px; border-radius: 4px; margin-top: 8px; }
    .user-table { width: 100%; border-collapse: collapse; }
    .user-table th { background: var(--bg-secondary, #1f2937); padding: 10px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #94a3b8; border-bottom: 1px solid #374151; }
    .user-table td { padding: 10px; border-bottom: 1px solid #374151; font-size: 12px; }
    .user-table tr:hover { background: var(--bg-secondary, #1f2937); }
    .risk-badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; }
    .risk-none { background: #052e16; color: #86efac; }
    .risk-low { background: #172554; color: #93c5fd; }
    .risk-medium { background: #422006; color: #fde047; }
    .risk-high { background: #431407; color: #fdba74; }
    .risk-critical { background: #450a0a; color: #fca5a5; }
    .btn { padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #374151; background: var(--bg-secondary, #1f2937); color: #e2e8f0; }
    .btn.primary { background: #059669; border-color: #059669; color: white; }
  `;

  @state() private activeTab = 'alerts';
  @state() private identityScore = 78;
  @state() private alerts: any[] = [
    { id: 1, type: 'Impossible Travel', severity: 'high', user: 'john.doe@company.com', time: '14:32', ip: '203.0.113.45', location: 'Singapore', details: 'Login detected from Singapore 2 hours after login from New York' },
    { id: 2, type: 'Privilege Escalation', severity: 'critical', user: 'admin.service@company.com', time: '13:45', ip: '10.0.1.50', location: 'Internal', details: 'User granted admin privileges outside business hours' },
    { id: 3, type: 'Credential Stuffing', severity: 'medium', user: 'multiple', time: '12:00', ip: '185.220.101.134', location: 'Unknown', details: 'Multiple failed login attempts from known malicious IP' },
    { id: 4, type: 'Unusual Access Pattern', severity: 'medium', user: 'sarah.chen@company.com', time: '11:30', ip: '198.51.100.23', location: 'Chicago', details: 'Access to sensitive HR system at unusual time' },
    { id: 5, type: 'MFA Bypass Attempt', severity: 'high', user: 'it.support@company.com', time: '10:15', ip: '192.0.2.78', location: 'Remote', details: 'Attempted to disable MFA for admin account' },
    { id: 6, type: 'Dormant Account Activity', severity: 'low', user: 'former.employee@company.com', time: '09:00', ip: '203.0.113.89', location: 'External', details: 'Login detected for account inactive for 90+ days' },
  ];

  @state() private users: any[] = [
    { name: 'John Doe', email: 'john.doe@company.com', department: 'Engineering', risk: 'medium', lastLogin: '14:32', mfaEnabled: true, privileged: false },
    { name: 'Sarah Chen', email: 'sarah.chen@company.com', department: 'HR', risk: 'low', lastLogin: '11:30', mfaEnabled: true, privileged: false },
    { name: 'Admin Service', email: 'admin.service@company.com', department: 'IT', risk: 'critical', lastLogin: '13:45', mfaEnabled: true, privileged: true },
    { name: 'Mike Johnson', email: 'mike.johnson@company.com', department: 'Sales', risk: 'high', lastLogin: '2d ago', mfaEnabled: false, privileged: false },
  ];

  private riskFactors = [
    { name: 'Users without MFA', value: 12, color: '#f97316' },
    { name: 'Privileged accounts', value: 34, color: '#eab308' },
    { name: 'Stale accounts (90d+)', value: 8, color: '#ef4444' },
    { name: 'Shared credentials', value: 5, color: '#ef4444' },
  ];

  private getScoreColor(): string {
    return this.identityScore >= 90 ? '#22c55e' : this.identityScore >= 70 ? '#eab308' : '#ef4444';
  }

  render() {
    return html`
      <div class="panel">
        <div class="header">
          <h2 class="title">🔐 Identity Threat Detection</h2>
          <button class="btn primary" @click=${() => {}}>🔍 Run Assessment</button>
        </div>

        <div class="score-section">
          <div class="identity-score">
            <div class="score-ring" style="--s: ${this.identityScore}; --c: ${this.getScoreColor()}">
              <div class="score-inner">
                <div class="score-val" style="color: ${this.getScoreColor()}">${this.identityScore}</div>
                <div class="score-lbl">Score</div>
              </div>
            </div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 6px;">Identity Posture</div>
          </div>
          <div class="risk-factors">
            <div class="risk-title">⚠️ Risk Factors</div>
            ${this.riskFactors.map(rf => html`
              <div class="risk-item">
                <span class="risk-name">${rf.name}</span>
                <span class="risk-value" style="color: ${rf.color}">${rf.value}</span>
              </div>
            `)}
          </div>
          <div style="text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: #ef4444;">${this.alerts.filter(a => a.severity === 'critical').length}</div>
            <div style="font-size: 10px; color: #94a3b8;">Critical Alerts</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 28px; font-weight: 700;">${this.alerts.length}</div>
            <div style="font-size: 10px; color: #94a3b8;">Total Alerts</div>
          </div>
        </div>

        <div class="tabs">
          <button class="tab ${this.activeTab === 'alerts' ? 'active' : ''}" @click=${() => this.activeTab = 'alerts'}>Alerts</button>
          <button class="tab ${this.activeTab === 'users' ? 'active' : ''}" @click=${() => this.activeTab = 'users'}>Users</button>
          <button class="tab ${this.activeTab === 'analytics' ? 'active' : ''}" @click=${() => this.activeTab = 'analytics'}>Analytics</button>
        </div>

        ${this.activeTab === 'alerts' ? this.renderAlerts() : ''}
        ${this.activeTab === 'users' ? this.renderUsers() : ''}
        ${this.activeTab === 'analytics' ? this.renderAnalytics() : ''}
      </div>
    `;
  }

  private renderAlerts() {
    return html`
      <div class="alert-list">
        ${this.alerts.map(alert => html`
          <div class="alert-item ${alert.severity}">
            <div class="alert-header">
              <span class="alert-type">${alert.type}</span>
              <span class="alert-time">${alert.time}</span>
            </div>
            <div class="alert-user">👤 ${alert.user} • 🌐 ${alert.location} (${alert.ip})</div>
            <div class="alert-details">${alert.details}</div>
          </div>
        `)}
      </div>
    `;
  }

  private renderUsers() {
    return html`
      <table class="user-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Department</th>
            <th>Risk Level</th>
            <th>Last Login</th>
            <th>MFA</th>
            <th>Privileged</th>
          </tr>
        </thead>
        <tbody>
          ${this.users.map(user => html`
            <tr>
              <td><div style="font-weight: 600;">${user.name}</div><div style="font-size: 10px; color: #94a3b8;">${user.email}</div></td>
              <td>${user.department}</td>
              <td><span class="risk-badge risk-${user.risk}">${user.risk}</span></td>
              <td>${user.lastLogin}</td>
              <td>${user.mfaEnabled ? '✅' : '❌'}</td>
              <td>${user.privileged ? '⚠️' : '—'}</td>
            </tr>
          `)}
        </tbody>
      </table>
    `;
  }

  private renderAnalytics() {
    return html`
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
        <div style="background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 14px;">
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 10px;">📊 Login Activity (7 days)</div>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.8;">
            <div>Total logins: <span style="color: #22c55e; font-weight: 600;">12,847</span></div>
            <div>Failed attempts: <span style="color: #ef4444; font-weight: 600;">234</span></div>
            <div>Blocked: <span style="color: #f97316; font-weight: 600;">45</span></div>
            <div>MFA success: <span style="color: #22c55e; font-weight: 600;">98.2%</span></div>
          </div>
        </div>
        <div style="background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 14px;">
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 10px;">🔑 Credential Health</div>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.8;">
            <div>Weak passwords: <span style="color: #ef4444; font-weight: 600;">23</span></div>
            <div>Expired (30d): <span style="color: #f97316; font-weight: 600;">156</span></div>
            <div>Reused passwords: <span style="color: #f97316; font-weight: 600;">89</span></div>
            <div>Service accounts: <span style="color: #eab308; font-weight: 600;">67</span></div>
          </div>
        </div>
        <div style="background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 14px;">
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 10px;">🛡️ Access Control</div>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.8;">
            <div>Over-privileged: <span style="color: #ef4444; font-weight: 600;">45</span></div>
            <div>Orphaned accounts: <span style="color: #f97316; font-weight: 600;">12</span></div>
            <div>Privilege creep: <span style="color: #f97316; font-weight: 600;">28</span></div>
            <div>Guest accounts: <span style="color: #eab308; font-weight: 600;">15</span></div>
          </div>
        </div>
        <div style="background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 14px;">
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 10px;">📈 Threat Trends</div>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.8;">
            <div>Brute force: <span style="color: #ef4444;">↑ 34%</span></div>
            <div>Impossible travel: <span style="color: #f97316;">↑ 12%</span></div>
            <div>MFA bypass: <span style="color: #ef4444;">↑ 89%</span></div>
            <div>Insider threats: <span style="color: #22c55e;">↓ 5%</span></div>
          </div>
        </div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-identity-threat-detection': ScIdentityThreatDetection; } }

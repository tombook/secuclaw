/** SOC Dashboard */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-soc-dashboard')
export class ScSocDashboard extends LitElement {
  static styles = css`
    :host { display: block; --primary: #00ff88; --secondary: #00aaff; --danger: #ff4444; --warning: #ffaa00; --success: #10b981; --purple: #a855f7; --bg-dark: #0a0e17; --bg-card: #141b26; --bg-card-hover: #1a2536; --text-primary: #ffffff; --text-secondary: #8899aa; --border: #2a3a4a; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .dashboard { background: var(--bg-dark); min-height: 100vh; color: var(--text-primary); padding: 24px; font-family: Inter, system-ui, sans-serif; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
    .title { font-size: 24px; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 12px; }
    .subtitle { font-size: 13px; color: var(--text-secondary); }
    .live-dot { width: 8px; height: 8px; background: var(--success); border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .header-actions { display: flex; gap: 12px; }
    .btn { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-primary); font-size: 13px; cursor: pointer; transition: all 0.2s; }
    .btn-primary { background: linear-gradient(135deg, var(--primary), #00cc6a); color: var(--bg-dark); border: none; }
    .stats-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: var(--bg-card); border-radius: 12px; padding: 16px; border: 1px solid var(--border); text-align: center; }
    .stat-icon { font-size: 24px; margin-bottom: 8px; }
    .stat-value { font-size: 28px; font-weight: 700; }
    .stat-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; margin-top: 4px; }
    .main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
    .card { background: var(--bg-card); border-radius: 12px; padding: 20px; border: 1px solid var(--border); margin-bottom: 20px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
    .card-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }
    .alert-list { max-height: 400px; overflow-y: auto; }
    .alert-item { display: flex; gap: 12px; padding: 14px; background: var(--bg-dark); border-radius: 8px; margin-bottom: 10px; border-left: 4px solid; }
    .alert-item.critical { border-left-color: var(--danger); }
    .alert-item.high { border-left-color: var(--warning); }
    .alert-item.medium { border-left-color: var(--secondary); }
    .alert-time { font-size: 11px; color: var(--text-secondary); min-width: 60px; }
    .alert-content { flex: 1; }
    .alert-title { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
    .alert-source { font-size: 11px; color: var(--text-secondary); }
    .severity-badge { padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; }
    .severity-critical { background: rgba(255,68,68,0.2); color: var(--danger); }
    .severity-high { background: rgba(255,170,0,0.2); color: var(--warning); }
    .severity-medium { background: rgba(0,170,255,0.2); color: var(--secondary); }
    .analyst-card { display: flex; align-items: center; gap: 12px; padding: 14px; background: var(--bg-dark); border-radius: 8px; margin-bottom: 10px; }
    .analyst-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: var(--bg-dark); }
    .analyst-info { flex: 1; }
    .analyst-name { font-size: 13px; font-weight: 600; }
    .analyst-status { font-size: 11px; color: var(--text-secondary); }
    .load-bar { width: 50px; height: 6px; background: var(--bg-card); border-radius: 3px; overflow: hidden; margin-top: 4px; }
    .load-fill { height: 100%; border-radius: 3px; }
    .quick-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .action-btn { padding: 14px; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); font-size: 12px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .action-btn:hover { border-color: var(--primary); }
    .action-icon { font-size: 24px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .metric-item { background: var(--bg-dark); border-radius: 8px; padding: 14px; }
    .metric-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .metric-name { font-size: 12px; color: var(--text-secondary); }
    .metric-bar { height: 4px; background: var(--bg-card); border-radius: 2px; overflow: hidden; }
    .metric-fill { height: 100%; border-radius: 2px; }
    @media (max-width: 1200px) { .main-grid { grid-template-columns: 1fr; } }
  `;

  @state() private currentTime = new Date();

  private stats = [
    { icon: '🚨', value: '23', label: 'Active Alerts', color: 'var(--warning)' },
    { icon: '⏳', value: '12', label: 'In Queue', color: 'var(--secondary)' },
    { icon: '🔍', value: '8', label: 'Investigating', color: 'var(--primary)' },
    { icon: '✓', value: '156', label: 'Resolved', color: 'var(--success)' },
    { icon: '⚡', value: '18m', label: 'Avg Response', color: 'var(--purple)' },
    { icon: '👥', value: '6', label: 'Analysts', color: 'var(--primary)' },
  ];

  private alerts = [
    { title: 'Suspicious Login', source: 'Auth Service', severity: 'critical', time: '2m ago' },
    { title: 'Malware Detected', source: 'Endpoint', severity: 'critical', time: '5m ago' },
    { title: 'Brute Force', source: 'Firewall', severity: 'high', time: '12m ago' },
    { title: 'Data Exfil', source: 'DLP', severity: 'high', time: '18m ago' },
    { title: 'Unusual Traffic', source: 'IDS', severity: 'medium', time: '25m ago' },
  ];

  private analysts = [
    { name: 'Alex Chen', initials: 'AC', status: 'Investigating', load: 75 },
    { name: 'Sarah Kim', initials: 'SK', status: 'Available', load: 45 },
    { name: 'Marcus Johnson', initials: 'MJ', status: 'On Break', load: 60 },
    { name: 'Emily Davis', initials: 'ED', status: 'Investigating', load: 90 },
  ];

  private metrics = [
    { name: 'SLA Compliance', value: '94%', fill: 94, color: 'var(--success)' },
    { name: 'Alert Accuracy', value: '87%', fill: 87, color: 'var(--primary)' },
    { name: 'Automation Rate', value: '72%', fill: 72, color: 'var(--secondary)' },
    { name: 'Efficiency', value: '88%', fill: 88, color: 'var(--primary)' },
  ];

  connectedCallback() {
    super.connectedCallback();
    setInterval(() => { this.currentTime = new Date(); }, 1000);
  }

  private getLoadColor(load: number): string {
    if (load >= 80) return 'var(--danger)';
    if (load >= 60) return 'var(--warning)';
    return 'var(--success)';
  }

  render() {
    return html`
      <div class="dashboard" role="main" aria-label="SOC Operations Dashboard">
        <header class="header">
          <div>
            <h1 class="title"><span>🛡️</span> SOC Operations Center</h1>
            <div class="subtitle"><span class="live-dot"></span> Live | ${this.currentTime.toLocaleString()}</div>
          </div>
          <div class="header-actions">
            <button class="btn">📊 Statistics</button>
            <button class="btn btn-primary">+ Create Alert</button>
          </div>
        </header>

        <div class="stats-row" role="status">
          ${this.stats.map(s => html`
            <div class="stat-card">
              <div class="stat-icon">${s.icon}</div>
              <div class="stat-value" style="color: ${s.color}">${s.value}</div>
              <div class="stat-label">${s.label}</div>
            </div>
          `)}
        </div>

        <div class="main-grid">
          <div>
            <section class="card" aria-label="Active Alerts">
              <div class="card-header"><h2 class="card-title">Active Alerts</h2></div>
              <div class="alert-list" role="list">
                ${this.alerts.map(a => html`
                  <div class="alert-item ${a.severity}" role="listitem">
                    <div class="alert-time">${a.time}</div>
                    <div class="alert-content">
                      <div class="alert-title">${a.title}</div>
                      <div class="alert-source">${a.source}</div>
                    </div>
                    <span class="severity-badge severity-${a.severity}">${a.severity}</span>
                  </div>
                `)}
              </div>
            </section>
            <section class="card" aria-label="Analyst Team">
              <div class="card-header"><h2 class="card-title">Analyst Team</h2></div>
              ${this.analysts.map(a => html`
                <div class="analyst-card">
                  <div class="analyst-avatar">${a.initials}</div>
                  <div class="analyst-info">
                    <div class="analyst-name">${a.name}</div>
                    <div class="analyst-status">${a.status}</div>
                  </div>
                  <div style="text-align: right">
                    <div style="font-size: 13px; font-weight: 600;">${a.load}%</div>
                    <div class="load-bar"><div class="load-fill" style="width: ${a.load}%; background: ${this.getLoadColor(a.load)}"></div></div>
                  </div>
                </div>
              `)}
            </section>
          </div>
          <aside>
            <section class="card">
              <div class="card-header"><h2 class="card-title">Quick Actions</h2></div>
              <div class="quick-actions">
                ${['🔍 Investigate', '🚨 Alert', '📋 Playbook', '📊 Report', '🔄 Sync', '📞 Escalate'].map(action => html`
                  <button class="action-btn"><span class="action-icon">${action.charAt(0)}</span>${action.slice(2)}</button>
                `)}
              </div>
            </section>
            <section class="card">
              <div class="card-header"><h2 class="card-title">Metrics</h2></div>
              <div class="metrics-grid">
                ${this.metrics.map(m => html`
                  <div class="metric-item">
                    <div class="metric-header"><span class="metric-name">${m.name}</span><span style="color: ${m.color}; font-weight: 600;">${m.value}</span></div>
                    <div class="metric-bar"><div class="metric-fill" style="width: ${m.fill}%; background: ${m.color}"></div></div>
                  </div>
                `)}
              </div>
            </section>
          </aside>
        </div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-soc-dashboard': ScSocDashboard; } }

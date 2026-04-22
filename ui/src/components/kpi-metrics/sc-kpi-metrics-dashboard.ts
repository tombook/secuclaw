/**
 * sc-kpi-metrics-dashboard - Security KPI Metrics Dashboard
 * Tracks security metrics, SLAs, and performance indicators
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-kpi-metrics-dashboard')
export class ScKpiMetricsDashboard extends LitElement {
  static styles = css`
    :host {
      display: block;
      --primary: #00ff88;
      --secondary: #00aaff;
      --danger: #ff4444;
      --warning: #ffaa00;
      --success: #10b981;
      --bg-dark: #0a0e17;
      --bg-card: #141b26;
      --bg-card-hover: #1a2536;
      --text-primary: #ffffff;
      --text-secondary: #8899aa;
      --border: #2a3a4a;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .dashboard { background: var(--bg-dark); min-height: 100vh; color: var(--text-primary); padding: 24px; font-family: 'Inter', system-ui, sans-serif; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
    .title { font-size: 28px; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 12px; }
    .subtitle { font-size: 14px; color: var(--text-secondary); }
    .header-actions { display: flex; gap: 12px; }
    .btn { padding: 10px 20px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-primary); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 8px; }
    .btn:hover { background: var(--bg-card-hover); border-color: var(--primary); }
    .btn-primary { background: linear-gradient(135deg, var(--primary), #00cc6a); color: var(--bg-dark); border: none; }
    .kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; margin-bottom: 32px; }
    .kpi-card { background: var(--bg-card); border-radius: 16px; padding: 24px; border: 1px solid var(--border); position: relative; overflow: hidden; transition: all 0.3s ease; }
    .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
    .kpi-card:hover { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3); }
    .kpi-card.primary::before { background: linear-gradient(90deg, var(--primary), transparent); }
    .kpi-card.danger::before { background: linear-gradient(90deg, var(--danger), transparent); }
    .kpi-card.warning::before { background: linear-gradient(90deg, var(--warning), transparent); }
    .kpi-card.info::before { background: linear-gradient(90deg, var(--secondary), transparent); }
    .kpi-card.success::before { background: linear-gradient(90deg, var(--success), transparent); }
    .kpi-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px; }
    .kpi-card.primary .kpi-icon { background: rgba(0, 255, 136, 0.15); }
    .kpi-card.danger .kpi-icon { background: rgba(255, 68, 68, 0.15); }
    .kpi-card.warning .kpi-icon { background: rgba(255, 170, 0, 0.15); }
    .kpi-card.info .kpi-icon { background: rgba(0, 170, 255, 0.15); }
    .kpi-card.success .kpi-icon { background: rgba(16, 185, 129, 0.15); }
    .kpi-label { font-size: 12px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .kpi-value { font-size: 36px; font-weight: 700; margin-bottom: 8px; }
    .kpi-card.primary .kpi-value { color: var(--primary); }
    .kpi-card.danger .kpi-value { color: var(--danger); }
    .kpi-card.warning .kpi-value { color: var(--warning); }
    .kpi-card.info .kpi-value { color: var(--secondary); }
    .kpi-card.success .kpi-value { color: var(--success); }
    .kpi-change { font-size: 13px; display: flex; align-items: center; gap: 4px; }
    .kpi-change.positive { color: var(--success); }
    .kpi-change.negative { color: var(--danger); }
    .kpi-target { font-size: 11px; color: var(--text-secondary); margin-top: 8px; }
    .kpi-target span { color: var(--primary); font-weight: 600; }
    .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 32px; }
    .card { background: var(--bg-card); border-radius: 16px; padding: 24px; border: 1px solid var(--border); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
    .card-title { font-size: 16px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
    .card-title::before { content: ''; width: 4px; height: 20px; border-radius: 2px; background: var(--primary); }
    .period-selector { display: flex; gap: 4px; background: var(--bg-dark); padding: 4px; border-radius: 8px; }
    .period-btn { padding: 6px 12px; border: none; background: transparent; color: var(--text-secondary); font-size: 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
    .period-btn:hover { color: var(--text-primary); }
    .period-btn.active { background: var(--primary); color: var(--bg-dark); font-weight: 600; }
    .chart-container { height: 280px; position: relative; margin-bottom: 20px; }
    .chart-svg { width: 100%; height: 100%; }
    .chart-legend { display: flex; gap: 24px; justify-content: center; }
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary); }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
    .sla-table { width: 100%; border-collapse: collapse; }
    .sla-table th { text-align: left; padding: 12px 8px; font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid var(--border); }
    .sla-table td { padding: 14px 8px; font-size: 13px; border-bottom: 1px solid var(--border); color: var(--text-primary); }
    .sla-table tr:hover td { background: var(--bg-card-hover); }
    .status-badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .status-badge.achieved { background: rgba(0, 255, 136, 0.2); color: var(--success); }
    .status-badge.at-risk { background: rgba(255, 170, 0, 0.2); color: var(--warning); }
    .status-badge.missed { background: rgba(255, 68, 68, 0.2); color: var(--danger); }
    .progress-bar { width: 120px; height: 8px; background: var(--bg-dark); border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
    .team-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 16px; }
    .team-card { background: var(--bg-dark); border-radius: 12px; padding: 16px; text-align: center; border: 1px solid var(--border); }
    .team-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 18px; font-weight: 700; color: var(--bg-dark); }
    .team-name { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
    .team-role { font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; }
    .team-stat { font-size: 20px; font-weight: 700; color: var(--primary); }
    @media (max-width: 1400px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } .content-grid { grid-template-columns: 1fr; } }
    @media (max-width: 768px) { .kpi-grid { grid-template-columns: 1fr); } .header { flex-direction: column; gap: 16px; align-items: flex-start; } }
    .btn:focus-visible, .period-btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
  `;

  @state() private selectedPeriod: '7d' | '30d' | '90d' | '1y' = '30d';
  @state() private currentTime = new Date();

  private kpis = [
    { label: 'MTTD', value: '4.2', unit: 'min', change: '-23%', positive: true, target: '< 10 min', icon: '🔍', type: 'primary' },
    { label: 'MTTR', value: '18', unit: 'min', change: '-15%', positive: true, target: '< 30 min', icon: '⚡', type: 'success' },
    { label: 'Incidents', value: '156', unit: '', change: '+8%', positive: false, target: '< 200/mo', icon: '🚨', type: 'warning' },
    { label: 'False Positive', value: '12', unit: '%', change: '-5%', positive: true, target: '< 15%', icon: '✓', type: 'info' },
    { label: 'Coverage', value: '98', unit: '%', change: '+2%', positive: true, target: '> 95%', icon: '🛡️', type: 'primary' },
  ];

  private slaMetrics = [
    { name: 'Critical Incident Response', target: '15 min', actual: '12 min', compliance: 98, status: 'achieved' },
    { name: 'High Priority Resolution', target: '4 hrs', actual: '3.2 hrs', compliance: 95, status: 'achieved' },
    { name: 'Medium Priority Resolution', target: '24 hrs', actual: '18 hrs', compliance: 92, status: 'achieved' },
    { name: 'Low Priority Resolution', target: '72 hrs', actual: '84 hrs', compliance: 78, status: 'at-risk' },
    { name: 'Vulnerability Remediation', target: '30 days', actual: '35 days', compliance: 72, status: 'missed' },
    { name: 'Patch Deployment', target: '7 days', actual: '5 days', compliance: 100, status: 'achieved' },
  ];

  private teamPerformance = [
    { name: 'Alex Chen', role: 'SOC Lead', tickets: 45, avgTime: '12m' },
    { name: 'Sarah Kim', role: 'Security Analyst', tickets: 38, avgTime: '15m' },
    { name: 'Marcus Johnson', role: 'Incident Responder', tickets: 32, avgTime: '10m' },
    { name: 'Emily Davis', role: 'Threat Hunter', tickets: 28, avgTime: '18m' },
  ];

  connectedCallback() {
    super.connectedCallback();
    setInterval(() => { this.currentTime = new Date(); }, 1000);
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour12: false });
  }

  private getChartData() {
    const data: Record<string, { labels: string[], detected: number[], resolved: number[] }> = {
      '7d': { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], detected: [23, 45, 32, 67, 45, 12, 8], resolved: [20, 42, 30, 62, 43, 10, 8] },
      '30d': { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], detected: [145, 189, 167, 203], resolved: [138, 175, 158, 195] },
      '90d': { labels: ['Jan', 'Feb', 'Mar'], detected: [456, 523, 489], resolved: [432, 498, 475] },
      '1y': { labels: ['Q1', 'Q2', 'Q3', 'Q4'], detected: [1234, 1567, 1892, 2105], resolved: [1189, 1498, 1823, 2045] }
    };
    return data[this.selectedPeriod];
  }

  private renderChart() {
    const chartData = this.getChartData();
    const maxVal = Math.max(...chartData.detected, ...chartData.resolved);
    const chartHeight = 200;
    const barWidth = 20;

    return html`
      <svg class="chart-svg" viewBox="0 0 ${chartData.labels.length * 80} ${chartHeight + 50}" preserveAspectRatio="xMidYMid meet">
        ${chartData.labels.map((label, i) => {
          const detHeight = (chartData.detected[i] / maxVal) * chartHeight;
          const resHeight = (chartData.resolved[i] / maxVal) * chartHeight;
          const x = i * 80 + 20;
          return html`
            <rect x="${x}" y="${chartHeight - detHeight + 10}" width="${barWidth}" height="${detHeight}" fill="#00ff88" rx="3">
              <title>Detected: ${chartData.detected[i]}</title>
            </rect>
            <rect x="${x + barWidth + 4}" y="${chartHeight - resHeight + 10}" width="${barWidth}" height="${resHeight}" fill="#00aaff" rx="3">
              <title>Resolved: ${chartData.resolved[i]}</title>
            </rect>
            <text x="${x + barWidth}" y="${chartHeight + 30}" text-anchor="middle" fill="#8899aa" font-size="12">${label}</text>
          `;
        })}
      </svg>
    `;
  }

  render() {
    return html`
      <div class="dashboard" role="main" aria-label="Security KPI Metrics Dashboard">
        <header class="header">
          <div>
            <h1 class="title"><span>📊</span> Security KPI Metrics</h1>
            <span class="subtitle">Last updated: ${this.currentTime.toLocaleDateString()} ${this.formatTime(this.currentTime)}</span>
          </div>
          <div class="header-actions">
            <button class="btn" aria-label="Export metrics report">📥 Export</button>
            <button class="btn btn-primary" aria-label="Configure KPI targets">⚙️ Configure</button>
          </div>
        </header>

        <section class="kpi-grid" aria-label="Key Performance Indicators">
          ${this.kpis.map(kpi => html`
            <article class="kpi-card ${kpi.type}" role="article">
              <div class="kpi-icon">${kpi.icon}</div>
              <div class="kpi-label">${kpi.label}</div>
              <div class="kpi-value">${kpi.value}${kpi.unit}</div>
              <div class="kpi-change ${kpi.positive ? 'positive' : 'negative'}">
                ${kpi.positive ? '↓' : '↑'} ${kpi.change} vs last period
              </div>
              <div class="kpi-target">Target: <span>${kpi.target}</span></div>
            </article>
          `)}
        </section>

        <div class="content-grid">
          <section class="card" aria-label="Incident Trends">
            <div class="card-header">
              <h2 class="card-title">Incident Detection & Resolution Trends</h2>
              <div class="period-selector" role="group" aria-label="Select time period">
                ${(['7d', '30d', '90d', '1y'] as const).map(p => html`
                  <button class="period-btn ${this.selectedPeriod === p ? 'active' : ''}"
                    @click=${() => this.selectedPeriod = p} aria-pressed="${this.selectedPeriod === p}">${p.toUpperCase()}</button>
                `)}
              </div>
            </div>
            <div class="chart-container">${this.renderChart()}</div>
            <div class="chart-legend">
              <span class="legend-item"><span class="legend-dot" style="background: #00ff88"></span> Detected</span>
              <span class="legend-item"><span class="legend-dot" style="background: #00aaff"></span> Resolved</span>
            </div>
          </section>

          <aside class="card" aria-label="Team Performance">
            <div class="card-header"><h2 class="card-title">Team Performance</h2></div>
            <div class="team-grid">
              ${this.teamPerformance.map(member => html`
                <div class="team-card">
                  <div class="team-avatar">${member.name.split(' ').map(n => n[0]).join('')}</div>
                  <div class="team-name">${member.name}</div>
                  <div class="team-role">${member.role}</div>
                  <div class="team-stat">${member.tickets}</div>
                  <div style="font-size: 11px; color: var(--text-secondary);">Avg ${member.avgTime}</div>
                </div>
              `)}
            </div>
          </aside>
        </div>

        <section class="card" aria-label="SLA Compliance Metrics">
          <div class="card-header">
            <h2 class="card-title">SLA Compliance Metrics</h2>
            <span style="font-size: 12px; color: var(--text-secondary);">Last 30 days</span>
          </div>
          <table class="sla-table" role="table" aria-label="SLA compliance data">
            <thead>
              <tr><th scope="col">Metric</th><th scope="col">Target</th><th scope="col">Actual</th><th scope="col">Compliance</th><th scope="col">Status</th></tr>
            </thead>
            <tbody>
              ${this.slaMetrics.map(sla => html`
                <tr>
                  <td>${sla.name}</td><td>${sla.target}</td><td>${sla.actual}</td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <div class="progress-bar">
                        <div class="progress-fill" style="width: ${sla.compliance}%; background: ${sla.compliance >= 90 ? 'var(--success)' : sla.compliance >= 75 ? 'var(--warning)' : 'var(--danger)'}"></div>
                      </div>
                      <span>${sla.compliance}%</span>
                    </div>
                  </td>
                  <td><span class="status-badge ${sla.status}">${sla.status}</span></td>
                </tr>
              `)}
            </tbody>
          </table>
        </section>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-kpi-metrics-dashboard': ScKpiMetricsDashboard; } }

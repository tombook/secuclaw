import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * Security KPI Dashboard Web Component
 * Displays security metrics including MTTD, MTTR, alert quality, SLA compliance, ATT&CK coverage, etc.
 */
@customElement('sc-kpi-dashboard')
export class ScKpiDashboard extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --bg-primary: #0f172a;
      --bg-secondary: #1e293b;
      --bg-tertiary: #334155;
      --text-primary: #f1f5f9;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --accent-blue: #3b82f6;
      --accent-green: #22c55e;
      --accent-yellow: #eab308;
      --accent-red: #ef4444;
      --accent-purple: #a855f7;
      --accent-cyan: #06b6d4;
      --border-color: #334155;
      --card-radius: 12px;
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2);
    }

    :host([light-mode]) {
      --bg-primary: #f8fafc;
      --bg-secondary: #ffffff;
      --bg-tertiary: #e2e8f0;
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-muted: #94a3b8;
      --border-color: #cbd5e1;
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
    }

    .dashboard {
      padding: 24px;
      background: var(--bg-primary);
      min-height: 100vh;
      color: var(--text-primary);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }

    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .time-selector {
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-primary);
      font-size: 14px;
      cursor: pointer;
    }

    .theme-toggle {
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-primary);
      cursor: pointer;
      font-size: 18px;
    }

    .executive-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .summary-card {
      background: var(--bg-secondary);
      border-radius: var(--card-radius);
      padding: 24px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .summary-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.3);
    }

    .summary-card .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .summary-card .card-title {
      font-size: 14px;
      color: var(--text-secondary);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-card .card-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .summary-card .card-value {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .summary-card .card-change {
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .change-positive { color: var(--accent-green); }
    .change-negative { color: var(--accent-red); }
    .change-neutral { color: var(--text-muted); }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .metric-card {
      background: var(--bg-secondary);
      border-radius: var(--card-radius);
      padding: 24px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
    }

    .metric-card h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 20px 0;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color);
    }

    .metric-row:last-child {
      border-bottom: none;
    }

    .metric-label {
      color: var(--text-secondary);
      font-size: 14px;
    }

    .metric-value {
      font-weight: 600;
      font-size: 18px;
    }

    .metric-value.high { color: var(--accent-red); }
    .metric-value.medium { color: var(--accent-yellow); }
    .metric-value.low { color: var(--accent-green); }

    .sla-bar {
      margin-top: 16px;
    }

    .sla-bar-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .sla-bar-track {
      height: 12px;
      background: var(--bg-tertiary);
      border-radius: 6px;
      overflow: hidden;
    }

    .sla-bar-fill {
      height: 100%;
      border-radius: 6px;
      transition: width 0.5s ease;
    }

    .attack-coverage {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .attack-tactic {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .attack-tactic-name {
      width: 140px;
      font-size: 13px;
      color: var(--text-secondary);
    }

    .attack-tactic-bar {
      flex: 1;
      height: 24px;
      background: var(--bg-tertiary);
      border-radius: 4px;
      overflow: hidden;
    }

    .attack-tactic-fill {
      height: 100%;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 8px;
      font-size: 12px;
      font-weight: 600;
    }

    .charts-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .chart-card {
      background: var(--bg-secondary);
      border-radius: var(--card-radius);
      padding: 24px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
    }

    .chart-card h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 20px 0;
      color: var(--text-primary);
    }

    .chart-container {
      height: 200px;
      position: relative;
    }

    .chart-svg {
      width: 100%;
      height: 100%;
    }

    .shift-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .shift-card {
      background: var(--bg-tertiary);
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }

    .shift-card .shift-name {
      font-size: 14px;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }

    .shift-card .shift-value {
      font-size: 24px;
      font-weight: 700;
    }

    .shift-card .shift-hours {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .incident-table {
      width: 100%;
      border-collapse: collapse;
    }

    .incident-table th,
    .incident-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .incident-table th {
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .incident-table td {
      font-size: 14px;
    }

    .severity-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .severity-critical { background: rgba(239, 68, 68, 0.2); color: var(--accent-red); }
    .severity-high { background: rgba(249, 115, 22, 0.2); color: #f97316; }
    .severity-medium { background: rgba(234, 179, 8, 0.2); color: var(--accent-yellow); }
    .severity-low { background: rgba(34, 197, 94, 0.2); color: var(--accent-green); }

    @media (max-width: 768px) {
      .dashboard { padding: 16px; }
      .charts-section { grid-template-columns: 1fr; }
      .shift-grid { grid-template-columns: 1fr; }
      .header { flex-direction: column; gap: 16px; }
    }
  `;

  @property({ type: String }) timeRange = '7d';
  @property({ type: Boolean, reflect: true }) lightMode = false;
  @state() private showLightMode = false;

  @state() private metrics = {
    mttd: { value: 12.5, unit: 'min', change: -8.2 },
    mttr: { value: 45.2, unit: 'min', change: -12.5 },
    alertVolume: { value: 1247, change: 15.3 },
    analystCount: 8,
    alertsPerAnalyst: 156,
    truePositiveRate: 78.5,
    falsePositiveRate: 21.5,
    signalToNoise: 3.2,
    slaCompliance: 94.7,
    attackCoverage: 67,
    totalIncidents: 23,
    openIncidents: 5,
    resolvedIncidents: 18
  };

  @state() private incidents = [
    { id: 'INC-001', severity: 'critical', category: 'Ransomware', status: 'Investigating', assignee: 'John D.', updated: '5 min ago' },
    { id: 'INC-002', severity: 'high', category: 'Phishing', status: 'Contained', assignee: 'Sarah M.', updated: '12 min ago' },
    { id: 'INC-003', severity: 'high', category: 'Data Exfiltration', status: 'Investigating', assignee: 'Mike R.', updated: '1 hour ago' },
    { id: 'INC-004', severity: 'medium', category: 'Malware', status: 'Resolved', assignee: 'Emily K.', updated: '2 hours ago' },
    { id: 'INC-005', severity: 'low', category: 'Suspicious Login', status: 'Resolved', assignee: 'Alex P.', updated: '3 hours ago' }
  ];

  @state() private attackTactics = [
    { name: 'Initial Access', coverage: 85, color: '#3b82f6' },
    { name: 'Execution', coverage: 72, color: '#22c55e' },
    { name: 'Persistence', coverage: 68, color: '#eab308' },
    { name: 'Privilege Escalation', coverage: 55, color: '#ef4444' },
    { name: 'Defense Evasion', coverage: 62, color: '#a855f7' },
    { name: 'Lateral Movement', coverage: 48, color: '#06b6d4' },
    { name: 'Collection', coverage: 71, color: '#f97316' },
    { name: 'Exfiltration', coverage: 45, color: '#ec4899' }
  ];

  @state() private shifts = [
    { name: 'Night', count: 2, hours: '22:00 - 06:00', alerts: 312, color: '#6366f1' },
    { name: 'Morning', count: 3, hours: '06:00 - 14:00', alerts: 485, color: '#f59e0b' },
    { name: 'Afternoon', count: 3, hours: '14:00 - 22:00', alerts: 450, color: '#10b981' }
  ];

  @state() private trendData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    mttd: [15.2, 14.8, 13.5, 12.9, 12.5, 11.8, 12.5],
    mttr: [52.3, 48.5, 46.2, 45.8, 44.9, 45.5, 45.2],
    alerts: [165, 178, 192, 180, 195, 142, 195]
  };

  private toggleTheme() {
    this.showLightMode = !this.showLightMode;
    if (this.showLightMode) {
      this.setAttribute('light-mode', '');
    } else {
      this.removeAttribute('light-mode');
    }
  }

  private getTrendChart() {
    const width = 400;
    const height = 180;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const maxVal = Math.max(...this.trendData.mttd, ...this.trendData.mttr) + 10;
    const pointsMttd = this.trendData.mttd.map((val, i) => {
      const x = padding + (i / 6) * chartWidth;
      const y = padding + chartHeight - (val / maxVal) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
    
    const pointsMttr = this.trendData.mttr.map((val, i) => {
      const x = padding + (i / 6) * chartWidth;
      const y = padding + chartHeight - (val / maxVal) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    return html`
      <svg class="chart-svg" viewBox="0 0 ${width} ${height}">
        ${[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = padding + chartHeight * (1 - pct);
          return html`<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="var(--border-color)" stroke-dasharray="4"/>`;
        })}
        <polyline points="${pointsMttd}" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="${pointsMttr}" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        ${this.trendData.labels.map((label, i) => {
          const x = padding + (i / 6) * chartWidth;
          return html`<text x="${x}" y="${height - 10}" text-anchor="middle" fill="var(--text-muted)" font-size="12">${label}</text>`;
        })}
        <circle cx="60" cy="20" r="6" fill="#3b82f6"/>
        <text x="72" y="24" fill="var(--text-secondary)" font-size="12">MTTD</text>
        <circle cx="130" cy="20" r="6" fill="#22c55e"/>
        <text x="142" y="24" fill="var(--text-secondary)" font-size="12">MTTR</text>
      </svg>
    `;
  }

  private getAlertVolumeChart() {
    const width = 400;
    const height = 180;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const maxVal = Math.max(...this.trendData.alerts) + 20;
    const barWidth = chartWidth / 7 - 8;
    
    const bars = this.trendData.alerts.map((val, i) => {
      const x = padding + (i / 6) * chartWidth - barWidth / 2;
      const barHeight = (val / maxVal) * chartHeight;
      const y = padding + chartHeight - barHeight;
      const gradient = `hsl(${200 + i * 10}, 80%, ${50 + i * 3}%)`;
      return html`
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="${gradient}"/>
        <text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" fill="var(--text-secondary)" font-size="11">${val}</text>
      `;
    });

    return html`
      <svg class="chart-svg" viewBox="0 0 ${width} ${height}">
        ${[0, 0.5, 1].map(pct => {
          const y = padding + chartHeight * (1 - pct);
          return html`<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="var(--border-color)" stroke-dasharray="4"/>`;
        })}
        ${bars}
        ${this.trendData.labels.map((label, i) => {
          const x = padding + (i / 6) * chartWidth;
          return html`<text x="${x}" y="${height - 10}" text-anchor="middle" fill="var(--text-muted)" font-size="12">${label}</text>`;
        })}
      </svg>
    `;
  }

  private formatChange(change: number): string {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  }

  render() {
    return html`
      <div class="dashboard">
        <div class="header">
          <h1>Security KPI Dashboard</h1>
          <div class="header-actions">
            <select class="time-selector" @change="${(e: Event) => this.timeRange = (e.target as HTMLSelectElement).value}">
              <option value="24h">Last 24 Hours</option>
              <option value="7d" selected>Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last Quarter</option>
            </select>
            <button class="theme-toggle" @click="${this.toggleTheme}">
              ${this.showLightMode ? '🌙' : '☀️'}
            </button>
          </div>
        </div>

        <div class="executive-summary">
          <div class="summary-card">
            <div class="card-header">
              <span class="card-title">Active Alerts</span>
              <div class="card-icon" style="background: rgba(239, 68, 68, 0.2);">🔴</div>
            </div>
            <div class="card-value">${this.metrics.alertVolume.value}</div>
            <div class="card-change ${this.metrics.alertVolume.change > 0 ? 'change-negative' : 'change-positive'}">
              ${this.formatChange(this.metrics.alertVolume.change)} vs last period
            </div>
          </div>

          <div class="summary-card">
            <div class="card-header">
              <span class="card-title">Open Incidents</span>
              <div class="card-icon" style="background: rgba(249, 115, 22, 0.2);">⚠️</div>
            </div>
            <div class="card-value">${this.metrics.openIncidents}</div>
            <div class="card-change change-neutral">
              of ${this.metrics.totalIncidents} total incidents
            </div>
          </div>

          <div class="summary-card">
            <div class="card-header">
              <span class="card-title">SLA Compliance</span>
              <div class="card-icon" style="background: rgba(34, 197, 94, 0.2);">✓</div>
            </div>
            <div class="card-value">${this.metrics.slaCompliance}%</div>
            <div class="card-change change-positive">Target: 95%</div>
          </div>

          <div class="summary-card">
            <div class="card-header">
              <span class="card-title">ATT&CK Coverage</span>
              <div class="card-icon" style="background: rgba(168, 85, 247, 0.2);">🎯</div>
            </div>
            <div class="card-value">${this.metrics.attackCoverage}%</div>
            <div class="card-change change-positive">+5% vs last month</div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <h3>⏱️ Detection & Response Times</h3>
            <div class="metric-row">
              <span class="metric-label">MTTD (Mean Time to Detect)</span>
              <span class="metric-value low">${this.metrics.mttd.value} ${this.metrics.mttd.unit}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">MTTR (Mean Time to Respond)</span>
              <span class="metric-value low">${this.metrics.mttr.value} ${this.metrics.mttr.unit}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">MTTD Change</span>
              <span class="metric-value low">${this.formatChange(this.metrics.mttd.change)}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">MTTR Change</span>
              <span class="metric-value low">${this.formatChange(this.metrics.mttr.change)}</span>
            </div>
          </div>

          <div class="metric-card">
            <h3>📊 Alert Quality Metrics</h3>
            <div class="metric-row">
              <span class="metric-label">True Positive Rate</span>
              <span class="metric-value low">${this.metrics.truePositiveRate}%</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">False Positive Rate</span>
              <span class="metric-value medium">${this.metrics.falsePositiveRate}%</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Signal-to-Noise Ratio</span>
              <span class="metric-value low">${this.metrics.signalToNoise}:1</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Total Alerts (7d)</span>
              <span class="metric-value">${this.metrics.alertVolume.value}</span>
            </div>
          </div>

          <div class="metric-card">
            <h3>👥 Analyst Productivity</h3>
            <div class="metric-row">
              <span class="metric-label">Active Analysts</span>
              <span class="metric-value">${this.metrics.analystCount}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Alerts per Analyst/Day</span>
              <span class="metric-value">${this.metrics.alertsPerAnalyst}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Avg Handle Time</span>
              <span class="metric-value low">8.5 min</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Escalation Rate</span>
              <span class="metric-value low">12.3%</span>
            </div>
          </div>

          <div class="metric-card">
            <h3>📋 SLA Compliance Breakdown</h3>
            <div class="sla-bar">
              <div class="sla-bar-label">
                <span>Critical (15 min)</span>
                <span style="color: var(--accent-green)">98.2%</span>
              </div>
              <div class="sla-bar-track">
                <div class="sla-bar-fill" style="width: 98.2%; background: var(--accent-green);"></div>
              </div>
            </div>
            <div class="sla-bar">
              <div class="sla-bar-label">
                <span>High (1 hour)</span>
                <span style="color: var(--accent-green)">96.5%</span>
              </div>
              <div class="sla-bar-track">
                <div class="sla-bar-fill" style="width: 96.5%; background: var(--accent-green);"></div>
              </div>
            </div>
            <div class="sla-bar">
              <div class="sla-bar-label">
                <span>Medium (4 hours)</span>
                <span style="color: var(--accent-yellow)">91.8%</span>
              </div>
              <div class="sla-bar-track">
                <div class="sla-bar-fill" style="width: 91.8%; background: var(--accent-yellow);"></div>
              </div>
            </div>
            <div class="sla-bar">
              <div class="sla-bar-label">
                <span>Low (24 hours)</span>
                <span style="color: var(--accent-green)">94.7%</span>
              </div>
              <div class="sla-bar-track">
                <div class="sla-bar-fill" style="width: 94.7%; background: var(--accent-green);"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <h3>🎯 MITRE ATT&CK Coverage</h3>
            <div class="attack-coverage">
              ${this.attackTactics.map(tactic => html`
                <div class="attack-tactic">
                  <span class="attack-tactic-name">${tactic.name}</span>
                  <div class="attack-tactic-bar">
                    <div class="attack-tactic-fill" 
                         style="width: ${tactic.coverage}%; background: ${tactic.color};">
                      ${tactic.coverage}%
                    </div>
                  </div>
                </div>
              `)}
            </div>
          </div>

          <div class="metric-card">
            <h3>🕐 Shift-Based Workload Distribution</h3>
            <div class="shift-grid">
              ${this.shifts.map(shift => html`
                <div class="shift-card">
                  <div class="shift-name">${shift.name}</div>
                  <div class="shift-value" style="color: ${shift.color}">${shift.count}</div>
                  <div class="shift-hours">${shift.hours}</div>
                  <div style="margin-top: 8px; font-size: 12px; color: var(--text-secondary);">
                    ${shift.alerts} alerts
                  </div>
                </div>
              `)}
            </div>
          </div>
        </div>

        <div class="charts-section">
          <div class="chart-card">
            <h3>📈 Detection & Response Time Trends</h3>
            <div class="chart-container">
              ${this.getTrendChart()}
            </div>
          </div>

          <div class="chart-card">
            <h3>📊 Alert Volume by Day</h3>
            <div class="chart-container">
              ${this.getAlertVolumeChart()}
            </div>
          </div>
        </div>

        <div class="metric-card">
          <h3>🚨 Recent Incidents</h3>
          <table class="incident-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Severity</th>
                <th>Category</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              ${this.incidents.map(incident => html`
                <tr>
                  <td><strong>${incident.id}</strong></td>
                  <td>
                    <span class="severity-badge severity-${incident.severity}">
                      ${incident.severity.toUpperCase()}
                    </span>
                  </td>
                  <td>${incident.category}</td>
                  <td>${incident.status}</td>
                  <td>${incident.assignee}</td>
                  <td style="color: var(--text-muted)">${incident.updated}</td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-kpi-dashboard': ScKpiDashboard;
  }
}

/**
 * sc-network-security-monitor - Network Security Monitoring Dashboard
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-network-security-monitor')
export class ScNetworkSecurityMonitor extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; --bg-primary: #0f172a; --bg-secondary: #1e293b; --bg-tertiary: #0a0e17; --text-primary: #f8fafc; --text-secondary: #94a3b8; --border: #334155; --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; --info: #3b82f6; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
    .title { font-size: 18px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
    .title-icon { width: 32px; height: 32px; background: linear-gradient(135deg, var(--info), #06b6d4); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 12px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: var(--bg-secondary); border-radius: 8px; padding: 20px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: 700; }
    .stat-label { font-size: 12px; color: var(--text-secondary); text-transform: uppercase; margin-top: 4px; }
    .stat-change { font-size: 11px; margin-top: 8px; }
    .content-grid { display: grid; grid-template-columns: 1fr 350px; gap: 20px; }
    .traffic-chart { background: var(--bg-secondary); border-radius: 8px; padding: 20px; margin-bottom: 16px; }
    .chart-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 16px; }
    .chart-area { height: 200px; display: flex; align-items: flex-end; gap: 4px; padding-top: 20px; }
    .chart-bar { flex: 1; border-radius: 4px 4px 0 0; transition: height 0.3s ease; position: relative; }
    .chart-bar:hover::after { content: attr(data-value); position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 10px; color: var(--text-secondary); }
    .chart-labels { display: flex; justify-content: space-between; margin-top: 8px; font-size: 10px; color: var(--text-secondary); }
    .alert-list { background: var(--bg-secondary); border-radius: 8px; padding: 16px; max-height: 300px; overflow-y: auto; }
    .alert-item { display: flex; gap: 12px; padding: 12px; background: var(--bg-tertiary); border-radius: 6px; margin-bottom: 8px; border-left: 3px solid; }
    .alert-item.critical { border-color: var(--danger); }
    .alert-item.high { border-color: var(--warning); }
    .alert-item.medium { border-color: var(--info); }
    .alert-icon { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .alert-content { flex: 1; }
    .alert-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .alert-meta { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
    .alert-time { font-size: 10px; color: var(--text-secondary); white-space: nowrap; }
    .top-tables { background: var(--bg-secondary); border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .table-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: var(--bg-tertiary); padding: 10px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); }
    td { padding: 10px; border-bottom: 1px solid var(--border); font-size: 12px; }
    tr:hover td { background: var(--bg-tertiary); }
    .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; }
    .badge-danger { background: rgba(239,68,68,0.2); color: var(--danger); }
    .badge-warning { background: rgba(245,158,11,0.2); color: var(--warning); }
    .badge-success { background: rgba(34,197,94,0.2); color: var(--success); }
    .badge-info { background: rgba(59,130,246,0.2); color: var(--info); }
    .zone-map { background: var(--bg-secondary); border-radius: 8px; padding: 16px; }
    .zone-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 12px; }
    .zone-card { background: var(--bg-tertiary); border-radius: 6px; padding: 12px; text-align: center; }
    .zone-name { font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
    .zone-devices { font-size: 20px; font-weight: 700; }
    .zone-risk { font-size: 10px; text-transform: uppercase; }
    .btn { padding: 8px 16px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-secondary); color: var(--text-primary); font-size: 13px; font-weight: 500; cursor: pointer; }
    .btn-primary { background: var(--info); border-color: var(--info); color: white; }
  `;

  @state() private activeTab = 'traffic';

  private stats = [
    { label: 'Total Alerts', value: '1,247', change: '+12%', color: 'var(--danger)' },
    { label: 'Blocked Threats', value: '892', change: '+8%', color: 'var(--success)' },
    { label: 'Bandwidth Used', value: '4.2 TB', change: '-3%', color: 'var(--info)' },
    { label: 'Active Flows', value: '23.4K', change: '+5%', color: 'var(--warning)' },
  ];

  private trafficData = {
    inbound: [45, 52, 48, 65, 72, 68, 75, 82, 78, 85, 88, 92, 86, 80, 75, 82, 88, 95, 91, 85, 78, 72, 65, 58],
    outbound: [30, 35, 32, 42, 48, 45, 52, 58, 55, 62, 68, 72, 68, 62, 58, 52, 48, 55, 62, 58, 52, 45, 38, 32],
  };

  private alerts = [
    { title: 'SQL Injection Attempt', src: '203.0.113.45', dst: '10.0.1.20', severity: 'critical', time: '2 min ago', type: 'WAF' },
    { title: 'Port Scan Detected', src: '185.220.101.134', dst: '10.0.1.0/24', severity: 'high', time: '5 min ago', type: 'IDS' },
    { title: 'Brute Force Attack', src: '45.33.32.156', dst: '10.0.2.15', severity: 'high', time: '12 min ago', type: 'Firewall' },
    { title: 'Suspicious DNS Query', src: '10.0.1.50', dst: 'malicious-domain.com', severity: 'medium', time: '18 min ago', type: 'DNS Filter' },
    { title: 'TLS Certificate Expired', src: 'cdn.example.com', dst: 'Internal', severity: 'medium', time: '25 min ago', type: 'Monitor' },
  ];

  private topConnections = [
    { src: '10.0.1.45', dst: 'api.github.com', packets: '2.4M', bytes: '1.8 GB', protocol: 'HTTPS' },
    { src: '10.0.2.15', dst: 's3.amazonaws.com', packets: '156K', bytes: '892 MB', protocol: 'HTTPS' },
    { src: '10.0.1.100', dst: 'docker.io', packets: '89K', bytes: '456 MB', protocol: 'HTTPS' },
    { src: '10.0.3.22', dst: 'registry.npmjs.org', packets: '45K', bytes: '234 MB', protocol: 'HTTPS' },
  ];

  private blockedIPs = [
    { ip: '185.220.101.134', country: 'Russia', attempts: 1247, reason: 'Tor exit node' },
    { ip: '103.253.145.32', country: 'China', attempts: 892, reason: 'Known scanner' },
    { ip: '45.33.32.156', country: 'US', attempts: 567, reason: 'Brute force' },
    { ip: '89.248.172.78', country: 'Netherlands', attempts: 423, reason: 'Port scan' },
  ];

  private zones = [
    { name: 'DMZ', devices: 24, risk: 'medium' },
    { name: 'Internal', devices: 456, risk: 'low' },
    { name: 'Guest', devices: 89, risk: 'high' },
    { name: 'Production', devices: 178, risk: 'low' },
    { name: 'Development', devices: 67, risk: 'medium' },
    { name: 'Security', devices: 12, risk: 'low' },
  ];

  private getRiskColor(risk: string): string {
    return risk === 'low' ? 'var(--success)' : risk === 'medium' ? 'var(--warning)' : 'var(--danger)';
  }

  render() {
    const maxTraffic = Math.max(...this.trafficData.inbound, ...this.trafficData.outbound);
    const hours = Array.from({length: 24}, (_, i) => `${i}:00`);

    return html`
      <div class="panel" role="region" aria-label="Network Security Monitor">
        <div class="header">
          <h2 class="title"><span class="title-icon">NW</span> Network Security Monitor</h2>
          <div style="display: flex; gap: 8px;">
            <button class="btn">Live View</button>
            <button class="btn btn-primary">Export</button>
          </div>
        </div>

        <div class="stats-grid" role="status">
          ${this.stats.map(s => html`
            <div class="stat-card">
              <div class="stat-value" style="color: ${s.color}">${s.value}</div>
              <div class="stat-label">${s.label}</div>
              <div class="stat-change" style="color: ${s.change.startsWith('+') ? 'var(--success)' : 'var(--danger)'}">${s.change} vs last period</div>
            </div>
          `)}
        </div>

        <div class="content-grid">
          <div>
            <div class="traffic-chart">
              <div class="chart-title">Network Traffic (24h)</div>
              <div class="chart-area">
                ${this.trafficData.inbound.map((val, i) => html`
                  <div class="chart-bar" style="height: ${(val / maxTraffic) * 100}%; background: var(--info)" data-value="${val} Mbps"></div>
                `)}
              </div>
              <div class="chart-labels">
                <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
              </div>
            </div>

            <div class="top-tables">
              <div class="table-title">Top Connections</div>
              <table>
                <thead><tr><th>Source</th><th>Destination</th><th>Packets</th><th>Bytes</th><th>Protocol</th></tr></thead>
                <tbody>
                  ${this.topConnections.map(c => html`
                    <tr>
                      <td><code>${c.src}</code></td>
                      <td><code>${c.dst}</code></td>
                      <td>${c.packets}</td>
                      <td>${c.bytes}</td>
                      <td><span class="badge badge-info">${c.protocol}</span></td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>

            <div class="zone-map">
              <div class="table-title">Network Zones</div>
              <div class="zone-grid">
                ${this.zones.map(z => html`
                  <div class="zone-card">
                    <div class="zone-name">${z.name}</div>
                    <div class="zone-devices">${z.devices}</div>
                    <div class="zone-risk" style="color: ${this.getRiskColor(z.risk)}">${z.risk} risk</div>
                  </div>
                `)}
              </div>
            </div>
          </div>

          <div>
            <div class="alert-list">
              <div class="table-title">Recent Alerts</div>
              ${this.alerts.map(a => html`
                <div class="alert-item ${a.severity}">
                  <div class="alert-icon" style="background: ${a.severity === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}">
                    ${a.type === 'WAF' ? 'W' : a.type === 'IDS' ? 'I' : a.type === 'Firewall' ? 'F' : 'D'}
                  </div>
                  <div class="alert-content">
                    <div class="alert-title">${a.title}</div>
                    <div class="alert-meta">${a.src} -> ${a.dst}</div>
                  </div>
                  <div class="alert-time">${a.time}</div>
                </div>
              `)}
            </div>

            <div class="top-tables" style="margin-top: 16px;">
              <div class="table-title">Blocked IPs</div>
              <table>
                <thead><tr><th>IP Address</th><th>Country</th><th>Attempts</th></tr></thead>
                <tbody>
                  ${this.blockedIPs.map(ip => html`
                    <tr>
                      <td><code>${ip.ip}</code></td>
                      <td>${ip.country}</td>
                      <td><span class="badge badge-danger">${ip.attempts}</span></td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-network-security-monitor': ScNetworkSecurityMonitor; } }

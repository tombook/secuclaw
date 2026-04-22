/**
 * sc-asset-inventory - Asset Inventory Management Dashboard
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-asset-inventory')
export class ScAssetInventory extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; --bg-primary: #0f172a; --bg-secondary: #1e293b; --bg-tertiary: #0a0e17; --text-primary: #f8fafc; --text-secondary: #94a3b8; --border: #334155; --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; --info: #3b82f6; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
    .title { font-size: 18px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
    .title-icon { width: 32px; height: 32px; background: linear-gradient(135deg, var(--info), #06b6d4); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 12px; }
    .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
    .stat-card { background: var(--bg-secondary); border-radius: 8px; padding: 16px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: 700; }
    .stat-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; margin-top: 4px; }
    .asset-table { background: var(--bg-secondary); border-radius: 8px; overflow: hidden; margin-bottom: 16px; }
    .table-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); }
    .table-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
    .table-controls { display: flex; gap: 8px; }
    .search-input { padding: 8px 12px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); font-size: 13px; }
    .filter-btn { padding: 8px 12px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-secondary); font-size: 12px; cursor: pointer; }
    .filter-btn.active { background: var(--info); color: white; border-color: var(--info); }
    table { width: 100%; border-collapse: collapse; }
    th { background: var(--bg-tertiary); padding: 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); }
    td { padding: 12px; border-bottom: 1px solid var(--border); font-size: 12px; }
    tr:hover td { background: var(--bg-tertiary); }
    .asset-icon { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 8px; }
    .asset-name { display: flex; align-items: center; }
    .asset-name-text { font-weight: 600; color: var(--text-primary); }
    .asset-ip { font-size: 11px; color: var(--text-secondary); }
    .badge { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
    .badge-critical { background: rgba(239,68,68,0.2); color: var(--danger); }
    .badge-high { background: rgba(245,158,11,0.2); color: var(--warning); }
    .badge-medium { background: rgba(59,130,246,0.2); color: var(--info); }
    .badge-low { background: rgba(34,197,94,0.2); color: var(--success); }
    .badge-server { background: rgba(139,92,246,0.2); color: #8b5cf6; }
    .badge-workstation { background: rgba(6,182,212,0.2); color: #06b6d4; }
    .badge-cloud { background: rgba(14,165,233,0.2); color: #0ea5e9; }
    .type-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .type-card { background: var(--bg-secondary); border-radius: 8px; padding: 16px; text-align: center; }
    .type-icon { font-size: 24px; margin-bottom: 8px; }
    .type-count { font-size: 24px; font-weight: 700; }
    .type-label { font-size: 11px; color: var(--text-secondary); }
    .vuln-summary { display: flex; gap: 12px; margin-top: 8px; }
    .btn { padding: 8px 16px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-secondary); color: var(--text-primary); font-size: 13px; font-weight: 500; cursor: pointer; }
    .btn-primary { background: var(--info); border-color: var(--info); color: white; }
  `;

  @state() private filter: 'all' | 'server' | 'workstation' | 'cloud' | 'iot' = 'all';

  private stats = [
    { label: 'Total Assets', value: '2,847' },
    { label: 'Servers', value: '156' },
    { label: 'Workstations', value: '2,340' },
    { label: 'Cloud Instances', value: '289' },
    { label: 'Critical Assets', value: '47' },
  ];

  private assetTypes = [
    { type: 'Server', icon: 'S', count: 156, critical: 12 },
    { type: 'Workstation', icon: 'W', count: 2340, critical: 5 },
    { type: 'Cloud', icon: 'C', count: 289, critical: 8 },
    { type: 'IoT', icon: 'I', count: 62, critical: 2 },
  ];

  private assets = [
    { name: 'prod-web-01', ip: '10.0.1.15', type: 'server', os: 'Ubuntu 22.04', owner: 'Platform Team', criticality: 'critical', vulns: 3, lastScan: '2h ago', status: 'online' },
    { name: 'db-primary', ip: '10.0.2.10', type: 'server', os: 'PostgreSQL 15', owner: 'Data Team', criticality: 'critical', vulns: 1, lastScan: '1h ago', status: 'online' },
    { name: 'LAPTOP-JOHN', ip: '192.168.1.45', type: 'workstation', os: 'Windows 11', owner: 'John Doe', criticality: 'medium', vulns: 5, lastScan: '4h ago', status: 'online' },
    { name: 'aws-ec2-web-01', ip: '54.123.45.67', type: 'cloud', os: 'Amazon Linux 2', owner: 'DevOps', criticality: 'high', vulns: 2, lastScan: '3h ago', status: 'online' },
    { name: 'gateway-fw-01', ip: '10.0.0.1', type: 'server', os: 'PFSense 2.6', owner: 'Network Team', criticality: 'critical', vulns: 0, lastScan: '1h ago', status: 'online' },
    { name: 'iot-sensor-hall', ip: '10.0.10.15', type: 'iot', os: 'Custom RTOS', owner: 'Facilities', criticality: 'low', vulns: 2, lastScan: '1d ago', status: 'warning' },
  ];

  render() {
    return html`
      <div class="panel" role="region" aria-label="Asset Inventory Management">
        <div class="header">
          <h2 class="title"><span class="title-icon">AI</span> Asset Inventory</h2>
          <div style="display: flex; gap: 8px;">
            <button class="btn">Import</button>
            <button class="btn btn-primary">Add Asset</button>
          </div>
        </div>

        <div class="stats-grid" role="status">
          ${this.stats.map(s => html`<div class="stat-card"><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>`)}
        </div>

        <div class="type-grid">
          ${this.assetTypes.map(t => html`
            <div class="type-card">
              <div class="type-icon">${t.type === 'Server' ? 'S' : t.type === 'Workstation' ? 'W' : t.type === 'Cloud' ? 'C' : 'I'}</div>
              <div class="type-count">${t.count}</div>
              <div class="type-label">${t.type}</div>
              <div class="vuln-summary">
                <span class="badge badge-critical">${t.critical} critical</span>
              </div>
            </div>
          `)}
        </div>

        <div class="asset-table">
          <div class="table-header">
            <span class="table-title">All Assets (${this.assets.length})</span>
            <div class="table-controls">
              <input type="text" class="search-input" placeholder="Search assets..." />
              <button class="filter-btn ${this.filter === 'all' ? 'active' : ''}" @click=${() => this.filter = 'all'}>All</button>
              <button class="filter-btn ${this.filter === 'server' ? 'active' : ''}" @click=${() => this.filter = 'server'}>Servers</button>
              <button class="filter-btn ${this.filter === 'cloud' ? 'active' : ''}" @click=${() => this.filter = 'cloud'}>Cloud</button>
            </div>
          </div>
          <table>
            <thead><tr><th>Asset</th><th>Type</th><th>OS</th><th>Owner</th><th>Criticality</th><th>Vulns</th><th>Last Scan</th><th>Status</th></tr></thead>
            <tbody>
              ${this.assets.filter(a => this.filter === 'all' || a.type === this.filter).map(a => html`
                <tr>
                  <td>
                    <div class="asset-name">
                      <div class="asset-icon" style="background: ${a.type === 'server' ? 'rgba(139,92,246,0.2)' : 'rgba(6,182,212,0.2)'}">
                        ${a.type === 'server' ? 'S' : a.type === 'cloud' ? 'C' : a.type === 'workstation' ? 'W' : 'I'}
                      </div>
                      <div>
                        <div class="asset-name-text">${a.name}</div>
                        <div class="asset-ip">${a.ip}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="badge badge-${a.type === 'server' ? 'server' : a.type === 'cloud' ? 'cloud' : 'workstation'}">${a.type}</span></td>
                  <td>${a.os}</td>
                  <td>${a.owner}</td>
                  <td><span class="badge badge-${a.criticality}">${a.criticality}</span></td>
                  <td><span class="badge ${a.vulns > 0 ? 'badge-critical' : 'badge-low'}">${a.vulns}</span></td>
                  <td>${a.lastScan}</td>
                  <td><span style="color: ${a.status === 'online' ? 'var(--success)' : 'var(--warning)'}">${a.status === 'online' ? 'Online' : 'Warning'}</span></td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-asset-inventory': ScAssetInventory; } }

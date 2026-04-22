/**
 * sc-soc-workflow-automation - SOC Workflow Automation Dashboard
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-soc-workflow-automation')
export class ScSocWorkflowAutomation extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; --bg-primary: #0f172a; --bg-secondary: #1e293b; --bg-tertiary: #0a0e17; --text-primary: #f8fafc; --text-secondary: #94a3b8; --border: #334155; --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; --info: #3b82f6; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
    .title { font-size: 18px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
    .title-icon { width: 32px; height: 32px; background: linear-gradient(135deg, var(--warning), var(--danger)); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 12px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: var(--bg-secondary); border-radius: 8px; padding: 20px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: 700; }
    .stat-label { font-size: 12px; color: var(--text-secondary); text-transform: uppercase; margin-top: 4px; }
    .content-grid { display: grid; grid-template-columns: 1fr 350px; gap: 20px; }
    .card { background: var(--bg-secondary); border-radius: 8px; padding: 20px; margin-bottom: 16px; }
    .card-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 16px; }
    .playbook-list { max-height: 350px; overflow-y: auto; }
    .playbook-item { background: var(--bg-tertiary); border-radius: 6px; padding: 14px; margin-bottom: 10px; border-left: 3px solid; }
    .playbook-item.active { border-color: var(--success); }
    .playbook-item.automated { border-color: var(--info); }
    .playbook-item.manual { border-color: var(--warning); }
    .playbook-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .playbook-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .playbook-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
    .badge-active { background: rgba(34,197,94,0.2); color: var(--success); }
    .badge-automated { background: rgba(59,130,246,0.2); color: var(--info); }
    .badge-manual { background: rgba(245,158,11,0.2); color: var(--warning); }
    .playbook-meta { font-size: 11px; color: var(--text-secondary); }
    .playbook-stats { display: flex; gap: 16px; margin-top: 8px; }
    .playbook-stat { display: flex; align-items: center; gap: 4px; font-size: 11px; }
    .automation-flow { display: flex; flex-direction: column; gap: 8px; }
    .flow-step { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-tertiary); border-radius: 6px; }
    .flow-step-num { width: 24px; height: 24px; border-radius: 50%; background: var(--info); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .flow-step-content { flex: 1; }
    .flow-step-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .flow-step-desc { font-size: 11px; color: var(--text-secondary); }
    .flow-step-icon { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
    .metrics-timeline { margin-top: 16px; }
    .metric-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); }
    .metric-item:last-child { border-bottom: none; }
    .metric-name { font-size: 13px; color: var(--text-primary); }
    .metric-value { font-size: 14px; font-weight: 600; color: var(--success); }
    .automation-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 12px; }
    .auto-stat { background: var(--bg-tertiary); border-radius: 6px; padding: 12px; text-align: center; }
    .auto-stat-value { font-size: 20px; font-weight: 700; }
    .auto-stat-label { font-size: 10px; color: var(--text-secondary); text-transform: uppercase; margin-top: 4px; }
    .btn { padding: 8px 16px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-secondary); color: var(--text-primary); font-size: 13px; font-weight: 500; cursor: pointer; }
    .btn-primary { background: var(--info); border-color: var(--info); color: white; }
  `;

  private stats = [
    { label: 'Active Playbooks', value: '12', color: 'var(--success)' },
    { label: 'Automated Today', value: '847', color: 'var(--info)' },
    { label: 'MTTR', value: '18 min', color: 'var(--warning)' },
    { label: 'Escalations', value: '23', color: 'var(--danger)' },
  ];

  private playbooks = [
    { name: 'Phishing Response', category: 'Email Security', status: 'automated', runs: 156, avgTime: '4 min', success: 98 },
    { name: 'Ransomware Detection', category: 'Malware', status: 'active', runs: 23, avgTime: '2 min', success: 100 },
    { name: 'Brute Force Detection', category: 'Auth', status: 'automated', runs: 312, avgTime: '1 min', success: 95 },
    { name: 'Data Exfil Alert', category: 'DLP', status: 'manual', runs: 45, avgTime: '15 min', success: 89 },
    { name: 'Insider Threat', category: 'Behavior', status: 'active', runs: 12, avgTime: '8 min', success: 92 },
  ];

  private automationFlow = [
    { name: 'Alert Triggered', desc: 'SIEM/EDR detection', icon: 'A', color: '#ef4444' },
    { name: 'Enrichment', desc: 'Gather IOC context', icon: 'E', color: '#3b82f6' },
    { name: 'Classification', desc: 'Determine severity', icon: 'C', color: '#8b5cf6' },
    { name: 'Auto-Response', desc: 'Block/isolate/notify', icon: 'R', color: '#22c55e' },
    { name: 'Documentation', desc: 'Create ticket/log', icon: 'D', color: '#f59e0b' },
  ];

  private metrics = [
    { name: 'Mean Time to Detect (MTTD)', value: '4.2 min' },
    { name: 'Mean Time to Respond (MTTR)', value: '18 min' },
    { name: 'Mean Time to Resolve', value: '2.4 hrs' },
    { name: 'False Positive Rate', value: '12%' },
    { name: 'Automation Rate', value: '78%' },
    { name: 'Alert Closure Time', value: '6 min' },
  ];

  render() {
    return html`
      <div class="panel" role="region" aria-label="SOC Workflow Automation">
        <div class="header">
          <h2 class="title"><span class="title-icon">SW</span> SOC Workflow Automation</h2>
          <div style="display: flex; gap: 8px;">
            <button class="btn">View Logs</button>
            <button class="btn btn-primary">Create Playbook</button>
          </div>
        </div>

        <div class="stats-grid" role="status">
          ${this.stats.map(s => html`<div class="stat-card"><div class="stat-value" style="color: ${s.color}">${s.value}</div><div class="stat-label">${s.label}</div></div>`)}
        </div>

        <div class="content-grid">
          <div>
            <div class="card">
              <div class="card-title">Incident Response Playbooks</div>
              <div class="playbook-list">
                ${this.playbooks.map(p => html`
                  <div class="playbook-item ${p.status}">
                    <div class="playbook-header">
                      <span class="playbook-name">${p.name}</span>
                      <span class="playbook-badge badge-${p.status}">${p.status}</span>
                    </div>
                    <div class="playbook-meta">${p.category} | ${p.runs} runs today</div>
                    <div class="playbook-stats">
                      <span class="playbook-stat">Avg: ${p.avgTime}</span>
                      <span class="playbook-stat">Success: ${p.success}%</span>
                    </div>
                  </div>
                `)}
              </div>
            </div>

            <div class="card">
              <div class="card-title">Workflow Automation Flow</div>
              <div class="automation-flow">
                ${this.automationFlow.map((step, i) => html`
                  <div class="flow-step">
                    <div class="flow-step-num">${i + 1}</div>
                    <div class="flow-step-content">
                      <div class="flow-step-name">${step.name}</div>
                      <div class="flow-step-desc">${step.desc}</div>
                    </div>
                    <div class="flow-step-icon" style="background: ${step.color}20; color: ${step.color}">${step.icon}</div>
                  </div>
                `)}
              </div>
            </div>
          </div>

          <div>
            <div class="card">
              <div class="card-title">SOC Metrics</div>
              <div class="metrics-timeline">
                ${this.metrics.map(m => html`
                  <div class="metric-item">
                    <span class="metric-name">${m.name}</span>
                    <span class="metric-value">${m.value}</span>
                  </div>
                `)}
              </div>
              <div class="automation-stats">
                <div class="auto-stat"><div class="auto-stat-value" style="color: var(--success)">78%</div><div class="auto-stat-label">Auto Resolved</div></div>
                <div class="auto-stat"><div class="auto-stat-value" style="color: var(--info)">1.2K</div><div class="auto-stat-label">Actions/day</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-soc-workflow-automation': ScSocWorkflowAutomation; } }

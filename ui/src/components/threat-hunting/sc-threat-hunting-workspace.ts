/**
 * sc-threat-hunting-workspace - Threat Hunting Workspace
 * Interactive threat hunting interface with hypothesis builder and IOCs
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-threat-hunting-workspace')
export class ScThreatHuntingWorkspace extends LitElement {
  static styles = css`
    :host { display: block; --primary: #00ff88; --secondary: #00aaff; --danger: #ff4444; --warning: #ffaa00; --success: #10b981; --purple: #a855f7; --bg-dark: #0a0e17; --bg-card: #141b26; --bg-card-hover: #1a2536; --text-primary: #ffffff; --text-secondary: #8899aa; --border: #2a3a4a; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .workspace { background: var(--bg-dark); min-height: 100vh; color: var(--text-primary); padding: 24px; font-family: 'Inter', system-ui, sans-serif; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
    .title { font-size: 24px; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 12px; }
    .header-actions { display: flex; gap: 12px; }
    .btn { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-primary); font-size: 13px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
    .btn:hover { background: var(--bg-card-hover); border-color: var(--primary); }
    .btn-primary { background: linear-gradient(135deg, var(--primary), #00cc6a); color: var(--bg-dark); border: none; }
    .main-grid { display: grid; grid-template-columns: 1fr 400px; gap: 24px; }
    .card { background: var(--bg-card); border-radius: 12px; padding: 20px; border: 1px solid var(--border); margin-bottom: 20px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .card-title { font-size: 15px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
    .card-title::before { content: ''; width: 3px; height: 16px; border-radius: 2px; background: var(--primary); }
    .hypothesis-builder { display: flex; flex-direction: column; gap: 12px; }
    .hypothesis-input { width: 100%; padding: 14px 16px; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); font-size: 14px; font-family: inherit; resize: vertical; min-height: 100px; }
    .hypothesis-input:focus { outline: none; border-color: var(--primary); }
    .hypothesis-input::placeholder { color: var(--text-secondary); }
    .templates { display: flex; flex-wrap: wrap; gap: 8px; }
    .template-chip { padding: 6px 12px; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 20px; font-size: 12px; color: var(--text-secondary); cursor: pointer; transition: all 0.2s; }
    .template-chip:hover { border-color: var(--primary); color: var(--primary); }
    .query-editor { background: var(--bg-dark); border-radius: 8px; padding: 16px; font-family: 'Fira Code', 'Monaco', monospace; font-size: 13px; }
    .query-line { display: flex; gap: 8px; margin-bottom: 4px; }
    .line-num { color: var(--text-secondary); opacity: 0.5; width: 24px; text-align: right; user-select: none; }
    .keyword { color: var(--purple); }
    .string { color: var(--success); }
    .field { color: var(--secondary); }
    .operator { color: var(--warning); }
    .ioc-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .ioc-card { background: var(--bg-dark); border-radius: 8px; padding: 14px; border: 1px solid var(--border); }
    .ioc-type { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); margin-bottom: 6px; }
    .ioc-value { font-size: 13px; font-family: 'Fira Code', monospace; color: var(--primary); word-break: break-all; }
    .ioc-actions { display: flex; gap: 8px; margin-top: 10px; }
    .ioc-btn { padding: 4px 10px; font-size: 11px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 4px; color: var(--text-secondary); cursor: pointer; }
    .ioc-btn:hover { border-color: var(--primary); color: var(--primary); }
    .results-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .results-table th { text-align: left; padding: 12px 8px; color: var(--text-secondary); text-transform: uppercase; font-size: 11px; border-bottom: 1px solid var(--border); }
    .results-table td { padding: 12px 8px; border-bottom: 1px solid var(--border); }
    .results-table tr:hover td { background: var(--bg-card-hover); }
    .severity-badge { padding: 3px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .severity-high { background: rgba(255,68,68,0.2); color: var(--danger); }
    .severity-medium { background: rgba(255,170,0,0.2); color: var(--warning); }
    .severity-low { background: rgba(0,255,136,0.2); color: var(--success); }
    .mitre-matrix { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; }
    .mitre-cell { padding: 8px 4px; text-align: center; font-size: 10px; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
    .mitre-cell:hover { transform: scale(1.1); z-index: 1; }
    .mitre-header { font-weight: 600; color: var(--text-secondary); background: var(--bg-dark); }
    .active-hunt { border: 2px solid var(--primary); background: rgba(0,255,136,0.1); }
    .timeline { display: flex; flex-direction: column; gap: 12px; }
    .timeline-item { display: flex; gap: 12px; padding: 12px; background: var(--bg-dark); border-radius: 8px; border-left: 3px solid var(--primary); }
    .timeline-time { font-size: 11px; color: var(--text-secondary); min-width: 60px; }
    .timeline-content { flex: 1; }
    .timeline-title { font-size: 13px; font-weight: 500; margin-bottom: 4px; }
    .timeline-desc { font-size: 12px; color: var(--text-secondary); }
    .stats-row { display: flex; gap: 16px; margin-bottom: 16px; }
    .stat-item { background: var(--bg-dark); padding: 12px 20px; border-radius: 8px; text-align: center; flex: 1; }
    .stat-value { font-size: 24px; font-weight: 700; color: var(--primary); }
    .stat-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; }
    @media (max-width: 1200px) { .main-grid { grid-template-columns: 1fr; } .mitre-matrix { grid-template-columns: repeat(4, 1fr); } }
    @media (max-width: 768px) { .ioc-grid { grid-template-columns: 1fr; } .mitre-matrix { grid-template-columns: repeat(2, 1fr); } }
  `;

  @state() private hypothesis = '';
  @state() private isHunting = false;
  @state() private huntProgress = 0;

  private templates = [
    'Lateral movement via SMB',
    'Suspicious PowerShell execution',
    'Data exfiltration patterns',
    'Unauthorized access attempts',
    'Malware beaconing detection',
    'Privilege escalation indicators'
  ];

  private queryLines = [
    { num: 1, content: [{ text: 'search ', type: 'keyword' }, { text: 'connection_logs', type: 'field' }] },
    { num: 2, content: [{ text: '| where ', type: 'keyword' }, { text: 'destination', type: 'field' }, { text: ' contains ', type: 'operator' }, { text: '"suspicious-domain"', type: 'string' }] },
    { num: 3, content: [{ text: '| where ', type: 'keyword' }, { text: 'bytes_out', type: 'field' }, { text: ' > ', type: 'operator' }, { text: '1000000', type: '' }] },
    { num: 4, content: [{ text: '| summarize ', type: 'keyword' }, { text: 'count()', type: 'field' }, { text: ' by ', type: 'keyword' }, { text: 'source_ip', type: 'field' }] },
  ];

  private iocs = [
    { type: 'IP Address', value: '185.220.101.42', count: 23 },
    { type: 'Domain', value: 'malicious-c2.darkdomain.io', count: 8 },
    { type: 'File Hash', value: 'a1b2c3d4e5f6789...', count: 3 },
    { type: 'URL', value: 'https://evil.com/payload.exe', count: 12 },
    { type: 'Email', value: 'phishing@spam-domain.com', count: 45 },
    { type: 'Registry', value: 'HKLM\\Software\\...', count: 2 },
  ];

  private huntResults = [
    { time: '14:32:15', source: '10.0.1.45', destination: '185.220.101.42', protocol: 'HTTPS', bytes: '2.4MB', severity: 'high' },
    { time: '14:31:58', source: '10.0.1.87', destination: 'malicious-c2.darkdomain.io', protocol: 'DNS', bytes: '156B', severity: 'medium' },
    { time: '14:31:42', source: '10.0.1.23', destination: '185.220.101.42', protocol: 'HTTP', bytes: '890KB', severity: 'high' },
    { time: '14:30:15', source: 'WORKSTATION-03', destination: 'evil.com', protocol: 'HTTPS', bytes: '1.2MB', severity: 'low' },
  ];

  private mitreTactics = ['Initial Access', 'Execution', 'Persistence', 'Privilege Esc', 'Defense Evasion', 'C2'];
  private mitreTechniques = [
    ['Phishing', 'Exploit Pub', 'Account Create', 'SID History', 'Hidden Files', 'Daily Call'],
    ['Scripting', 'User Exec', 'Boot Auth', 'Token theft', 'Clear Logs', 'DGA'],
    ['Drive-by', 'CMSTP', 'Services', 'UAC Bypass', 'MASQ Trig', 'Dead Drop'],
  ];

  private huntTimeline = [
    { time: '14:32:15', title: 'Hypothesis Created', desc: 'Suspicious outbound connections detected' },
    { time: '14:32:20', title: 'Query Executed', desc: 'Scanned 2.4M log entries' },
    { time: '14:32:45', title: 'IOC Matched', desc: 'Found 23 connections to known bad IP' },
    { time: '14:33:10', title: 'Alert Generated', desc: 'SOC notified for investigation' },
  ];

  private startHunt() {
    this.isHunting = true;
    this.huntProgress = 0;
    const interval = setInterval(() => {
      this.huntProgress += 10;
      if (this.huntProgress >= 100) {
        clearInterval(interval);
        this.isHunting = false;
      }
    }, 300);
  }

  render() {
    return html`
      <div class="workspace" role="main" aria-label="Threat Hunting Workspace">
        <header class="header">
          <h1 class="title"><span>🎯</span> Threat Hunting Workspace</h1>
          <div class="header-actions">
            <button class="btn" aria-label="Save hunt">💾 Save</button>
            <button class="btn btn-primary" @click=${this.startHunt} ?disabled=${this.isHunting}>
              ${this.isHunting ? '⏳ Hunting...' : '🚀 Start Hunt'}
            </button>
          </div>
        </header>

        ${this.isHunting ? html`
          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-value">${this.huntProgress}%</div>
              <div class="stat-label">Progress</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">2.4M</div>
              <div class="stat-label">Logs Scanned</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">47</div>
              <div class="stat-label">Matches Found</div>
            </div>
          </div>
        ` : ''}

        <div class="main-grid">
          <div>
            <section class="card" aria-label="Hypothesis Builder">
              <div class="card-header">
                <h2 class="card-title">Hypothesis Builder</h2>
              </div>
              <div class="hypothesis-builder">
                <textarea 
                  class="hypothesis-input" 
                  placeholder="Enter your hunting hypothesis...&#10;Example: I suspect lateral movement via SMB from compromised workstations to file servers"
                  .value=${this.hypothesis}
                  @input=${(e: any) => this.hypothesis = e.target.value}
                  aria-label="Hypothesis input"
                ></textarea>
                <div>
                  <span style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; display: block;">Quick Templates:</span>
                  <div class="templates">
                    ${this.templates.map(t => html`
                      <button class="template-chip" @click=${() => this.hypothesis = t}>${t}</button>
                    `)}
                  </div>
                </div>
              </div>
            </section>

            <section class="card" aria-label="Query Editor">
              <div class="card-header">
                <h2 class="card-title">KQL Query Editor</h2>
                <button class="btn" style="padding: 4px 10px; font-size: 11px;">▶ Run</button>
              </div>
              <div class="query-editor" role="application" aria-label="Query editor">
                ${this.queryLines.map(line => html`
                  <div class="query-line">
                    <span class="line-num">${line.num}</span>
                    ${line.content.map(token => html`<span class="${token.type}">${token.text}</span>`)}
                  </div>
                `)}
              </div>
            </section>

            <section class="card" aria-label="Hunt Results">
              <div class="card-header">
                <h2 class="card-title">Hunt Results</h2>
                <span style="font-size: 12px; color: var(--text-secondary);">47 matches found</span>
              </div>
              <table class="results-table" role="table">
                <thead>
                  <tr>
                    <th scope="col">Time</th>
                    <th scope="col">Source</th>
                    <th scope="col">Destination</th>
                    <th scope="col">Protocol</th>
                    <th scope="col">Data</th>
                    <th scope="col">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.huntResults.map(r => html`
                    <tr>
                      <td>${r.time}</td>
                      <td>${r.source}</td>
                      <td style="color: var(--danger);">${r.destination}</td>
                      <td>${r.protocol}</td>
                      <td>${r.bytes}</td>
                      <td><span class="severity-badge severity-${r.severity}">${r.severity}</span></td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </section>

            <section class="card" aria-label="MITRE ATT&CK Matrix">
              <div class="card-header">
                <h2 class="card-title">MITRE ATT&CK Navigator</h2>
              </div>
              <div class="mitre-matrix" role="grid" aria-label="MITRE ATT&CK tactics">
                <div class="mitre-cell mitre-header"></div>
                ${this.mitreTactics.map(t => html`<div class="mitre-cell mitre-header">${t}</div>`)}
                ${this.mitreTechniques.map(row => html`
                  ${row.map((cell, i) => html`
                    <div class="mitre-cell ${i === 0 ? 'active-hunt' : ''}" 
                         style="background: ${i === 0 ? 'rgba(0,255,136,0.2)' : 'var(--bg-dark)'}; color: ${i === 0 ? 'var(--primary)' : 'var(--text-secondary)'}">
                      ${cell}
                    </div>
                  `)}
                `)}
              </div>
            </section>
          </div>

          <aside>
            <section class="card" aria-label="Active IOCs">
              <div class="card-header">
                <h2 class="card-title">IOC Database</h2>
                <button class="btn" style="padding: 4px 10px; font-size: 11px;">+ Add</button>
              </div>
              <div class="ioc-grid">
                ${this.iocs.map(ioc => html`
                  <div class="ioc-card">
                    <div class="ioc-type">${ioc.type}</div>
                    <div class="ioc-value">${ioc.value}</div>
                    <div style="font-size: 11px; color: var(--text-secondary); margin-top: 6px;">Seen: ${ioc.count}x</div>
                    <div class="ioc-actions">
                      <button class="ioc-btn">Search</button>
                      <button class="ioc-btn">Block</button>
                    </div>
                  </div>
                `)}
              </div>
            </section>

            <section class="card" aria-label="Hunt Timeline">
              <div class="card-header">
                <h2 class="card-title">Activity Timeline</h2>
              </div>
              <div class="timeline">
                ${this.huntTimeline.map(event => html`
                  <div class="timeline-item">
                    <div class="timeline-time">${event.time}</div>
                    <div class="timeline-content">
                      <div class="timeline-title">${event.title}</div>
                      <div class="timeline-desc">${event.desc}</div>
                    </div>
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
declare global { interface HTMLElementTagNameMap { 'sc-threat-hunting-workspace': ScThreatHuntingWorkspace; } }

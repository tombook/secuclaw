/**
 * SecuClaw Threat Intelligence Panel
 * IOC management, threat actor tracking, and real-time correlation
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-threat-intel-panel')
export class ScThreatIntelPanel extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: var(--text-primary, #e2e8f0); }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary, #111827); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 16px; }
    .title { font-size: 16px; font-weight: 700; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .stat { background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 12px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: 700; }
    .stat-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }
    .search-bar { display: flex; gap: 8px; margin-bottom: 16px; }
    .search-input { flex: 1; padding: 10px 12px; border-radius: 6px; border: 1px solid #374151; background: var(--bg-secondary, #1f2937); color: #e2e8f0; font-size: 13px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 12px; }
    .tab { padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; background: var(--bg-secondary, #1f2937); border: 1px solid #374151; }
    .tab.active { background: #3b82f6; border-color: #3b82f6; color: white; }
    .ioc-list { max-height: 350px; overflow-y: auto; }
    .ioc-item { background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 12px; margin-bottom: 8px; border-left: 4px solid; }
    .ioc-item.critical { border-color: #ef4444; }
    .ioc-item.high { border-color: #f97316; }
    .ioc-item.medium { border-color: #eab308; }
    .ioc-item.low { border-color: #3b82f6; }
    .ioc-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .ioc-value { font-family: monospace; font-size: 13px; font-weight: 600; }
    .ioc-type { padding: 2px 6px; border-radius: 4px; font-size: 10px; background: #1e293b; }
    .ioc-meta { display: flex; gap: 12px; font-size: 11px; color: #94a3b8; margin-top: 6px; }
    .actor-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .actor-card { background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 14px; }
    .actor-name { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
    .actor-aliases { font-size: 11px; color: #94a3b8; margin-bottom: 8px; }
    .actor-tags { display: flex; gap: 4px; flex-wrap: wrap; }
    .actor-tag { padding: 2px 8px; border-radius: 12px; font-size: 10px; background: #1e3a5f; color: #93c5fd; }
    .feed-list { display: flex; flex-direction: column; gap: 8px; }
    .feed-item { background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; }
    .feed-name { font-size: 13px; font-weight: 600; }
    .feed-stats { font-size: 11px; color: #94a3b8; }
    .feed-status { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
    .feed-status.active { background: #052e16; color: #86efac; }
    .feed-status.syncing { background: #422006; color: #fde047; }
    .btn { padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #374151; background: var(--bg-secondary, #1f2937); color: #e2e8f0; }
    .btn.primary { background: #059669; border-color: #059669; color: white; }
  `;

  @state() private activeTab = 'iocs';
  @state() private searchQuery = '';
  @state() private iocs: any[] = [
    { id: 'ioc-001', type: 'ipv4', value: '185.220.101.134', threatType: 'C2 Server', severity: 'critical', confidence: 95, source: 'AlienVault OTX', lastSeen: '2h ago', tags: ['ransomware', 'lockbit'] },
    { id: 'ioc-002', type: 'domain', value: 'malware-payload.xyz', threatType: 'Malware Distro', severity: 'high', confidence: 88, source: 'VirusTotal', lastSeen: '4h ago', tags: ['phishing'] },
    { id: 'ioc-003', type: 'hash', value: 'a7f3e2b1c4d5...', threatType: 'Ransomware', severity: 'critical', confidence: 99, source: 'MITRE ATT&CK', lastSeen: '1d ago', tags: ['blackcat', 'alphv'] },
    { id: 'ioc-004', type: 'url', value: 'https://evil-c2.net/api', threatType: 'C2 URL', severity: 'critical', confidence: 92, source: 'ThreatFox', lastSeen: '30m ago', tags: ['apt29'] },
    { id: 'ioc-005', type: 'email', value: 'attacks@evilcorp.xyz', threatType: 'Phishing', severity: 'medium', confidence: 75, source: 'Abuse.ch', lastSeen: '6h ago', tags: ['BEC'] },
  ];

  @state() private actors: any[] = [
    { id: 'actor-001', name: 'LockBit', aliases: ['LockBit 3.0', 'BlackCat'], motivation: 'Financial', capabilities: ['Ransomware', 'Double Extortion'], activeSince: '2019', lastActivity: '2024-04-20', confidence: 95 },
    { id: 'actor-002', name: 'APT29', aliases: ['Cozy Bear', 'The Dukes'], motivation: 'Espionage', capabilities: ['Spear-phishing', 'Supply Chain'], activeSince: '2008', lastActivity: '2024-04-15', confidence: 99 },
    { id: 'actor-003', name: 'Lazarus Group', aliases: ['Hidden Cobra', 'Zinc'], motivation: 'Financial + Espionage', capabilities: ['Financial Theft', 'Destructive Malware'], activeSince: '2007', lastActivity: '2024-04-18', confidence: 98 },
  ];

  @state() private feeds: any[] = [
    { id: 'feed-001', name: 'AlienVault OTX', type: 'OSINT', indicators: 12543, status: 'active', lastSync: '5m ago' },
    { id: 'feed-002', name: 'VirusTotal', type: 'Commercial', indicators: 34210, status: 'active', lastSync: '10m ago' },
    { id: 'feed-003', name: 'ThreatFox', type: 'OSINT', indicators: 8921, status: 'syncing', lastSync: '2m ago' },
    { id: 'feed-004', name: 'CISA KEV', type: 'Government', indicators: 1054, status: 'active', lastSync: '1h ago' },
  ];

  private get filteredIocs(): any[] {
    if (!this.searchQuery) return this.iocs;
    const q = this.searchQuery.toLowerCase();
    return this.iocs.filter(i => i.value.toLowerCase().includes(q) || i.tags.some((t: string) => t.includes(q)));
  }

  render() {
    return html`
      <div class="panel">
        <div class="header">
          <h2 class="title">🎯 Threat Intelligence</h2>
          <div style="display: flex; gap: 8px;">
            <button class="btn" @click=${() => {}}>🔄 Sync All</button>
            <button class="btn primary" @click=${() => {}}>+ Lookup IOC</button>
          </div>
        </div>

        <div class="stats">
          <div class="stat"><div class="stat-value" style="color: #ef4444">${this.iocs.filter(i => i.severity === 'critical').length}</div><div class="stat-label">Critical IOCs</div></div>
          <div class="stat"><div class="stat-value">${this.iocs.length}</div><div class="stat-label">Total IOCs</div></div>
          <div class="stat"><div class="stat-value">${this.actors.length}</div><div class="stat-label">Threat Actors</div></div>
          <div class="stat"><div class="stat-value">${this.feeds.length}</div><div class="stat-label">Active Feeds</div></div>
        </div>

        <div class="search-bar">
          <input class="search-input" type="text" placeholder="Search indicators, actors, tags..." .value=${this.searchQuery} @input=${(e: Event) => this.searchQuery = (e.target as HTMLInputElement).value} />
        </div>

        <div class="tabs">
          <button class="tab ${this.activeTab === 'iocs' ? 'active' : ''}" @click=${() => this.activeTab = 'iocs'}>Indicators</button>
          <button class="tab ${this.activeTab === 'actors' ? 'active' : ''}" @click=${() => this.activeTab = 'actors'}>Threat Actors</button>
          <button class="tab ${this.activeTab === 'feeds' ? 'active' : ''}" @click=${() => this.activeTab = 'feeds'}>Feeds</button>
        </div>

        ${this.activeTab === 'iocs' ? this.renderIocs() : ''}
        ${this.activeTab === 'actors' ? this.renderActors() : ''}
        ${this.activeTab === 'feeds' ? this.renderFeeds() : ''}
      </div>
    `;
  }

  private renderIocs() {
    return html`
      <div class="ioc-list">
        ${this.filteredIocs.map(ioc => html`
          <div class="ioc-item ${ioc.severity}">
            <div class="ioc-header">
              <span class="ioc-value">${ioc.value}</span>
              <span class="ioc-type">${ioc.type}</span>
            </div>
            <div style="font-size: 12px; color: #f97316; font-weight: 600;">${ioc.threatType}</div>
            <div style="font-size: 11px; color: #22c55e; margin-top: 4px;">Confidence: ${ioc.confidence}%</div>
            <div class="ioc-meta">
              <span>📡 ${ioc.source}</span>
              <span>⏱️ ${ioc.lastSeen}</span>
            </div>
            <div class="actor-tags" style="margin-top: 8px;">
              ${ioc.tags.map((t: string) => html`<span class="actor-tag">${t}</span>`)}
            </div>
          </div>
        `)}
      </div>
    `;
  }

  private renderActors() {
    return html`
      <div class="actor-grid">
        ${this.actors.map(actor => html`
          <div class="actor-card">
            <div class="actor-name">${actor.name}</div>
            <div class="actor-aliases">aka: ${actor.aliases.join(', ')}</div>
            <div style="font-size: 11px; margin-bottom: 8px;">
              <span style="color: #94a3b8;">🎯 Motivation:</span> ${actor.motivation}<br/>
              <span style="color: #94a3b8;">⚡ Capabilities:</span> ${actor.capabilities.join(', ')}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8;">
              <span>Since: ${actor.activeSince}</span>
              <span style="color: #22c55e;">Confidence: ${actor.confidence}%</span>
            </div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Last Activity: ${actor.lastActivity}</div>
          </div>
        `)}
      </div>
    `;
  }

  private renderFeeds() {
    return html`
      <div class="feed-list">
        ${this.feeds.map(feed => html`
          <div class="feed-item">
            <div>
              <div class="feed-name">${feed.name}</div>
              <div class="feed-stats">${feed.indicators.toLocaleString()} indicators • Last sync: ${feed.lastSync}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="feed-status ${feed.status}">${feed.status}</span>
              <button class="btn" style="padding: 4px 8px; font-size: 10px;">Sync</button>
            </div>
          </div>
        `)}
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-threat-intel-panel': ScThreatIntelPanel; } }

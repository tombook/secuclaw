/**
 * sc-threat-model-visualization - Threat Model Visualization
 * Interactive threat model with STRIDE, attack trees, and data flow diagrams
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-threat-model-visualization')
export class ScThreatModelVisualization extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --bg-primary: #0f172a;
      --bg-secondary: #1e293b;
      --bg-tertiary: #0a0e17;
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --border-color: #334155;
      --success: #22c55e;
      --warning: #f59e0b;
      --danger: #ef4444;
      --info: #3b82f6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary); border-radius: 12px; padding: 20px; min-height: 600px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color); }
    .title { font-size: 18px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
    .title-icon { width: 28px; height: 28px; background: linear-gradient(135deg, var(--info), var(--danger)); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; }
    .actions { display: flex; gap: 8px; }
    .btn { padding: 8px 16px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    .btn:hover { background: var(--bg-tertiary); border-color: var(--info); }
    .btn-primary { background: var(--info); border-color: var(--info); color: white; }
    .tabs { display: flex; gap: 4px; margin-bottom: 16px; background: var(--bg-secondary); padding: 4px; border-radius: 8px; }
    .tab { flex: 1; padding: 10px 16px; border: none; border-radius: 6px; background: transparent; color: var(--text-secondary); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    .tab:hover { color: var(--text-primary); background: var(--bg-tertiary); }
    .tab.active { background: var(--info); color: white; }
    .content-grid { display: grid; grid-template-columns: 1fr 350px; gap: 16px; }
    .viz-area { background: var(--bg-secondary); border-radius: 8px; padding: 20px; min-height: 400px; position: relative; }
    .dfd-canvas { width: 100%; height: 380px; position: relative; }
    .node { position: absolute; background: var(--bg-tertiary); border: 2px solid var(--border-color); border-radius: 8px; padding: 12px 16px; cursor: pointer; transition: all 0.2s; min-width: 100px; text-align: center; }
    .node:hover { border-color: var(--info); transform: scale(1.02); }
    .node.external { border-color: var(--danger); background: rgba(239,68,68,0.1); }
    .node.process { border-color: var(--info); background: rgba(59,130,246,0.1); }
    .node.data-store { border-color: var(--success); background: rgba(34,197,94,0.1); }
    .node.trust-boundary { border-style: dashed; background: rgba(168,85,247,0.1); border-color: #a855f7; }
    .node-icon { font-size: 20px; margin-bottom: 4px; }
    .node-label { font-size: 11px; font-weight: 600; color: var(--text-primary); }
    .sidebar { display: flex; flex-direction: column; gap: 16px; }
    .stride-matrix { background: var(--bg-secondary); border-radius: 8px; padding: 16px; }
    .stride-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 12px; }
    .stride-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .stride-cell { padding: 10px; border-radius: 6px; text-align: center; cursor: pointer; transition: all 0.2s; }
    .stride-cell:hover { transform: scale(1.05); }
    .stride-cell.active { box-shadow: 0 0 0 2px white; }
    .stride-letter { font-size: 18px; font-weight: 700; margin-bottom: 2px; }
    .stride-name { font-size: 9px; color: var(--text-secondary); text-transform: uppercase; }
    .threat-panel { background: var(--bg-secondary); border-radius: 8px; padding: 16px; max-height: 300px; overflow-y: auto; }
    .threat-item { padding: 10px; border-radius: 6px; margin-bottom: 8px; background: var(--bg-tertiary); border-left: 3px solid; }
    .threat-item:hover { background: var(--bg-primary); }
    .threat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .threat-title { font-size: 12px; font-weight: 600; color: var(--text-primary); }
    .threat-sev { font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
    .threat-desc { font-size: 11px; color: var(--text-secondary); line-height: 1.4; }
    .mitigation-section { margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border-color); }
    .mitigation-title { font-size: 10px; color: var(--success); font-weight: 600; margin-bottom: 4px; }
    .mitigation-item { font-size: 10px; color: var(--text-secondary); }
    .risk-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
    .risk-card { background: var(--bg-secondary); border-radius: 8px; padding: 14px; text-align: center; }
    .risk-value { font-size: 28px; font-weight: 700; }
    .risk-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; }
    .legend { position: absolute; bottom: 16px; left: 16px; background: rgba(30,41,59,0.95); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); }
    .legend-title { font-size: 10px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; }
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-primary); margin-bottom: 4px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 3px; }
    .tree-node { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; }
    .tree-content { background: var(--bg-tertiary); border: 2px solid var(--border-color); border-radius: 8px; padding: 10px 16px; cursor: pointer; transition: all 0.2s; }
    .tree-content:hover { border-color: var(--danger); }
    .tree-content.goal { border-color: var(--danger); background: rgba(239,68,68,0.1); }
    .tree-children { display: flex; gap: 20px; margin-top: 20px; padding-left: 40px; position: relative; }
    .tree-children::before { content: ''; position: absolute; top: -10px; left: 20px; right: 20px; height: 2px; background: var(--border-color); }
    .tree-branch { position: relative; }
    .tree-branch::before { content: ''; position: absolute; top: -10px; left: 50%; width: 2px; height: 10px; background: var(--border-color); }
    .actor-card { display: flex; align-items: center; gap: 12px; padding: 10px; background: var(--bg-tertiary); border-radius: 6px; margin-bottom: 8px; }
    .actor-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; }
    .actor-avatar.external { background: rgba(239,68,68,0.2); }
    .actor-avatar.internal { background: rgba(59,130,246,0.2); }
    .actor-avatar.partner { background: rgba(168,85,247,0.2); }
    .actor-info { flex: 1; }
    .actor-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .actor-meta { font-size: 11px; color: var(--text-secondary); }
    .cap-badge { font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
    .cap-low { background: rgba(34,197,94,0.2); color: var(--success); }
    .cap-medium { background: rgba(234,179,8,0.2); color: #eab308; }
    .cap-high { background: rgba(249,115,22,0.2); color: #f97316; }
    .cap-advanced { background: rgba(239,68,68,0.2); color: var(--danger); }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    .btn:focus-visible, .tab:focus-visible, .node:focus-visible { outline: 2px solid var(--info); outline-offset: 2px; }
  `;

  @state() private activeTab: 'dfd' | 'stride' | 'attack-tree' | 'actors' = 'dfd';
  @state() private selectedStride: string | null = null;

  private strideCategories = [
    { id: 'S', name: 'Spoofing', color: '#ef4444' },
    { id: 'T', name: 'Tampering', color: '#f97316' },
    { id: 'R', name: 'Repudiation', color: '#a855f7' },
    { id: 'I', name: 'Info Disclosure', color: '#eab308' },
    { id: 'D', name: 'DoS', color: '#f59e0b' },
    { id: 'E', name: 'Elevation', color: '#dc2626' },
  ];

  private threats = [
    { stride: 'S', title: 'API Auth Bypass', severity: 'critical', desc: 'JWT manipulation allows auth bypass', mitigations: ['Signed tokens', 'Server validation', 'Short TTL'] },
    { stride: 'T', title: 'SQL Injection', severity: 'high', desc: 'Unsanitized input in DB queries', mitigations: ['Parameterized queries', 'WAF'] },
    { stride: 'R', title: 'Admin Non-Rep', severity: 'medium', desc: 'Shared accounts prevent attribution', mitigations: ['Named accounts', 'Audit logging'] },
    { stride: 'I', title: 'API Data Exposure', severity: 'high', desc: 'Excessive data in API responses', mitigations: ['Field filtering', 'Data masking'] },
    { stride: 'D', title: 'App-layer DDoS', severity: 'critical', desc: 'Slowloris exhausts connections', mitigations: ['Rate limiting', 'CDN'] },
    { stride: 'E', title: 'Container Escape', severity: 'critical', desc: 'Kernel privilege escalation', mitigations: ['Rootless containers', 'Seccomp'] },
  ];

  private threatActors = [
    { name: 'External Attacker', type: 'external', capability: 'high', intent: 'Financial gain', motivation: 'Ransomware' },
    { name: 'Insider Threat', type: 'internal', capability: 'medium', intent: 'Malicious/negligent', motivation: 'Disgruntled' },
    { name: 'Nation-State APT', type: 'external', capability: 'advanced', intent: 'Espionage', motivation: 'Intel gathering' },
    { name: 'Partner/Vendor', type: 'partner', capability: 'medium', intent: 'Supply chain', motivation: 'Access abuse' },
  ];

  private dfdNodes = [
    { label: 'User', type: 'external', x: 50, y: 50 },
    { label: 'Web App', type: 'process', x: 250, y: 50 },
    { label: 'API Gateway', type: 'process', x: 450, y: 50 },
    { label: 'Database', type: 'data-store', x: 650, y: 150 },
    { label: 'Cache', type: 'data-store', x: 450, y: 200 },
    { label: 'DMZ', type: 'trust-boundary', x: 150, y: 150 },
  ];

  private getThreatsByStride(stride: string | null) {
    return stride ? this.threats.filter(t => t.stride === stride) : this.threats;
  }

  private getSeverityClass(sev: string): string {
    const map: Record<string, string> = { critical: 'cap-advanced', high: 'cap-high', medium: 'cap-medium', low: 'cap-low' };
    return map[sev] || '';
  }

  private getNodeIcon(type: string): string {
    const icons: Record<string, string> = { external: 'U', process: 'P', 'data-store': 'D', 'trust-boundary': 'T' };
    return icons[type] || 'X';
  }

  private renderDFDView() {
    return html`
      <div class="viz-area">
        <div class="dfd-canvas" role="img" aria-label="Data Flow Diagram">
          ${this.dfdNodes.map(node => html`
            <div class="node ${node.type}" style="left: ${node.x}px; top: ${node.y}px;" tabindex="0" role="button" aria-label="${node.label}">
              <div class="node-icon">${this.getNodeIcon(node.type)}</div>
              <div class="node-label">${node.label}</div>
            </div>
          `)}
        </div>
        <div class="legend" aria-hidden="true">
          <div class="legend-title">Legend</div>
          <div class="legend-item"><span class="legend-dot" style="background: #ef4444"></span> External Entity</div>
          <div class="legend-item"><span class="legend-dot" style="background: #3b82f6"></span> Process</div>
          <div class="legend-item"><span class="legend-dot" style="background: #22c55e"></span> Data Store</div>
          <div class="legend-item"><span class="legend-dot" style="background: #a855f7"></span> Trust Boundary</div>
        </div>
      </div>
    `;
  }

  private renderStrideView() {
    return html`
      <div class="viz-area">
        <div class="risk-summary">
          <div class="risk-card"><div class="risk-value" style="color: #ef4444">6</div><div class="risk-label">Threats</div></div>
          <div class="risk-card"><div class="risk-value" style="color: #f59e0b">3</div><div class="risk-label">Critical</div></div>
          <div class="risk-card"><div class="risk-value" style="color: #22c55e">8</div><div class="risk-label">Mitigations</div></div>
        </div>
        <div class="stride-grid">
          ${this.strideCategories.map(s => html`
            <div class="stride-cell ${this.selectedStride === s.id ? 'active' : ''}"
              style="background: ${s.color}15; border: 1px solid ${s.color}"
              tabindex="0" @click=${() => { this.selectedStride = this.selectedStride === s.id ? null : s.id; }}>
              <div class="stride-letter" style="color: ${s.color}">${s.id}</div>
              <div class="stride-name">${s.name}</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private renderAttackTreeView() {
    return html`
      <div class="viz-area">
        <div class="tree-node">
          <div class="tree-content goal" tabindex="0">
            <div class="node-icon">*</div><div class="node-label">Compromise Customer Data</div>
          </div>
          <div class="tree-children">
            <div class="tree-branch">
              <div class="tree-node">
                <div class="tree-content" tabindex="0"><div class="node-label">Phishing</div></div>
                <div class="tree-children"><div class="tree-content" tabindex="0"><div class="node-label">Credential Theft</div></div></div>
              </div>
            </div>
            <div class="tree-branch">
              <div class="tree-node">
                <div class="tree-content" tabindex="0"><div class="node-label">SQL Injection</div></div>
                <div class="tree-children"><div class="tree-content" tabindex="0"><div class="node-label">DB Dump</div></div></div>
              </div>
            </div>
            <div class="tree-branch">
              <div class="tree-node">
                <div class="tree-content" tabindex="0"><div class="node-label">Insider Threat</div></div>
                <div class="tree-children"><div class="tree-content" tabindex="0"><div class="node-label">Direct Access</div></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderActorsView() {
    return html`
      <div class="viz-area">
        ${this.threatActors.map(actor => html`
          <div class="actor-card" tabindex="0">
            <div class="actor-avatar ${actor.type}">${actor.type === 'external' ? 'X' : actor.type === 'internal' ? 'I' : 'P'}</div>
            <div class="actor-info">
              <div class="actor-name">${actor.name}</div>
              <div class="actor-meta">${actor.intent} - ${actor.motivation}</div>
            </div>
            <span class="cap-badge cap-${actor.capability}">${actor.capability}</span>
          </div>
        `)}
      </div>
    `;
  }

  private renderSidebar() {
    const threats = this.getThreatsByStride(this.selectedStride);
    return html`
      <div class="stride-matrix">
        <div class="stride-title">Threat Analysis</div>
        <div class="stride-grid">
          ${this.strideCategories.map(s => html`
            <div class="stride-cell ${this.selectedStride === s.id ? 'active' : ''}"
              style="background: ${s.color}15; border: 1px solid ${s.color}"
              tabindex="0" @click=${() => { this.selectedStride = this.selectedStride === s.id ? null : s.id; }}>
              <div class="stride-letter" style="color: ${s.color}">${s.id}</div>
              <div class="stride-name">${s.name}</div>
            </div>
          `)}
        </div>
      </div>
      <div class="threat-panel">
        <div class="stride-title">${this.selectedStride ? 'Threats - ' + this.strideCategories.find(s => s.id === this.selectedStride)?.name : 'All Threats'}</div>
        ${threats.map(t => html`
          <div class="threat-item" style="border-color: ${this.strideCategories.find(s => s.id === t.stride)?.color}" tabindex="0">
            <div class="threat-header">
              <span class="threat-title">${t.title}</span>
              <span class="threat-sev ${this.getSeverityClass(t.severity)}">${t.severity}</span>
            </div>
            <div class="threat-desc">${t.desc}</div>
            <div class="mitigation-section">
              <div class="mitigation-title">Mitigations</div>
              ${t.mitigations.map(m => html`<div class="mitigation-item">- ${m}</div>`)}
            </div>
          </div>
        `)}
      </div>
    `;
  }

  render() {
    return html`
      <div class="panel" role="region" aria-label="Threat Model Visualization">
        <div class="header">
          <h2 class="title"><span class="title-icon">TM</span> Threat Model Visualization</h2>
          <div class="actions">
            <button class="btn" aria-label="Export">Export</button>
            <button class="btn btn-primary" aria-label="Generate report">Generate Report</button>
          </div>
        </div>
        <div class="tabs" role="tablist">
          <button class="tab ${this.activeTab === 'dfd' ? 'active' : ''}" role="tab" @click=${() => this.activeTab = 'dfd'}>Data Flow</button>
          <button class="tab ${this.activeTab === 'stride' ? 'active' : ''}" role="tab" @click=${() => this.activeTab = 'stride'}>STRIDE</button>
          <button class="tab ${this.activeTab === 'attack-tree' ? 'active' : ''}" role="tab" @click=${() => this.activeTab = 'attack-tree'}>Attack Tree</button>
          <button class="tab ${this.activeTab === 'actors' ? 'active' : ''}" role="tab" @click=${() => this.activeTab = 'actors'}>Actors</button>
        </div>
        <div class="content-grid">
          <div>
            ${this.activeTab === 'dfd' ? this.renderDFDView() : nothing}
            ${this.activeTab === 'stride' ? this.renderStrideView() : nothing}
            ${this.activeTab === 'attack-tree' ? this.renderAttackTreeView() : nothing}
            ${this.activeTab === 'actors' ? this.renderActorsView() : nothing}
          </div>
          <div class="sidebar">${this.renderSidebar()}</div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-threat-model-visualization': ScThreatModelVisualization;
  }
}

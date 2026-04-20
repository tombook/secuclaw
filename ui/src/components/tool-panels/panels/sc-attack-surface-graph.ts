/**
 * sc-attack-surface-graph — Attack Surface Analysis (Force-directed Graph)
 * Phase 2: SVG force-directed graph showing assets and attack paths
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface GraphNode {
  id: string; name: string; type: string; risk: number; x: number; y: number;
}
interface GraphEdge { from: string; to: string; risk: 'high' | 'medium' | 'low'; }

@customElement('sc-attack-surface-graph')
export class ScAttackSurfaceGraph extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .panel-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; }
    svg { width: 100%; height: 450px; background: #0a0e17; border-radius: 8px; }
    .node { cursor: pointer; transition: opacity 0.2s; }
    .node:hover { opacity: 0.8; }
    .legend { display: flex; gap: 16px; margin-top: 12px; flex-wrap: wrap; }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #94a3b8; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
    .info-card { background: #1f2937; border-radius: 8px; padding: 14px; margin-top: 12px; border-left: 3px solid #f59e0b; }
    .info-name { font-size: 14px; font-weight: 600; }
    .info-detail { font-size: 12px; color: #94a3b8; margin-top: 4px; line-height: 1.5; }
    .stats { display: flex; gap: 12px; margin-bottom: 16px; }
    .stat { background: #0a0e17; border-radius: 6px; padding: 8px 14px; }
    .stat-val { font-size: 20px; font-weight: 700; }
    .stat-lbl { font-size: 10px; color: #94a3b8; }
  `;

  @state() private _selectedNode: string | null = null;
  @state() private _nodes: GraphNode[] = [];
  @state() private _edges: GraphEdge[] = [];

  connectedCallback() {
    super.connectedCallback();
    // Mock data - positioned in a circular layout
    const cx = 450, cy = 225, r = 180;
    const types = ['server', 'database', 'endpoint', 'cloud', 'firewall', 'container'];
    const names = ['web-prod-01', 'db-master-01', 'api-gateway', 'k8s-node-03', 'nginx-lb-02', 'cache-01', 'vpn-gateway', 'mail-server', 'storage-01', 'dns-server', 'cd-server', 'fw-core', 'web-prod-02', 'db-replica', 'endpoint-42'];
    this._nodes = names.map((name, i) => {
      const angle = (2 * Math.PI * i) / names.length - Math.PI / 2;
      return {
        id: `n${i}`, name, type: types[i % types.length],
        risk: [9.1, 7.8, 6.5, 9.8, 7.5, 7.2, 5.9, 7.9, 8.2, 5.3, 9.0, 3.2, 9.5, 7.6, 4.1][i],
        x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle),
      };
    });
    this._edges = [
      { from: 'n0', to: 'n1', risk: 'high' }, { from: 'n0', to: 'n4', risk: 'high' },
      { from: 'n0', to: 'n12', risk: 'medium' }, { from: 'n1', to: 'n13', risk: 'high' },
      { from: 'n2', to: 'n1', risk: 'medium' }, { from: 'n3', to: 'n2', risk: 'high' },
      { from: 'n3', to: 'n1', risk: 'high' }, { from: 'n5', to: 'n1', risk: 'medium' },
      { from: 'n6', to: 'n11', risk: 'low' }, { from: 'n7', to: 'n2', risk: 'medium' },
      { from: 'n8', to: 'n1', risk: 'high' }, { from: 'n9', to: 'n11', risk: 'low' },
      { from: 'n10', to: 'n3', risk: 'high' }, { from: 'n11', to: 'n0', risk: 'medium' },
      { from: 'n14', to: 'n0', risk: 'low' },
    ];
  }

  private _nodeColor(type: string): string {
    const colors: Record<string, string> = { server: '#3b82f6', database: '#8b5cf6', endpoint: '#22c55e', cloud: '#f59e0b', firewall: '#ef4444', container: '#06b6d4' };
    return colors[type] || '#6b7280';
  }

  private _riskColor(risk: number): string {
    if (risk >= 9) return '#ef4444'; if (risk >= 7) return '#f97316'; if (risk >= 5) return '#eab308'; return '#22c55e';
  }

  render() {
    const selected = this._nodes.find(n => n.id === this._selectedNode);
    const critCount = this._nodes.filter(n => n.risk >= 9).length;
    const highCount = this._nodes.filter(n => n.risk >= 7 && n.risk < 9).length;
    return html`<div class="panel">
      <div class="panel-title">🕸️ Attack Surface Analysis</div>
      <div class="stats">
        <div class="stat"><div class="stat-val" style="color:#ef4444">${critCount}</div><div class="stat-lbl">Critical</div></div>
        <div class="stat"><div class="stat-val" style="color:#f97316">${highCount}</div><div class="stat-lbl">High Risk</div></div>
        <div class="stat"><div class="stat-val" style="color:#3b82f6">${this._nodes.length}</div><div class="stat-lbl">Assets</div></div>
        <div class="stat"><div class="stat-val" style="color:#8b5cf6">${this._edges.length}</div><div class="stat-lbl">Connections</div></div>
      </div>
      <svg viewBox="0 0 900 450">
        ${this._edges.map(e => {
          const from = this._nodes.find(n => n.id === e.from)!;
          const to = this._nodes.find(n => n.id === e.to)!;
          const color = e.risk === 'high' ? '#ef4444' : e.risk === 'medium' ? '#f97316' : '#22c55e';
          return html`<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${color}" stroke-width="${e.risk === 'high' ? 2 : 1}" opacity="0.4"/>`;
        })}
        ${this._nodes.map(n => {
          const size = 8 + (n.risk / 10) * 12;
          const isSelected = this._selectedNode === n.id;
          return html`<g class="node" @click=${() => this._selectedNode = n.id}>
            <circle cx="${n.x}" cy="${n.y}" r="${size}" fill="${this._nodeColor(n.type)}" opacity="${isSelected ? 1 : 0.7}" stroke="${isSelected ? '#fff' : 'none'}" stroke-width="2"/>
            <text x="${n.x}" y="${n.y + size + 14}" text-anchor="middle" fill="#94a3b8" font-size="10">${n.name}</text>
            <text x="${n.x}" y="${n.y + 4}" text-anchor="middle" fill="#fff" font-size="9" font-weight="700">${n.risk.toFixed(1)}</text>
          </g>`;
        })}
      </svg>
      <div class="legend">
        ${['server|Server|#3b82f6', 'database|Database|#8b5cf6', 'endpoint|Endpoint|#22c55e', 'cloud|Cloud|#f59e0b', 'firewall|Firewall|#ef4444', 'container|Container|#06b6d4'].map(item => {
          const [label, _, color] = item.split('|');
          return html`<div class="legend-item"><div class="legend-dot" style="background:${color}"></div>${label}</div>`;
        })}
      </div>
      ${selected ? html`<div class="info-card">
        <div class="info-name">${selected.name} (${selected.type})</div>
        <div class="info-detail">Risk Score: <span style="color:${this._riskColor(selected.risk)}">${selected.risk.toFixed(1)}</span> / 10<br/>
        Connected to: ${this._edges.filter(e => e.from === selected.id || e.to === selected.id).length} assets<br/>
        High-risk paths: ${this._edges.filter(e => (e.from === selected.id || e.to === selected.id) && e.risk === 'high').length}</div>
      </div>` : nothing}
    </div>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-attack-surface-graph': ScAttackSurfaceGraph; } }

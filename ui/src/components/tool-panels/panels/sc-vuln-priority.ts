/**
 * sc-vuln-priority — Vulnerability Prioritization (Security Expert Core)
 * CVSS vs EPSS scatter plot + CISA KEV filter + Asset criticality bubbles
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface Vuln { cve: string; cvss: number; epss: number; kev: boolean; asset: string; criticality: number; priority: string; detail: string; }

@customElement('sc-vuln-priority')
export class ScVulnPriority extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 16px; }
    .tab { padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; background: #1f2937; border: 1px solid #374151; color: #94a3b8; transition: all 0.2s; }
    .tab.active { background: #f59e0b; color: #111827; border-color: #f59e0b; }
    .stats { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .stat { background: #0a0e17; border-radius: 6px; padding: 8px 12px; min-width: 70px; }
    .sv { font-size: 18px; font-weight: 700; }
    .sl { font-size: 10px; color: #94a3b8; }
    svg { width: 100%; height: 260px; }
    .axis-label { fill: #6b7280; font-size: 10px; }
    .grid-line { stroke: #1f2937; stroke-width: 1; }
    .items { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; max-height: 300px; overflow-y: auto; }
    .item { background: #1f2937; border: 1px solid #374151; border-radius: 6px; padding: 10px 12px; font-size: 12px; }
    .item-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .item-name { font-weight: 600; font-size: 13px; }
    .badge { font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .p1 { background: #450a0a; color: #fca5a5; } .p2 { background: #431407; color: #fdba74; }
    .p3 { background: #422006; color: #fde047; } .p4 { background: #052e16; color: #86efac; }
    .kev { background: #7f1d1d; color: #fecaca; }
    .sb { padding: 8px 12px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 13px; width: 100%; margin-bottom: 10px; outline: none; }
    .sb:focus { border-color: #f59e0b; }
  `;

  @state() private _filter = 'all';
  @state() private _q = '';

  private _data: Vuln[] = [
    { cve: 'CVE-2026-1234', cvss: 10.0, epss: 94.2, kev: true, asset: 'Production DB', criticality: 5, priority: 'P1', detail: 'Log4Shell v2 RCE. 23 assets affected. Patch available. EPSS 94%.' },
    { cve: 'CVE-2026-1156', cvss: 9.8, epss: 87.5, kev: true, asset: 'Web Frontend', criticality: 4, priority: 'P1', detail: 'Spring4Shell. 8 assets. Patch in progress (3/8 done).' },
    { cve: 'CVE-2026-2345', cvss: 8.6, epss: 62.1, kev: false, asset: 'TLS Endpoints', criticality: 3, priority: 'P2', detail: 'OpenSSL buffer overread. 156 endpoints.' },
    { cve: 'CVE-2026-3456', cvss: 7.5, epss: 41.3, kev: false, asset: 'Redis Cluster', criticality: 4, priority: 'P2', detail: 'Redis auth bypass. 12 instances (patched).' },
    { cve: 'CVE-2026-4567', cvss: 7.2, epss: 28.7, kev: false, asset: 'Nginx Proxies', criticality: 2, priority: 'P3', detail: 'Nginx misconfig info disclosure. 5 proxies.' },
    { cve: 'CVE-2026-5678', cvss: 6.5, epss: 15.4, kev: false, asset: 'Internal Wiki', criticality: 1, priority: 'P3', detail: 'Confluence RCE (authenticated). 2 instances.' },
    { cve: 'CVE-2026-6789', cvss: 5.3, epss: 8.2, kev: false, asset: 'Legacy Apps', criticality: 2, priority: 'P4', detail: 'jQuery XSS. 4 internal apps. Low exposure.' },
    { cve: 'CVE-2026-7890', cvss: 4.1, epss: 2.3, kev: false, asset: 'Dev Tools', criticality: 1, priority: 'P4', detail: 'Dev tool DoS. Minimal business impact.' },
    { cve: 'CVE-2026-8901', cvss: 9.1, epss: 78.9, kev: true, asset: 'Payment API', criticality: 5, priority: 'P1', detail: 'Payment gateway RCE. Active exploitation.' },
    { cve: 'CVE-2026-9012', cvss: 6.8, epss: 12.1, kev: false, asset: 'CDN', criticality: 3, priority: 'P3', detail: 'CDN cache poisoning. Mitigation in place.' },
    { cve: 'CVE-2026-0123', cvss: 8.0, epss: 55.0, kev: false, asset: 'Auth Service', criticality: 5, priority: 'P2', detail: 'OAuth token manipulation. High asset value.' },
    { cve: 'CVE-2026-0456', cvss: 3.5, epss: 1.1, kev: false, asset: 'Print Server', criticality: 1, priority: 'P4', detail: 'Print spooler info leak. No external exposure.' },
  ];

  render() {
    const q = this._q.toLowerCase();
    let filtered = this._data;
    if (this._filter === 'kev') filtered = filtered.filter(v => v.kev);
    else if (this._filter === 'p1') filtered = filtered.filter(v => v.priority === 'P1');
    else if (this._filter === 'p2') filtered = filtered.filter(v => v.priority === 'P2');
    if (q) filtered = filtered.filter(v => v.cve.toLowerCase().includes(q) || v.asset.toLowerCase().includes(q));
    const p1 = filtered.filter(v => v.priority === 'P1').length;
    const p2 = filtered.filter(v => v.priority === 'P2').length;
    const w = 500, h = 240, pad = 40;
    const xScale = (v: number) => pad + (v / 10) * (w - pad * 2);
    const yScale = (v: number) => h - pad - (v / 100) * (h - pad * 2);
    const color = (v: Vuln) => v.kev ? '#ef4444' : v.epss > 50 ? '#f97316' : v.epss > 15 ? '#eab308' : '#22c55e';
    const r = (v: Vuln) => 4 + v.criticality * 2;
    return html`<div class="panel">
      <div class="pt">🎯 Vulnerability Prioritization (CVSS × EPSS)</div>
      <input class="sb" placeholder="Search CVE or asset..." .value=${this._q} @input=${(e: Event) => { this._q = (e.target as HTMLInputElement).value; }}/>
      <div class="tabs">
        <span class="tab ${this._filter === 'all' ? 'active' : ''}" @click=${() => { this._filter = 'all'; }}>All (${this._data.length})</span>
        <span class="tab ${this._filter === 'kev' ? 'active' : ''}" @click=${() => { this._filter = 'kev'; }}>CISA KEV</span>
        <span class="tab ${this._filter === 'p1' ? 'active' : ''}" @click=${() => { this._filter = 'p1'; }}>P1</span>
        <span class="tab ${this._filter === 'p2' ? 'active' : ''}" @click=${() => { this._filter = 'p2'; }}>P2</span>
      </div>
      <div class="stats">
        <div class="stat"><div class="sv" style="color:#ef4444">${p1}</div><div class="sl">P1 Critical</div></div>
        <div class="stat"><div class="sv" style="color:#f97316">${p2}</div><div class="sl">P2 High</div></div>
        <div class="stat"><div class="sv">${filtered.length}</div><div class="sl">Showing</div></div>
      </div>
      <svg viewBox="0 0 ${w} ${h}">
        <text x="${w/2}" y="14" text-anchor="middle" class="axis-label">CVSS vs EPSS (bubble = asset criticality)</text>
        ${[0,2,4,6,8,10].map(v => html`<line x1="${xScale(v)}" y1="${pad}" x2="${xScale(v)}" y2="${h-pad}" class="grid-line"/><text x="${xScale(v)}" y="${h-pad+14}" text-anchor="middle" class="axis-label">${v}</text>`)}
        ${[0,25,50,75,100].map(v => html`<line x1="${pad}" y1="${yScale(v)}" x2="${w-pad}" y2="${yScale(v)}" class="grid-line"/><text x="${pad-4}" y="${yScale(v)+3}" text-anchor="end" class="axis-label">${v}%</text>`)}
        <text x="${w/2}" y="${h-2}" text-anchor="middle" class="axis-label">CVSS Score</text>
        <text x="6" y="${h/2}" text-anchor="middle" class="axis-label" transform="rotate(-90,6,${h/2})">EPSS %</text>
        ${filtered.map(v => html`<circle cx="${xScale(v.cvss)}" cy="${yScale(v.epss)}" r="${r(v)}" fill="${color(v)}" fill-opacity="${v.kev ? 0.9 : 0.6}" stroke="${color(v)}" stroke-width="1"><title>${v.cve} | CVSS ${v.cvss} | EPSS ${v.epss}% | ${v.asset} | ${v.priority}</title></circle>`)}
      </svg>
      <div class="items">${filtered.slice(0, 8).map(v => html`<div class="item">
        <div class="item-head"><span class="item-name">${v.cve} | ${v.asset}</span><span><span class="badge ${v.priority.toLowerCase()}">${v.priority}</span>${v.kev ? html` <span class="badge kev">KEV</span>` : nothing}</span></div>
        <div style="color:#94a3b8">CVSS ${v.cvss} | EPSS ${v.epss}% | ${v.detail}</div>
      </div>`)}</div>
    </div>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-vuln-priority': ScVulnPriority; } }

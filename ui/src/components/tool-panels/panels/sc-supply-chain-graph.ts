/**
 * sc-supply-chain-graph — 🔗 Supply Chain Attack Path
 * Phase 2+ Evolution Component — Interactive
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface MockItem { name: string; status: string; risk: string; detail: string; }

@customElement('sc-supply-chain-graph')
export class Scusupplyuchainugraph extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .panel-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .search-box { padding: 8px 12px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 13px; width: 100%; margin-bottom: 12px; outline: none; }
    .search-box:focus { border-color: #f59e0b; }
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; }
    .card { background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 14px; transition: all 0.2s; cursor: pointer; }
    .card:hover { border-color: #60a5fa; transform: translateY(-1px); }
    .card-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
    .card-detail { font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 6px; }
    .card-meta { display: flex; gap: 6px; flex-wrap: wrap; }
    .badge { font-size: 10px; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
    .badge-green { background: #052e16; color: #86efac; }
    .badge-red { background: #450a0a; color: #fca5a5; }
    .badge-yellow { background: #422006; color: #fde047; }
    .badge-blue { background: #172554; color: #93c5fd; }
    .badge-purple { background: #2e1065; color: #c4b5fd; }
    .stat-row { display: flex; gap: 12px; margin-bottom: 16px; }
    .stat { background: #0a0e17; border-radius: 6px; padding: 10px 16px; flex: 1; }
    .stat-val { font-size: 22px; font-weight: 700; }
    .stat-lbl { font-size: 10px; color: #94a3b8; text-transform: uppercase; }
    .empty { text-align: center; padding: 30px; color: #6b7280; }
  `;

  @state() private _query = '';

  private _items: MockItem[] = [
    {name:'Vendor A - Cloud Hosting', status:'active', risk:'critical', detail:'No SOC2 certification. 3 open findings. Access to production data.'},
    {name:'Vendor B - Payment Processor', status:'active', risk:'high', detail:'PCI-DSS Level 1. Annual audit due Q3.'},
    {name:'Vendor C - Email Service', status:'active', risk:'medium', detail:'SOC2 Type II certified. Monthly SLA review.'},
    {name:'npm/log4j@2.14.1', status:'vulnerable', risk:'critical', detail:'CVE-2026-1234. CVSS 9.1. Used in 3 services.'},
    {name:'npm/spring-boot@2.7.0', status:'vulnerable', risk:'high', detail:'3 known CVEs. Upgrade path available.'},
    {name:'Docker Base Image', status:'warning', risk:'medium', detail:'Alpine 3.18. 12 packages need update.'},

  ];

  render() {
    const filtered = this._query
      ? this._items.filter(i => i.name.toLowerCase().includes(this._query.toLowerCase()) || i.detail.toLowerCase().includes(this._query.toLowerCase()))
      : this._items;
    return html`
      <div class="panel">
        <div class="panel-title">🔗 Supply Chain Attack Path</div>
        <input class="search-box" type="text" placeholder="Search..." .value=${this._query} @input=${(e: Event) => this._query = (e.target as HTMLInputElement).value} />
        <div class="stat-row">
          <div class="stat"><div class="stat-val">${filtered.length}</div><div class="stat-lbl">Total</div></div>
          <div class="stat"><div class="stat-val" style="color:#ef4444">${filtered.filter(i => i.risk === 'critical').length}</div><div class="stat-lbl">Critical</div></div>
          <div class="stat"><div class="stat-val" style="color:#f97316">${filtered.filter(i => i.risk === 'high').length}</div><div class="stat-lbl">High</div></div>
          <div class="stat"><div class="stat-val" style="color:#22c55e">${filtered.filter(i => i.status === 'pass').length}</div><div class="stat-lbl">Pass</div></div>
        </div>
        <div class="cards">
          ${filtered.map(item => html`
            <div class="card">
              <div class="card-name">${item.name}</div>
              <div class="card-detail">${item.detail}</div>
              <div class="card-meta">
                <span class="badge badge-${item.risk === 'critical' ? 'red' : item.risk === 'high' ? 'yellow' : item.status === 'pass' ? 'green' : 'blue'}">${item.risk}</span>
                <span class="badge badge-purple">${item.status}</span>
              </div>
            </div>
          `)}
        </div>
        ${filtered.length === 0 ? html`<div class="empty">No results</div>` : ''}
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-supply-chain-graph': Scusupplyuchainugraph; } }

/**
 * sc-identity-gov - Identity Gov
 * Phase 2+ Evolution - Interactive
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface MockItem { name: string; status: string; risk: string; detail: string; }

@customElement('sc-identity-gov')
export class ScIdentityGov extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; }
    .sb { padding: 8px 12px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 13px; width: 100%; margin-bottom: 12px; outline: none; }
    .sb:focus { border-color: #f59e0b; }
    .sr { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
    .sc { background: #0a0e17; border-radius: 6px; padding: 8px 14px; min-width: 80px; }
    .sv { font-size: 20px; font-weight: 700; }
    .sl { font-size: 10px; color: #94a3b8; }
    .il { display: flex; flex-direction: column; gap: 8px; }
    .it { background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 14px; }
    .it:hover { border-color: #4b5563; }
    .in { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
    .id { font-size: 12px; color: #94a3b8; line-height: 1.5; }
    .im { display: flex; gap: 6px; margin-top: 8px; }
    .b { font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .bc { background: #450a0a; color: #fca5a5; }
    .bh { background: #431407; color: #fdba74; }
    .bm { background: #422006; color: #fde047; }
    .bl { background: #052e16; color: #86efac; }
    .bs { background: #172554; color: #93c5fd; }
  `;

  @state() private _q = '';

  private _data: MockItem[] = [
    {name:"admin_zhang (Domain Admin)",status:"high",risk:"flagged",detail:"Department: IT | Last access: 1h ago | Privileged: Yes | MFA: Enabled | Orphaned: No | Review: Overdue 30d"},
    {name:"svc_backup (Service Account)",status:"high",risk:"flagged",detail:"Department: Infrastructure | Privileged: Domain Admin | MFA: N/A (service) | Orphaned: No owner | Action: Review permissions"},
    {name:"contractor_li (External)",status:"medium",risk:"attention",detail:"Department: N/A (vendor) | Last access: 3d ago | Privileged: No | MFA: Enabled | Contract: Expired 7d ago"},
    {name:" departed_wang (Former)",status:"critical",risk:"orphan",detail:"Department: Engineering (terminated) | Last access: 45d ago | Privileged: Was admin | Orphaned: Yes | Action: DISABLE NOW"},
    {name:"analyst_chen (Regular)",status:"low",risk:"healthy",detail:"Department: Security | Last access: 30min | Privileged: No | MFA: Enabled | Training: Current | SoD: Clean"}
  ];

  render() {
    const q = this._q.toLowerCase();
    const f = q ? this._data.filter(i => i.name.toLowerCase().includes(q) || i.detail.toLowerCase().includes(q)) : this._data;
    const c = f.filter(i => i.risk === 'critical').length;
    const h = f.filter(i => i.risk === 'high').length;
    return html`<div class="panel"><div class="pt">Identity Gov</div>
      <input class="sb" type="text" placeholder="Search..." .value=${this._q} @input=${(e: Event) => { this._q = (e.target as HTMLInputElement).value; }}/>
      <div class="sr"><div class="sc"><div class="sv">${f.length}</div><div class="sl">Total</div></div><div class="sc"><div class="sv" style="color:#ef4444">${c}</div><div class="sl">Critical</div></div><div class="sc"><div class="sv" style="color:#f97316">${h}</div><div class="sl">High</div></div></div>
      <div class="il">${f.map(i => html`<div class="it"><div class="in">${i.name}</div><div class="id">${i.detail}</div><div class="im"><span class="b b${i.risk[0]}">${i.risk}</span><span class="b bs">${i.status}</span></div></div>`)}</div>
      ${f.length === 0 ? html`<div style="text-align:center;padding:30px;color:#6b7280">No results</div>` : nothing}</div>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-identity-gov': ScIdentityGov; } }

/**
 * sc-risk-register — Enterprise Risk Register (CISO Core)
 * 5x5 risk matrix SVG + risk table + category filter + export
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface Risk { id: string; name: string; cat: string; l: number; i: number; score: number; mitigation: string; residual: number; owner: string; status: string; }

@customElement('sc-risk-register')
export class ScRiskRegister extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
    .filters { display: flex; gap: 4px; margin-bottom: 14px; flex-wrap: wrap; }
    .fbtn { padding: 4px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; background: #1f2937; border: 1px solid #374151; color: #94a3b8; transition: all 0.2s; }
    .fbtn.active { background: #f59e0b; color: #111827; border-color: #f59e0b; }
    .matrix-wrap { display: flex; gap: 20px; margin-bottom: 16px; }
    svg.matrix { width: 280px; height: 250px; }
    .legend { display: flex; flex-direction: column; gap: 6px; font-size: 11px; }
    .leg-item { display: flex; align-items: center; gap: 6px; }
    .leg-color { width: 14px; height: 14px; border-radius: 3px; }
    .stats { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
    .stat { background: #0a0e17; border-radius: 6px; padding: 6px 12px; }
    .sv { font-size: 18px; font-weight: 700; }
    .sl { font-size: 10px; color: #94a3b8; }
    .table { width: 100%; font-size: 12px; border-collapse: collapse; }
    .table th { text-align: left; padding: 6px 8px; color: #94a3b8; font-size: 10px; border-bottom: 1px solid #374151; }
    .table td { padding: 6px 8px; border-bottom: 1px solid #1f2937; }
    .badge { font-size: 10px; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
    .c { background: #450a0a; color: #fca5a5; } .h { background: #431407; color: #fdba74; }
    .m { background: #422006; color: #fde047; } .l { background: #052e16; color: #86efac; }
  `;

  @state() private _cat = 'all';

  private _data: Risk[] = [
    { id:'R-001', name:'Ransomware Attack', cat:'Cyber', l:4, i:5, score:20, mitigation:'EDR+backup+insurance+drill', residual:8, owner:'CISO', status:'mitigated' },
    { id:'R-002', name:'Data Breach (PII)', cat:'Data', l:3, i:5, score:15, mitigation:'DLP+encryption+access control', residual:6, owner:'DPO', status:'mitigated' },
    { id:'R-003', name:'Supply Chain Compromise', cat:'Supply', l:3, i:4, score:12, mitigation:'SBOM+vendor audit+monitoring', residual:8, owner:'CISO', status:'monitoring' },
    { id:'R-004', name:'Insider Threat', cat:'People', l:2, i:5, score:10, mitigation:'UEBA+DLP+NDA+access review', residual:4, owner:'HR+CISO', status:'mitigated' },
    { id:'R-005', name:'Cloud Misconfiguration', cat:'Cloud', l:3, i:3, score:9, mitigation:'CSPM+IaC scanning+review', residual:3, owner:'Arch', status:'mitigated' },
    { id:'R-006', name:'Zero-Day Exploit', cat:'Cyber', l:2, i:5, score:10, mitigation:'Defense in depth+threat intel', residual:10, owner:'SOC', status:'accepted' },
    { id:'R-007', name:'Regulatory Non-compliance', cat:'Compliance', l:2, i:4, score:8, mitigation:'GRC tools+quarterly audit', residual:3, owner:'CISO', status:'mitigated' },
    { id:'R-008', name:'Third-party Data Leak', cat:'Supply', l:3, i:4, score:12, mitigation:'DPA+audit+encryption', residual:6, owner:'Legal', status:'mitigated' },
    { id:'R-009', name:'Business Continuity Failure', cat:'Ops', l:2, i:4, score:8, mitigation:'BCP+DR+quarterly drill', residual:4, owner:'BSO', status:'mitigated' },
    { id:'R-010', name:'Social Engineering', cat:'People', l:4, i:3, score:12, mitigation:'Training+phishing sim+MFA', residual:6, owner:'CISO', status:'monitoring' },
    { id:'R-011', name:'API Security Breach', cat:'Cyber', l:3, i:4, score:12, mitigation:'API gateway+WAF+testing', residual:5, owner:'Arch', status:'mitigated' },
    { id:'R-012', name:'Physical Security Incident', cat:'Physical', l:1, i:3, score:3, mitigation:'Access control+CCTV+guards', residual:2, owner:'Facilities', status:'mitigated' },
  ];

  private _matrixColor(score: number): string {
    if (score >= 15) return '#dc2626'; if (score >= 10) return '#f97316';
    if (score >= 5) return '#eab308'; return '#22c55e';
  }

  render() {
    const cats = ['all', ...new Set(this._data.map(r => r.cat))];
    const filtered = this._cat === 'all' ? this._data : this._data.filter(r => r.cat === this._cat);
    const crit = filtered.filter(r => r.score >= 15).length;
    const high = filtered.filter(r => r.score >= 10 && r.score < 15).length;
    const cellW = 44, cellH = 36, pad = 32;
    return html`<div class="panel">
      <div class="pt">📋 Enterprise Risk Register</div>
      <div class="filters">${cats.map(c => html`<span class="fbtn ${this._cat === c ? 'active' : ''}" @click=${() => { this._cat = c; }}>${c === 'all' ? 'All' : c}</span>`)}</div>
      <div class="stats">
        <div class="stat"><div class="sv">${filtered.length}</div><div class="sl">Risks</div></div>
        <div class="stat"><div class="sv" style="color:#ef4444">${crit}</div><div class="sl">Critical</div></div>
        <div class="stat"><div class="sv" style="color:#f97316">${high}</div><div class="sl">High</div></div>
        <div class="stat"><div class="sv" style="color:#22c55e">${filtered.filter(r=>r.status==='mitigated').length}</div><div class="sl">Mitigated</div></div>
      </div>
      <div class="matrix-wrap">
        <svg class="matrix" viewBox="0 0 260 230">
          <text x="${pad-2}" y="10" fill="#6b7280" font-size="9">Impact →</text>
          <text x="4" y="${pad+40}" fill="#6b7280" font-size="9" transform="rotate(-90,4,${pad+40})">Likelihood</text>
          ${[1,2,3,4,5].map(li => [1,2,3,4,5].map(ii => {
            const score = li * ii; const x = pad + (ii-1)*cellW; const y = 200 - li*cellH;
            const count = filtered.filter(r => r.l === li && r.i === ii).length;
            return html`<rect x="${x}" y="${y}" width="${cellW-2}" height="${cellH-2}" rx="3" fill="${this._matrixColor(score)}" fill-opacity="${count > 0 ? 0.7 : 0.15}" stroke="${count > 0 ? '#fff' : 'transparent'}" stroke-width="${count > 0 ? 1 : 0}"/>${count > 0 ? html`<text x="${x+cellW/2-1}" y="${y+cellH/2+4}" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">${count}</text>` : nothing}`;
          }))}
          ${[1,2,3,4,5].map(i => html`<text x="${pad+(i-1)*cellW+cellW/2-1}" y="218" text-anchor="middle" fill="#6b7280" font-size="9">${i}</text>`)}
          ${[1,2,3,4,5].map(l => html`<text x="${pad-6}" y="${200-l*cellH+cellH/2+3}" text-anchor="end" fill="#6b7280" font-size="9">${l}</text>`)}
        </svg>
        <div class="legend">
          <div style="font-weight:600;font-size:12px;margin-bottom:4px">Risk Matrix</div>
          <div class="leg-item"><div class="leg-color" style="background:#dc2626"></div>Critical (15-25)</div>
          <div class="leg-item"><div class="leg-color" style="background:#f97316"></div>High (10-14)</div>
          <div class="leg-item"><div class="leg-color" style="background:#eab308"></div>Medium (5-9)</div>
          <div class="leg-item"><div class="leg-color" style="background:#22c55e"></div>Low (1-4)</div>
          <div style="margin-top:8px;font-size:10px;color:#6b7280">Numbers show risk count per cell. Click filter to isolate categories.</div>
        </div>
      </div>
      <table class="table">
        <tr><th>ID</th><th>Risk</th><th>L</th><th>I</th><th>Score</th><th>Residual</th><th>Status</th></tr>
        ${filtered.sort((a,b) => b.score - a.score).map(r => html`<tr>
          <td style="color:#94a3b8">${r.id}</td><td>${r.name}</td>
          <td>${r.l}</td><td>${r.i}</td>
          <td><span class="badge ${r.score >= 15 ? 'c' : r.score >= 10 ? 'h' : r.score >= 5 ? 'm' : 'l'}">${r.score}</span></td>
          <td>${r.residual}</td><td style="color:#94a3b8">${r.status}</td>
        </tr>`)}
      </table>
    </div>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-risk-register': ScRiskRegister; } }

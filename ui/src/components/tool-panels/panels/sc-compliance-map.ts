/**
 * sc-compliance-map - Cross-Framework Compliance (CISO)
 * Framework cards with compliance percentages + cross-map table
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface Framework { name: string; controls: number; implemented: number; gaps: number; pct: number; }

@customElement('sc-compliance-map')
export class ScComplianceMap extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 14px; }
    .fws { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; margin-bottom: 16px; }
    .fw { background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 14px; text-align: center; }
    .fw-name { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
    .fw-pct { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    .fw-detail { font-size: 11px; color: #94a3b8; }
    .bar { height: 8px; background: #0a0e17; border-radius: 4px; overflow: hidden; margin-top: 8px; }
    .bar-fill { height: 100%; border-radius: 4px; }
    .cross { margin-top: 12px; }
    .cross-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; }
    .ctable { width: 100%; font-size: 11px; border-collapse: collapse; }
    .ctable th { padding: 6px; background: #0a0e17; color: #94a3b8; font-size: 10px; }
    .ctable td { padding: 6px; text-align: center; border-bottom: 1px solid #1f2937; }
    .pct-cell { font-weight: 700; }
  `;

  private _fws: Framework[] = [
    { name: 'ISO 27001:2022', controls: 114, implemented: 105, gaps: 9, pct: 92 },
    { name: 'NIST CSF 2.0', controls: 106, implemented: 92, gaps: 14, pct: 87 },
    { name: 'GDPR', controls: 99, implemented: 87, gaps: 12, pct: 88 },
    { name: 'SOC 2 Type II', controls: 67, implemented: 57, gaps: 10, pct: 85 },
  ];

  private _crossMap = [
    ['', 'ISO 27001', 'NIST CSF', 'GDPR', 'SOC 2'],
    ['ISO 27001', '—', '85%', '72%', '78%'],
    ['NIST CSF', '85%', '—', '68%', '82%'],
    ['GDPR', '72%', '68%', '—', '65%'],
    ['SOC 2', '78%', '82%', '65%', '—'],
  ];

  render() {
    return html`<div class="panel">
      <div class="pt">🗺️ Cross-Framework Compliance Map</div>
      <div class="fws">${this._fws.map(f => html`
        <div class="fw">
          <div class="fw-name">${f.name}</div>
          <div class="fw-pct" style="color:${f.pct >= 90 ? '#22c55e' : f.pct >= 80 ? '#eab308' : '#ef4444'}">${f.pct}%</div>
          <div class="fw-detail">${f.implemented}/${f.controls} controls | ${f.gaps} gaps</div>
          <div class="bar"><div class="bar-fill" style="width:${f.pct}%;background:${f.pct >= 90 ? '#22c55e' : f.pct >= 80 ? '#eab308' : '#ef4444'}"></div></div>
        </div>
      `)}</div>
      <div class="cross">
        <div class="cross-title">Cross-Framework Coverage Matrix</div>
        <table class="ctable">
          ${this._crossMap.map((row, ri) => html`<tr>${row.map((cell, ci) => html`
            <td style="${ri === 0 || ci === 0 ? 'font-weight:600;color:#e2e8f0;background:#0a0e17' : ''}" class="${ci > 0 && ri > 0 ? 'pct-cell' : ''}">${cell}</td>
          `)}</tr>`)}
        </table>
      </div>
    </div>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-compliance-map': ScComplianceMap; } }

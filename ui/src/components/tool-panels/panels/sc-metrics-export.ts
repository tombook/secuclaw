/**
 * sc-metrics-export - Security Metrics Export (CISO)
 * Template selector with preview table and format toggle
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-metrics-export')
export class ScMetricsExport extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 14px; }
    .opts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
    .opt { background: #1f2937; border: 1px solid #374151; border-radius: 6px; padding: 12px; cursor: pointer; transition: border-color 0.2s; }
    .opt:hover, .opt.sel { border-color: #f59e0b; }
    .opt.sel { background: #1c1917; }
    .opt-title { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
    .opt-desc { font-size: 11px; color: #94a3b8; }
    .fmt { display: flex; gap: 6px; margin-bottom: 14px; }
    .fbtn { padding: 6px 14px; border-radius: 4px; font-size: 12px; cursor: pointer; background: #1f2937; border: 1px solid #374151; color: #94a3b8; }
    .fbtn.sel { background: #3b82f6; color: #fff; border-color: #3b82f6; }
    .preview { background: #0a0e17; border-radius: 6px; padding: 12px; margin-bottom: 14px; }
    .preview-title { font-size: 12px; font-weight: 600; margin-bottom: 8px; }
    .preview table { width: 100%; font-size: 11px; border-collapse: collapse; }
    .preview th { text-align: left; padding: 4px 6px; color: #6b7280; font-size: 10px; border-bottom: 1px solid #1f2937; }
    .preview td { padding: 4px 6px; border-bottom: 1px solid #0f1419; }
    .gen { padding: 10px 24px; border-radius: 6px; background: #f59e0b; color: #111827; font-weight: 700; font-size: 13px; cursor: pointer; border: none; }
    .gen:hover { background: #fbbf24; }
  `;

  @state() private _template = 0;
  @state() private _format = 'pdf';

  private _templates = [
    { title: 'Executive Summary', desc: '6 KPIs, risk overview, incidents summary. Monthly.', metrics: [['MTTD', '14min', '10min', 'Improving'], ['MTTR', '2.3h', '1h', 'Improving'], ['Patch %', '87%', '95%', 'Attention'], ['Training', '82%', '95%', 'Attention']] },
    { title: 'Technical Report', desc: '25 indicators, vulnerability analysis. Weekly.', metrics: [['Critical vulns', '5', '<3', 'Off track'], ['High vulns', '12', '<10', 'Attention'], ['Open findings', '79', '<60', 'Off track'], ['SLA compliance', '87%', '95%', 'Attention']] },
    { title: 'Compliance Report', desc: 'ISO 27001, SOC 2, GDPR status. Quarterly.', metrics: [['ISO 27001', '92%', '100%', 'On track'], ['SOC 2', '85%', '100%', 'Attention'], ['GDPR', '88%', '100%', 'Attention'], ['PCI DSS', '78%', '100%', 'Off track']] },
    { title: 'Incident Report', desc: 'P1-P4 timeline, lessons learned. Per incident.', metrics: [['Detection time', '3min', '<5min', 'On track'], ['Response time', '45min', '<1h', 'On track'], ['Containment', '15min', '<30min', 'On track'], ['Recovery', '30min', '<4h', 'On track']] },
  ];

  render() {
    const t = this._templates[this._template];
    return html`<div class="panel">
      <div class="pt">📤 Metrics Export</div>
      <div class="opts">${this._templates.map((tp, i) => html`
        <div class="opt ${this._template === i ? 'sel' : ''}" @click=${() => { this._template = i; }}>
          <div class="opt-title">${tp.title}</div>
          <div class="opt-desc">${tp.desc}</div>
        </div>
      `)}</div>
      <div class="fmt">
        <span class="fbtn ${this._format === 'pdf' ? 'sel' : ''}" @click=${() => { this._format = 'pdf'; }}>📄 PDF</span>
        <span class="fbtn ${this._format === 'csv' ? 'sel' : ''}" @click=${() => { this._format = 'csv'; }}>📊 CSV</span>
        <span class="fbtn ${this._format === 'json' ? 'sel' : ''}" @click=${() => { this._format = 'json'; }}>🔧 JSON</span>
      </div>
      <div class="preview">
        <div class="preview-title">Preview: ${t.title}</div>
        <table>
          <tr><th>Metric</th><th>Current</th><th>Target</th><th>Status</th></tr>
          ${t.metrics.map(m => html`<tr>
            <td style="font-weight:500">${m[0]}</td><td>${m[1]}</td><td style="color:#6b7280">${m[2]}</td>
            <td style="color:${m[3]==='On track'?'#22c55e':m[3]==='Attention'?'#eab308':'#ef4444'}">${m[3]}</td>
          </tr>`)}
        </table>
      </div>
      <button class="gen">Generate ${t.title} (.${this._format})</button>
    </div>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-metrics-export': ScMetricsExport; } }

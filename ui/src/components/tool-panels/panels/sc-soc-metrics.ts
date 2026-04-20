/**
 * sc-soc-metrics — SOC Performance Metrics (Security Ops Core)
 * SVG sparklines + trend arrows + period selector
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface Metric { name: string; current: number; target: number; unit: string; trend: number[]; status: string; }

@customElement('sc-soc-metrics')
export class ScSocMetrics extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .periods { display: flex; gap: 4px; margin-bottom: 16px; }
    .pbtn { padding: 4px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; background: #1f2937; border: 1px solid #374151; color: #94a3b8; }
    .pbtn.active { background: #3b82f6; color: #fff; border-color: #3b82f6; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
    .card { background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 14px; }
    .card-top { display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px; }
    .card-name { font-size: 12px; color: #94a3b8; }
    .card-val { font-size: 24px; font-weight: 700; }
    .card-target { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .card-status { font-size: 10px; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
    .on-track { background: #052e16; color: #86efac; } .attention { background: #422006; color: #fde047; } .off-track { background: #450a0a; color: #fca5a5; }
    svg.spark { width: 100%; height: 40px; }
    .summary { margin-top: 16px; padding-top: 12px; border-top: 1px solid #374151; display: flex; gap: 16px; font-size: 12px; color: #94a3b8; }
  `;

  @state() private _period = 'month';

  private _metrics: Metric[] = [
    { name: 'MTTD (Mean Time to Detect)', current: 14, target: 10, unit: 'min', trend: [22,19,18,16,14,14], status: 'attention' },
    { name: 'MTTR (Mean Time to Respond)', current: 2.3, target: 1.0, unit: 'h', trend: [3.1,2.8,2.6,2.5,2.4,2.3], status: 'attention' },
    { name: 'Alert Triage Accuracy', current: 78, target: 85, unit: '%', trend: [65,68,72,75,77,78], status: 'attention' },
    { name: 'Patch Compliance', current: 87, target: 95, unit: '%', trend: [78,80,82,84,86,87], status: 'attention' },
    { name: 'Training Completion', current: 82, target: 95, unit: '%', trend: [70,74,76,79,81,82], status: 'attention' },
    { name: 'Incident Volume (P1+P2)', current: 23, target: 15, unit: '/mo', trend: [19,22,25,21,20,23], status: 'off-track' },
  ];

  private _sparkline(data: number[], color: string): string {
    const w = 180, h = 36;
    const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
    return `<svg class="spark" viewBox="0 0 ${w} ${h}"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  render() {
    const onTrack = this._metrics.filter(m => m.status === 'on-track').length;
    return html`<div class="panel">
      <div class="pt">📊 SOC Performance Metrics</div>
      <div class="periods">
        <span class="pbtn ${this._period === 'week' ? 'active' : ''}" @click=${() => { this._period = 'week'; }}>Week</span>
        <span class="pbtn ${this._period === 'month' ? 'active' : ''}" @click=${() => { this._period = 'month'; }}>Month</span>
        <span class="pbtn ${this._period === 'quarter' ? 'active' : ''}" @click=${() => { this._period = 'quarter'; }}>Quarter</span>
      </div>
      <div class="grid">
        ${this._metrics.map(m => {
          const color = m.status === 'on-track' ? '#22c55e' : m.status === 'attention' ? '#eab308' : '#ef4444';
          const trendDir = m.trend[m.trend.length-1] > m.trend[0] ? '↑' : m.trend[m.trend.length-1] < m.trend[0] ? '↓' : '→';
          return html`<div class="card">
            <div class="card-top">
              <div><div class="card-name">${m.name}</div></div>
              <span class="card-status ${m.status}">${m.status === 'on-track' ? '✓ On Track' : m.status === 'attention' ? '⚠ Attention' : '✗ Off Track'}</span>
            </div>
            <div class="card-val" style="color:${color}">${m.current}<span style="font-size:14px;color:#94a3b8">${m.unit}</span> <span style="font-size:14px">${trendDir}</span></div>
            <div class="card-target">Target: ${m.target}${m.unit} | 6-period trend:</div>
            <div .innerHTML=${this._sparkline(m.trend, color)}></div>
          </div>`;
        })}
      </div>
      <div class="summary">
        <span>On Track: ${onTrack}/${this._metrics.length}</span>
        <span>Period: ${this._period}</span>
        <span>Team: 8 analysts</span>
        <span>Alerts/day: 150</span>
      </div>
    </div>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-soc-metrics': ScSocMetrics; } }

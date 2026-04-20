/**
 * sc-vuln-summary-chart — Vulnerability Distribution Donut Chart (SVG)
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-vuln-summary-chart')
export class ScVulnSummaryChart extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .panel-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; }
    .chart-container { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
    svg { width: 240px; height: 240px; flex-shrink: 0; }
    .legend { display: flex; flex-direction: column; gap: 12px; }
    .legend-item { display: flex; align-items: center; gap: 10px; }
    .legend-dot { width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; }
    .legend-label { font-size: 13px; }
    .legend-count { font-size: 20px; font-weight: 700; margin-left: auto; min-width: 32px; text-align: right; }
    .legend-pct { font-size: 11px; color: #94a3b8; }
    .total { text-align: center; margin-top: 16px; }
    .total-value { font-size: 36px; font-weight: 700; color: #f59e0b; }
    .total-label { font-size: 12px; color: #94a3b8; }
  `;

  @state() private _data = [
    { label: 'Critical', count: 5, color: '#ef4444' },
    { label: 'High', count: 12, color: '#f97316' },
    { label: 'Medium', count: 34, color: '#eab308' },
    { label: 'Low', count: 28, color: '#22c55e' },
  ];

  render() {
    const total = this._data.reduce((s, d) => s + d.count, 0);
    const cx = 120, cy = 120, r = 90, innerR = 55;
    let cumulativeAngle = 0;

    const arcs = this._data.map(d => {
      const angle = (d.count / total) * 2 * Math.PI;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      cumulativeAngle = endAngle;

      const x1 = cx + r * Math.cos(startAngle - Math.PI / 2);
      const y1 = cy + r * Math.sin(startAngle - Math.PI / 2);
      const x2 = cx + r * Math.cos(endAngle - Math.PI / 2);
      const y2 = cy + r * Math.sin(endAngle - Math.PI / 2);
      const ix1 = cx + innerR * Math.cos(endAngle - Math.PI / 2);
      const iy1 = cy + innerR * Math.sin(endAngle - Math.PI / 2);
      const ix2 = cx + innerR * Math.cos(startAngle - Math.PI / 2);
      const iy2 = cy + innerR * Math.sin(startAngle - Math.PI / 2);
      const large = angle > Math.PI ? 1 : 0;

      return {
        ...d, pct: ((d.count / total) * 100).toFixed(1),
        path: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2} Z`,
      };
    });

    return html`<div class="panel">
      <div class="panel-title">🍩 Vulnerability Distribution</div>
      <div class="chart-container">
        <svg viewBox="0 0 240 240">
          ${arcs.map(a => html`<path d="${a.path}" fill="${a.color}" opacity="0.85" style="transition: opacity 0.2s">
            <title>${a.label}: ${a.count} (${a.pct}%)</title>
          </path>`)}
          <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="#e2e8f0" font-size="32" font-weight="700">${total}</text>
          <text x="${cx}" y="${cy + 20}" text-anchor="middle" fill="#94a3b8" font-size="11">Total</text>
        </svg>
        <div class="legend">
          ${arcs.map(a => html`<div class="legend-item">
            <div class="legend-dot" style="background:${a.color}"></div>
            <div><div class="legend-label">${a.label}</div><div class="legend-pct">${a.pct}%</div></div>
            <div class="legend-count" style="color:${a.color}">${a.count}</div>
          </div>`)}
        </div>
      </div>
    </div>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-vuln-summary-chart': ScVulnSummaryChart; } }

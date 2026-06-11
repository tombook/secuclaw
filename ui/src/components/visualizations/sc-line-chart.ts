import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';

interface LineSeries { label: string; color: string; data: number[]; }

@customElement('sc-line-chart')
export class ScLineChart extends LitElement {
  static styles = css`
    :host { display: block; }
    .wrap { position: relative; }
    svg { display: block; width: 100%; }
    .grid line { stroke: var(--sc-border-subtle, #1f2937); stroke-width: 1; }
    .axis-label { font-size: 9px; fill: var(--sc-text-muted, #6b7280); }
    .legend { display: flex; gap: 12px; margin-top: 6px; font-size: 11px; color: var(--sc-text-secondary, #9ca3af); }
    .leg-dot { display: inline-block; width: 10px; height: 2px; vertical-align: middle; margin-right: 4px; }
  `;
  @property({ type: Array }) series: LineSeries[] = [];
  @property({ type: Array }) xLabels: string[] = [];
  @property({ type: Number }) height = 160;
  @property({ type: Number }) yMax: number | null = null;
  @property({ type: Number }) yMin = 0;

  render() {
    const w = 600;
    const h = this.height;
    const padL = 32, padR = 8, padT = 8, padB = 24;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;
    const allVals = this.series.flatMap(s => s.data);
    const yMax = this.yMax ?? Math.max(1, ...allVals);
    const yMin = this.yMin;
    const xN = Math.max(1, this.xLabels.length - 1);
    const xAt = (i: number) => padL + (i / xN) * innerW;
    const yAt = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * innerH;
    const gridYs = [0, 0.25, 0.5, 0.75, 1].map(p => yMin + p * (yMax - yMin));
    return html`
      <div class="wrap" role="img" aria-label="Line chart">
        <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
          <g class="grid">
            ${gridYs.map(v => svg`<line x1="${padL}" x2="${w - padR}" y1="${yAt(v)}" y2="${yAt(v)}"/>`)}
          </g>
          ${gridYs.map(v => svg`<text class="axis-label" x="${padL - 4}" y="${yAt(v) + 3}" text-anchor="end">${Math.round(v)}</text>`)}
          ${this.xLabels.map((lbl, i) => svg`<text class="axis-label" x="${xAt(i)}" y="${h - 6}" text-anchor="middle">${lbl}</text>`)}
          ${this.series.map(s => {
            const pts = s.data.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ');
            return svg`<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2"/>`;
          })}
          ${this.series.map(s => s.data.map((v, i) => svg`<circle cx="${xAt(i)}" cy="${yAt(v)}" r="2.5" fill="${s.color}"/>`))}
        </svg>
        <div class="legend">
          ${this.series.map(s => html`<div><span class="leg-dot" style="background:${s.color}"></span>${s.label}</div>`)}
        </div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-line-chart': ScLineChart; } }

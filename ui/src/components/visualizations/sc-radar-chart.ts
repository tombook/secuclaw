import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';

interface RadarAxis { label: string; max: number; }
interface RadarSeries { label: string; color: string; values: number[]; }

@customElement('sc-radar-chart')
export class ScRadarChart extends LitElement {
  static styles = css`
    :host { display: block; }
    .wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    svg { display: block; }
    .axis-label { font-size: 10px; fill: var(--sc-text-secondary, #9ca3af); }
    .value-label { font-size: 9px; fill: var(--sc-text-muted, #6b7280); }
    .legend { display: flex; gap: 12px; font-size: 11px; color: var(--sc-text-secondary, #9ca3af); }
    .leg-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; vertical-align: middle; margin-right: 4px; }
  `;
  @property({ type: Array }) axes: RadarAxis[] = [];
  @property({ type: Array }) series: RadarSeries[] = [];
  @property({ type: Number }) size = 220;

  render() {
    const s = this.size;
    const cx = s / 2;
    const cy = s / 2;
    const r = s * 0.38;
    const n = this.axes.length;
    if (n === 0) return html``;
    const angleStep = (2 * Math.PI) / n;
    const angleAt = (i: number) => -Math.PI / 2 + i * angleStep;
    const pointAt = (i: number, valFrac: number) => {
      const a = angleAt(i);
      return { x: cx + Math.cos(a) * r * valFrac, y: cy + Math.sin(a) * r * valFrac };
    };
    const gridLevels = [0.25, 0.5, 0.75, 1];
    return html`
      <div class="wrap" role="img" aria-label="Radar chart">
        <svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
          ${gridLevels.map(lv => {
            const pts = this.axes.map((_, i) => {
              const p = pointAt(i, lv);
              return `${p.x},${p.y}`;
            }).join(' ');
            return svg`<polygon points="${pts}" fill="none" stroke="var(--sc-border-subtle, #1f2937)" stroke-width="1"/>`;
          })}
          ${this.axes.map((_, i) => {
            const p = pointAt(i, 1);
            return svg`<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="var(--sc-border-subtle, #1f2937)" stroke-width="1"/>`;
          })}
          ${this.series.map(s2 => {
            const pts = s2.values.map((v, i) => {
              const ax = this.axes[i];
              const frac = Math.min(1, v / ax.max);
              const p = pointAt(i, frac);
              return `${p.x},${p.y}`;
            }).join(' ');
            return svg`<polygon points="${pts}" fill="${s2.color}" fill-opacity="0.15" stroke="${s2.color}" stroke-width="2"/>`;
          })}
          ${this.axes.map((ax, i) => {
            const p = pointAt(i, 1.15);
            return svg`<text class="axis-label" x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="middle">${ax.label}</text>`;
          })}
          ${this.series.map(s2 => svg`
            ${s2.values.map((v, i) => {
              const ax = this.axes[i];
              const frac = Math.min(1, v / ax.max);
              const p = pointAt(i, frac);
              return svg`<circle cx="${p.x}" cy="${p.y}" r="3" fill="${s2.color}"/>`;
            })}
          `)}
        </svg>
        <div class="legend">
          ${this.series.map(s2 => html`<div><span class="leg-dot" style="background:${s2.color}"></span>${s2.label}</div>`)}
        </div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-radar-chart': ScRadarChart; } }

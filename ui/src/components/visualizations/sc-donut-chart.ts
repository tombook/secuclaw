import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';

interface DonutItem { label: string; value: number; color: string; }

@customElement('sc-donut-chart')
export class ScDonutChart extends LitElement {
  static styles = css`
    :host { display: block; }
    .wrap { display: flex; align-items: center; gap: 16px; }
    svg { flex-shrink: 0; }
    .center { text-anchor: middle; fill: var(--sc-text-primary, #f9fafb); }
    .center-value { font-size: 22px; font-weight: 800; }
    .center-label { font-size: 10px; fill: var(--sc-text-muted, #6b7280); }
    .legend { display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .leg-row { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--sc-text-secondary, #9ca3af); }
    .dot { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
    .leg-value { margin-left: auto; font-weight: 600; color: var(--sc-text-primary, #f9fafb); }
  `;
  @property({ type: Array }) data: DonutItem[] = [];
  @property({ type: Number }) size = 140;
  @property({ type: Number }) strokeWidth = 18;
  @property({ type: String }) centerLabel = '';
  @property({ type: String }) centerValue = '';

  render() {
    const s = this.size;
    const sw = this.strokeWidth;
    const r = (s - sw) / 2;
    const cx = s / 2;
    const cy = s / 2;
    const total = this.data.reduce((sum, d) => sum + d.value, 0) || 1;
    const c = 2 * Math.PI * r;
    let offset = 0;
    const segs = this.data.map(d => {
      const len = (d.value / total) * c;
      const seg = { len, offset, color: d.color, label: d.label, value: d.value };
      offset += len;
      return seg;
    });
    return html`
      <div class="wrap" role="img" aria-label="Donut chart">
        <svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--sc-bg-tertiary, #1f2937)" stroke-width="${sw}"/>
          ${segs.map(seg => svg`
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
              stroke="${seg.color}" stroke-width="${sw}"
              stroke-dasharray="${seg.len} ${c - seg.len}"
              stroke-dashoffset="${-seg.offset}"
              transform="rotate(-90 ${cx} ${cy})"
              stroke-linecap="butt"/>
          `)}
          ${this.centerValue ? svg`<text class="center center-value" x="${cx}" y="${cy + 4}">${this.centerValue}</text>` : ''}
          ${this.centerLabel ? svg`<text class="center center-label" x="${cx}" y="${cy + 22}">${this.centerLabel}</text>` : ''}
        </svg>
        <div class="legend">
          ${this.data.map(d => html`
            <div class="leg-row">
              <div class="dot" style="background: ${d.color};"></div>
              <span>${d.label}</span>
              <span class="leg-value">${d.value}</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-donut-chart': ScDonutChart; } }

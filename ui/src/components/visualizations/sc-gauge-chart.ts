import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sc-gauge-chart')
export class ScGaugeChart extends LitElement {
  static styles = css`
    :host { display: block; }
    .wrap { display: flex; flex-direction: column; align-items: center; }
    .value { font-size: 28px; font-weight: 800; fill: var(--sc-text-primary, #f9fafb); }
    .label { font-size: 10px; fill: var(--sc-text-muted, #6b7280); }
  `;
  @property({ type: Number }) value = 0;
  @property({ type: Number }) max = 100;
  @property({ type: String }) label = '';
  @property({ type: String }) color = 'var(--sc-primary, #00d4ff)';

  render() {
    const w = 180, h = 100;
    const cx = w / 2, cy = h - 8;
    const r = 70;
    const startAngle = Math.PI;
    const endAngle = 0;
    const fraction = Math.max(0, Math.min(1, this.value / this.max));
    const valAngle = startAngle + (endAngle - startAngle) * fraction;
    const ptOnArc = (angle: number) => ({ x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) - 6 });
    const bgPath = `M ${ptOnArc(startAngle).x} ${ptOnArc(startAngle).y} A ${r} ${r} 0 0 1 ${ptOnArc(endAngle).x} ${ptOnArc(endAngle).y}`;
    const valPath = `M ${ptOnArc(startAngle).x} ${ptOnArc(startAngle).y} A ${r} ${r} 0 0 1 ${ptOnArc(valAngle).x} ${ptOnArc(valAngle).y}`;
    return html`
      <div class="wrap" role="img" aria-label="Gauge ${this.value}/${this.max}">
        <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
          <path d="${bgPath}" fill="none" stroke="var(--sc-bg-tertiary, #1f2937)" stroke-width="14" stroke-linecap="round"/>
          <path d="${valPath}" fill="none" stroke="${this.color}" stroke-width="14" stroke-linecap="round"/>
          <text class="value" x="${cx}" y="${cy - 10}" text-anchor="middle">${this.value}</text>
          ${this.label ? svg`<text class="label" x="${cx}" y="${cy - 30}" text-anchor="middle">${this.label}</text>` : ''}
        </svg>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-gauge-chart': ScGaugeChart; } }

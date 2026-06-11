import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sc-compliance-gauge')
export class ScComplianceGauge extends LitElement {
  static styles = css`
    :host { display: block; }
    .wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .pct { font-size: 26px; font-weight: 800; fill: var(--sc-text-primary, #f9fafb); }
    .label { font-size: 10px; fill: var(--sc-text-muted, #6b7280); }
    .ring-bg { fill: none; stroke: var(--sc-bg-tertiary, #1f2937); }
  `;
  @property({ type: Number }) percent = 0;
  @property({ type: String }) label = '合规率';
  @property({ type: String }) color = 'var(--sc-low, #22c55e)';

  render() {
    const s = 130, sw = 12;
    const r = (s - sw) / 2;
    const cx = s / 2, cy = s / 2;
    const c = 2 * Math.PI * r;
    const offset = c * (1 - Math.max(0, Math.min(1, this.percent / 100)));
    return html`
      <div class="wrap" role="img" aria-label="${this.label} ${this.percent}%">
        <svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
          <circle class="ring-bg" cx="${cx}" cy="${cy}" r="${r}" stroke-width="${sw}"/>
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${this.color}" stroke-width="${sw}"
            stroke-dasharray="${c}" stroke-dashoffset="${offset}" stroke-linecap="round"
            transform="rotate(-90 ${cx} ${cy})"/>
          <text class="pct" x="${cx}" y="${cy + 4}" text-anchor="middle">${Math.round(this.percent)}%</text>
          <text class="label" x="${cx}" y="${cy + 22}" text-anchor="middle">${this.label}</text>
        </svg>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-compliance-gauge': ScComplianceGauge; } }

/**
 * sc-risk-gauge — Risk Score Gauges (SVG semicircular)
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface GaugeDef { label: string; value: number; max: number; }

@customElement('sc-risk-gauge')
export class ScRiskGauge extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .panel-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; }
    .gauges { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    @media (max-width: 600px) { .gauges { grid-template-columns: 1fr; } }
    .gauge-card { background: #0a0e17; border-radius: 8px; padding: 16px; text-align: center; }
    .gauge-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 8px; }
    .gauge-value { font-size: 28px; font-weight: 700; margin-top: 4px; }
    svg { width: 100%; max-width: 200px; }
  `;

  @state() private _gauges: GaugeDef[] = [
    { label: 'Overall Risk', value: 72, max: 100 },
    { label: 'Exposure', value: 58, max: 100 },
    { label: 'Compliance', value: 85, max: 100 },
  ];

  private _gaugeColor(val: number): string {
    if (val >= 70) return '#ef4444'; if (val >= 50) return '#f97316'; if (val >= 30) return '#eab308'; return '#22c55e';
  }

  private _drawArc(value: number, max: number): string {
    const r = 80, cx = 100, cy = 100;
    const angle = (value / max) * Math.PI;
    const x = cx + r * Math.cos(Math.PI - angle);
    const y = cy - r * Math.sin(Math.PI - angle);
    return `M ${cx - r} ${cy} A ${r} ${r} 0 ${angle > Math.PI ? 1 : 0} 1 ${x} ${y}`;
  }

  render() {
    return html`<div class="panel">
      <div class="panel-title">📊 Risk Score Gauges</div>
      <div class="gauges">
        ${this._gauges.map(g => html`
          <div class="gauge-card">
            <svg viewBox="0 0 200 110">
              <!-- Background arc -->
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1e293b" stroke-width="12" stroke-linecap="round"/>
              <!-- Value arc -->
              <path d="${this._drawArc(g.value, g.max)}" fill="none" stroke="${this._gaugeColor(g.value)}" stroke-width="12" stroke-linecap="round" style="transition: d 0.6s ease"/>
              <!-- Needle -->
              <circle cx="100" cy="100" r="4" fill="${this._gaugeColor(g.value)}"/>
            </svg>
            <div class="gauge-value" style="color:${this._gaugeColor(g.value)}">${g.value}%</div>
            <div class="gauge-label">${g.label}</div>
          </div>
        `)}
      </div>
    </div>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-risk-gauge': ScRiskGauge; } }

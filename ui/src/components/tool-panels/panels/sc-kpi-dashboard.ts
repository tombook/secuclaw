/**
 * sc-kpi-dashboard - KPI Dashboard (SecuClaw Commander / CISO)
 * 6 KPI cards with sparkline SVGs and trend indicators
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface KPI { name: string; value: string; target: string; trend: number[]; status: string; icon: string; }

@customElement('sc-kpi-dashboard')
export class ScKpiDashboard extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 14px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
    .card { background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 14px; }
    .card-icon { font-size: 20px; margin-bottom: 6px; }
    .card-name { font-size: 11px; color: #94a3b8; margin-bottom: 4px; }
    .card-val { font-size: 22px; font-weight: 700; }
    .card-tgt { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .card-status { font-size: 10px; padding: 2px 6px; border-radius: 3px; font-weight: 600; display: inline-block; margin-top: 4px; }
    .on { background: #052e16; color: #86efac; } .warn { background: #422006; color: #fde047; } .off { background: #450a0a; color: #fca5a5; }
    svg.sp { width: 100%; height: 32px; }
  `;

  @state() private _period = 'month';

  private _kpis: KPI[] = [
    { name: 'MTTD', value: '14min', target: 'Target: <10min', trend: [22,19,18,16,14,14], status: 'warn', icon: '⏱️' },
    { name: 'MTTR', value: '2.3h', target: 'Target: <1h', trend: [3.1,2.8,2.6,2.5,2.4,2.3], status: 'warn', icon: '🔧' },
    { name: 'Patch Compliance', value: '87%', target: 'Target: 95%', trend: [78,80,82,84,86,87], status: 'warn', icon: '📦' },
    { name: 'Training Done', value: '82%', target: 'Target: 95%', trend: [70,74,76,79,81,82], status: 'warn', icon: '🎓' },
    { name: 'Vuln Remediation', value: '78%', target: 'Target: 90%', trend: [65,68,72,75,77,78], status: 'off', icon: '🛡️' },
    { name: 'Incidents This Month', value: '23', target: 'Target: <15', trend: [19,22,25,21,20,23], status: 'off', icon: '🚨' },
  ];

  private _spark(data: number[], color: string): string {
    const w = 160, h = 28, mn = Math.min(...data), mx = Math.max(...data), r = mx - mn || 1;
    const pts = data.map((v, i) => `${(i/(data.length-1))*w},${h-((v-mn)/r)*(h-4)-2}`).join(' ');
    return pts;
  }

  render() {
    return html`<div class="panel">
      <div class="pt">📈 Security KPI Dashboard</div>
      <div class="grid">
        ${this._kpis.map(k => {
          const color = k.status === 'on' ? '#22c55e' : k.status === 'warn' ? '#eab308' : '#ef4444';
          const mn = Math.min(...k.trend), mx = Math.max(...k.trend), r = mx - mn || 1;
          const pts = k.trend.map((v, i) => `${(i/(k.trend.length-1))*160},${28-((v-mn)/r)*24-2}`).join(' ');
          return html`<div class="card">
            <div class="card-icon">${k.icon}</div>
            <div class="card-name">${k.name}</div>
            <div class="card-val" style="color:${color}">${k.value}</div>
            <div class="card-tgt">${k.target}</div>
            <span class="card-status ${k.status}">${k.status === 'on' ? 'On Track' : k.status === 'warn' ? 'Attention' : 'Off Track'}</span>
            <svg class="sp" viewBox="0 0 160 28"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/></svg>
          </div>`;
        })}
      </div>
    </div>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-kpi-dashboard': ScKpiDashboard; } }

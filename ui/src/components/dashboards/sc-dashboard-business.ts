import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ScDashboardBase } from './sc-dashboard-base.js';
import { BUSINESS_MOCK } from '../../config/dashboard-mock-data.js';
import '../visualizations/sc-stat-card.js';
import '../visualizations/sc-bar-chart.js';
import '../visualizations/sc-donut-chart.js';
import '../visualizations/sc-score-bar.js';

@customElement('sc-dashboard-business')
export class ScDashboardBusiness extends ScDashboardBase {
  static styles = [ScDashboardBase.styles, css``];

  @property({ type: String }) roleId = 'business-security-officer';

  render() {
    if (this._loading && !this._capabilities.length) {
      return html`${this._renderHeader('业务安全中心', '📊')}${this._renderLoading()}`;
    }
    const { kpis, impactBySystem, bcDrillStatus, insuranceBreakdown } = BUSINESS_MOCK;
    return html`
      ${this._renderHeader('业务安全中心', '📊')}

      <div class="grid-4">
        ${kpis.map(k => html`<sc-stat-card label=${k.label} value=${k.value} unit=${k.unit} trend=${k.trend} color=${k.color}></sc-stat-card>`)}
      </div>

      <div class="grid-2">
        <div class="panel">
          <h3 class="panel-title">💰 系统中断影响 (万元/小时)</h3>
          <sc-bar-chart .data=${impactBySystem.map(s => ({ label: s.system, value: s.revenue, color: s.color }))} unit="万"></sc-bar-chart>
        </div>

        <div class="panel">
          <h3 class="panel-title">🔥 演练状态</h3>
          <sc-donut-chart .data=${bcDrillStatus} .size=${160} centerValue=${bcDrillStatus.reduce((s,d) => s+d.value, 0)} centerLabel="总场次"></sc-donut-chart>
        </div>
      </div>

      <div class="panel">
        <h3 class="panel-title">🛡️ 保险覆盖明细</h3>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${insuranceBreakdown.map(b => html`
            <sc-score-bar label=${b.name} value=${b.coverage} color="#f59e0b"></sc-score-bar>
          `)}
        </div>
      </div>

      <div class="panel">
        <h3 class="panel-title">🤖 AI 能力中心</h3>
        ${this._renderAiCapabilities()}
      </div>

      ${this._renderExecModal()}
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-dashboard-business': ScDashboardBusiness; } }

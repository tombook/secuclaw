import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ScDashboardBase } from './sc-dashboard-base.js';
import { ARCHITECT_MOCK } from '../../config/dashboard-mock-data.js';
import '../visualizations/sc-stat-card.js';
import '../visualizations/sc-radar-chart.js';
import '../visualizations/sc-bar-chart.js';
import '../visualizations/sc-priority-list.js';

@customElement('sc-dashboard-architect')
export class ScDashboardArchitect extends ScDashboardBase {
  static styles = [ScDashboardBase.styles, css``];

  @property({ type: String }) roleId = 'security-architect';

  render() {
    if (this._loading && !this._capabilities.length) {
      return html`${this._renderHeader('安全架构工作台', '🏗️')}${this._renderLoading()}`;
    }
    const { kpis, controlCoverage, ztMaturity, architectureRisks } = ARCHITECT_MOCK;
    return html`
      ${this._renderHeader('安全架构工作台', '🏗️')}

      <div class="grid-4">
        ${kpis.map(k => html`<sc-stat-card label=${k.label} value=${k.value} unit=${k.unit} trend=${k.trend} color=${k.color}></sc-stat-card>`)}
      </div>

      <div class="grid-2">
        <div class="panel">
          <h3 class="panel-title">🛡️ 安全控制覆盖</h3>
          <sc-radar-chart
            .axes=${controlCoverage.axes}
            .series=${controlCoverage.series}
            size="240"
          ></sc-radar-chart>
        </div>

        <div class="panel">
          <h3 class="panel-title">🎯 零信任成熟度</h3>
          <sc-bar-chart .data=${ztMaturity} color="#06b6d4" max="100" unit="%"></sc-bar-chart>
        </div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <h3 class="panel-title">⚠️ 架构风险</h3>
          <sc-priority-list .items=${architectureRisks}></sc-priority-list>
        </div>

        <div class="panel">
          <h3 class="panel-title">🤖 AI 能力中心</h3>
          ${this._renderAiCapabilities()}
        </div>
      </div>

      ${this._renderExecModal()}
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-dashboard-architect': ScDashboardArchitect; } }

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ScDashboardBase } from './sc-dashboard-base.js';
import { SECOPS_MOCK } from '../../config/dashboard-mock-data.js';
import '../visualizations/sc-stat-card.js';
import '../visualizations/sc-donut-chart.js';
import '../visualizations/sc-line-chart.js';
import '../visualizations/sc-priority-list.js';

@customElement('sc-dashboard-secops')
export class ScDashboardSecops extends ScDashboardBase {
  static styles = [ScDashboardBase.styles, css``];

  @property({ type: String }) roleId = 'security-ops';

  render() {
    if (this._loading && !this._capabilities.length) {
      return html`${this._renderHeader('安全运营中心', '⚙️')}${this._renderLoading()}`;
    }
    const { kpis, severityDist, mttrTrend, topAlerts } = SECOPS_MOCK;
    return html`
      ${this._renderHeader('安全运营中心', '⚙️')}

      <div class="grid-4">
        ${kpis.map(k => html`<sc-stat-card label=${k.label} value=${k.value} unit=${k.unit} trend=${k.trend} color=${k.color}></sc-stat-card>`)}
      </div>

      <div class="grid-2">
        <div class="panel">
          <h3 class="panel-title">📊 告警严重程度分布</h3>
          <sc-donut-chart .data=${severityDist} .size=${160} centerValue=${severityDist.reduce((s,d) => s+d.value, 0)} centerLabel="总告警"></sc-donut-chart>
        </div>

        <div class="panel">
          <h3 class="panel-title">⏱️ 响应时间趋势</h3>
          <sc-line-chart
            .xLabels=${mttrTrend.labels}
            .series=${mttrTrend.series}
            height="180"
          ></sc-line-chart>
        </div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <h3 class="panel-title">🔥 待处理告警</h3>
          <sc-priority-list .items=${topAlerts}></sc-priority-list>
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
declare global { interface HTMLElementTagNameMap { 'sc-dashboard-secops': ScDashboardSecops; } }

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ScDashboardBase } from './sc-dashboard-base.js';
import { PRIVACY_MOCK } from '../../config/dashboard-mock-data.js';
import '../visualizations/sc-stat-card.js';
import '../visualizations/sc-donut-chart.js';
import '../visualizations/sc-line-chart.js';
import '../visualizations/sc-risk-matrix.js';
import '../visualizations/sc-priority-list.js';

@customElement('sc-dashboard-privacy')
export class ScDashboardPrivacy extends ScDashboardBase {
  static styles = [ScDashboardBase.styles, css``];

  @property({ type: String }) roleId = 'privacy-officer';

  render() {
    if (this._loading && !this._capabilities.length) {
      return html`${this._renderHeader('隐私合规中心', '🔐')}${this._renderLoading()}`;
    }
    const { kpis, dataCategories, consentRate, requests, riskMatrix } = PRIVACY_MOCK;
    return html`
      ${this._renderHeader('隐私合规中心', '🔐')}

      <div class="grid-4">
        ${kpis.map(k => html`<sc-stat-card label=${k.label} value=${k.value} unit=${k.unit} trend=${k.trend} color=${k.color}></sc-stat-card>`)}
      </div>

      <div class="grid-2">
        <div class="panel">
          <h3 class="panel-title">📦 数据资产分类</h3>
          <sc-donut-chart .data=${dataCategories} .size=${160} centerValue=${dataCategories.reduce((s,d) => s+d.value, 0)} centerLabel="数据项"></sc-donut-chart>
        </div>

        <div class="panel">
          <h3 class="panel-title">📈 同意率趋势</h3>
          <sc-line-chart .xLabels=${consentRate.labels} .series=${consentRate.series} height="180"></sc-line-chart>
        </div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <h3 class="panel-title">⚠️ 隐私风险矩阵</h3>
          <sc-risk-matrix .items=${riskMatrix.items}></sc-risk-matrix>
        </div>

        <div class="panel">
          <h3 class="panel-title">📋 主体请求</h3>
          <sc-priority-list .items=${requests}></sc-priority-list>
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
declare global { interface HTMLElementTagNameMap { 'sc-dashboard-privacy': ScDashboardPrivacy; } }

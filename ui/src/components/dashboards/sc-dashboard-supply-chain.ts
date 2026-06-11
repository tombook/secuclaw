import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ScDashboardBase } from './sc-dashboard-base.js';
import { SUPPLY_CHAIN_MOCK } from '../../config/dashboard-mock-data.js';
import '../visualizations/sc-stat-card.js';
import '../visualizations/sc-donut-chart.js';
import '../visualizations/sc-sankey-chart.js';
import '../visualizations/sc-priority-list.js';

@customElement('sc-dashboard-supply-chain')
export class ScDashboardSupplyChain extends ScDashboardBase {
  static styles = [ScDashboardBase.styles, css``];

  @property({ type: String }) roleId = 'supply-chain-security';

  render() {
    if (this._loading && !this._capabilities.length) {
      return html`${this._renderHeader('供应链安全中心', '🔗')}${this._renderLoading()}`;
    }
    const { kpis, vendorRisk, topVendors, vulnerabilityFlow } = SUPPLY_CHAIN_MOCK;
    return html`
      ${this._renderHeader('供应链安全中心', '🔗')}

      <div class="grid-4">
        ${kpis.map(k => html`<sc-stat-card label=${k.label} value=${k.value} unit=${k.unit} trend=${k.trend} color=${k.color}></sc-stat-card>`)}
      </div>

      <div class="grid-2">
        <div class="panel">
          <h3 class="panel-title">🏢 供应商风险分布</h3>
          <sc-donut-chart .data=${vendorRisk} .size=${160} centerValue=${vendorRisk.reduce((s,d) => s+d.value, 0)} centerLabel="供应商"></sc-donut-chart>
        </div>

        <div class="panel">
          <h3 class="panel-title">🔗 漏洞流转路径</h3>
          <sc-sankey-chart
            .nodes=${vulnerabilityFlow.nodes}
            .links=${vulnerabilityFlow.links}
            .colors=${vulnerabilityFlow.colors}
            height="200"
          ></sc-sankey-chart>
        </div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <h3 class="panel-title">🎯 重点供应商</h3>
          <sc-priority-list .items=${topVendors}></sc-priority-list>
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
declare global { interface HTMLElementTagNameMap { 'sc-dashboard-supply-chain': ScDashboardSupplyChain; } }

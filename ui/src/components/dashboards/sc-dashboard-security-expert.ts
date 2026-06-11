import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ScDashboardBase } from './sc-dashboard-base.js';
import { SECURITY_EXPERT_MOCK } from '../../config/dashboard-mock-data.js';
import '../visualizations/sc-stat-card.js';
import '../visualizations/sc-donut-chart.js';
import '../visualizations/sc-heatmap.js';
import '../visualizations/sc-priority-list.js';

@customElement('sc-dashboard-security-expert')
export class ScDashboardSecurityExpert extends ScDashboardBase {
  static styles = [ScDashboardBase.styles, css``];

  @property({ type: String }) roleId = 'security-expert';

  render() {
    if (this._loading && !this._capabilities.length) {
      return html`${this._renderHeader('安全专家工作台', '🛡️')}${this._renderLoading()}`;
    }
    const { kpis, cvssDist, topVulns, mitre } = SECURITY_EXPERT_MOCK;
    return html`
      ${this._renderHeader('安全专家工作台', '🛡️')}

      <div class="grid-4">
        ${kpis.map(k => html`<sc-stat-card label=${k.label} value=${k.value} unit=${k.unit} trend=${k.trend} color=${k.color}></sc-stat-card>`)}
      </div>

      <div class="grid-2">
        <div class="panel">
          <h3 class="panel-title">📊 CVSS 评分分布</h3>
          <sc-donut-chart .data=${cvssDist} .size=${160} centerValue=${cvssDist.reduce((s,d) => s+d.value, 0)} centerLabel="总漏洞"></sc-donut-chart>
        </div>

        <div class="panel">
          <h3 class="panel-title">🎯 顶级漏洞</h3>
          <sc-priority-list .items=${topVulns}></sc-priority-list>
        </div>
      </div>

      <div class="panel">
        <h3 class="panel-title">🎯 MITRE ATT&CK 覆盖</h3>
        <sc-heatmap .data=${mitre.data} .rows=${mitre.rows} .cols=${mitre.cols} colorScheme="intensity"></sc-heatmap>
      </div>

      <div class="panel">
        <h3 class="panel-title">🤖 AI 能力中心</h3>
        ${this._renderAiCapabilities()}
      </div>

      ${this._renderExecModal()}
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-dashboard-security-expert': ScDashboardSecurityExpert; } }

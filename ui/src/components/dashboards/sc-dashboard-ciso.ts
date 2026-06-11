import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ScDashboardBase } from './sc-dashboard-base.js';
import { CISO_MOCK } from '../../config/dashboard-mock-data.js';
import '../visualizations/sc-stat-card.js';
import '../visualizations/sc-donut-chart.js';
import '../visualizations/sc-radar-chart.js';
import '../visualizations/sc-bar-chart.js';
import '../visualizations/sc-priority-list.js';
import '../visualizations/sc-score-bar.js';

@customElement('sc-dashboard-ciso')
export class ScDashboardCiso extends ScDashboardBase {
  static styles = [
    ScDashboardBase.styles,
    css`
      .progress-row { display: flex; align-items: center; gap: 6px; }
      .progress-track { flex: 1; height: 6px; background: var(--sc-bg-tertiary, #1f2937); border-radius: 3px; overflow: hidden; }
      .progress-fill { height: 100%; border-radius: 3px; }
      .progress-fill.level-good { background: var(--sc-low, #22c55e); }
      .progress-fill.level-warn { background: var(--sc-medium, #f59e0b); }
      .progress-fill.level-bad { background: var(--sc-critical, #ef4444); }
      .progress-value { font-size: 11px; min-width: 32px; text-align: right; color: var(--sc-text-primary, #f9fafb); font-weight: 600; }
    `,
  ];

  @property({ type: String }) roleId = 'ciso';

  render() {
    if (this._loading && !this._capabilities.length) {
      return html`${this._renderHeader('CISO 战略仪表盘', '👔')}${this._renderLoading()}`;
    }
    if (this._error && !this._capabilities.length) {
      return html`${this._renderHeader('CISO 战略仪表盘', '👔')}${this._renderError(this._error)}`;
    }
    const { maturity, compliance, budget, kpis, topRisks } = CISO_MOCK;
    const budgetPct = Math.round((budget.used / budget.total) * 100);
    return html`
      ${this._renderHeader('CISO 战略仪表盘', '👔')}

      <div class="grid-4" aria-label="核心 KPI">
        ${kpis.map(k => html`<sc-stat-card label=${k.label} value=${k.value} unit=${k.unit} trend=${k.trend} color=${k.color}></sc-stat-card>`)}
      </div>

      <div class="grid-2">
        <div class="panel">
          <h3 class="panel-title">🛡️ 安全能力成熟度</h3>
          <sc-radar-chart
            .axes=${maturity.map(m => ({ label: m.name, max: 100 }))}
            .series=${[{ label: '当前能力', color: '#00d4ff', values: maturity.map(m => m.value) }]}
            size="220"
          ></sc-radar-chart>
        </div>

        <div class="panel">
          <h3 class="panel-title">📊 合规框架</h3>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${compliance.map(c => html`
              <div class="progress-row">
                <div style="font-size:12px;color:var(--sc-text-secondary);min-width:80px;">${c.framework}</div>
                <div class="progress-track">
                  <div class="progress-fill ${c.score >= 85 ? 'level-good' : c.score >= 70 ? 'level-warn' : 'level-bad'}" style="width:${c.score}%;background:${c.color};"></div>
                </div>
                <div class="progress-value">${c.score}%</div>
              </div>
            `)}
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <h3 class="panel-title">💰 预算分配</h3>
          <div style="text-align:center;margin-bottom:8px;">
            <span style="font-size:24px;font-weight:800;color:var(--sc-text-primary);">¥${(budget.used/100).toFixed(0)}万</span>
            <span style="font-size:11px;color:var(--sc-text-muted);"> / ¥${(budget.total/100).toFixed(0)}万</span>
            <div style="font-size:11px;color:var(--sc-low);">${budgetPct}% 已使用</div>
          </div>
          <sc-donut-chart
            .data=${budget.breakdown}
            .size=${140}
            .centerValue=${`${budgetPct}%`}
            centerLabel="预算"
          ></sc-donut-chart>
        </div>

        <div class="panel">
          <h3 class="panel-title">🎯 AI 能力中心</h3>
          ${this._renderAiCapabilities()}
        </div>
      </div>

      <div class="panel">
        <h3 class="panel-title">⚠️ 顶级风险</h3>
        <sc-priority-list .items=${topRisks}></sc-priority-list>
      </div>

      ${this._renderExecModal()}
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-dashboard-ciso': ScDashboardCiso; } }

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ScDashboardBase } from './sc-dashboard-base.js';
import { COMMANDER_MOCK } from '../../config/dashboard-mock-data.js';
import '../visualizations/sc-stat-card.js';
import '../visualizations/sc-compliance-gauge.js';
import '../visualizations/sc-bar-chart.js';
import '../visualizations/sc-line-chart.js';
import '../visualizations/sc-timeline-viz.js';
import '../visualizations/sc-priority-list.js';

@customElement('sc-dashboard-commander')
export class ScDashboardCommander extends ScDashboardBase {
  static styles = [
    ScDashboardBase.styles,
    css`
      .trend-tag { font-size:10px;padding:2px 6px;border-radius:3px;background:rgba(34,197,94,0.15);color:#22c55e; }
      .posture-card { display: flex; align-items: center; gap: 16px; }
      .posture-label { font-size: 11px; color: var(--sc-text-muted, #6b7280); text-transform: uppercase; letter-spacing: 1px; }
      .posture-score { font-size: 24px; font-weight: 800; color: var(--sc-text-primary, #f9fafb); margin: 4px 0; }
      .posture-score-max { font-size: 14px; color: var(--sc-text-muted, #6b7280); }
      .posture-desc { font-size: 11px; color: var(--sc-text-secondary, #9ca3af); margin: 8px 0 0; line-height: 1.5; }
    `,
  ];

  @property({ type: String }) roleId = 'secuclaw-commander';

  render() {
    if (this._loading && !this._capabilities.length) {
      return html`${this._renderHeader('指挥官态势中心', '🎯')}${this._renderLoading()}`;
    }
    const { posture, kpis, roleCoordination, alertTrend, events, topPriorities } = COMMANDER_MOCK;
    return html`
      ${this._renderHeader('指挥官态势中心', '🎯')}

      <div class="grid-2">
        <div class="panel posture-card">
          <sc-compliance-gauge percent=${posture.score} label="安全态势" color="#7c3aed"></sc-compliance-gauge>
          <div>
            <div class="posture-label">全域综合评分</div>
            <div class="posture-score">${posture.score}<span class="posture-score-max">/100</span></div>
            <span class="trend-tag">↑ ${posture.trend} 较上周</span>
            <p class="posture-desc">7 角色协同运作<br/>活跃事件 7 起，待处置 12 项</p>
          </div>
        </div>

        <div class="panel">
          <h3 class="panel-title">🤝 角色协同评分</h3>
          <sc-bar-chart .data=${roleCoordination} color="#7c3aed" unit="分"></sc-bar-chart>
        </div>
      </div>

      <div class="grid-4" aria-label="关键指标">
        ${kpis.map(k => html`<sc-stat-card label=${k.label} value=${k.value} unit=${k.unit} trend=${k.trend} color=${k.color}></sc-stat-card>`)}
      </div>

      <div class="grid-2">
        <div class="panel">
          <h3 class="panel-title">📈 告警趋势 (7 天)</h3>
          <sc-line-chart
            .xLabels=${alertTrend.labels}
            .series=${[
              { label: '严重', color: '#ef4444', data: alertTrend.critical },
              { label: '高', color: '#f97316', data: alertTrend.high },
              { label: '中', color: '#f59e0b', data: alertTrend.medium },
            ]}
            height="180"
          ></sc-line-chart>
        </div>

        <div class="panel">
          <h3 class="panel-title">📅 实时事件流</h3>
          <sc-timeline-viz .events=${events}></sc-timeline-viz>
        </div>
      </div>

      <div class="panel">
        <h3 class="panel-title">🎯 AI 能力中心</h3>
        ${this._renderAiCapabilities()}
      </div>

      <div class="panel">
        <h3 class="panel-title">📋 协调优先事项</h3>
        <sc-priority-list .items=${topPriorities}></sc-priority-list>
      </div>

      ${this._renderExecModal()}
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-dashboard-commander': ScDashboardCommander; } }

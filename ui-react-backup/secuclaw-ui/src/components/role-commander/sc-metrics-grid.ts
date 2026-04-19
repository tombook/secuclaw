/**
 * sc-metrics-grid — 专业指标网格
 * 每个角色 6 个指标卡片，支持阈值判断 + 趋势图 + 下钻
 *
 * @see v2.0 文档 第 3.5 节 专业指标区
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { RoleId } from '../../config/role-tool-config';
import {
  ROLE_DASHBOARDS,
  evaluateMetric,
  formatMetricValue,
  type MetricDef,
  type MetricStatus,
} from '../../config/role-dashboard-config';

// ─── Status Styling ───────────────────────────────────────────

const STATUS_MAP: Record<MetricStatus, { color: string; icon: string; borderColor: string }> = {
  normal:     { color: 'var(--role-secondary)', icon: '●', borderColor: 'transparent' },
  warning:    { color: 'var(--role-warning)',    icon: '▲', borderColor: 'var(--role-warning)' },
  danger:     { color: 'var(--role-danger)',      icon: '🔴', borderColor: 'var(--role-danger)' },
  target:     { color: 'var(--role-success)',     icon: '✓', borderColor: 'var(--role-success)' },
  'no-data':  { color: 'var(--role-text-muted)',  icon: '—', borderColor: 'transparent' },
};

@customElement('sc-metrics-grid')
export class ScMetricsGrid extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
      gap: 10px;
    }

    .metric-card {
      background: var(--role-bg-elevated);
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 150ms ease;
      border: 1px solid transparent;
      position: relative;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      border-color: var(--role-secondary);
    }

    /* Status borders */
    .metric-card.status-danger {
      border-color: var(--role-danger);
    }
    .metric-card.status-warning {
      border-color: var(--role-warning);
    }
    .metric-card.status-target {
      border-color: var(--role-success);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .label {
      font-size: 11px;
      color: var(--role-text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .status-icon {
      font-size: 10px;
    }

    .value-row {
      display: flex;
      align-items: baseline;
      gap: 2px;
    }

    .value {
      font-size: 24px;
      font-weight: 700;
      line-height: 1.2;
    }

    /* Sparkline */
    .spark {
      height: 20px;
      margin-top: 8px;
      display: flex;
      align-items: flex-end;
      gap: 1px;
    }

    .bar {
      flex: 1;
      border-radius: 1px;
      transition: height 150ms ease;
      opacity: 0.25;
    }

    .bar:last-child {
      opacity: 0.8;
    }

    /* AI badge */
    .ai-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      font-size: 8px;
      background: var(--role-danger);
      color: white;
      padding: 1px 4px;
      border-radius: 4px;
    }

    /* Pulse for danger */
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    .metric-card.status-danger .value {
      animation: pulse 2s ease-in-out infinite;
    }
  `;

  @property({ type: String }) roleId: RoleId = 'secuclaw-commander';

  // Mock trend data generator
  private _mockTrend(): number[] {
    return Array.from({ length: 7 }, () => 0.2 + Math.random() * 0.8);
  }

  // Mock values per metric
  private _mockValue(metric: MetricDef): number | null {
    const mocks: Record<string, number> = {
      'vuln-total': 67, 'vuln-critical': 2, 'cvss-avg': 6.3,
      'patch-coverage': 82, 'mttr-vuln': 96, 'intel-match': 78,
      'gdpr-compliance': 94, 'pipl-compliance': 87, 'data-breach': 0,
      'privacy-requests': 15, 'dpia-completion': 83, 'dsr-response': 92,
      'arch-risk': 23, 'threat-coverage': 78, 'control-count': 156,
      'iam-policies': 42, 'zero-trust': 55, 'change-pending': 4,
      'bcp-score': 87, 'mttr-biz': 3.2, 'drill-pending': 2,
      'insurance-cov': 95, 'bcp-doc': 97, 'biz-impact': 0,
      'total-alerts': 234, 'mttd': 4.2, 'sec-score': 76,
      'active-events': 7, 'coord-requests': 12, 'escalations': 2,
      'risk-score': 42, 'budget-usage': 67, 'kpi-rate': 88,
      'pending-approval': 4, 'maturity': 3.8, 'audit-open': 3,
      'pending-alerts': 23, 'false-pos-rate': 14, 'mttr-ops': 8,
      'escalation-rate': 6, 'soar-rate': 73, 'soc-uptime': 99.7,
      'high-risk-vendors': 3, 'sbom-coverage': 67, '3rd-party-vulns': 12,
      'license-compliance': 93, 'critical-vendors': 8, 'vendor-total': 156,
    };
    return mocks[metric.id] ?? null;
  }

  render() {
    const dashboard = ROLE_DASHBOARDS[this.roleId];
    if (!dashboard) return html`<div style="color: var(--role-text-muted)">无指标配置</div>`;

    return html`
      <div class="metrics-grid">
        ${dashboard.metrics.map((metric) => {
          const value = this._mockValue(metric);
          const status = evaluateMetric(metric, value);
          const style = STATUS_MAP[status];
          const formatted = formatMetricValue(value, metric.format);
          const trend = this._mockTrend();
          const isAnomaly = status === 'danger' && Math.random() > 0.5;

          return html`
            <div
              class="metric-card status-${status}"
              @click=${() => this._onDrilldown(metric)}
            >
              ${isAnomaly ? html`<span class="ai-badge">AI</span>` : ''}
              <div class="header">
                <span class="label">${metric.label}</span>
                <span class="status-icon" style="color: ${style.color}">${style.icon}</span>
              </div>
              <div class="value-row">
                <span class="value" style="color: ${style.color}">${formatted}</span>
              </div>
              <div class="spark">
                ${trend.map(h => html`
                  <div
                    class="bar"
                    style="height: ${h * 20}px; background: ${style.color}"
                  ></div>
                `)}
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }

  private _onDrilldown(metric: MetricDef) {
    this.dispatchEvent(new CustomEvent('metric-drilldown', {
      detail: {
        metricId: metric.id,
        drilldownTarget: metric.drilldownTarget,
        roleId: this.roleId,
      },
      bubbles: true,
      composed: true,
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-metrics-grid': ScMetricsGrid;
  }
}

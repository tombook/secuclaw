/**
 * SecuClaw Dashboard Metrics Grid Component - 指标网格
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../components/sc-metric-card.js';

interface SecurityMetric {
  id: string;
  title: string;
  value: number;
  unit?: string;
  target?: number;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
  icon: string;
  dataPoints: { label: string; value: number }[];
  aiInsight?: string;
}

@customElement('sc-dashboard-metrics')
export class ScDashboardMetrics extends LitElement {
  @property({ type: Array })
  metrics: SecurityMetric[] = [];

  static styles = css`
    :host { display: block; }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--sc-spacing-md, 16px);
    }
    
    @media (max-width: 1200px) {
      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 768px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  render() {
    return html`
      <div class="metrics-grid">
        ${this.metrics.map(metric => html`
          <sc-metric-card
            .metric=${{
              id: metric.id,
              title: metric.title,
              value: metric.value,
              unit: metric.unit,
              target: metric.target,
              status: metric.status,
              trend: metric.trend,
              trendValue: metric.trendValue,
              icon: metric.icon,
              dataPoints: metric.dataPoints,
            }}
            .aiInsight=${metric.aiInsight || ''}
          ></sc-metric-card>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-dashboard-metrics': ScDashboardMetrics;
  }
}

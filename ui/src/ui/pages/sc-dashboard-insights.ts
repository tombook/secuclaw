/**
 * SecuClaw Dashboard Insights Component - AI洞察区域
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type SmartInsight, type AnomalyAlert } from '../ai-service.js';

@customElement('sc-dashboard-insights')
export class ScDashboardInsights extends LitElement {
  @property({ type: Array })
  insights: SmartInsight[] = [];

  @property({ type: Array })
  anomalies: AnomalyAlert[] = [];

  static styles = css`
    :host { display: block; }
    
    .insights-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--sc-spacing-lg, 20px);
    }
    
    .insight-card {
      padding: 16px;
      background: var(--sc-bg-secondary, #f9fafb);
      border-radius: var(--sc-radius-md, 8px);
      border-left: 3px solid var(--sc-primary, #3b82f6);
    }
    
    .insight-card.warning {
      border-left-color: var(--sc-warning, #f59e0b);
    }
    
    .insight-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    
    .insight-icon { font-size: 18px; }
    
    .insight-title {
      flex: 1;
      font-size: 14px;
      font-weight: 600;
      color: var(--sc-text-primary, #111827);
    }
    
    .insight-priority {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 500;
    }
    
    .insight-priority.high {
      background: color-mix(in srgb, var(--sc-danger, #ef4444) 15%, transparent);
      color: var(--sc-danger, #ef4444);
    }
    
    .insight-priority.medium {
      background: color-mix(in srgb, var(--sc-warning, #f59e0b) 15%, transparent);
      color: var(--sc-warning, #f59e0b);
    }
    
    .insight-priority.low {
      background: color-mix(in srgb, var(--sc-success, #10b981) 15%, transparent);
      color: var(--sc-success, #10b981);
    }
    
    .insight-description {
      font-size: 13px;
      color: var(--sc-text-secondary, #6b7280);
      line-height: 1.5;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      color: var(--sc-text-primary, #111827);
      margin: 0;
    }
    
    .section-badge {
      background: var(--sc-danger, #ef4444);
      color: white;
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 10px;
    }
    
    .anomaly-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--sc-bg-secondary, #f9fafb);
      border-radius: var(--sc-radius-md, 8px);
      margin-bottom: 8px;
    }
    
    .anomaly-severity {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .anomaly-severity.critical {
      background: color-mix(in srgb, var(--sc-danger, #ef4444) 15%, transparent);
      color: var(--sc-danger, #ef4444);
    }
    
    .anomaly-severity.high {
      background: color-mix(in srgb, var(--sc-warning, #f97316) 15%, transparent);
      color: var(--sc-warning, #f97316);
    }
    
    .anomaly-severity.medium {
      background: color-mix(in srgb, var(--sc-warning, #f59e0b) 15%, transparent);
      color: var(--sc-warning, #f59e0b);
    }
    
    .anomaly-content { flex: 1; }
    
    .anomaly-metric {
      font-size: 14px;
      font-weight: 500;
      color: var(--sc-text-primary, #111827);
      margin-bottom: 4px;
    }
    
    .anomaly-detail {
      font-size: 12px;
      color: var(--sc-text-secondary, #6b7280);
    }
    
    .empty-state {
      text-align: center;
      padding: 24px;
      color: var(--sc-text-secondary, #6b7280);
      font-size: 14px;
    }
    
    .empty-state-icon { font-size: 24px; margin-bottom: 8px; }
  `;

  private getInsightIcon(type: string): string {
    const icons: Record<string, string> = {
      warning: '⚠️',
      info: 'ℹ️',
      recommendation: '💡',
    };
    return icons[type] || '💡';
  }

  render() {
    return html`
      <div class="insights-section">
        <div class="insight-list">
          <div class="section-header">
            <h3 class="section-title">💡 AI洞察</h3>
          </div>
          ${this.insights.length > 0 ? this.insights.slice(0, 3).map(insight => html`
            <div class="insight-card ${insight.type}">
              <div class="insight-header">
                <span class="insight-icon">${this.getInsightIcon(insight.type)}</span>
                <span class="insight-title">${insight.title}</span>
                <span class="insight-priority ${insight.priority}">
                  ${insight.priority === 'high' ? '高' : insight.priority === 'medium' ? '中' : '低'}
                </span>
              </div>
              <div class="insight-description">${insight.description}</div>
            </div>
          `) : html`
            <div class="empty-state">
              <div class="empty-state-icon">✨</div>
              <div>暂无AI洞察</div>
            </div>
          `}
        </div>
        
        <div class="anomaly-list">
          <div class="section-header">
            <h3 class="section-title">
              🚨 异常告警
              ${this.anomalies.length > 0 ? html`<span class="section-badge">${this.anomalies.length}</span>` : ''}
            </h3>
          </div>
          ${this.anomalies.length > 0 ? this.anomalies.slice(0, 3).map(anomaly => html`
            <div class="anomaly-item">
              <span class="anomaly-severity ${anomaly.severity}">${anomaly.severity}</span>
              <div class="anomaly-content">
                <div class="anomaly-metric">${anomaly.metric}</div>
                <div class="anomaly-detail">
                  当前: ${anomaly.currentValue} | 预期: ${anomaly.expectedValue} | 偏差: ${anomaly.deviation}%
                </div>
              </div>
            </div>
          `) : html`
            <div class="empty-state">
              <div class="empty-state-icon">✅</div>
              <div>所有指标运行正常</div>
            </div>
          `}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-dashboard-insights': ScDashboardInsights;
  }
}

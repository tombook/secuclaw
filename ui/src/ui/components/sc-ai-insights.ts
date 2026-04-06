/**
 * SecuClaw AI Insights Component - AI洞察子组件
 * 展示智能洞察卡片列表
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type SmartInsight } from '../ai-service.js';

@customElement('sc-ai-insights')
export class ScAIInsights extends LitElement {
  @property({ type: Array })
  insights: SmartInsight[] = [];

  @property({ type: Boolean })
  loading: boolean = false;

  static styles = css`
    :host { display: block; }
    
    .loading-indicator {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }
    
    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid var(--sc-border-color, #e5e7eb);
      border-top-color: var(--sc-primary, #3b82f6);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .empty-state {
      text-align: center;
      padding: 2rem;
      color: var(--sc-text-secondary, #6b7280);
    }
    
    .empty-icon { font-size: 32px; margin-bottom: 8px; }
    .empty-text { font-size: 14px; }
    
    .insight-card {
      padding: 12px;
      margin-bottom: 8px;
      background: var(--sc-bg-secondary, #f9fafb);
      border-radius: var(--sc-radius-md, 8px);
      cursor: pointer;
      transition: background 0.2s ease;
    }
    
    .insight-card:hover {
      background: var(--sc-bg-tertiary, #f3f4f6);
    }
    
    .insight-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    
    .insight-icon { font-size: 16px; }
    
    .insight-title {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      color: var(--sc-text-primary, #111827);
    }
    
    .insight-priority {
      font-size: 11px;
      padding: 2px 6px;
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
      line-height: 1.4;
    }
  `;

  private handleInsightAction(insight: SmartInsight) {
    this.dispatchEvent(new CustomEvent('insight-action', {
      detail: { insight },
      bubbles: true,
      composed: true
    }));
  }

  private renderInsightCard(insight: SmartInsight) {
    const icons: Record<string, string> = {
      warning: '⚠️',
      info: 'ℹ️',
      recommendation: '💡',
    };

    return html`
      <div class="insight-card" @click=${() => this.handleInsightAction(insight)}>
        <div class="insight-header">
          <span class="insight-icon">${icons[insight.type] || '💡'}</span>
          <span class="insight-title">${insight.title}</span>
          <span class="insight-priority ${insight.priority}">
            ${insight.priority === 'high' ? '高' : insight.priority === 'medium' ? '中' : '低'}
          </span>
        </div>
        <div class="insight-description">${insight.description}</div>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading-indicator">
          <div class="loading-spinner"></div>
        </div>
      `;
    }

    if (this.insights.length === 0) {
      return html`
        <div class="empty-state">
          <div class="empty-icon">✨</div>
          <div class="empty-text">暂无洞察</div>
        </div>
      `;
    }

    return html`
      ${this.insights.map(insight => this.renderInsightCard(insight))}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-ai-insights': ScAIInsights;
  }
}

/**
 * SecuClaw AI Recommendations Component - AI建议子组件
 * 展示AI推荐列表
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type AIRecommendation } from '../ai-service.js';

@customElement('sc-ai-recommendations')
export class ScAIRecommendations extends LitElement {
  @property({ type: Array })
  recommendations: AIRecommendation[] = [];

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
    
    .recommendation-card {
      padding: 12px;
      margin-bottom: 8px;
      background: var(--sc-bg-secondary, #f9fafb);
      border-radius: var(--sc-radius-md, 8px);
      border-left: 3px solid var(--sc-primary, #3b82f6);
    }
    
    .recommendation-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 6px;
      gap: 8px;
    }
    
    .recommendation-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--sc-text-primary, #111827);
    }
    
    .recommendation-priority {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--sc-bg-tertiary, #f3f4f6);
      color: var(--sc-text-secondary, #6b7280);
      white-space: nowrap;
    }
    
    .recommendation-description {
      font-size: 13px;
      color: var(--sc-text-secondary, #6b7280);
      line-height: 1.4;
      margin-bottom: 8px;
    }
    
    .recommendation-meta {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: var(--sc-text-tertiary, #9ca3af);
    }
    
    .recommendation-meta span {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  `;

  render() {
    if (this.loading) {
      return html`
        <div class="loading-indicator">
          <div class="loading-spinner"></div>
        </div>
      `;
    }

    if (this.recommendations.length === 0) {
      return html`
        <div class="empty-state">
          <div class="empty-icon">💡</div>
          <div class="empty-text">暂无建议</div>
        </div>
      `;
    }

    return html`
      ${this.recommendations.map(rec => html`
        <div class="recommendation-card">
          <div class="recommendation-header">
            <span class="recommendation-title">${rec.title}</span>
            <span class="recommendation-priority">优先级: ${rec.priority}</span>
          </div>
          <div class="recommendation-description">${rec.description}</div>
          <div class="recommendation-meta">
            <span>影响: ${rec.impact}</span>
            <span>工作量: ${rec.effort}</span>
          </div>
        </div>
      `)}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-ai-recommendations': ScAIRecommendations;
  }
}

/**
 * SecuClaw Dashboard Header Component - 仪表盘页面头部
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../components/design-system/sc-button.js';

@customElement('sc-dashboard-header')
export class ScDashboardHeader extends LitElement {
  @property({ type: String })
  timeRange: string = '今日';

  @property({ type: Boolean })
  loading: boolean = false;

  static styles = css`
    :host { display: block; }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: var(--sc-spacing-lg, 20px);
      background: var(--sc-bg-primary, #ffffff);
      border-radius: var(--sc-radius-lg, 12px);
      border: 1px solid var(--sc-border-color, #e5e7eb);
    }
    
    .page-title-section { flex: 1; }
    
    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 24px;
      font-weight: 600;
      color: var(--sc-text-primary, #111827);
      margin: 0 0 8px 0;
    }
    
    .page-description {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--sc-text-secondary, #6b7280);
    }
    
    .page-description-icon { font-size: 16px; }
    
    .header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 500;
      border-radius: var(--sc-radius-md, 8px);
      border: 1px solid var(--sc-border-color, #e5e7eb);
      background: var(--sc-bg-primary, #ffffff);
      color: var(--sc-text-primary, #111827);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .btn:hover {
      background: var(--sc-bg-secondary, #f9fafb);
    }
    
    .btn-primary {
      background: var(--sc-primary, #3b82f6);
      color: white;
      border-color: var(--sc-primary, #3b82f6);
    }
    
    .btn-primary:hover {
      background: color-mix(in srgb, var(--sc-primary, #3b82f6) 85%, black);
    }
    
    .btn-secondary {
      background: var(--sc-bg-secondary, #f3f4f6);
    }
  `;

  private handleRefresh() {
    this.dispatchEvent(new CustomEvent('refresh', { bubbles: true, composed: true }));
  }

  private handleKPICalc() {
    this.dispatchEvent(new CustomEvent('kpi-calc', { bubbles: true, composed: true }));
  }

  private handleTimeChange(e: Event) {
    this.timeRange = (e.target as HTMLSelectElement).value;
    this.dispatchEvent(new CustomEvent('time-change', {
      detail: { timeRange: this.timeRange },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <div class="page-header">
        <div class="page-title-section">
          <h1 class="page-title">
            <span>🛡️</span>
            安全仪表盘
          </h1>
          <div class="page-description">
            <span class="page-description-icon">💡</span>
            <span>一眼看清企业整体安全健康状态，快速发现需要关注的问题</span>
          </div>
        </div>
        <div class="header-actions">
          <select variant="secondary" style="padding: 8px 12px;" @change=${this.handleTimeChange}>
            <option>今日</option>
            <option>本周</option>
            <option>本月</option>
          </select>
          <sc-button variant="secondary" size="sm" @click=${this.handleRefresh}>
            🔄 刷新
          </sc-button>
          <sc-button variant="secondary" size="sm" @click=${this.handleKPICalc}>
            📊 KPI计算
          </sc-button>
          <sc-button variant="primary">
            📊 生成报告
          </sc-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-dashboard-header': ScDashboardHeader;
  }
}

/**
 * SecuClaw Smart Card Component - 智能卡片组件
 * 
 * 显示关键指标、趋势箭头、状态指示
 * 支持点击展开详情
 */
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';

// ============ 类型定义 ============

export type TrendDirection = 'up' | 'down' | 'stable';
export type CardStatus = 'success' | 'warning' | 'error' | 'neutral';

// ============ 组件定义 ============

@customElement('sc-smart-card')
export class ScSmartCard extends LitElement {
  // ============ 属性 ============

  /** 卡片标题 */
  @property({ type: String })
  title: string = '';

  /** 主要数值 */
  @property({ type: String })
  value: string = '';

  /** 趋势方向 */
  @property({ type: String })
  trend?: TrendDirection;

  /** 趋势值 (如 "+12%" 或 "-5") */
  @property({ type: String })
  trendValue?: string;

  /** 状态 */
  @property({ type: String })
  status?: CardStatus;

  /** 图标 */
  @property({ type: String })
  icon?: string;

  /** 副标题/描述 */
  @property({ type: String })
  subtitle?: string;

  /** 是否可点击 */
  @property({ type: Boolean })
  clickable: boolean = false;

  /** 是否加载中 */
  @property({ type: Boolean })
  loading: boolean = false;

  // ============ 私有属性 ============

  private i18n = new I18nController(this);

  // ============ 样式 ============

  static styles = css`
    :host {
      display: block;
    }

    .smart-card {
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .smart-card.clickable {
      cursor: pointer;
    }

    .smart-card.clickable:hover {
      border-color: var(--sc-primary, #3b82f6);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      transform: translateY(-2px);
    }

    /* 状态边框 */
    .smart-card.status-success {
      border-left: 4px solid var(--sc-success, #22c55e);
    }

    .smart-card.status-warning {
      border-left: 4px solid var(--sc-warning, #f59e0b);
    }

    .smart-card.status-error {
      border-left: 4px solid var(--sc-danger, #ef4444);
    }

    /* 加载骨架 */
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
      border-radius: 4px;
    }

    @keyframes skeleton-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* 卡片头部 */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--sc-spacing-sm, 8px);
    }

    .card-title {
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #64748b);
      font-weight: 500;
    }

    .card-icon {
      font-size: 24px;
      line-height: 1;
    }

    /* 卡片主体 */
    .card-body {
      display: flex;
      align-items: baseline;
      gap: var(--sc-spacing-sm, 8px);
    }

    .card-value {
      font-size: var(--sc-font-size-3xl, 30px);
      font-weight: 700;
      color: var(--sc-text-primary, #1e293b);
      line-height: 1.2;
    }

    /* 趋势指示 */
    .trend-container {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 600;
    }

    .trend-up {
      color: var(--sc-success, #22c55e);
    }

    .trend-down {
      color: var(--sc-danger, #ef4444);
    }

    .trend-stable {
      color: var(--sc-text-secondary, #64748b);
    }

    .trend-icon {
      font-size: 12px;
    }

    /* 副标题 */
    .card-subtitle {
      margin-top: var(--sc-spacing-xs, 4px);
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-tertiary, #94a3b8);
    }

    /* 状态指示器 */
    .status-indicator {
      position: absolute;
      top: 0;
      right: 0;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin: var(--sc-spacing-sm, 8px);
    }

    .status-indicator.success {
      background-color: var(--sc-success, #22c55e);
    }

    .status-indicator.warning {
      background-color: var(--sc-warning, #f59e0b);
    }

    .status-indicator.error {
      background-color: var(--sc-danger, #ef4444);
      animation: pulse-error 2s infinite;
    }

    @keyframes pulse-error {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* 加载状态 */
    .loading-value {
      width: 80px;
      height: 36px;
    }

    .loading-title {
      width: 100px;
      height: 16px;
    }
  `;

  // ============ 私有方法 ============

  private getTrendIcon(): string {
    switch (this.trend) {
      case 'up': return '▲';
      case 'down': return '▼';
      case 'stable': return '—';
      default: return '';
    }
  }

  private getTrendClass(): string {
    return `trend-${this.trend || 'stable'}`;
  }

  private getStatusClass(): string {
    const classes: string[] = ['smart-card'];
    
    if (this.clickable) {
      classes.push('clickable');
    }
    
    if (this.status && this.status !== 'neutral') {
      classes.push(`status-${this.status}`);
    }
    
    return classes.join(' ');
  }

  private handleClick() {
    if (this.clickable) {
      this.dispatchEvent(new CustomEvent('card-click', {
        bubbles: true,
        composed: true,
        detail: { title: this.title, value: this.value }
      }));
    }
  }

  // ============ 渲染 ============

  private renderLoading() {
    return html`
      <div class="smart-card">
        <div class="card-header">
          <div class="skeleton loading-title"></div>
          ${this.icon ? html`<span class="card-icon">${this.icon}</span>` : ''}
        </div>
        <div class="card-body">
          <div class="skeleton loading-value"></div>
        </div>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return this.renderLoading();
    }

    return html`
      <div class=${this.getStatusClass()} @click=${this.handleClick}>
        ${this.status && this.status !== 'neutral' ? html`
          <div class="status-indicator ${this.status}"></div>
        ` : ''}
        
        <div class="card-header">
          <span class="card-title">${this.title}</span>
          ${this.icon ? html`<span class="card-icon">${this.icon}</span>` : ''}
        </div>
        
        <div class="card-body">
          <span class="card-value">${this.value}</span>
          ${this.trend && this.trendValue ? html`
            <div class="trend-container ${this.getTrendClass()}">
              <span class="trend-icon">${this.getTrendIcon()}</span>
              <span>${this.trendValue}</span>
            </div>
          ` : ''}
        </div>
        
        ${this.subtitle ? html`
          <div class="card-subtitle">${this.subtitle}</div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-smart-card': ScSmartCard;
  }
}

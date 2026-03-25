import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../../i18n/lib/lit-controller.js';
import { capabilitiesClient, type CapabilityDomain, type DomainId, type SecurityTask, type OverviewMetrics } from '../../capabilities-client.js';
import './sc-domain-board.js';

const DOMAIN_TABS: { id: DomainId; icon: string }[] = [
  { id: 'light', icon: 'shield-check' },
  { id: 'dark', icon: 'skull' },
  { id: 'security', icon: 'radar' },
  { id: 'legal', icon: 'scale' },
  { id: 'technology', icon: 'git-branch' },
  { id: 'business', icon: 'trending-up' },
];

@customElement('sc-capabilities-page')
export class ScCapabilitiesPage extends LitElement {
  private i18n = new I18nController(this);

  @state()
  private domains: CapabilityDomain[] = [];

  @state()
  private selectedDomain: DomainId = 'light';

  @state()
  private loading = true;

  @state()
  private metrics: OverviewMetrics | null = null;

  static styles = css`
    :host { display: block; }
    
    .page-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .page-header{
      padding: var(--sc-spacing-xl);
      border-bottom: 1px solid var(--sc-border-color);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .page-title-section {
      flex: 1;
    }
    
    .page-title{
      font-size: var(--sc-font-size-2xl);
      font-weight: 600;
      color: var(--sc-text-primary);
      margin: 0;
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
    }
    
    .page-subtitle, .page-description {
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-tertiary);
      margin-top: var(--sc-spacing-xs);
    }

    .header-actions {
      display: flex;
      gap: var(--sc-spacing-sm, 8px);
    }

    .btn {
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 16px);
      border-radius: var(--sc-radius-md, 8px);
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      cursor: pointer;
      border: none;
    }

    .btn-primary {
      background-color: var(--sc-primary, #3b82f6);
      color: white;
    }

    .btn-secondary {
      background-color: var(--sc-bg-secondary, #f8fafc);
      color: var(--sc-text-primary, #1e293b);
      border: 1px solid var(--sc-border-color, #e2e8f0);
    }
    
    .tabs-container{
      display: flex;
      gap: var(--sc-spacing-xs);
      padding: 0 var(--sc-spacing-xl);
      border-bottom: 1px solid var(--sc-border-color);
      background: var(--sc-bg-secondary);
    }
    
    .tab{
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm);
      padding: var(--sc-spacing-md) var(--sc-spacing-lg);
      font-size: var(--sc-font-size-sm);
      font-weight: 500;
      color: var(--sc-text-secondary);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }
    
    .tab:hover{
      color: var(--sc-text-primary);
      background: var(--sc-bg-tertiary);
    }
    
    .tab.active{
      color: var(--sc-primary);
      border-bottom-color: var(--sc-primary);
    }
    
    .tab-icon{
      width: 16px;
      height: 16px;
    }
    
    .content-area{
      flex: 1;
      overflow: auto;
    }
    
    .loading-container{
      display: flex;
      align-items: center;
      justify-content: center;
      height: 400px;
      color: var(--sc-text-tertiary);
    }
    
    .metrics-bar{
      display: flex;
      gap: var(--sc-spacing-lg);
      padding: var(--sc-spacing-md) var(--sc-spacing-xl);
      background: var(--sc-bg-secondary);
      border-bottom: 1px solid var(--sc-border-color);
    }
    
    .metric-card{
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm);
    }
    
    .metric-value{
      font-size: var(--sc-font-size-xl);
      font-weight: 600;
    }
    
    .metric-label{
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-tertiary);
    }
    
    .metric-positive{ color: var(--sc-success); }
    .metric-negative{ color: var(--sc-error); }
    .metric-neutral{ color: var(--sc-text-secondary); }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
  }

  private async loadData() {
    this.loading = true;
    try {
      const [domains, metrics] = await Promise.all([
        capabilitiesClient.listDomains(),
        capabilitiesClient.getOverviewMetrics(),
      ]);
      this.domains = domains.sort((a, b) => a.order - b.order);
      this.metrics = metrics;
    } catch (error) {
      console.error('[sc-capabilities-page] Failed to load data:', error);
    }
    this.loading = false;
  }

  private handleTabClick(domainId: DomainId) {
    this.selectedDomain = domainId;
  }

  private getDomain(id: DomainId): CapabilityDomain | undefined {
    return this.domains.find(d => d.id === id);
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading-container">
          ${this.i18n.t('common.loading')}
        </div>
      `;
    }

    const currentDomain = this.getDomain(this.selectedDomain);

    return html`
      <div class="page-container">
        <div class="page-header">
          <div class="page-title-section">
            <h1 class="page-title">
              <span>⚔️</span>
              ${this.i18n.t('capabilities.title')}
            </h1>
            <p class="page-description">查看和管理6大安全能力域，执行和跟踪安全任务</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary">+ 执行任务</button>
            <button class="btn btn-secondary">📋 审批</button>
          </div>
        </div>
        
        <div class="tabs-container">
          ${DOMAIN_TABS.map(tab => {
            const domain = this.getDomain(tab.id);
            const isActive = this.selectedDomain === tab.id;
            return html`
              <div 
                class="tab ${isActive ? 'active' : ''}"
                @click=${() => this.handleTabClick(tab.id)}
              >
                <span class="tab-icon">${this.getTabIcon(tab.id, domain?.color)}</span>
                ${this.i18n.t(`capabilities.domains.${tab.id}`)}
              </div>
            `;
          })}
        </div>
        
        ${this.metrics ? html`
          <div class="metrics-bar">
            <div class="metric-card">
              <span class="metric-value metric-${(this.metrics.totalRiskScore || 50) > 70 ? 'negative' : 'neutral'}">
                ${this.metrics.totalRiskScore || 0}
              </span>
              <span class="metric-label">${this.i18n.t('capabilities.metrics.riskScore')}</span>
            </div>
            <div class="metric-card">
              <span class="metric-value metric-positive">${this.metrics.totalClosureRate || 0}%</span>
              <span class="metric-label">${this.i18n.t('capabilities.metrics.closureRate')}</span>
            </div>
            <div class="metric-card">
              <span class="metric-value metric-positive">${this.metrics.totalSlaRate || 0}%</span>
              <span class="metric-label">${this.i18n.t('capabilities.metrics.slaRate')}</span>
            </div>
          </div>
        ` : ''}
        
        <div class="content-area">
          ${currentDomain ? html`
            <sc-domain-board 
              .domain=${currentDomain}
            ></sc-domain-board>
          ` : html`
            <div class="loading-container">
              ${this.i18n.t('common.noData')}
            </div>
          `}
        </div>
      </div>
    `;
  }

  private getTabIcon(domainId: DomainId, color?: string): string {
    const icons: Record<DomainId, string> = {
      light: '🛡️',
      dark: '⚔️',
      security: '🔍',
      legal: '⚖️',
      technology: '🔧',
      business: '📊',
    };
    return icons[domainId] || '📋';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-capabilities-page': ScCapabilitiesPage;
  }
}

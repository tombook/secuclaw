import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { recommendationService, type Recommendation, type NavigationAction } from '../services/recommendation-service.js';
import { roleContext } from '../store/role-context.js';
import { ROLE_THEMES, type RoleId } from '../config/role-themes.js';
import { dataService } from '../data-service.js';

const ACTION_LABELS: Record<string, string> = {
  '/vulnerabilities': '进入漏洞响应',
  '/incidents': '进入危机管理',
  '/compliance': '进入合规审计',
  '/supply-chain': '进入供应链审查',
};

@customElement('sc-smart-recommendation-bar')
export class ScSmartRecommendationBar extends LitElement {
  @state() private recommendations: Recommendation[] = [];
  @state() private collapsed = false;
  @state() private loading = false;

  private unsubscribe?: () => void;

  static styles = css`
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 1000;
      background: linear-gradient(90deg, #1e293b, #0f172a);
      border-bottom: 1px solid #334155;
      transition: all 0.3s ease;
      contain: layout style;
    }

    :host([collapsed]) {
      height: 32px;
      overflow: hidden;
    }

    .bar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      min-height: 48px;
    }

    .toggle-btn {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px 8px;
      font-size: 14px;
      transition: color 0.2s;
    }

    .toggle-btn:hover {
      color: #f1f5f9;
    }

    .rec-icon {
      font-size: 16px;
    }

    .rec-list {
      display: flex;
      flex: 1;
      gap: 12px;
      overflow-x: auto;
      scroll-behavior: smooth;
    }

    .rec-list::-webkit-scrollbar {
      height: 4px;
    }

    .rec-list::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.05);
      border-radius: 2px;
    }

    .rec-list::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.2);
      border-radius: 2px;
    }

    @media (max-width: 768px) {
      .bar {
        flex-wrap: wrap;
        padding: 8px;
      }
      .rec-icon {
        display: none;
      }
      .rec-item {
        flex-shrink: 0;
      }
    }

    .rec-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 6px;
      background: rgba(255,255,255,0.1);
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      border: 1px solid transparent;
    }

    .rec-item:hover {
      background: rgba(255,255,255,0.15);
      border-color: var(--rec-accent, #3b82f6);
    }

    .rec-item.high {
      --rec-accent: #ef4444;
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.1) 100%);
      border-left: 3px solid #ef4444;
    }

    .rec-item.medium {
      --rec-accent: #f59e0b;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.08) 100%);
      border-left: 3px solid #f59e0b;
    }

    .rec-item.low {
      --rec-accent: #3b82f6;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%);
      border-left: 3px solid #3b82f6;
    }

    .rec-priority {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .rec-priority.high {
      background: rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }

    .rec-priority.medium {
      background: rgba(245, 158, 11, 0.3);
      color: #f59e0b;
    }

    .rec-priority.low {
      background: rgba(59, 130, 246, 0.3);
      color: #3b82f6;
    }

    .rec-content {
      display: flex;
      flex-direction: column;
    }

    .rec-title {
      font-size: 13px;
      font-weight: 500;
      color: #f1f5f9;
    }

    .rec-description {
      font-size: 11px;
      color: #94a3b8;
    }

    .rec-action {
      font-size: 12px;
      padding: 4px 8px;
      background: var(--rec-accent, #3b82f6);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .rec-action:hover {
      opacity: 0.9;
    }

    .rec-action:focus {
      outline: 2px solid var(--rec-accent, #3b82f6);
      outline-offset: 2px;
    }

    .rec-dismiss {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 4px;
      font-size: 12px;
      border-radius: 4px;
    }

    .rec-dismiss:hover {
      color: #94a3b8;
      background: rgba(255,255,255,0.1);
    }

    .rec-dismiss:focus {
      outline: 2px solid #64748b;
      outline-offset: 2px;
    }

    .role-badge {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }

    .empty-state {
      color: #64748b;
      font-size: 13px;
      padding: 4px 0;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribe = recommendationService.subscribe((recs) => {
      this.recommendations = recs;
      this.loading = false;
    });
    this.loading = true;
    this.loadRecommendations();
    this.addEventListener('keydown', this.handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
    this.removeEventListener('keydown', this.handleKeyDown);
  }

  protected override willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('collapsed')) {
      if (this.collapsed) {
        this.setAttribute('collapsed', '');
      } else {
        this.removeAttribute('collapsed');
      }
    }
    super.willUpdate(changedProperties);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const recList = this.shadowRoot?.querySelector('.rec-list');
    if (!recList) return;
    
    const items = recList.querySelectorAll('.rec-item');
    const currentIndex = Array.from(items).findIndex(item => item === this.shadowRoot?.activeElement);
    
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        if (currentIndex < items.length - 1) {
          (items[currentIndex + 1] as HTMLElement)?.focus();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (currentIndex > 0) {
          (items[currentIndex - 1] as HTMLElement)?.focus();
        }
        break;
      case 'Enter':
        if (currentIndex >= 0) {
          (items[currentIndex] as HTMLElement)?.click();
        }
        break;
    }
  };

  private async loadRecommendations() {
    const context = await this.buildContext();
    await recommendationService.generateRecommendations(context);
  }

  private async buildContext() {
    try {
      const roleState = roleContext.getState();
      
      const [
        incidentStats,
        vulnStats,
        complianceStats
      ] = await Promise.all([
        dataService.getIncidentStats().catch(() => ({ open: 0 })),
        dataService.getVulnerabilityStats().catch(() => ({ bySeverity: { critical: 0 } })),
        dataService.getComplianceStats().catch(() => ({ pendingTasks: 0 })),
      ]);

      return {
        currentRole: roleState.currentRole as RoleId | null,
        securityEvents: [],
        activeIncidents: incidentStats?.open || 0,
        criticalVulnerabilities: vulnStats?.bySeverity?.critical || 0,
        pendingComplianceTasks: complianceStats?.pendingTasks || 0,
        supplyChainAlerts: 0,
        timeOfDay: this.getTimeOfDay() as 'morning' | 'afternoon' | 'evening' | 'night',
      };
    } catch (error) {
      return {
        currentRole: null,
        securityEvents: [],
        activeIncidents: 0,
        criticalVulnerabilities: 0,
        pendingComplianceTasks: 0,
        supplyChainAlerts: 0,
        timeOfDay: 'night' as const,
      };
    }
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  private handleRecommendationClick(rec: Recommendation) {
    if (rec.roleId) {
      this.dispatchEvent(new CustomEvent('enter-commander', {
        detail: { roleId: rec.roleId },
        bubbles: true,
        composed: true,
      }));
    }
    if (rec.action.type === 'navigate') {
      this.dispatchEvent(new CustomEvent('navigate', {
        detail: { path: rec.action.path },
        bubbles: true,
        composed: true,
      }));
    }
  }

  private handleDismiss(e: Event, id: string) {
    e.stopPropagation();
    recommendationService.dismissRecommendation(id);
  }

  private toggleCollapse() {
    this.collapsed = !this.collapsed;
    if (this.collapsed) {
      this.setAttribute('collapsed', '');
    } else {
      this.removeAttribute('collapsed');
    }
  }

  private getRoleIcon(roleId?: RoleId): string {
    if (!roleId) return '🤖';
    return ROLE_THEMES[roleId]?.icon || '🤖';
  }

  private getRoleColor(roleId?: RoleId): string {
    if (!roleId) return '#3b82f6';
    return ROLE_THEMES[roleId]?.colors.primary || '#3b82f6';
  }

  render() {
    return html`
      <div class="bar">
        <button class="toggle-btn" @click=${this.toggleCollapse}>
          ${this.collapsed ? '▶' : '▼'}
        </button>
        
        <span class="rec-icon">🔍</span>
        
        <div class="rec-list">
          ${this.recommendations.length === 0 
            ? html`<span class="empty-state">暂无推荐</span>`
            : this.recommendations.map(rec => {
              const action = rec.action as NavigationAction;
              const label = ACTION_LABELS[action.path] || '查看详情';
              return html`
                <div 
                  class="rec-item ${rec.priority}"
                  @click=${() => this.handleRecommendationClick(rec)}
                >
                  <span 
                    class="role-badge" 
                    style="background: ${this.getRoleColor(rec.roleId)}20; color: ${this.getRoleColor(rec.roleId)}"
                  >
                    ${this.getRoleIcon(rec.roleId)}
                  </span>
                  <span class="rec-priority ${rec.priority}">${rec.priority}</span>
                  <div class="rec-content">
                    <span class="rec-title">${rec.title}</span>
                    <span class="rec-description">${rec.description}</span>
                  </div>
                  <button class="rec-action" @click=${(e: Event) => { e.stopPropagation(); this.handleRecommendationClick(rec); }}>
                    ${label}
                  </button>
                  ${rec.dismissible ? html`
                    <button class="rec-dismiss" @click=${(e: Event) => this.handleDismiss(e, rec.id)}>
                      ✕
                    </button>
                  ` : ''}
                </div>
              `;
            })}
          }
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-smart-recommendation-bar': ScSmartRecommendationBar;
  }
}

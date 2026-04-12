/**
 * sc-kpi-explain-drawer.ts
 * KPI Explanation Drawer
 * 
 * Provides explanations for KPI formulas and data sources.
 * Per spec section 4.7: opens from KPI card click, shows domain-specific
 * KPI attribution factors with formulas, thresholds, and current values.
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { I18nController } from '../../../i18n/lib/lit-controller.js';
import '../../components/design-system/sc-button.js';
import type { DomainKPI, DomainId } from '../../capabilities-client.js';

interface KPIExplanation {
  id: string;
  name: string;
  formula: string;
  description?: string;
  currentValue?: number;
  threshold: number | string;
  unit: string;
  dataSource?: string;
  refreshPolicy?: string;
}

const DOMAIN_KPI_DEFINITIONS: Record<DomainId, KPIExplanation[]> = {
  light: [
    { id: 'baseline-compliance', name: '基线合规率', formula: '合规项 / 总检查项 × 100%', threshold: 95, unit: '%' },
    { id: 'vuln-closure', name: '漏洞闭环率', formula: '关闭漏洞数 / 发现漏洞数 × 100%', threshold: 90, unit: '%' },
    { id: 'p1-mttr', name: 'P1事件MTTR', formula: '平均修复时间(分钟)', threshold: 240, unit: '分钟' },
  ],
  dark: [
    { id: 'auth-coverage', name: '授权覆盖率', formula: '已授权操作 / 总操作 × 100%', threshold: 100, unit: '%' },
    { id: 'unauthorized-exec', name: '越权执行', formula: '越权执行次数', threshold: 0, unit: '次' },
    { id: 'drill-review', name: '演练复盘完成率', formula: '复盘完成数 / 演练总数 × 100%', threshold: 100, unit: '%' },
  ],
  security: [
    { id: 'alert-effective', name: '告警有效率', formula: '有效告警数 / 总告警数 × 100%', threshold: 70, unit: '%' },
    { id: 'mttd', name: 'MTTD', formula: '平均检测时间(分钟)', threshold: 15, unit: '分钟' },
    { id: 'mitre-coverage', name: 'MITRE覆盖度', formula: '关键战术覆盖数 / 总战术数 × 100%', threshold: 80, unit: '%' },
  ],
  legal: [
    { id: 'high-risk-closure', name: '高风险条款闭环率', formula: '已整改高风险条款 / 总高风险条款 × 100%', threshold: 95, unit: '%' },
    { id: 'audit-pass', name: '审计一次通过率', formula: '一次通过审计项 / 总审计项 × 100%', threshold: 90, unit: '%' },
    { id: 'evidence-complete', name: '证据完备率', formula: '证据包完整数 / 总证据包 × 100%', threshold: 100, unit: '%' },
  ],
  technology: [
    { id: 'arch-defect-closure', name: '高风险架构缺陷关闭率', formula: '已关闭高风险架构缺陷 / 总架构缺陷 × 100%', threshold: 90, unit: '%' },
    { id: 'gate-effective', name: '门禁拦截有效率', formula: '有效拦截数 / 总拦截数 × 100%', threshold: 95, unit: '%' },
    { id: 'rto-rpo', name: 'RTO/RPO达标率', formula: '达标的RTO/RPO数量 / 总RTO/RPO数量 × 100%', threshold: 95, unit: '%' },
  ],
  business: [
    { id: 'biz-process-coverage', name: '高风险业务流程覆盖', formula: '已覆盖高风险业务流程 / 总业务流程 × 100%', threshold: 95, unit: '%' },
    { id: 'ale-coverage', name: 'ALE量化覆盖', formula: '已量化ALE的业务 / 总业务数 × 100%', threshold: 85, unit: '%' },
    { id: 'security-roi', name: '安全ROI可解释', formula: '(安全投入收益 / 总安全投入) × 100%', threshold: 100, unit: '%' },
  ],
};

const KPI_SUMMARY_MAP: Record<string, { label: string; extract: (kpi: DomainKPI) => number }> = {
  riskScore: { label: '风险评分', extract: (kpi) => kpi.riskScore },
  closureRate: { label: '闭环率', extract: (kpi) => kpi.closureRate },
  slaRate: { label: 'SLA达成率', extract: (kpi) => kpi.slaRate },
  trend: { label: '趋势', extract: (kpi) => kpi.trend },
};

@customElement('sc-kpi-explain-drawer')
export class ScKpiExplainDrawer extends LitElement {
  private i18n = new I18nController(this);

  @property({ type: Boolean })
  isOpen = false;

  @property({ type: String })
  domainId?: DomainId;

  @property({ type: Object })
  kpi?: DomainKPI;

  static styles = css`
    :host {
      display: block;
    }

    /* Backdrop */
    .drawer-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 1100;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }

    .drawer-backdrop.open {
      opacity: 1;
      pointer-events: auto;
    }

    /* Drawer Panel */
    .drawer-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 480px;
      height: 100vh;
      background: var(--sc-bg-primary, #ffffff);
      border-left: 1px solid var(--sc-border-color, #e5e7eb);
      box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
      z-index: 1200;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .drawer-panel.open {
      transform: translateX(0);
    }

    /* Header */
    .drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--sc-spacing-lg, 16px);
      border-bottom: 1px solid var(--sc-border-color, #e5e7eb);
      flex-shrink: 0;
    }

    .drawer-title {
      font-size: var(--sc-font-size-lg, 18px);
      font-weight: 600;
      color: var(--sc-text-primary, #111827);
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: var(--sc-radius-md, 6px);
      color: var(--sc-text-secondary, #6b7280);
      transition: background 0.2s;
      font-size: 16px;
    }

    .close-btn:hover {
      background: var(--sc-bg-tertiary, #f3f4f6);
    }

    /* Content */
    .drawer-content {
      flex: 1;
      overflow-y: auto;
      padding: var(--sc-spacing-lg, 16px);
    }

    /* KPI Summary Bar */
    .kpi-summary {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--sc-spacing-sm, 8px);
      margin-bottom: var(--sc-spacing-xl, 24px);
    }

    .kpi-summary-card {
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 12px);
      background: var(--sc-bg-secondary, #f9fafb);
      border-radius: var(--sc-radius-md, 6px);
      border: 1px solid var(--sc-border-color, #e5e7eb);
    }

    .kpi-summary-value {
      font-size: var(--sc-font-size-xl, 20px);
      font-weight: 600;
      color: var(--sc-text-primary, #111827);
    }

    .kpi-summary-label {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-tertiary, #9ca3af);
      margin-top: 2px;
    }

    .kpi-positive { color: var(--sc-success, #10b981); }
    .kpi-negative { color: var(--sc-error, #ef4444); }
    .kpi-neutral { color: var(--sc-text-secondary, #6b7280); }

    /* Section */
    .section-title {
      font-size: var(--sc-font-size-md, 16px);
      font-weight: 600;
      color: var(--sc-text-primary, #111827);
      margin-bottom: var(--sc-spacing-md, 12px);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* KPI Explanation Card */
    .kpi-card {
      background: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e5e7eb);
      border-radius: var(--sc-radius-lg, 8px);
      padding: var(--sc-spacing-md, 12px);
      margin-bottom: var(--sc-spacing-md, 12px);
      transition: border-color 0.2s;
    }

    .kpi-card:hover {
      border-color: var(--sc-primary, #3b82f6);
    }

    .kpi-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--sc-spacing-sm, 8px);
    }

    .kpi-card-name {
      font-size: var(--sc-font-size-md, 16px);
      font-weight: 600;
      color: var(--sc-text-primary, #111827);
    }

    .kpi-card-id {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-tertiary, #9ca3af);
      font-family: 'Fira Code', 'Consolas', monospace;
    }

    .kpi-formula {
      background: var(--sc-bg-secondary, #f9fafb);
      border-radius: var(--sc-radius-md, 6px);
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 12px);
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #6b7280);
      margin-bottom: var(--sc-spacing-sm, 8px);
      white-space: pre-wrap;
    }

    .kpi-meta {
      display: flex;
      gap: var(--sc-spacing-lg, 16px);
      font-size: var(--sc-font-size-xs, 12px);
    }

    .kpi-meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--sc-text-tertiary, #9ca3af);
    }

    .kpi-meta-value {
      font-weight: 600;
      color: var(--sc-text-secondary, #6b7280);
    }

    .threshold-met {
      color: var(--sc-success, #10b981);
    }

    .threshold-unmet {
      color: var(--sc-error, #ef4444);
    }

    /* Footer */
    .drawer-footer {
      flex-shrink: 0;
      padding: var(--sc-spacing-lg, 16px);
      border-top: 1px solid var(--sc-border-color, #e5e7eb);
    }

    .btn {
      width: 100%;
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 12px);
      border: none;
      border-radius: var(--sc-radius-md, 6px);
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-secondary {
      background: var(--sc-bg-tertiary, #f3f4f6);
      color: var(--sc-text-primary, #111827);
    }

    .btn-secondary:hover {
      background: var(--sc-border-color, #e5e7eb);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      color: var(--sc-text-tertiary, #9ca3af);
      padding: var(--sc-spacing-xl, 24px);
    }
  `;

  private handleClose() {
    this.dispatchEvent(new CustomEvent('close-drawer', {
      bubbles: true,
      composed: true,
    }));
  }

  private getDomainKpis(): KPIExplanation[] {
    if (!this.domainId) return [];
    return DOMAIN_KPI_DEFINITIONS[this.domainId] || [];
  }

  private formatKpiValue(key: string, value: number): string {
    if (key === 'trend') {
      return `${value >= 0 ? '↑' : '↓'} ${Math.abs(value * 100).toFixed(0)}%`;
    }
    if (key === 'riskScore') {
      return `${value}`;
    }
    return `${value}%`;
  }

  private getKpiColorClass(key: string, value: number): string {
    if (key === 'riskScore') return value > 70 ? 'kpi-negative' : 'kpi-neutral';
    if (key === 'trend') return value >= 0 ? 'kpi-positive' : 'kpi-negative';
    return 'kpi-positive';
  }

  private checkThreshold(currentValue: number | undefined, threshold: number | string): boolean | null {
    if (currentValue === undefined) return null;
    if (typeof threshold === 'string') return null;
    return currentValue >= threshold;
  }

  render() {
    const kpis = this.getDomainKpis();

    return html`
      <!-- Backdrop -->
      <div 
        class="drawer-backdrop ${this.isOpen ? 'open' : ''}" 
        @click=${this.handleClose}
      ></div>

      <!-- Drawer Panel -->
      <div class="drawer-panel ${this.isOpen ? 'open' : ''}">
        <div class="drawer-header">
          <h2 class="drawer-title">📊 KPI 归因解释</h2>
          <sc-button variant="secondary" size="sm" class="close-btn" @click=${this.handleClose}>✕</sc-button>
        </div>

        <div class="drawer-content">
          <!-- KPI Summary from current domain data -->
          ${this.kpi ? html`
            <div class="kpi-summary">
              ${Object.entries(KPI_SUMMARY_MAP).map(([key, { label, extract }]) => {
                const value = extract(this.kpi!);
                return html`
                  <div class="kpi-summary-card">
                    <div class="kpi-summary-value ${this.getKpiColorClass(key, value)}">
                      ${this.formatKpiValue(key, value)}
                    </div>
                    <div class="kpi-summary-label">${label}</div>
                  </div>
                `;
              })}
            </div>
          ` : ''}

          <!-- Domain KPI Explanations -->
          <h3 class="section-title">📋 ${this.domainId ? this.getDomainName(this.domainId) : ''}指标定义</h3>

          ${kpis.length === 0 ? html`
            <div class="empty-state">
              <p>${this.i18n.t('common.noData')}</p>
            </div>
          ` : html`
            ${kpis.map(kpi => {
              const thresholdMet = this.checkThreshold(kpi.currentValue, kpi.threshold);
              return html`
                <div class="kpi-card">
                  <div class="kpi-card-header">
                    <span class="kpi-card-name">${kpi.name}</span>
                    <span class="kpi-card-id">${kpi.id}</span>
                  </div>
                  
                  <div class="kpi-formula">${kpi.formula}</div>

                  <div class="kpi-meta">
                    <div class="kpi-meta-item">
                      🎯 目标:
                      <span class="kpi-meta-value">${kpi.threshold}${kpi.unit === '%' ? '%' : ' ' + kpi.unit}</span>
                    </div>
                    ${kpi.currentValue !== undefined ? html`
                      <div class="kpi-meta-item">
                        📊 当前:
                        <span class="kpi-meta-value ${thresholdMet === true ? 'threshold-met' : thresholdMet === false ? 'threshold-unmet' : ''}">
                          ${kpi.currentValue}${kpi.unit === '%' ? '%' : ' ' + kpi.unit}
                        </span>
                      </div>
                    ` : ''}
                  </div>

                  ${kpi.description ? html`
                    <p style="font-size: 12px; color: var(--sc-text-tertiary, #9ca3af); margin-top: 8px;">
                      ${kpi.description}
                    </p>
                  ` : ''}
                </div>
              `;
            })}
          `}
        </div>

        <div class="drawer-footer">
          <sc-button variant="secondary" @click=${this.handleClose}>
            ${this.i18n.t('common.close')}
          </sc-button>
        </div>
      </div>
    `;
  }

  private getDomainName(domainId: DomainId): string {
    const names: Record<DomainId, string> = {
      light: '光域',
      dark: '暗域',
      security: '安全运营',
      legal: '法律合规',
      technology: '技术架构',
      business: '业务连续性',
    };
    return names[domainId] || '';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-kpi-explain-drawer': ScKpiExplainDrawer;
  }
}

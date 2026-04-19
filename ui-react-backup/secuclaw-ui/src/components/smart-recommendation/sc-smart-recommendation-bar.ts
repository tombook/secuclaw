/**
 * sc-smart-recommendation-bar — 智能推荐条
 * 基于 Triggers 自动推荐角色和场景
 *
 * @see v2.0 文档 第 2 章 Triggers + 第 3.1 节 推荐条
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { RoleId } from '../../config/role-tool-config';
import { ROLE_TOOL_CONFIGS } from '../../config/role-tool-config';
import { generateRecommendations, type Recommendation, type TriggerContext } from '../../services/recommendation-service';

@customElement('sc-smart-recommendation-bar')
export class ScSmartRecommendationBar extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      background: var(--role-bg-surface);
      border-bottom: 1px solid var(--role-border);
      min-height: 40px;
      overflow-x: auto;
    }

    .label {
      font-size: 11px;
      color: var(--role-text-muted);
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .label .icon {
      font-size: 14px;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 11px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 150ms ease;
      border: none;
    }

    .chip:hover {
      transform: scale(1.05);
      filter: brightness(1.1);
    }

    .chip.high {
      background: var(--role-danger);
      color: white;
    }

    .chip.medium {
      background: var(--role-warning);
      color: var(--role-bg);
    }

    .chip.low {
      background: var(--role-secondary);
      color: white;
    }

    .chip .role-tag {
      font-weight: 700;
    }

    .dismiss-btn {
      margin-left: auto;
      background: none;
      border: none;
      color: var(--role-text-muted);
      cursor: pointer;
      font-size: 14px;
      padding: 4px;
    }

    .dismiss-btn:hover {
      color: var(--role-text);
    }

    .empty {
      font-size: 11px;
      color: var(--role-text-muted);
    }
  `;

  @property({ type: Object }) context?: TriggerContext;

  private _getRecommendations(): Recommendation[] {
    if (!this.context) {
      // Default mock context for demo
      this.context = {
        activeAlerts: 142,
        hasCriticalVulns: true,
        maxCvss: 8.5,
        patchCoverage: 68,
        gdprCompliance: 82,
        privacyRequestBacklog: 25,
        securityScore: 64,
        pendingAlerts: 23,
        falsePositiveRate: 18,
        highRiskVendors: 3,
        sbomCoverage: 55,
        budgetUsage: 72,
        riskScore: 48,
        activeEvents: 6,
        bcpDrillDue: false,
        newSystemOnline: false,
        archChangeRequest: false,
      };
    }
    return generateRecommendations(this.context);
  }

  private _onChipClick(rec: Recommendation) {
    this.dispatchEvent(new CustomEvent('role-recommended', {
      detail: { roleId: rec.roleId, scenario: rec.scenario },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    const recs = this._getRecommendations();

    return html`
      <div class="bar">
        <span class="label"><span class="icon">🤖</span> AI 推荐</span>
        ${recs.length > 0
          ? recs.map(rec => html`
            <button
              class="chip ${rec.priority}"
              @click=${() => this._onChipClick(rec)}
              title="${rec.description}"
            >
              <span class="role-tag">${rec.roleLabel}</span>
              ${rec.scenario}
            </button>
          `)
          : html`<span class="empty">当前无推荐</span>`
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-smart-recommendation-bar': ScSmartRecommendationBar;
  }
}

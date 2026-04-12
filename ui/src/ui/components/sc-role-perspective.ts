import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { RoleId } from '../store/role-context.js';
import {
  ROLE_PERSPECTIVE_CONFIG,
  type DataType,
  type PerspectiveConfig,
  getAllRolePerspectives,
  compareRolePerspectives,
} from '../config/role-perspective-config.js';

interface RoleInfo {
  id: RoleId;
  emoji: string;
  shortLabel: string;
}

const ROLE_INFOS: RoleInfo[] = [
  { id: 'security-expert', emoji: '🔐', shortLabel: '安全专家' },
  { id: 'privacy-officer', emoji: '🔒', shortLabel: '隐私官' },
  { id: 'security-architect', emoji: '🏗️', shortLabel: '架构师' },
  { id: 'business-security-officer', emoji: '📊', shortLabel: '业务官' },
  { id: 'secuclaw-commander', emoji: '🎯', shortLabel: '指挥官' },
  { id: 'ciso', emoji: '👔', shortLabel: 'CISO' },
  { id: 'security-ops', emoji: '⚙️', shortLabel: '运营官' },
  { id: 'supply-chain-security', emoji: '🔗', shortLabel: '供应链' },
];

@customElement('sc-role-perspective')
export class ScRolePerspective extends LitElement {
  @property({ type: String })
  dataType: DataType = 'incidents';

  @property({ type: Object, attribute: false })
  data: any = null;

  @property({ type: String, attribute: false })
  currentRole: RoleId = 'security-expert';

  @state()
  private selectedPerspective: RoleId = 'security-expert';

  @state()
  private compareMode: boolean = false;

  @state()
  private compareRole1: RoleId | null = null;

  @state()
  private compareRole2: RoleId | null = null;

  static styles = css`
    :host {
      display: block;
      font-family: var(--sc-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    }

    .perspective-container {
      background-color: var(--sc-bg-card, #1e293b);
      border: 1px solid var(--sc-border-color, #334155);
      border-radius: var(--sc-radius-lg, 0.5rem);
      overflow: hidden;
    }

    .perspective-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--sc-spacing-md, 1rem);
      border-bottom: 1px solid var(--sc-border-color, #334155);
      background-color: var(--sc-bg-secondary, #1e3a5f);
    }

    .perspective-title {
      font-size: var(--sc-font-size-md, 1rem);
      font-weight: 600;
      color: var(--sc-text-primary, #f8fafc);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 0.5rem);
    }

    .perspective-title .emoji {
      font-size: 1.25rem;
    }

    .mode-toggle {
      display: flex;
      gap: var(--sc-spacing-sm, 0.5rem);
    }

    .mode-button {
      padding: var(--sc-spacing-xs, 0.25rem) var(--sc-spacing-sm, 0.5rem);
      background-color: var(--sc-bg-tertiary, #334155);
      border: 1px solid var(--sc-border-color, #334155);
      border-radius: var(--sc-radius-sm, 0.25rem);
      color: var(--sc-text-secondary, #cbd5e1);
      font-size: var(--sc-font-size-xs, 0.75rem);
      cursor: pointer;
      transition: all var(--sc-transition-fast, 150ms ease);
    }

    .mode-button:hover {
      background-color: var(--sc-bg-hover, #475569);
      border-color: var(--sc-primary, #3b82f6);
    }

    .mode-button.active {
      background-color: var(--sc-primary, #3b82f6);
      color: white;
      border-color: var(--sc-primary, #3b82f6);
    }

    .tabs-container {
      display: flex;
      gap: var(--sc-spacing-xs, 0.25rem);
      padding: var(--sc-spacing-sm, 0.5rem);
      background-color: var(--sc-bg-tertiary, #334155);
      border-bottom: 1px solid var(--sc-border-color, #334155);
      overflow-x: auto;
    }

    .role-tab {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs, 0.25rem);
      padding: var(--sc-spacing-xs, 0.25rem) var(--sc-spacing-sm, 0.5rem);
      background-color: transparent;
      border: 1px solid transparent;
      border-radius: var(--sc-radius-sm, 0.25rem);
      color: var(--sc-text-secondary, #cbd5e1);
      font-size: var(--sc-font-size-xs, 0.75rem);
      cursor: pointer;
      transition: all var(--sc-transition-fast, 150ms ease);
      white-space: nowrap;
    }

    .role-tab:hover {
      background-color: var(--sc-bg-hover, #475569);
    }

    .role-tab.active {
      background-color: var(--sc-primary, #3b82f6);
      color: white;
    }

    .role-tab .emoji {
      font-size: 1rem;
    }

    .perspective-content {
      padding: var(--sc-spacing-md, 1rem);
    }

    .perspective-summary {
      display: flex;
      align-items: flex-start;
      gap: var(--sc-spacing-md, 1rem);
      padding: var(--sc-spacing-md, 1rem);
      background-color: var(--sc-bg-secondary, #1e3a5f);
      border-left: 3px solid var(--sc-primary, #3b82f6);
      border-radius: var(--sc-radius-md, 0.375rem);
      margin-bottom: var(--sc-spacing-md, 1rem);
    }

    .perspective-summary .emoji {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .perspective-summary-content {
      flex: 1;
    }

    .perspective-summary-title {
      font-size: var(--sc-font-size-sm, 0.875rem);
      font-weight: 600;
      color: var(--sc-text-primary, #f8fafc);
      margin-bottom: var(--sc-spacing-xs, 0.25rem);
    }

    .perspective-summary-text {
      font-size: var(--sc-font-size-sm, 0.875rem);
      color: var(--sc-text-secondary, #cbd5e1);
      line-height: 1.5;
    }

    .focus-fields-section {
      margin-top: var(--sc-spacing-md, 1rem);
    }

    .section-title {
      font-size: var(--sc-font-size-sm, 0.875rem);
      font-weight: 600;
      color: var(--sc-text-primary, #f8fafc);
      margin-bottom: var(--sc-spacing-sm, 0.5rem);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs, 0.25rem);
    }

    .focus-fields-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--sc-spacing-sm, 0.5rem);
    }

    .focus-field-card {
      padding: var(--sc-spacing-sm, 0.5rem);
      background-color: var(--sc-bg-tertiary, #334155);
      border: 1px solid var(--sc-border-color, #334155);
      border-radius: var(--sc-radius-sm, 0.25rem);
      font-size: var(--sc-font-size-xs, 0.75rem);
      color: var(--sc-text-secondary, #cbd5e1);
      transition: all var(--sc-transition-fast, 150ms ease);
    }

    .focus-field-card:hover {
      border-color: var(--sc-primary, #3b82f6);
      background-color: var(--sc-bg-hover, #475569);
    }

    .highlight-keywords-section {
      margin-top: var(--sc-spacing-md, 1rem);
    }

    .keywords-list {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sc-spacing-xs, 0.25rem);
    }

    .keyword-tag {
      padding: 2px 8px;
      background-color: var(--sc-primary-light, rgba(59, 130, 246, 0.1));
      color: var(--sc-primary, #3b82f6);
      border-radius: var(--sc-radius-full, 999px);
      font-size: var(--sc-font-size-xs, 0.75rem);
      font-weight: 500;
    }

    .compare-view {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--sc-spacing-lg, 1.5rem);
    }

    .compare-panel {
      background-color: var(--sc-bg-secondary, #1e3a5f);
      border: 1px solid var(--sc-border-color, #334155);
      border-radius: var(--sc-radius-md, 0.375rem);
      padding: var(--sc-spacing-md, 1rem);
    }

    .compare-panel-header {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 0.5rem);
      padding-bottom: var(--sc-spacing-sm, 0.5rem);
      border-bottom: 1px solid var(--sc-border-color, #334155);
      margin-bottom: var(--sc-spacing-md, 1rem);
    }

    .compare-panel-header .emoji {
      font-size: 1.5rem;
    }

    .compare-panel-title {
      font-size: var(--sc-font-size-md, 1rem);
      font-weight: 600;
      color: var(--sc-text-primary, #f8fafc);
    }

    .compare-section {
      margin-bottom: var(--sc-spacing-md, 1rem);
    }

    .compare-section-title {
      font-size: var(--sc-font-size-xs, 0.75rem);
      font-weight: 600;
      color: var(--sc-text-tertiary, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: var(--sc-spacing-xs, 0.25rem);
    }

    .compare-section-content {
      font-size: var(--sc-font-size-sm, 0.875rem);
      color: var(--sc-text-secondary, #cbd5e1);
      line-height: 1.5;
    }

    .compare-selector {
      display: flex;
      gap: var(--sc-spacing-sm, 0.5rem);
      padding: var(--sc-spacing-sm, 0.5rem);
      background-color: var(--sc-bg-tertiary, #334155);
      border-bottom: 1px solid var(--sc-border-color, #334155);
      overflow-x: auto;
    }

    .compare-select {
      padding: var(--sc-spacing-xs, 0.25rem) var(--sc-spacing-sm, 0.5rem);
      background-color: var(--sc-bg-card, #1e293b);
      border: 1px solid var(--sc-border-color, #334155);
      border-radius: var(--sc-radius-sm, 0.25rem);
      color: var(--sc-text-primary, #f8fafc);
      font-size: var(--sc-font-size-xs, 0.75rem);
      cursor: pointer;
      transition: all var(--sc-transition-fast, 150ms ease);
    }

    .compare-select:hover {
      border-color: var(--sc-primary, #3b82f6);
    }

    .compare-select.selected {
      background-color: var(--sc-primary, #3b82f6);
      color: white;
      border-color: var(--sc-primary, #3b82f6);
    }

    .empty-state {
      padding: var(--sc-spacing-lg, 1.5rem);
      text-align: center;
      color: var(--sc-text-tertiary, #64748b);
    }

    .empty-state-icon {
      font-size: 2rem;
      margin-bottom: var(--sc-spacing-sm, 0.5rem);
    }

    .highlighted-text {
      background-color: var(--sc-primary-light, rgba(59, 130, 246, 0.2));
      padding: 0 2px;
      border-radius: 2px;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .compare-view {
        grid-template-columns: 1fr;
      }

      .focus-fields-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.selectedPerspective = this.currentRole;
  }

  private handlePerspectiveSelect(roleId: RoleId) {
    this.selectedPerspective = roleId;
  }

  private handleCompareModeToggle() {
    this.compareMode = !this.compareMode;
    if (this.compareMode) {
      this.compareRole1 = this.currentRole;
      this.compareRole2 = ROLE_INFOS.find(r => r.id !== this.currentRole)?.id || null;
    } else {
      this.compareRole1 = null;
      this.compareRole2 = null;
    }
  }

  private handleCompareRoleSelect(roleId: RoleId, slot: 'role1' | 'role2') {
    if (slot === 'role1') {
      this.compareRole1 = roleId;
    } else {
      this.compareRole2 = roleId;
    }
  }

  private getPerspectiveConfig(roleId: RoleId): PerspectiveConfig {
    return ROLE_PERSPECTIVE_CONFIG[roleId]?.[this.dataType] || {
      focusFields: [],
      highlightKeywords: [],
      summary: '默认视角'
    };
  }

  private highlightText(text: string, keywords: string[]): string {
    if (!keywords.length) return text;
    const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
    return text.replace(regex, '<span class="highlighted-text">$1</span>');
  }

  private renderRoleTabs() {
    return html`
      <div class="tabs-container">
        ${ROLE_INFOS.map(role => html`
          <div
            class="role-tab ${this.selectedPerspective === role.id ? 'active' : ''}"
            @click=${() => this.handlePerspectiveSelect(role.id)}
          >
            <span class="emoji">${role.emoji}</span>
            <span>${role.shortLabel}</span>
          </div>
        `)}
      </div>
    `;
  }

  private renderCompareSelector() {
    return html`
      <div class="compare-selector">
        <div style="flex: 1;">
          <label style="font-size: 0.75rem; color: var(--sc-text-tertiary, #64748b); margin-right: 8px;">角色 1:</label>
          ${ROLE_INFOS.map(role => html`
            <button
              class="compare-select ${this.compareRole1 === role.id ? 'selected' : ''}"
              @click=${() => this.handleCompareRoleSelect(role.id, 'role1')}
            >
              ${role.emoji} ${role.shortLabel}
            </button>
          `)}
        </div>
        <div style="flex: 1;">
          <label style="font-size: 0.75rem; color: var(--sc-text-tertiary, #64748b); margin-right: 8px;">角色 2:</label>
          ${ROLE_INFOS.map(role => html`
            <button
              class="compare-select ${this.compareRole2 === role.id ? 'selected' : ''}"
              @click=${() => this.handleCompareRoleSelect(role.id, 'role2')}
            >
              ${role.emoji} ${role.shortLabel}
            </button>
          `)}
        </div>
      </div>
    `;
  }

  private renderSinglePerspective() {
    const config = this.getPerspectiveConfig(this.selectedPerspective);
    const roleInfo = ROLE_INFOS.find(r => r.id === this.selectedPerspective);

    return html`
      <div class="perspective-content">
        <div class="perspective-summary">
          <span class="emoji">${roleInfo?.emoji || '👤'}</span>
          <div class="perspective-summary-content">
            <div class="perspective-summary-title">${roleInfo?.shortLabel || this.selectedPerspective} 视角</div>
            <div class="perspective-summary-text">${config.summary}</div>
          </div>
        </div>

        ${config.focusFields.length > 0 ? html`
          <div class="focus-fields-section">
            <div class="section-title">🎯 关注字段</div>
            <div class="focus-fields-grid">
              ${config.focusFields.map(field => html`
                <div class="focus-field-card">${field}</div>
              `)}
            </div>
          </div>
        ` : ''}

        ${config.highlightKeywords.length > 0 ? html`
          <div class="highlight-keywords-section">
            <div class="section-title">✨ 高亮关键词</div>
            <div class="keywords-list">
              ${config.highlightKeywords.map(keyword => html`
                <span class="keyword-tag">${keyword}</span>
              `)}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderComparePerspective() {
    if (!this.compareRole1 || !this.compareRole2) {
      return html`
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <div>请选择两个角色进行比较</div>
        </div>
      `;
    }

    const comparison = compareRolePerspectives(this.compareRole1, this.compareRole2, this.dataType);
    const role1Info = ROLE_INFOS.find(r => r.id === this.compareRole1);
    const role2Info = ROLE_INFOS.find(r => r.id === this.compareRole2);

    return html`
      <div class="perspective-content">
        <div class="compare-view">
          <div class="compare-panel">
            <div class="compare-panel-header">
              <span class="emoji">${role1Info?.emoji || '👤'}</span>
              <span class="compare-panel-title">${role1Info?.shortLabel || this.compareRole1}</span>
            </div>
            <div class="compare-section">
              <div class="compare-section-title">视角概述</div>
              <div class="compare-section-content">${comparison.role1.summary}</div>
            </div>
            <div class="compare-section">
              <div class="compare-section-title">关注字段 (${comparison.role1.focusFields.length})</div>
              <div class="focus-fields-grid">
                ${comparison.role1.focusFields.map(field => html`
                  <div class="focus-field-card">${field}</div>
                `)}
              </div>
            </div>
          </div>

          <div class="compare-panel">
            <div class="compare-panel-header">
              <span class="emoji">${role2Info?.emoji || '👤'}</span>
              <span class="compare-panel-title">${role2Info?.shortLabel || this.compareRole2}</span>
            </div>
            <div class="compare-section">
              <div class="compare-section-title">视角概述</div>
              <div class="compare-section-content">${comparison.role2.summary}</div>
            </div>
            <div class="compare-section">
              <div class="compare-section-title">关注字段 (${comparison.role2.focusFields.length})</div>
              <div class="focus-fields-grid">
                ${comparison.role2.focusFields.map(field => html`
                  <div class="focus-field-card">${field}</div>
                `)}
              </div>
            </div>
          </div>
        </div>

        ${comparison.commonFields.length > 0 ? html`
          <div class="focus-fields-section" style="margin-top: 1.5rem;">
            <div class="section-title">🤝 共同关注字段</div>
            <div class="focus-fields-grid">
              ${comparison.commonFields.map(field => html`
                <div class="focus-field-card">${field}</div>
              `)}
            </div>
          </div>
        ` : ''}

        ${comparison.uniqueToRole1.length > 0 || comparison.uniqueToRole2.length > 0 ? html`
          <div class="compare-view" style="margin-top: 1.5rem;">
            <div class="compare-panel">
              <div class="compare-section">
                <div class="compare-section-title">独有字段 (${role1Info?.shortLabel})</div>
                ${comparison.uniqueToRole1.length > 0 ? html`
                  <div class="focus-fields-grid">
                    ${comparison.uniqueToRole1.map(field => html`
                      <div class="focus-field-card">${field}</div>
                    `)}
                  </div>
                ` : html`<div style="color: var(--sc-text-tertiary, #64748b); font-size: 0.875rem;">无独有字段</div>`}
              </div>
            </div>

            <div class="compare-panel">
              <div class="compare-section">
                <div class="compare-section-title">独有字段 (${role2Info?.shortLabel})</div>
                ${comparison.uniqueToRole2.length > 0 ? html`
                  <div class="focus-fields-grid">
                    ${comparison.uniqueToRole2.map(field => html`
                      <div class="focus-field-card">${field}</div>
                    `)}
                  </div>
                ` : html`<div style="color: var(--sc-text-tertiary, #64748b); font-size: 0.875rem;">无独有字段</div>`}
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  render() {
    const dataTypeLabel = {
      'incidents': '安全事件',
      'threats': '威胁情报',
      'vulnerabilities': '漏洞管理'
    };

    return html`
      <div class="perspective-container">
        <div class="perspective-header">
          <div class="perspective-title">
            <span class="emoji">👁️</span>
            <span>角色视角 - ${dataTypeLabel[this.dataType]}</span>
          </div>
          <div class="mode-toggle">
            <button
              class="mode-button ${!this.compareMode ? 'active' : ''}"
              @click=${() => { if (this.compareMode) this.handleCompareModeToggle(); }}
            >
              单视角
            </button>
            <button
              class="mode-button ${this.compareMode ? 'active' : ''}"
              @click=${() => { if (!this.compareMode) this.handleCompareModeToggle(); }}
            >
              对比模式
            </button>
          </div>
        </div>

        ${this.compareMode ? this.renderCompareSelector() : this.renderRoleTabs()}

        ${this.compareMode ? this.renderComparePerspective() : this.renderSinglePerspective()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-role-perspective': ScRolePerspective;
  }
}

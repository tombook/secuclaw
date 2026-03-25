import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { skillStore, type SkillDefinition } from '../store/skill-store.js';

@customElement('sc-skill-panel')
export class ScSkillPanel extends LitElement {
  private i18n = new I18nController(this);

  @property({ type: String })
  roleId: string = 'security-expert';

  static styles = css`
    :host {
      display: block;
      grid-column: 1 / -1;
    }
    .panel {
      background-color: var(--sc-bg-card);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-lg);
      padding: var(--sc-spacing-lg);
    }
    .panel-header {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md);
      margin-bottom: var(--sc-spacing-lg);
    }
    .panel-icon { font-size: 32px; }
    .panel-title {
      font-size: var(--sc-font-size-xl);
      font-weight: 600;
      color: var(--sc-text-primary);
    }
    .capabilities-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--sc-spacing-md);
    }
    @media (max-width: 768px) {
      .capabilities-grid { grid-template-columns: 1fr; }
    }
    .capability-card {
      background-color: var(--sc-bg-secondary);
      border-radius: var(--sc-radius-md);
      padding: var(--sc-spacing-md);
    }
    .capability-header {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm);
      margin-bottom: var(--sc-spacing-sm);
    }
    .capability-icon { font-size: 18px; }
    .capability-title {
      font-size: var(--sc-font-size-sm);
      font-weight: 600;
      color: var(--sc-text-primary);
    }
    .capability-list {
      list-style: none;
      padding: 0;
      margin: 0;
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-secondary);
    }
    .capability-item {
      padding: var(--sc-spacing-xs) 0;
      border-bottom: 1px solid var(--sc-border-color);
    }
    .capability-item:last-child { border-bottom: none; }
    .coverage-section {
      margin-top: var(--sc-spacing-lg);
      padding-top: var(--sc-spacing-lg);
      border-top: 1px solid var(--sc-border-color);
    }
    .coverage-title {
      font-size: var(--sc-font-size-sm);
      font-weight: 600;
      color: var(--sc-text-primary);
      margin-bottom: var(--sc-spacing-sm);
    }
    .coverage-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sc-spacing-xs);
    }
    .coverage-tag {
      padding: var(--sc-spacing-xs) var(--sc-spacing-sm);
      background-color: var(--sc-bg-tertiary);
      border-radius: var(--sc-radius-full);
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-secondary);
    }
  `;

  private getSkillData(): SkillDefinition | null {
    return skillStore.getSkill(this.roleId);
  }

  private renderCapabilityCard(icon: string, title: string, items: string[]) {
    const displayItems = items.slice(0, 5);
    return html`
      <div class="capability-card">
        <div class="capability-header">
          <span class="capability-icon">${icon}</span>
          <span class="capability-title">${title}</span>
        </div>
        <ul class="capability-list">
          ${displayItems.map(item => html`<li class="capability-item">${item}</li>`)}
          ${items.length > 5 ? html`<li class="capability-item">... and ${items.length - 5} more</li>` : ''}
        </ul>
      </div>
    `;
  }

  render() {
    const skill = this.getSkillData();
    const capabilities = skill?.metadata?.openclaw?.capabilities || {
      light: ['Defense planning', 'Risk assessment'],
      dark: ['Penetration testing', 'Vulnerability scanning'],
      security: ['Threat analysis', 'Incident response'],
      legal: ['Compliance monitoring', 'Policy review'],
      technology: ['Network security', 'Application security'],
      business: ['Risk management', 'Business continuity'],
    };
    const mitre = skill?.metadata?.openclaw?.mitre_coverage || ['Initial Access', 'Execution', 'Persistence'];
    const scf = skill?.metadata?.openclaw?.scf_coverage || ['GOV', 'TRM', 'ASM', 'IRM'];

    return html`
      <div class="panel">
        <div class="panel-header">
          <span class="panel-icon">🛡️</span>
          <h2 class="panel-title">Role Skills: ${this.i18n.t('roles.' + this.roleId)}</h2>
        </div>
        <div class="capabilities-grid">
          ${this.renderCapabilityCard('🔵', this.i18n.t('capabilities.light'), capabilities.light)}
          ${this.renderCapabilityCard('⚫', this.i18n.t('capabilities.dark'), capabilities.dark)}
          ${this.renderCapabilityCard('🛡️', this.i18n.t('capabilities.security'), capabilities.security)}
          ${this.renderCapabilityCard('⚖️', this.i18n.t('capabilities.legal'), capabilities.legal)}
          ${this.renderCapabilityCard('💻', this.i18n.t('capabilities.technology'), capabilities.technology)}
          ${this.renderCapabilityCard('📈', this.i18n.t('capabilities.business'), capabilities.business)}
        </div>
        <div class="coverage-section">
          <h3 class="coverage-title">🎯 MITRE ATT&CK Coverage</h3>
          <div class="coverage-tags">
            ${mitre.map(t => html`<span class="coverage-tag">${t}</span>`)}
          </div>
        </div>
        <div class="coverage-section">
          <h3 class="coverage-title">🛡️ SCF Coverage</h3>
          <div class="coverage-tags">
            ${scf.map(t => html`<span class="coverage-tag">${t}</span>`)}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-skill-panel': ScSkillPanel;
  }
}

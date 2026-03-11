import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sc-scf-dashboard')
export class ScScfDashboard extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .domains-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: var(--sc-spacing-sm);
    }

    .domain-item {
      background-color: var(--sc-bg-secondary);
      border-radius: var(--sc-radius-md);
      padding: var(--sc-spacing-sm);
    }

    .domain-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-xs);
    }

    .domain-id {
      font-size: var(--sc-font-size-xs);
      font-weight: 600;
      color: var(--sc-primary);
    }

    .domain-score {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-secondary);
    }

    .progress-bar {
      width: 100%;
      height: 4px;
      background-color: var(--sc-bg-tertiary);
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background-color: var(--sc-primary);
      transition: width var(--sc-transition-normal);
    }
  `;

  private domains = [
    { id: 'GOV', name: 'Governance', score: 85 },
    { id: 'TRM', name: 'Risk Management', score: 72 },
    { id: 'ASM', name: 'Asset Management', score: 90 },
    { id: 'IRM', name: 'Incident Response', score: 68 },
    { id: 'BRM', name: 'Business Continuity', score: 55 },
    { id: 'HRS', name: 'Human Resources', score: 78 },
    { id: 'PMS', name: 'Physical Security', score: 45 },
    { id: 'DMM', name: 'Data Management', score: 82 },
  ];

  render() {
    return html`
      <div class="domains-grid">
        ${this.domains.map(domain => html`
          <div class="domain-item">
            <div class="domain-header">
              <span class="domain-id">${domain.id}</span>
              <span class="domain-score">${domain.score}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${domain.score}%"></div>
            </div>
          </div>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-scf-dashboard': ScScfDashboard;
  }
}

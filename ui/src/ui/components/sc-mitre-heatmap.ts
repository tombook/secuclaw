import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sc-mitre-heatmap')
export class ScMitreHeatmap extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .heatmap-grid {
      display: grid;
      grid-template-columns: repeat(14, 1fr);
      gap: 2px;
    }

    .cell {
      aspect-ratio: 1;
      border-radius: var(--sc-radius-sm);
      background-color: var(--sc-bg-tertiary);
      transition: all var(--sc-transition-fast);
      cursor: pointer;
      position: relative;
    }

    .cell:hover {
      transform: scale(1.1);
      z-index: 1;
    }

    .cell.level-1 { background-color: rgba(59, 130, 246, 0.2); }
    .cell.level-2 { background-color: rgba(59, 130, 246, 0.4); }
    .cell.level-3 { background-color: rgba(59, 130, 246, 0.6); }
    .cell.level-4 { background-color: rgba(59, 130, 246, 0.8); }
    .cell.level-5 { background-color: rgba(59, 130, 246, 1); }

    .tactic-labels {
      display: grid;
      grid-template-columns: repeat(14, 1fr);
      gap: 2px;
      margin-top: var(--sc-spacing-sm);
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-tertiary);
    }

    .tactic-label {
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .legend {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm);
      margin-top: var(--sc-spacing-md);
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-tertiary);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs);
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }
  `;

  private tactics = [
    'Reconnaissance', 'Resource Dev', 'Initial Access', 'Execution',
    'Persistence', 'Priv Esc', 'Defense Evasion', 'Cred Access',
    'Discovery', 'Lateral Movement', 'Collection', 'C2',
    'Exfiltration', 'Impact'
  ];

  private generateHeatmap(): number[] {
    // Generate random coverage levels for demo
    return Array.from({ length: 14 }, () => Math.floor(Math.random() * 6));
  }

  render() {
    const levels = this.generateHeatmap();

    return html`
      <div class="heatmap-grid">
        ${levels.map((level, i) => html`
          <div class="cell level-${level}" title="${this.tactics[i]}: ${level * 20}%"></div>
        `)}
      </div>
      <div class="tactic-labels">
        ${this.tactics.map(t => html`
          <div class="tactic-label" title="${t}">${t.split(' ')[0]}</div>
        `)}
      </div>
      <div class="legend">
        <span>Coverage:</span>
        ${[0, 1, 2, 3, 4, 5].map(level => html`
          <div class="legend-item">
            <div class="legend-color cell level-${level}"></div>
            <span>${level * 20}%</span>
          </div>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-mitre-heatmap': ScMitreHeatmap;
  }
}

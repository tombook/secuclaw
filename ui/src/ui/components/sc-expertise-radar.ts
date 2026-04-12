import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export interface Capabilities {
  light?: string[];
  dark?: string[];
  security?: string[];
  legal?: string[];
  technology?: string[];
  business?: string[];
}

@customElement('sc-expertise-radar')
export class ScExpertiseRadar extends LitElement {
  @property({ type: Object })
  capabilities: Capabilities = {};

  @property({ type: Number })
  size = 300;

  @property({ type: Object })
  compareCapabilities?: Capabilities;

  static styles = css`
    :host {
      display: block;
      font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    }

    .radar-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--sc-spacing-md, 16px);
    }

    .radar-chart {
      width: var(--radar-size, 300px);
      height: var(--radar-size, 300px);
      position: relative;
    }

    .radar-svg {
      width: 100%;
      height: 100%;
    }

    .radar-axis {
      stroke: var(--sc-border-color, #e2e8f0);
      stroke-width: 1;
    }

    .radar-grid {
      stroke: var(--sc-border-color, #e2e8f0);
      stroke-width: 1;
      fill: none;
      stroke-dasharray: 4, 4;
    }

    .radar-area {
      fill-opacity: 0.3;
      stroke-width: 2;
      animation: fadeIn 0.5s ease;
    }

    .radar-area.primary {
      fill: var(--sc-role-primary, #3b82f6);
      stroke: var(--sc-role-primary, #3b82f6);
    }

    .radar-area.compare {
      fill: var(--sc-role-secondary, #f59e0b);
      stroke: var(--sc-role-secondary, #f59e0b);
      fill-opacity: 0.2;
    }

    .radar-label {
      font-size: 11px;
      font-weight: 500;
      fill: var(--sc-text-primary, #1e293b);
      text-anchor: middle;
      dominant-baseline: middle;
    }

    .radar-point {
      width: 6px;
      height: 6px;
      fill: white;
      stroke-width: 2;
      animation: scaleIn 0.3s ease;
    }

    .radar-point.primary {
      stroke: var(--sc-role-primary, #3b82f6);
    }

    .radar-point.compare {
      stroke: var(--sc-role-secondary, #f59e0b);
    }

    .radar-legend {
      display: flex;
      gap: var(--sc-spacing-md, 16px);
      margin-top: var(--sc-spacing-sm, 8px);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs, 4px);
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }

    .legend-color.primary {
      background-color: var(--sc-role-primary, #3b82f6);
    }

    .legend-color.compare {
      background-color: var(--sc-role-secondary, #f59e0b);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleIn {
      from { transform: scale(0); }
      to { transform: scale(1); }
    }
  `;

  private getCapabilityValue(capabilities: Capabilities, key: keyof Capabilities): number {
    const items = capabilities[key] || [];
    const maxSkills = 10;
    return Math.min(items.length / maxSkills, 1);
  }

  private getRadarData(capabilities: Capabilities): { values: number[]; points: string } {
    const axes = ['light', 'dark', 'security', 'legal', 'technology', 'business'] as const;
    const values = axes.map(axis => this.getCapabilityValue(capabilities, axis));

    const centerX = this.size / 2;
    const centerY = this.size / 2;
    const radius = (this.size / 2) - 40;

    const points = values.map((value, i) => {
      const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
      const x = centerX + radius * value * Math.cos(angle);
      const y = centerY + radius * value * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    return { values, points };
  }

  private renderRadarChart() {
    const centerX = this.size / 2;
    const centerY = this.size / 2;
    const radius = (this.size / 2) - 40;
    const axes = ['light', 'dark', 'security', 'legal', 'technology', 'business'] as const;
    const axisLabels = ['Light', 'Dark', 'Security', 'Legal', 'Technology', 'Business'];

    const primaryData = this.getRadarData(this.capabilities);

    const gridLevels = [0.25, 0.5, 0.75, 1];

    return html`
      <div class="radar-chart" style="--radar-size: ${this.size}px">
        <svg class="radar-svg" viewBox="0 0 ${this.size} ${this.size}">
          <defs>
            <linearGradient id="radar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="var(--sc-role-primary, #3b82f6)" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="var(--sc-role-primary, #3b82f6)" stop-opacity="0.1"/>
            </linearGradient>
          </defs>

          ${gridLevels.map(level => {
            const levelRadius = radius * level;
            const levelPoints = axes.map((_, i) => {
              const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
              const x = centerX + levelRadius * Math.cos(angle);
              const y = centerY + levelRadius * Math.sin(angle);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            }).join(' ');

            return html`
              <polygon
                points="${levelPoints}"
                class="radar-grid"
              />
            `;
          })}

          ${axes.map((_, i) => {
            const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            return html`
              <line
                x1="${centerX}" y1="${centerY}"
                x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"
                class="radar-axis"
              />
            `;
          })}

          ${axes.map((_, i) => {
            const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
            const labelRadius = radius + 20;
            const x = centerX + labelRadius * Math.cos(angle);
            const y = centerY + labelRadius * Math.sin(angle);
            return html`
              <text
                x="${x.toFixed(1)}"
                y="${y.toFixed(1)}"
                class="radar-label"
              >${axisLabels[i]}</text>
            `;
          })}

          ${this.compareCapabilities ? html`
            <polygon
              points="${this.getRadarData(this.compareCapabilities).points}"
              class="radar-area compare"
              style="animation-delay: 0.1s;"
            />
            ${axes.map((_, i) => {
              const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
              const value = this.getCapabilityValue(this.compareCapabilities!, axes[i]);
              const x = centerX + radius * value * Math.cos(angle);
              const y = centerY + radius * value * Math.sin(angle);
              return html`
                <circle
                  cx="${x.toFixed(1)}"
                  cy="${y.toFixed(1)}"
                  r="3"
                  class="radar-point compare"
                  style="animation-delay: ${0.1 + i * 0.05}s;"
                />
              `;
            })}
          ` : ''}

          <polygon
            points="${primaryData.points}"
            class="radar-area primary"
            fill="url(#radar-gradient)"
          />

          ${axes.map((_, i) => {
            const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
            const value = primaryData.values[i];
            const x = centerX + radius * value * Math.cos(angle);
            const y = centerY + radius * value * Math.sin(angle);
            return html`
              <circle
                cx="${x.toFixed(1)}"
                cy="${y.toFixed(1)}"
                r="3"
                class="radar-point primary"
                style="animation-delay: ${i * 0.05}s;"
              />
            `;
          })}
        </svg>
      </div>
    `;
  }

  render() {
    return html`
      <div class="radar-container">
        ${this.renderRadarChart()}
        ${this.compareCapabilities ? html`
          <div class="radar-legend">
            <div class="legend-item">
              <div class="legend-color primary"></div>
              <span>当前角色</span>
            </div>
            <div class="legend-item">
              <div class="legend-color compare"></div>
              <span>对比角色</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-expertise-radar': ScExpertiseRadar;
  }
}

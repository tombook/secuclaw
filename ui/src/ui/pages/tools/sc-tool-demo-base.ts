import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Base template for tool demo pages
 */
@customElement('sc-tool-demo-base')
export class ScToolDemoBase extends LitElement {
  @property({ type: String }) toolId = '';
  @property({ type: String }) toolName = '';
  @property({ type: String }) domainColor = '#6B7280';
  @property({ type: String }) domainName = '';

  static styles = css`
    :host { display: block; }
    .page-container { padding: var(--sc-spacing-xl); max-width: 1400px; margin: 0 auto; }
    .tool-header { display: flex; align-items: flex-start; gap: var(--sc-spacing-lg); margin-bottom: var(--sc-spacing-xl); padding-bottom: var(--sc-spacing-lg); border-bottom: 1px solid var(--sc-border-color); }
    .tool-icon { width: 64px; height: 64px; border-radius: var(--sc-radius-lg); display: flex; align-items: center; justify-content: center; font-size: 32px; flex-shrink: 0; }
    .tool-info { flex: 1; }
    .tool-name { font-size: var(--sc-font-size-2xl); font-weight: 600; color: var(--sc-text-primary); margin: 0; }
    .domain-badge { padding: 4px 12px; border-radius: var(--sc-radius-full); font-size: var(--sc-font-size-xs); font-weight: 500; }
    .tool-description { color: var(--sc-text-secondary); font-size: var(--sc-font-size-sm); margin: var(--sc-spacing-xs) 0 0; }
    .coverage-section { display: flex; flex-wrap: wrap; gap: var(--sc-spacing-md); margin-top: var(--sc-spacing-md); }
    .coverage-group { display: flex; flex-wrap: wrap; gap: var(--sc-spacing-xs); align-items: center; }
    .coverage-label { font-size: var(--sc-font-size-xs); color: var(--sc-text-tertiary); font-weight: 500; }
    .coverage-tag { padding: 2px 8px; border-radius: var(--sc-radius-sm); font-size: var(--sc-font-size-xs); background: var(--sc-bg-tertiary); color: var(--sc-text-secondary); }
    .roles-section { display: flex; gap: var(--sc-spacing-lg); margin-top: var(--sc-spacing-md); }
    .role-group { display: flex; align-items: center; gap: var(--sc-spacing-xs); }
    .role-label { font-size: var(--sc-font-size-xs); color: var(--sc-text-tertiary); }
    .role-tag { padding: 2px 8px; border-radius: var(--sc-radius-sm); font-size: var(--sc-font-size-xs); background: var(--sc-bg-tertiary); color: var(--sc-text-secondary); }
    .role-tag.owner { background: var(--sc-primary-bg); color: var(--sc-primary); }
    .tabs-container { display: flex; gap: var(--sc-spacing-xs); border-bottom: 1px solid var(--sc-border-color); margin-bottom: var(--sc-spacing-lg); }
    .tab { padding: var(--sc-spacing-sm) var(--sc-spacing-lg); font-size: var(--sc-font-size-sm); font-weight: 500; color: var(--sc-text-secondary); cursor: pointer; border-bottom: 2px solid transparent; transition: all var(--sc-transition-fast); background: none; border-top: none; border-left: none; border-right: none; }
    .tab:hover { color: var(--sc-text-primary); background: var(--sc-bg-tertiary); }
    .tab.active { color: var(--sc-primary); border-bottom-color: var(--sc-primary); }
    .tab-content { min-height: 400px; }
    .overview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--sc-spacing-lg); }
    .overview-card { background: var(--sc-bg-card); border: 1px solid var(--sc-border-color); border-radius: var(--sc-radius-lg); padding: var(--sc-spacing-lg); }
    .overview-card h3 { font-size: var(--sc-font-size-md); font-weight: 600; color: var(--sc-text-primary); margin: 0 0 var(--sc-spacing-md); }
    .demo-container { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sc-spacing-lg); }
    .demo-panel { background: var(--sc-bg-card); border: 1px solid var(--sc-border-color); border-radius: var(--sc-radius-lg); padding: var(--sc-spacing-lg); }
    .demo-panel h3 { font-size: var(--sc-font-size-md); font-weight: 600; color: var(--sc-text-primary); margin: 0 0 var(--sc-spacing-md); padding-bottom: var(--sc-spacing-sm); border-bottom: 1px solid var(--sc-border-color); }
    .form-group { margin-bottom: var(--sc-spacing-md); }
    .form-label { display: block; font-size: var(--sc-font-size-sm); font-weight: 500; color: var(--sc-text-primary); margin-bottom: var(--sc-spacing-xs); }
    .form-input, .form-select { width: 100%; padding: var(--sc-spacing-sm) var(--sc-spacing-md); border: 1px solid var(--sc-border-color); border-radius: var(--sc-radius-md); background: var(--sc-input-bg); color: var(--sc-text-primary); font-size: var(--sc-font-size-sm); }
    .btn { padding: var(--sc-spacing-sm) var(--sc-spacing-lg); border: none; border-radius: var(--sc-radius-md); font-size: var(--sc-font-size-sm); font-weight: 500; cursor: pointer; transition: all var(--sc-transition-fast); }
    .btn-primary { background: var(--sc-primary); color: white; }
    .btn-primary:hover { background: var(--sc-primary-hover); }
    .btn-secondary { background: var(--sc-bg-tertiary); color: var(--sc-text-primary); }
    .empty-state { text-align: center; padding: var(--sc-spacing-2xl); color: var(--sc-text-tertiary); }
    .results-area { background: var(--sc-code-bg); border: 1px solid var(--sc-border-color); border-radius: var(--sc-radius-md); padding: var(--sc-spacing-md); font-family: var(--sc-font-mono); font-size: var(--sc-font-size-sm); color: var(--sc-code-text); min-height: 200px; overflow: auto; }
  `;

  render() {
    return html`
      <div class="page-container">
        <div class="tool-header">
          <div class="tool-icon" style="background: ${this.domainColor}20">🔧</div>
          <div class="tool-info">
            <h1 class="tool-name">${this.toolName}</h1>
            <span class="domain-badge" style="background: ${this.domainColor}20; color: ${this.domainColor}">${this.domainName}</span>
            <p class="tool-description">Tool Demo Page - ${this.toolId}</p>
          </div>
        </div>
        <div class="overview-card">
          <h3>Overview</h3>
          <p style="color: var(--sc-text-secondary)">This is the base template for tool demo pages.</p>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-tool-demo-base': ScToolDemoBase;
  }
}

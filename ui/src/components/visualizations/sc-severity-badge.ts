import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sc-severity-badge')
export class ScSeverityBadge extends LitElement {
  static styles = css`
    :host { display: inline-block; }
    .badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .critical { background: var(--sc-critical-bg, rgba(239, 68, 68, 0.15)); color: var(--sc-critical, #ef4444); border: 1px solid var(--sc-critical-border, rgba(239, 68, 68, 0.4)); }
    .high { background: var(--sc-high-bg, rgba(249, 115, 22, 0.15)); color: var(--sc-high, #f97316); border: 1px solid var(--sc-high-border, rgba(249, 115, 22, 0.4)); }
    .medium { background: var(--sc-medium-bg, rgba(245, 158, 11, 0.15)); color: var(--sc-medium, #f59e0b); border: 1px solid var(--sc-medium-border, rgba(245, 158, 11, 0.4)); }
    .low { background: var(--sc-low-bg, rgba(34, 197, 94, 0.15)); color: var(--sc-low, #22c55e); border: 1px solid var(--sc-low-border, rgba(34, 197, 94, 0.4)); }
    .info { background: var(--sc-info-bg, rgba(59, 130, 246, 0.15)); color: var(--sc-info, #3b82f6); border: 1px solid var(--sc-info-border, rgba(59, 130, 246, 0.4)); }
  `;
  @property({ type: String }) severity: 'critical' | 'high' | 'medium' | 'low' | 'info' = 'info';
  @property({ type: String }) label = '';

  render() {
    const display = this.label || this.severity;
    return html`<span class="badge ${this.severity}" role="status">${display}</span>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-severity-badge': ScSeverityBadge; } }

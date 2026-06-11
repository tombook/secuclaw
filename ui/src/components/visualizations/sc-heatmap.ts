import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

interface HeatCell { row: string; col: string; value: number; label?: string; }

@customElement('sc-heatmap')
export class ScHeatmap extends LitElement {
  static styles = css`
    :host { display: block; }
    .grid { display: grid; gap: 3px; }
    .row-label, .col-label { font-size: 10px; color: var(--sc-text-muted, #6b7280); padding: 2px 4px; }
    .col-label { text-align: center; }
    .cell { aspect-ratio: 1; min-height: 24px; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; cursor: default; transition: transform 0.15s ease; }
    .cell:hover { transform: scale(1.1); outline: 1px solid var(--sc-border-focus, #00d4ff); }
    .cell.empty { background: transparent; }
  `;
  @property({ type: Array }) data: HeatCell[] = [];
  @property({ type: Array }) rows: string[] = [];
  @property({ type: Array }) cols: string[] = [];
  @property({ type: String }) colorScheme: 'severity' | 'intensity' = 'severity';

  private _colorFor(v: number): string {
    if (this.colorScheme === 'intensity') {
      if (v <= 0) return 'var(--sc-bg-tertiary, #1f2937)';
      if (v < 0.25) return 'rgba(59, 130, 246, 0.2)';
      if (v < 0.5) return 'rgba(59, 130, 246, 0.4)';
      if (v < 0.75) return 'rgba(59, 130, 246, 0.6)';
      return 'rgba(59, 130, 246, 0.9)';
    }
    if (v >= 9) return 'var(--sc-critical, #ef4444)';
    if (v >= 7) return 'var(--sc-high, #f97316)';
    if (v >= 4) return 'var(--sc-medium, #f59e0b)';
    if (v > 0) return 'var(--sc-low, #22c55e)';
    return 'var(--sc-bg-tertiary, #1f2937)';
  }
  private _find(row: string, col: string): HeatCell | undefined {
    return this.data.find(c => c.row === row && c.col === col);
  }

  render() {
    const cols = [' '].concat(this.cols);
    return html`
      <div class="grid" style="grid-template-columns: 60px repeat(${this.cols.length}, 1fr);" role="img" aria-label="Heatmap">
        ${cols.map(c => html`<div class="col-label">${c}</div>`)}
        ${this.rows.map(r => html`
          <div class="row-label">${r}</div>
          ${this.cols.map(c => {
            const cell = this._find(r, c);
            const v = cell?.value ?? 0;
            return html`<div class="cell" style="background: ${this._colorFor(v)};" title="${r} × ${c}: ${cell?.label ?? v}">${cell?.label ?? (v > 0 ? Math.round(v * 10) / 10 : '')}</div>`;
          })}
        `)}
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-heatmap': ScHeatmap; } }

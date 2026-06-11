import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

interface MatrixCell { row: string; col: string; value: number; color?: string; }

@customElement('sc-ai-result-matrix')
export class ScAiResultMatrix extends LitElement {
  static styles = css`
    :host { display: block; }
    .wrap { background: var(--sc-bg-secondary, #111827); border: 1px solid var(--sc-border, #374151); border-radius: 8px; padding: 12px; }
    .grid { display: grid; gap: 3px; }
    .lbl { font-size: 10px; color: var(--sc-text-muted, #6b7280); padding: 4px; display: flex; align-items: center; justify-content: center; }
    .lbl.row { justify-content: flex-end; }
    .lbl.col { }
    .cell { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; border-radius: 2px; color: #fff; }
  `;
  @property({ type: Array }) rows: string[] = [];
  @property({ type: Array }) cols: string[] = [];
  @property({ type: Array }) data: MatrixCell[] = [];
  @property({ type: Number }) max = 10;
  @property({ type: Function }) colorFn: ((v: number, max: number) => string) | null = null;

  private _color(v: number): string {
    if (this.colorFn) return this.colorFn(v, this.max);
    const t = Math.max(0, Math.min(1, v / this.max));
    const r = Math.round(239 * t + 31 * (1 - t));
    const g = Math.round(68 * t + 41 * (1 - t));
    const b = Math.round(68 * t + 59 * (1 - t));
    return `rgb(${r}, ${g}, ${b})`;
  }
  private _find(r: string, c: string): number {
    const m = this.data.find(d => d.row === r && d.col === c);
    return m?.value ?? 0;
  }

  render() {
    return html`
      <div class="wrap" role="img" aria-label="AI 结果矩阵">
        <div class="grid" style="grid-template-columns: 80px repeat(${this.cols.length}, 1fr);">
          <div></div>
          ${this.cols.map(c => html`<div class="lbl col">${c}</div>`)}
          ${this.rows.map(r => html`
            <div class="lbl row">${r}</div>
            ${this.cols.map(c => html`<div class="cell" style="background:${this._color(this._find(r, c))};">${this._find(r, c) || ''}</div>`)}
          `)}
        </div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-ai-result-matrix': ScAiResultMatrix; } }

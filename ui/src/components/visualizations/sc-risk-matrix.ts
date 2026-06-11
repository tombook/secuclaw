import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

interface RiskCell { id: string; label: string; likelihood: number; impact: number; count: number; }

@customElement('sc-risk-matrix')
export class ScRiskMatrix extends LitElement {
  static styles = css`
    :host { display: block; }
    .wrap { display: grid; grid-template-columns: 30px repeat(5, 1fr); grid-template-rows: repeat(5, 1fr) 24px; gap: 2px; }
    .axis-y { font-size: 9px; color: var(--sc-text-muted, #6b7280); display: flex; align-items: center; justify-content: center; }
    .axis-x { font-size: 9px; color: var(--sc-text-muted, #6b7280); display: flex; align-items: center; justify-content: center; }
    .cell { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: var(--sc-text-primary, #f9fafb); border-radius: 2px; position: relative; cursor: default; }
    .cell:hover { outline: 2px solid var(--sc-border-focus, #00d4ff); z-index: 1; }
    .low { background: rgba(34, 197, 94, 0.2); }
    .med { background: rgba(245, 158, 11, 0.3); }
    .high { background: rgba(249, 115, 22, 0.4); }
    .crit { background: rgba(239, 68, 68, 0.5); }
  `;
  @property({ type: Array }) items: RiskCell[] = [];
  @property({ type: String }) xLabel = '影响';
  @property({ type: String }) yLabel = '可能性';

  private _cellClass(lik: number, imp: number): string {
    const score = lik * imp;
    if (score >= 16) return 'crit';
    if (score >= 9) return 'high';
    if (score >= 4) return 'med';
    return 'low';
  }
  private _find(lik: number, imp: number): RiskCell | undefined {
    return this.items.find(it => it.likelihood === lik && it.impact === imp);
  }

  render() {
    const rowLabels = ['极高', '高', '中', '低', '极低'];
    const colLabels = ['极低', '低', '中', '高', '极高'];
    return html`
      <div class="wrap" role="img" aria-label="风险矩阵">
        <div class="axis-y">${this.yLabel}</div>
        ${colLabels.map(l => html`<div class="axis-x">${l}</div>`)}
        ${rowLabels.map((rl, ri) => {
          const lik = 5 - ri;
          return html`
            <div class="axis-y">${rl}</div>
            ${colLabels.map((_, ci) => {
              const imp = ci + 1;
              const cell = this._find(lik, imp);
              return html`<div class="cell ${this._cellClass(lik, imp)}" title="${cell?.label ?? ''}: ${cell?.count ?? 0}">${cell?.count ?? ''}</div>`;
            })}
          `;
        })}
        <div></div>
        ${colLabels.map(l => html`<div class="axis-x">${l}</div>`)}
      </div>
      <div style="text-align:center;font-size:9px;color:var(--sc-text-muted);margin-top:4px;">${this.xLabel}</div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-risk-matrix': ScRiskMatrix; } }

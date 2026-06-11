import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sc-ai-result-table')
export class ScAiResultTable extends LitElement {
  static styles = css`
    :host { display: block; }
    .wrap { background: var(--sc-bg-secondary, #111827); border: 1px solid var(--sc-border, #374151); border-radius: 8px; overflow: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 8px 12px; background: var(--sc-bg-tertiary, #1f2937); color: var(--sc-text-secondary, #9ca3af); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; border-bottom: 1px solid var(--sc-border, #374151); }
    td { padding: 8px 12px; border-bottom: 1px solid var(--sc-border-subtle, #1f2937); color: var(--sc-text-primary, #f9fafb); }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: var(--sc-bg-hover, #1e2937); }
    .empty { padding: 24px; text-align: center; color: var(--sc-text-muted, #6b7280); font-size: 12px; }
  `;
  @property({ type: Array }) columns: string[] = [];
  @property({ type: Array }) rows: any[][] = [];

  render() {
    if (!this.rows.length) return html`<div class="wrap"><div class="empty">暂无数据</div></div>`;
    return html`
      <div class="wrap" role="table" aria-label="AI 结果表格">
        <table>
          <thead><tr>${this.columns.map(c => html`<th scope="col">${c}</th>`)}</tr></thead>
          <tbody>${this.rows.map(r => html`<tr>${r.map((cell, i) => html`<td>${cell}</td>`)}</tr>`)}</tbody>
        </table>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-ai-result-table': ScAiResultTable; } }

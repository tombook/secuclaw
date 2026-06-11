import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

interface TreemapItem { label: string; value: number; color: string; }

@customElement('sc-treemap')
export class ScTreemap extends LitElement {
  static styles = css`
    :host { display: block; }
    .wrap { position: relative; width: 100%; height: 200px; display: flex; flex-wrap: wrap; align-content: flex-start; }
    .tile { display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.4); padding: 4px; box-sizing: border-box; border: 1px solid rgba(0,0,0,0.3); transition: all 0.2s; cursor: default; overflow: hidden; }
    .tile:hover { transform: scale(1.02); z-index: 1; box-shadow: 0 2px 8px rgba(0,0,0,0.4); }
  `;
  @property({ type: Array }) items: TreemapItem[] = [];

  render() {
    const total = this.items.reduce((s, i) => s + i.value, 0) || 1;
    return html`
      <div class="wrap" role="img" aria-label="Treemap">
        ${this.items.map(it => {
          const pct = (it.value / total) * 100;
          const flex = Math.max(pct * 4, 1);
          return html`<div class="tile" style="flex: ${flex}; background: ${it.color}; height: ${Math.min(100, Math.max(20, pct * 1.5))}%;" title="${it.label}: ${it.value}">${pct > 5 ? it.label : ''}</div>`;
        })}
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-treemap': ScTreemap; } }

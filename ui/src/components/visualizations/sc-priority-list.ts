import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

interface PriorityItem { id: string; label: string; value: string | number; severity: 'critical' | 'high' | 'medium' | 'low' | 'info'; trend?: 'up' | 'down' | 'flat'; }

@customElement('sc-priority-list')
export class ScPriorityList extends LitElement {
  static styles = css`
    :host { display: block; }
    .list { display: flex; flex-direction: column; gap: 6px; }
    .item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: var(--sc-bg-secondary, #111827); border: 1px solid var(--sc-border, #374151); border-radius: 6px; transition: all 0.2s; }
    .item:hover { border-color: var(--sc-border-focus, #00d4ff); transform: translateX(2px); }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .dot.critical { background: var(--sc-critical, #ef4444); }
    .dot.high { background: var(--sc-high, #f97316); }
    .dot.medium { background: var(--sc-medium, #f59e0b); }
    .dot.low { background: var(--sc-low, #22c55e); }
    .dot.info { background: var(--sc-info, #3b82f6); }
    .label { flex: 1; font-size: 12px; color: var(--sc-text-primary, #f9fafb); }
    .value { font-size: 12px; font-weight: 700; color: var(--sc-text-primary, #f9fafb); }
    .trend { font-size: 11px; font-weight: 600; }
    .trend.up { color: var(--sc-critical, #ef4444); }
    .trend.down { color: var(--sc-low, #22c55e); }
    .trend.flat { color: var(--sc-text-muted, #6b7280); }
  `;
  @property({ type: Array }) items: PriorityItem[] = [];
  @property({ type: String }) emptyText = '暂无数据';

  render() {
    if (!this.items.length) return html`<div style="text-align:center;padding:20px;color:var(--sc-text-muted);font-size:11px;">${this.emptyText}</div>`;
    return html`
      <div class="list" role="list">
        ${this.items.map(it => html`
          <div class="item" role="listitem" aria-label="${it.label}: ${it.value}">
            <div class="dot ${it.severity}"></div>
            <div class="label">${it.label}</div>
            <div class="value">${it.value}</div>
            ${it.trend ? html`<div class="trend ${it.trend}">${it.trend === 'up' ? '↑' : it.trend === 'down' ? '↓' : '→'}</div>` : ''}
          </div>
        `)}
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-priority-list': ScPriorityList; } }

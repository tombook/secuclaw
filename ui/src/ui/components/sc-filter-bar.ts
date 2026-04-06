/**
 * sc-filter-bar.ts - 通用筛选栏组件
 * 支持输入框、下拉选择、日期等多种筛选器类型
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

interface FilterConfig {
  key: string;
  type: 'input' | 'select' | 'date' | 'daterange';
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

@customElement('sc-filter-bar')
export class ScFilterBar extends LitElement {
  @property({ type: Array }) filters: FilterConfig[] = [];
  @property({ type: Object }) values: Record<string, any> = {};

  static styles = css`
    :host {
      display: block;
    }
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: flex-end;
      padding: 12px 16px;
      background: var(--sc-surface, #1e293b);
      border-radius: 8px;
      border: 1px solid var(--sc-border, #334155);
    }
    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 140px;
    }
    .filter-label {
      font-size: 11px;
      color: var(--sc-text-secondary, #94a3b8);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .filter-input, .filter-select {
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid var(--sc-border, #334155);
      background: var(--sc-bg, #0f172a);
      color: var(--sc-text, #e2e8f0);
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
    }
    .filter-input:focus, .filter-select:focus {
      border-color: var(--sc-primary, #3b82f6);
    }
    .filter-select {
      cursor: pointer;
    }
  `;

  private handleChange(key: string, value: any) {
    this.values = { ...this.values, [key]: value };
    this.dispatchEvent(new CustomEvent('change', {
      detail: { ...this.values },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    return html`
      <div class="filter-bar">
        ${this.filters.map(f => html`
          <div class="filter-item">
            <label class="filter-label">${f.label}</label>
            ${f.type === 'input' ? html`
              <input
                type="text"
                class="filter-input"
                placeholder=${f.placeholder || ''}
                .value=${this.values[f.key] || ''}
                @input=${(e: any) => this.handleChange(f.key, e.target.value)}
              />
            ` : f.type === 'select' ? html`
              <select
                class="filter-select"
                @change=${(e: any) => this.handleChange(f.key, e.target.value)}
              >
                ${(f.options || []).map((opt: any) => html`
                  <option value=${opt.value} ?selected=${this.values[f.key] === opt.value}>
                    ${opt.label}
                  </option>
                `)}
              </select>
            ` : f.type === 'date' ? html`
              <input
                type="date"
                class="filter-input"
                .value=${this.values[f.key] || ''}
                @change=${(e: any) => this.handleChange(f.key, e.target.value)}
              />
            ` : ''}
          </div>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-filter-bar': ScFilterBar;
  }
}

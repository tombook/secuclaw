import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sc-ai-input-form')
export class ScAiInputForm extends LitElement {
  static styles = css`
    :host { display: block; }
    .wrap { background: var(--sc-bg-secondary, #111827); border: 1px solid var(--sc-border, #374151); border-radius: 8px; padding: 14px; }
    .title { font-size: 13px; font-weight: 700; margin: 0 0 10px; color: var(--sc-text-primary, #f9fafb); }
    .field { margin-bottom: 10px; }
    .label { font-size: 11px; color: var(--sc-text-secondary, #9ca3af); margin-bottom: 4px; display: block; }
    .input, .textarea, .select { width: 100%; padding: 6px 10px; background: var(--sc-bg-tertiary, #1f2937); border: 1px solid var(--sc-border, #374151); border-radius: 4px; color: var(--sc-text-primary, #f9fafb); font-family: inherit; font-size: 12px; box-sizing: border-box; }
    .textarea { min-height: 70px; resize: vertical; }
    .input:focus, .textarea:focus, .select:focus { outline: none; border-color: var(--sc-border-focus, #00d4ff); }
  `;
  @property({ type: String }) title = '';
  @property({ type: Array }) fields: Array<{ name: string; label: string; type: 'text' | 'textarea' | 'select'; required?: boolean; options?: string[]; placeholder?: string; }> = [];
  @property({ type: Object }) values: Record<string, string> = {};

  private _update(name: string, value: string) {
    this.values = { ...this.values, [name]: value };
    this.dispatchEvent(new CustomEvent('input-change', { detail: { name, value, values: this.values }, bubbles: true, composed: true }));
  }

  render() {
    return html`
      <div class="wrap" role="form" aria-label="${this.title}">
        ${this.title ? html`<h3 class="title">${this.title}</h3>` : ''}
        ${this.fields.map(f => html`
          <div class="field">
            <label class="label">${f.label}${f.required ? html`<span style="color:var(--sc-critical);">*</span>` : ''}</label>
            ${f.type === 'textarea' ? html`
              <textarea class="textarea" .value=${this.values[f.name] || ''} placeholder=${f.placeholder || ''} @input=${(e: Event) => this._update(f.name, (e.target as HTMLTextAreaElement).value)}></textarea>
            ` : f.type === 'select' ? html`
              <select class="select" .value=${this.values[f.name] || ''} @change=${(e: Event) => this._update(f.name, (e.target as HTMLSelectElement).value)}>
                <option value="">请选择</option>
                ${(f.options || []).map(o => html`<option value=${o} ?selected=${this.values[f.name] === o}>${o}</option>`)}
              </select>
            ` : html`
              <input class="input" type="text" .value=${this.values[f.name] || ''} placeholder=${f.placeholder || ''} @input=${(e: Event) => this._update(f.name, (e.target as HTMLInputElement).value)} />
            `}
          </div>
        `)}
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-ai-input-form': ScAiInputForm; } }

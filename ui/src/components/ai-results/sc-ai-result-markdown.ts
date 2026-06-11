import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sc-ai-result-markdown')
export class ScAiResultMarkdown extends LitElement {
  static styles = css`
    :host { display: block; }
    .md { background: var(--sc-bg-secondary, #111827); border: 1px solid var(--sc-border, #374151); border-radius: 8px; padding: 14px 16px; font-size: 13px; line-height: 1.7; color: var(--sc-text-primary, #f9fafb); max-height: 60vh; overflow-y: auto; }
    h1, h2, h3, h4 { color: var(--sc-primary, #00d4ff); margin: 14px 0 8px; }
    h1 { font-size: 18px; } h2 { font-size: 16px; } h3 { font-size: 14px; } h4 { font-size: 13px; }
    p { margin: 8px 0; }
    ul, ol { margin: 8px 0; padding-left: 20px; }
    li { margin: 4px 0; }
    code { background: var(--sc-bg-tertiary, #1f2937); padding: 2px 6px; border-radius: 3px; font-family: 'SF Mono', Monaco, monospace; font-size: 12px; }
    pre { background: var(--sc-bg-tertiary, #1f2937); padding: 10px; border-radius: 4px; overflow-x: auto; }
    blockquote { border-left: 3px solid var(--sc-border-focus, #00d4ff); padding-left: 12px; margin: 10px 0; color: var(--sc-text-secondary, #9ca3af); }
    strong { color: var(--sc-text-primary, #f9fafb); font-weight: 700; }
    em { color: var(--sc-text-secondary, #9ca3af); }
  `;
  @property({ type: String }) content = '';

  private _renderInline(text: string): any {
    const parts: any[] = [];
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let key = 0;
    while ((m = regex.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      const tok = m[0];
      if (tok.startsWith('**')) parts.push(html`<strong>${tok.slice(2, -2)}</strong>`);
      else if (tok.startsWith('`')) parts.push(html`<code>${tok.slice(1, -1)}</code>`);
      else if (tok.startsWith('*')) parts.push(html`<em>${tok.slice(1, -1)}</em>`);
      last = m.index + tok.length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  }

  render() {
    if (!this.content) return html`<div class="md" style="color:var(--sc-text-muted);">暂无内容</div>`;
    const lines = this.content.split('\n');
    const out: any[] = [];
    let inList: 'ul' | 'ol' | null = null;
    let listItems: string[] = [];
    const flushList = () => {
      if (inList && listItems.length) {
        const tag = inList;
        out.push(html`<${tag}>${listItems.map(it => html`<li>${this._renderInline(it)}</li>`)}</${tag}>`);
        listItems = [];
        inList = null;
      }
    };
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) { flushList(); return; }
      const h = /^(#{1,4})\s+(.+)$/.exec(trimmed);
      if (h) { flushList(); const lvl = h[1].length; out.push(html`<h${lvl}>${this._renderInline(h[2])}</h${lvl}>`); return; }
      const ul = /^[-*+]\s+(.+)$/.exec(trimmed);
      if (ul) { if (inList !== 'ul') { flushList(); inList = 'ul'; } listItems.push(ul[1]); return; }
      const ol = /^\d+\.\s+(.+)$/.exec(trimmed);
      if (ol) { if (inList !== 'ol') { flushList(); inList = 'ol'; } listItems.push(ol[1]); return; }
      flushList();
      if (trimmed.startsWith('> ')) { out.push(html`<blockquote>${this._renderInline(trimmed.slice(2))}</blockquote>`); return; }
      out.push(html`<p>${this._renderInline(trimmed)}</p>`);
    });
    flushList();
    return html`<div class="md" role="article">${out}</div>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-ai-result-markdown': ScAiResultMarkdown; } }

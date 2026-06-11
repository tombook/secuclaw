import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { executeAiCapability, type AiCapabilityDef } from '../../config/role-ai-capability-config';
import './sc-ai-result-card.js';
import './sc-ai-result-markdown.js';
import './sc-ai-result-table.js';
import './sc-ai-result-score.js';
import './sc-ai-result-matrix.js';
import './sc-ai-result-timeline.js';

@customElement('sc-ai-execution-panel')
export class ScAiExecutionPanel extends LitElement {
  static styles = css`
    :host { display: block; }
    .wrap { background: var(--sc-bg-secondary, #111827); border: 1px solid var(--sc-border, #374151); border-radius: 8px; padding: 14px; }
    .head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .title { font-size: 14px; font-weight: 700; color: var(--sc-text-primary, #f9fafb); }
    .close { background: transparent; border: 1px solid var(--sc-border, #374151); color: var(--sc-text-secondary, #9ca3af); padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px; }
    .input-area { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
    textarea { width: 100%; min-height: 60px; padding: 8px; background: var(--sc-bg-tertiary, #1f2937); border: 1px solid var(--sc-border, #374151); border-radius: 4px; color: var(--sc-text-primary, #f9fafb); font-family: inherit; font-size: 12px; resize: vertical; box-sizing: border-box; }
    .actions { display: flex; gap: 8px; }
    button.run { padding: 6px 14px; background: var(--sc-primary, #00d4ff); color: var(--sc-text-inverse, #0f172a); border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; }
    button.run:disabled { opacity: 0.5; cursor: not-allowed; }
    .result-area { margin-top: 12px; }
    .loading { padding: 20px; text-align: center; color: var(--sc-text-muted, #6b7280); }
    .error { padding: 10px; background: var(--sc-critical-bg, rgba(239, 68, 68, 0.15)); border: 1px solid var(--sc-critical-border, rgba(239, 68, 68, 0.4)); border-radius: 4px; color: var(--sc-critical, #ef4444); font-size: 12px; }
  `;
  @property({ type: Object }) capability: AiCapabilityDef | null = null;
  @property({ type: String }) roleId = '';
  @state() private _input = '';
  @state() private _running = false;
  @state() private _result: any = null;
  @state() private _error: string | null = null;

  private _close = () => {
    this.dispatchEvent(new CustomEvent('panel-closed', { bubbles: true, composed: true }));
  };

  private async _run() {
    if (!this.capability || !this.roleId || this._running) return;
    this._running = true;
    this._error = null;
    try {
      const res = await executeAiCapability(this.capability.id, this.roleId, { userInput: this._input });
      this._result = res?.result ?? res;
    } catch (e: any) {
      this._error = e?.message || '执行失败';
    } finally {
      this._running = false;
    }
  }

  private _renderResult() {
    if (this._error) return html`<div class="error" role="alert">⚠️ ${this._error}</div>`;
    if (!this._result) return nothing;
    const r = this._result;
    if (typeof r === 'string') return html`<sc-ai-result-markdown .content=${r}></sc-ai-result-markdown>`;
    if (r.markdown || r.content || r.text) return html`<sc-ai-result-markdown .content=${r.markdown || r.content || r.text}></sc-ai-result-markdown>`;
    if (r.score !== undefined) return html`<sc-ai-result-score .score=${r.score} .max=${r.max || 100} .label=${r.label || '评分'} .delta=${r.delta}></sc-ai-result-score>`;
    if (r.table) return html`<sc-ai-result-table .columns=${r.table.columns || []} .rows=${r.table.rows || []}></sc-ai-result-table>`;
    if (r.matrix) return html`<sc-ai-result-matrix .rows=${r.matrix.rows || []} .cols=${r.matrix.cols || []} .data=${r.matrix.data || []}></sc-ai-result-matrix>`;
    if (r.steps) return html`<sc-ai-result-timeline .steps=${r.steps}></sc-ai-result-timeline>`;
    return html`<sc-ai-result-card title="AI 分析结果"><pre style="margin:0;font-size:11px;color:var(--sc-text-secondary);">${JSON.stringify(r, null, 2)}</pre></sc-ai-result-card>`;
  }

  render() {
    if (!this.capability) return nothing;
    return html`
      <div class="wrap" role="region" aria-label="AI 执行面板">
        <div class="head">
          <div class="title">${this.capability.icon} ${this.capability.name}</div>
          <button class="close" @click=${this._close} aria-label="关闭">✕ 关闭</button>
        </div>
        <div class="input-area">
          <textarea .value=${this._input} placeholder="请输入上下文信息（可选）" aria-label="输入上下文" @input=${(e: Event) => this._input = (e.target as HTMLTextAreaElement).value}></textarea>
          <div class="actions">
            <button class="run" @click=${this._run} ?disabled=${this._running}>${this._running ? '⏳ 执行中…' : '🚀 执行 AI 分析'}</button>
          </div>
        </div>
        <div class="result-area">
          ${this._running ? html`<div class="loading">AI 正在分析中…</div>` : this._renderResult()}
        </div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-ai-execution-panel': ScAiExecutionPanel; } }

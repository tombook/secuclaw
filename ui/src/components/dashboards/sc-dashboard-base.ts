import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref, createRef, type Ref } from 'lit/directives/ref.js';
import type { PropertyValues } from 'lit';
import { fetchAiCapabilities, executeAiCapability, AUTONOMY_LABELS, type AiCapabilityDef } from '../../config/role-ai-capability-config';

export abstract class ScDashboardBase extends LitElement {
  static styles = css`
    :host { display: block; padding: 16px; background: var(--sc-bg-primary, #0a0f1a); min-height: 100vh; color: var(--sc-text-primary, #f9fafb); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .dashboard-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--sc-border, #374151); }
    .dashboard-header-left { display: flex; align-items: center; gap: 12px; }
    .dashboard-header-icon { font-size: 22px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: var(--sc-bg-tertiary, #1f2937); border-radius: 10px; border: 1px solid var(--sc-border, #374151); }
    .dashboard-title { font-size: 20px; font-weight: 600; margin: 0; color: var(--sc-text-primary, #f9fafb); }
    .dashboard-subtitle { font-size: 11px; color: var(--sc-text-muted, #6b7280); margin-top: 2px; }
    .ai-status-indicator { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--sc-text-secondary, #9ca3af); }
    .ai-status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--sc-low, #22c55e); }
    .ai-status-dot.loading { background: var(--sc-medium, #f59e0b); animation: pulse 1.5s infinite; }
    .ai-status-dot.error { background: var(--sc-critical, #ef4444); }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px; }
    .panel { background: var(--sc-bg-secondary, #111827); border: 1px solid var(--sc-border, #374151); border-radius: 8px; padding: 14px; }
    .panel-title { font-size: 13px; font-weight: 700; margin: 0 0 10px; color: var(--sc-text-primary, #f9fafb); display: flex; align-items: center; gap: 6px; }
    .panel-subtitle { font-size: 11px; color: var(--sc-text-muted, #6b7280); margin-bottom: 10px; }
    .loading-state { display: flex; align-items: center; justify-content: center; padding: 60px; color: var(--sc-text-muted, #6b7280); font-size: 13px; }
    .error-state { padding: 16px; background: var(--sc-critical-bg, rgba(239, 68, 68, 0.15)); border: 1px solid var(--sc-critical-border, rgba(239, 68, 68, 0.4)); border-radius: 6px; color: var(--sc-critical, #ef4444); font-size: 12px; }
    .ai-capability-list { display: flex; flex-direction: column; gap: 6px; }
    .ai-capability { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: var(--sc-bg-tertiary, #1f2937); border: 1px solid var(--sc-border-subtle, #1f2937); border-radius: 6px; cursor: pointer; transition: all 0.2s; }
    .ai-capability:hover { border-color: var(--sc-border-focus, #00d4ff); background: var(--sc-bg-hover, #1e2937); }
    .ai-cap-icon { font-size: 18px; }
    .ai-cap-info { flex: 1; min-width: 0; }
    .ai-cap-name { font-size: 12px; font-weight: 600; color: var(--sc-text-primary, #f9fafb); }
    .ai-cap-desc { font-size: 10px; color: var(--sc-text-muted, #6b7280); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ai-cap-autonomy { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 3px; flex-shrink: 0; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: var(--sc-bg-secondary, #111827); border: 1px solid var(--sc-border, #374151); border-radius: 10px; padding: 20px; max-width: 720px; width: 90%; max-height: 80vh; overflow-y: auto; }
    .modal h3 { margin: 0 0 12px; color: var(--sc-text-primary, #f9fafb); font-size: 16px; }
    .modal-input { width: 100%; min-height: 80px; padding: 8px; background: var(--sc-bg-tertiary, #1f2937); border: 1px solid var(--sc-border, #374151); border-radius: 4px; color: var(--sc-text-primary, #f9fafb); font-family: inherit; font-size: 12px; resize: vertical; }
    .modal-actions { display: flex; gap: 8px; margin-top: 12px; justify-content: flex-end; }
    .modal-btn { padding: 6px 14px; border-radius: 4px; border: 1px solid var(--sc-border, #374151); background: var(--sc-bg-tertiary, #1f2937); color: var(--sc-text-primary, #f9fafb); cursor: pointer; font-size: 12px; }
    .modal-btn.primary { background: var(--sc-primary, #00d4ff); color: var(--sc-text-inverse, #0f172a); border-color: var(--sc-primary, #00d4ff); font-weight: 600; }
    .modal-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .modal-result { margin-top: 12px; padding: 10px; background: var(--sc-bg-tertiary, #1f2937); border-radius: 4px; font-size: 12px; color: var(--sc-text-secondary, #9ca3af); white-space: pre-wrap; max-height: 200px; overflow-y: auto; }
  `;

  @property({ type: String }) roleId?: string;
  @state() protected _capabilities: AiCapabilityDef[] = [];
  @state() protected _loading = false;
  @state() protected _error: string | undefined = undefined;
  @state() protected _execCap: AiCapabilityDef | null = null;
  @state() protected _execRunning = false;
  @state() protected _execResult: any = null;
  @state() protected _execGeneration = 0;

  private _fetchController: AbortController | null = null;
  private _inputRef: Ref<HTMLTextAreaElement> = createRef();

  connectedCallback() {
    super.connectedCallback();
    this._loadCapabilities();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._fetchController?.abort();
  }

  updated(changed: PropertyValues) {
    if (changed.has('roleId') && this.roleId) {
      this._loadCapabilities();
    }
  }

  private async _loadCapabilities() {
    if (!this.roleId) return;
    this._fetchController?.abort();
    const controller = new AbortController();
    this._fetchController = controller;
    this._loading = true;
    this._error = undefined;
    try {
      this._capabilities = await fetchAiCapabilities(this.roleId, { signal: controller.signal });
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      this._error = e?.message || '加载 AI 能力失败';
    } finally {
      if (!controller.signal.aborted) this._loading = false;
    }
  }

  protected _renderHeader(title: string, icon: string) {
    return html`
      <div class="dashboard-header" aria-label="${title}">
        <div class="dashboard-header-left">
          <div class="dashboard-header-icon">${icon}</div>
          <div>
            <h1 class="dashboard-title">${title}</h1>
            <div class="dashboard-subtitle">${this.roleId ?? ''}</div>
          </div>
        </div>
        <div class="ai-status-indicator">
          <span class="ai-status-dot ${this._loading ? 'loading' : this._error ? 'error' : ''}"></span>
          <span>AI: ${this._loading ? '加载中…' : this._error ? '连接失败' : `${this._capabilities.length} 项能力就绪`}</span>
        </div>
      </div>
    `;
  }

  protected _renderLoading() {
    return html`<div class="loading-state">加载中…</div>`;
  }

  protected _renderError(msg: string) {
    return html`<div class="error-state" role="alert">⚠️ ${msg}</div>`;
  }

  protected _renderAiCapabilities() {
    if (!this._capabilities.length) return html`<div style="text-align:center;padding:20px;color:var(--sc-text-muted);font-size:11px;">该角色暂无 AI 能力</div>`;
    return html`
      <div class="ai-capability-list" role="list" aria-label="AI 能力列表">
        ${this._capabilities.map(c => {
          const al = AUTONOMY_LABELS[c.autonomyLevel];
          return html`
            <div class="ai-capability" role="listitem" tabindex="0"
              @click=${() => this._openExec(c)}
              @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._openExec(c); }}
              aria-label="${c.name}">
              <div class="ai-cap-icon">${c.icon}</div>
              <div class="ai-cap-info">
                <div class="ai-cap-name">${c.name}</div>
                <div class="ai-cap-desc">${c.description}</div>
              </div>
              <div class="ai-cap-autonomy" style="background:${al.color}22;color:${al.color};border:1px solid ${al.color}44;">${c.autonomyLevel}</div>
            </div>
          `;
        })}
      </div>
    `;
  }

  private _openExec(cap: AiCapabilityDef) {
    this._execGeneration++;
    this._execCap = cap;
    this._execResult = null;
  }

  private _closeExec = () => {
    this._execGeneration++;
    this._execCap = null;
    this._execResult = null;
  };

  private async _runExec() {
    if (!this._execCap || !this.roleId || this._execRunning) return;
    const gen = this._execGeneration;
    this._execRunning = true;
    this._execResult = null;
    const input = this._inputRef.value?.value ?? '';
    try {
      const res = await executeAiCapability(this._execCap.id, this.roleId, { userInput: input });
      if (gen !== this._execGeneration) return;
      this._execResult = res?.result ?? res;
    } catch (e: any) {
      if (gen !== this._execGeneration) return;
      this._execResult = { error: e?.message || '执行失败' };
    } finally {
      if (gen === this._execGeneration) this._execRunning = false;
    }
  }

  protected _renderExecModal() {
    if (!this._execCap) return nothing;
    const cap = this._execCap;
    const al = AUTONOMY_LABELS[cap.autonomyLevel];
    const resultStr = typeof this._execResult === 'string'
      ? this._execResult
      : JSON.stringify(this._execResult, null, 2);
    return html`
      <div class="modal-backdrop" @click=${this._closeExec} role="dialog" aria-label="AI 能力执行">
        <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
          <h3>${cap.icon} ${cap.name} <span style="font-size:10px;background:${al.color}22;color:${al.color};padding:2px 6px;border-radius:3px;margin-left:8px;">${cap.autonomyLevel} ${al.name}</span></h3>
          <p style="font-size:11px;color:var(--sc-text-muted);margin:0 0 12px;">${cap.description}</p>
          <textarea class="modal-input" ${ref(this._inputRef)} placeholder="请输入上下文信息（可选）" aria-label="输入"></textarea>
          <div class="modal-actions">
            <button class="modal-btn" @click=${this._closeExec}>关闭</button>
            <button class="modal-btn primary" @click=${this._runExec} ?disabled=${this._execRunning}>${this._execRunning ? '执行中…' : '🚀 执行'}</button>
          </div>
          ${this._execResult ? html`<div class="modal-result">${resultStr}</div>` : ''}
        </div>
      </div>
    `;
  }
}

/**
 * sc-command-palette — 全局命令面板
 * 触发: Cmd/Ctrl+K
 * 功能: 角色/工具/操作搜索 + 键盘导航
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { ROLE_TOOL_CONFIGS, ALL_ROLE_IDS, getAllTools, type RoleId } from '../config/role-tool-config';
import { ROLE_THEMES } from '../config/role-theme-config';

export type CommandAction =
  | { type: 'switch-role'; roleId: RoleId }
  | { type: 'open-tool'; toolId: string; roleId: RoleId }
  | { type: 'open-settings' }
  | { type: 'go-overview' }
  | { type: 'open-market' };

interface SearchItem {
  type: 'role' | 'tool' | 'action';
  id: string;
  title: string;
  desc: string;
  icon: string;
  badge?: string;
  badgeClass: string;
  shortcut?: string;
  action: CommandAction;
}

@customElement('sc-command-palette')
export class ScCommandPalette extends LitElement {
  static styles = css`
    :host {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 12vh;
    }
    .backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(4px);
      animation: fadeIn 0.15s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .palette {
      position: relative;
      width: 100%;
      max-width: 560px;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 12px;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05);
      overflow: hidden;
      animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      max-height: 70vh;
      display: flex;
      flex-direction: column;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-12px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .search-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-bottom: 1px solid #1e293b;
    }
    .search-icon { font-size: 16px; color: #475569; flex-shrink: 0; }
    .search-input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      font-size: 15px;
      color: #f1f5f9;
      caret-color: #3b82f6;
      font-family: inherit;
    }
    .search-input::placeholder { color: #475569; }
    .kbd-hint {
      font-size: 10px;
      color: #334155;
      font-family: monospace;
      padding: 2px 6px;
      background: #1e293b;
      border-radius: 4px;
      border: 1px solid #334155;
      flex-shrink: 0;
    }
    .results {
      flex: 1;
      overflow-y: auto;
      padding: 6px;
    }
    .results::-webkit-scrollbar { width: 4px; }
    .results::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
    .section-header {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #3b82f6;
      padding: 8px 10px 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-header::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #1e293b;
    }
    .result-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.1s;
      position: relative;
    }
    .result-item:hover,
    .result-item.active { background: #1e293b; }
    .result-item.active {
      background: #1e3a5f;
    }
    .result-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 4px;
      bottom: 4px;
      width: 3px;
      background: #3b82f6;
      border-radius: 2px;
    }
    .result-icon {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
      background: #1e293b;
    }
    .result-body { flex: 1; min-width: 0; }
    .result-title {
      font-size: 13px;
      font-weight: 500;
      color: #f1f5f9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .result-item.active .result-title { color: #fff; }
    .result-desc {
      font-size: 11px;
      color: #475569;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .result-badge {
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      flex-shrink: 0;
    }
    .result-badge.role-badge { background: #3b82f622; color: #60a5fa; }
    .result-badge.tool-badge { background: #22c55e22; color: #4ade80; }
    .result-badge.action-badge { background: #f59e0b22; color: #fbbf24; }
    .result-shortcut {
      font-size: 10px;
      color: #334155;
      font-family: monospace;
      flex-shrink: 0;
    }
    .no-results {
      padding: 32px;
      text-align: center;
      color: #475569;
      font-size: 13px;
    }
    .footer {
      padding: 8px 16px;
      border-top: 1px solid #1e293b;
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 10px;
      color: #334155;
    }
    .footer-hint { display: flex; align-items: center; gap: 4px; }
    .footer-hint .kbd {
      font-family: monospace;
      padding: 1px 4px;
      background: #1e293b;
      border-radius: 3px;
      border: 1px solid #334155;
      font-size: 9px;
    }
    .match { color: #3b82f6; font-weight: 700; }
  `;

  @state() private _query = '';
  @state() private _activeIndex = 0;
  @query('.search-input') private _inputEl!: HTMLInputElement;

  private _buildIndex(): SearchItem[] {
    const items: SearchItem[] = [];

    // Actions
    const actions: Omit<SearchItem, 'badgeClass'>[] = [
      { id: 'overview', title: '安全总览', desc: '查看全域安全态势', icon: '📊', action: { type: 'go-overview' } },
      { id: 'market', title: '工具市场', desc: '浏览和启用安全工具', icon: '🧩', action: { type: 'open-market' } },
      { id: 'settings', title: '系统设置', desc: 'AI 后端、角色配置、全局设置', icon: '⚙️', action: { type: 'open-settings' } },
    ];
    for (const a of actions) {
      items.push({ ...a, type: 'action', badgeClass: 'action-badge' });
    }

    // Roles
    for (const roleId of ALL_ROLE_IDS) {
      const cfg = ROLE_TOOL_CONFIGS[roleId];
      const theme = ROLE_THEMES[roleId];
      items.push({
        type: 'role',
        id: roleId,
        title: cfg.label,
        desc: `切换到 ${cfg.label} 指挥台`,
        icon: '👤',
        badge: roleId,
        badgeClass: 'role-badge',
        shortcut: `Ctrl+Shift+${ALL_ROLE_IDS.indexOf(roleId) + 1}`,
        action: { type: 'switch-role', roleId },
      });
    }

    // Tools
    const seenTools = new Set<string>();
    const priorityTools = [
      'alert-queue', 'incident-mgmt', 'vuln-scan', 'risk-score', 'compliance-chk',
      'soar-exec', 'threat-intel', 'bcp-mgmt', 'sbom-scan', 'vendor-eval',
      'patch-mgmt', 'board-report', 'budget-dash', 'kpi-track', 'zero-trust',
      'gdpr-audit', 'threat-model', 'global-situation', 'ai-dispatch', 'pen-test',
    ];
    for (const toolId of priorityTools) {
      for (const roleId of ALL_ROLE_IDS) {
        const tools = getAllTools(roleId);
        const tool = tools.find(t => t.id === toolId);
        if (tool && !seenTools.has(toolId)) {
          seenTools.add(toolId);
          const cfg = ROLE_TOOL_CONFIGS[roleId];
          items.push({
            type: 'tool',
            id: toolId,
            title: tool.label,
            desc: `在 ${cfg.label} 中使用`,
            icon: '🔧',
            badge: cfg.label,
            badgeClass: 'tool-badge',
            action: { type: 'open-tool', toolId, roleId },
          });
        }
      }
    }
    return items;
  }

  private _fuzzyScore(query: string, text: string): number {
    if (!query) return 1;
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    if (t === q) return 100;
    if (t.startsWith(q)) return 80;
    if (t.includes(q)) return 60;
    let qi = 0, consecutive = 0, score = 0;
    for (let i = 0; i < t.length && qi < q.length; i++) {
      if (t[i] === q[qi]) { qi++; consecutive++; score += consecutive * 2; }
      else { consecutive = 0; }
    }
    if (qi < q.length) return 0;
    return Math.min(score, 50);
  }

  private _filtered(): SearchItem[] {
    const q = this._query.trim();
    if (!q) {
      return this._buildIndex().filter(i => i.type === 'action' || i.type === 'role');
    }
    return this._buildIndex()
      .map(item => ({ item, score: Math.max(this._fuzzyScore(q, item.title), this._fuzzyScore(q, item.desc)) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
  }

  private _highlight(text: string, query: string): string {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return text.slice(0, idx) + '<mark class="match">' + text.slice(idx, idx + query.length) + '</mark>' + text.slice(idx + query.length);
  }

  connectedCallback() {
    super.connectedCallback();
    requestAnimationFrame(() => this._inputEl?.focus());
  }

  private _close() {
    this.dispatchEvent(new CustomEvent('palette-close', { bubbles: true, composed: true }));
  }

  private _onBackdropClick(e: Event) {
    if (e.target === e.currentTarget) this._close();
  }

  private _onInput(e: Event) {
    this._query = (e.target as HTMLInputElement).value;
    this._activeIndex = 0;
  }

  private _onKeyDown(e: KeyboardEvent) {
    const results = this._filtered();
    if (e.key === 'Escape') { e.preventDefault(); this._close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); this._activeIndex = (this._activeIndex + 1) % Math.max(results.length, 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this._activeIndex = (this._activeIndex - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[this._activeIndex]) this._select(results[this._activeIndex]); }
  }

  private _select(item: SearchItem) {
    this.dispatchEvent(new CustomEvent('palette-select', { detail: { action: item.action }, bubbles: true, composed: true }));
    this._close();
  }

  private _sectionLabel(type: string) {
    return type === 'role' ? '角色' : type === 'tool' ? '工具' : '操作';
  }

  render() {
    const results = this._filtered();
    const sections = ['role', 'tool', 'action'] as const;
    const grouped = new Map<string, SearchItem[]>();
    for (const r of results) {
      if (!grouped.has(r.type)) grouped.set(r.type, []);
      grouped.get(r.type)!.push(r);
    }
    let flatIndex = 0;

    return html`
      <div class="backdrop" @click=${this._onBackdropClick}></div>
      <div class="palette" role="dialog" aria-modal="true" aria-label="命令面板">
        <div class="search-row">
          <span class="search-icon">🔍</span>
          <input class="search-input" type="text" placeholder="搜索角色、工具、操作..."
            .value=${this._query} @input=${this._onInput} @keydown=${this._onKeyDown}
            autocomplete="off" spellcheck="false" />
          <span class="kbd-hint">ESC</span>
        </div>
        <div class="results" role="listbox">
          ${results.length === 0 ? html`
            <div class="no-results">
              <div style="font-size:20px;margin-bottom:8px">🔍</div>
              未找到 "${this._query}"
            </div>
          ` : sections.map(section => {
            const items = grouped.get(section) ?? [];
            if (items.length === 0) return nothing;
            const startIndex = flatIndex;
            flatIndex += items.length;
            return html`
              <div class="section-header">
                <span>${section === 'role' ? '👤' : section === 'tool' ? '🔧' : '⚡'}</span>
                <span>${this._sectionLabel(section)}</span>
              </div>
              ${items.map(item => {
                const myIndex = startIndex + items.indexOf(item);
                const isActive = myIndex === this._activeIndex;
                return html`
                  <div class="result-item ${isActive ? 'active' : ''}" role="option" aria-selected=${isActive}
                    @click=${() => this._select(item)} @mouseenter=${() => { this._activeIndex = myIndex; }}>
                    <div class="result-icon">${item.icon}</div>
                    <div class="result-body">
                      <div class="result-title">${unsafeInnerHTML(this._highlight(item.title, this._query))}</div>
                      <div class="result-desc">${item.desc}</div>
                    </div>
                    ${item.badge ? html`<span class="result-badge ${item.badgeClass}">${item.badge}</span>` : nothing}
                    ${item.shortcut ? html`<span class="result-shortcut">${item.shortcut}</span>` : nothing}
                  </div>
                `;
              })}
            `;
          })}
        </div>
        <div class="footer">
          <span class="footer-hint"><span class="kbd">↑↓</span> 导航</span>
          <span class="footer-hint"><span class="kbd">↵</span> 选择</span>
          <span class="footer-hint"><span class="kbd">ESC</span> 关闭</span>
        </div>
      </div>
    `;
  }
}

function unsafeInnerHTML(htmlStr: string) {
  const tmpl = document.createElement('template');
  tmpl.innerHTML = htmlStr;
  return tmpl.content.cloneNode(true);
}

declare global { interface HTMLElementTagNameMap { 'sc-command-palette': ScCommandPalette; } }

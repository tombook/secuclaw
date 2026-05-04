/**
 * sc-evolution-dashboard — Evolution System Dashboard
 *
 * 自主进化能力仪表盘，展示:
 * - Nudge 计数器状态
 * - 记忆条目统计
 * - Gateway 实时连接状态
 *
 * 数据来源: fetchEvolutionStatus() / fetchEvolutionMemories() → packages/core/evolution
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import {
  fetchEvolutionStatus,
  fetchEvolutionMemories,
  addEvolutionMemory,
  triggerEvolutionReview,
  type EvolutionMemoryContext,
  type EvolutionMemoryEntry,
} from '../../../services/api-service';
import type { RoleId } from '../../../config/role-tool-config';
import { ROLE_THEMES as ROLE_THEME_CONFIGS } from '../../../config/role-theme-config';

// ─── Constants ────────────────────────────────────────────────

const ROLE_LABELS: Record<RoleId, string> = {
  'security-expert': '🛡️ 安全专家',
  'privacy-officer': '🔐 隐私官',
  'security-architect': '🏗️ 安全架构师',
  'business-security-officer': '📊 业务安全官',
  'secuclaw-commander': '🎯 指挥官',
  'ciso': '👔 CISO',
  'security-ops': '⚙️ 安全运营',
  'supply-chain-security': '🔗 供应链安全',
};

const ALL_ROLES: RoleId[] = [
  'security-expert', 'privacy-officer', 'security-architect',
  'business-security-officer', 'secuclaw-commander', 'ciso',
  'security-ops', 'supply-chain-security',
];

const MEM_NUDGE_INTERVAL = 10;
const SKILL_NUDGE_INTERVAL = 10;

@customElement('evolution-dashboard')
export class ScEvolutionDashboard extends LitElement {

  // ─── State ─────────────────────────────────────────────────

  @state() private _activeTab: 'overview' | 'memories' | 'add' = 'overview';
  @state() private _selectedRole: RoleId = 'secuclaw-commander';
  @state() private _evolution: {
    status: EvolutionMemoryContext | null;
    memories: EvolutionMemoryEntry[];
    loading: boolean;
  } = { status: null, memories: [], loading: false };
  @state() private _addForm = { target: 'memory' as 'memory' | 'user', content: '' };
  @state() private _addLoading = false;

  // ─── Lifecycle ─────────────────────────────────────────────

  connectedCallback() {
    super.connectedCallback();
    this._init();
  }

  private async _init() {
    this._evolution.loading = true;
    this.requestUpdate();

    try {
      const [statusResult, memoriesResult] = await Promise.all([
        fetchEvolutionStatus(this._selectedRole),
        fetchEvolutionMemories(this._selectedRole),
      ]);

      this._evolution.status = statusResult.data ?? null;
      this._evolution.memories = memoriesResult.data ?? [];

    } catch (e) {
      console.warn('[EvolutionDashboard] Init failed:', e);
    } finally {
      this._evolution.loading = false;
      this.requestUpdate();
    }
  }

  // ─── Styles ────────────────────────────────────────────────

  static styles = css`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --primary: #3b82f6;
      --success: #22c55e;
      --warning: #f59e0b;
      --danger: #ef4444;
      --bg: #0f1117;
      --bg-secondary: #1a1d27;
      --bg-tertiary: #252a3a;
      --border: #2d3348;
      --text: #e2e8f0;
      --text-muted: #94a3b8;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
      position: sticky;
      top: 0;
      z-index: 10;
      gap: 8px;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
      white-space: nowrap;
    }

    .role-selector {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .role-btn {
      padding: 3px 8px;
      font-size: 10px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--bg-tertiary);
      color: var(--text-muted);
      cursor: pointer;
      transition: all 100ms;
    }

    .role-btn:hover { border-color: var(--primary); color: var(--text); }
    .role-btn.active { background: var(--primary); border-color: var(--primary); color: white; }

    /* ── Tabs ── */
    .tabs {
      display: flex;
      gap: 2px;
      padding: 8px 16px;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border);
    }

    .tab {
      padding: 5px 12px;
      font-size: 11px;
      font-weight: 500;
      border: 1px solid transparent;
      border-radius: 4px;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
    }

    .tab:hover { color: var(--text); background: var(--bg-tertiary); }
    .tab.active { background: var(--bg-tertiary); border-color: var(--border); color: var(--text); }

    /* ── Content ── */
    .content { padding: 14px; }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100px;
      color: var(--text-muted);
      font-size: 12px;
    }

    /* ── Stats Grid ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }

    .stat-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 12px;
    }

    .stat-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 22px;
      font-weight: 800;
      color: var(--text);
      line-height: 1;
    }

    .stat-value.success { color: var(--success); }
    .stat-value.warning { color: var(--warning); }
    .stat-value.danger { color: var(--danger); }
    .stat-value.primary { color: var(--primary); }

    .stat-sub { font-size: 9px; color: var(--text-muted); margin-top: 2px; }

    /* ── Nudge ── */
    .nudge-section {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      margin-bottom: 14px;
      overflow: hidden;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      background: var(--bg-tertiary);
      border-bottom: 1px solid var(--border);
    }

    .nudge-bars { padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }

    .nudge-row {
      display: grid;
      grid-template-columns: 60px 1fr 36px;
      align-items: center;
      gap: 8px;
    }

    .nudge-label { font-size: 10px; color: var(--text-muted); }

    .nudge-bar-track {
      height: 5px;
      background: var(--bg-tertiary);
      border-radius: 3px;
      overflow: hidden;
    }

    .nudge-bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 400ms ease;
    }

    .nudge-bar-fill.green { background: var(--success); }
    .nudge-bar-fill.yellow { background: var(--warning); }
    .nudge-bar-fill.red { background: var(--danger); }

    .nudge-count { font-size: 10px; font-weight: 600; color: var(--text); text-align: right; }

    /* ── Memory List ── */
    .memory-list { display: flex; flex-direction: column; gap: 6px; }

    .memory-item {
      padding: 8px 10px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 11px;
    }

    .memory-meta {
      display: flex;
      gap: 8px;
      margin-bottom: 4px;
    }

    .memory-tag {
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 600;
    }

    .memory-tag.memory { background: rgba(59,130,246,0.15); color: var(--primary); }
    .memory-tag.user { background: rgba(34,197,94,0.15); color: var(--success); }
    .memory-tag.category { background: var(--bg-tertiary); color: var(--text-muted); }

    .memory-content { color: var(--text); line-height: 1.4; }
    .memory-time { font-size: 9px; color: var(--text-muted); margin-top: 4px; }

    /* ── Add Form ── */
    .add-form { display: flex; flex-direction: column; gap: 10px; }

    .form-group { display: flex; flex-direction: column; gap: 4px; }

    .form-label { font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

    .form-select, .form-textarea {
      padding: 7px 10px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      font-size: 12px;
      font-family: inherit;
      outline: none;
    }

    .form-select:focus, .form-textarea:focus { border-color: var(--primary); }

    .form-textarea { resize: vertical; min-height: 80px; }

    .form-actions { display: flex; gap: 8px; }

    .btn {
      padding: 6px 14px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      transition: all 100ms;
    }

    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: #2563eb; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--text-muted); }
    .btn-ghost:hover { border-color: var(--text); color: var(--text); }

    /* ── Empty ── */
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100px;
      color: var(--text-muted);
      font-size: 11px;
      gap: 6px;
    }

    .empty-icon { font-size: 20px; opacity: 0.3; }
  `;

  // ─── Render ────────────────────────────────────────────────

  render() {
    return html`
      <div class="header">
        <div class="header-title">🧬 自主进化</div>
        <div class="role-selector">
          ${ALL_ROLES.map(r => html`
            <button
              class="role-btn ${r === this._selectedRole ? 'active' : ''}"
              @click=${() => { this._selectedRole = r; this._init(); }}
            >${ROLE_THEME_CONFIGS[r]?.label ?? r}</button>
          `)}
        </div>
      </div>

      <div class="tabs">
        ${(['overview', 'memories', 'add'] as const).map(tab => html`
          <button class="tab ${this._activeTab === tab ? 'active' : ''}" @click=${() => { this._activeTab = tab; }}>
            ${tab === 'overview' ? '📊 概览' : tab === 'memories' ? '🧠 记忆' : '➕ 添加'}
          </button>
        `)}
      </div>

      <div class="content">
        ${this._evolution.loading
          ? html`<div class="loading">加载中...</div>`
          : this._activeTab === 'overview' ? this._renderOverview()
          : this._activeTab === 'memories' ? this._renderMemories()
          : this._renderAdd()}
      </div>
    `;
  }

  private _renderOverview() {
    const status = this._evolution.status;
    const nudge = status?.nudge;

    const memTurns = nudge?.turnsSinceMemory ?? 0;
    const skillTurns = nudge?.itersSinceSkill ?? 0;
    const memPct = Math.min(100, (memTurns % MEM_NUDGE_INTERVAL) * 10);
    const skillPct = Math.min(100, (skillTurns % SKILL_NUDGE_INTERVAL) * 10);
    const memColor = memPct >= 80 ? 'red' : memPct >= 50 ? 'yellow' : 'green';
    const skillColor = skillPct >= 80 ? 'red' : skillPct >= 50 ? 'yellow' : 'green';

    const lastMem = nudge?.lastMemoryReview ? new Date(nudge.lastMemoryReview).toLocaleString('zh-CN') : '—';
    const lastSkill = nudge?.lastSkillReview ? new Date(nudge.lastSkillReview).toLocaleString('zh-CN') : '—';

    return html`
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">记忆</div>
          <div class="stat-value primary">${status?.memoryCount ?? 0}</div>
          <div class="stat-sub">条目数</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">用户画像</div>
          <div class="stat-value success">${status?.userProfileCount ?? 0}</div>
          <div class="stat-sub">条目数</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Gateway</div>
          <div class="stat-value ${status ? 'success' : 'danger'}">${status ? '在线' : '离线'}</div>
          <div class="stat-sub">${ROLE_THEME_CONFIGS[this._selectedRole]?.label ?? status?.role ?? '—'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Memory 进度</div>
          <div class="stat-value warning">${MEM_NUDGE_INTERVAL - (memTurns % MEM_NUDGE_INTERVAL)}</div>
          <div class="stat-sub">轮后触发</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Skill 进度</div>
          <div class="stat-value warning">${SKILL_NUDGE_INTERVAL - (skillTurns % SKILL_NUDGE_INTERVAL)}</div>
          <div class="stat-sub">次后触发</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">上次 Memory 审查</div>
          <div class="stat-value" style="font-size:13px">${memTurns === 0 ? '已触发' : '—'}</div>
          <div class="stat-sub">${lastMem}</div>
        </div>
      </div>

      <div class="nudge-section">
        <div class="section-header">🔔 Nudge 计数器</div>
        <div class="nudge-bars">
          <div class="nudge-row">
            <span class="nudge-label">Memory</span>
            <div class="nudge-bar-track">
              <div class="nudge-bar-fill ${memColor}" style="width:${memPct}%"></div>
            </div>
            <span class="nudge-count">${memTurns % MEM_NUDGE_INTERVAL}/${MEM_NUDGE_INTERVAL}</span>
          </div>
          <div class="nudge-row">
            <span class="nudge-label">Skill</span>
            <div class="nudge-bar-track">
              <div class="nudge-bar-fill ${skillColor}" style="width:${skillPct}%"></div>
            </div>
            <span class="nudge-count">${skillTurns % SKILL_NUDGE_INTERVAL}/${SKILL_NUDGE_INTERVAL}</span>
          </div>
        </div>
      </div>

      <div class="nudge-section">
        <div class="section-header">📅 最近审查时间</div>
        <div style="padding: 8px 12px; font-size: 11px; color: var(--text-muted); display: flex; gap: 16px;">
          <span>Memory: ${lastMem}</span>
          <span>Skill: ${lastSkill}</span>
        </div>
      </div>
    `;
  }

  private _renderMemories() {
    const memories = this._evolution.memories;

    if (memories.length === 0) {
      return html`
        <div class="empty">
          <span class="empty-icon">🧠</span>
          <span>暂无记忆条目</span>
          <span style="font-size:9px; color: var(--text-muted)">在「添加」页面手动添加，或等待 Nudge 触发自动沉淀</span>
        </div>
      `;
    }

    return html`
      <div class="memory-list">
        ${memories.map(m => html`
          <div class="memory-item">
            <div class="memory-meta">
              <span class="memory-tag ${m.target}">${m.target === 'memory' ? '记忆' : '画像'}</span>
              <span class="memory-tag category">${m.category}</span>
            </div>
            <div class="memory-content">${m.content.length > 200 ? m.content.slice(0, 200) + '…' : m.content}</div>
            <div class="memory-time">${new Date(m.createdAt).toLocaleString('zh-CN')} · ${m.source}</div>
          </div>
        `)}
      </div>
    `;
  }

  private _renderAdd() {
    return html`
      <div class="add-form">
        <div class="form-group">
          <label class="form-label">类型</label>
          <select
            class="form-select"
            .value=${this._addForm.target}
            @change=${(e: Event) => { this._addForm = { ...this._addForm, target: (e.target as HTMLSelectElement).value as 'memory' | 'user' }; }}
          >
            <option value="memory">记忆 (Agent Notes)</option>
            <option value="user">用户画像 (User Profile)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">内容</label>
          <textarea
            class="form-textarea"
            placeholder="输入要记忆的内容…"
            .value=${this._addForm.content}
            @input=${(e: Event) => { this._addForm = { ...this._addForm, content: (e.target as HTMLTextAreaElement).value }; }}
          ></textarea>
        </div>

        <div class="form-actions">
          <button
            class="btn btn-primary"
            ?disabled=${!this._addForm.content.trim() || this._addLoading}
            @click=${this._handleAdd}
          >${this._addLoading ? '添加中…' : '添加记忆'}</button>
          <button class="btn btn-ghost" @click=${() => { this._addForm = { target: 'memory', content: '' }; }}>清空</button>
        </div>
      </div>
    `;
  }

  private async _handleAdd() {
    if (!this._addForm.content.trim()) return;
    this._addLoading = true;
    this.requestUpdate();

    try {
      const result = await addEvolutionMemory(this._addForm.target, this._addForm.content.trim(), this._selectedRole);
      if (result.data.success) {
        this._addForm = { target: this._addForm.target, content: '' };
        await this._init();
      }
    } finally {
      this._addLoading = false;
      this.requestUpdate();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'evolution-dashboard': ScEvolutionDashboard;
  }
}

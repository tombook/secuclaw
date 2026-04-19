/**
 * sc-plugin-market — 安全工具插件市场 UI (CRUD)
 *
 * 功能：
 * - 展示所有已注册工具（内置 + 第三方）
 * - 分类筛选、关键词搜索
 * - 启用/禁用、新增、删除、修改插件
 * - 工具详情查看（manifest 信息 + 配置）
 * - YAML/JSON 导入自定义工具
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { pluginStore } from '../plugins/index';
import { validateManifest } from '../plugins/plugin-validator';
import { getBackendState } from '../plugins/plugin-runtime';
import type { ToolPluginManifest, ToolCategory } from '../plugins/types';
import * as yaml from 'js-yaml';

const CATEGORY_LABELS: Record<string, string> = {
  'threat-detection': '威胁检测', 'vulnerability-mgmt': '漏洞管理',
  'compliance': '合规管理', 'incident-response': '应急响应',
  'risk-assessment': '风险评估', 'architecture': '架构安全',
  'business-continuity': '业务连续性', 'supply-chain': '供应链安全',
  'governance': '安全治理', 'intelligence': '威胁情报',
  'automation': '安全自动化', 'monitoring': '安全监控',
  'data-protection': '数据保护', 'identity-access': '身份访问',
  'reporting': '安全报告', 'third-party': '第三方工具',
};

const CATEGORY_ICONS: Record<string, string> = {
  'threat-detection': '🎯', 'vulnerability-mgmt': '🛡️',
  'compliance': '📋', 'incident-response': '🚨',
  'risk-assessment': '📊', 'architecture': '🏗️',
  'business-continuity': '🔄', 'supply-chain': '🔗',
  'governance': '👑', 'intelligence': '🔍',
  'automation': '🤖', 'monitoring': '📡',
  'data-protection': '🔐', 'identity-access': '🔑',
  'reporting': '📄', 'third-party': '🧩',
};

const ROLE_LABELS: Record<string, string> = {
  'ciso': 'CISO', 'secuclaw-commander': '安全指挥官',
  'security-ops': '安全运营', 'security-expert': '安全专家',
  'privacy-officer': '隐私官', 'security-architect': '安全架构师',
  'business-security-officer': '业务安全官', 'supply-chain-security': '供应链安全',
};

/** 编辑表单数据 */
interface PluginFormData {
  id: string;
  name: string;
  uri: string;
  icon: string;
  description: string;
  category: ToolCategory;
  provider: 'built-in' | 'third-party' | 'custom';
  roles: string[];
  enabled: boolean;
}

const EMPTY_FORM: PluginFormData = {
  id: '', name: '', uri: '', icon: '🔧',
  description: '', category: 'monitoring',
  provider: 'custom', roles: [], enabled: true,
};

@customElement('sc-plugin-market')
export class ScPluginMarket extends LitElement {
  static styles = css`
    :host { display: flex; flex-direction: column; color: #e2e8f0; height: 100%; }

    /* ─── Header ─── */
    .market-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid #1e293b;
    }
    .market-title { font-size: 16px; font-weight: 700; }
    .market-subtitle { font-size: 11px; color: #64748b; margin-top: 2px; }
    .header-actions { display: flex; gap: 8px; }

    /* ─── Buttons ─── */
    .btn {
      font-size: 11px; padding: 6px 14px; border-radius: 6px;
      border: 1px solid #334155; background: transparent; color: #94a3b8;
      cursor: pointer; font-weight: 600; transition: all 100ms;
    }
    .btn:hover { border-color: #3b82f6; color: #3b82f6; }
    .btn-primary { background: #3b82f6; border-color: #3b82f6; color: #fff; }
    .btn-primary:hover { background: #2563eb; }
    .btn-danger { border-color: #ef4444; color: #ef4444; }
    .btn-danger:hover { background: #ef444422; }
    .btn-sm { font-size: 10px; padding: 3px 8px; border-radius: 4px; }

    /* ─── Stats Bar ─── */
    .stats-bar {
      display: flex; gap: 16px; padding: 10px 20px;
      border-bottom: 1px solid #1e293b; align-items: center;
    }
    .stat { display: flex; align-items: center; gap: 4px; font-size: 11px; }
    .stat-num { font-weight: 700; color: #e2e8f0; }
    .stat-label { color: #64748b; }
    .backend-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin-right: 2px; }
    .backend-dot.available { background: #22c55e; }
    .backend-dot.unavailable { background: #f59e0b; }
    .backend-dot.unknown { background: #64748b; }

    /* ─── Toolbar ─── */
    .toolbar {
      display: flex; gap: 8px; padding: 12px 20px;
      border-bottom: 1px solid #1e293b; flex-wrap: wrap; align-items: center;
    }
    .search-input {
      background: #0a0f1a; border: 1px solid #1e293b; border-radius: 6px;
      padding: 6px 10px 6px 30px; font-size: 12px; color: #e2e8f0;
      width: 220px; outline: none;
    }
    .search-input:focus { border-color: #3b82f6; }
    .search-wrap { position: relative; }
    .search-wrap::before { content: '🔍'; position: absolute; left: 8px; top: 6px; font-size: 12px; }
    .cat-chip {
      font-size: 10px; padding: 3px 8px; border-radius: 4px;
      border: 1px solid #334155; background: transparent; color: #94a3b8;
      cursor: pointer; transition: all 100ms;
    }
    .cat-chip:hover { border-color: #475569; color: #e2e8f0; }
    .cat-chip.active { border-color: #3b82f6; color: #3b82f6; background: #3b82f612; }

    /* ─── Plugin Table ─── */
    .table-scroll {
      overflow: auto; flex: 1; padding: 0 4px;
    }
    .plugin-table {
      width: 100%; border-collapse: collapse; font-size: 11px;
      min-width: 900px;
    }
    .plugin-table th {
      text-align: left; padding: 8px 8px; font-size: 10px;
      color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;
      border-bottom: 1px solid #1e293b; font-weight: 600;
      position: sticky; top: 0; background: #0f172a; z-index: 1;
      white-space: nowrap;
    }
    .plugin-table td {
      padding: 8px 8px; border-bottom: 1px solid #1e293b44;
      vertical-align: middle;
    }
    .plugin-table tr:hover td { background: #1e293b44; }
    .plugin-table tr.disabled td { opacity: 0.45; }

    .td-name { display: flex; align-items: center; gap: 8px; }
    .td-icon { font-size: 16px; }
    .td-name-text { font-weight: 600; }

    .td-uri {
      font-family: monospace; font-size: 10px; color: #3b82f6;
      cursor: pointer; padding: 2px 6px; border-radius: 3px;
    }
    .td-uri:hover { background: #3b82f618; }

    .provider-badge {
      font-size: 9px; padding: 2px 6px; border-radius: 3px; font-weight: 600;
    }
    .provider-badge.built-in { color: #3b82f6; background: #3b82f618; }
    .provider-badge.third-party { color: #a78bfa; background: #a78bfa18; }
    .provider-badge.custom { color: #22c55e; background: #22c55e18; }

    .role-tags { display: flex; gap: 3px; flex-wrap: wrap; }
    .role-tag {
      font-size: 9px; padding: 1px 5px; border-radius: 3px;
      background: #1e293b; color: #94a3b8;
    }

    .cat-label { font-size: 11px; color: #94a3b8; }

    .action-group { display: flex; gap: 4px; }

    /* ─── Modal ─── */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      z-index: 2000; display: flex; align-items: center; justify-content: center;
    }
    .modal {
      width: 560px; max-height: 85vh; background: #0f172a;
      border: 1px solid #1e293b; border-radius: 12px;
      display: flex; flex-direction: column; overflow: hidden;
    }
    .modal-header {
      display: flex; align-items: center; padding: 16px 20px;
      border-bottom: 1px solid #1e293b; gap: 10px;
    }
    .modal-title { font-size: 14px; font-weight: 700; flex: 1; }
    .modal-close {
      width: 28px; height: 28px; border-radius: 6px;
      border: 1px solid #334155; background: transparent;
      color: #94a3b8; font-size: 14px; cursor: pointer;
    }
    .modal-close:hover { background: #1e293b; color: #e2e8f0; }
    .modal-body { flex: 1; overflow-y: auto; padding: 20px; }

    /* ─── Form ─── */
    .form-group { margin-bottom: 16px; }
    .form-label {
      display: block; font-size: 11px; font-weight: 600;
      color: #94a3b8; margin-bottom: 6px;
    }
    .form-input {
      width: 100%; box-sizing: border-box;
      background: #0a0f1a; border: 1px solid #1e293b; border-radius: 6px;
      padding: 8px 12px; font-size: 12px; color: #e2e8f0; outline: none;
    }
    .form-input:focus { border-color: #3b82f6; }
    .form-input::placeholder { color: #475569; }
    textarea.form-input { resize: vertical; min-height: 60px; font-family: inherit; }
    select.form-input { cursor: pointer; }

    .form-row { display: flex; gap: 12px; }
    .form-row .form-group { flex: 1; }

    .checkbox-group { display: flex; flex-wrap: wrap; gap: 6px; }
    .checkbox-item {
      display: flex; align-items: center; gap: 4px;
      font-size: 11px; color: #94a3b8; cursor: pointer;
      padding: 4px 8px; border-radius: 4px; border: 1px solid #1e293b;
      transition: all 100ms;
    }
    .checkbox-item:hover { border-color: #475569; }
    .checkbox-item.checked { border-color: #3b82f6; color: #3b82f6; background: #3b82f612; }
    .checkbox-item input { display: none; }

    .modal-footer {
      display: flex; justify-content: flex-end; gap: 8px;
      padding: 16px 20px; border-top: 1px solid #1e293b;
    }

    /* ─── Toast ─── */
    .toast {
      position: fixed; bottom: 20px; right: 20px;
      padding: 10px 16px; border-radius: 8px; font-size: 12px;
      font-weight: 600; z-index: 3000; animation: slideUp 200ms ease;
    }
    .toast.success { background: #22c55e22; color: #22c55e; border: 1px solid #22c55e44; }
    .toast.error { background: #ef444422; color: #ef4444; border: 1px solid #ef444444; }
    @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    /* ─── Empty state ─── */
    .empty { padding: 60px 20px; text-align: center; color: #475569; }
    .empty-icon { font-size: 32px; margin-bottom: 8px; }

    /* ─── Confirm dialog ─── */
    .confirm-text { font-size: 13px; color: #e2e8f0; margin-bottom: 12px; line-height: 1.5; }
    .confirm-name { color: #ef4444; font-weight: 700; }
  `;

  @state() private _search = '';
  @state() private _categoryFilter: ToolCategory | 'all' = 'all';
  @state() private _selectedTool: string | null = null;
  @state() private _toast: { text: string; type: 'success' | 'error' } | null = null;
  @state() private _editingTool: string | null = null; // null = 新增, 'id' = 编辑
  @state() private _formMode: 'closed' | 'add' | 'edit' | 'delete' = 'closed';
  @state() private _form: PluginFormData = { ...EMPTY_FORM };

  // ─── Helpers ───

  private _getFilteredTools() {
    const state = pluginStore.getState();
    const all: Array<{ manifest: ToolPluginManifest; enabled: boolean }> = [];
    for (const [, plugin] of state.plugins) {
      all.push({ manifest: plugin.manifest, enabled: plugin.enabled });
    }
    let filtered = all;
    if (this._categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.manifest.meta.category === this._categoryFilter);
    }
    if (this._search.trim()) {
      const q = this._search.toLowerCase();
      filtered = filtered.filter(p =>
        p.manifest.meta.name.toLowerCase().includes(q) ||
        p.manifest.meta.description.toLowerCase().includes(q) ||
        p.manifest.meta.id.toLowerCase().includes(q)
      );
    }
    return filtered;
  }

  private _getAllTools() {
    const result: Array<{ manifest: ToolPluginManifest; enabled: boolean }> = [];
    for (const [, plugin] of pluginStore.getState().plugins) {
      result.push({ manifest: plugin.manifest, enabled: plugin.enabled });
    }
    return result;
  }

  private _showToast(text: string, type: 'success' | 'error') {
    this._toast = { text, type };
    setTimeout(() => { this._toast = null; this.requestUpdate(); }, 2500);
  }

  // ─── Actions ───

  private _toggleTool(toolId: string, enable: boolean) {
    pluginStore.getState().setEnabled(toolId, enable);
    this._showToast(enable ? `已启用 ${toolId}` : `已禁用 ${toolId}`, 'success');
  }

  private _openAddForm() {
    this._form = { ...EMPTY_FORM, id: `custom-${Date.now()}` };
    this._formMode = 'add';
  }

  private _openEditForm(toolId: string) {
    const m = pluginStore.getState().getManifest(toolId);
    if (!m) return;
    this._form = {
      id: m.meta.id,
      name: m.meta.name,
      uri: m.meta.uri || `/tool/${m.meta.id}`,
      icon: m.meta.icon,
      description: m.meta.description,
      category: m.meta.category,
      provider: m.meta.provider,
      roles: m.bindings.roles.map(r => r.roleId),
      enabled: pluginStore.getState().getPlugin(toolId)?.enabled ?? true,
    };
    this._editingTool = toolId;
    this._formMode = 'edit';
  }

  private _openDeleteConfirm(toolId: string) {
    this._editingTool = toolId;
    this._formMode = 'delete';
  }

  private _closeModal() {
    this._formMode = 'closed';
    this._editingTool = null;
    this._form = { ...EMPTY_FORM };
  }

  private _savePlugin() {
    const f = this._form;
    if (!f.name.trim()) { this._showToast('名称不能为空', 'error'); return; }

    if (this._formMode === 'add') {
      // 检查 ID 重复
      if (pluginStore.getState().getManifest(f.id)) {
        this._showToast(`ID "${f.id}" 已存在`, 'error'); return;
      }
      const manifest: ToolPluginManifest = {
        meta: {
          id: f.id, name: f.name, uri: f.uri || `/tool/${f.id}`,
          icon: f.icon, version: '1.0.0', category: f.category,
          provider: f.provider, description: f.description,
          enabled: f.enabled, createdAt: Date.now(), updatedAt: Date.now(),
        },
        ui: { panelMode: 'slide', form: [], result: { type: 'table', columns: [] } },
        api: { endpoint: `/api/v1/${f.id}`, method: 'POST', adapter: 'default', auth: { type: 'none' }, timeout: 10000 },
        schema: { input: { type: 'object', properties: {} }, output: { type: 'object', properties: {} } },
        bindings: { roles: f.roles.map((r, i) => ({ roleId: r as any, priority: i + 1, group: 'secondary' })) },
      };
      pluginStore.getState().register(manifest);
      this._showToast(`已新增: ${f.name}`, 'success');
    } else if (this._formMode === 'edit' && this._editingTool) {
      pluginStore.getState().updateManifest(this._editingTool, {
        name: f.name, uri: f.uri, icon: f.icon,
        description: f.description, category: f.category, provider: f.provider,
      });
      // 更新角色绑定
      const m = pluginStore.getState().getManifest(this._editingTool);
      if (m) {
        const updatedManifest: ToolPluginManifest = {
          ...m,
          bindings: {
            ...m.bindings,
            roles: f.roles.map((r, i) => ({ roleId: r as any, priority: i + 1, group: (i === 0 ? 'core' : 'secondary') as any })),
          },
        };
        pluginStore.getState().register(updatedManifest); // 覆盖注册
      }
      pluginStore.getState().setEnabled(this._editingTool, f.enabled);
      this._showToast(`已更新: ${f.name}`, 'success');
    }
    this._closeModal();
  }

  private _deletePlugin() {
    if (this._editingTool) {
      const name = pluginStore.getState().getManifest(this._editingTool)?.meta.name || this._editingTool;
      pluginStore.getState().unregister(this._editingTool);
      this._showToast(`已删除: ${name}`, 'success');
    }
    this._closeModal();
  }

  private _navigateToUri(uri: string) {
    window.location.hash = uri.startsWith('/') ? `#${uri}` : `#/tool/${uri}`;
  }

  private _handleImport() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json,.yaml,.yml';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        let manifest: unknown;
        if (file.name.endsWith('.json')) manifest = JSON.parse(text);
        else manifest = yaml.load(text);
        const errors = validateManifest(manifest as Partial<ToolPluginManifest>);
        const critical = errors.filter(e => e.severity === 'error');
        if (critical.length > 0) {
          this._showToast(`校验失败: ${critical[0].message}`, 'error');
        } else {
          pluginStore.getState().register(manifest as ToolPluginManifest);
          this._showToast(`已导入: ${(manifest as ToolPluginManifest).meta.name}`, 'success');
        }
      } catch (e) {
        this._showToast(`导入失败: ${e}`, 'error');
      }
    };
    input.click();
  }

  // ─── Render ───

  render() {
    const tools = this._getFilteredTools();
    const allTools = this._getAllTools();
    const enabled = allTools.filter(t => t.enabled).length;
    const categories = [...new Set(allTools.map(t => t.manifest.meta.category))];
    const bs = getBackendState();

    return html`
      <!-- Header -->
      <div class="market-header">
        <div>
          <div class="market-title">🧩 安全工具市场</div>
          <div class="market-subtitle">SecuClaw 安全工具统一接入平台 · 插件管理</div>
        </div>
        <div class="header-actions">
          <button class="btn" @click=${this._handleImport}>📥 导入</button>
          <button class="btn btn-primary" @click=${this._openAddForm}>＋ 新增插件</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-bar">
        <div class="stat"><span class="stat-num">${allTools.length}</span><span class="stat-label">已注册</span></div>
        <div class="stat"><span class="stat-num">${enabled}</span><span class="stat-label">已启用</span></div>
        <div class="stat"><span class="stat-num">${categories.length}</span><span class="stat-label">分类</span></div>
        <div class="stat"><span class="stat-num">${allTools.filter(t => t.manifest.meta.provider === 'built-in').length}</span><span class="stat-label">内置</span></div>
        <div class="stat"><span class="stat-num">${allTools.filter(t => t.manifest.meta.provider !== 'built-in').length}</span><span class="stat-label">第三方/自定义</span></div>
        <div class="stat" style="margin-left:auto">
          <span class="backend-dot ${bs}"></span>
          <span style="font-size:10px;color:#64748b">${bs === 'available' ? '后端已连接' : bs === 'unavailable' ? 'Mock 模式' : '检测中...'}</span>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="search-wrap">
          <input class="search-input" placeholder="搜索工具名称、描述或ID..."
            .value=${this._search} @input=${(e: Event) => { this._search = (e.target as HTMLInputElement).value; }} />
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button class="cat-chip ${this._categoryFilter === 'all' ? 'active' : ''}"
            @click=${() => { this._categoryFilter = 'all'; }}>全部</button>
          ${categories.map(cat => html`
            <button class="cat-chip ${this._categoryFilter === cat ? 'active' : ''}"
              @click=${() => { this._categoryFilter = cat as ToolCategory; }}>
              ${CATEGORY_ICONS[cat] ?? '🔧'} ${CATEGORY_LABELS[cat] ?? cat}
            </button>
          `)}
        </div>
      </div>

      <!-- Plugin Table -->
      ${tools.length === 0
        ? html`<div class="empty"><div class="empty-icon">🔍</div><div>无匹配工具</div></div>`
        : html`
        <div class="table-scroll">
          <table class="plugin-table">
            <thead>
              <tr>
                <th style="width:160px">名称</th>
                <th style="width:110px">URI</th>
                <th style="width:120px">归属角色</th>
                <th>说明</th>
                <th style="width:80px">分类</th>
                <th style="width:55px">来源</th>
                <th style="width:130px">操作</th>
              </tr>
            </thead>
            <tbody>
              ${tools.map(({ manifest, enabled: isEn }) => {
                const m = manifest;
                return html`
              <tr class=${isEn ? '' : 'disabled'}>
                <td>
                  <div class="td-name">
                    <span class="td-icon">${m.meta.icon}</span>
                    <span class="td-name-text">${m.meta.name}</span>
                  </div>
                </td>
                <td>
                  <span class="td-uri" @click=${() => this._navigateToUri(m.meta.uri || `/tool/${m.meta.id}`)}
                    title="点击跳转到工具页面">${m.meta.uri || `/tool/${m.meta.id}`}</span>
                </td>
                <td>
                  <div class="role-tags">
                    ${m.bindings.roles.map(r => html`
                      <span class="role-tag">${ROLE_LABELS[r.roleId] || r.roleId}</span>
                    `)}
                    ${m.bindings.roles.length === 0 ? html`<span class="role-tag" style="color:#475569">未分配</span>` : nothing}
                  </div>
                </td>
                <td style="color:#94a3b8;font-size:11px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                  title=${m.meta.description}>${m.meta.description}</td>
                <td><span class="cat-label">${CATEGORY_ICONS[m.meta.category] ?? ''} ${CATEGORY_LABELS[m.meta.category] ?? m.meta.category}</span></td>
                <td><span class="provider-badge ${m.meta.provider}">${m.meta.provider === 'built-in' ? '内置' : m.meta.provider === 'third-party' ? '第三方' : '自定义'}</span></td>
                <td>
                  <div class="action-group">
                    <button class="btn btn-sm" @click=${() => this._openEditForm(m.meta.id)}>✏️ 编辑</button>
                    <button class="btn btn-sm ${isEn ? 'btn-danger' : ''}"
                      @click=${() => this._toggleTool(m.meta.id, !isEn)}>
                      ${isEn ? '禁用' : '启用'}
                    </button>
                    <button class="btn btn-sm btn-danger" @click=${() => this._openDeleteConfirm(m.meta.id)}
                      ?disabled=${m.meta.provider === 'built-in'}
                      title=${m.meta.provider === 'built-in' ? '内置插件不可删除' : '删除插件'}>
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
              `;
            })}
            </tbody>
          </table>
        </div>
      `}

      <!-- Add / Edit Modal -->
      ${this._formMode === 'add' || this._formMode === 'edit' ? this._renderFormModal() : nothing}

      <!-- Delete Confirm Modal -->
      ${this._formMode === 'delete' ? this._renderDeleteModal() : nothing}

      <!-- Toast -->
      ${this._toast ? html`<div class="toast ${this._toast.type}">${this._toast.type === 'success' ? '✓' : '✕'} ${this._toast.text}</div>` : nothing}
    `;
  }

  // ─── Form Modal ───
  private _renderFormModal() {
    const isAdd = this._formMode === 'add';
    const f = this._form;
    const allRoles = Object.keys(ROLE_LABELS);
    const allCategories = Object.keys(CATEGORY_LABELS) as ToolCategory[];

    return html`
      <div class="modal-overlay" @click=${this._closeModal}>
        <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
          <div class="modal-header">
            <span class="modal-title">${isAdd ? '＋ 新增插件' : `✏️ 编辑插件`}</span>
            <button class="modal-close" @click=${this._closeModal}>✕</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">插件名称 *</label>
                <input class="form-input" placeholder="例如：威胁建模工具" .value=${f.name}
                  @input=${(e: Event) => { this._form = { ...f, name: (e.target as HTMLInputElement).value }; }} />
              </div>
              <div class="form-group">
                <label class="form-label">插件 ID</label>
                <input class="form-input" placeholder="auto-generated" .value=${f.id}
                  ?disabled=${!isAdd} style=${isAdd ? '' : 'opacity:0.5;cursor:not-allowed'}
                  @input=${(e: Event) => { if (isAdd) this._form = { ...f, id: (e.target as HTMLInputElement).value }; }} />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">URI 路径</label>
                <input class="form-input" placeholder="/tool/your-tool-id" .value=${f.uri}
                  @input=${(e: Event) => { this._form = { ...f, uri: (e.target as HTMLInputElement).value }; }} />
              </div>
              <div class="form-group">
                <label class="form-label">图标 (emoji)</label>
                <input class="form-input" placeholder="🔧" .value=${f.icon} style="width:60px"
                  @input=${(e: Event) => { this._form = { ...f, icon: (e.target as HTMLInputElement).value }; }} />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">插件说明</label>
              <textarea class="form-input" placeholder="简要描述工具功能和用途..."
                .value=${f.description}
                @input=${(e: Event) => { this._form = { ...f, description: (e.target as HTMLTextAreaElement).value }; }}></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">插件分类</label>
                <select class="form-input" .value=${f.category}
                  @change=${(e: Event) => { this._form = { ...f, category: (e.target as HTMLSelectElement).value as ToolCategory }; }}>
                  ${allCategories.map(c => html`
                    <option value=${c} ?selected=${f.category === c}>${CATEGORY_ICONS[c]} ${CATEGORY_LABELS[c]}</option>
                  `)}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">插件来源</label>
                <select class="form-input" .value=${f.provider}
                  @change=${(e: Event) => { this._form = { ...f, provider: (e.target as HTMLSelectElement).value as any }; }}>
                  <option value="built-in" ?selected=${f.provider === 'built-in'}>内置</option>
                  <option value="third-party" ?selected=${f.provider === 'third-party'}>第三方</option>
                  <option value="custom" ?selected=${f.provider === 'custom'}>自定义</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">插件归属安全角色（可多选）</label>
              <div class="checkbox-group">
                ${allRoles.map(role => {
                  const checked = f.roles.includes(role);
                  return html`
                    <div class="checkbox-item ${checked ? 'checked' : ''}"
                      @click=${(e: Event) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const roles = checked ? f.roles.filter(r => r !== role) : [...f.roles, role];
                        this._form = { ...f, roles };
                      }}>
                      ${checked ? '☑' : '☐'} ${ROLE_LABELS[role]}
                    </div>
                  `;
                })}
              </div>
            </div>

            ${!isAdd ? html`
              <div class="form-group">
                <label class="form-label">启用状态</label>
                <select class="form-input" .value=${f.enabled ? 'true' : 'false'}
                  @change=${(e: Event) => { this._form = { ...f, enabled: (e.target as HTMLSelectElement).value === 'true' }; }}>
                  <option value="true">启用</option>
                  <option value="false">禁用</option>
                </select>
              </div>
            ` : nothing}
          </div>
          <div class="modal-footer">
            <button class="btn" @click=${this._closeModal}>取消</button>
            <button class="btn btn-primary" @click=${this._savePlugin}>
              ${isAdd ? '新增' : '保存修改'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ─── Delete Confirm Modal ───
  private _renderDeleteModal() {
    const name = this._editingTool ? (pluginStore.getState().getManifest(this._editingTool)?.meta.name || this._editingTool) : '';

    return html`
      <div class="modal-overlay" @click=${this._closeModal}>
        <div class="modal" style="width:400px" @click=${(e: Event) => e.stopPropagation()}>
          <div class="modal-header">
            <span class="modal-title">🗑️ 确认删除</span>
            <button class="modal-close" @click=${this._closeModal}>✕</button>
          </div>
          <div class="modal-body">
            <div class="confirm-text">
              确定要删除插件 <span class="confirm-name">${name}</span> 吗？<br/>
              此操作不可撤销。
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" @click=${this._closeModal}>取消</button>
            <button class="btn btn-danger" @click=${this._deletePlugin}>确认删除</button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'sc-plugin-market': ScPluginMarket; } }

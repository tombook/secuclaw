/**
 * sc-settings-panel — 系统配置管理面板
 * 三大配置区：AI 后端 / 角色能力 / 全局设置
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import type { RoleId } from '../config/role-tool-config';
import { ALL_ROLE_IDS, ROLE_TOOL_CONFIGS } from '../config/role-tool-config';
import { ROLE_THEMES } from '../config/role-theme-config';
import {
  settingsStore,
  type AiBackendConfig,
  type RoleSkillConfig,
  type GlobalSettings,
} from '../stores/settings-store';

@customElement('sc-settings-panel')
export class ScSettingsPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 9000;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      animation: fadeIn 0.15s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .panel {
      position: absolute;
      top: 0; right: 0;
      width: 620px;
      height: 100vh;
      background: #0d1320;
      border-left: 1px solid #1e293b;
      display: flex;
      flex-direction: column;
      animation: slideIn 0.2s ease;
    }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

    /* Header */
    .panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid #1e293b;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .panel-header h2 {
      font-size: 15px;
      font-weight: 700;
      color: #e2e8f0;
      margin: 0;
      flex: 1;
    }
    .panel-header .status {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 600;
    }
    .status.connected { background: #22c55e20; color: #22c55e; }
    .status.failed { background: #ef444420; color: #ef4444; }
    .status.testing { background: #3b82f620; color: #3b82f6; }
    .status.unknown { background: #47556920; color: #94a3b8; }

    /* Tabs */
    .tabs {
      display: flex;
      border-bottom: 1px solid #1e293b;
      flex-shrink: 0;
    }
    .tab {
      flex: 1;
      padding: 10px 0;
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.15s;
    }
    .tab:hover { color: #94a3b8; background: #1e293b10; }
    .tab.active { color: #fbbf24; border-bottom-color: #fbbf24; }

    /* Body */
    .panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px;
    }
    .panel-body::-webkit-scrollbar { width: 4px; }
    .panel-body::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }

    /* Footer */
    .panel-footer {
      padding: 12px 20px;
      border-top: 1px solid #1e293b;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      flex-shrink: 0;
    }

    /* Form elements */
    .form-group {
      margin-bottom: 16px;
    }
    .form-group label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .form-group .hint {
      font-size: 10px;
      color: #475569;
      margin-top: 2px;
    }
    input[type="text"], input[type="password"], input[type="number"], select, textarea {
      width: 100%;
      padding: 8px 10px;
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 4px;
      color: #e2e8f0;
      font-size: 12px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s;
    }
    input:focus, select:focus, textarea:focus {
      border-color: #3b82f6;
    }
    textarea { resize: vertical; min-height: 60px; }
    select { cursor: pointer; }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    /* Buttons */
    .btn {
      padding: 6px 14px;
      border: 1px solid #1e293b;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      background: transparent;
      color: #94a3b8;
    }
    .btn:hover { background: #1e293b; color: #e2e8f0; }
    .btn-primary { background: #3b82f6; border-color: #3b82f6; color: white; }
    .btn-primary:hover { background: #2563eb; }
    .btn-success { background: #22c55e20; border-color: #22c55e40; color: #22c55e; }
    .btn-success:hover { background: #22c55e30; }
    .btn-danger { background: #ef444420; border-color: #ef444440; color: #ef4444; }
    .btn-danger:hover { background: #ef444430; }
    .btn-warning { background: #f59e0b20; border-color: #f59e0b40; color: #f59e0b; }
    .btn-warning:hover { background: #f59e0b30; }

    /* Toggle switch */
    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0;
    }
    .toggle-row .label { font-size: 12px; color: #cbd5e1; }
    .toggle {
      width: 36px; height: 20px;
      background: #1e293b;
      border-radius: 10px;
      position: relative;
      cursor: pointer;
      transition: background 0.2s;
    }
    .toggle.on { background: #3b82f6; }
    .toggle::after {
      content: '';
      position: absolute;
      top: 2px; left: 2px;
      width: 16px; height: 16px;
      background: white;
      border-radius: 50%;
      transition: transform 0.2s;
    }
    .toggle.on::after { transform: translateX(16px); }

    /* Tags */
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .tag {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      background: #1e293b;
      color: #94a3b8;
    }
    .tag.light { background: #22c55e15; color: #4ade80; }
    .tag.dark { background: #ef444415; color: #f87171; }
    .tag.mitre { background: #3b82f615; color: #60a5fa; }
    .tag.scf { background: #f59e0b15; color: #fbbf24; }

    /* Role card */
    .role-card {
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 6px;
      margin-bottom: 10px;
      overflow: hidden;
    }
    .role-card-header {
      display: flex;
      align-items: center;
      padding: 10px 14px;
      gap: 8px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .role-card-header:hover { background: #1e293b15; }
    .role-card-header .emoji { font-size: 16px; }
    .role-card-header .name { font-size: 12px; font-weight: 600; color: #e2e8f0; flex: 1; }
    .role-card-header .combo { font-size: 9px; color: #64748b; background: #1e293b; padding: 1px 5px; border-radius: 3px; }
    .role-card-header .arrow { color: #475569; font-size: 10px; transition: transform 0.2s; }
    .role-card-header .arrow.open { transform: rotate(180deg); }
    .role-card-body {
      padding: 0 14px 14px;
      display: none;
    }
    .role-card.open .role-card-body { display: block; }

    /* Section */
    .section-title {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 16px 0 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #1e293b;
    }

    /* Connection result */
    .conn-result {
      margin-top: 8px;
      padding: 8px 10px;
      border-radius: 4px;
      font-size: 11px;
      display: none;
    }
    .conn-result.show { display: block; }
    .conn-result.ok { background: #22c55e10; color: #4ade80; border: 1px solid #22c55e30; }
    .conn-result.fail { background: #ef444410; color: #f87171; border: 1px solid #ef444430; }

    /* Dirty indicator */
    .dirty-dot {
      width: 6px; height: 6px;
      background: #f59e0b;
      border-radius: 50%;
      display: none;
    }
    .dirty-dot.show { display: inline-block; }
  `;

  @state() private _activeTab: 'ai' | 'roles' | 'global' = 'ai';
  @state() private _expandedRole: RoleId | null = null;
  @state() private _dirty = false;
  @state() private _connResult: { ok: boolean; msg: string } | null = null;
  @state() private _apiKeyVisible = false;
  @state() private _saveMsg = '';

  private _closeBtnRef = createRef<HTMLButtonElement>();

  connectedCallback() {
    super.connectedCallback();
    this._dirty = settingsStore.getState().dirty;
    this._unsubscribe = settingsStore.subscribe(() => {
      const s = settingsStore.getState();
      this._dirty = s.dirty;
      this._activeTab = s.activeTab;
      this.requestUpdate();
    });
  }

  private _unsubscribe: (() => void) | null = null;
  disconnectedCallback() {
    this._unsubscribe?.();
    super.disconnectedCallback();
  }

  private _s() { return settingsStore.getState(); }

  // ─── Close ────────────────────────────────────────

  private _close() {
    this.dispatchEvent(new CustomEvent('settings-closed', { bubbles: true, composed: true }));
  }

  // ─── Tab rendering ────────────────────────────────

  render() {
    const s = this._s();
    return html`
      <div class="panel" @click=${(e: Event) => e.stopPropagation()}>
        <div class="panel-header">
          <h2>⚙ 系统配置</h2>
          <span class="dirty-dot ?show=${this._dirty}"></span>
          <span class="status ${s.ai.connectionStatus}">
            ${s.ai.connectionStatus === 'connected' ? '已连接' : s.ai.connectionStatus === 'failed' ? '连接失败' : s.ai.connectionStatus === 'testing' ? '测试中...' : '未测试'}
          </span>
          <button class="btn" @click=${this._close}>✕</button>
        </div>

        <div class="tabs">
          <div class="tab ${this._activeTab === 'ai' ? 'active' : ''}" @click=${() => settingsStore.getState().setActiveTab('ai')}>🤖 AI 后端</div>
          <div class="tab ${this._activeTab === 'roles' ? 'active' : ''}" @click=${() => settingsStore.getState().setActiveTab('roles')}>🛡 角色能力</div>
          <div class="tab ${this._activeTab === 'global' ? 'active' : ''}" @click=${() => settingsStore.getState().setActiveTab('global')}>📋 全局设置</div>
        </div>

        <div class="panel-body">
          ${this._activeTab === 'ai' ? this._renderAiTab() : ''}
          ${this._activeTab === 'roles' ? this._renderRolesTab() : ''}
          ${this._activeTab === 'global' ? this._renderGlobalTab() : ''}
        </div>

        <div class="panel-footer">
          <button class="btn btn-danger" @click=${() => { settingsStore.getState().resetToDefaults(); }}>重置默认</button>
          <button class="btn" @click=${this._exportConfig}>导出配置</button>
          <button class="btn btn-primary" @click=${this._save}>保存</button>
          ${this._saveMsg ? html`<span style="font-size:11px;color:#22c55e;margin-left:4px">${this._saveMsg}</span>` : ''}
        </div>
      </div>
    `;
  }

  // ─── AI Backend Tab ───────────────────────────────

  private _renderAiTab() {
    const ai = this._s().ai;
    return html`
      <div class="section-title">API 连接配置</div>

      <div class="form-group">
        <label>API 地址</label>
        <input type="text" .value=${ai.apiUrl} @input=${(e: Event) => settingsStore.getState().setAiConfig({ apiUrl: (e.target as HTMLInputElement).value })} />
        <div class="hint">OpenAI 兼容的 Chat Completions API 端点</div>
      </div>

      <div class="form-group">
        <label>API Key</label>
        <div style="display:flex;gap:6px">
          <input type="${this._apiKeyVisible ? 'text' : 'password'}" 
            .value=${ai.apiKey} 
            style="flex:1" 
            @input=${(e: Event) => settingsStore.getState().setAiConfig({ apiKey: (e.target as HTMLInputElement).value })} 
          />
          <button class="btn" @click=${() => { this._apiKeyVisible = !this._apiKeyVisible; }}>${this._apiKeyVisible ? '🔒' : '👁'}</button>
        </div>
        <div class="hint">${ai.apiKey ? `当前: ${ai.apiKey.substring(0, 4)}${'*'.repeat(12)}` : '未配置'}</div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>模型</label>
          <input type="text" .value=${ai.model} @input=${(e: Event) => settingsStore.getState().setAiConfig({ model: (e.target as HTMLInputElement).value })} />
        </div>
        <div class="form-group">
          <label>Max Tokens</label>
          <input type="number" .value=${String(ai.maxTokens)} @input=${(e: Event) => settingsStore.getState().setAiConfig({ maxTokens: Number((e.target as HTMLInputElement).value) || 2048 })} />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Temperature</label>
          <input type="number" min="0" max="2" step="0.1" .value=${String(ai.temperature)} @input=${(e: Event) => settingsStore.getState().setAiConfig({ temperature: Number((e.target as HTMLInputElement).value) || 0.7 })} />
        </div>
        <div class="form-group">
          <label>超时(ms)</label>
          <input type="number" .value=${String(ai.timeout)} @input=${(e: Event) => settingsStore.getState().setAiConfig({ timeout: Number((e.target as HTMLInputElement).value) || 30000 })} />
        </div>
      </div>

      <div class="toggle-row">
        <span class="label">启用 AI 分析</span>
        <div class="toggle ${ai.enabled ? 'on' : ''}" @click=${() => settingsStore.getState().setAiConfig({ enabled: !ai.enabled })}></div>
      </div>

      <div style="margin-top:12px;display:flex;gap:8px;align-items:center">
        <button class="btn btn-success" @click=${this._testConnection}>🔗 测试连接</button>
        ${ai.lastTestedAt ? html`<span style="font-size:10px;color:#475569">上次测试: ${new Date(ai.lastTestedAt).toLocaleTimeString('zh-CN')}</span>` : ''}
      </div>

      <div class="conn-result ${this._connResult ? 'show' : ''} ${this._connResult?.ok ? 'ok' : 'fail'}">
        ${this._connResult?.msg ?? ''}
      </div>

      ${ai.lastErrorMessage ? html`
        <div style="margin-top:8px;padding:6px 10px;background:#ef444410;border-radius:4px;font-size:11px;color:#f87171">
          ${ai.lastErrorMessage}
        </div>
      ` : ''}
    `;
  }

  // ─── Roles Tab ────────────────────────────────────

  private _renderRolesTab() {
    const roles = this._s().roles;
    return html`
      <div style="margin-bottom:12px;font-size:11px;color:#64748b">
        配置每个安全角色的能力参数。展开角色卡片查看详细设置。
      </div>
      ${ALL_ROLE_IDS.map((roleId) => this._renderRoleCard(roleId, roles[roleId]))}
    `;
  }

  private _renderRoleCard(roleId: RoleId, config: RoleSkillConfig) {
    const theme = ROLE_THEMES[roleId];
    const toolConfig = ROLE_TOOL_CONFIGS[roleId];
    const isOpen = this._expandedRole === roleId;
    const comboMap: Record<string, string> = {
      'ciso': 'SEC+LEG+IT',
      'secuclaw-commander': 'SEC+LEG+IT+BIZ',
      'privacy-officer': 'SEC+LEG',
      'business-security-officer': 'SEC+BIZ',
      'security-ops': 'SEC+IT+BIZ',
      'security-expert': 'SEC',
      'security-architect': 'SEC+IT',
      'supply-chain-security': 'SEC+LEG+BIZ',
    };

    return html`
      <div class="role-card ${isOpen ? 'open' : ''}">
        <div class="role-card-header" @click=${() => { this._expandedRole = isOpen ? null : roleId; }}>
          <span class="emoji">${toolConfig.icon}</span>
          <span class="name" style="color:${theme.primary}">${toolConfig.label}</span>
          <span class="combo">${comboMap[roleId] ?? ''}</span>
          <span class="arrow ${isOpen ? 'open' : ''}">▼</span>
        </div>
        <div class="role-card-body">
          ${this._toggleRow('启用角色', config.enabled, (v) => settingsStore.getState().setRoleConfig(roleId, { enabled: v }))}

          <div class="section-title">光明面能力 (${config.lightCapabilities.length})</div>
          <div class="tags">
            ${config.lightCapabilities.map((c) => html`<span class="tag light">${c}</span>`)}
          </div>

          <div class="section-title">黑暗面能力 (${config.darkCapabilities.length})</div>
          <div class="tags">
            ${config.darkCapabilities.map((c) => html`<span class="tag dark">${c}</span>`)}
          </div>

          <div class="section-title">MITRE ATT&CK 覆盖</div>
          <div class="tags">
            ${config.mitreCoverage.map((t) => html`<span class="tag mitre">${t}</span>`)}
          </div>

          <div class="section-title">SCF 控制域覆盖</div>
          <div class="tags">
            ${config.scfCoverage.map((d) => html`<span class="tag scf">${d}</span>`)}
          </div>

          <div class="form-row" style="margin-top:12px">
            <div class="form-group">
              <label>风险容忍度</label>
              <select .value=${config.riskTolerance} @change=${(e: Event) => settingsStore.getState().setRoleConfig(roleId, { riskTolerance: (e.target as HTMLSelectElement).value as any })}>
                <option value="conservative" ?selected=${config.riskTolerance === 'conservative'}>保守</option>
                <option value="moderate" ?selected=${config.riskTolerance === 'moderate'}>适中</option>
                <option value="aggressive" ?selected=${config.riskTolerance === 'aggressive'}>激进</option>
              </select>
            </div>
            <div class="form-group">
              <label>分析深度</label>
              <select .value=${config.analysisDepth} @change=${(e: Event) => settingsStore.getState().setRoleConfig(roleId, { analysisDepth: (e.target as HTMLSelectElement).value as any })}>
                <option value="brief" ?selected=${config.analysisDepth === 'brief'}>简要</option>
                <option value="standard" ?selected=${config.analysisDepth === 'standard'}>标准</option>
                <option value="thorough" ?selected=${config.analysisDepth === 'thorough'}>深度</option>
              </select>
            </div>
          </div>

          <div class="form-group" style="margin-top:8px">
            <label>自定义 System Prompt</label>
            <textarea 
              .value=${config.customSystemPrompt} 
              placeholder="输入额外的角色定制提示词..." 
              @input=${(e: Event) => settingsStore.getState().setRoleConfig(roleId, { customSystemPrompt: (e.target as HTMLTextAreaElement).value })}
            ></textarea>
            <div class="hint">追加到角色默认 prompt 后面，用于定制分析风格</div>
          </div>
        </div>
      </div>
    `;
  }

  // ─── Global Tab ───────────────────────────────────

  private _renderGlobalTab() {
    const g = this._s().global;
    return html`
      <div class="section-title">显示选项</div>
      ${this._toggleRow('显示 AI 分析块', g.showAiAnalysis, (v) => settingsStore.getState().setGlobalSettings({ showAiAnalysis: v }))}
      ${this._toggleRow('显示向上汇报摘要', g.showBoardSummary, (v) => settingsStore.getState().setGlobalSettings({ showBoardSummary: v }))}
      ${this._toggleRow('显示黑暗面能力', g.showDarkCapabilities, (v) => settingsStore.getState().setGlobalSettings({ showDarkCapabilities: v }))}
      ${this._toggleRow('显示指标看板', g.enableMetrics, (v) => settingsStore.getState().setGlobalSettings({ enableMetrics: v }))}

      <div class="section-title">面板与交互</div>
      <div class="form-group">
        <label>工具面板模式</label>
        <select .value=${g.panelMode} @change=${(e: Event) => settingsStore.getState().setGlobalSettings({ panelMode: (e.target as HTMLSelectElement).value as any })}>
          <option value="slide" ?selected=${g.panelMode === 'slide'}>侧滑面板</option>
          <option value="modal" ?selected=${g.panelMode === 'modal'}>居中弹窗</option>
          <option value="fullscreen" ?selected=${g.panelMode === 'fullscreen'}>全屏</option>
        </select>
      </div>
      <div class="form-group">
        <label>默认角色</label>
        <select .value=${g.defaultRole} @change=${(e: Event) => settingsStore.getState().setGlobalSettings({ defaultRole: (e.target as HTMLSelectElement).value as RoleId })}>
          ${ALL_ROLE_IDS.map((rid) => html`<option value=${rid} ?selected=${g.defaultRole === rid}>${ROLE_TOOL_CONFIGS[rid].label}</option>`)}
        </select>
      </div>

      <div class="section-title">数据管理</div>
      ${this._toggleRow('自动保存配置', g.autoSave, (v) => settingsStore.getState().setGlobalSettings({ autoSave: v }))}
      <div class="form-row">
        <div class="form-group">
          <label>自动保存间隔(秒)</label>
          <input type="number" min="5" max="300" .value=${String(g.autoSaveInterval)} @input=${(e: Event) => settingsStore.getState().setGlobalSettings({ autoSaveInterval: Number((e.target as HTMLInputElement).value) || 30 })} />
        </div>
        <div class="form-group">
          <label>数据保留天数</label>
          <input type="number" min="1" max="365" .value=${String(g.dataRetentionDays)} @input=${(e: Event) => settingsStore.getState().setGlobalSettings({ dataRetentionDays: Number((e.target as HTMLInputElement).value) || 90 })} />
        </div>
      </div>

      <div class="section-title">数据源路径</div>
      <div class="form-group">
        <label>SCF 数据路径</label>
        <input type="text" .value=${g.scfDataPath} placeholder="packages/core/data/scf" @input=${(e: Event) => settingsStore.getState().setGlobalSettings({ scfDataPath: (e.target as HTMLInputElement).value })} />
      </div>
      <div class="form-group">
        <label>MITRE ATT&CK 数据路径</label>
        <input type="text" .value=${g.mitreDataPath} placeholder="packages/core/data/mitre/attack-stix-data" @input=${(e: Event) => settingsStore.getState().setGlobalSettings({ mitreDataPath: (e.target as HTMLInputElement).value })} />
      </div>

      <div style="margin-top:20px;padding:10px;background:#1e293b20;border-radius:4px;font-size:10px;color:#475569">
        💾 配置保存到浏览器 localStorage。点击"导出配置"可下载 JSON 备份。
      </div>
    `;
  }

  // ─── Helpers ──────────────────────────────────────

  private _toggleRow(label: string, value: boolean, onChange: (v: boolean) => void) {
    return html`
      <div class="toggle-row">
        <span class="label">${label}</span>
        <div class="toggle ${value ? 'on' : ''}" @click=${() => onChange(!value)}></div>
      </div>
    `;
  }

  private async _testConnection() {
    const ok = await settingsStore.getState().testConnection();
    const ai = settingsStore.getState().ai;
    this._connResult = {
      ok,
      msg: ok ? `✅ 连接成功！模型: ${ai.model}` : `❌ 连接失败: ${ai.lastErrorMessage}`,
    };
    this.requestUpdate();
  }

  private _save() {
    settingsStore.getState().save();
    this._saveMsg = '✅ 已保存';
    this.requestUpdate();
    setTimeout(() => { this._saveMsg = ''; this.requestUpdate(); }, 2000);
  }

  private _exportConfig() {
    const json = settingsStore.getState().exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'secuclaw-settings.json'; a.click();
    URL.revokeObjectURL(url);
  }
}

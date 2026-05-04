/**
 * sc-app-shell — PC 桌面应用壳
 * 左侧固定侧边栏：品牌 → 安全总览 → RACI 任务(共用) → 角色指挥台列表
 * 顶部状态栏 + 主内容区
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { RoleId } from '../config/role-tool-config';
import { ROLE_TOOL_CONFIGS, ALL_ROLE_IDS } from '../config/role-tool-config';
import { getShortcutLabel } from '../services/keyboard-shortcuts';
import { ROLE_THEMES, applyTheme } from '../config/role-theme-config';
import '../components/sc-settings-panel';
import '../components/tool-panels/sc-tool-panel';
import '../components/role-commander/sc-role-commander';
import '../components/role-commander/sc-role-commander';
import { settingsStore } from '../stores/settings-store';
import { pluginStore } from '../plugins/index';
import '../components/sc-command-palette';
import '../components/tool-panels/panels/evolution-dashboard';
import type { CommandAction } from '../components/sc-command-palette';

@customElement('sc-app-shell')
export class ScAppShell extends LitElement {
  static styles = css`
    :host {
      display: grid;
      grid-template-columns: 240px 1fr;
      grid-template-rows: 44px 1fr;
      grid-template-areas:
        "sidebar header"
        "sidebar main";
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      background: #0a0f1a;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
    }

    /* ─── Sidebar ─────────────────────────────────── */
    .sidebar {
      grid-area: sidebar;
      background: #0d1320;
      border-right: 1px solid #1e293b;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Brand */
    .sidebar-brand {
      padding: 0 14px;
      height: 44px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid #1e293b;
      flex-shrink: 0;
    }

    .sidebar-brand .logo {
      font-size: 16px;
      font-weight: 900;
      color: #fbbf24;
      letter-spacing: -0.02em;
    }

    .sidebar-brand .version {
      font-size: 9px;
      color: #475569;
      background: #1e293b;
      padding: 1px 5px;
      border-radius: 3px;
      margin-left: auto;
    }

    /* Sidebar scroll area */
    .sidebar-scroll {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .sidebar-scroll::-webkit-scrollbar { width: 3px; }
    .sidebar-scroll::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }

    /* Section labels */
    .section-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #475569;
      padding: 12px 14px 4px;
      flex-shrink: 0;
    }

    /* Overview nav */
    .nav-overview {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 14px;
      cursor: pointer;
      font-size: 12px;
      color: #94a3b8;
      transition: all 100ms ease;
      flex-shrink: 0;
    }

    .nav-overview:hover { background: #131d2e; color: #e2e8f0; }
    .nav-overview.active { background: #1a2744; color: #fbbf24; font-weight: 600; }
    .nav-overview .icon { font-size: 14px; width: 18px; text-align: center; }

    /* RACI Section */
    .raci-section {
      border-top: 1px solid #1e293b;
      border-bottom: 1px solid #1e293b;
      padding: 8px 10px;
      flex-shrink: 0;
      background: #0a0f1a;
    }

    .raci-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      margin-bottom: 6px;
    }

    .raci-chip {
      text-align: center;
      padding: 4px 0;
      border-radius: 4px;
      cursor: pointer;
      transition: all 100ms ease;
      border: 1px solid transparent;
    }

    .raci-chip:hover { border-color: #334155; }
    .raci-chip.active { border-color: var(--chip-color); }

    .raci-chip .type {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.05em;
    }

    .raci-chip .count {
      font-size: 16px;
      font-weight: 800;
      line-height: 1.2;
    }

    .raci-chip .lbl {
      font-size: 8px;
      color: #64748b;
    }

    .raci-tasks {
      max-height: 0;
      overflow: hidden;
      transition: max-height 200ms ease;
    }

    .raci-tasks.open {
      max-height: 300px;
      overflow-y: auto;
    }

    .raci-tasks::-webkit-scrollbar { width: 3px; }
    .raci-tasks::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }

    .raci-task-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 6px;
      font-size: 11px;
      color: #94a3b8;
      border-radius: 3px;
      cursor: pointer;
      margin-bottom: 1px;
    }

    .raci-task-item:hover { background: #1e293b; }

    .raci-task-item .dot {
      width: 4px;
      height: 4px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .raci-task-item .task-title {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }

    .raci-task-item .task-role {
      font-size: 8px;
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 2px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .raci-task-item .task-time {
      font-size: 9px;
      color: #475569;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .raci-task-item.is-history {
      opacity: 0.6;
    }

    .raci-task-item.is-new {
      background: #22c55e08;
      border-left: 2px solid #22c55e;
      padding-left: 4px;
    }

    .raci-task-item.is-active {
      background: #3b82f608;
      border-left: 2px solid #3b82f6;
      padding-left: 4px;
    }

    .raci-task-item.is-done {
      opacity: 0.5;
      text-decoration: line-through;
      text-decoration-color: #334155;
    }

    .raci-task-item.is-rejected {
      opacity: 0.5;
      border-left: 2px solid #ef4444;
      padding-left: 4px;
    }

    .raci-task-item .new-badge {
      font-size: 7px;
      font-weight: 800;
      color: #22c55e;
      letter-spacing: 0.05em;
      flex-shrink: 0;
    }

    .raci-task-item .prio-badge {
      font-size: 8px;
      font-weight: 700;
      padding: 0px 3px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .prio-badge[data-prio="P1"] { background: #ef444433; color: #ef4444; }
    .prio-badge[data-prio="P2"] { background: #f59e0b33; color: #f59e0b; }
    .prio-badge[data-prio="P3"] { background: #3b82f633; color: #3b82f6; }
    .prio-badge[data-prio="P4"] { background: #6b728033; color: #6b7280; }

    .raci-task-item .status-badge {
      font-size: 8px;
      font-weight: 600;
      padding: 1px 4px;
      border-radius: 2px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .raci-task-item .task-from {
      font-size: 8px;
      color: #64748b;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .task-actions {
      display: flex;
      gap: 4px;
      padding: 0 6px 4px 18px;
    }

    .task-actions .ci-btn {
      font-size: 9px;
      padding: 2px 8px;
      border-radius: 2px;
      border: 1px solid #334155;
      background: transparent;
      color: #94a3b8;
      cursor: pointer;
    }

    .task-actions .ci-btn:hover { background: #1e293b; color: #e2e8f0; }
    .task-actions .ci-btn.primary { border-color: #3b82f6; color: #3b82f6; }

    /* Create task */
    .raci-create-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .raci-create-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 3px;
      border: 1px dashed #334155;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      transition: all 120ms;
    }

    .raci-create-btn:hover { border-color: #3b82f6; color: #3b82f6; background: #3b82f611; }

    .create-form {
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 4px;
      padding: 8px;
      margin-bottom: 6px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .create-form input[type="text"] {
      width: 100%;
      background: #0a0f1a;
      border: 1px solid #1e293b;
      border-radius: 3px;
      padding: 5px 8px;
      font-size: 11px;
      color: #e2e8f0;
      outline: none;
      box-sizing: border-box;
    }

    .create-form input:focus { border-color: #3b82f6; }

    .create-form select {
      width: 100%;
      background: #0a0f1a;
      border: 1px solid #1e293b;
      border-radius: 3px;
      padding: 4px 6px;
      font-size: 10px;
      color: #94a3b8;
      outline: none;
      cursor: pointer;
    }

    .create-form select:focus { border-color: #3b82f6; }

    .cf-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
    }

    .cf-label {
      font-size: 9px;
      color: #475569;
      margin-bottom: 2px;
    }

    .cf-actions {
      display: flex;
      gap: 4px;
      justify-content: flex-end;
    }

    .cf-btn {
      font-size: 10px;
      padding: 4px 12px;
      border-radius: 3px;
      border: none;
      cursor: pointer;
      font-weight: 600;
    }

    .cf-btn.cancel { background: #1e293b; color: #64748b; }
    .cf-btn.cancel:hover { color: #94a3b8; }
    .cf-btn.submit { background: #3b82f6; color: white; }
    .cf-btn.submit:hover { background: #2563eb; }
    .cf-btn.submit:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Role nav */
    .nav-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      cursor: pointer;
      font-size: 12px;
      color: #94a3b8;
      transition: all 100ms ease;
      position: relative;
    }

    .nav-item:hover { background: #131d2e; color: #e2e8f0; }

    .nav-item.active {
      background: var(--active-bg, #1e3a5f);
      color: var(--active-color, #60a5fa);
      font-weight: 600;
    }

    .nav-item .color-dot {
      width: 6px;
      height: 6px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .nav-item .nav-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .nav-item .nav-shortcut {
      font-size: 9px;
      color: #334155;
      font-family: monospace;
    }

    .nav-item .status-dot {
      width: 5px;
      height: 5px;
      border-radius: 3px;
      position: absolute;
      right: 10px;
    }

    .status-dot.normal { background: #22c55e; }
    .status-dot.warning { background: #f59e0b; }
    .status-dot.danger { background: #ef4444; }

    .nav-sep {
      display: flex;
      align-items: center;
      padding: 6px 14px 2px 14px;
      gap: 6px;
    }

    .nav-sep .sep-line {
      flex: 1;
      height: 1px;
      background: #2d3a4f;
    }

    .nav-sep .sep-label {
      font-size: 8px;
      color: #3b82f6;
      font-weight: 700;
      letter-spacing: 0.08em;
      white-space: nowrap;
      text-transform: uppercase;
    }

    .nav-sep:first-child {
      padding-top: 2px;
    }

    /* ─── Header ──────────────────────────────────── */
    .header {
      grid-area: header;
      background: #0d1320;
      border-bottom: 1px solid #1e293b;
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 12px;
    }

    .header-title {
      font-size: 13px;
      font-weight: 700;
    }

    .header-subtitle {
      font-size: 11px;
      color: #475569;
    }

    .header-right {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header-kpi {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      padding: 2px 8px;
      background: #111827;
      border-radius: 3px;
    }

    .header-kpi .kpi-label { color: #475569; }
    .header-kpi .kpi-value { font-weight: 700; }
    .header-kpi.success .kpi-value { color: #22c55e; }
    .header-kpi.danger .kpi-value { color: #ef4444; }
    .header-kpi.warning .kpi-value { color: #f59e0b; }

    .header-time {
      font-size: 10px;
      color: #334155;
      font-family: monospace;
    }

    .btn-settings {
      background: none;
      border: 1px solid #1e293b;
      color: #64748b;
      font-size: 14px;
      width: 28px; height: 28px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }
    .btn-settings:hover { background: #1e293b; color: #fbbf24; border-color: #fbbf24; }

    /* ─── Main ────────────────────────────────────── */
    .main {
      grid-area: main;
      overflow: auto;
    }

    .sr-only {
      position: absolute;
      width: 1px; height: 1px;
      padding: 0; margin: -1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
    }


    /* ─── Role Transition Animations ─── */
    .transition-container {
      position: relative;
      overflow: hidden;
    }

    .transition-wrapper {
      width: 100%;
      height: 100%;
      transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .transition-wrapper.exiting {
      opacity: 0;
      transform: translateX(-20px);
    }

    .transition-wrapper.entering {
      opacity: 0;
      transform: translateX(20px);
    }

    /* ─── Enhanced Responsive Breakpoints ─── */
    /* Ultra-wide desktop */
    @media (min-width: 1600px) {
      :host {
        grid-template-columns: 260px 1fr;
      }
    }

    /* Desktop */
    @media (max-width: 1400px) and (min-width: 1025px) {
      :host {
        grid-template-columns: 200px 1fr;
      }
    }

    /* Tablet landscape */
    @media (max-width: 1024px) and (min-width: 769px) {
      :host {
        grid-template-columns: 180px 1fr;
      }
    }

    /* Tablet portrait / large phone */
    @media (max-width: 768px) and (min-width: 481px) {
      :host {
        grid-template-columns: 64px 1fr;
      }
      .sidebar .section-label,
      .sidebar .nav-label,
      .sidebar .nav-sep .sep-label,
      .sidebar .raci-section {
        display: none !important;
      }
      .nav-overview {
        justify-content: center;
        padding: 10px 0;
      }
      .nav-item {
        justify-content: center;
        padding: 10px 0;
      }
      .sidebar-brand .logo {
        font-size: 20px;
      }
      .sidebar-brand .version {
        display: none;
      }
    }

    /* Mobile */
    @media (max-width: 480px) {
      :host {
        grid-template-columns: 1fr;
        grid-template-areas:
          "header"
          "main" !important;
      }
      .sidebar {
        display: none !important;
      }
      .header {
        padding: 8px 12px !important;
        grid-area: header;
      }
      .header-title {
        font-size: 14px !important;
      }
      .header-subtitle {
        display: none !important;
      }
      .header-kpi {
        display: none !important;
      }
      .kbd-cmd-hint {
        display: none !important;
      }
    }

  `;

  @state() private _view: 'overview' | 'role' | 'market' | 'evolution' = 'overview';
  @state() private _currentRoleId: RoleId | null = null;
  @state() private _time = this._fmtTime(new Date());
  @state() private _raciActive: 'R' | 'A' | 'C' | 'I' | null = null;
  @state() private _raciHighlightTask = '';
  @state() private _showCreateTask = false;
  @state() private _newTaskTitle = '';
  @state() private _newTaskType: 'R' | 'A' | 'C' | 'I' = 'R';
  @state() private _newTaskRole: RoleId = 'security-ops';
  @state() private _newTaskPriority: 'P1' | 'P2' | 'P3' | 'P4' = 'P2';
  @state() private _showSettings = false;
  @state() private _toolPanelOpen = false;
  @state() private _commandPaletteOpen = false;
  @state() private _transitionState: 'idle' | 'exiting' | 'entering' = 'idle';

  @state() private _currentToolId = '';
  @state() private _currentToolLabel = '';
  @state() private _currentToolIcon = '🔧';

  private _taskCounter = 0;
  private _createdTasks: Array<{
    id: string;
    type: 'R'|'A'|'C'|'I';
    title: string;
    time: string;
    roleId: RoleId;
    roleLabel: string;
    roleColor: string;
    priority?: string;
    status: string;
    fromRole?: string;
    actions?: string[];
    history?: boolean;
    isNew?: boolean;
    assigner?: string;
    description?: string;
    createdAt: number;
  }> = [];

  /** Available actions per type + status */
  private _availableActions(task: { type: string; status: string }): Array<{ label: string; action: string; primary: boolean }> {
    const { type, status } = task;
    if (type === 'R') {
      if (status === 'pending') return [{ label: '开始执行', action: 'start', primary: true }];
      if (status === 'in_progress') return [{ label: '标记完成', action: 'complete', primary: true }];
      return [];
    }
    if (type === 'A') {
      if (status === 'pending') return [{ label: '驳回', action: 'reject', primary: false }, { label: '批准', action: 'approve', primary: true }];
      return [];
    }
    if (type === 'C') {
      if (status === 'pending') return [{ label: '开始咨询', action: 'consult', primary: true }];
      if (status === 'consulting') return [{ label: '提交建议', action: 'reply', primary: true }];
      return [];
    }
    if (type === 'I') {
      if (status === 'sent') return [{ label: '确认已读', action: 'read', primary: true }];
      if (status === 'read') return [{ label: '确认知悉', action: 'acknowledge', primary: true }];
      return [];
    }
    return [];
  }

  private _executeTaskAction(taskId: string, action: string) {
    const task = this._createdTasks.find(t => t.id === taskId);
    if (!task) return;
    const statusMap: Record<string, string> = {
      start: 'in_progress', complete: 'completed',
      approve: 'completed', reject: 'rejected',
      consult: 'consulting', reply: 'replied',
      read: 'read', acknowledge: 'acknowledged',
    };
    task.status = statusMap[action] ?? task.status;
    if (['complete', 'approve', 'reject', 'reply', 'acknowledge'].includes(action)) {
      task.history = true;
      task.isNew = false;
    }
    this.requestUpdate();
  }

  /** Status badge config */
  private _statusBadge(status: string): { text: string; color: string } {
    const map: Record<string, { text: string; color: string }> = {
      pending: { text: '待处理', color: '#f59e0b' },
      in_progress: { text: '执行中', color: '#3b82f6' },
      completed: { text: '已完成', color: '#22c55e' },
      rejected: { text: '已驳回', color: '#ef4444' },
      consulting: { text: '咨询中', color: '#8b5cf6' },
      replied: { text: '已回复', color: '#22c55e' },
      sent: { text: '已发送', color: '#6b7280' },
      read: { text: '已读', color: '#3b82f6' },
      acknowledged: { text: '已确认', color: '#22c55e' },
    };
    return map[status] ?? { text: status, color: '#6b7280' };
  }

  /** Initial status per RACI type */
  private _initialStatus(type: 'R'|'A'|'C'|'I'): string {
    return { R: 'pending', A: 'pending', C: 'pending', I: 'sent' }[type];
  }

  private _timer: ReturnType<typeof setInterval> | null = null;

  private _boundHandleToolPanel = (e: Event) => this._handleOpenToolPanel(e as CustomEvent);
  private _escHandler: ((e: KeyboardEvent) => void) | null = null;

  connectedCallback() {
    super.connectedCallback();
    this._timer = setInterval(() => { this._time = this._fmtTime(new Date()); }, 1000);

    // Cmd/Ctrl+K → command palette
    this._boundKeyDown = this._onGlobalKeyDown.bind(this);
    window.addEventListener('keydown', this._boundKeyDown);

    // Listen for palette-select events from sc-command-palette
    this.addEventListener('palette-select', (e: Event) => {
      const action = (e as CustomEvent<{ action: CommandAction }>).detail.action;
      this._dispatchCommandAction(action);
    });
    this.addEventListener('open-tool-panel', this._boundHandleToolPanel);
    this.addEventListener('navigate', ((e: CustomEvent) => {
      const { view, roleId } = e.detail;
      if (view === 'overview') this._goToOverview();
      else if (view === 'role' && roleId) this._switchToRole(roleId);
    }) as EventListener);
    
    // Escape 键关闭工具面板
    this._escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (this._toolPanelOpen || this._commandPaletteOpen)) {
        this._commandPaletteOpen = false;
        this._toolPanelOpen = false;
        if (window.location.hash.startsWith('#/tool/')) {
          window.location.hash = `#/${this._currentRoleId || ''}`;
        }
      }
    };
    window.addEventListener('keydown', this._escHandler);
    
    // Hash 路由监听，支持 /#/tool/{toolId} 直接打开工具
    window.addEventListener('hashchange', () => this._handleHashChange());
    this._handleHashChange(); // 初始化时解析当前 hash
  }
  
  private _handleHashChange() {
    const raw = window.location.hash.slice(1); // removes #
    const hash = raw.startsWith('/') ? raw.slice(1) : raw;
    if (hash.startsWith('tool/')) {
      const toolId = hash.split('/')[1];
      if (toolId) {
        // 检查工具是否被禁用
        const plugin = pluginStore.getState().getPlugin(toolId);
        if (plugin && !plugin.enabled) {
          // 工具已禁用，跳回角色视图
          window.location.hash = `#/${this._currentRoleId}`;
          return;
        }
        // 如果当前不在角色视图，先切换到角色视图
        if (this._view !== 'role') {
          this._view = 'role';
        }
        // 打开工具面板
        this._handleOpenToolPanel(new CustomEvent('open-tool-panel', { detail: { toolId } }));
      }
    } else if (hash && ALL_ROLE_IDS.includes(hash as RoleId)) {
      // 支持 #/{roleId} 直接跳转到角色指挥台
      this._switchToRole(hash as RoleId);
    } else if (hash === 'evolution') {
      this._view = 'evolution';
    } else if (hash === 'market') {
      this._view = 'market';
    }
  }

  disconnectedCallback() {
    if (this._timer) clearInterval(this._timer);
    this.removeEventListener('open-tool-panel', this._boundHandleToolPanel);
    if (this._escHandler) window.removeEventListener('keydown', this._escHandler);
    super.disconnectedCallback();
  }

  private _handleOpenToolPanel(e: CustomEvent) {
    const { toolId } = e.detail;
    this._currentToolId = toolId;
    const config = [...(ROLE_TOOL_CONFIGS[this._currentRoleId || 'ciso'].coreTools || []), ...(ROLE_TOOL_CONFIGS[this._currentRoleId || 'ciso'].secondaryTools || [])].find(t => t.id === toolId);
    this._currentToolLabel = config?.label || '工具';
    this._currentToolIcon = config?.icon || '🔧';
    this._toolPanelOpen = true;
  }

  private _fmtTime(d: Date): string {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }

  private _switchToRole(roleId: RoleId) {
    this._currentRoleId = roleId;
    this._view = 'role';
  }

  private _goToOverview() {
    this._view = 'overview';
    this._currentRoleId = null;
  }

  private _getStatus(roleId: RoleId): 'normal' | 'warning' | 'danger' {
    const d: RoleId[] = ['security-ops', 'security-expert'];
    const w: RoleId[] = ['privacy-officer'];
    if (d.includes(roleId)) return 'danger';
    if (w.includes(roleId)) return 'warning';
    return 'normal';
  }

  /** Render role nav with tier labels */
  private _renderRoleNav() {
    const tiers: { label: string; icon: string; roles: RoleId[] }[] = [
      { label: '决策层', icon: '🏛️', roles: ['ciso'] },
      { label: '协调层', icon: '🔗', roles: ['secuclaw-commander', 'privacy-officer', 'business-security-officer'] },
      { label: '执行层', icon: '⚙️', roles: ['security-ops', 'security-expert', 'security-architect', 'supply-chain-security'] },
    ];

    let shortcut = 1;
    const items: unknown[] = [];

    tiers.forEach((tier) => {
      items.push(html`<div class="nav-sep"><span class="sep-line"></span><span class="sep-label">${tier.icon} ${tier.label}</span><span class="sep-line"></span></div>`);
      tier.roles.forEach(roleId => {
        const config = ROLE_TOOL_CONFIGS[roleId];
        const theme = ROLE_THEMES[roleId];
        const isActive = this._view === 'role' && this._currentRoleId === roleId;
        const status = this._getStatus(roleId);
        items.push(html`
          <div
            class="nav-item ${isActive ? 'active' : ''}"
            style="--active-bg: ${theme.primary}18; --active-color: ${theme.secondary}"
            tabindex="0" role="button"
            @click=${() => this._switchToRole(roleId)}
            @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._switchToRole(roleId); }}
          >
            <span class="color-dot" style="background: ${theme.primary}"></span>
            <span class="nav-label">${config.label}</span>
            <span class="nav-shortcut">${getShortcutLabel(roleId)}</span>
            ${html`<span class="status-dot ${status}"></span>`}
          </div>
        `);
      });
    });

    return items;
  }

  private _allRaciTasks(): { type: 'R'|'A'|'C'|'I'; title: string; time: string; roleId: RoleId; roleLabel: string; roleColor: string }[] {
    return [
      // 安全专家
      { type: 'R', title: '执行漏洞扫描任务', time: '20分钟前', roleId: 'security-expert', roleLabel: '安全专家', roleColor: '#3b82f6' },
      { type: 'R', title: '分析 CVE-2026-1234 影响范围', time: '1小时前', roleId: 'security-expert', roleLabel: '安全专家', roleColor: '#3b82f6' },
      { type: 'R', title: '更新防火墙规则', time: '3小时前', roleId: 'security-expert', roleLabel: '安全专家', roleColor: '#3b82f6' },
      // 隐私官
      { type: 'R', title: '执行 GDPR 差距整改', time: '2小时前', roleId: 'privacy-officer', roleLabel: '隐私官', roleColor: '#a78bfa' },
      { type: 'R', title: '完成 DPIA 评估报告', time: '4小时前', roleId: 'privacy-officer', roleLabel: '隐私官', roleColor: '#a78bfa' },
      { type: 'A', title: '审批跨境传输合同', time: '30分钟前', roleId: 'privacy-officer', roleLabel: '隐私官', roleColor: '#a78bfa' },
      // 安全架构师
      { type: 'R', title: '执行微服务网关安全评审', time: '1.5小时前', roleId: 'security-architect', roleLabel: '架构师', roleColor: '#06b6d4' },
      { type: 'R', title: '执行威胁建模 STRIDE 分析', time: '3小时前', roleId: 'security-architect', roleLabel: '架构师', roleColor: '#06b6d4' },
      { type: 'A', title: '审批零信任架构方案 v3', time: '45分钟前', roleId: 'security-architect', roleLabel: '架构师', roleColor: '#06b6d4' },
      { type: 'A', title: '审批 API 网关认证策略', time: '2小时前', roleId: 'security-architect', roleLabel: '架构师', roleColor: '#06b6d4' },
      { type: 'C', title: '咨询 WAF 规则集优化', time: '4小时前', roleId: 'security-architect', roleLabel: '架构师', roleColor: '#06b6d4' },
      // 业务安全官
      { type: 'R', title: '执行 BCP 季度演练', time: '3天前', roleId: 'business-security-officer', roleLabel: '业务安全', roleColor: '#10b981' },
      { type: 'A', title: '审批保险续保申请', time: '5小时前', roleId: 'business-security-officer', roleLabel: '业务安全', roleColor: '#10b981' },
      // 安全指挥官
      { type: 'A', title: '审批防火墙紧急变更', time: '15分钟前', roleId: 'secuclaw-commander', roleLabel: '指挥官', roleColor: '#ef4444' },
      { type: 'A', title: '审批全员密码重置', time: '40分钟前', roleId: 'secuclaw-commander', roleLabel: '指挥官', roleColor: '#ef4444' },
      { type: 'R', title: '执行威胁 hunting 任务', time: '1小时前', roleId: 'secuclaw-commander', roleLabel: '指挥官', roleColor: '#ef4444' },
      { type: 'C', title: '咨询零信任方案评估', time: '2小时前', roleId: 'secuclaw-commander', roleLabel: '指挥官', roleColor: '#ef4444' },
      // CISO
      { type: 'A', title: '审批安全战略报告 Q2', time: '1小时前', roleId: 'ciso', roleLabel: 'CISO', roleColor: '#3b82f6' },
      { type: 'A', title: '审批预算追加申请', time: '3小时前', roleId: 'ciso', roleLabel: 'CISO', roleColor: '#3b82f6' },
      { type: 'C', title: '咨询并购安全风险', time: '5小时前', roleId: 'ciso', roleLabel: 'CISO', roleColor: '#3b82f6' },
      // 安全运营
      { type: 'R', title: '响应 P1 横向移动告警', time: '5分钟前', roleId: 'security-ops', roleLabel: '安全运营', roleColor: '#f97316' },
      { type: 'R', title: '执行 SOAR 木马遏制剧本', time: '30分钟前', roleId: 'security-ops', roleLabel: '安全运营', roleColor: '#f97316' },
      { type: 'C', title: '咨询 DNS 隧道分析方案', time: '2小时前', roleId: 'security-ops', roleLabel: '安全运营', roleColor: '#f97316' },
      // 供应链安全
      { type: 'R', title: '执行供应商风险评估', time: '2小时前', roleId: 'supply-chain-security', roleLabel: '供应链', roleColor: '#84cc16' },
      { type: 'A', title: '审批供应商准入申请', time: '4小时前', roleId: 'supply-chain-security', roleLabel: '供应链', roleColor: '#84cc16' },
      { type: 'C', title: '咨询 SBOM 开源组件风险', time: '6小时前', roleId: 'supply-chain-security', roleLabel: '供应链', roleColor: '#84cc16' },
      { type: 'I', title: '通知 SBOM 扫描完成', time: '1小时前', roleId: 'supply-chain-security', roleLabel: '供应链', roleColor: '#84cc16' },
      { type: 'I', title: '通知新增高危开源组件', time: '3小时前', roleId: 'security-expert', roleLabel: '安全专家', roleColor: '#3b82f6' },
    ];
  }

  /** Filtered tasks: overview=all, role=only that role; includes merged collab + created items */
  private _visibleRaciTasks(): Array<{ type: 'R'|'A'|'C'|'I'; title: string; time: string; roleId: RoleId; roleLabel: string; roleColor: string; fromRole?: string; actions?: string[]; history?: boolean; priority?: string; isNew?: boolean; id?: string; status?: string }> {
    const all = this._allRaciTasks();
    // Add user-created tasks with full metadata
    const created = this._createdTasks.map(t => ({ ...t }));
    const base = [...created, ...all];
    if (this._view === 'role' && this._currentRoleId) {
      const raciTasks = base.filter(t => t.roleId === this._currentRoleId);
      const collabAsRaci = this._collabAsRaciTasks();
      return [...raciTasks, ...collabAsRaci];
    }
    return base;
  }

  /** Convert collab items to RACI task format for merging */
  private _collabAsRaciTasks(): { type: 'R'|'A'|'C'|'I'; title: string; time: string; roleId: RoleId; roleLabel: string; roleColor: string; fromRole?: string; actions?: string[]; history?: boolean }[] {
    const rid = this._currentRoleId;
    if (!rid) return [];
    const theme: Record<string, string> = { 'security-ops': '#ef4444', 'security-expert': '#3b82f6', 'secuclaw-commander': '#3b82f6', 'ciso': '#3b82f6', 'privacy-officer': '#a78bfa', 'security-architect': '#06b6d4', 'business-security-officer': '#10b981', 'supply-chain-security': '#84cc16' };
    const label: Record<string, string> = { 'security-ops': '安全运营', 'security-expert': '安全专家', 'secuclaw-commander': '安全指挥官', 'ciso': 'CISO', 'privacy-officer': '隐私官', 'security-architect': '安全架构师', 'business-security-officer': '业务安全', 'supply-chain-security': '供应链' };
    const typeMap: Record<string, 'R'|'A'|'C'|'I'> = { request: 'R', mention: 'C', decision: 'A', log: 'I' };
    
    return this._collabItems().map(ci => ({
      type: typeMap[ci.type] ?? 'I',
      title: ci.content,
      time: ci.time,
      roleId: rid!,
      roleLabel: label[rid!] ?? '',
      roleColor: theme[rid!] ?? '#6b7280',
      fromRole: ci.from,
      actions: ci.actions,
      history: ci.history,
    }));
  }

  private _raciStatus(): { type: 'R'|'A'|'C'|'I'; count: number; color: string; label: string }[] {
    const tasks = this._visibleRaciTasks();
    const count = (t: 'R'|'A'|'C'|'I') => tasks.filter(x => x.type === t).length;
    return [
      { type: 'R', count: count('R'), color: '#3b82f6', label: '执行' },
      { type: 'A', count: count('A'), color: '#f59e0b', label: '审批' },
      { type: 'C', count: count('C'), color: '#8b5cf6', label: '咨询' },
      { type: 'I', count: count('I'), color: '#6b7280', label: '通知' },
    ];
  }

  /** Mock collaboration items — merged from sc-collab-hub */
  private _collabItems(): { id: string; type: string; badge: string; badgeColor: string; from: string; content: string; time: string; actions: string[]; history: boolean }[] {
    const now = Date.now();
    const fmt = (ms: number) => { const m = Math.floor(ms / 60000); return m < 60 ? `${m}分钟前` : `${Math.floor(m / 60)}小时前`; };
    const rid = this._currentRoleId;

    const allItems: Record<string, { id: string; type: string; badge: string; badgeColor: string; from: string; content: string; timeAgo: number; actions: string[]; history: boolean }[]> = {
      'security-ops': [
        { id: 'co1', type: 'request', badge: '协调请求', badgeColor: '#3b82f6', from: '安全专家', content: 'CVE-2026-1234 已验证为可利用，需要隔离 10.0.1.45', timeAgo: 800000, actions: ['查看详情', '接受'], history: false },
        { id: 'co2', type: 'mention', badge: '@提及', badgeColor: '#f59e0b', from: '安全指挥官', content: '零信任迁移启动，请确认 DMZ 防火墙规则已更新', timeAgo: 2400000, actions: ['确认'], history: false },
        { id: 'co3', type: 'decision', badge: '决策', badgeColor: '#22c55e', from: 'CISO', content: '批准紧急补丁窗口：周六 02:00-06:00', timeAgo: 5400000, actions: [], history: true },
        { id: 'co4', type: 'log', badge: '日志', badgeColor: '#6b7280', from: '安全运营', content: 'SOAR 剧本执行：DNS 隧道封堵处置 2 条告警', timeAgo: 9000000, actions: [], history: true },
      ],
      'security-expert': [
        { id: 'co1', type: 'request', badge: '协调请求', badgeColor: '#3b82f6', from: '安全运营', content: '发现疑似 0day 利用，样本哈希 a3f2b8...，需分析攻击链', timeAgo: 600000, actions: ['查看样本', '开始分析'], history: false },
        { id: 'co2', type: 'request', badge: '协调请求', badgeColor: '#3b82f6', from: '供应链', content: 'SBOM 发现 log4j 2.14.1 仍在使用，请评估升级优先级', timeAgo: 3600000, actions: ['评估风险'], history: false },
        { id: 'co3', type: 'log', badge: '日志', badgeColor: '#6b7280', from: '安全专家', content: '漏洞扫描完成：65 个漏洞，Critical 3 个', timeAgo: 10800000, actions: [], history: true },
      ],
      'secuclaw-commander': [
        { id: 'co1', type: 'request', badge: '协调请求', badgeColor: '#3b82f6', from: '安全运营', content: 'P1 横向移动行为已影响 3 台主机，请求跨团队响应', timeAgo: 300000, actions: ['启动应急'], history: false },
        { id: 'co2', type: 'request', badge: '协调请求', badgeColor: '#3b82f6', from: '隐私官', content: 'GDPR 审计发现 2 条跨境传输链缺少 SCCs', timeAgo: 1800000, actions: ['分配任务'], history: false },
        { id: 'co3', type: 'decision', badge: '决策', badgeColor: '#22c55e', from: 'CISO', content: '零信任架构迁移方案批准，4/20 启动', timeAgo: 7200000, actions: [], history: true },
        { id: 'co4', type: 'log', badge: '日志', badgeColor: '#6b7280', from: '安全专家', content: '威胁情报更新：APT-41 活跃度上升', timeAgo: 14400000, actions: [], history: true },
      ],
      'ciso': [
        { id: 'co1', type: 'request', badge: '协调请求', badgeColor: '#3b82f6', from: '安全指挥官', content: '安全投入产出比下降 15%，建议追加预算', timeAgo: 1800000, actions: ['审批预算'], history: false },
        { id: 'co2', type: 'request', badge: '协调请求', badgeColor: '#3b82f6', from: '安全架构师', content: '零信任方案已完成技术评审，需最终审批', timeAgo: 3600000, actions: ['批准'], history: false },
        { id: 'co3', type: 'decision', badge: '决策', badgeColor: '#22c55e', from: 'CISO', content: 'Q2 董事会安全报告已提交，风险评分 44/100', timeAgo: 14400000, actions: [], history: true },
      ],
      'privacy-officer': [
        { id: 'co1', type: 'request', badge: '协调请求', badgeColor: '#3b82f6', from: '业务安全', content: 'BCP 演练发现数据恢复涉及跨境传输，需评估 SCCs', timeAgo: 1200000, actions: ['评估合规'], history: false },
        { id: 'co2', type: 'log', badge: '日志', badgeColor: '#6b7280', from: '隐私官', content: 'DPIA 评估完成：3 个高风险处理活动已补充报告', timeAgo: 7200000, actions: [], history: true },
        { id: 'co3', type: 'log', badge: '日志', badgeColor: '#6b7280', from: '安全运营', content: '数据泄露通知演练：72h 通知率 100%', timeAgo: 10800000, actions: [], history: true },
      ],
      'security-architect': [
        { id: 'co1', type: 'request', badge: '协调请求', badgeColor: '#3b82f6', from: '安全指挥官', content: '零信任迁移需架构师主导技术方案设计', timeAgo: 900000, actions: ['开始设计'], history: false },
        { id: 'co2', type: 'request', badge: '协调请求', badgeColor: '#3b82f6', from: '安全专家', content: 'API 网关存在 3 个认证绕过风险，需架构评审', timeAgo: 3600000, actions: ['设计方案'], history: false },
        { id: 'co3', type: 'decision', badge: '决策', badgeColor: '#22c55e', from: '安全架构师', content: '微服务网关方案评审通过：mTLS + JWT', timeAgo: 9000000, actions: [], history: true },
      ],
      'business-security-officer': [
        { id: 'co1', type: 'request', badge: '协调请求', badgeColor: '#3b82f6', from: '安全指挥官', content: 'Q2 BCP 演练计划已下达，覆盖 IT/客服/财务', timeAgo: 1500000, actions: ['安排演练'], history: false },
        { id: 'co2', type: 'decision', badge: '决策', badgeColor: '#22c55e', from: 'CISO', content: 'BCP 演练预算 ¥15万已批准', timeAgo: 7200000, actions: [], history: true },
        { id: 'co3', type: 'log', badge: '日志', badgeColor: '#6b7280', from: '业务安全', content: 'BCP 演练完成：RTO 达标率 96%', timeAgo: 10800000, actions: [], history: true },
      ],
      'supply-chain-security': [
        { id: 'co1', type: 'request', badge: '协调请求', badgeColor: '#3b82f6', from: '安全专家', content: '2 个高危第三方组件漏洞（log4j + spring-boot），启动紧急响应', timeAgo: 600000, actions: ['启动响应'], history: false },
        { id: 'co2', type: 'request', badge: '协调请求', badgeColor: '#3b82f6', from: '隐私官', content: '云盾科技数据协议即将到期，需评估续约合规性', timeAgo: 3600000, actions: ['开始评估'], history: false },
        { id: 'co3', type: 'log', badge: '日志', badgeColor: '#6b7280', from: '供应链', content: 'SBOM 扫描完成：5 个组件有漏洞', timeAgo: 10800000, actions: [], history: true },
      ],
    };

    const items = rid ? (allItems[rid] ?? []) : [];
    return items.map(i => ({ ...i, time: fmt(i.timeAgo) }));
  }

  private _boundKeyDown: ((e: KeyboardEvent) => void) | null = null;

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._boundKeyDown) {
      window.removeEventListener('keydown', this._boundKeyDown);
      this._boundKeyDown = null;
    }
  }

  private _onGlobalKeyDown(e: KeyboardEvent) {
    // Cmd/Ctrl+K → command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      this._commandPaletteOpen = !this._commandPaletteOpen;
      return;
    }
  }

  private _dispatchCommandAction(action: CommandAction) {
    switch (action.type) {
      case 'go-overview':
        this._view = 'overview';
        this._currentRoleId = null;
        break;
      case 'open-market':
        this._view = 'market';
        this._currentRoleId = null;
        break;
      case 'open-settings':
        this._showSettings = !this._showSettings;
        break;
      case 'switch-role':
        if (action.roleId) this._switchToRoleWithTransition(action.roleId);
        break;
      case 'open-tool':
        if (action.toolId && action.roleId) {
          this._currentRoleId = action.roleId;
          this._view = 'role';
          setTimeout(() => {
            const rc = this.shadowRoot?.querySelector('sc-role-commander');
            if (rc) rc.dispatchEvent(new CustomEvent('open-tool', { detail: { toolId: action.toolId }, bubbles: true, composed: true }));
          }, 300);
        }
        break;
    }
  }

  private _switchToRoleWithTransition(roleId: RoleId) {
    if (this._currentRoleId === roleId && this._view === 'role') {
      return; // already on this role
    }
    // Start transition
    this._transitionState = 'exiting';
    this.requestUpdate();
    setTimeout(() => {
      this._currentRoleId = roleId;
      this._view = 'role';
      this._transitionState = 'entering';
      this.requestUpdate();
      setTimeout(() => {
        this._transitionState = 'idle';
        this.requestUpdate();
      }, 400);
    }, 250);
  }

  render() {
    const activeTheme = this._currentRoleId ? ROLE_THEMES[this._currentRoleId] : null;
    const activeLabel = this._currentRoleId ? ROLE_TOOL_CONFIGS[this._currentRoleId].label : '';
    const raci = this._raciStatus();
    const visibleTasks = this._visibleRaciTasks();

    return html`
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <span class="logo">SecuClaw</span>
          <span class="version">v2</span>
        </div>

        <div class="sidebar-scroll">
          <!-- Overview -->
          <div class="section-label">导航</div>
          <div
            class="nav-overview ${this._view === 'overview' ? 'active' : ''}"
            tabindex="0" role="button"
            @click=${this._goToOverview}
            @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._goToOverview(); }}
          >
            <span class="icon">📊</span>
            <span>安全总览</span>
          </div>
          <div
            class="nav-overview ${this._view === 'market' ? 'active' : ''}"
            tabindex="0" role="button"
            @click=${() => { this._view = 'market'; window.location.hash = '#/market'; }}
            @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') { this._view = 'market'; window.location.hash = '#/market'; } }}
          >
            <span class="icon">🧩</span>
            <span>工具市场</span>
          </div>
          <div
            class="nav-overview ${this._view === 'evolution' ? 'active' : ''}"
            tabindex="0" role="button"
            @click=${() => { this._view = 'evolution'; window.location.hash = '#/evolution'; }}
            @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') { this._view = 'evolution'; window.location.hash = '#/evolution'; } }}
          >
            <span class="icon">🧬</span>
            <span>自主进化</span>
          </div>

          <!-- RACI (common, always visible) -->
          <div class="section-label">RACI 任务</div>
          <div class="raci-section">
            <!-- Create task bar -->
            <div class="raci-create-bar">
              <span style="font-size:9px;color:#475569">${visibleTasks.length} 项任务</span>
              <button class="raci-create-btn" @click=${() => { this._showCreateTask = !this._showCreateTask; }}>
                ${this._showCreateTask ? '✕ 取消' : '+ 创建任务'}
              </button>
            </div>

            ${this._showCreateTask ? html`
              <div class="create-form">
                <input
                  type="text"
                  placeholder="输入任务标题..."
                  .value=${this._newTaskTitle}
                  @input=${(e: Event) => { this._newTaskTitle = (e.target as HTMLInputElement).value; }}
                />
                <div>
                  <div class="cf-label">分配角色</div>
                  <select .value=${this._newTaskRole} @change=${(e: Event) => { this._newTaskRole = (e.target as HTMLSelectElement).value as RoleId; }}>
                    ${ALL_ROLE_IDS.map(id => html`<option value=${id} ?selected=${id === this._newTaskRole}>${ROLE_TOOL_CONFIGS[id].label}</option>`)}
                  </select>
                </div>
                <div class="cf-row">
                  <div>
                    <div class="cf-label">RACI 类型</div>
                    <select .value=${this._newTaskType} @change=${(e: Event) => { this._newTaskType = (e.target as HTMLSelectElement).value as 'R'|'A'|'C'|'I'; }}>
                      <option value="R" ?selected=${this._newTaskType === 'R'}>R 执行</option>
                      <option value="A" ?selected=${this._newTaskType === 'A'}>A 审批</option>
                      <option value="C" ?selected=${this._newTaskType === 'C'}>C 咨询</option>
                      <option value="I" ?selected=${this._newTaskType === 'I'}>I 通知</option>
                    </select>
                  </div>
                  <div>
                    <div class="cf-label">优先级</div>
                    <select .value=${this._newTaskPriority} @change=${(e: Event) => { this._newTaskPriority = (e.target as HTMLSelectElement).value as 'P1'|'P2'|'P3'|'P4'; }}>
                      <option value="P1">P1 紧急</option>
                      <option value="P2">P2 高</option>
                      <option value="P3">P3 中</option>
                      <option value="P4">P4 低</option>
                    </select>
                  </div>
                </div>
                <div class="cf-actions">
                  <button class="cf-btn cancel" @click=${() => { this._showCreateTask = false; }}>取消</button>
                  <button
                    class="cf-btn submit"
                    ?disabled=${!this._newTaskTitle.trim()}
                    @click=${() => {
                      const id = `task-${++this._taskCounter}-${Date.now()}`;
                      this._createdTasks.unshift({
                        id,
                        type: this._newTaskType,
                        title: this._newTaskTitle.trim(),
                        time: '刚刚',
                        roleId: this._newTaskRole,
                        roleLabel: ROLE_TOOL_CONFIGS[this._newTaskRole].label,
                        roleColor: ROLE_THEMES[this._newTaskRole]?.primary ?? '#6b7280',
                        priority: this._newTaskPriority,
                        status: this._initialStatus(this._newTaskType),
                        isNew: true,
                        createdAt: Date.now(),
                      });
                      this._newTaskTitle = '';
                      this._showCreateTask = false;
                      this._raciActive = this._newTaskType;
                      this.requestUpdate();
                      this._switchToRole(this._newTaskRole);
                    }}
                  >分配</button>
                </div>
              </div>
            ` : nothing}

            <div class="raci-grid">
              ${raci.map(r => html`
                <div
                  class="raci-chip ${this._raciActive === r.type ? 'active' : ''}"
                  style="--chip-color: ${r.color}"
                  @click=${() => { this._raciActive = this._raciActive === r.type ? null : r.type; }}
                >
                  <div class="type" style="color: ${r.color}">${r.type}</div>
                  <div class="count" style="color: ${r.color}">${r.count}</div>
                  <div class="lbl">${r.label}</div>
                </div>
              `)}
            </div>
            <div class="raci-tasks ${this._raciActive ? 'open' : ''}">
              ${visibleTasks.filter(t => t.type === this._raciActive).map(t => {
                const sb = t.status ? this._statusBadge(t.status) : null;
                const actions = t.id ? this._availableActions(t as any) : [];
                return html`
                  <div
                    class="raci-task-item ${t.history ? 'is-history' : ''} ${t.isNew ? 'is-new' : ''} ${t.status === 'in_progress' || t.status === 'consulting' ? 'is-active' : ''} ${t.status === 'completed' || t.status === 'replied' || t.status === 'acknowledged' ? 'is-done' : ''} ${t.status === 'rejected' ? 'is-rejected' : ''}"
                  >
                    <span class="dot" style="background: ${t.isNew ? '#22c55e' : raci.find(r => r.type === t.type)?.color}"></span>
                    ${t.isNew ? html`<span class="new-badge">NEW</span>` : nothing}
                    ${t.priority ? html`<span class="prio-badge" data-prio=${t.priority}>${t.priority}</span>` : nothing}
                    <span class="task-title">${t.title}</span>
                    ${sb ? html`<span class="status-badge" style="background:${sb.color}18;color:${sb.color}">${sb.text}</span>` : nothing}
                    ${t.fromRole ? html`<span class="task-from">← ${t.fromRole}</span>` : nothing}
                    ${this._view === 'overview' ? html`<span class="task-role" style="background:${t.roleColor}22;color:${t.roleColor}">${t.roleLabel}</span>` : nothing}
                    <span class="task-time">${t.time}</span>
                  </div>
                  ${actions.length > 0 ? html`
                    <div class="task-actions">
                      ${actions.map(a => html`<button class="ci-btn ${a.primary ? 'primary' : ''}" @click=${() => this._executeTaskAction(t.id!, a.action)}>${a.label}</button>`)}
                    </div>
                  ` : nothing}
                `;
              })}
            </div>

            ${this._view === 'role' ? (() => {
              const historyCount = visibleTasks.filter(t => t.history).length;
              return historyCount > 0 ? html`
                <div class="raci-collab-section" style="margin-top:4px;padding-top:4px;border-top:1px solid #1e293b">
                  <div class="raci-collab-label" style="font-size:8px;color:#475569">含 ${historyCount} 条历史记录</div>
                </div>
              ` : nothing;
            })() : nothing}
          </div>

          <!-- Role Commander nav -->
          <div class="section-label">角色指挥台</div>
          ${this._renderRoleNav()}
        </div>
      </aside>

      <!-- Header -->
      <header class="header" style="border-bottom-color: ${activeTheme ? activeTheme.primary + '33' : '#1e293b'}">
        <span class="header-title">${this._view === 'overview' ? '安全总览' : this._view === 'market' ? '工具市场' : this._view === 'evolution' ? '自主进化' : `${activeLabel} 指挥台`}</span>
        <span class="header-subtitle">${this._view === 'overview' ? '全域安全态势' : this._view === 'market' ? '安全工具统一接入平台' : this._view === 'evolution' ? '角色能力自进化管理' : activeTheme?.label ?? ''}</span>
        <div class="header-right">
          <div class="header-kpi success"><span class="kpi-label">全域</span><span class="kpi-value">79</span></div>
          <div class="header-kpi danger"><span class="kpi-label">事件</span><span class="kpi-value">7</span></div>
          <div class="header-kpi warning"><span class="kpi-label">待处理</span><span class="kpi-value">23</span></div>
          <span class="header-time">${this._time}</span>
          <button class="kbd-cmd-hint" title="命令面板 (Cmd+K)" @click=${() => { this._commandPaletteOpen = !this._commandPaletteOpen; }}>
        <span style="font-size:11px">⌘K</span>
      </button>
      <button class="btn-settings" title="系统配置" @click=${() => { this._showSettings = !this._showSettings; }}>⚙</button>
        </div>
      </header>

      <!-- Main -->
      <main class="main transition-container">
        <div class="transition-wrapper ${this._transitionState === 'exiting' ? 'exiting' : ''} ${this._transitionState === 'entering' ? 'entering' : ''}">
          ${this._view === 'market'
            ? html`<sc-plugin-market></sc-plugin-market>`
            : this._view === 'evolution'
              ? html`<evolution-dashboard></evolution-dashboard>`
              : this._view === 'role'
                ? html`<sc-role-commander .roleId=${this._currentRoleId!} .raciHighlightTask=${this._raciHighlightTask}></sc-role-commander>`
                : html`<sc-overview @role-selected=${(e: CustomEvent) => this._switchToRole(e.detail.roleId)}></sc-overview>`
          }
        </div>
      </main>

      <!-- Command Palette -->
      ${this._commandPaletteOpen ? html`<sc-command-palette></sc-command-palette>` : nothing}

      <!-- Settings Panel -->
      ${this._showSettings ? html`
        <sc-settings-panel @click=${() => { this._showSettings = false; }} @settings-closed=${() => { this._showSettings = false; }}></sc-settings-panel>
      ` : ''}
      <sc-tool-panel 
        .open=${this._toolPanelOpen}
        .toolId=${this._currentToolId}
        .toolLabel=${this._currentToolLabel}
        .toolIcon=${this._currentToolIcon}
        .roleId=${this._currentRoleId}
        @panel-closed=${() => { 
          this._toolPanelOpen = false;
          // 关闭面板时重置 hash 回角色视图
          if (window.location.hash.startsWith('#/tool/')) {
            window.location.hash = `#/${this._currentRoleId}`;
          }
        }}
      ></sc-tool-panel>
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'sc-app-shell': ScAppShell; } }

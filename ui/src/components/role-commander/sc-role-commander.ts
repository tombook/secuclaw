import { LitElement, html, css, nothing } from 'lit'
import { customElement, state, property } from 'lit/decorators.js'

// Tool results panel
import './sc-tool-results-panel';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'
import type { RoleId } from '../../config/role-tool-config'
import { ROLE_TOOL_CONFIGS } from '../../config/role-tool-config'
import { pluginStore } from '../../plugins/index'
import { ROLE_DASHBOARDS } from '../../config/role-dashboard-config'
import { ROLE_LAYOUTS as ROLE_LAYOUT_CONFIGS } from '../../config/role-layout-config'
import { ROLE_THEMES as ROLE_THEME_CONFIGS } from '../../config/role-theme-config'
import { timelineStore, runAutoImport, getTimelineProviders, type TimelineEvent, type TimelinePriority } from '../../stores/timeline-store'
import { mockDataStore, startMockDataRefresh, getMetric, type MetricState } from '../../stores/mock-data-store'
import '../../stores/timeline-providers' // 注册内置 provider
import { DARK_SIMULATIONS as ImportedDarkSimulations } from '../../stores/dark-simulations';
import { roleStore as store } from '../../stores/role-store'

@customElement('sc-role-commander')
export class ScRoleCommander extends LitElement {
  @property({ type: String }) roleId: RoleId = 'ciso'
  @property({ type: String }) raciHighlightTask: string = ''
  @state() private _panelOpen = false
  @state() private _toast: string | null = null

  private _showToast(msg: string, duration = 2000) {
    this._toast = msg
    setTimeout(() => { this._toast = null; this.requestUpdate(); }, duration)
  }
  @state() private _aiPanelOpen = false
  @state() private _aiPanelLoading = false
  @state() private _aiPanelResult: any = null
  @state() private _showAllTools = false
  @state() private _showTimelineForm = false
  @state() private _timelineFormLabel = ''
  @state() private _timelineFormTime = ''
  @state() private _timelineFormPriority: TimelinePriority = 'P2'
  @state() private _timelineFormDesc = ''
  @state() private _editingTimelineEvent: string | null = null
  @state() private _editingTimelineTime = ''
  @state() private _showCompleted = false
  @state() private _selectedTimelineEvent: string | null = null
  @state() private _showToolResults = true

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      background: var(--sc-bg-primary);
      color: var(--sc-text-primary);
      font-family: var(--sc-font-family);
      overflow: hidden;
    }
    .role-commander {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .status-bar {
      height: 32px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      border-bottom: 1px solid var(--sc-border-color);
      font-size: 12px;
      gap: 16px;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--sc-success-color);
      margin-right: 4px;
    }
    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }
    .role-dash {
      width: 100%;
      min-height: 100%;
      display: flex;
      flex-direction: column;
      gap: 0;
      overflow-y: auto;
      padding-bottom: 48px;
    }

    /* ─── 通用区域区块（所有角色自动生效） ─── */
    .zone {
      padding: 12px;
    }
    .zone-tools {
      background: linear-gradient(180deg, #0c1525 0%, #0f172a 100%);
      border-bottom: 1px solid #1e293b;
    }
    .zone-timeline {
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
    }
    .zone-results {
      background: #0d1321;
      border-bottom: 1px solid #1e293b;
    }
    .zone-label {
      font-size: 9px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .zone-label::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #1e293b;
    }

    /* ─── 非 zone 模式: rd-row 自动加分区背景 ─── */
    .role-dash > .rd-row {
      padding: 12px;
      border-bottom: 1px solid #1e3a5f;
    }
    .role-dash > .rd-row:first-child {
      background: #0a1628;
    }
    .role-dash > .rd-row:nth-child(2) {
      background: #0f1b30;
    }
    .role-dash > .rd-row:nth-child(n+3) {
      background: #111827;
    }

    .rd-row {
      width: 100%;
      display: grid;
      gap: 12px;
    }
    .rd-3col {
      grid-template-columns: repeat(3, 1fr);
    }
    .rd-2col {
      grid-template-columns: repeat(2, 1fr);
    }
    .rd-5col {
      grid-template-columns: repeat(5, 1fr);
      align-items: stretch;
    }
    .rd-section {
      background: var(--sc-bg-secondary);
      border: 1px solid var(--sc-border-color);
      border-radius: 6px;
      padding: 12px;
      transition: border-color 0.2s;
      cursor: pointer;
      display: flex;
      flex-direction: column;
    }
    .rd-section:hover {
      border-color: var(--sc-primary-color);
    }
    .rd-title {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--sc-text-secondary);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .rd-chart-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }
    .rd-big-num {
      font-size: 24px;
      font-weight: 800;
      line-height: 1;
      transition: color 0.3s;
    }
    .rd-big-num.flash {
      animation: numFlash 0.6s ease-out;
    }
    @keyframes numFlash {
      0% { text-shadow: 0 0 8px currentColor; transform: scale(1.05); }
      100% { text-shadow: none; transform: scale(1); }
    }
    .rd-unit {
      font-size: 10px;
      color: var(--sc-text-muted);
    }
    .rd-sub-row {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 10px;
      color: var(--sc-text-muted);
    }
    .rd-pipe-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 3px 0;
    }
    .rd-pipe-label {
      font-size: 10px;
      color: var(--sc-text-muted);
      flex-shrink: 0;
      width: 60px;
    }
    .rd-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 3px 0;
      font-size: 10px;
    }
    .rd-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .tool-summary-bar {
      height: 40px;
      border-top: 1px solid #1e3a5f;
      display: flex;
      align-items: center;
      padding: 0 12px;
      gap: 16px;
      overflow-x: auto;
      background: #080e1a;
    }
    .tool-tag {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      background: var(--sc-bg-tertiary);
      border-radius: 4px;
      font-size: 12px;
      border: 1px solid var(--sc-border-color);
      transition: all 0.2s;
      cursor: pointer;
      white-space: nowrap;
    }
    .tool-tag:hover {
      border-color: var(--sc-primary-color);
      background: var(--sc-primary-alpha-10);
    }
    .tool-tag-status {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .tool-more-wrap {
      position: relative;
    }
    .tool-more-btn {
      color: var(--sc-primary-color);
      font-weight: 600;
    }
    .tool-more-dropdown {
      position: fixed;
      bottom: 44px;
      right: 200px;
      background: var(--sc-bg-secondary);
      border: 1px solid var(--sc-border-color);
      border-radius: 6px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      min-width: 200px;
      z-index: 9999;
      padding: 4px 0;
      max-height: 300px;
      overflow-y: auto;
    }
    .tool-more-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s;
    }
    .tool-more-item:hover {
      background: var(--sc-primary-alpha-10);
    }
    /* Timeline */
    .tl-btn {
      font-size: 10px; padding: 3px 10px; border-radius: 4px;
      border: 1px solid #334155; background: transparent; color: #94a3b8;
      cursor: pointer; transition: all 100ms; white-space: nowrap;
    }
    .tl-btn:hover { border-color: #475569; color: #e2e8f0; }
    .tl-btn-primary { border-color: #3b82f6; color: #3b82f6; }
    .tl-btn-primary:hover { background: #3b82f620; }
    .tl-form {
      padding: 8px; margin-bottom: 8px;
      background: #0f172a; border: 1px solid #1e293b; border-radius: 6px;
    }
    .tl-input {
      font-size: 11px; padding: 4px 8px;
      background: #1e293b; border: 1px solid #334155; border-radius: 4px;
      color: #e2e8f0; outline: none;
    }
    .tl-input:focus { border-color: #3b82f6; }
    .tl-input::placeholder { color: #475569; }
    .tl-event-list { margin-top: 8px; max-height: 200px; overflow-y: auto; }
    .tl-event-row {
      display: flex; align-items: center; gap: 6px;
      padding: 4px 6px; border-bottom: 1px solid #1e293b;
      transition: background 0.1s;
    }
    .tl-event-row:hover { background: #ffffff08; }
    .tl-event-row:last-child { border-bottom: none; }
    .tl-edit-popup {
      position: fixed; z-index: 9999;
      background: #0f172a; border: 1px solid #334155; border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5); padding: 12px 14px;
      min-width: 260px; max-width: 340px;
    }
    .tl-edit-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
    .tl-edit-label { font-size: 9px; color: #64748b; width: 48px; flex-shrink: 0; }
    .tl-edit-value { font-size: 10px; color: #e2e8f0; flex: 1; }
    .tl-edit-input {
      font-size: 10px; padding: 3px 6px; background: #1e293b;
      border: 1px solid #334155; border-radius: 4px; color: #e2e8f0;
      outline: none; width: 100%;
    }
    .tl-edit-input:focus { border-color: #3b82f6; }
    .tl-edit-actions { display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap; }
    /* AI Panel */
    .ai-float-panel {
      position: fixed;
      right: 16px;
      top: 88px;
      bottom: 8px;
      width: 340px;
      background: #0f172aee;
      backdrop-filter: blur(12px);
      border: 1px solid #334155;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      display: flex;
      flex-direction: column;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .ai-float-head {
      height: 44px;
      border-bottom: 1px solid var(--sc-border-color);
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 600;
    }
    .ai-float-close {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;
    }
    .ai-float-close:hover {
      background: var(--sc-bg-tertiary);
    }
    .ai-float-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      font-size: 13px;
      line-height: 1.6;
    }
    .ai-float-foot {
      height: 44px;
      border-top: 1px solid var(--sc-border-color);
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }
    .ai-float-toggle {
      position: fixed;
      right: 16px;
      bottom: 16px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--sc-primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      transition: all 0.2s;
      z-index: 999;
    }
    .ai-float-toggle:hover {
      transform: scale(1.1);
    }
    .ai-float-toggle.hidden {
      display: none;
    }
    /* Progress Bar */
    .progress-bar {
      flex: 1;
      height: 6px;
      background: var(--sc-bg-tertiary);
      border-radius: 3px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s;
    }

    /* ─── Responsive ─── */
    @media (max-width: 1200px) {
      .rd-5col { grid-template-columns: repeat(3, 1fr) !important; }
    }
    @media (max-width: 768px) {
      .rd-5col { grid-template-columns: repeat(2, 1fr) !important; }
      .main-content { padding: 8px !important; }
      .zone { margin: 0 6px 6px !important; padding: 8px !important; }
      .rd-big-num { font-size: 20px !important; }
    }
    @media (max-width: 480px) {
      .rd-5col { grid-template-columns: 1fr !important; }
    }

    /* === CISO ROLE LAYOUT === */
    .ciso-role-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 20px;
    }
    .ciso-zone-exec {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .ciso-zone-3col {
      display: grid;
      grid-template-columns: 1.2fr 1fr 0.8fr;
      gap: 16px;
    }
    .ciso-zone-ops {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .ciso-zone-feed {
      margin-top: 4px;
    }
    .ciso-metrics-strip {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
    }
    .ciso-panel {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 20px;
      overflow: hidden;
    }
    .ciso-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .ciso-panel-title {
      font-size: 14px;
      font-weight: 700;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ciso-panel-title .icon {
      font-size: 16px;
    }
    .ciso-panel-badge {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
    }
    .ciso-panel-body {
      min-height: 120px;
    }
    .ciso-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
      margin: 12px 0;
    }
    @media (max-width: 1200px) {
      .ciso-zone-ops { grid-template-columns: 1fr; }
      .ciso-zone-3col { grid-template-columns: 1fr; }
      .ciso-metrics-strip { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 768px) {
      .ciso-metrics-strip { grid-template-columns: repeat(2, 1fr); }
    }
    /* Reset zone inner styles when wrapped in ciso-panel */
    .ciso-panel > .zone {
      margin: 0 !important;
      border: none !important;
      border-radius: 0 !important;
    }
    .ciso-panel > .zone.zone-dark {
      background: transparent !important;
    }
    .ciso-panel > .zone.zone-decision {
      background: transparent !important;
    }
    .ciso-panel > .zone.zone-legal {
      background: transparent !important;
    }
    .ciso-panel > .zone.zone-framework {
      background: transparent !important;
    }
    .ciso-panel > .zone.zone-viz {
      background: transparent !important;
    }
    .ciso-panel > .zone.zone-timeline {
      background: transparent !important;
    }
    .ciso-panel > div[style*="margin"] {
      margin: 0 !important;
    }
  `

  private _storeUnsub: (() => void) | null = null
  private _timelineUnsub: (() => void) | null = null
  private _mockUnsub: (() => void) | null = null
  private _prevMetrics: Record<string, { num: string }> = {}
  private _closeMoreBound: ((e: Event) => void) | null = null

  connectedCallback() {
    super.connectedCallback()
    // 监听 pluginStore 变化（启用/禁用时刷新）
    this._storeUnsub = pluginStore.subscribe(() => this.requestUpdate())
    this._timelineUnsub = timelineStore.subscribe(() => this.requestUpdate())
    this._mockUnsub = mockDataStore.subscribe(() => {
      const state = mockDataStore.getState();
      // Threshold alerts: detect significant metric changes
      const thresholds: Record<string, { max: number; label: string }> = {
        'risk-score': { max: 60, label: '风险评分过高' },
        'alert-queue': { max: 30, label: '告警队列积压' },
        'vuln-scan': { max: 80, label: '漏洞数量过多' },
        'incident-mgmt': { max: 8, label: '待处理事件过多' },
        'patch-mgmt': { max: 15, label: '补丁积压' },
      };
      for (const [toolId, cfg] of Object.entries(thresholds)) {
        const prev = this._prevMetrics[toolId];
        const curr = state.metrics[toolId];
        if (prev && curr) {
          const prevVal = parseInt(prev.num);
          const currVal = parseInt(curr.num);
          if (prevVal <= cfg.max && currVal > cfg.max) {
            this._showToast(`⚠️ ${cfg.label}: ${curr.num}`, 4000);
          }
        }
      }
      // Snapshot current metrics for next comparison
      this._prevMetrics = { ...state.metrics };
      this.requestUpdate();
    })
    this._prevMetrics = { ...mockDataStore.getState().metrics };
    startMockDataRefresh(30000)
    this.addEventListener('tool-click', (e: Event) => {
      const detail = (e as CustomEvent).detail as { toolId: string }
      this._openToolPanel(detail.toolId)
    })
    this.addEventListener('open-tool', (e: Event) => {
      const detail = (e as CustomEvent).detail as { toolId: string }
      this._openToolPanel(detail.toolId)
    })
    // 点击外部关闭"更多"下拉 和 时间轴编辑浮层
    this._closeMoreBound = (e: Event) => {
      if (this._showAllTools && !(e.target as HTMLElement).closest('.tool-more-wrap')) {
        this._showAllTools = false;
      }
      if (this._selectedTimelineEvent) {
        this._selectedTimelineEvent = null;
        this._editingTimelineEvent = null;
      }
    };
    document.addEventListener('click', this._closeMoreBound);
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    if (this._storeUnsub) { this._storeUnsub(); this._storeUnsub = null; }
    if (this._timelineUnsub) { this._timelineUnsub(); this._timelineUnsub = null; }
    if (this._mockUnsub) { this._mockUnsub(); this._mockUnsub = null; }
    if (this._closeMoreBound) { document.removeEventListener('click', this._closeMoreBound); this._closeMoreBound = null; }
  }

  /** Auto-trigger numFlash on metric card value changes */
  private _prevBigNums: Record<string, string> = {};
  override updated() {
    // Find all .rd-big-num elements, flash if value changed
    const cards = this.renderRoot.querySelectorAll('.rd-big-num');
    cards.forEach((el) => {
      const text = el.textContent?.trim() ?? '';
      const key = el.closest('[data-metric]')?.getAttribute('data-metric') ?? text;
      if (this._prevBigNums[key] !== undefined && this._prevBigNums[key] !== text) {
        el.classList.remove('flash');
        void (el as HTMLElement).offsetWidth; // force reflow
        el.classList.add('flash');
      }
      this._prevBigNums[key] = text;
    });
  }

  private _getTheme() {
    return ROLE_THEME_CONFIGS[this.roleId] || ROLE_THEME_CONFIGS['ciso']
  }

  private _sparkline(data: number[], width = 120, height = 24, color = '#3b82f6') {
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const points = data.map((v, i) => `${i * (width / (data.length - 1))},${height - ((v - min) / range * (height - 4) + 2)}`).join(' ')
    return unsafeSVG(`<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M ${points}" stroke="${color}" stroke-width="2" fill="none"/><path d="M ${points} L ${width},${height} L 0,${height} Z" fill="${color}" fill-opacity="0.1"/></svg>`)
  }

  private _barChart(data: { label?: string; value: number; color: string }[], width = 100, height = 20) {
    const max = Math.max(...data.map(d => d.value)) || 1
    const barWidth = width / data.length - 2
    return unsafeSVG(`<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      ${data.map((d, i) => `<rect x="${i * (barWidth + 2)}" y="${height - (d.value / max * height)}" width="${barWidth}" height="${d.value / max * height}" fill="${d.color}" rx="1"/>`).join('')}
    </svg>`)
  }

  private _progressBar(value: number, max = 100, width = 60, color = '#3b82f6') {
    const percent = Math.min(Math.max(value / max, 0), 1) * 100
    return html`<div class="progress-bar" style="width: ${width}px"><div class="progress-fill" style="width: ${percent}%; background: ${color}"></div></div>`
  }

  private _radar(data: { label: string; value: number; color: string }[], size = 60) {
    const max = Math.max(...data.map(d => d.value)) || 1
    const points = data.map((d, i) => {
      const angle = (i * 2 * Math.PI / data.length) - Math.PI / 2
      const r = (d.value / max) * (size / 2 - 4)
      return `${size / 2 + r * Math.cos(angle)},${size / 2 + r * Math.sin(angle)}`
    }).join(' ')
    return unsafeSVG(`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="${points}" fill="${data[0]?.color || '#3b82f6'}" fill-opacity="0.2" stroke="${data[0]?.color || '#3b82f6'}" stroke-width="1"/>
    </svg>`)
  }

  // ─── SKILL.md 可视化图表：gauge / donut / bar / line ───

  /** 半圆仪表盘 (对应 SKILL.md risk-dashboard gauge) */
  private _gauge(value: number, max = 100, label = '', size = 80, color = '#3b82f6') {
    const pct = Math.min(Math.max(value / max, 0), 1);
    const r = size / 2 - 6;
    const cx = size / 2;
    const cy = size / 2 + 4;
    const arc = (p: number) => {
      const a = Math.PI * p;
      return `M ${cx - r} ${cy} A ${r} ${r} 0 ${p > 1 ? 1 : 0} 1 ${cx - r + 2 * r * p} ${cy - Math.sin(a) * r + (Math.sin(a) === 0 ? 0 : 0)}`;
      // Simpler: just use start/end angles
    };
    // Start: π (180°), End: 0 (0°) — semicircle from left to right
    const startAngle = Math.PI;
    const endAngleFull = 0;
    const sweepAngle = Math.PI * pct;
    const endAngle = startAngle - sweepAngle;
    const x1 = cx - r, y1 = cy;
    const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
    const largeArc = pct > 0.5 ? 1 : 0;
    return unsafeSVG(`<svg width="${size}" height="${size * 0.6 + 16}" viewBox="0 -${size * 0.1} ${size} ${size * 0.6 + 16}" xmlns="http://www.w3.org/2000/svg">
      <path d="M ${x1} ${y1} A ${r} ${r} 0 0 1 ${cx + r} ${y1}" fill="none" stroke="#1e293b" stroke-width="6" stroke-linecap="round"/>
      <path d="M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
      <text x="${cx}" y="${cy - 6}" text-anchor="middle" fill="${color}" font-size="14" font-weight="bold">${value}</text>
      <text x="${cx}" y="${cy + 8}" text-anchor="middle" fill="#64748b" font-size="8">${label || `/${max}`}</text>
    </svg>`);
  }

  /** 环形图 (对应 SKILL.md budget-allocation donut) */
  private _donut(segments: { label: string; value: number; color: string }[], size = 70) {
    const total = segments.reduce((s, d) => s + d.value, 0) || 1;
    const r = size / 2 - 8;
    const cx = size / 2, cy = size / 2;
    let cumAngle = -Math.PI / 2; // start at top
    const arcs = segments.map(seg => {
      const angle = (seg.value / total) * 2 * Math.PI;
      const x1 = cx + r * Math.cos(cumAngle);
      const y1 = cy + r * Math.sin(cumAngle);
      cumAngle += angle;
      const x2 = cx + r * Math.cos(cumAngle);
      const y2 = cy + r * Math.sin(cumAngle);
      const large = angle > Math.PI ? 1 : 0;
      return `<path d="M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${seg.color}" opacity="0.85"/>`;
    });
    const ir = r * 0.55; // inner radius for donut hole
    return unsafeSVG(`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      ${arcs.join('\n')}
      <circle cx="${cx}" cy="${cy}" r="${ir}" fill="#0f172a"/>
      ${segments.slice(0, 3).map((s, i) => `<circle cx="${cx - 8 + i * 8}" cy="${size - 4}" r="3" fill="${s.color}"/>`).join('')}
    </svg>`);
  }

  /** 折线图 (对应 SKILL.md incident-trends line) */
  private _lineChart(data: { label: string; values: number[]; color: string }[], width = 200, height = 60) {
    const allVals = data.flatMap(d => d.values);
    const max = Math.max(...allVals, 1);
    const min = Math.min(...allVals, 0);
    const range = max - min || 1;
    const step = width / (data[0]?.values.length - 1 || 1);
    const lines = data.map(series => {
      const pts = series.values.map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / range * (height - 8) + 4)).toFixed(1)}`).join(' ');
      return `<path d="M ${pts}" fill="none" stroke="${series.color}" stroke-width="2"/>`;
    });
    const labels = data[0]?.values.map((_, i) => {
      if (data[0].values.length <= 12 || i % 2 === 0) return `<text x="${(i * step).toFixed(1)}" y="${height + 12}" text-anchor="middle" fill="#475569" font-size="7">${['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'][i] || ''}</text>`;
      return '';
    }) || [];
    return unsafeSVG(`<svg width="${width}" height="${height + 16}" viewBox="0 0 ${width} ${height + 16}" xmlns="http://www.w3.org/2000/svg">
      ${[0, 0.25, 0.5, 0.75, 1].map(p => `<line x1="0" y1="${(4 + p * (height - 8)).toFixed(1)}" x2="${width}" y2="${(4 + p * (height - 8)).toFixed(1)}" stroke="#1e293b" stroke-width="0.5"/>`).join('\n')}
      ${lines.join('\n')}
      ${labels.join('\n')}
    </svg>`);
  }

  /** 多条形图 (对应 SKILL.md compliance-status bar) */
  private _multiBarChart(categories: { label: string; value: number; color: string }[], width = 180, height = 50) {
    const max = Math.max(...categories.map(c => c.value), 1);
    const barH = Math.min((height - 4) / categories.length - 2, 10);
    return unsafeSVG(`<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      ${categories.map((c, i) => {
        const y = i * (barH + 3) + 2;
        const w = (c.value / max) * (width - 50);
        return `<text x="0" y="${y + barH - 1}" fill="#94a3b8" font-size="7">${c.label}</text>
          <rect x="44" y="${y}" width="${w.toFixed(1)}" height="${barH}" rx="2" fill="${c.color}" opacity="0.85"/>
          <text x="${48 + w}" y="${y + barH - 1}" fill="#e2e8f0" font-size="7">${c.value}%</text>`;
      }).join('\n')}
    </svg>`);
  }

  /** 渲染 SKILL.md 定义的 Visualization 区域（指标卡下方） */
  private _renderVizZone(roleId: string) {
    // SKILL.md 定义的各角色可视化配置
    const vizConfig: Record<string, Array<{ type: 'gauge'|'donut'|'bar'|'line'; title: string; width: string }>> = {
      'ciso': [
        { type: 'gauge', title: '企业风险仪表盘', width: '25%' },
        { type: 'bar', title: '合规状态追踪', width: '25%' },
        { type: 'donut', title: '安全预算分配', width: '25%' },
        { type: 'line', title: '安全事件趋势', width: '25%' },
      ],
      'security-expert': [
        { type: 'donut', title: '漏洞分布概览', width: '33%' },
        { type: 'line', title: '威胁时间线', width: '33%' },
        { type: 'bar', title: 'CVSS 分布', width: '34%' },
      ],
    };
    const configs = vizConfig[roleId];
    if (!configs) return nothing;

    // 各角色的 mock 数据
    const mockData: Record<string, Array<unknown>> = {
      'ciso': [
        { gauge: { value: 44, max: 100, color: '#fbbf24', label: '/100 风险' } },
        { bars: [
          { label: 'GDPR', value: 93, color: '#22c55e' },
          { label: 'PIPL', value: 87, color: '#3b82f6' },
          { label: '网安法', value: 91, color: '#22c55e' },
          { label: 'ISO27001', value: 85, color: '#f59e0b' },
        ]},
        { donut: [
          { label: '技术', value: 45, color: '#3b82f6' },
          { label: '合规', value: 25, color: '#8b5cf6' },
          { label: '运营', value: 20, color: '#06b6d4' },
          { label: '培训', value: 10, color: '#22c55e' },
        ]},
        { lines: [
          { label: '严重', values: [2,3,1,4,2,3,1,2,3,2,1,2], color: '#ef4444' },
          { label: '高危', values: [5,4,6,5,7,4,6,5,4,6,5,4], color: '#fd7e14' },
          { label: '中危', values: [12,15,13,14,16,14,13,15,14,13,15,14], color: '#ffc107' },
        ]},
      ],
      'security-expert': [
        { donut: [
          { label: 'Critical', value: 8, color: '#ef4444' },
          { label: 'High', value: 22, color: '#fd7e14' },
          { label: 'Medium', value: 35, color: '#ffc107' },
          { label: 'Low', value: 15, color: '#22c55e' },
        ]},
        { lines: [
          { label: '威胁', values: [3,5,4,7,6,8,5,7,9,6,8,7], color: '#ef4444' },
          { label: '处置', values: [2,4,3,5,5,6,4,6,7,5,7,6], color: '#22c55e' },
        ]},
        { bars: [
          { label: '0-3', value: 12, color: '#22c55e' },
          { label: '3-6', value: 28, color: '#ffc107' },
          { label: '6-9', value: 18, color: '#fd7e14' },
          { label: '9-10', value: 7, color: '#ef4444' },
        ]},
      ],
    };
    const data = mockData[roleId];
    if (!data) return nothing;

    return html`
      <div class="zone zone-viz" style="background:#080e1a;">
        <div class="zone-label">📊 SKILL 可视化（SKILL.md 定义）</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 14px 10px;">
          ${configs.map((cfg, i) => {
            const d = data[i] as any;
            let chart;
            if (cfg.type === 'gauge' && d.gauge) chart = this._gauge(d.gauge.value, d.gauge.max, d.gauge.label, 80, d.gauge.color);
            else if (cfg.type === 'bar' && d.bars) chart = this._multiBarChart(d.bars, 180, 50);
            else if (cfg.type === 'donut' && d.donut) chart = this._donut(d.donut, 70);
            else if (cfg.type === 'line' && d.lines) chart = this._lineChart(d.lines, 200, 55);
            else chart = html`<span style="color:#475569;font-size:10px;">无数据</span>`;
            return html`
              <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:8px 10px;">
                <div style="font-size:10px;color:#94a3b8;margin-bottom:4px;">${cfg.title}</div>
                <div style="display:flex;justify-content:center;">${chart}</div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  // ─── Dark Side 能力面板（SKILL.md dark capabilities） ───

  /** SKILL.md 各角色的 dark capabilities 定义 */
  private static readonly DARK_CAPS: Record<string, Array<{ label: string; toolId: string; severity: 'high' | 'medium' | 'low' }>> = {
    'ciso': [
      { label: '合规漏洞挖掘', toolId: 'compliance-chk', severity: 'high' },
      { label: '监管渗透测试', toolId: 'compliance-chk', severity: 'high' },
      { label: '架构弱点评估', toolId: 'threat-model', severity: 'medium' },
      { label: '法律风险分析', toolId: 'risk-score', severity: 'medium' },
      { label: '合规绕过设计', toolId: 'compliance-chk', severity: 'high' },
      { label: '内部威胁检测', toolId: 'alert-queue', severity: 'high' },
      { label: '高管攻击模拟', toolId: 'pen-test', severity: 'medium' },
      { label: '供应链攻击评估', toolId: 'vendor-eval', severity: 'medium' },
    ],
    'secuclaw-commander': [
      { label: '全面渗透测试', toolId: 'pen-test', severity: 'high' },
      { label: '红队演练', toolId: 'pen-test', severity: 'high' },
      { label: 'APT模拟', toolId: 'incident-mgmt', severity: 'high' },
      { label: '供应链攻击', toolId: 'vendor-eval', severity: 'high' },
      { label: '内部威胁评估', toolId: 'alert-queue', severity: 'medium' },
      { label: '高管攻击模拟', toolId: 'pen-test', severity: 'medium' },
      { label: '合规渗透', toolId: 'compliance-chk', severity: 'medium' },
      { label: '架构弱点分析', toolId: 'threat-model', severity: 'medium' },
      { label: '业务中断攻击', toolId: 'bcp-mgmt', severity: 'high' },
      { label: '数据窃取模拟', toolId: 'data-map', severity: 'high' },
      { label: '持久化评估', toolId: 'vuln-scan', severity: 'medium' },
    ],
    'security-ops': [
      { label: '渗透测试', toolId: 'pen-test', severity: 'high' },
      { label: '红队演练', toolId: 'pen-test', severity: 'high' },
      { label: '攻击路径发现', toolId: 'threat-intel', severity: 'high' },
      { label: '漏洞利用验证', toolId: 'vuln-scan', severity: 'high' },
      { label: '内网横向移动', toolId: 'incident-mgmt', severity: 'medium' },
      { label: '权限提升', toolId: 'iam-config', severity: 'medium' },
      { label: '数据窃取模拟', toolId: 'data-map', severity: 'high' },
      { label: '社工攻击模拟', toolId: 'threat-intel', severity: 'medium' },
    ],
    'security-expert': [
      { label: '渗透测试', toolId: 'pen-test', severity: 'high' },
      { label: '红队演练', toolId: 'pen-test', severity: 'high' },
      { label: '漏洞利用', toolId: 'vuln-scan', severity: 'high' },
      { label: '权限提升', toolId: 'iam-config', severity: 'medium' },
      { label: '横向移动', toolId: 'incident-mgmt', severity: 'medium' },
      { label: '数据窃取', toolId: 'data-map', severity: 'high' },
      { label: '社会工程', toolId: 'threat-intel', severity: 'medium' },
      { label: '无线攻击', toolId: 'vuln-scan', severity: 'low' },
    ],
    'security-architect': [
      { label: '架构弱点分析', toolId: 'threat-model', severity: 'high' },
      { label: '攻击路径绘制', toolId: 'threat-model', severity: 'high' },
      { label: '信任边界渗透', toolId: 'zero-trust', severity: 'high' },
      { label: '架构绕过设计', toolId: 'cloud-security', severity: 'medium' },
      { label: '供应链攻击评估', toolId: 'vendor-eval', severity: 'medium' },
      { label: '横向移动架构', toolId: 'iam-config', severity: 'medium' },
      { label: '持久化架构', toolId: 'vuln-scan', severity: 'medium' },
      { label: '降级攻击模拟', toolId: 'patch-mgmt', severity: 'low' },
    ],
    'privacy-officer': [
      { label: '隐私合规渗透', toolId: 'gdpr-audit', severity: 'high' },
      { label: '数据流向追踪', toolId: 'data-map', severity: 'high' },
      { label: '合规漏洞挖掘', toolId: 'compliance-chk', severity: 'high' },
      { label: '个人信息窃取', toolId: 'data-map', severity: 'high' },
      { label: '第三方数据泄露', toolId: 'vendor-eval', severity: 'medium' },
      { label: '隐私政策绕过', toolId: 'policy-mgmt', severity: 'medium' },
      { label: '数据最小化测试', toolId: 'gdpr-audit', severity: 'low' },
    ],
    'business-security-officer': [
      { label: '业务逻辑漏洞挖掘', toolId: 'risk-score', severity: 'high' },
      { label: '业务流程攻击模拟', toolId: 'bcp-mgmt', severity: 'high' },
      { label: '供应链攻击面分析', toolId: 'vendor-eval', severity: 'medium' },
      { label: '业务中断攻击评估', toolId: 'bcp-mgmt', severity: 'high' },
      { label: '经济影响分析', toolId: 'cost-calc', severity: 'medium' },
      { label: '竞争对手情报', toolId: 'threat-intel', severity: 'low' },
      { label: '业务欺诈检测', toolId: 'alert-queue', severity: 'medium' },
      { label: '业务流程绕过', toolId: 'policy-mgmt', severity: 'medium' },
    ],
    'supply-chain-security': [
      { label: '供应链渗透测试', toolId: 'sbom-scan', severity: 'high' },
      { label: '第三方漏洞挖掘', toolId: 'third-party-risk', severity: 'high' },
      { label: '供应商攻击模拟', toolId: 'vendor-eval', severity: 'high' },
      { label: '供应链弱点分析', toolId: 'sbom-scan', severity: 'medium' },
      { label: '数据泄露路径分析', toolId: 'data-map', severity: 'high' },
      { label: '合同漏洞挖掘', toolId: 'contract-review', severity: 'medium' },
      { label: '供应商持续性攻击', toolId: 'vendor-eval', severity: 'medium' },
      { label: '供应链勒索评估', toolId: 'risk-score', severity: 'high' },
    ],
  };

  @state() private _darkExpanded = true;
  @state() private _darkActiveCap: string | null = null;
  @state() private _darkSimRunning = false;
  @state() private _darkSimResult: Record<string, any> | null = null;

  /** Phase 2: Dark Mode Attack Simulation Data */
  private static readonly DARK_SIMULATIONS = ImportedDarkSimulations;

  private _runDarkSimulation(capKey: string) {
    const sims = ScRoleCommander.DARK_SIMULATIONS[this.roleId];
    if (!sims || !sims[capKey]) return;
    this._darkSimRunning = true;
    this._darkSimResult = null;
    this.requestUpdate();
    // Simulate async attack execution
    setTimeout(() => {
      this._darkSimRunning = false;
      this._darkSimResult = { key: capKey, ...sims[capKey] };
      this.requestUpdate();
    }, 1500 + Math.random() * 1000);
  }

  private _renderDarkZone(roleId: string) {
    const caps = ScRoleCommander.DARK_CAPS[roleId];
    if (!caps || caps.length === 0) return nothing;
    const sims = ScRoleCommander.DARK_SIMULATIONS[roleId] || {};
    const sevColors: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#64748b' };
    const sevLabels: Record<string, string> = { high: '高危', medium: '中危', low: '低危' };

    return html`
      <div class="zone zone-dark" style="background:linear-gradient(135deg,#0a0a0a 0%,#1a0a0a 100%);border:1px solid #3b1111;border-radius:8px;margin:0 14px 8px;">
        <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;" @click=${() => { this._darkExpanded = !this._darkExpanded; }}>
          <span style="font-size:12px;font-weight:600;color:#ef4444;">⚔️ Dark Side 攻防模拟</span>
          <span style="font-size:10px;color:#64748b;">${caps.length} 项攻击模拟 · ${Object.keys(sims).length} 项可执行</span>
          <span style="margin-left:auto;font-size:10px;color:#475569;">${this._darkExpanded ? '▾ 收起' : '▸ 展开'}</span>
        </div>
        ${this._darkExpanded ? html`
          <!-- Attack simulation tabs -->
          <div style="display:flex;flex-wrap:wrap;gap:4px;padding:0 12px 6px;">
            ${caps.map(c => {
              const hasSim = !!sims[c.label];
              return html`<button
                style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:6px;border:1px solid ${this._darkActiveCap === c.label ? sevColors[c.severity] : `${sevColors[c.severity]}33`};background:${this._darkActiveCap === c.label ? `${sevColors[c.severity]}22` : `${sevColors[c.severity]}11`};color:#e2e8f0;font-size:11px;cursor:pointer;transition:all 0.15s;${hasSim ? 'font-weight:600;' : ''}"
                @click=${(e: Event) => { e.stopPropagation(); this._darkActiveCap = this._darkActiveCap === c.label ? null : c.label; this._darkSimResult = null; }}
              >
                <span style="width:6px;height:6px;border-radius:50%;background:${sevColors[c.severity]};"></span>
                ${c.label}
                ${hasSim ? html`<span style="font-size:9px;color:#22c55e;">▶</span>` : ''}
              </button>`;
            })}
          </div>
          <!-- Simulation panel -->
          ${this._darkActiveCap && sims[this._darkActiveCap] ? html`
            <div style="margin:0 12px 10px;background:#111;border-radius:6px;border:1px solid #2a1515;overflow:hidden;">
              ${(() => {
                const sim = sims[this._darkActiveCap];
                const phaseColors: Record<string, string> = { pass: '#22c55e', warn: '#f59e0b', fail: '#ef4444' };
                const phaseLabels: Record<string, string> = { pass: '通过', warn: '警告', fail: '失败' };
                const sevBadgeColors: Record<string, string> = { critical: '#dc2626', high: '#ef4444', medium: '#f59e0b', low: '#64748b' };
                return html`
                  <!-- Header -->
                  <div style="padding:8px 12px;border-bottom:1px solid #1a1a1a;display:flex;align-items:center;gap:8px;">
                    <span style="font-size:13px;font-weight:700;color:#ef4444;">${sim.name}</span>
                    <span style="font-size:10px;color:#94a3b8;">${sim.desc}</span>
                    <button ?disabled=${this._darkSimRunning} style="margin-left:auto;padding:4px 12px;border-radius:4px;border:1px solid #ef4444;background:${this._darkSimRunning ? '#ef444422' : '#ef4444'};color:#fff;font-size:11px;cursor:${this._darkSimRunning ? 'wait' : 'pointer'};"
                      @click=${(e: Event) => { e.stopPropagation(); this._runDarkSimulation(this._darkActiveCap!); }}>
                      ${this._darkSimRunning ? html`<span style="display:inline-block;animation:spin 1s linear infinite;">⏳</span> 执行中...` : '🚀 执行模拟'}
                    </button>
                  </div>
                  <!-- Kill Chain Phase -->
                  <div style="padding:8px 12px;display:flex;gap:4px;align-items:center;">
                    ${sim.phases.map((p, i) => html`
                      <div style="display:flex;align-items:center;gap:3px;padding:3px 6px;border-radius:4px;background:${phaseColors[p.status]}15;border:1px solid ${phaseColors[p.status]}40;">
                        <span style="font-size:10px;">${p.icon}</span>
                        <span style="font-size:9px;color:${phaseColors[p.status]};font-weight:600;">${p.label}</span>
                        <span style="font-size:8px;color:${phaseColors[p.status]}80;">${phaseLabels[p.status]}</span>
                      </div>
                      ${i < sim.phases.length - 1 ? html`<span style="color:#333;font-size:8px;">→</span>` : ''}
                    `)}
                  </div>
                  <!-- MITRE ATT&CK -->
                  <div style="padding:4px 12px;display:flex;flex-wrap:wrap;gap:3px;">
                    <span style="font-size:9px;color:#64748b;width:100%;margin-bottom:2px;">MITRE ATT&CK 映射:</span>
                    ${sim.mitre.map(m => html`<span style="font-size:9px;padding:1px 6px;border-radius:3px;background:#1e293b;color:#94a3b8;border:1px solid #334155;">${m}</span>`)}
                  </div>
                  <!-- CIA Impact Bars -->
                  <div style="padding:6px 12px;display:flex;gap:12px;">
                    <div style="flex:1;"><span style="font-size:9px;color:#64748b;">机密性</span><div style="height:4px;background:#1e293b;border-radius:2px;margin-top:2px;"><div style="height:100%;width:${sim.impact.confidentiality}%;background:#ef4444;border-radius:2px;"></div></div><span style="font-size:8px;color:#ef4444;">${sim.impact.confidentiality}%</span></div>
                    <div style="flex:1;"><span style="font-size:9px;color:#64748b;">完整性</span><div style="height:4px;background:#1e293b;border-radius:2px;margin-top:2px;"><div style="height:100%;width:${sim.impact.integrity}%;background:#f59e0b;border-radius:2px;"></div></div><span style="font-size:8px;color:#f59e0b;">${sim.impact.integrity}%</span></div>
                    <div style="flex:1;"><span style="font-size:9px;color:#64748b;">可用性</span><div style="height:4px;background:#1e293b;border-radius:2px;margin-top:2px;"><div style="height:100%;width:${sim.impact.availability}%;background:#3b82f6;border-radius:2px;"></div></div><span style="font-size:8px;color:#3b82f6;">${sim.impact.availability}%</span></div>
                  </div>
                  <!-- Findings -->
                  <div style="padding:4px 12px 6px;">
                    <span style="font-size:9px;color:#64748b;">发现项 (${sim.findings.length}):</span>
                    ${sim.findings.map(f => html`
                      <div style="margin-top:3px;padding:4px 8px;border-radius:4px;background:${sevBadgeColors[f.severity]}10;border-left:2px solid ${sevBadgeColors[f.severity]};">
                        <div style="font-size:10px;color:#e2e8f0;font-weight:600;">${f.title} <span style="font-size:8px;color:${sevBadgeColors[f.severity]};text-transform:uppercase;">${f.severity}</span></div>
                        <div style="font-size:9px;color:#94a3b8;">${f.detail}</div>
                      </div>
                    `)}
                  </div>
                  <!-- Simulation Result -->
                  ${this._darkSimRunning ? html`
                    <div style="padding:12px;text-align:center;color:#ef4444;font-size:12px;">
                      <span style="display:inline-block;animation:spin 1s linear infinite;">⚙️</span> 攻击模拟执行中...
                    </div>
                  ` : this._darkSimResult && this._darkSimResult.key === this._darkActiveCap ? html`
                    <div style="padding:8px 12px;margin:0 12px 8px;background:#0a1a0a;border-radius:4px;border:1px solid #1a3a1a;">
                      <div style="font-size:10px;color:#22c55e;font-weight:600;margin-bottom:4px;">✅ 模拟完成</div>
                      <div style="font-size:11px;color:#e2e8f0;line-height:1.5;">${this._darkSimResult.mockResult}</div>
                    </div>
                  ` : html`
                    <div style="padding:8px 12px;text-align:center;color:#475569;font-size:10px;">
                      点击「执行模拟」启动攻击场景
                    </div>
                  `}
                `;
              })()}
            </div>
          ` : this._darkActiveCap && !sims[this._darkActiveCap] ? html`
            <div style="margin:0 12px 10px;padding:12px;background:#111;border-radius:6px;border:1px solid #2a1515;text-align:center;">
              <span style="font-size:10px;color:#475569;">该能力尚无交互模拟，点击可打开关联工具面板</span>
              <button style="display:block;margin:6px auto 0;padding:4px 12px;border-radius:4px;border:1px solid #334155;background:#1e293b;color:#e2e8f0;font-size:11px;cursor:pointer;"
                @click=${() => { const c = caps.find(x => x.label === this._darkActiveCap); if (c) this._openToolPanel(c.toolId); }}>
                🔧 打开 ${(() => { const c = caps.find(x => x.label === this._darkActiveCap); return c ? c.toolId : ''; })()} 面板
              </button>
            </div>
          ` : nothing}
        ` : nothing}
      </div>
    `;
  }

  // ─── 决策矩阵可视化（风险×合规×业务影响） ───

  private static readonly DECISION_CONFIGS: Record<string, {
    title: string; axes: Array<{ label: string; value: number; max: number; color: string }>;
    recommendation: string; recColor: string;
    pendingDecisions: Array<{ title: string; impact: string; urgency: string; urgencyColor: string }>;
  }> = {
    'ciso': {
      title: 'CISO 决策矩阵',
      axes: [
        { label: '风险', value: 44, max: 100, color: '#fbbf24' },
        { label: '合规', value: 91, max: 100, color: '#22c55e' },
        { label: '业务影响', value: 35, max: 100, color: '#3b82f6' },
        { label: '技术债务', value: 62, max: 100, color: '#ef4444' },
        { label: '资源', value: 68, max: 100, color: '#8b5cf6' },
      ],
      recommendation: '优先处理零信任架构缺口 + GDPR 差距整改（投入产出比最高）',
      recColor: '#f59e0b',
      pendingDecisions: [
        { title: '零信任二期采购', impact: '¥320万', urgency: '紧急', urgencyColor: '#ef4444' },
        { title: 'GDPR 差距整改', impact: '¥45万', urgency: '高', urgencyColor: '#f59e0b' },
        { title: 'SOC 升级方案', impact: '¥180万', urgency: '中', urgencyColor: '#3b82f6' },
      ],
    },
    'secuclaw-commander': {
      title: '指挥官决策矩阵',
      axes: [
        { label: '全域态势', value: 58, max: 100, color: '#f59e0b' },
        { label: '事件压力', value: 72, max: 100, color: '#ef4444' },
        { label: '协调效率', value: 65, max: 100, color: '#3b82f6' },
        { label: '响应速度', value: 80, max: 100, color: '#22c55e' },
      ],
      recommendation: 'APT C2 检测需优先加固，当前响应速度达标',
      recColor: '#22c55e',
      pendingDecisions: [
        { title: 'APT 应急响应', impact: 'P0', urgency: '紧急', urgencyColor: '#ef4444' },
        { title: '跨部门协调会议', impact: '6部门', urgency: '高', urgencyColor: '#f59e0b' },
      ],
    },
  };

  private _renderDecisionZone(roleId: string) {
    const cfg = ScRoleCommander.DECISION_CONFIGS[roleId];
    if (!cfg) return nothing;

    // Mini radar for decision axes
    const size = 100;
    const cx = size / 2, cy = size / 2, r = size / 2 - 12;
    const n = cfg.axes.length;
    const gridLevels = [0.25, 0.5, 0.75, 1.0];
    const angleStep = (2 * Math.PI) / n;
    const startAngle = -Math.PI / 2;

    const gridPaths = gridLevels.map(level => {
      const pts = Array.from({ length: n }, (_, i) => {
        const a = startAngle + i * angleStep;
        return `${cx + r * level * Math.cos(a)},${cy + r * level * Math.sin(a)}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="none" stroke="#1e293b" stroke-width="0.5"/>`;
    }).join('\n');

    const axisLines = Array.from({ length: n }, (_, i) => {
      const a = startAngle + i * angleStep;
      return `<line x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(a)}" y2="${cy + r * Math.sin(a)}" stroke="#1e293b" stroke-width="0.5"/>`;
    }).join('\n');

    const dataPoints = cfg.axes.map((ax, i) => {
      const a = startAngle + i * angleStep;
      const v = (ax.value / ax.max) * r;
      return { x: cx + v * Math.cos(a), y: cy + v * Math.sin(a), label: ax.label, color: ax.color };
    });

    const dataPoly = dataPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const labelsSvg = cfg.axes.map((ax, i) => {
      const a = startAngle + i * angleStep;
      const lx = cx + (r + 10) * Math.cos(a);
      const ly = cy + (r + 10) * Math.sin(a);
      return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" fill="${ax.color}" font-size="8">${ax.label}</text>`;
    }).join('\n');

    const radarSvg = `<svg width="${size + 24}" height="${size + 24}" viewBox="-12 -12 ${size + 24} ${size + 24}" xmlns="http://www.w3.org/2000/svg">
      ${gridPaths}
      ${axisLines}
      <polygon points="${dataPoly}" fill="#3b82f620" stroke="#3b82f6" stroke-width="1.5"/>
      ${dataPoints.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="${p.color}"/>`).join('\n')}
      ${labelsSvg}
    </svg>`;

    return html`
      <div class="zone zone-decision" style="background:#0b1120;border:1px solid #1e3a5f;border-radius:8px;margin:0 14px 8px;">
        <div style="padding:8px 12px;">
          <div style="font-size:11px;font-weight:600;color:#60a5fa;margin-bottom:6px;">🧭 ${cfg.title}</div>
          <div style="display:flex;gap:12px;align-items:flex-start;">
            <div style="flex:0 0 auto;">${unsafeSVG(radarSvg)}</div>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;gap:6px;margin-bottom:6px;">
                ${cfg.axes.map(ax => html`
                  <div style="flex:1;text-align:center;">
                    <div style="font-size:16px;font-weight:700;color:${ax.color}">${ax.value}</div>
                    <div style="font-size:9px;color:#64748b;">${ax.label}</div>
                  </div>
                `)}
              </div>
              <div style="font-size:10px;color:${cfg.recColor};padding:4px 8px;background:${cfg.recColor}11;border-radius:4px;border-left:3px solid ${cfg.recColor};">
                💡 ${cfg.recommendation}
              </div>
              ${cfg.pendingDecisions.length > 0 ? html`
                <div style="margin-top:6px;">
                  ${cfg.pendingDecisions.map(d => html`
                    <div style="display:flex;align-items:center;gap:6px;font-size:10px;padding:3px 0;">
                      <span style="width:6px;height:6px;border-radius:50%;background:${d.urgencyColor};"></span>
                      <span style="color:#e2e8f0;">${d.title}</span>
                      <span style="color:#64748b;">· ${d.impact}</span>
                      <span style="margin-left:auto;font-size:9px;padding:1px 5px;border-radius:3px;background:${d.urgencyColor}15;color:${d.urgencyColor};">${d.urgency}</span>
                    </div>
                  `)}
                </div>
              ` : nothing}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ─── Legal 维度面板（SKILL.md legal capabilities） ───

  private static readonly LEGAL_CONFIGS: Record<string, {
    regulations: Array<{ name: string; status: 'compliant' | 'partial' | 'gap'; score: number; color: string; detail: string }>;
    riskItems: Array<{ desc: string; level: string; levelColor: string }>;
  }> = {
    'ciso': {
      regulations: [
        { name: 'GDPR', status: 'compliant', score: 93, color: '#22c55e', detail: '数据保护官已任命，DPIA 完成' },
        { name: 'PIPL', status: 'partial', score: 87, color: '#3b82f6', detail: '跨境传输条款待更新' },
        { name: '网络安全法', status: 'compliant', score: 91, color: '#22c55e', detail: '等保三级已通过' },
        { name: '数据安全法', status: 'partial', score: 82, color: '#f59e0b', detail: '数据分类分级进行中' },
        { name: 'ISO 27001', status: 'partial', score: 85, color: '#f59e0b', detail: '外审预计 Q3 完成' },
      ],
      riskItems: [
        { desc: '跨境数据传输条款缺失 — PIPL 合规风险', level: '高', levelColor: '#ef4444' },
        { desc: '供应商合同安全条款覆盖率不足', level: '中', levelColor: '#f59e0b' },
      ],
    },
    'privacy-officer': {
      regulations: [
        { name: 'GDPR', status: 'compliant', score: 92, color: '#22c55e', detail: 'DPO 已任命，ROPA 已建立' },
        { name: 'CCPA', status: 'partial', score: 78, color: '#f59e0b', detail: '消费者权利响应流程待完善' },
        { name: 'PIPL', status: 'partial', score: 85, color: '#3b82f6', detail: '个人信息清单待更新' },
        { name: '个人信息保护法', status: 'partial', score: 88, color: '#3b82f6', detail: '隐私影响评估模板待审批' },
      ],
      riskItems: [
        { desc: '隐私政策未覆盖最新数据处理活动', level: '高', levelColor: '#ef4444' },
        { desc: '第三方数据共享协议过期 — 3 份', level: '高', levelColor: '#ef4444' },
        { desc: '员工隐私培训完成率低于目标', level: '中', levelColor: '#f59e0b' },
      ],
    },
    'supply-chain-security': {
      regulations: [
        { name: '供应商合规', status: 'partial', score: 80, color: '#f59e0b', detail: '85% 供应商已完成安全评估' },
        { name: '数据保护协议', status: 'gap', score: 65, color: '#ef4444', detail: 'DPA 签署率 65%' },
        { name: 'GDPR 供应链', status: 'partial', score: 75, color: '#f59e0b', detail: '数据导入方评估进行中' },
        { name: '跨境数据传输', status: 'gap', score: 55, color: '#ef4444', detail: 'SCC 模板待更新' },
      ],
      riskItems: [
        { desc: 'DPA 签署率不足 — 35% 供应商未签', level: '高', levelColor: '#ef4444' },
        { desc: 'SCC 标准合同条款过期', level: '高', levelColor: '#ef4444' },
      ],
    },
  };

  private _renderLegalZone(roleId: string) {
    const cfg = ScRoleCommander.LEGAL_CONFIGS[roleId];
    if (!cfg) return nothing;
    const statusIcon: Record<string, string> = { compliant: '✅', partial: '⚠️', gap: '🔴' };

    return html`
      <div class="zone zone-legal" style="background:#0b1120;border:1px solid #1e3a5f;border-radius:8px;margin:0 14px 8px;">
        <div style="padding:8px 12px;">
          <div style="font-size:11px;font-weight:600;color:#a78bfa;margin-bottom:6px;">⚖️ Legal 合规面板 · SKILL.md 定义</div>
          <div style="display:flex;gap:8px;margin-bottom:6px;">
            ${cfg.regulations.map(r => html`
              <div style="flex:1;background:#0f172a;border:1px solid #1e293b;border-radius:6px;padding:6px 8px;text-align:center;">
                <div style="font-size:10px;color:#94a3b8;margin-bottom:2px;">${statusIcon[r.status]} ${r.name}</div>
                <div style="font-size:18px;font-weight:700;color:${r.color}">${r.score}%</div>
                <div style="font-size:8px;color:#475569;margin-top:2px;line-height:1.3;">${r.detail}</div>
              </div>
            `)}
          </div>
          ${cfg.riskItems.length > 0 ? html`
            <div style="border-top:1px solid #1e293b;padding-top:4px;">
              ${cfg.riskItems.map(ri => html`
                <div style="display:flex;align-items:center;gap:4px;font-size:10px;padding:2px 0;">
                  <span style="width:5px;height:5px;border-radius:50%;background:${ri.levelColor};flex-shrink:0;"></span>
                  <span style="color:#e2e8f0;">${ri.desc}</span>
                  <span style="margin-left:auto;font-size:9px;padding:0 4px;border-radius:2px;background:${ri.levelColor}15;color:${ri.levelColor};">${ri.level}</span>
                </div>
              `)}
            </div>
          ` : nothing}
        </div>
      </div>
    `;
  }


  // ─── MITRE ATT&CK & SCF 覆盖度面板 ───

  private static readonly FRAMEWORK_COVERAGE: Record<string, {
    mitre: { covered: number; total: number; topGaps: string[] };
    scf: { covered: number; total: number; topGaps: string[] };
  }> = {
    'ciso': { mitre: { covered: 187, total: 201, topGaps: ['T1059.001', 'T1190', 'T1078'] }, scf: { covered: 92, total: 155, topGaps: ['ISE-03', 'NET-02', 'DEV-03'] } },
    'secuclaw-commander': { mitre: { covered: 175, total: 201, topGaps: ['T1059.001', 'T1566', 'T1078'] }, scf: { covered: 88, total: 155, topGaps: ['INC-02', 'RSK-02', 'GOV-03'] } },
    'security-ops': { mitre: { covered: 168, total: 201, topGaps: ['T1059.001', 'T1190', 'T1078'] }, scf: { covered: 85, total: 155, topGaps: ['MON-02', 'INC-01', 'MAL-01'] } },
    'security-expert': { mitre: { covered: 172, total: 201, topGaps: ['T1190', 'T1110', 'T1078'] }, scf: { covered: 90, total: 155, topGaps: ['VUL-01', 'PEN-01', 'TST-01'] } },
    'security-architect': { mitre: { covered: 180, total: 201, topGaps: ['T1059.001', 'T1190', 'T1566'] }, scf: { covered: 95, total: 155, topGaps: ['ISE-03', 'NET-01', 'CLD-02'] } },
    'privacy-officer': { mitre: { covered: 120, total: 201, topGaps: ['T1530', 'T1213', 'T1005'] }, scf: { covered: 78, total: 155, topGaps: ['DAT-01', 'DAT-02', 'PRI-01'] } },
    'business-security-officer': { mitre: { covered: 140, total: 201, topGaps: ['T1059.001', 'T1190', 'T1490'] }, scf: { covered: 82, total: 155, topGaps: ['BCD-01', 'BCD-02', 'RSK-01'] } },
    'supply-chain-security': { mitre: { covered: 130, total: 201, topGaps: ['T1195', 'T1199', 'T1078'] }, scf: { covered: 75, total: 155, topGaps: ['THD-01', 'THD-02', 'CNT-01'] } },
  };

  @state() private _showFramework = false;

  private _renderFrameworkZone(roleId: string) {
    const cfg = ScRoleCommander.FRAMEWORK_COVERAGE[roleId];
    if (!cfg) return nothing;
    const mitrePct = Math.round((cfg.mitre.covered / cfg.mitre.total) * 100);
    const scfPct = Math.round((cfg.scf.covered / cfg.scf.total) * 100);
    return html`
      <div class="zone zone-framework" style="background:#0b1120;border:1px solid #1e293b;border-radius:8px;margin:0 14px 8px;">
        <div style="display:flex;align-items:center;gap:8px;padding:6px 12px;cursor:pointer;" @click=${() => { this._showFramework = !this._showFramework; }}>
          <span style="font-size:11px;font-weight:600;color:#67e8f9;">🎯 安全框架覆盖度</span>
          <span style="font-size:9px;color:#64748b;">MITRE ${mitrePct}% · SCF ${scfPct}%</span>
          <span style="margin-left:auto;font-size:9px;color:#475569;">${this._showFramework ? '▾' : '▸'}</span>
        </div>
        ${this._showFramework ? html`
          <div style="padding:0 12px 8px;display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div style="background:#0f172a;border-radius:6px;padding:8px;">
              <div style="font-size:10px;color:#94a3b8;margin-bottom:4px;">🔴 MITRE ATT&CK</div>
              <div style="font-size:20px;font-weight:700;color:#ef4444;">${mitrePct}%</div>
              <div style="font-size:9px;color:#475569;">${cfg.mitre.covered} / ${cfg.mitre.total} techniques</div>
              <div style="margin-top:4px;">${cfg.mitre.topGaps.map(g => html`<div style="font-size:9px;color:#f87171;">• ${g}</div>`)}</div>
            </div>
            <div style="background:#0f172a;border-radius:6px;padding:8px;">
              <div style="font-size:10px;color:#94a3b8;margin-bottom:4px;">🔵 SCF 安全控制框架</div>
              <div style="font-size:20px;font-weight:700;color:#3b82f6;">${scfPct}%</div>
              <div style="font-size:9px;color:#475569;">${cfg.scf.covered} / ${cfg.scf.total} controls</div>
              <div style="margin-top:4px;">${cfg.scf.topGaps.map(g => html`<div style="font-size:9px;color:#60a5fa;">• ${g}</div>`)}</div>
            </div>
          </div>
        ` : nothing}
      </div>
    `;
  }


  // ─── P3: 隐私计算技术面板（仅隐私官） + 工具使用指南面板（全部角色） ───

  private _renderPrivacyTechZone() {
    return html`
      <div style="background:#0b1120;border:1px solid #581c87;border-radius:8px;margin:0 14px 8px;padding:8px 12px;">
        <div style="font-size:11px;font-weight:600;color:#c084fc;margin-bottom:6px;">🔬 隐私计算技术 · SKILL.md Technology</div>
        <div style="display:flex;gap:8px;">
          <div style="flex:1;background:#0f172a;border-radius:6px;padding:6px 8px;text-align:center;">
            <div style="font-size:9px;color:#94a3b8;">差分隐私</div>
            <div style="font-size:14px;font-weight:700;color:#22c55e;">已部署</div>
            <div style="font-size:8px;color:#475569;">ε=1.2, 用户行为统计</div>
          </div>
          <div style="flex:1;background:#0f172a;border-radius:6px;padding:6px 8px;text-align:center;">
            <div style="font-size:9px;color:#94a3b8;">同态加密</div>
            <div style="font-size:14px;font-weight:700;color:#f59e0b;">试点中</div>
            <div style="font-size:8px;color:#475569;">CKKS方案, 金融数据</div>
          </div>
          <div style="flex:1;background:#0f172a;border-radius:6px;padding:6px 8px;text-align:center;">
            <div style="font-size:9px;color:#94a3b8;">联邦学习</div>
            <div style="font-size:14px;font-weight:700;color:#3b82f6;">规划中</div>
            <div style="font-size:8px;color:#475569;">跨部门联合建模 Q3</div>
          </div>
        </div>
      </div>
    `;
  }

  private static readonly TOOL_GUIDES: Record<string, Array<{ tool: string; category: string; guide: string }>> = {
    'ciso': [
      { tool: '风险评分板', category: 'GRC', guide: '基于 FAIR 模型量化风险' },
      { tool: 'KPI 追踪', category: '治理', guide: 'MTTR/MTTD/漏洞修复率' },
      { tool: '预算仪表盘', category: '财务', guide: 'SABSA 安全架构投资回报' },
    ],
    'secuclaw-commander': [
      { tool: '全域态势', category: '态势感知', guide: '多源情报融合评分' },
      { tool: 'AI 调度', category: '自动化', guide: 'SOAR playbook 自动响应' },
    ],
    'security-ops': [
      { tool: '告警队列', category: 'SIEM', guide: 'Splunk/ES 规则关联分析' },
      { tool: 'SOAR 执行', category: '自动化', guide: 'Cortex XSOAR playbook' },
    ],
    'security-expert': [
      { tool: '漏洞扫描', category: 'VA', guide: 'Nessus/Qualys 资产扫描' },
      { tool: '渗透测试', category: 'PT', guide: 'Metasploit/Burp Suite 深度测试' },
    ],
    'security-architect': [
      { tool: '威胁建模', category: '设计', guide: 'STRIDE/DREAD 量化评估' },
      { tool: '零信任评估', category: '架构', guide: 'NIST SP 800-207 成熟度' },
    ],
    'privacy-officer': [
      { tool: 'GDPR 审计', category: '合规', guide: 'Art.35 DPIA 流程' },
      { tool: '数据地图', category: '治理', guide: 'NIST Privacy Framework' },
    ],
    'business-security-officer': [
      { tool: 'BCP 管理', category: '连续性', guide: 'ISO 22301 业务影响分析' },
      { tool: '成本计算', category: '财务', guide: 'TCO/ROI 安全投资分析' },
    ],
    'supply-chain-security': [
      { tool: 'SBOM 扫描', category: 'SCA', guide: 'CycloneDX/SPDX 组件分析' },
      { tool: '第三方风险', category: 'TPRM', guide: 'SIG/SOGLA 供应商评估' },
    ],
  };

  @state() private _showToolGuide = false;

  private _renderToolGuideZone(roleId: string) {
    const guides = ScRoleCommander.TOOL_GUIDES[roleId];
    if (!guides || guides.length === 0) return nothing;
    return html`
      <div style="margin:0 14px 8px;">
        <div style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer;" @click=${() => { this._showToolGuide = !this._showToolGuide; }}>
          <span style="font-size:10px;color:#94a3b8;">📖 工具使用指南</span>
          <span style="font-size:9px;color:#475569;">${guides.length} 项</span>
          <span style="margin-left:auto;font-size:9px;color:#334155;">${this._showToolGuide ? '▾' : '▸'}</span>
        </div>
        ${this._showToolGuide ? html`
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${guides.map(g => html`
              <div style="background:#0f172a;border:1px solid #1e293b;border-radius:6px;padding:5px 8px;min-width:140px;">
                <div style="font-size:10px;color:#e2e8f0;">${g.tool}</div>
                <div style="font-size:8px;color:#64748b;">${g.category}</div>
                <div style="font-size:9px;color:#94a3b8;margin-top:2px;">${g.guide}</div>
              </div>
            `)}
          </div>
        ` : nothing}
      </div>
    `;
  }

  // ─── Tool Guide (inline, always visible — CISO layout) ──────────
  private _renderToolGuideInline(roleId: string) {
    const guides = ScRoleCommander.TOOL_GUIDES[roleId];
    if (!guides || guides.length === 0) return nothing;
    return html`
      <div class="ciso-divider"></div>
      <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:8px;">📖 工具使用指南</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;">
        ${guides.map(g => html`
          <div style="background:#0f172a;border:1px solid #1e293b;border-radius:6px;padding:8px 10px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="font-size:11px;color:#e2e8f0;font-weight:600;">${g.tool}</span>
              <span style="font-size:9px;padding:1px 6px;border-radius:3px;background:#1e293b;color:#64748b;">${g.category}</span>
            </div>
            <div style="font-size:10px;color:#94a3b8;line-height:1.4;">${g.guide}</div>
          </div>
        `)}
      </div>
    `;
  }

  // ─── 时间轴渲染（纯 HTML/CSS） ─────────────────────────────────
  private _timelineV2(events: TimelineEvent[]) {
    if (events.length === 0) return html`<div style="text-align:center;color:#475569;font-size:11px;padding:16px;">暂无事件，可点击"＋ 录入"或"自动导入"添加</div>`;
    const priorityColors: Record<TimelinePriority, string> = { P1: '#ef4444', P2: '#f59e0b', P3: '#22c55e', INFO: '#3b82f6' };
    const statusOpacity: Record<string, number> = { open: 1, completed: 0.5, closed: 0.3 };
    const formatTime = (iso: string) => {
      const d = new Date(iso);
      return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    };

    // 蛇形双行布局：奇数行从左到右，偶数行从右到左
    const COLS = 8; // 每行最多8个节点
    const rows: TimelineEvent[][] = [];
    for (let i = 0; i < events.length; i += COLS) {
      rows.push(events.slice(i, i + COLS));
    }

    return html`
      <div style="position:relative;padding:4px 0;">
        ${rows.map((row, ri) => {
          const isReversed = ri % 2 === 1;
          const ordered = isReversed ? [...row].reverse() : row;
          const isLast = ri === rows.length - 1;
          const isFirst = ri === 0;

          return html`
            <div style="display:flex;align-items:flex-start;position:relative;min-height:90px;">
              <!-- 水平连线 -->
              <div style="position:absolute;top:18px;left:0;right:0;height:2px;background:#1e293b;z-index:0;"></div>

              ${ordered.map((e, ci) => {
                const displayTime = e.modifiedTime ? formatTime(e.modifiedTime) : formatTime(e.originalTime);
                const c = priorityColors[e.priority];
                const opacity = statusOpacity[e.status] || 1;
                const statusBadge = e.status === 'completed' ? '✓' : e.status === 'closed' ? '✕' : '';
                // 判断是否为行的端点（需要竖向连接线）
                const isRowStart = ci === 0;
                const isRowEnd = ci === row.length - 1;

                return html`
                  <div style="flex:1;display:flex;flex-direction:column;align-items:center;position:relative;z-index:1;opacity:${opacity};min-width:0;cursor:pointer;" @click=${(ev: Event) => { ev.stopPropagation(); this._selectedTimelineEvent = this._selectedTimelineEvent === e.id ? null : e.id; this._editingTimelineEvent = null; }}>
                    <div style="font-size:8px;color:#64748b;margin-bottom:2px;font-family:monospace;">${displayTime}</div>
                    ${e.modifiedTime ? html`<div style="font-size:7px;font-weight:700;color:#f59e0b;background:#f59e0b22;padding:0 2px;border-radius:2px;">变</div>` : nothing}
                    <div style="width:10px;height:10px;border-radius:50%;background:${c};border:2px solid #0f172a;z-index:2;box-shadow:0 0 6px ${c}55;${statusBadge ? 'position:relative;' : ''}">
                      ${statusBadge ? html`<span style="position:absolute;top:-2px;right:-4px;font-size:8px;">${statusBadge}</span>` : nothing}
                    </div>
                    <div style="font-size:8px;font-weight:600;color:#e2e8f0;text-align:center;line-height:1.2;padding:0 1px;margin-top:2px;max-width:90px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${e.label}</div>
                    <div style="display:flex;align-items:center;gap:2px;margin-top:2px;">
                      <span style="font-size:7px;font-weight:700;padding:0 3px;border-radius:2px;background:${c}18;color:${c};">${e.priority}</span>
                      ${e.source === 'auto' ? html`<span style="font-size:6px;">🔄</span>` : html`<span style="font-size:6px;">✍</span>`}
                    </div>
                  </div>
                `;
              })}

              <!-- 行末尾竖向连接线（非最后一行） -->
              ${!isLast ? html`
                <div style="position:absolute;${isReversed ? 'left:0' : 'right:0'};top:18px;width:2px;height:90px;background:#1e293b;z-index:0;"></div>
              ` : nothing}
            </div>
          `;
        })}
      </div>
    `;
  }

  // ─── 时间轴操作按钮 + 录入表单 ─────────────────────────────────
  private _renderTimelineToolbar(roleId: string) {
    const allEvents = timelineStore.getState().getByRole(roleId);
    const visibleEvents = this._showCompleted ? allEvents : allEvents.filter(e => e.status === 'open');
    const completedCount = allEvents.filter(e => e.status !== 'open').length;
    const autoSources = timelineStore.getState().getAutoSources(roleId);
    const providers = getTimelineProviders();

    return html`
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
        <div style="font-size:11px;color:#94a3b8;">📡 事件时间轴</div>
        <div style="font-size:10px;color:#64748b;">${visibleEvents.length} 条${this._showCompleted ? '（全部）' : '进行中'}</div>
        ${completedCount > 0 ? html`
          <label style="display:flex;align-items:center;gap:4px;font-size:9px;color:#64748b;cursor:pointer;user-select:none;" @click=${(e: Event) => { e.preventDefault(); this._showCompleted = !this._showCompleted; }}>
            <span style="width:12px;height:12px;border-radius:3px;border:1px solid #475569;display:flex;align-items:center;justify-content:center;font-size:8px;background:${this._showCompleted ? '#3b82f6' : 'transparent'}">${this._showCompleted ? '✓' : ''}</span>
            显示已完成/关闭 (${completedCount})
          </label>
        ` : nothing}
        ${autoSources.length > 0 ? html`<div style="font-size:9px;color:#3b82f6;">🔄 ${autoSources.map(s => s.toolName).join(', ')}</div>` : nothing}
        <div style="flex:1;"></div>
        <button class="tl-btn" @click=${() => { runAutoImport(roleId); this.requestUpdate(); }}>🔄 自动导入</button>
        <button class="tl-btn tl-btn-primary" @click=${() => {
          this._showTimelineForm = !this._showTimelineForm;
          if (this._showTimelineForm) {
            this._timelineFormLabel = '';
            this._timelineFormTime = new Date().toISOString().slice(0, 16);
            this._timelineFormPriority = 'P2';
            this._timelineFormDesc = '';
          }
        }}>＋ 录入</button>
      </div>

      ${this._showTimelineForm ? html`
        <div class="tl-form">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <input class="tl-input" style="flex:2;min-width:140px;" placeholder="事件名称，如：零信任方案评审：微隔离改进" .value=${this._timelineFormLabel} @input=${(e: Event) => { this._timelineFormLabel = (e.target as HTMLInputElement).value; }} />
            <input class="tl-input" style="width:160px;" type="datetime-local" .value=${this._timelineFormTime} @input=${(e: Event) => { this._timelineFormTime = (e.target as HTMLInputElement).value; }} />
            <select class="tl-input" style="width:70px;" .value=${this._timelineFormPriority} @change=${(e: Event) => { this._timelineFormPriority = (e.target as HTMLSelectElement).value as TimelinePriority; }}>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
              <option value="INFO">INFO</option>
            </select>
            <button class="tl-btn tl-btn-primary" @click=${() => {
              if (!this._timelineFormLabel.trim() || !this._timelineFormTime) return;
              timelineStore.getState().addEvent({
                label: this._timelineFormLabel.trim(),
                description: this._timelineFormDesc.trim(),
                priority: this._timelineFormPriority,
                originalTime: new Date(this._timelineFormTime).toISOString(),
                modifiedTime: null,
                toolId: null,
                status: 'open',
                toolName: null,
                roleId,
              });
              this._showTimelineForm = false;
              this.requestUpdate();
            }}>✓ 保存</button>
            <button class="tl-btn" @click=${() => { this._showTimelineForm = false; }}>取消</button>
          </div>
          <input class="tl-input" style="margin-top:6px;width:100%;" placeholder="事件描述（可选）" .value=${this._timelineFormDesc} @input=${(e: Event) => { this._timelineFormDesc = (e.target as HTMLInputElement).value; }} />
        </div>
      ` : nothing}
    `;
  }

  // ─── 时间轴事件列表（可修改时间、删除） ─────────────────────────────────
  private _renderTimelineEditPopup() {
    if (!this._selectedTimelineEvent) return nothing;
    const e = timelineStore.getState().events.find(ev => ev.id === this._selectedTimelineEvent);
    if (!e) return nothing;

    const priorityColors: Record<TimelinePriority, string> = { P1: '#ef4444', P2: '#f59e0b', P3: '#22c55e', INFO: '#3b82f6' };
    const c = priorityColors[e.priority];
    const formatTime = (iso: string) => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    };
    const statusLabel: Record<string, string> = { open: '进行中', completed: '已完成', closed: '已关闭' };
    const statusColor: Record<string, string> = { open: '#22c55e', completed: '#3b82f6', closed: '#64748b' };

    return html`
      <div class="tl-edit-popup" @click=${(ev: Event) => ev.stopPropagation()}>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:3px;background:${c}18;color:${c};">${e.priority}</span>
            <span style="font-size:9px;padding:1px 5px;border-radius:3px;color:${statusColor[e.status]};background:${statusColor[e.status]}18;">${statusLabel[e.status]}</span>
            ${e.source === 'auto' ? html`<span style="font-size:8px;color:#3b82f6;">🔄 ${e.toolName}</span>` : html`<span style="font-size:8px;color:#64748b;">✍ 手动</span>`}
          </div>
          <button style="background:none;border:none;color:#64748b;cursor:pointer;font-size:12px;padding:0;" @click=${() => { this._selectedTimelineEvent = null; }}>✕</button>
        </div>

        <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:4px;">${e.label}</div>
        ${e.description ? html`<div style="font-size:9px;color:#94a3b8;margin-bottom:8px;">${e.description}</div>` : nothing}

        <div class="tl-edit-row">
          <span class="tl-edit-label">原始时间</span>
          <span class="tl-edit-value" style="font-family:monospace;color:#64748b;">${formatTime(e.originalTime)}</span>
        </div>

        ${this._editingTimelineEvent === e.id ? html`
          <div class="tl-edit-row">
            <span class="tl-edit-label">修改为</span>
            <input type="datetime-local" class="tl-edit-input" .value=${this._editingTimelineTime} @input=${(ev: Event) => { this._editingTimelineTime = (ev.target as HTMLInputElement).value; }} />
          </div>
          <div style="display:flex;gap:4px;margin-left:54px;">
            <button class="tl-btn tl-btn-primary" style="font-size:9px;padding:2px 8px;" @click=${() => { if (this._editingTimelineTime) { timelineStore.getState().modifyTime(e.id, new Date(this._editingTimelineTime).toISOString()); } this._editingTimelineEvent = null; this.requestUpdate(); }}>✓ 确认</button>
            <button class="tl-btn" style="font-size:9px;padding:2px 8px;" @click=${() => { this._editingTimelineEvent = null; }}>取消</button>
          </div>
        ` : html`
          <div class="tl-edit-row">
            <span class="tl-edit-label">当前时间</span>
            <span class="tl-edit-value" style="font-family:monospace;color:${e.modifiedTime ? '#f59e0b' : '#e2e8f0'};">
              ${e.modifiedTime ? formatTime(e.modifiedTime) : formatTime(e.originalTime)}
              ${e.modifiedTime ? html`<span style="font-size:8px;font-weight:700;background:#f59e0b22;padding:0 3px;border-radius:2px;margin-left:4px;">变</span>` : nothing}
            </span>
          </div>
        `}

        <div class="tl-edit-actions">
          ${this._editingTimelineEvent !== e.id ? html`<button class="tl-btn" style="font-size:9px;padding:2px 8px;" @click=${() => { this._editingTimelineEvent = e.id; this._editingTimelineTime = e.modifiedTime ? e.modifiedTime.slice(0, 16) : e.originalTime.slice(0, 16); }}>⏱ 改时间</button>` : nothing}
          ${e.status === 'open' ? html`<button class="tl-btn" style="font-size:9px;padding:2px 8px;border-color:#22c55e;color:#22c55e;" @click=${() => { timelineStore.getState().updateEvent(e.id, { status: 'completed' }); this._selectedTimelineEvent = null; this.requestUpdate(); }}>✓ 完成</button>` : nothing}
          ${e.status === 'completed' ? html`<button class="tl-btn" style="font-size:9px;padding:2px 8px;border-color:#64748b;color:#64748b;" @click=${() => { timelineStore.getState().updateEvent(e.id, { status: 'closed' }); this.requestUpdate(); }}>✕ 关闭</button>` : nothing}
          ${e.status !== 'open' ? html`<button class="tl-btn" style="font-size:9px;padding:2px 8px;border-color:#3b82f6;color:#3b82f6;" @click=${() => { timelineStore.getState().updateEvent(e.id, { status: 'open' }); this.requestUpdate(); }}>↩ 重开</button>` : nothing}
          ${e.toolId ? html`<button class="tl-btn" style="font-size:9px;padding:2px 8px;" @click=${() => { this._selectedTimelineEvent = null; this._openToolPanel(e.toolId!); }}>🔧 打开工具</button>` : nothing}
          <button class="tl-btn" style="font-size:9px;padding:2px 8px;border-color:#ef4444;color:#ef4444;" @click=${() => { timelineStore.getState().deleteEvent(e.id); this._selectedTimelineEvent = null; this.requestUpdate(); }}>🗑 删除</button>
        </div>
      </div>
    `;
  }

  // ─── 通用核心工具指标区域（所有角色复用） ───

  /** 从 mock store 读取动态指标，回退到 fallback */
  private _mc(fallback: { toolId: string; title: string; num: string; numColor: string; unit: string; sparkData: number[]; delta: string; deltaColor: string; deltaLabel: string; badge: string; badgeColor: string }) {
    const live = getMetric(fallback.toolId);
    if (live) {
      return { ...fallback, ...live, num: live.num, numColor: live.numColor, sparkData: live.sparkData, delta: live.delta, deltaColor: live.deltaColor, badge: live.badge, badgeColor: live.badgeColor };
    }
    return fallback;
  }

  private _renderMetricCard(c: { toolId: string; title: string; num: string; numColor: string; unit: string; sparkData: number[]; delta: string; deltaColor: string; deltaLabel: string; badge: string; badgeColor: string }) {
    return html`
      <div class="rd-section" data-metric="${c.toolId}" @click=${() => window.location.hash = `/tool/${c.toolId}`}>
        <div class="rd-title">${c.title}</div>
        <div class="rd-chart-row">
          <span class="rd-big-num" style="color:${c.numColor}">${c.num}</span>
          <span class="rd-unit">${c.unit}</span>
          ${this._sparkline(c.sparkData, 70, 20, c.numColor)}
        </div>
        <div class="rd-sub-row">
          <span style="color:${c.deltaColor}">${c.delta}</span>
          <span style="margin-left:4px">${c.deltaLabel}</span>
          <span style="margin-left:auto;font-size:9px;padding:1px 5px;border-radius:3px;background:${c.badgeColor}15;color:${c.badgeColor}">${c.badge}</span>
        </div>
      </div>
    `;
  }

  private _renderMetricsZone(label: string, cards: ReturnType<typeof ScRoleCommander.prototype._renderMetricCard>[]) {
    const last = mockDataStore.getState().lastUpdate;
    const ago = last ? Math.round((Date.now() - last) / 1000) : -1;
    const pulse = ago >= 0 && ago < 5;
    return html`
      <div class="zone zone-tools">
        <div class="zone-label">📐 ${label} <span style="margin-left:auto;font-size:8px;font-weight:400;color:${pulse ? '#22c55e' : '#475569'}">${pulse ? '🟢 实时' : ago >= 0 ? `${ago}s ago` : ''}</span></div>
        <div class="rd-row rd-5col">
          ${cards.map(c => c)}
        </div>
      </div>
    `;
  }

  // ─── 通用事件时间轴区域（所有角色复用） ───
  private _renderTimelineZone(roleId: string) {
    const events = this._showCompleted
      ? timelineStore.getState().getByRole(roleId)
      : timelineStore.getState().getByRole(roleId).filter(e => e.status === 'open');
    return html`
      <div class="zone zone-timeline">
        <div class="rd-section" style="padding: 10px 14px;">
          ${this._renderTimelineToolbar(roleId)}
          <div style="overflow-x: auto; padding: 4px 0 8px; position: relative;">
            <div style="min-width: 860px;">
              ${this._timelineV2(events)}
            </div>
            ${this._renderTimelineEditPopup()}
          </div>
        </div>
      </div>
    `;
  }

  // ─── CISO: Executive Dashboard — logical reorganization ───
  // Layout logic:
  //   Row 1: Core Metrics (5 cards, full width)
  //   Row 2: Decision Matrix | SKILL Viz + Framework Coverage (merged as "Security Posture")
  //   Row 3: Legal Compliance | Dark Side Attack Simulation
  //   Row 4: Tool Guide (full width, compact cards)
  // Layout:
  //   Row 0: 核心指标 (5 metric cards) + 工具使用指南 (inline, no collapse)
  //   Row 1: 决策矩阵 (1/3) | Legal 合规 (1/3) | 安全框架覆盖度 (1/3) — all expanded
  //   Row 2: SKILL 可视化 (1/2) | Dark Side 攻防模拟 (1/2) — all expanded
  //   Row 3: 事件时间轴 (full width)
  // No collapsing, no hiding — all content always visible.
  private _renderCisoDashboard() {
    return html`
      <div class="ciso-role-grid">

        <!-- ── Row 0: Executive Metrics + Tool Guide (merged info strip) ── -->
        <div class="ciso-panel">
          <div class="ciso-panel-header">
            <span class="ciso-panel-title"><span class="icon">📊</span> 核心指标</span>
          </div>
          <div class="ciso-metrics-strip">
            ${[
              this._renderMetricCard(this._mc({ toolId: 'risk-score', title: '📊 风险评分板', num: '44', numColor: '#fbbf24', unit: '/100', sparkData: [52,48,55,51,47,44,49,46,43,48,45,44], delta: '↑+3', deltaColor: '#ef4444', deltaLabel: '近30天', badge: 'P2 中', badgeColor: '#f59e0b' })),
              this._renderMetricCard(this._mc({ toolId: 'kpi-track', title: '🎯 KPI 追踪', num: '85%', numColor: '#3b82f6', unit: '达成率', sparkData: [78,80,82,81,83,85,84,85], delta: '↑+7%', deltaColor: '#22c55e', deltaLabel: '较上季', badge: 'P3 轻', badgeColor: '#22c55e' })),
              this._renderMetricCard(this._mc({ toolId: 'board-report', title: '📋 董事会报告', num: '2', numColor: '#f59e0b', unit: '待提交', sparkData: [3,2,4,2,3,2,1,2], delta: '↓-1', deltaColor: '#22c55e', deltaLabel: '较上月', badge: 'P2 中', badgeColor: '#f59e0b' })),
              this._renderMetricCard(this._mc({ toolId: 'budget-dash', title: '💰 预算仪表盘', num: '63%', numColor: '#22c55e', unit: '使用率', sparkData: [45,50,55,58,60,62,63,63], delta: '↑+18%', deltaColor: '#f59e0b', deltaLabel: '本年度', badge: 'P3 轻', badgeColor: '#22c55e' })),
              this._renderMetricCard(this._mc({ toolId: 'compliance-chk', title: '✅ 合规检查', num: '91%', numColor: '#3b82f6', unit: '合规率', sparkData: [85,87,88,89,90,91,91,91], delta: '↑+6%', deltaColor: '#22c55e', deltaLabel: '近90天', badge: 'P3 轻', badgeColor: '#22c55e' })),
            ]}
          </div>
          <!-- Tool Guide: always visible, inline -->
          ${this._renderToolGuideInline('ciso')}
        </div>

        <!-- ── Row 1: Decision Matrix | Legal | Framework (3-col assessment row) ── -->
        <div class="ciso-zone-3col">
          <div class="ciso-panel">
            ${this._renderDecisionZone('ciso')}
          </div>
          <div class="ciso-panel">
            ${this._renderLegalZone('ciso')}
          </div>
          <div class="ciso-panel">
            ${this._renderFrameworkZoneExpanded('ciso')}
          </div>
        </div>

        <!-- ── Row 2: SKILL Visualization | Dark Side Simulation (2-col ops row) ── -->
        <div class="ciso-zone-ops">
          <div class="ciso-panel">
            ${this._renderVizZone('ciso')}
          </div>
          <div class="ciso-panel">
            ${this._renderDarkZone('ciso')}
          </div>
        </div>

        <!-- ── Row 3: Event Timeline (full width — many items) ── -->
        <div class="ciso-panel">
          ${this._renderTimelineZone('ciso')}
        </div>

      </div>
    `
  }

  /** Framework Zone — always expanded, no toggle (for CISO merged view) */
  private _renderFrameworkZoneExpanded(roleId: string) {
    const cfg = ScRoleCommander.FRAMEWORK_COVERAGE[roleId];
    if (!cfg) return nothing;
    const mitrePct = Math.round((cfg.mitre.covered / cfg.mitre.total) * 100);
    const scfPct = Math.round((cfg.scf.covered / cfg.scf.total) * 100);
    return html`
      <div style="padding:8px 12px;">
        <div style="font-size:11px;font-weight:600;color:#67e8f9;margin-bottom:8px;">🎯 安全框架覆盖度</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div style="background:#0f172a;border-radius:6px;padding:8px;">
            <div style="font-size:10px;color:#94a3b8;margin-bottom:4px;">🔴 MITRE ATT&CK</div>
            <div style="font-size:20px;font-weight:700;color:#ef4444;">${mitrePct}%</div>
            <div style="font-size:9px;color:#475569;">${cfg.mitre.covered} / ${cfg.mitre.total} techniques</div>
            <div style="margin-top:4px;">${cfg.mitre.topGaps.map(g => html`<div style="font-size:9px;color:#f87171;">• ${g}</div>`)}</div>
          </div>
          <div style="background:#0f172a;border-radius:6px;padding:8px;">
            <div style="font-size:10px;color:#94a3b8;margin-bottom:4px;">🔵 SCF 安全控制框架</div>
            <div style="font-size:20px;font-weight:700;color:#3b82f6;">${scfPct}%</div>
            <div style="font-size:9px;color:#475569;">${cfg.scf.covered} / ${cfg.scf.total} controls</div>
            <div style="margin-top:4px;">${cfg.scf.topGaps.map(g => html`<div style="font-size:9px;color:#60a5fa;">• ${g}</div>`)}</div>
          </div>
        </div>
      </div>
    `;
  }

  // ─── 指挥官: 全域态势, AI调度, 事件管理, 风险评分板, 董事会报告 ───
  private _renderCommanderDashboard() {
    return html`
      <div class="ciso-role-grid">
        <!-- Row 0: Metrics + Tool Guide -->
        <div class="ciso-panel">
          <div class="ciso-panel-header">
            <span class="ciso-panel-title"><span class="icon">📊</span> 核心指标</span>
          </div>
          <div class="ciso-metrics-strip">
            ${this._renderMetricCard(this._mc({ toolId: 'global-situation', title: '🌍 全域态势', num: '58', numColor: '#f59e0b', unit: '/100 风险', sparkData: [62,60,57,55,58,56,54,58], delta: '↑+3', deltaColor: '#ef4444', deltaLabel: '本周', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'ai-dispatch', title: '🤖 AI 调度', num: '3', numColor: '#22c55e', unit: '运行中', sparkData: [1,2,2,3,2,3,3,3], delta: '↑+1', deltaColor: '#22c55e', deltaLabel: '较上周', badge: 'P3 轻', badgeColor: '#22c55e' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'incident-mgmt', title: '🚑 事件管理', num: '4', numColor: '#ef4444', unit: '活跃事件', sparkData: [6,5,7,4,5,3,4,4], delta: '↓-2', deltaColor: '#22c55e', deltaLabel: '近7天', badge: 'P1 重', badgeColor: '#ef4444' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'risk-score', title: '📊 风险评分板', num: '46', numColor: '#fbbf24', unit: '/100', sparkData: [50,48,52,47,44,46,43,46], delta: '↑+2', deltaColor: '#f59e0b', deltaLabel: '近30天', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'bcp-mgmt', title: '🛡️ BCP 管理', num: '92%', numColor: '#22c55e', unit: '覆盖率', sparkData: [85,87,88,89,90,91,92,92], delta: '↑+7%', deltaColor: '#22c55e', deltaLabel: '近半年', badge: 'P3 轻', badgeColor: '#22c55e' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'security-governance', title: '🛡️ 安全治理', num: '92%', numColor: '#22c55e', unit: '治理覆盖率', sparkData: [85,87,88,90,91,91,92,92], delta: '↑+7%', deltaColor: '#22c55e', deltaLabel: '近季', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'investment-decision', title: '📈 投资决策', num: '340%', numColor: '#22c55e', unit: '安全ROI', sparkData: [280,300,310,320,330,340,340,340], delta: '↑+60%', deltaColor: '#22c55e', deltaLabel: '较上年', badge: 'P3 轻', badgeColor: '#22c55e' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'drill-mgmt', title: '🔥 应急演练', num: '3', numColor: '#f59e0b', unit: '本季演练', sparkData: [1,1,2,2,2,3,3,3], delta: '↑+1', deltaColor: '#22c55e', deltaLabel: '较上季', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'devsecops', title: '🔄 DevSecOps', num: '87%', numColor: '#22c55e', unit: '流水线覆盖率', sparkData: [72,75,78,80,83,85,86,87], delta: '↑+15%', deltaColor: '#22c55e', deltaLabel: '近半年', badge: 'P3 轻', badgeColor: '#22c55e' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'perf-mgmt', title: '📊 绩效管理', num: 'B+', numColor: '#06b6d4', unit: '安全团队评级', sparkData: [70,72,74,76,78,80,82,85], delta: '↑+15', deltaColor: '#22c55e', deltaLabel: '年度', badge: 'P3 轻', badgeColor: '#22c55e' }))}
          </div>
          ${this._renderToolGuideInline('secuclaw-commander')}
        </div>

        <!-- Row 1: Decision | Dark Side | Framework -->
        <div class="ciso-zone-3col">
          <div class="ciso-panel">${this._renderDecisionZone('secuclaw-commander')}</div>
          <div class="ciso-panel">${this._renderDarkZone('secuclaw-commander')}</div>
          <div class="ciso-panel">${this._renderFrameworkZoneExpanded('secuclaw-commander')}</div>
        </div>

        <!-- Row 2: Timeline (full width) -->
        <div class="ciso-panel">${this._renderTimelineZone('secuclaw-commander')}</div>
      </div>
    `
  }

  // ─── 安全运营 ───
  private _renderOpsDashboard() {
    return html`
      <div class="ciso-role-grid">
        <div class="ciso-panel">
          <div class="ciso-panel-header">
            <span class="ciso-panel-title"><span class="icon">📊</span> 核心指标</span>
          </div>
          <div class="ciso-metrics-strip">
            ${this._renderMetricCard(this._mc({ toolId: 'alert-queue', title: '🚨 告警队列', num: '8', numColor: '#ef4444', unit: '活跃告警', sparkData: [15,22,18,35,28,42,38,8], delta: '↓-30', deltaColor: '#22c55e', deltaLabel: '较昨日', badge: 'P1 重', badgeColor: '#ef4444' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'incident-mgmt', title: '🚑 事件管理', num: '4', numColor: '#f59e0b', unit: '待处理', sparkData: [7,5,6,4,5,3,4,4], delta: '↓-2', deltaColor: '#22c55e', deltaLabel: '近24h', badge: 'P1 重', badgeColor: '#ef4444' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'soar-exec', title: '⚡ SOAR 剧本', num: '3', numColor: '#3b82f6', unit: '运行中', sparkData: [1,2,1,2,3,2,3,3], delta: '↑+1', deltaColor: '#f59e0b', deltaLabel: '较昨日', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'log-analysis', title: '📜 日志分析', num: '65%', numColor: '#8b5cf6', unit: '覆盖率', sparkData: [55,58,60,62,63,64,65,65], delta: '↑+10%', deltaColor: '#22c55e', deltaLabel: '近90天', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'threat-intel', title: '📡 威胁情报', num: '12', numColor: '#06b6d4', unit: '新增情报', sparkData: [5,8,6,10,9,12,11,12], delta: '↑+3', deltaColor: '#ef4444', deltaLabel: '本周', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'bcp-mgmt', title: '🛡️ BCP 管理', num: '95%', numColor: '#22c55e', unit: 'BCP覆盖', sparkData: [88,90,91,93,94,95,95,95], delta: '↑+7%', deltaColor: '#22c55e', deltaLabel: '近半年', badge: 'P2 中', badgeColor: '#f59e0b' }))}
          </div>
          ${this._renderToolGuideInline('security-ops')}
        </div>

        <div class="ciso-zone-3col">
          <div class="ciso-panel">${this._renderDarkZone('security-ops')}</div>
          <div class="ciso-panel">${this._renderFrameworkZoneExpanded('security-ops')}</div>
          <div class="ciso-panel" style="display:flex;flex-direction:column;gap:12px;">
            ${this._renderTimelineZone('security-ops')}
          </div>
        </div>
      </div>
    `
  }

  // ─── 安全专家 ───
  private _renderExpertDashboard() {
    return html`
      <div class="ciso-role-grid">
        <div class="ciso-panel">
          <div class="ciso-panel-header">
            <span class="ciso-panel-title"><span class="icon">📊</span> 核心指标</span>
          </div>
          <div class="ciso-metrics-strip">
            ${this._renderMetricCard(this._mc({ toolId: 'vuln-scan', title: '🛡️ 漏洞扫描', num: '65', numColor: '#ef4444', unit: '个CVE', sparkData: [72,68,70,65,63,60,65,65], delta: '↑+5', deltaColor: '#ef4444', deltaLabel: '本月新增', badge: 'P1 重', badgeColor: '#ef4444' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'threat-intel', title: '📡 威胁情报', num: '12', numColor: '#f59e0b', unit: '新增CVE', sparkData: [5,8,6,10,9,12,11,12], delta: '↑+4', deltaColor: '#ef4444', deltaLabel: '本周', badge: 'P1 重', badgeColor: '#ef4444' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'pen-test', title: '🔍 渗透测试', num: '12', numColor: '#3b82f6', unit: '可利用漏洞', sparkData: [8,9,10,11,10,12,11,12], delta: '↑+2', deltaColor: '#ef4444', deltaLabel: '本轮测试', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'incident-mgmt', title: '🚑 事件管理', num: '3', numColor: '#06b6d4', unit: '待取证', sparkData: [5,4,3,4,3,2,3,3], delta: '↓-1', deltaColor: '#22c55e', deltaLabel: '近7天', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'patch-mgmt', title: '📦 补丁管理', num: '74%', numColor: '#8b5cf6', unit: '高危覆盖', sparkData: [60,63,65,68,70,72,74,74], delta: '↑+14%', deltaColor: '#22c55e', deltaLabel: '近90天', badge: 'P2 中', badgeColor: '#f59e0b' }))}
          </div>
          ${this._renderToolGuideInline('security-expert')}
        </div>

        <div class="ciso-zone-ops">
          <div class="ciso-panel">${this._renderVizZone('security-expert')}</div>
          <div class="ciso-panel">${this._renderDarkZone('security-expert')}</div>
        </div>

        <div class="ciso-zone-3col">
          <div class="ciso-panel">${this._renderFrameworkZoneExpanded('security-expert')}</div>
          <div class="ciso-panel" style="grid-column:span 2;">${this._renderTimelineZone('security-expert')}</div>
        </div>
      </div>
    `
  }

  // ─── 隐私官 ───
  private _renderPrivacyDashboard() {
    return html`
      <div class="ciso-role-grid">
        <div class="ciso-panel">
          <div class="ciso-panel-header">
            <span class="ciso-panel-title"><span class="icon">📊</span> 核心指标</span>
          </div>
          <div class="ciso-metrics-strip">
            ${this._renderMetricCard(this._mc({ toolId: 'gdpr-audit', title: '📜 GDPR 审计', num: '87%', numColor: '#22c55e', unit: '合规率', sparkData: [78,80,82,84,85,86,87,87], delta: '↑+9%', deltaColor: '#22c55e', deltaLabel: '近半年', badge: 'P3 轻', badgeColor: '#22c55e' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'compliance-chk', title: '✅ 合规检查', num: '91%', numColor: '#f59e0b', unit: '整体合规', sparkData: [85,87,88,89,90,91,91,91], delta: '↑+6%', deltaColor: '#22c55e', deltaLabel: '近90天', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'data-map', title: '🗺️ 数据地图', num: '3', numColor: '#a78bfa', unit: '跨境数据流', sparkData: [2,2,3,3,3,3,3,3], delta: '↑+1', deltaColor: '#f59e0b', deltaLabel: '本季度', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'policy-mgmt', title: '📄 策略管理', num: '2', numColor: '#ef4444', unit: '待更新', sparkData: [0,1,1,2,1,2,2,2], delta: '↑+1', deltaColor: '#ef4444', deltaLabel: '本月', badge: 'P1 重', badgeColor: '#ef4444' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'vendor-eval', title: '🏢 供应商评估', num: '1', numColor: '#f59e0b', unit: '高风险', sparkData: [0,1,1,1,2,1,1,1], delta: '↓-1', deltaColor: '#22c55e', deltaLabel: '较上月', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'cookie-mgmt', title: '🍪 Cookie 管理', num: '94%', numColor: '#22c55e', unit: '合规率', sparkData: [88,89,90,91,92,93,94,94], delta: '↑+6%', deltaColor: '#22c55e', deltaLabel: '近月', badge: 'P3 轻', badgeColor: '#22c55e' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'consent-mgmt', title: '✅ 同意管理', num: '96%', numColor: '#22c55e', unit: '用户同意率', sparkData: [90,91,92,93,94,95,96,96], delta: '↑+6%', deltaColor: '#22c55e', deltaLabel: '近月', badge: 'P3 轻', badgeColor: '#22c55e' }))}
          </div>
          ${this._renderToolGuideInline('privacy-officer')}
        </div>

        <div class="ciso-zone-3col">
          <div class="ciso-panel">${this._renderLegalZone('privacy-officer')}</div>
          <div class="ciso-panel">${this._renderDarkZone('privacy-officer')}</div>
          <div class="ciso-panel">${this._renderFrameworkZoneExpanded('privacy-officer')}</div>
        </div>

        <div class="ciso-panel">
          ${this._renderPrivacyTechZone()}
        </div>

        <div class="ciso-panel">${this._renderTimelineZone('privacy-officer')}</div>
      </div>
    `
  }

  // ─── 架构师 ───
  private _renderArchitectDashboard() {
    return html`
      <div class="ciso-role-grid">
        <div class="ciso-panel">
          <div class="ciso-panel-header">
            <span class="ciso-panel-title"><span class="icon">📊</span> 核心指标</span>
          </div>
          <div class="ciso-metrics-strip">
            ${this._renderMetricCard(this._mc({ toolId: 'threat-model', title: '⚠️ 威胁建模', num: '23', numColor: '#ef4444', unit: 'STRIDE威胁', sparkData: [28,25,27,24,23,20,22,23], delta: '↑+2', deltaColor: '#ef4444', deltaLabel: '较上季度', badge: 'P1 重', badgeColor: '#ef4444' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'zero-trust', title: '🔐 零信任评估', num: '3.2', numColor: '#f59e0b', unit: '/5 成熟度', sparkData: [2.8,3.0,3.1,3.0,3.2,3.1,3.2], delta: '↑+0.4', deltaColor: '#22c55e', deltaLabel: '近90天', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'iam-config', title: '🔑 IAM 配置', num: '5', numColor: '#ef4444', unit: '高风险配置', sparkData: [3,4,4,5,6,5,5,5], delta: '↑+2', deltaColor: '#ef4444', deltaLabel: '本月新增', badge: 'P1 重', badgeColor: '#ef4444' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'cloud-security', title: '☁️ 云安全评估', num: '72', numColor: '#06b6d4', unit: '/100 云安全', sparkData: [65,68,70,71,69,72,72,72], delta: '↑+7', deltaColor: '#22c55e', deltaLabel: '较上月', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'compliance-chk', title: '✅ 合规检查', num: '92%', numColor: '#22c55e', unit: '等保合规率', sparkData: [88,89,90,91,90,92,92,92], delta: '↑+4%', deltaColor: '#22c55e', deltaLabel: '近30天', badge: 'P3 轻', badgeColor: '#22c55e' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'network-seg', title: '🌐 网络分段', num: '4', numColor: '#06b6d4', unit: '安全区域', sparkData: [2,2,3,3,4,4,4,4], delta: '↑+2', deltaColor: '#22c55e', deltaLabel: '近季', badge: 'P2 中', badgeColor: '#06b6d4' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'dmz-config', title: '🛡️ DMZ 配置', num: '85%', numColor: '#22c55e', unit: 'DMZ覆盖率', sparkData: [70,75,78,80,82,84,85,85], delta: '↑+15%', deltaColor: '#22c55e', deltaLabel: '近半年', badge: 'P3 轻', badgeColor: '#22c55e' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'app-sec', title: '💻 应用安全', num: '68', numColor: '#f59e0b', unit: '/100 AppSec', sparkData: [55,58,60,62,64,66,68,68], delta: '↑+13', deltaColor: '#22c55e', deltaLabel: '较上月', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'data-arch', title: '🗄️ 数据安全架构', num: '92%', numColor: '#22c55e', unit: '数据分类覆盖', sparkData: [78,82,85,87,89,90,91,92], delta: '↑+14%', deltaColor: '#22c55e', deltaLabel: '近半年', badge: 'P2 中', badgeColor: '#22c55e' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'dr-arch', title: '🏗️ 容灾架构', num: '2h', numColor: '#22c55e', unit: 'RPO 目标', sparkData: [8,6,5,4,3,3,2,2], delta: '↓-6h', deltaColor: '#22c55e', deltaLabel: '较上年', badge: 'P2 中', badgeColor: '#22c55e' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'arch-governance', title: '📋 架构治理', num: '100%', numColor: '#22c55e', unit: '评审覆盖率', sparkData: [80,85,88,92,95,98,99,100], delta: '↑+20%', deltaColor: '#22c55e', deltaLabel: '近半年', badge: 'P3 轻', badgeColor: '#22c55e' }))}
          </div>
          ${this._renderToolGuideInline('security-architect')}
        </div>

        <div class="ciso-zone-3col">
          <div class="ciso-panel">${this._renderDarkZone('security-architect')}</div>
          <div class="ciso-panel">${this._renderFrameworkZoneExpanded('security-architect')}</div>
          <div class="ciso-panel" style="display:flex;flex-direction:column;gap:12px;">
            ${this._renderTimelineZone('security-architect')}
          </div>
        </div>
      </div>
    `
  }

  // ─── 业务安全 ───
  private _renderBizSecDashboard() {
    return html`
      <div class="ciso-role-grid">
        <div class="ciso-panel">
          <div class="ciso-panel-header">
            <span class="ciso-panel-title"><span class="icon">📊</span> 核心指标</span>
          </div>
          <div class="ciso-metrics-strip">
            ${this._renderMetricCard(this._mc({ toolId: 'bcp-mgmt', title: '🛡️ BCP 管理', num: '95%', numColor: '#22c55e', unit: 'BCP覆盖', sparkData: [88,90,91,93,94,95,95,95], delta: '↑+7%', deltaColor: '#22c55e', deltaLabel: '近半年', badge: 'P3 轻', badgeColor: '#22c55e' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'risk-score', title: '📊 风险评分板', num: '48', numColor: '#fbbf24', unit: '/100 业务风险', sparkData: [42,45,40,44,43,48,46,48], delta: '↑+6', deltaColor: '#ef4444', deltaLabel: '近30天', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'cost-calc', title: '🧮 成本计算', num: '340%', numColor: '#22c55e', unit: '安全ROI', sparkData: [280,300,310,320,330,340,340,340], delta: '↑+60%', deltaColor: '#22c55e', deltaLabel: '较上年', badge: 'P3 轻', badgeColor: '#22c55e' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'vendor-eval', title: '🏢 供应商评估', num: '1', numColor: '#f59e0b', unit: '高风险', sparkData: [2,2,1,1,2,1,1,1], delta: '↓-1', deltaColor: '#22c55e', deltaLabel: '较上月', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'kpi-track', title: '🎯 KPI 追踪', num: '87%', numColor: '#3b82f6', unit: 'BCP达成', sparkData: [78,80,82,84,85,86,87,87], delta: '↑+9%', deltaColor: '#22c55e', deltaLabel: '近90天', badge: 'P3 轻', badgeColor: '#22c55e' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'sec-awareness', title: '🎓 安全意识培训', num: '82%', numColor: '#22c55e', unit: '培训完成率', sparkData: [70,73,75,78,79,80,81,82], delta: '↑+12%', deltaColor: '#22c55e', deltaLabel: '近季', badge: 'P3 轻', badgeColor: '#22c55e' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'disaster-recovery', title: '🔄 灾难恢复', num: '4h', numColor: '#22c55e', unit: 'RTO目标', sparkData: [8,7,6,5,5,4,4,4], delta: '↓-4h', deltaColor: '#22c55e', deltaLabel: '较上年', badge: 'P2 中', badgeColor: '#22c55e' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'bia-analysis', title: '📉 BIA 覆盖率', num: '88%', numColor: '#22c55e', unit: '核心流程已分析', sparkData: [70,74,78,80,83,85,87,88], delta: '↑+18%', deltaColor: '#22c55e', deltaLabel: '近半年', badge: 'P2 中', badgeColor: '#22c55e' }))}
          </div>
          ${this._renderToolGuideInline('business-security-officer')}
        </div>

        <div class="ciso-zone-3col">
          <div class="ciso-panel">${this._renderDarkZone('business-security-officer')}</div>
          <div class="ciso-panel">${this._renderFrameworkZoneExpanded('business-security-officer')}</div>
          <div class="ciso-panel" style="display:flex;flex-direction:column;gap:12px;">
            ${this._renderTimelineZone('business-security-officer')}
          </div>
        </div>
      </div>
    `
  }

  // ─── 供应链 ───
  private _renderSupplyDashboard() {
    return html`
      <div class="ciso-role-grid">
        <div class="ciso-panel">
          <div class="ciso-panel-header">
            <span class="ciso-panel-title"><span class="icon">📊</span> 核心指标</span>
          </div>
          <div class="ciso-metrics-strip">
            ${this._renderMetricCard(this._mc({ toolId: 'sbom-scan', title: '📦 SBOM 扫描', num: '67%', numColor: '#f59e0b', unit: 'SBOM覆盖', sparkData: [45,50,55,58,60,63,65,67], delta: '↑+22%', deltaColor: '#22c55e', deltaLabel: '近半年', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'vendor-eval', title: '🏢 供应商评估', num: '1', numColor: '#ef4444', unit: 'D级高风险', sparkData: [3,2,2,1,2,1,1,1], delta: '↓-2', deltaColor: '#22c55e', deltaLabel: '较上月', badge: 'P1 重', badgeColor: '#ef4444' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'third-party-risk', title: '👥 第三方风险', num: '12', numColor: '#ef4444', unit: '高风险供应商', sparkData: [8,9,10,11,10,12,11,12], delta: '↑+4', deltaColor: '#ef4444', deltaLabel: '年度变化', badge: 'P1 重', badgeColor: '#ef4444' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'contract-review', title: '📑 合同审查', num: '3', numColor: '#f59e0b', unit: '待审查', sparkData: [1,2,2,3,2,3,3,3], delta: '↑+1', deltaColor: '#f59e0b', deltaLabel: '本月', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'compliance-chk', title: '✅ 合规检查', num: '88%', numColor: '#f59e0b', unit: '供应链合规', sparkData: [80,82,84,85,86,87,88,88], delta: '↑+8%', deltaColor: '#22c55e', deltaLabel: '近90天', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'vendor-audit', title: '📋 供应商审计', num: '5', numColor: '#f59e0b', unit: '待审计', sparkData: [8,7,6,6,5,5,5,5], delta: '↓-3', deltaColor: '#22c55e', deltaLabel: '较上月', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'dpa-mgmt', title: '📜 DPA 管理', num: '12', numColor: '#22c55e', unit: '有效DPA', sparkData: [8,9,10,11,11,12,12,12], delta: '↑+4', deltaColor: '#22c55e', deltaLabel: '近半年', badge: 'P3 轻', badgeColor: '#22c55e' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'vendor-monitor', title: '👁️ 供应商监控', num: '38', numColor: '#22c55e', unit: '在线供应商', sparkData: [30,32,34,35,36,37,38,38], delta: '↑+8', deltaColor: '#22c55e', deltaLabel: '近半年', badge: 'P3 轻', badgeColor: '#22c55e' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'sla-mgmt', title: '⏱️ SLA 达成', num: '94%', numColor: '#22c55e', unit: 'SLA 合规', sparkData: [88,90,91,92,93,93,94,94], delta: '↑+6%', deltaColor: '#22c55e', deltaLabel: '近半年', badge: 'P3 轻', badgeColor: '#22c55e' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'supply-intel', title: '🌐 供应链情报', num: '7', numColor: '#f59e0b', unit: '活跃威胁', sparkData: [3,4,5,5,6,6,7,7], delta: '↑+2', deltaColor: '#ef4444', deltaLabel: '本周', badge: 'P2 中', badgeColor: '#f59e0b' }))}
            ${this._renderMetricCard(this._mc({ toolId: 'material-track', title: '📦 物料追踪', num: '156', numColor: '#06b6d4', unit: '组件已追踪', sparkData: [100,110,120,130,140,148,155,156], delta: '↑+56', deltaColor: '#22c55e', deltaLabel: '近季', badge: 'P3 轻', badgeColor: '#22c55e' }))}
          </div>
          ${this._renderToolGuideInline('supply-chain-security')}
        </div>

        <div class="ciso-zone-3col">
          <div class="ciso-panel">${this._renderLegalZone('supply-chain-security')}</div>
          <div class="ciso-panel">${this._renderDarkZone('supply-chain-security')}</div>
          <div class="ciso-panel">${this._renderFrameworkZoneExpanded('supply-chain-security')}</div>
        </div>

        <div class="ciso-panel">${this._renderTimelineZone('supply-chain-security')}</div>
      </div>
    `
  }

  private _iconMap: Record<string, string> = {
    BellRing: '🔔', Play: '▶️', ScrollText: '📜', Siren: '🚨', Globe: '🌍', Bot: '🤖',
    BarChart3: '📊', ListChecks: '📋', Target: '🎯', PiggyBank: '💰', FileText: '📄',
    FileCode: '📝', FileBarChart: '📈', Shield: '🛡️', Lock: '🔒', Key: '🔑',
    Eye: '👁️', Search: '🔍', Users: '👥', Building: '🏢', AlertTriangle: '⚠️',
    CheckCircle: '✅', Clock: '🕐', Database: '🗄️', Cloud: '☁️', Monitor: '🖥️',
    Activity: '📉', GitBranch: '🔀', Layers: '📚', Cpu: '⚡', Wifi: '📡',
    Settings: '⚙️', Zap: '⚡', ArrowRight: '→', ChevronDown: '▾', X: '✕',
    Plus: '＋', ExternalLink: '🔗', Copy: '📋', Download: '⬇️', Upload: '⬆️',
    Filter: '🔽', RefreshCw: '🔄', Trash: '🗑️', Edit: '✏️', Share: '📤',
  }

  private _resolveIcon(icon: string): string {
    // If it's an emoji (multi-byte), use as-is
    if (/[^\x00-\x7F]/.test(icon)) return icon
    // Look up Lucide icon name → emoji fallback
    return this._iconMap[icon] || '📌'
  }

  private _renderRoleDashboard() {
    switch (this.roleId) {
      case 'ciso': return this._renderCisoDashboard()
      case 'secuclaw-commander': return this._renderCommanderDashboard()
      case 'security-ops': return this._renderOpsDashboard()
      case 'security-expert': return this._renderExpertDashboard()
      case 'privacy-officer': return this._renderPrivacyDashboard()
      case 'security-architect': return this._renderArchitectDashboard()
      case 'business-security-officer': return this._renderBizSecDashboard()
      case 'supply-chain-security': return this._renderSupplyDashboard()
      default: return this._renderCisoDashboard()
    }
  }

  private _renderToolSummary() {
    const config = ROLE_TOOL_CONFIGS[this.roleId]
    const allTools = [...config.coreTools, ...config.secondaryTools]
    const staticIds = new Set(allTools.map(t => t.id))
    const storePlugins = pluginStore.getState().getToolsByRole(this.roleId)
    for (const m of storePlugins) {
      if (!staticIds.has(m.meta.id)) {
        allTools.push({ id: m.meta.id, label: m.meta.name, icon: m.meta.icon, priority: 0 })
        staticIds.add(m.meta.id)
      }
    }
    const tools = allTools.filter(t => {
      const plugin = pluginStore.getState().getPlugin(t.id)
      return plugin ? plugin.enabled : true
    })
    if (tools.length === 0) return nothing

    const MAX_VISIBLE = 5
    const visible = tools.slice(0, MAX_VISIBLE)
    const hidden = tools.slice(MAX_VISIBLE)
    const showMore = hidden.length > 0

    return html`
      <div class="tool-summary-bar">
        ${visible.map(tool => html`
          <div class="tool-tag" @click=${() => this._openToolPanel(tool.id)}>
            <span class="tool-tag-status" style="background: ${this._getToolStatusColor(tool.id)}"></span>
            <span>${this._resolveIcon(tool.icon)} ${tool.label}</span>
          </div>
        `)}
        ${showMore ? html`
          <div class="tool-more-wrap">
            <div class="tool-tag tool-more-btn" @click=${(e: Event) => { e.stopPropagation(); this._showAllTools = !this._showAllTools }}>
              <span>更多 ▾ (${hidden.length})</span>
            </div>
            ${this._showAllTools ? html`
              <div class="tool-more-dropdown" @click=${(e: Event) => e.stopPropagation()}>
                ${hidden.map(tool => html`
                  <div class="tool-more-item" @click=${() => { this._openToolPanel(tool.id); this._showAllTools = false; }}>
                    <span class="tool-tag-status" style="background: ${this._getToolStatusColor(tool.id)}"></span>
                    <span>${this._resolveIcon(tool.icon)} ${tool.label}</span>
                  </div>
                `)}
              </div>
            ` : nothing}
          </div>
        ` : nothing}
      </div>
    `
  }

  private _getToolStatusColor(toolId: string) {
    const statuses: Record<string, string> = {
      'alert-queue': '#ef4444',
      'incident-mgmt': '#f59e0b',
      'vuln-scan': '#ef4444',
      'soar-exec': '#22c55e',
    }
    return statuses[toolId] || '#3b82f6'
  }

  private _openToolPanel(toolId: string) {
    // 检查工具是否被禁用
    const plugin = pluginStore.getState().getPlugin(toolId)
    if (plugin && !plugin.enabled) {
      this._showToast('该工具已被禁用，请在工具市场中启用')
      return
    }
    this._panelOpen = true
    // 更新路由 Hash
    window.location.hash = `#/tool/${toolId}`;
    this.dispatchEvent(new CustomEvent('open-tool-panel', { detail: { toolId }, bubbles: true, composed: true }))
  }

  private _toggleAiPanel() {
    this._aiPanelOpen = !this._aiPanelOpen
    if (this._aiPanelOpen && !this._aiPanelResult) {
      this._runRoleAiAnalysis()
    }
  }

  private async _runRoleAiAnalysis() {
    this._aiPanelLoading = true
    try {
      // Simulate API call
      await new Promise(r => setTimeout(r, 1000))
      this._aiPanelResult = {
        summary: `${this.roleId === 'ciso' ? '首席信息安全官' : ROLE_THEME_CONFIGS[this.roleId].label}安全态势良好，风险评分44/100，处于可控范围。`,
        suggestions: [
          '重点修复高风险漏洞，优先处理Critical级别漏洞',
          '优化BCP预案，提升业务连续性保障能力',
          '加强供应链安全管理，排查高风险供应商'
        ]
      }
    } catch (e) {
      this._aiPanelResult = { error: '分析失败，请稍后重试' }
    } finally {
      this._aiPanelLoading = false
    }
  }

  private _renderAiPanel() {
    if (!this._aiPanelOpen) return ''
    return html`
      <div class="ai-float-panel">
        <div class="ai-float-head">
          <span>🤖 AI 安全分析</span>
          <div class="ai-float-close" @click=${this._toggleAiPanel}>✕</div>
        </div>
        <div class="ai-float-body">
          ${this._aiPanelLoading ? html`<div style="text-align: center; padding: 32px;">分析中...</div>` : this._aiPanelResult?.error ? html`<div style="color: #ef4444;">${this._aiPanelResult.error}</div>` : html`
            <div>
              <div style="font-weight: 600; margin-bottom: 12px;">📊 分析总结</div>
              <p style="margin-bottom: 16px;">${this._aiPanelResult?.summary}</p>
              <div style="font-weight: 600; margin-bottom: 12px;">💡 优化建议</div>
              <ul style="margin: 0; padding-left: 20px;">
                ${this._aiPanelResult?.suggestions.map((s: string) => html`<li style="margin-bottom: 8px;">${s}</li>`)}
              </ul>
            </div>
          `}
        </div>
        <div class="ai-float-foot">
          <button style="padding: 6px 12px; border: 1px solid var(--sc-border-color); background: var(--sc-bg-tertiary); border-radius: 4px; color: var(--sc-text-primary); cursor: pointer;">生成报告</button>
          <button style="padding: 6px 12px; border: none; background: var(--sc-primary-color); color: white; border-radius: 4px; cursor: pointer;">重新分析</button>
        </div>
      </div>
    `
  }

  render() {
    const theme = this._getTheme()
    return html`
      <div class="role-commander" style="--sc-primary-color: ${theme['--role-primary']}; --sc-primary-alpha-10: ${theme['--role-primary']}1A;">
        <div class="status-bar" style="background: color-mix(in srgb, ${theme['--role-primary']} 8%, transparent); border-bottom: 1px solid color-mix(in srgb, ${theme['--role-primary']} 15%, transparent);">
          <span style="display: flex; align-items: center; gap: 4px;"><span class="status-dot" style="background: ${theme['--role-success']}"></span> <span style="color: ${theme['--role-success']}">系统运行正常</span></span>
          <span>当前角色：${theme.label}</span>
          <span style="margin-left: auto;">最后更新：${new Date().toLocaleString()}</span>
        </div>
        <div class="main-content">
          ${this._renderRoleDashboard()}
        </div>
        ${this._renderToolSummary()}
        ${this.roleId !== 'security-architect' && this._showToolResults ? html`
          <div class="zone zone-results">
            <sc-tool-results-panel .roleId=${this.roleId}></sc-tool-results-panel>
          </div>
        ` : nothing}
        ${this.roleId !== 'security-architect' ? html`
          <div style="display:flex;justify-content:center;padding:0 12px;background:#0d1321;border-bottom:1px solid #1e293b;${this._showToolResults ? 'margin-top:-2px;' : ''}">
            <button style="font-size:10px;padding:2px 14px;border-radius:0 0 6px 6px;border:1px solid var(--sc-border-color);border-top:none;background:var(--sc-bg-secondary);color:#64748b;cursor:pointer;transition:all 0.15s;" @click=${() => { this._showToolResults = !this._showToolResults; }}>
              ${this._showToolResults ? '▾ 收起' : '▴ 展开'}
            </button>
          </div>
        ` : nothing}
        ${this._renderAiPanel()}
        ${this._toast ? html`<div style="position:fixed;bottom:20px;right:20px;padding:10px 16px;border-radius:8px;font-size:12px;font-weight:600;z-index:3000;background:#f59e0b22;color:#f59e0b;border:1px solid #f59e0b44">⚠ ${this._toast}</div>` : nothing}
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-role-commander': ScRoleCommander
  }
}

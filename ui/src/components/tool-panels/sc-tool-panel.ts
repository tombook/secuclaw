/**
 * sc-tool-panel — 通用工具面板容器
 * 支持 3 种展开模式：slide（右侧滑出）、modal（居中模态）、fullscreen（全屏覆盖）
 */

import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { RoleId } from '../../config/role-tool-config';
import { ROLE_THEMES } from '../../config/role-theme-config';
import { renderToolContent } from './tool-panel-registry';

export type PanelMode = 'slide' | 'modal' | 'fullscreen';

@customElement('sc-tool-panel')
export class ScToolPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: fixed;
      z-index: 1000;
      inset: 0;
      pointer-events: none;
      /* Theme variables */
      --bg-primary: #0f172a;
      --bg-secondary: #1e293b;
      --bg-tertiary: #334155;
      --text-primary: #f1f5f9;
      --text-secondary: #cbd5e1;
      --text-tertiary: #94a3b8;
      --border-color: #334155;
      --accent-color: #3b82f6;
      --success-color: #22c55e;
      --warning-color: #f59e0b;
      --danger-color: #ef4444;
    }

    :host([theme="light"]) {
      --bg-primary: #ffffff;
      --bg-secondary: #f8fafc;
      --bg-tertiary: #f1f5f9;
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-tertiary: #64748b;
      --border-color: #e2e8f0;
      --accent-color: #3b82f6;
      --success-color: #10b981;
      --warning-color: #f59e0b;
      --danger-color: #dc2626;
    }

    :host([open]) {
      pointer-events: auto;
    }

    /* ─── Backdrop ─── */
    .backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      opacity: 0;
      transition: opacity 300ms ease;
    }

    :host([open]) .backdrop {
      opacity: 1;
    }

    /* ─── Slide Panel ─── */
    .panel-slide {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 420px;
      background: var(--bg-primary);
      border-left: 1px solid var(--border-color);
      transform: translateX(100%);
      transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: -8px 0 32px rgba(0, 0, 0, 0.3);
    }

    :host([open]) .panel-slide {
      transform: translateX(0);
    }

    /* ─── Modal ─── */
    .panel-modal {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.95);
      width: 580px;
      max-height: 80vh;
      background: #0f172a;
      border: 1px solid var(--panel-border, #1e293b);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transition: all 280ms cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
    }

    :host([open]) .panel-modal {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }

    /* ─── Fullscreen ─── */
    .panel-fullscreen {
      position: absolute;
      top: 48px;
      left: 220px;
      right: 0;
      bottom: 0;
      background: #0a0f1a;
      border-left: 1px solid var(--panel-border, #1e293b);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transform: translateY(12px);
      transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    :host([open]) .panel-fullscreen {
      opacity: 1;
      transform: translateY(0);
    }

    /* ─── Panel Header ─── */
    .panel-header {
      display: flex;
      align-items: center;
      padding: 14px 18px;
      border-bottom: 1px solid rgba(51, 65, 85, 0.6);
      gap: 10px;
      flex-shrink: 0;
      background: linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, transparent 100%);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }

    .panel-header .panel-icon {
      font-size: 16px;
    }

    .panel-header .panel-title {
      font-size: 14px;
      font-weight: 700;
      color: #e2e8f0;
      flex: 1;
    }

    .panel-header .panel-role-tag {
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 3px;
    }

    .panel-close, .panel-theme-toggle {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 1px solid #334155;
      background: transparent;
      color: #94a3b8;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 100ms ease;
      margin-left: 6px;
    }

    .panel-close:hover, .panel-theme-toggle:hover {
      background: #1e293b;
      color: #e2e8f0;
    }

    :host([theme="light"]) .panel-close, :host([theme="light"]) .panel-theme-toggle {
      border-color: #e2e8f0;
      color: #64748b;
    }

    :host([theme="light"]) .panel-close:hover, :host([theme="light"]) .panel-theme-toggle:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    /* ─── Panel Body ─── */
    .panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px 18px;
    }

    .panel-body::-webkit-scrollbar { width: 4px; }
    .panel-body::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }

    /* ─── Form Elements ─── */
    .form-group {
      margin-bottom: 14px;
    }

    .form-label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 4px;
    }

    .form-input, .form-select, .form-textarea {
      width: 100%;
      padding: 8px 10px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 6px;
      color: #e2e8f0;
      font-size: 12px;
      font-family: inherit;
      outline: none;
      transition: border-color 100ms ease;
      box-sizing: border-box;
    }

    .form-input:focus, .form-select:focus, .form-textarea:focus {
      border-color: var(--panel-accent, #3b82f6);
    }

    .form-select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2364748b'%3E%3Cpath d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      padding-right: 28px;
    }

    .form-textarea {
      min-height: 60px;
      resize: vertical;
    }

    .form-row {
      display: flex;
      gap: 10px;
    }

    .form-row > * { flex: 1; }

    /* ─── Execute Button ─── */
    .exec-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      padding: 10px;
      border-radius: 8px;
      border: none;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 150ms ease;
      color: #fff;
    }

    .exec-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
    .exec-btn:active { transform: translateY(0); }
    .exec-btn:disabled { opacity: 0.5; cursor: not-allowed; filter: none; transform: none; }

    /* ─── Results ─── */
    .result-section {
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid #1e293b;
    }

    .result-title {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 10px;
    }

    .result-item {
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 6px;
    }

    .result-item .ri-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .result-item .ri-title {
      font-size: 12px;
      font-weight: 700;
      color: #e2e8f0;
    }

    .result-item .ri-badge {
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 3px;
    }

    .result-item .ri-desc {
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.4;
    }

    .result-item .ri-meta {
      font-size: 10px;
      color: #475569;
      margin-top: 4px;
    }

    /* ─── Progress Bar ─── */
    .progress-bar {
      height: 4px;
      background: #1e293b;
      border-radius: 2px;
      overflow: hidden;
      margin: 10px 0;
    }

    .progress-bar .fill {
      height: 100%;
      border-radius: 2px;
      transition: width 300ms ease;
    }

    /* ─── Table ─── */
    .result-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }

    .result-table th {
      text-align: left;
      padding: 6px 8px;
      color: #64748b;
      font-weight: 600;
      border-bottom: 1px solid #1e293b;
    }

    .result-table td {
      padding: 6px 8px;
      color: #cbd5e1;
      border-bottom: 1px solid #111827;
    }

    .result-table tr:hover td {
      background: #111827;
    }

    /* ─── Status Chips ─── */
    .chip {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 3px;
    }

    .chip-critical { background: rgba(239,68,68,0.15); color: #ef4444; }
    .chip-high { background: rgba(249,115,22,0.15); color: #f97316; }
    .chip-medium { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .chip-low { background: rgba(34,197,94,0.15); color: #22c55e; }
    .chip-pass { background: rgba(34,197,94,0.15); color: #22c55e; }
    .chip-fail { background: rgba(239,68,68,0.15); color: #ef4444; }
    .chip-info { background: rgba(59,130,246,0.15); color: #3b82f6; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `;

  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String }) mode: PanelMode = 'modal';
  @property({ type: String }) toolId = '';
  @property({ type: String }) toolLabel = '';
  @property({ type: String }) toolIcon = '🔧';
  @property({ type: String }) roleId: RoleId = 'security-expert';
  @property({ type: String, reflect: true }) theme: 'dark' | 'light' = 'dark';

  connectedCallback() {
    super.connectedCallback();
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('secuclaw-theme') as 'dark' | 'light';
    if (savedTheme) {
      this.theme = savedTheme;
    }
    // Add keyboard shortcut listener
    window.addEventListener('keydown', this._handleKeydown.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this._handleKeydown.bind(this));
  }

  private _toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('secuclaw-theme', this.theme);
    // Emit theme change event for global sync
    window.dispatchEvent(new CustomEvent('secuclaw-theme-change', { detail: this.theme }));
  }

  private _handleKeydown(e: KeyboardEvent) {
    // Only handle shortcuts when panel is open
    if (!this.open) return;

    // Ctrl/Cmd + D: Toggle theme
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      this._toggleTheme();
    }
    // Ctrl/Cmd + K: Open command palette (future feature)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      console.log('Command palette shortcut pressed');
    }
    // Ctrl/Cmd + E: Export data (future feature)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      console.log('Export shortcut pressed');
    }
    // Esc: Close panel
    if (e.key === 'Escape') {
      e.preventDefault();
      this._close();
    }
  }
  @state() private _executing = false;
  @state() private _result: unknown = null;
  @state() private _execMsg = '';
  @state() private _execSuccess = false;
  @state() private _execProgress = 0;
  @state() private _execStep = '';

  private _close() {
    this.open = false;
    this._execMsg = '';
    this._execSuccess = false;
    this.dispatchEvent(new CustomEvent('panel-closed', { bubbles: true, composed: true }));
  }

  private _execute() {
    this._executing = true;
    this._result = null;
    this._execMsg = '';
    this._execSuccess = false;
    this._execProgress = 0;
    this._execStep = '';
    
    const steps: Record<string, Array<{ label: string; progress: number; delay: number }>> = {
      'risk-score': [{ label: '加载风险模型...', progress: 20, delay: 200 }, { label: '计算风险因子...', progress: 45, delay: 300 }, { label: '聚合得分...', progress: 70, delay: 250 }, { label: '生成报告...', progress: 90, delay: 200 }],
      'vuln-scan': [{ label: '连接扫描引擎...', progress: 15, delay: 200 }, { label: 'CVE 数据库同步...', progress: 35, delay: 400 }, { label: '端口扫描...', progress: 60, delay: 350 }, { label: '漏洞验证...', progress: 80, delay: 300 }, { label: '汇总结果...', progress: 95, delay: 150 }],
      'pen-test': [{ label: '信息收集...', progress: 10, delay: 250 }, { label: '端口扫描...', progress: 30, delay: 400 }, { label: '漏洞利用...', progress: 55, delay: 500 }, { label: '内网横向...', progress: 75, delay: 400 }, { label: '权限提升...', progress: 88, delay: 250 }, { label: '编写报告...', progress: 96, delay: 200 }],
      'threat-intel': [{ label: '拉取 MISP 源...', progress: 18, delay: 300 }, { label: '解析 IOC...', progress: 40, delay: 400 }, { label: '关联历史事件...', progress: 62, delay: 350 }, { label: '风险评分...', progress: 84, delay: 250 }, { label: '生成简报...', progress: 95, delay: 150 }],
      'log-analysis': [{ label: '连接 SIEM...', progress: 12, delay: 200 }, { label: '加载事件流...', progress: 35, delay: 400 }, { label: '异常检测...', progress: 58, delay: 450 }, { label: '告警关联...', progress: 75, delay: 300 }, { label: '聚合结果...', progress: 92, delay: 200 }],
      'incident-mgmt': [{ label: '加载事件详情...', progress: 15, delay: 200 }, { label: '评估影响范围...', progress: 40, delay: 350 }, { label: '隔离受感染资产...', progress: 65, delay: 400 }, { label: '启动恢复流程...', progress: 85, delay: 300 }, { label: '记录事件日志...', progress: 95, delay: 150 }],
      'gdpr-audit': [{ label: '加载合规框架...', progress: 12, delay: 200 }, { label: '数据映射检查...', progress: 35, delay: 400 }, { label: '同意书审查...', progress: 58, delay: 350 }, { label: 'DPIA 验证...', progress: 75, delay: 300 }, { label: '生成审计报告...', progress: 92, delay: 200 }],
      'sbom-scan': [{ label: '解析依赖树...', progress: 15, delay: 250 }, { label: 'CVE 匹配...', progress: 40, delay: 450 }, { label: '许可证检查...', progress: 65, delay: 350 }, { label: '风险评分...', progress: 82, delay: 250 }, { label: '生成 SBOM...', progress: 95, delay: 200 }],
      'zero-trust': [{ label: '身份验证检查...', progress: 15, delay: 250 }, { label: '设备健康评估...', progress: 38, delay: 400 }, { label: '网络分段验证...', progress: 60, delay: 350 }, { label: '策略符合性检查...', progress: 80, delay: 300 }, { label: '计算成熟度...', progress: 94, delay: 180 }],
      'third-party-risk': [{ label: '加载供应商列表...', progress: 12, delay: 200 }, { label: '安全问卷评估...', progress: 35, delay: 450 }, { label: '漏洞扫描...', progress: 58, delay: 400 }, { label: '合规性验证...', progress: 78, delay: 300 }, { label: '风险评级...', progress: 92, delay: 200 }],
    };
    
    const toolSteps = steps[this.toolId] || [
      { label: '初始化...', progress: 25, delay: 300 },
      { label: '处理中...', progress: 60, delay: 400 },
      { label: '完成...', progress: 90, delay: 250 },
    ];
    
    const results: Record<string, { msg: string; data: unknown }> = {
      'risk-score': { msg: '风险评估完成：综合风险 44/100 (中)', data: { score: 44 } },
      'kpi-track': { msg: 'KPI 刷新完成：85% 达成', data: { rate: 85 } },
      'board-report': { msg: '董事会报告已生成 (Q2 2026)', data: {} },
      'budget-dash': { msg: '预算数据已更新：63% 使用率', data: {} },
      'compliance-chk': { msg: '合规检查完成：91% 合规', data: {} },
      'global-situation': { msg: '全域态势刷新完成：58 分', data: {} },
      'ai-dispatch': { msg: 'AI 调度完成：已分配 3 个任务', data: {} },
      'incident-mgmt': { msg: '事件状态更新：4 项待处理', data: {} },
      'alert-queue': { msg: '告警处理完成：已隔离 web-prod-01', data: { asset: 'web-prod-01' } },
      'soar-exec': { msg: 'SOAR 剧本执行完成：3 步骤成功', data: ['剧本加载', '资产隔离', '通知团队'] },
      'log-analysis': { msg: '日志分析完成：发现 12 条异常', data: {} },
      'vuln-scan': { msg: '漏洞扫描完成：65 个 CVE', data: {} },
      'threat-intel': { msg: '威胁情报更新：12 条新情报', data: {} },
      'pen-test': { msg: '渗透测试报告已生成：12 发现', data: {} },
      'patch-mgmt': { msg: '补丁扫描完成：8 个待修补', data: {} },
      'threat-model': { msg: 'STRIDE 建模完成：23 个威胁项', data: {} },
      'iam-config': { msg: 'IAM 审计完成：5 项高风险配置', data: {} },
      'zero-trust': { msg: '零信任评估完成：成熟度 3.2/5', data: {} },
      'cloud-security': { msg: '云安全评估完成：72/100', data: {} },
      'gdpr-audit': { msg: 'GDPR 审计完成：87% 合规', data: {} },
      'data-map': { msg: '数据地图已更新：3 个新数据流', data: {} },
      'policy-mgmt': { msg: '策略更新完成：2 条待审批', data: {} },
      'vendor-eval': { msg: '供应商评估完成：1 个高风险', data: {} },
      'bcp-mgmt': { msg: 'BCP 状态更新：95% 覆盖率', data: {} },
      'cost-calc': { msg: '安全 ROI 计算完成：340%', data: {} },
      'sbom-scan': { msg: 'SBOM 扫描完成：3 个高危组件', data: {} },
      'third-party-risk': { msg: '第三方风险完成：12 个高风险供应商', data: {} },
      'contract-review': { msg: '合同审查完成：5 份待审', data: {} },
      'risk-register': { msg: '风险登记更新完成', data: {} },
      'report-gen': { msg: '报告生成完成', data: {} },
    };
    
    let stepIndex = 0;
    const runStep = () => {
      if (stepIndex < toolSteps.length) {
        const step = toolSteps[stepIndex];
        this._execStep = step.label;
        this._execProgress = step.progress;
        stepIndex++;
        setTimeout(runStep, step.delay);
      } else {
        this._execProgress = 100;
        this._execStep = '完成';
        setTimeout(() => {
          this._executing = false;
          const r = results[this.toolId];
          if (r) { this._result = r.data; this._execMsg = r.msg; }
          else { this._execMsg = `${this.toolLabel} 执行完成`; }
          this._execSuccess = true;
          setTimeout(() => { this._execSuccess = false; }, 5000);
        }, 300);
      }
    };
    runStep();
  }

  render() {
    const theme = ROLE_THEMES[this.roleId];
    const borderColor = theme?.primary ?? '#3b82f6';
    const accentColor = theme?.primary ?? '#3b82f6';
    const roleLabel = theme?.label ?? '';
    const panelClass = `panel-${this.mode}`;

    return html`
      <style>
        :host { --panel-border: ${borderColor}44; --panel-accent: ${accentColor}; }
      </style>
      <div class="backdrop" @click=${this._close}></div>
      <div class="${panelClass}" style="--panel-border:${borderColor}44;--panel-accent:${accentColor}">
        <div class="panel-header" style="border-bottom-color:${borderColor}33">
          <span class="panel-icon">${this.toolIcon}</span>
          <span class="panel-title">${this.toolLabel}</span>
          <span class="panel-role-tag" style="background:${borderColor}22;color:${borderColor}">${roleLabel}</span>
          <button class="panel-theme-toggle" @click=${this._toggleTheme} title="切换${this.theme === 'dark' ? '浅色' : '深色'}主题">
            ${this.theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button class="panel-close" @click=${this._close} title="关闭">✕</button>
        </div>
        <div class="panel-body">
          ${this._executing ? html`
            <div style="text-align:center;padding:36px 0">
              <div style="display:inline-block;width:36px;height:36px;border:3px solid ${accentColor}33;border-top-color:${accentColor};border-radius:50%;animation:spin 0.8s linear infinite"></div>
              <div style="margin-top:14px;color:#e2e8f0;font-size:12px;font-weight:600">${this._execStep}</div>
              <div class="progress-bar" style="margin-top:16px;width:70%;margin-left:auto;margin-right:auto">
                <div class="fill" style="width:${this._execProgress}%;background:${accentColor}"></div>
              </div>
              <div style="margin-top:6px;color:#64748b;font-size:10px">${this._execProgress}%</div>
            </div>
          ` : renderToolContent(this.toolId, this.roleId, this._executing, this._result, () => this._execute())}
          ${this._execSuccess ? html`<div style="position:sticky;bottom:0;left:0;right:0;background:#052e16;border-top:1px solid #22c55e33;padding:10px 16px;display:flex;align-items:center;gap:8px;animation:slideUp 0.3s ease-out"><span style="color:#22c55e;font-size:14px">✓</span><span style="color:#86efac;font-size:12px">${this._execMsg}</span></div>` : ''}
        </div>
      </div>
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'sc-tool-panel': ScToolPanel; } }

/**
 * sc-tool-results-panel — 工具执行结果 + 待办事项面板
 * 显示工具最近执行结果、待处理任务、快捷操作
 * 位于仪表盘下方、工具条上方
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { RoleId } from '../../config/role-tool-config';
import { ROLE_TOOL_CONFIGS } from '../../config/role-tool-config';
import { ROLE_THEMES } from '../../config/role-theme-config';

export {};

// ─── Types ────────────────────────────────────────────────────

interface ToolResultItem {
  toolId: string;
  toolName: string;
  toolIcon: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  summary: string;
  detail: string;
  time: string;
  priority?: 'P1' | 'P2' | 'P3';
}

interface TodoItem {
  id: string;
  title: string;
  toolId: string;
  priority: 'P1' | 'P2' | 'P3';
  status: 'pending' | 'done';
  roleTag: string;
  roleColor: string;
  dueTime?: string;
}

// ─── Mock Data Per Role ───────────────────────────────────────

function getMockResults(roleId: RoleId): ToolResultItem[] {
  const now = new Date();
  const fmt = (mins: number) => {
    if (mins < 60) return `${mins}分钟前`;
    return `${Math.floor(mins / 60)}小时前`;
  };
  const m = (n: number) => Math.floor(n);

  switch (roleId) {
    case 'ciso':
      return [
        { toolId: 'risk-score', toolName: '风险评分板', toolIcon: '📊', status: 'warning', summary: 'Q2 综合风险评分 44/100', detail: '运营风险上升 8%，需关注告警处置效率', time: fmt(m((now.getTime() - Date.now()) / 60000) + 10), priority: 'P2' },
        { toolId: 'compliance-chk', toolName: '合规检查', toolIcon: '✅', status: 'success', summary: 'GDPR 合规率 93%', detail: '跨境数据传输条款需补充 SCCs', time: fmt(m((now.getTime() - Date.now()) / 60000) + 45), priority: 'P3' },
        { toolId: 'board-report', toolName: '董事会报告', toolIcon: '📋', status: 'pending', summary: 'Q2 安全态势报告 — 待提交', detail: '截止日期：4月25日，需 CISO 审批', time: '2天后', priority: 'P1' },
        { toolId: 'kpi-track', toolName: 'KPI 追踪', toolIcon: '🎯', status: 'success', summary: '4月 KPI 达成率 85%', detail: 'MTTD 目标 12min，当前 15min，需优化', time: fmt(m((now.getTime() - Date.now()) / 60000) + 120), priority: 'P2' },
      ];
    case 'security-architect':
      return [
        { toolId: 'threat-model', toolName: '威胁建模 STRIDE', toolIcon: '⚠️', status: 'warning', summary: '零信任网关 v3 — 发现 6 个威胁', detail: '容器逃逸风险（E）严重，需立即缓解', time: fmt(m((now.getTime() - Date.now()) / 60000) + 20), priority: 'P1' },
        { toolId: 'zero-trust', toolName: '零信任评估', toolIcon: '🔐', status: 'warning', summary: '成熟度 3.2/5', detail: '网络分段维度偏低，建议加强微隔离', time: fmt(m((now.getTime() - Date.now()) / 60000) + 60), priority: 'P2' },
        { toolId: 'iam-config', toolName: 'IAM 配置审计', toolIcon: '🔑', status: 'error', summary: '发现 5 个高风险配置', detail: '2个账号权限过大，3个孤立账号需清理', time: fmt(m((now.getTime() - Date.now()) / 60000) + 30), priority: 'P1' },
        { toolId: 'cloud-security', toolName: '云安全评估', toolIcon: '☁️', status: 'warning', summary: '云安全评分 72/100', detail: 'CSPM 12 项未通过，主要在 S3 桶策略', time: fmt(m((now.getTime() - Date.now()) / 60000) + 90), priority: 'P2' },
      ];
    case 'security-ops':
      return [
        { toolId: 'alert-queue', toolName: '告警队列', toolIcon: '🚨', status: 'error', summary: '活跃告警 8 条', detail: 'P1: 2条 / P2: 3条 / P3: 3条', time: fmt(5), priority: 'P1' },
        { toolId: 'soar-exec', toolName: 'SOAR 剧本', toolIcon: '⚡', status: 'success', summary: '木马遏制剧本执行成功', detail: 'web-prod-01 隔离完成，耗时 2.3s', time: fmt(15), priority: 'P1' },
        { toolId: 'threat-intel', toolName: '威胁情报', toolIcon: '📡', status: 'warning', summary: '新增 12 条情报', detail: 'CVE-2026-1234 PoC 已公开，建议优先排查', time: fmt(40), priority: 'P2' },
        { toolId: 'incident-mgmt', toolName: '事件管理', toolIcon: '🚑', status: 'pending', summary: 'P1 横向移动 — 处置中', detail: '已隔离，涉及 3 台主机，等待取证', time: fmt(22), priority: 'P1' },
      ];
    case 'security-expert':
      return [
        { toolId: 'vuln-scan', toolName: '漏洞扫描', toolIcon: '🛡️', status: 'error', summary: '发现 65 个 CVE', detail: 'Critical: 8 / High: 23 / Medium: 34', time: fmt(55), priority: 'P1' },
        { toolId: 'threat-intel', toolName: '威胁情报', toolIcon: '📡', status: 'warning', summary: 'CVE-2026-1234 CVSS 9.8', detail: 'Log4Shell RCE 已公开 PoC，需紧急修复', time: fmt(30), priority: 'P1' },
        { toolId: 'patch-mgmt', toolName: '补丁管理', toolIcon: '📦', status: 'warning', summary: '高危补丁覆盖率 74%', detail: 'Critical 覆盖率 87%，High 仅 71%', time: fmt(120), priority: 'P2' },
        { toolId: 'pen-test', toolName: '渗透测试', toolIcon: '🔍', status: 'pending', summary: 'Web 应用测试 — 进行中', detail: '已发现 12 个可利用漏洞，待验证', time: fmt(180), priority: 'P2' },
      ];
    case 'privacy-officer':
      return [
        { toolId: 'gdpr-audit', toolName: 'GDPR 审计', toolIcon: '📜', status: 'warning', summary: 'GDPR 合规率 87%', detail: 'Art.35 DPIA 完成度 76%，3项未评估', time: fmt(40), priority: 'P2' },
        { toolId: 'compliance-chk', toolName: '合规检查', toolIcon: '✅', status: 'success', summary: 'PIPL 合规率 88%', detail: '数据保留策略已过期，需更新', time: fmt(90), priority: 'P3' },
        { toolId: 'data-map', toolName: '数据地图', toolIcon: '🗺️', status: 'pending', summary: '跨境数据流 3 条待审查', detail: '欧盟→美国传输链路缺少标准合同条款', time: '今天', priority: 'P2' },
        { toolId: 'vendor-eval', toolName: '供应商评估', toolIcon: '🏢', status: 'warning', summary: '金蝶安全评级 B', detail: '数据处理协议过期，续签待处理', time: fmt(200), priority: 'P3' },
      ];
    case 'business-security-officer':
      return [
        { toolId: 'bcp-mgmt', toolName: 'BCP 管理', toolIcon: '🛡️', status: 'success', summary: 'BCP 覆盖率 95%', detail: 'RTO 达标率 96%，1项超时（客户通知 18min）', time: fmt(70), priority: 'P2' },
        { toolId: 'cost-calc', toolName: '成本计算', toolIcon: '🧮', status: 'success', summary: '安全 ROI 340%', detail: '年度安全投入产出比同比 +12%', time: fmt(150), priority: 'P3' },
        { toolId: 'risk-score', toolName: '风险评分板', toolIcon: '📊', status: 'warning', summary: '业务风险 48/100', detail: '供应链中断风险上升，需更新 BCP', time: fmt(30), priority: 'P2' },
        { toolId: 'kpi-track', toolName: 'KPI 追踪', toolIcon: '🎯', status: 'pending', summary: 'BCP 演练覆盖率 91%', detail: '还需 1 次全员演练即可达标', time: '本周', priority: 'P3' },
      ];
    case 'secuclaw-commander':
      return [
        { toolId: 'global-situation', toolName: '全域态势', toolIcon: '🌐', status: 'warning', summary: '全局风险 58/100', detail: '安全运营告警激增，跨域协调请求 12 条', time: fmt(8), priority: 'P1' },
        { toolId: 'incident-mgmt', toolName: '事件管理', toolIcon: '🚑', status: 'error', summary: '活跃 P1 事件 4 起', detail: 'APT C2 通道处置中，横向移动已隔离', time: fmt(3), priority: 'P1' },
        { toolId: 'ai-dispatch', toolName: 'AI 调度', toolIcon: '🤖', status: 'success', summary: '3 个 AI 任务运行中', detail: '威胁情报聚合完成，漏洞排序完成', time: fmt(12), priority: 'P2' },
        { toolId: 'board-report', toolName: '董事会报告', toolIcon: '📋', status: 'pending', summary: 'Q2 安全态势 — 待审批', detail: '指挥官需审核后提交', time: '明天', priority: 'P1' },
      ];
    case 'supply-chain-security':
      return [
        { toolId: 'sbom-scan', toolName: 'SBOM 扫描', toolIcon: '📦', status: 'warning', summary: 'SBOM 覆盖率 67%', detail: '2 个供应商尚未提交 SBOM', time: fmt(60), priority: 'P2' },
        { toolId: 'vendor-eval', toolName: '供应商评估', toolIcon: '🏢', status: 'error', summary: 'SolarWinds 安全评级 D', detail: '已知严重漏洞未修复，建议替换', time: fmt(90), priority: 'P1' },
        { toolId: 'third-party-risk', toolName: '第三方风险', toolIcon: '👥', status: 'warning', summary: '高风险供应商 12 家', detail: '3 家 D 级供应商合同待审查', time: fmt(120), priority: 'P2' },
        { toolId: 'contract-review', toolName: '合同审查', toolIcon: '📑', status: 'pending', summary: '3 份合同待审查', detail: '数据处理协议附件需补充安全条款', time: '本周', priority: 'P3' },
      ];
    default:
      return [];
  }
}

// ─── Chip Helpers ─────────────────────────────────────────────

function chipStyle(status: ToolResultItem['status']) {
  switch (status) {
    case 'success': return { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' };
    case 'warning': return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' };
    case 'error': return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' };
    case 'pending': return { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' };
  }
}

function priorityColor(p?: string) {
  if (p === 'P1') return '#ef4444';
  if (p === 'P2') return '#f59e0b';
  return '#22c55e';
}

// ─── Component ─────────────────────────────────────────────────

@customElement('sc-tool-results-panel')
export class ScToolResultsPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
      border-top: 1px solid var(--sc-border-color);
      background: var(--sc-bg-secondary);
      padding: 0;
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--sc-border-color);
    }

    .panel-header-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--sc-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .tab-bar {
      display: flex;
      gap: 2px;
      margin-left: auto;
    }

    .tab {
      padding: 3px 10px;
      border-radius: 3px;
      font-size: 10px;
      border: none;
      background: transparent;
      color: var(--sc-text-muted);
      cursor: pointer;
      transition: all 120ms ease;
    }

    .tab:hover { background: var(--sc-bg-tertiary); color: var(--sc-text-primary); }
    .tab.active { background: var(--sc-primary-color); color: white; }

    .panel-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
    }

    .carousel-section {
      padding: 6px 8px 2px;
      overflow: hidden;
    }
    .carousel-section + .carousel-section {
      border-left: 1px solid var(--sc-border-color);
    }
    .carousel-track {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
      padding: 4px 0 6px;
    }
    .carousel-track::-webkit-scrollbar { height: 2px; }
    .carousel-track::-webkit-scrollbar-thumb { background: var(--sc-border-color); border-radius: 2px; }

    .carousel-card {
      flex: 0 0 220px;
      scroll-snap-align: start;
    }

    .carousel-wrap {
      position: relative;
    }
    .carousel-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 1px solid #334155;
      background: #0f172acc;
      color: #94a3b8;
      font-size: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      transition: all 0.15s;
      padding: 0;
    }
    .carousel-arrow:hover { background: #1e293b; color: #e2e8f0; border-color: #475569; }
    .carousel-arrow.left { left: 0; }
    .carousel-arrow.right { right: 0; }

    .result-list, .todo-list {
      padding: 0;
      max-height: none;
    }

    .section-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--sc-text-muted);
      margin-bottom: 6px;
    }

    .result-card {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 7px 8px;
      border-radius: 5px;
      border: 1px solid transparent;
      background: var(--sc-bg-tertiary);
      cursor: pointer;
      transition: all 100ms ease;
      border-left: 2px solid transparent;
    }

    .result-card:hover {
      border-color: var(--sc-primary-color);
      background: var(--sc-bg-primary);
    }

    .result-card.status-error { border-left-color: #ef4444; }
    .result-card.status-warning { border-left-color: #f59e0b; }
    .result-card.status-success { border-left-color: #22c55e; }
    .result-card.status-pending { border-left-color: #3b82f6; }

    .result-icon {
      font-size: 14px;
      margin-top: 1px;
      flex-shrink: 0;
    }

    .result-body { flex: 1; min-width: 0; }

    .result-title {
      font-size: 11px;
      font-weight: 600;
      color: var(--sc-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .result-summary {
      font-size: 10px;
      color: var(--sc-text-secondary);
      margin-top: 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .result-detail {
      font-size: 9px;
      color: var(--sc-text-muted);
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .result-meta {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 3px;
    }

    .priority-chip {
      font-size: 8px;
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 2px;
    }

    .time-badge {
      font-size: 9px;
      color: var(--sc-text-muted);
      margin-left: auto;
    }

    /* Todo items */
    .todo-item {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 6px 8px;
      border-radius: 5px;
      background: var(--sc-bg-tertiary);
      cursor: pointer;
      transition: background 100ms ease;
      border: 1px solid transparent;
    }

    .todo-item:hover { background: var(--sc-bg-primary); border-color: var(--sc-border-color); }
    .todo-item.done { opacity: 0.5; }

    .todo-check {
      width: 14px;
      height: 14px;
      border-radius: 3px;
      border: 1px solid var(--sc-border-color);
      background: transparent;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      color: transparent;
      transition: all 120ms ease;
    }

    .todo-item.done .todo-check {
      background: var(--sc-success-color);
      border-color: var(--sc-success-color);
      color: white;
    }

    .todo-body { flex: 1; min-width: 0; }

    .todo-title {
      font-size: 11px;
      color: var(--sc-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .todo-item.done .todo-title {
      text-decoration: line-through;
    }

    .todo-meta {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 1px;
    }

    .todo-role {
      font-size: 9px;
      padding: 1px 5px;
      border-radius: 2px;
      font-weight: 600;
    }

    .todo-time {
      font-size: 9px;
      color: var(--sc-text-muted);
      margin-left: auto;
    }

    .empty-hint {
      text-align: center;
      padding: 16px 12px;
      color: var(--sc-text-muted);
      font-size: 11px;
    }

    .empty-hint .icon { font-size: 20px; opacity: 0.4; display: block; margin-bottom: 4px; }

    .item-actions {
      display: flex; gap: 2px; flex-shrink: 0;
      opacity: 0; transition: opacity 0.15s;
    }
    .result-card:hover .item-actions, .todo-item:hover .item-actions { opacity: 1; }
    .item-action-btn {
      width: 18px; height: 18px; border-radius: 3px; border: 1px solid #334155;
      background: transparent; color: #64748b; font-size: 8px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      padding: 0; transition: all 0.1s;
    }
    .item-action-btn:hover { border-color: #475569; color: #e2e8f0; background: #ffffff10; }

    .hidden-bar {
      display: flex; gap: 6px; padding: 4px 12px; flex-wrap: wrap;
      border-top: 1px solid var(--sc-border-color); background: #0f172a;
    }
    .hidden-tag {
      font-size: 9px; padding: 2px 8px; border-radius: 3px;
      display: flex; align-items: center; gap: 4px; cursor: pointer;
      border: 1px solid #1e293b; background: transparent; color: #64748b;
      transition: all 0.1s;
    }
    .hidden-tag:hover { border-color: #475569; color: #e2e8f0; }
    .hidden-tag .restore { color: #3b82f6; font-weight: 600; }
    .hidden-tag.dismissed { border-color: #ef444444; }
    .hidden-tag.hidden { border-color: #64748b44; }

    /* Scrollbar */
    .result-list::-webkit-scrollbar, .todo-list::-webkit-scrollbar { width: 3px; }
    .result-list::-webkit-scrollbar-thumb, .todo-list::-webkit-scrollbar-thumb { background: var(--sc-border-color); border-radius: 2px; }
  `;

  @property({ type: String }) roleId: RoleId = 'ciso';

  @state() private _dismissedIds = new Set<string>();
  @state() private _hiddenIds = new Set<string>();

  private _scrollCarousel(trackSelector: string, dir: 'left' | 'right') {
    const track = this.shadowRoot?.querySelector(trackSelector) as HTMLElement;
    if (!track) return;
    const delta = track.clientWidth * 0.7;
    track.scrollBy({ left: dir === 'left' ? -delta : delta, behavior: 'smooth' });
  }

  private _dismiss(id: string) {
    const s = new Set(this._dismissedIds);
    s.add(id);
    this._dismissedIds = s;
  }

  private _hide(id: string) {
    const s = new Set(this._hiddenIds);
    s.add(id);
    this._hiddenIds = s;
  }

  private _restore(id: string) {
    const d = new Set(this._dismissedIds); d.delete(id); this._dismissedIds = d;
    const h = new Set(this._hiddenIds); h.delete(id); this._hiddenIds = h;
  }

  private _getVisibleResults(): ToolResultItem[] {
    return this._getResults().filter(r => !this._dismissedIds.has(r.toolId) && !this._hiddenIds.has(r.toolId));
  }

  private _getVisibleTodos(): TodoItem[] {
    return this._getTodos().filter(t => !this._dismissedIds.has(t.id) && !this._hiddenIds.has(t.id));
  }

  private _getResults(): ToolResultItem[] {
    return getMockResults(this.roleId);
  }

  private _getTodos(): TodoItem[] {
    const results = this._getResults();
    return results
      .filter(r => r.status === 'error' || r.status === 'pending' || r.priority === 'P1')
      .map(r => ({
        id: r.toolId,
        title: r.summary,
        toolId: r.toolId,
        priority: r.priority ?? 'P2',
        status: r.status === 'pending' ? 'pending' : 'pending',
        roleTag: ROLE_THEMES[this.roleId]?.label ?? '',
        roleColor: ROLE_THEMES[this.roleId]?.['--role-primary'] ?? '#3b82f6',
        dueTime: r.time,
      }));
  }

  private _openTool(toolId: string) {
    this.dispatchEvent(new CustomEvent('open-tool', {
      detail: { toolId },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    const results = this._getVisibleResults();
    const todos = this._getVisibleTodos();
    const allResults = this._getResults();
    const allTodos = this._getTodos();
    const priorityCount = results.filter(r => r.priority === 'P1' || r.status === 'error').length;
    const hiddenCount = this._dismissedIds.size + this._hiddenIds.size;

    return html`
      <div class="panel-header">
        <span style="font-size:12px">📋</span>
        <span class="panel-header-title">工具结果 &amp; 待处理</span>
        ${priorityCount > 0 ? html`
          <span style="margin-left:6px;font-size:9px;font-weight:700;padding:1px 6px;border-radius:3px;background:rgba(239,68,68,0.15);color:#ef4444">
            ${priorityCount} 紧急
          </span>
        ` : nothing}
        ${hiddenCount > 0 ? html`
          <span style="margin-left:4px;font-size:9px;color:#64748b;cursor:pointer;" @click=${() => { this._dismissedIds = new Set(); this._hiddenIds = new Set(); }}>
            ${this._dismissedIds.size} 关闭 · ${this._hiddenIds.size} 隐藏 ↩ 全部恢复
          </span>
        ` : nothing}
      </div>

      <div class="panel-body">
        <!-- Left column: 执行结果 carousel -->
        <div class="carousel-section">
          <div class="section-label">📊 执行结果${results.length > 0 ? ` (${results.length})` : ''}</div>
          <div class="carousel-wrap">
            <button class="carousel-arrow left" @click=${() => this._scrollCarousel('#track-results', 'left')}>‹</button>
            <div class="carousel-track" id="track-results">
              ${results.length > 0 ? results.map(r => {
                const style = chipStyle(r.status);
                return html`
                  <div class="carousel-card">
                    <div class="result-card status-${r.status}" @click=${() => this._openTool(r.toolId)}>
                      <span class="result-icon">${r.toolIcon}</span>
                      <div class="result-body">
                        <div class="result-title">${r.toolName}</div>
                        <div class="result-summary">${r.summary}</div>
                        <div class="result-detail">${r.detail}</div>
                        <div class="result-meta">
                          ${r.priority ? html`
                            <span class="priority-chip" style="background:${priorityColor(r.priority)}22;color:${priorityColor(r.priority)}">${r.priority}</span>
                          ` : nothing}
                          <span style="font-size:9px;color:${style.color}">
                            ${r.status === 'success' ? '✓ 成功' : r.status === 'warning' ? '⚠ 警告' : r.status === 'error' ? '✕ 错误' : '◌ 待处理'}
                          </span>
                          <span class="time-badge">${r.time}</span>
                        </div>
                      </div>
                      <div class="item-actions" @click=${(e: Event) => e.stopPropagation()}>
                        <button class="item-action-btn" title="关闭" @click=${() => this._dismiss(r.toolId)}>✕</button>
                        <button class="item-action-btn" title="隐藏" @click=${() => this._hide(r.toolId)}>👁</button>
                      </div>
                    </div>
                  </div>
                `;
              }) : html`
                <div class="empty-hint" style="flex:none;">
                  <span class="icon">📭</span>
                  暂无工具执行结果
                </div>
              `}
            </div>
            <button class="carousel-arrow right" @click=${() => this._scrollCarousel('#track-results', 'right')}>›</button>
          </div>
        </div>

        <!-- Right column: 待办事项 carousel -->
        <div class="carousel-section">
          <div class="section-label">⏱️ 待办事项${todos.length > 0 ? ` (${todos.length})` : ''}</div>
          <div class="carousel-wrap">
            <button class="carousel-arrow left" @click=${() => this._scrollCarousel('#track-todos', 'left')}>‹</button>
            <div class="carousel-track" id="track-todos">
              ${todos.length > 0 ? todos.map(t => html`
                <div class="carousel-card">
                  <div class="todo-item ${t.status === 'done' ? 'done' : ''}" @click=${() => this._openTool(t.toolId)}>
                    <div class="todo-check">✓</div>
                    <div class="todo-body">
                      <div class="todo-title">${t.title}</div>
                      <div class="todo-meta">
                        <span class="priority-chip" style="background:${priorityColor(t.priority)}22;color:${priorityColor(t.priority)}">${t.priority}</span>
                        <span class="todo-role" style="background:${t.roleColor}22;color:${t.roleColor}">${t.roleTag}</span>
                      </div>
                    </div>
                    ${t.dueTime ? html`<span class="todo-time">${t.dueTime}</span>` : nothing}
                    <div class="item-actions" @click=${(e: Event) => e.stopPropagation()}>
                      <button class="item-action-btn" title="关闭" @click=${() => this._dismiss(t.id)}>✕</button>
                      <button class="item-action-btn" title="隐藏" @click=${() => this._hide(t.id)}>👁</button>
                    </div>
                  </div>
                </div>
              `) : html`
                <div class="empty-hint" style="flex:none;">
                  <span class="icon">✅</span>
                  所有事项已处理
                </div>
              `}
            </div>
            <button class="carousel-arrow right" @click=${() => this._scrollCarousel('#track-todos', 'right')}>›</button>
          </div>
        </div>
      </div>

      ${hiddenCount > 0 ? html`
        <div class="hidden-bar">
          ${allResults.filter(r => this._dismissedIds.has(r.toolId) || this._hiddenIds.has(r.toolId)).map(r => {
            const isDismissed = this._dismissedIds.has(r.toolId);
            return html`
              <span class="hidden-tag ${isDismissed ? 'dismissed' : 'hidden'}" @click=${() => this._restore(r.toolId)}>
                ${r.toolIcon} ${r.toolName}
                <span class="restore" title="${isDismissed ? '关闭项，点击恢复' : '隐藏项，点击恢复'}">
                  ${isDismissed ? '✕恢复' : '👁恢复'}
                </span>
              </span>
            `;
          })}
          ${allTodos.filter(t => (this._dismissedIds.has(t.id) || this._hiddenIds.has(t.id)) && !this._dismissedIds.has(t.toolId) && !this._hiddenIds.has(t.toolId)).map(t => {
            const isDismissed = this._dismissedIds.has(t.id);
            return html`
              <span class="hidden-tag ${isDismissed ? 'dismissed' : 'hidden'}" @click=${() => this._restore(t.id)}>
                📋 ${t.title.slice(0, 12)}${t.title.length > 12 ? '…' : ''}
                <span class="restore">${isDismissed ? '✕恢复' : '👁恢复'}</span>
              </span>
            `;
          })}
        </div>
      ` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-tool-results-panel': ScToolResultsPanel;
  }
}

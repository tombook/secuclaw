/**
 * sc-overview — PC 桌面总览仪表盘
 * 固定高度、高信息密度、网格布局
 * @see v2.1 文档 3.7 统一总览视图
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import type { RoleId } from '../config/role-tool-config';
import { ROLE_TOOL_CONFIGS, ALL_ROLE_IDS } from '../config/role-tool-config';
import { ROLE_THEMES } from '../config/role-theme-config';
import { fetchOverview, fetchRoleMetrics, type OverviewData } from '../services/api-service';
import { ROLE_DASHBOARDS } from '../config/role-dashboard-config';

interface RoleStatus {
  roleId: RoleId;
  label: string;
  status: 'normal' | 'warning' | 'danger';
  topMetric: string;
  topValue: string;
}

@customElement('sc-overview')
export class ScOverview extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
      overflow: auto;
      padding: 16px 20px;
      background: #0a0f1a;
    }

    /* ─── Top KPI Row ─────────────────────────── */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }

    .kpi-card {
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .kpi-card .kpi-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }

    .kpi-card .kpi-icon.score { background: rgba(34,197,94,0.12); }
    .kpi-card .kpi-icon.events { background: rgba(239,68,68,0.12); }
    .kpi-card .kpi-icon.pending { background: rgba(245,158,11,0.12); }
    .kpi-card .kpi-icon.collab { background: rgba(59,130,246,0.12); }

    .kpi-card .kpi-data {
      display: flex;
      flex-direction: column;
    }

    .kpi-card .kpi-value {
      font-size: 24px;
      font-weight: 800;
      line-height: 1.2;
    }

    .kpi-card .kpi-value.danger { color: #ef4444; }
    .kpi-card .kpi-value.warning { color: #f59e0b; }
    .kpi-card .kpi-value.success { color: #22c55e; }
    .kpi-card .kpi-value.info { color: #3b82f6; }

    .kpi-card .kpi-label {
      font-size: 11px;
      color: #64748b;
    }

    .kpi-card .kpi-trend {
      font-size: 10px;
      margin-top: 2px;
    }

    .kpi-card .kpi-trend.up { color: #22c55e; }
    .kpi-card .kpi-trend.down { color: #ef4444; }

    /* ─── Two Column Layout ───────────────────── */
    .main-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 12px;
      height: calc(100% - 120px);
      min-height: 400px;
    }

    /* ─── Role Cards Grid ─────────────────────── */
    .roles-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow-y: auto;
      min-height: 0;
    }

    .roles-section::-webkit-scrollbar { width: 3px; }
    .roles-section::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }

    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #475569;
      margin-bottom: 0;
      flex-shrink: 0;
    }

    .roles-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      flex-shrink: 0;
    }

    .role-card {
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 6px;
      padding: 8px 10px;
      cursor: pointer;
      transition: all 150ms ease;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .role-card:hover {
      border-color: var(--card-color, #3b82f6);
      transform: translateY(-1px);
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
    }

    .role-card .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .role-card .card-name {
      font-size: 12px;
      font-weight: 700;
    }

    .role-card .card-status {
      font-size: 8px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 2px;
    }

    .card-status.normal { background: rgba(34,197,94,0.12); color: #22c55e; }
    .card-status.warning { background: rgba(245,158,11,0.12); color: #f59e0b; }
    .card-status.danger { background: rgba(239,68,68,0.12); color: #ef4444; }

    .role-card .card-metric {
      font-size: 18px;
      font-weight: 800;
    }

    .role-card .card-metric-label {
      font-size: 9px;
      color: #64748b;
    }

    .role-card .card-enter {
      font-size: 9px;
      color: #475569;
      text-align: right;
      margin-top: auto;
    }

    /* ─── Right Panel: Events ─────────────────── */
    .right-panel {
      display: flex;
      flex-direction: column;
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 8px;
      overflow: hidden;
    }

    .right-panel .panel-header {
      padding: 10px 14px;
      border-bottom: 1px solid #1e293b;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .right-panel .panel-header .icon { font-size: 14px; }
    .right-panel .panel-header .title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
    }

    .event-list {
      flex: 1;
      overflow-y: auto;
      padding: 6px;
    }

    .event-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 2px;
      transition: background 100ms ease;
    }

    .event-item:hover {
      background: #1e293b;
    }

    .event-item .time {
      font-size: 10px;
      color: #475569;
      font-family: monospace;
      min-width: 40px;
      padding-top: 1px;
    }

    .event-item .role-tag {
      font-size: 9px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 2px;
      color: white;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .event-item .content {
      flex: 1;
      font-size: 12px;
      color: #cbd5e1;
      line-height: 1.4;
    }

    /* ─── RACI Org Chart ─────────────────────── */
    .raci-chart-section {
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 8px 12px;
      flex-shrink: 0;
    }

    .raci-chart-section .chart-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #475569;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .raci-chart-section svg {
      width: 100%;
      height: auto;
      display: block;
    }

    .raci-chart-section .node-rect {
      rx: 6;
      ry: 6;
      cursor: pointer;
      transition: filter 150ms ease;
    }

    .raci-chart-section .node-rect:hover {
      filter: brightness(1.5);
    }

    .raci-chart-section .node-label {
      font-size: 11px;
      font-weight: 700;
      fill: #e2e8f0;
      pointer-events: none;
      text-anchor: middle;
      dominant-baseline: central;
    }

    .raci-chart-section .node-sub {
      font-size: 8px;
      fill: rgba(255,255,255,0.5);
      pointer-events: none;
      text-anchor: middle;
      dominant-baseline: central;
    }

    .raci-chart-section .link-line {
      stroke: #475569;
      stroke-width: 1.5;
      fill: none;
    }

    .raci-chart-section .link-arrow {
      fill: #475569;
    }

    .raci-chart-section .tier-label {
      font-size: 8px;
      fill: #475569;
      font-weight: 600;
      text-anchor: end;
      dominant-baseline: central;
    }

    .raci-chart-section .raci-badge {
      font-size: 6.5px;
      font-weight: 800;
      pointer-events: none;
      text-anchor: middle;
      dominant-baseline: central;
    }

    .raci-chart-section .legend {
      display: flex;
      gap: 12px;
      margin-top: 2px;
      justify-content: center;
    }

    .raci-chart-section .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 9px;
      color: #64748b;
    }

    .raci-chart-section .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 2px;
      flex-shrink: 0;
    }
  `;

  @state() private _overview: OverviewData | null = null;
  @state() private _roleStatuses: RoleStatus[] = [];
  @state() private _loading = true;

  connectedCallback() {
    super.connectedCallback();
    this._loadData();
  }

  private async _loadData() {
    try {
      const [overviewRes, ...metricResults] = await Promise.all([
        fetchOverview(),
        ...ALL_ROLE_IDS.map((id) => fetchRoleMetrics(id).catch(() => null)),
      ]);

      this._overview = overviewRes.data;

      this._roleStatuses = ALL_ROLE_IDS.map((roleId, i) => {
        const metrics = metricResults[i]?.data ?? [];
        const topMetric = metrics[0];
        let status: 'normal' | 'warning' | 'danger' = 'normal';
        let topValue = '--';
        let topLabel = '';

        if (topMetric) {
          topValue = String(Math.round(topMetric.value));
          topLabel = ROLE_DASHBOARDS[roleId]?.metrics[0]?.label ?? '';
          const def = ROLE_DASHBOARDS[roleId]?.metrics[0];
          if (def) {
            if (def.dangerThreshold != null && topMetric.value >= def.dangerThreshold) status = 'danger';
            else if (def.warningThreshold != null && topMetric.value >= def.warningThreshold) status = 'warning';
          }
        }

        return { roleId, label: ROLE_TOOL_CONFIGS[roleId].label, status, topMetric: topLabel, topValue };
      });
    } catch {
      this._overview = { score: 76, activeEvents: 7, pendingTasks: 23, collabRequests: 12 };
    }
    this._loading = false;
  }

  private _onRoleClick(roleId: RoleId) {
    this.dispatchEvent(new CustomEvent('role-selected', { detail: { roleId }, bubbles: true, composed: true }));
  }

  private _onChartClick(e: Event) {
    const target = e.target as Element;
    const g = target.closest('g[data-role]') as Element | null;
    if (!g) return;
    const roleId = g.getAttribute('data-role') as RoleId;
    if (roleId) this._onRoleClick(roleId);
  }

  private _statusLabel(s: string) {
    return s === 'danger' ? '告警' : s === 'warning' ? '注意' : '正常';
  }

  /** RACI 组织架构图 — 三层：决策层 / 协调层 / 执行层 */
  private _renderRaciChart() {
    interface ChartNode {
      id: RoleId;
      label: string;
      short: string;
      x: number;
      y: number;
      color: string;
      raci: string;  // RACI role badge letter
    }

    // Layout constants
    const W = 520;
    const H = 225;
    const nodeW = 72;
    const nodeH = 30;
    const cx = W / 2;

    // Tier 1 — 决策层 (y=30)
    const t1y = 30;
    const ciso: ChartNode = { id: 'ciso', label: 'CISO', short: '决策', x: cx, y: t1y, color: '#3b82f6', raci: 'A' };

    // Tier 2 — 协调层 (y=105)
    const t2y = 105;
    const commander: ChartNode = { id: 'secuclaw-commander', label: '安全指挥官', short: '协调', x: cx, y: t2y, color: '#ef4444', raci: 'C' };
    const privacy: ChartNode = { id: 'privacy-officer', label: '隐私官', short: '监督', x: cx - 120, y: t2y, color: '#a78bfa', raci: 'C' };
    const biz: ChartNode = { id: 'business-security-officer', label: '业务安全官', short: '保障', x: cx + 120, y: t2y, color: '#10b981', raci: 'C' };

    // Tier 3 — 执行层 (y=185)
    const t3y = 185;
    const expert: ChartNode = { id: 'security-expert', label: '安全专家', short: 'R·执行', x: cx - 165, y: t3y, color: '#3b82f6', raci: 'R' };
    const architect: ChartNode = { id: 'security-architect', label: '安全架构师', short: 'R·设计', x: cx - 55, y: t3y, color: '#06b6d4', raci: 'R' };
    const ops: ChartNode = { id: 'security-ops', label: '安全运营', short: 'R·响应', x: cx + 55, y: t3y, color: '#f97316', raci: 'R' };
    const supply: ChartNode = { id: 'supply-chain-security', label: '供应链安全', short: 'R·审计', x: cx + 165, y: t3y, color: '#84cc16', raci: 'R' };

    const nodes = [ciso, commander, privacy, biz, expert, architect, ops, supply];

    // Links: from → to
    const links: [ChartNode, ChartNode][] = [
      [ciso, commander],
      [ciso, privacy],
      [ciso, biz],
      [commander, expert],
      [commander, architect],
      [commander, ops],
      [commander, supply],
    ];

    // Cross-links (dashed)
    const crossLinks: [ChartNode, ChartNode][] = [
      [privacy, expert],    // 隐私合规 → 安全专家
      [biz, ops],           // 业务安全 → 安全运营
      [architect, supply],  // 架构 → 供应链
    ];

    const makePath = (from: ChartNode, to: ChartNode) => {
      const x1 = from.x, y1 = from.y + nodeH / 2;
      const x2 = to.x, y2 = to.y - nodeH / 2;
      const midY = (y1 + y2) / 2;
      return `M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`;
    };

    const raciColors: Record<string, string> = {
      'R': '#3b82f6',
      'A': '#f59e0b',
      'C': '#8b5cf6',
      'I': '#6b7280',
    };

    const statusMap = new Map(this._roleStatuses.map(rs => [rs.roleId, rs.status]));

    // Build SVG as raw string to avoid Lit SVG namespace issues
    const svgContent = `
      <text class="tier-label" x="18" y="${t1y}">决策</text>
      <text class="tier-label" x="18" y="${t2y}">协调</text>
      <text class="tier-label" x="18" y="${t3y}">执行</text>
      <line x1="30" y1="${(t1y + t2y) / 2 + 10}" x2="${W - 10}" y2="${(t1y + t2y) / 2 + 10}" stroke="#1e293b" stroke-width="1" stroke-dasharray="4,4"/>
      <line x1="30" y1="${(t2y + t3y) / 2 + 10}" x2="${W - 10}" y2="${(t2y + t3y) / 2 + 10}" stroke="#1e293b" stroke-width="1" stroke-dasharray="4,4"/>
      ${links.map(([from, to]) => `<path class="link-line" d="${makePath(from, to)}"/>`).join('')}
      ${crossLinks.map(([from, to]) => `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3"/>`).join('')}
      ${nodes.map(n => {
        const status = statusMap.get(n.id) ?? 'normal';
        const stroke = status === 'danger' ? '#ef4444' : status === 'warning' ? '#f59e0b' : n.color;
        const fillMap: Record<string, string> = {
          'ciso': '#1a2744', 'secuclaw-commander': '#3b1515', 'privacy-officer': '#251938',
          'business-security-officer': '#0f2920', 'security-expert': '#1a2744',
          'security-architect': '#0f2629', 'security-ops': '#2f1a0d', 'supply-chain-security': '#1a2410',
        };
        const fill = fillMap[n.id] ?? '#151d2e';
        const badgeX = n.x + nodeW / 2 - 10;
        const badgeY = n.y - nodeH / 2 - 4;
        return `<g data-role="${n.id}">
          <rect class="node-rect" x="${n.x - nodeW / 2}" y="${n.y - nodeH / 2}" width="${nodeW}" height="${nodeH}" fill="${fill}" stroke="${stroke}" stroke-width="2" rx="6" ry="6"/>
          <text class="node-label" x="${n.x}" y="${n.y - 3}">${n.label}</text>
          <text class="node-sub" x="${n.x}" y="${n.y + 9}">${n.short}</text>
          <rect x="${badgeX}" y="${badgeY}" width="14" height="10" rx="2" fill="${raciColors[n.raci]}"/>
          <text class="raci-badge" x="${badgeX + 7}" y="${badgeY + 5}" fill="#fff">${n.raci}</text>
        </g>`;
      }).join('')}
    `;

    return html`
      <div class="raci-chart-section">
        <div class="chart-title">
          <span>🏛️</span>
          <span>组织架构 · RACI 协作矩阵</span>
        </div>
        <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" @click=${this._onChartClick}>${unsafeSVG(svgContent)}</svg>
        <div class="legend">
          <div class="legend-item"><span class="legend-dot" style="background:#3b82f6"></span> R 执行</div>
          <div class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span> A 审批</div>
          <div class="legend-item"><span class="legend-dot" style="background:#8b5cf6"></span> C 咨询</div>
          <div class="legend-item"><span class="legend-dot" style="background:#6b7280"></span> I 通知</div>
          <div class="legend-item" style="margin-left:8px;color:#475569">─ 直属 &nbsp;┅ 协作</div>
        </div>
      </div>
    `;
  }

  render() {
    if (this._loading) return html`<div style="padding:40px;text-align:center;color:#475569">加载中...</div>`;

    const ov = this._overview!;
    const events = [
      { time: '14:32', roleId: 'secuclaw-commander' as RoleId, text: '协调请求：零信任架构迁移方案' },
      { time: '14:15', roleId: 'security-ops' as RoleId, text: 'P1 告警处置完成：可疑进程已隔离' },
      { time: '13:58', roleId: 'security-expert' as RoleId, text: '新漏洞扫描完成：发现 2 个高危 CVE' },
      { time: '13:40', roleId: 'privacy-officer' as RoleId, text: 'GDPR 合规差距报告已生成，3 项需整改' },
      { time: '13:22', roleId: 'supply-chain-security' as RoleId, text: 'SBOM 扫描发现 3 个高危开源组件' },
      { time: '12:55', roleId: 'ciso' as RoleId, text: '风险评分更新：42 → 48，超过预警线' },
      { time: '12:30', roleId: 'security-architect' as RoleId, text: '架构变更审批通过：微服务网关方案' },
      { time: '11:45', roleId: 'business-security-officer' as RoleId, text: 'BCP 季度演练完成，RTO 达标' },
    ];

    return html`
      <!-- Top KPI -->
      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-icon score">📊</div>
          <div class="kpi-data">
            <div class="kpi-value ${ov.score > 80 ? 'success' : ov.score > 60 ? 'warning' : 'danger'}">${Math.round(ov.score)}</div>
            <div class="kpi-label">全域安全评分</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon events">🚨</div>
          <div class="kpi-data">
            <div class="kpi-value ${ov.activeEvents > 5 ? 'danger' : 'success'}">${ov.activeEvents}</div>
            <div class="kpi-label">活跃安全事件</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon pending">⏳</div>
          <div class="kpi-data">
            <div class="kpi-value ${ov.pendingTasks > 20 ? 'warning' : 'success'}">${ov.pendingTasks}</div>
            <div class="kpi-label">待处理任务</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon collab">🔗</div>
          <div class="kpi-data">
            <div class="kpi-value info">${ov.collabRequests}</div>
            <div class="kpi-label">跨角色协调</div>
          </div>
        </div>
      </div>

      <!-- Main: Roles + Events -->
      <div class="main-grid">
        <div class="roles-section">
          <div class="section-title">角色状态 · 点击进入指挥台</div>
          <div class="roles-grid">
            ${this._roleStatuses.map((rs) => {
              const theme = ROLE_THEMES[rs.roleId];
              return html`
                <div
                  class="role-card"
                  style="--card-color: ${theme.primary}"
                  tabindex="0"
                  role="button"
                  @click=${() => this._onRoleClick(rs.roleId)}
                  @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._onRoleClick(rs.roleId); }}
                >
                  <div class="card-top">
                    <span class="card-name" style="color: ${theme.secondary}">${rs.label}</span>
                    <span class="card-status ${rs.status}">${this._statusLabel(rs.status)}</span>
                  </div>
                  <div class="card-metric" style="color: ${theme.primary}">${rs.topValue}</div>
                  <div class="card-metric-label">${rs.topMetric}</div>
                  <div class="card-enter">进入 →</div>
                </div>
              `;
            })}
          </div>
          ${this._renderRaciChart()}
        </div>

        <div class="right-panel">
          <div class="panel-header">
            <span class="icon">📡</span>
            <span class="title">事件流</span>
          </div>
          <div class="event-list">
            ${events.map((e) => {
              const theme = ROLE_THEMES[e.roleId];
              return html`
                <div class="event-item">
                  <span class="time">${e.time}</span>
                  <span class="role-tag" style="background: ${theme.primary}">${ROLE_TOOL_CONFIGS[e.roleId].label}</span>
                  <span class="content">${e.text}</span>
                </div>
              `;
            })}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-overview': ScOverview;
  }
}

/**
 * sc-overview — 统一总览页面
 * 默认入口：全域安全态势聚合 + 8 角色状态卡片 + 事件流
 * @see v2.1 文档 3.7 统一总览视图
 */

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { RoleId } from '../config/role-tool-config';
import { ROLE_TOOL_CONFIGS, ALL_ROLE_IDS } from '../config/role-tool-config';
import { ROLE_THEMES } from '../config/role-theme-config';
import { fetchOverview, fetchRoleMetrics, type OverviewData } from '../services/api-service';

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
      padding: 16px;
      color: var(--role-text, #f8fafc);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--role-bg, #0f172a);
      min-height: 100vh;
    }

    .title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .title .icon { font-size: 22px; }

    /* Summary cards */
    .summary-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .summary-card {
      background: var(--role-bg-elevated, #1e293b);
      border: 1px solid var(--role-border, #334155);
      border-radius: 10px;
      padding: 16px;
      text-align: center;
    }

    .summary-card .label {
      font-size: 11px;
      color: var(--role-text-muted, #94a3b8);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .summary-card .value {
      font-size: 32px;
      font-weight: 800;
      line-height: 1.2;
    }

    .value.danger { color: #ef4444; }
    .value.warning { color: #f59e0b; }
    .value.success { color: #22c55e; }
    .value.info { color: #3b82f6; }

    /* Role cards */
    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--role-text-muted, #94a3b8);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 10px;
    }

    .roles-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }

    .role-card {
      background: var(--role-bg-elevated, #1e293b);
      border: 1px solid var(--role-border, #334155);
      border-radius: 10px;
      padding: 14px;
      cursor: pointer;
      transition: all 200ms ease;
      position: relative;
      overflow: hidden;
    }

    .role-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }

    .role-card:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    .role-card .stripe {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
    }

    .role-card .role-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      margin-top: 4px;
    }

    .role-card .role-name {
      font-size: 13px;
      font-weight: 700;
    }

    .role-card .role-status {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }

    .role-status.normal { background: rgba(34,197,94,0.15); color: #22c55e; }
    .role-status.warning { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .role-status.danger { background: rgba(239,68,68,0.15); color: #ef4444; }

    .role-card .role-metric {
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 2px;
    }

    .role-card .role-metric-label {
      font-size: 10px;
      color: var(--role-text-muted, #94a3b8);
    }

    .role-card .role-hint {
      font-size: 10px;
      color: var(--role-text-muted, #94a3b8);
      margin-top: 6px;
      text-align: right;
    }

    /* Event feed */
    .event-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .event-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: var(--role-bg-elevated, #1e293b);
      border-radius: 6px;
      font-size: 12px;
      transition: background 150ms ease;
    }

    .event-item:hover {
      background: var(--role-border, #334155);
    }

    .event-item .time {
      font-size: 10px;
      color: var(--role-text-muted, #94a3b8);
      white-space: nowrap;
      min-width: 48px;
    }

    .event-item .role-tag {
      font-size: 9px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 3px;
      color: white;
      white-space: nowrap;
    }

    .event-item .content {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Loading */
    .loading {
      text-align: center;
      padding: 40px;
      color: var(--role-text-muted, #94a3b8);
    }

    /* Responsive */
    @media (max-width: 1279px) {
      .summary-row { grid-template-columns: repeat(2, 1fr); }
      .roles-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 767px) {
      .summary-row { grid-template-columns: 1fr; }
      .roles-grid { grid-template-columns: 1fr; }
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

      // Build role statuses from metrics
      this._roleStatuses = ALL_ROLE_IDS.map((roleId, i) => {
        const metrics = metricResults[i]?.data ?? [];
        const topMetric = metrics[0];
        let status: 'normal' | 'warning' | 'danger' = 'normal';
        let topValue = '--';
        let topLabel = '数据加载中';

        if (topMetric) {
          topValue = String(Math.round(topMetric.value));
          topLabel = ROLE_DASHBOARDS[roleId]?.metrics[0]?.label ?? '';

          // Determine status based on first metric
          const def = ROLE_DASHBOARDS[roleId]?.metrics[0];
          if (def) {
            if (def.dangerThreshold != null && topMetric.value >= def.dangerThreshold) status = 'danger';
            else if (def.warningThreshold != null && topMetric.value >= def.warningThreshold) status = 'warning';
            else status = 'normal';
          }
        }

        return {
          roleId,
          label: ROLE_TOOL_CONFIGS[roleId].label,
          status,
          topMetric: topLabel,
          topValue,
        };
      });
    } catch {
      this._overview = { score: 76, activeEvents: 7, pendingTasks: 23, collabRequests: 12 };
    }
    this._loading = false;
  }

  private _onRoleClick(roleId: RoleId) {
    this.dispatchEvent(new CustomEvent('role-selected', {
      detail: { roleId },
      bubbles: true,
      composed: true,
    }));
  }

  private _getStatusLabel(s: string): string {
    if (s === 'danger') return '告警';
    if (s === 'warning') return '注意';
    return '正常';
  }

  render() {
    if (this._loading) {
      return html`<div class="loading">加载全域态势数据...</div>`;
    }

    const ov = this._overview!;

    // Mock events
    const events = [
      { time: '14:32', roleId: 'secuclaw-commander' as RoleId, text: '协调请求：零信任架构迁移方案' },
      { time: '14:15', roleId: 'security-ops' as RoleId, text: 'P1 告警处置完成：可疑进程已隔离' },
      { time: '13:58', roleId: 'security-expert' as RoleId, text: '新漏洞扫描完成：发现 2 个高危' },
      { time: '13:40', roleId: 'privacy-officer' as RoleId, text: 'GDPR 合规差距报告已生成' },
      { time: '13:22', roleId: 'supply-chain-security' as RoleId, text: 'SBOM 扫描发现 3 个高危组件' },
      { time: '12:55', roleId: 'ciso' as RoleId, text: '风险评分更新：42 → 48' },
      { time: '12:30', roleId: 'security-architect' as RoleId, text: '架构变更审批完成：微服务网关' },
      { time: '11:45', roleId: 'business-security-officer' as RoleId, text: 'BCP 演练报告已归档' },
    ];

    return html`
      <div class="title">
        <span class="icon">🛡️</span>
        SecuClaw 安全指挥中心
      </div>

      <!-- Summary -->
      <div class="summary-row">
        <div class="summary-card">
          <div class="label">全域评分</div>
          <div class="value ${ov.score > 80 ? 'success' : ov.score > 60 ? 'warning' : 'danger'}">
            ${Math.round(ov.score)}
          </div>
        </div>
        <div class="summary-card">
          <div class="label">活跃事件</div>
          <div class="value ${ov.activeEvents > 5 ? 'danger' : 'success'}">${ov.activeEvents}</div>
        </div>
        <div class="summary-card">
          <div class="label">待处理</div>
          <div class="value ${ov.pendingTasks > 20 ? 'warning' : 'success'}">${ov.pendingTasks}</div>
        </div>
        <div class="summary-card">
          <div class="label">协调请求</div>
          <div class="value info">${ov.collabRequests}</div>
        </div>
      </div>

      <!-- Role cards — data-driven from API -->
      <div class="section-title">角色状态</div>
      <div class="roles-grid">
        ${this._roleStatuses.map((rs) => {
          const theme = ROLE_THEMES[rs.roleId];
          return html`
            <div
              class="role-card"
              tabindex="0"
              role="button"
              aria-label="进入${rs.label}指挥台"
              @click=${() => this._onRoleClick(rs.roleId)}
              @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._onRoleClick(rs.roleId); }}
            >
              <div class="stripe" style="background: ${theme.primary}"></div>
              <div class="role-header">
                <span class="role-name" style="color: ${theme.primary}">${rs.label}</span>
                <span class="role-status ${rs.status}">${this._getStatusLabel(rs.status)}</span>
              </div>
              <div class="role-metric" style="color: ${theme.secondary}">${rs.topValue}</div>
              <div class="role-metric-label">${rs.topMetric}</div>
              <div class="role-hint">点击进入 →</div>
            </div>
          `;
        })}
      </div>

      <!-- Event feed -->
      <div class="section-title">最近事件</div>
      <div class="event-list">
        ${events.map((e) => {
          const theme = ROLE_THEMES[e.roleId];
          return html`
            <div class="event-item">
              <span class="time">${e.time}</span>
              <span class="role-tag" style="background: ${theme.primary}">
                ${ROLE_TOOL_CONFIGS[e.roleId].label}
              </span>
              <span class="content">${e.text}</span>
            </div>
          `;
        })}
      </div>
    `;
  }
}

// Need this for threshold checking
import { ROLE_DASHBOARDS } from '../config/role-dashboard-config';

declare global {
  interface HTMLElementTagNameMap {
    'sc-overview': ScOverview;
  }
}

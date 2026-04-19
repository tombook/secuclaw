/**
 * sc-collab-hub — 协作指挥区
 * 跨角色协调请求、专家会诊、任务协作
 *
 * @see v2.0 文档 第 4.3 节 协作指挥区
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { RoleId } from '../../config/role-tool-config';
import { ROLE_TOOL_CONFIGS } from '../../config/role-tool-config';
import { ROLE_THEMES } from '../../config/role-theme-config';

// ─── Types ────────────────────────────────────────────────────

interface CollabItem {
  id: string;
  type: 'request' | 'mention' | 'decision' | 'log';
  fromRole: RoleId;
  content: string;
  timestamp: number;
  actions?: { label: string; action: string }[];
}

@customElement('sc-collab-hub')
export class ScCollabHub extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .collab-container {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .collab-item {
      padding: 10px;
      border-radius: 6px;
      background: var(--role-bg-elevated);
      border: 1px solid var(--role-border);
      transition: border-color 150ms ease;
    }

    .collab-item:hover {
      border-color: var(--role-secondary);
    }

    .collab-item.highlighted {
      border-color: var(--role-accent, #f59e0b);
      box-shadow: 0 0 0 1px var(--role-accent, #f59e0b), inset 0 0 12px rgba(245, 158, 11, 0.06);
      animation: highlight-pulse 2s ease-out;
    }

    @keyframes highlight-pulse {
      0% { box-shadow: 0 0 0 2px var(--role-accent, #f59e0b); }
      100% { box-shadow: 0 0 0 1px var(--role-accent, #f59e0b), inset 0 0 12px rgba(245, 158, 11, 0.06); }
    }

    .collab-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .collab-type-badge {
      font-size: 9px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .collab-type-badge.request { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .collab-type-badge.mention  { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .collab-type-badge.decision { background: rgba(34,197,94,0.15); color: #22c55e; }
    .collab-type-badge.log      { background: rgba(107,114,128,0.15); color: #6b7280; }

    .collab-from {
      font-size: 10px;
      color: var(--role-text-muted);
    }

    .collab-time {
      font-size: 10px;
      color: var(--role-text-muted);
      margin-left: auto;
    }

    .collab-content {
      font-size: 13px;
      color: var(--role-text);
      line-height: 1.4;
    }

    .mention-tag {
      color: var(--role-accent);
      font-weight: 600;
    }

    .collab-actions {
      display: flex;
      gap: 6px;
      margin-top: 8px;
    }

    .action-btn {
      padding: 4px 10px;
      font-size: 11px;
      border-radius: 4px;
      border: 1px solid var(--role-border);
      background: transparent;
      color: var(--role-text);
      cursor: pointer;
      transition: all 150ms ease;
    }

    .action-btn:hover {
      background: var(--role-secondary);
      color: var(--role-bg);
      border-color: var(--role-secondary);
    }

    .action-btn.primary {
      background: var(--role-primary);
      border-color: var(--role-primary);
      color: white;
    }

    .empty-state {
      text-align: center;
      padding: 20px;
      color: var(--role-text-muted);
      font-size: 12px;
    }

    .section-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--role-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 10px;
      margin-bottom: 4px;
    }
  `;

  @property({ type: String }) roleId: RoleId = 'secuclaw-commander';
  @property({ type: String }) highlightKeyword = '';

  updated(changed: Map<string, unknown>) {
    if (changed.has('highlightKeyword') && this.highlightKeyword) {
      // Auto-scroll to highlighted item
      const highlighted = this.shadowRoot?.querySelector('.collab-item.highlighted');
      if (highlighted) highlighted.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  private _getMockItems(): CollabItem[] {
    const now = Date.now();
    const currentLabel = ROLE_TOOL_CONFIGS[this.roleId]?.label ?? '';

    // Role-specific mock data — each role sees different collaboration items
    const roleData: Record<string, CollabItem[]> = {
      'security-ops': [
        {
          id: 'so-1', type: 'request', fromRole: 'security-expert',
          content: 'P1 漏洞 CVE-2026-1234 已验证为可利用，需要安全运营协助隔离受影响主机 10.0.1.45',
          timestamp: now - 800000,
          actions: [
            { label: '查看详情', action: 'view' },
            { label: '接受协作', action: 'accept' },
          ],
        },
        {
          id: 'so-2', type: 'mention', fromRole: 'secuclaw-commander',
          content: `@${currentLabel} 零信任迁移第一阶段即将启动，请确认 DMZ 区防火墙规则已更新`,
          timestamp: now - 2400000,
          actions: [
            { label: '查看', action: 'view' },
            { label: '确认完成', action: 'respond' },
          ],
        },
        {
          id: 'so-3', type: 'decision', fromRole: 'ciso',
          content: '批准紧急补丁窗口：本周六 02:00-06:00，影响范围 web-prod 集群',
          timestamp: now - 5400000,
        },
        {
          id: 'so-4', type: 'log', fromRole: 'security-ops',
          content: 'SOAR 剧本执行完成：DNS 隧道封堵剧本处置 2 条告警，封禁 IP 203.x.x.x',
          timestamp: now - 9000000,
        },
      ],

      'security-expert': [
        {
          id: 'se-1', type: 'request', fromRole: 'security-ops',
          content: '发现疑似 0day 利用，样本哈希 a3f2b8...，需要安全专家分析攻击链和影响面',
          timestamp: now - 600000,
          actions: [
            { label: '查看样本', action: 'view' },
            { label: '开始分析', action: 'accept' },
          ],
        },
        {
          id: 'se-2', type: 'request', fromRole: 'supply-chain-security',
          content: 'SBOM 扫描发现 log4j 2.14.1 仍在使用，请评估升级优先级和兼容性风险',
          timestamp: now - 3600000,
          actions: [
            { label: '查看 SBOM', action: 'view' },
            { label: '评估风险', action: 'accept' },
          ],
        },
        {
          id: 'se-3', type: 'mention', fromRole: 'security-architect',
          content: `@${currentLabel} 微服务网关方案引入了新的 JWT 验证逻辑，请审查是否存在认证绕过风险`,
          timestamp: now - 7200000,
          actions: [
            { label: '查看方案', action: 'view' },
            { label: '提供意见', action: 'respond' },
          ],
        },
        {
          id: 'se-4', type: 'log', fromRole: 'security-expert',
          content: '漏洞扫描完成：内网全段发现 65 个漏洞，其中 Critical 3 个、High 12 个',
          timestamp: now - 10800000,
        },
      ],

      'secuclaw-commander': [
        {
          id: 'sc-1', type: 'request', fromRole: 'security-ops',
          content: 'P1 告警升级：检测到横向移动行为，已影响 3 台主机，请求指挥官协调跨团队响应',
          timestamp: now - 300000,
          actions: [
            { label: '查看态势', action: 'view' },
            { label: '启动应急', action: 'accept' },
          ],
        },
        {
          id: 'sc-2', type: 'request', fromRole: 'privacy-officer',
          content: 'GDPR 审计发现 2 条跨境数据传输链缺少 SCCs，可能面临合规处罚，请协调处理',
          timestamp: now - 1800000,
          actions: [
            { label: '查看报告', action: 'view' },
            { label: '分配任务', action: 'accept' },
          ],
        },
        {
          id: 'sc-3', type: 'mention', fromRole: 'ciso',
          content: `@${currentLabel} Q2 安全预算追加 ¥120万已获批，请制定分配方案并上报`,
          timestamp: now - 5400000,
          actions: [
            { label: '查看预算', action: 'view' },
            { label: '制定方案', action: 'respond' },
          ],
        },
        {
          id: 'sc-4', type: 'decision', fromRole: 'ciso',
          content: '零信任架构迁移方案批准通过，第一阶段 4 月 20 日启动',
          timestamp: now - 7200000,
        },
        {
          id: 'sc-5', type: 'log', fromRole: 'security-expert',
          content: '威胁情报更新：APT-41 近期活跃度上升，目标集中在金融行业',
          timestamp: now - 14400000,
        },
      ],

      'ciso': [
        {
          id: 'ci-1', type: 'request', fromRole: 'secuclaw-commander',
          content: '本月安全投入产出比下降 15%，主要因 P1 事件频发导致人力溢出，建议追加预算',
          timestamp: now - 1800000,
          actions: [
            { label: '查看详情', action: 'view' },
            { label: '审批预算', action: 'accept' },
          ],
        },
        {
          id: 'ci-2', type: 'request', fromRole: 'security-architect',
          content: '零信任迁移方案已完成技术评审，需要 CISO 最终审批后进入实施阶段',
          timestamp: now - 3600000,
          actions: [
            { label: '查看方案', action: 'view' },
            { label: '批准', action: 'accept' },
          ],
        },
        {
          id: 'ci-3', type: 'mention', fromRole: 'privacy-officer',
          content: `@${currentLabel} GDPR 年度审计即将开始，合规率目前 93%，2 项整改未完成`,
          timestamp: now - 7200000,
          actions: [
            { label: '查看合规报告', action: 'view' },
            { label: '安排整改', action: 'respond' },
          ],
        },
        {
          id: 'ci-4', type: 'decision', fromRole: 'ciso',
          content: 'Q2 董事会安全报告已提交，综合风险评分 44/100',
          timestamp: now - 14400000,
        },
      ],

      'privacy-officer': [
        {
          id: 'po-1', type: 'request', fromRole: 'business-security-officer',
          content: 'BCP 演练发现客户数据恢复链路涉及跨境传输，请评估是否需要补充 SCCs',
          timestamp: now - 1200000,
          actions: [
            { label: '查看详情', action: 'view' },
            { label: '评估合规', action: 'accept' },
          ],
        },
        {
          id: 'po-2', type: 'mention', fromRole: 'secuclaw-commander',
          content: `@${currentLabel} 零信任迁移涉及用户行为分析，请确认是否符合 PIPL 数据最小化原则`,
          timestamp: now - 3600000,
          actions: [
            { label: '查看方案', action: 'view' },
            { label: '出具意见', action: 'respond' },
          ],
        },
        {
          id: 'po-3', type: 'log', fromRole: 'privacy-officer',
          content: 'DPIA 评估完成：3 个高风险处理活动已全部补充隐私影响评估报告',
          timestamp: now - 7200000,
        },
        {
          id: 'po-4', type: 'log', fromRole: 'security-ops',
          content: '数据泄露通知演练完成：72 小时内通知率 100%，平均响应 4.2 小时',
          timestamp: now - 10800000,
        },
      ],

      'security-architect': [
        {
          id: 'sa-1', type: 'request', fromRole: 'secuclaw-commander',
          content: '零信任架构迁移需要安全架构师主导技术方案设计，请尽快提交实施计划',
          timestamp: now - 900000,
          actions: [
            { label: '查看需求', action: 'view' },
            { label: '开始设计', action: 'accept' },
          ],
        },
        {
          id: 'sa-2', type: 'request', fromRole: 'security-expert',
          content: '漏洞扫描发现 API 网关存在 3 个认证绕过风险，需要架构层面评审修复方案',
          timestamp: now - 3600000,
          actions: [
            { label: '查看漏洞', action: 'view' },
            { label: '设计方案', action: 'accept' },
          ],
        },
        {
          id: 'sa-3', type: 'mention', fromRole: 'ciso',
          content: `@${currentLabel} 董事会要求零信任迁移 Q3 完成，请确认当前进度和里程碑`,
          timestamp: now - 5400000,
          actions: [
            { label: '查看进度', action: 'view' },
            { label: '汇报进度', action: 'respond' },
          ],
        },
        {
          id: 'sa-4', type: 'decision', fromRole: 'security-architect',
          content: '微服务网关方案评审通过：mTLS + JWT 双重认证 + 字段级脱敏',
          timestamp: now - 9000000,
        },
      ],

      'business-security-officer': [
        {
          id: 'bs-1', type: 'request', fromRole: 'secuclaw-commander',
          content: 'Q2 BCP 演练计划已下达，请安排全部门桌面推演，覆盖 IT、客服、财务',
          timestamp: now - 1500000,
          actions: [
            { label: '查看计划', action: 'view' },
            { label: '安排演练', action: 'accept' },
          ],
        },
        {
          id: 'bs-2', type: 'mention', fromRole: 'privacy-officer',
          content: `@${currentLabel} GDPR 审计涉及业务连续性计划的数据恢复部分，请配合提供 RTO/RPO 数据`,
          timestamp: now - 5400000,
          actions: [
            { label: '查看要求', action: 'view' },
            { label: '提供数据', action: 'respond' },
          ],
        },
        {
          id: 'bs-3', type: 'decision', fromRole: 'ciso',
          content: 'BCP 演练预算 ¥15万已批准，含第三方渗透测试费用',
          timestamp: now - 7200000,
        },
        {
          id: 'bs-4', type: 'log', fromRole: 'business-security-officer',
          content: 'BCP 季度演练完成：RTO 达标率 96%，客户通知环节未达标（18min > 15min 目标）',
          timestamp: now - 10800000,
        },
      ],

      'supply-chain-security': [
        {
          id: 'ss-1', type: 'request', fromRole: 'security-expert',
          content: '发现 2 个高危第三方组件漏洞（log4j + spring-boot），请启动供应商紧急响应流程',
          timestamp: now - 600000,
          actions: [
            { label: '查看漏洞', action: 'view' },
            { label: '启动响应', action: 'accept' },
          ],
        },
        {
          id: 'ss-2', type: 'request', fromRole: 'privacy-officer',
          content: '云盾科技数据处理协议即将到期（4月30日），需评估续约条款的合规性变更',
          timestamp: now - 3600000,
          actions: [
            { label: '查看协议', action: 'view' },
            { label: '开始评估', action: 'accept' },
          ],
        },
        {
          id: 'ss-3', type: 'mention', fromRole: 'secuclaw-commander',
          content: `@${currentLabel} 供应链安全评分纳入 Q2 考核，请确保所有 Tier-1 供应商完成安全评估`,
          timestamp: now - 7200000,
          actions: [
            { label: '查看评估进度', action: 'view' },
            { label: '回复进度', action: 'respond' },
          ],
        },
        {
          id: 'ss-4', type: 'log', fromRole: 'supply-chain-security',
          content: 'SBOM 扫描完成：5 个组件发现漏洞，spring-boot 风险最高（3 个 CVE）',
          timestamp: now - 10800000,
        },
      ],
    };

    return roleData[this.roleId] ?? [];
  }

  private _formatTime(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
  }

  private _getRoleLabel(roleId: RoleId): string {
    return ROLE_TOOL_CONFIGS[roleId]?.label ?? roleId;
  }

  private _onAction(itemId: string, action: string) {
    this.dispatchEvent(new CustomEvent('collab-action', {
      detail: { itemId, action, roleId: this.roleId },
      bubbles: true,
      composed: true,
    }));
  }

  /** Match based on RACI type semantics: R→request items, A→decision, C→mention, I→log */
  private _matchesHighlight(item: CollabItem): boolean {
    if (!this.highlightKeyword || !item?.content) return false;
    // Extract RACI type from keyword (e.g. "响应 P1 ..." → R, "审批 ..." → A)
    const typeMap: Record<string, ('request' | 'mention' | 'decision' | 'log')[]> = {
      '执行': ['request', 'log'],
      '响应': ['request', 'log'],
      '审批': ['decision', 'mention'],
      '咨询': ['mention'],
      '知会': ['log'],
      '通知': ['log'],
    };
    for (const [keyword, types] of Object.entries(typeMap)) {
      if (this.highlightKeyword.includes(keyword) && types.includes(item.type)) {
        return true;
      }
    }
    // Fallback: direct substring match
    return item.content.includes(this.highlightKeyword);
  }

  render() {
    const items = this._getMockItems();
    const activeItems = items.filter(i => i.type === 'request' || i.type === 'mention');
    const historyItems = items.filter(i => i.type === 'decision' || i.type === 'log');

    return html`
      <div class="collab-container">
        ${activeItems.length > 0 ? html`
          <div class="section-label">待处理</div>
          ${activeItems.map(item => {
            const isHighlighted = this._matchesHighlight(item);
            return html`
            <div class="collab-item ${isHighlighted ? 'highlighted' : ''}">
              <div class="collab-meta">
                <span class="collab-type-badge ${item.type}">
                  ${item.type === 'request' ? '协调请求' : '@提及'}
                </span>
                <span class="collab-from">来自 ${this._getRoleLabel(item.fromRole)}</span>
                <span class="collab-time">${this._formatTime(item.timestamp)}</span>
              </div>
              <div class="collab-content">${item.content}</div>
              ${item.actions ? html`
                <div class="collab-actions">
                  ${item.actions.map(a => html`
                    <button
                      class="action-btn ${a.action === 'accept' || a.action === 'respond' ? 'primary' : ''}"
                      @click=${() => this._onAction(item.id, a.action)}
                    >${a.label}</button>
                  `)}
                </div>
              ` : nothing}
            </div>
          `;
          })}
        ` : nothing}

        ${historyItems.length > 0 ? html`
          <div class="section-label">协作历史</div>
          ${historyItems.map(item => html`
            <div class="collab-item">
              <div class="collab-meta">
                <span class="collab-type-badge ${item.type}">
                  ${item.type === 'decision' ? '决策' : '日志'}
                </span>
                <span class="collab-from">${this._getRoleLabel(item.fromRole)}</span>
                <span class="collab-time">${this._formatTime(item.timestamp)}</span>
              </div>
              <div class="collab-content" style="color: var(--role-text-muted); font-size: 12px;">
                ${item.content}
              </div>
            </div>
          `)}
        ` : nothing}

        ${items.length === 0 ? html`
          <div class="empty-state">暂无协作请求</div>
        ` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-collab-hub': ScCollabHub;
  }
}

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

/**
 * Risk Center - Professional Design
 */
@customElement('sc-risk-center')
export class ScRiskCenter extends LitElement {
  @state() private activeTab = 'all';
  @state() private riskLevel = 'all';

  static styles = css`
    :host { display: block; }
    .container { max-width: 1600px; margin: 0 auto; padding: 24px; }
    .hero { display: flex; gap: 24px; padding: 32px; background: linear-gradient(135deg, var(--sc-bg-card) 0%, var(--sc-bg-secondary) 100%); border-radius: 16px; margin-bottom: 32px; }
    .hero-icon { width: 72px; height: 72px; background: linear-gradient(135deg, #EC4899, #DB2777); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 36px; }
    .hero-title { font-size: 28px; font-weight: 700; margin: 0 0 8px; }
    .hero-desc { color: var(--sc-text-secondary); margin: 0; line-height: 1.6; }
    .risk-score { text-align: center; }
    .risk-score-value { font-size: 48px; font-weight: 700; color: #EC4899; }
    .risk-score-label { font-size: 14px; color: var(--sc-text-tertiary); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .metric-card { background: var(--sc-bg-card); border: 1px solid var(--sc-border-color); border-radius: 12px; padding: 20px; position: relative; overflow: hidden; }
    .metric-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
    .metric-card.red::before { background: linear-gradient(90deg, #EF4444, #F87171); }
    .metric-card.yellow::before { background: linear-gradient(90deg, #F59E0B, #FBBF24); }
    .metric-card.green::before { background: linear-gradient(90deg, #10B981, #34D399); }
    .metric-card.blue::before { background: linear-gradient(90deg, #3B82F6, #60A5FA); }
    .metric-value { font-size: 32px; font-weight: 700; color: var(--sc-text-primary); }
    .metric-label { font-size: 14px; color: var(--sc-text-secondary); margin-top: 4px; }
    .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--sc-border-color); margin-bottom: 24px; }
    .tab { padding: 12px 20px; font-size: 14px; font-weight: 500; color: var(--sc-text-secondary); background: none; border: none; cursor: pointer; position: relative; }
    .tab:hover { color: var(--sc-text-primary); }
    .tab.active { color: #EC4899; }
    .tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: #EC4899; }
    .filter-bar { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .filter-btn { padding: 8px 16px; font-size: 13px; font-weight: 500; border-radius: 20px; border: 1px solid var(--sc-border-color); background: var(--sc-bg-card); color: var(--sc-text-secondary); cursor: pointer; transition: all 200ms ease; }
    .filter-btn:hover { border-color: #EC4899; color: var(--sc-text-primary); }
    .filter-btn.active { background: rgba(236, 72, 153, 0.15); border-color: #EC4899; color: #EC4899; }
    .risk-table { background: var(--sc-bg-card); border: 1px solid var(--sc-border-color); border-radius: 12px; overflow: hidden; }
    .table-header { padding: 16px 24px; background: var(--sc-bg-secondary); border-bottom: 1px solid var(--sc-border-color); font-weight: 600; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; color: var(--sc-text-tertiary); text-transform: uppercase; background: var(--sc-bg-tertiary); }
    td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid var(--sc-border-color); }
    tr:hover td { background: var(--sc-bg-hover); }
    .risk-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .risk-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .risk-high { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
    .risk-medium { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
    .risk-low { background: rgba(16, 185, 129, 0.15); color: #10B981; }
    .progress-bar { height: 6px; background: var(--sc-bg-tertiary); border-radius: 10px; overflow: hidden; width: 100px; display: inline-block; vertical-align: middle; margin-left: 8px; }
    .progress-fill { height: 100%; border-radius: 10px; }
    .progress-high { background: #EF4444; }
    .progress-medium { background: #F59E0B; }
    .progress-low { background: #10B981; }
  `;

  private risks = [
    { id: 'RISK-001', name: 'VPN访问控制不足', level: 'high', score: 85, owner: '安全团队', status: 'open', mitigation: '已计划' },
    { id: 'RISK-002', name: '第三方供应链风险', level: 'high', score: 78, owner: '采购部', status: 'open', mitigation: '评估中' },
    { id: 'RISK-003', name: '员工安全意识不足', level: 'medium', score: 55, owner: '人力资源', status: 'mitigating', mitigation: '培训中' },
    { id: 'RISK-004', name: '日志保留策略不完善', level: 'low', score: 30, owner: '运维团队', status: 'mitigating', mitigation: '已优化' },
    { id: 'RISK-005', name: '云账号权限过大', level: 'medium', score: 62, owner: '云架构组', status: 'open', mitigation: '待处理' },
    { id: 'RISK-006', name: '老旧系统未更新', level: 'high', score: 72, owner: '运维团队', status: 'open', mitigation: '计划中' },
  ];

  private highRisks = this.risks.filter(r => r.level === 'high').length;
  private mediumRisks = this.risks.filter(r => r.level === 'medium').length;
  private lowRisks = this.risks.filter(r => r.level === 'low').length;

  render() {
    return html`
      <div class="container">
        <div class="hero">
          <div class="hero-icon">⚠️</div>
          <div style="flex: 1;">
            <h1 class="hero-title">安全风险</h1>
            <p class="hero-desc">系统性评估组织安全风险，支持量化和可视化展示。</p>
          </div>
          <div class="risk-score">
            <div class="risk-score-value">72</div>
            <div class="risk-score-label">风险指数</div>
            <div style="font-size: 12px; color: #10B981; margin-top: 4px;">↓ 较上月-3</div>
          </div>
        </div>

        <div class="grid">
          <div class="metric-card red">
            <div class="metric-value">${this.highRisks}</div>
            <div class="metric-label">高风险</div>
          </div>
          <div class="metric-card yellow">
            <div class="metric-value">${this.mediumRisks}</div>
            <div class="metric-label">中风险</div>
          </div>
          <div class="metric-card green">
            <div class="metric-value">${this.lowRisks}</div>
            <div class="metric-label">低风险</div>
          </div>
          <div class="metric-card blue">
            <div class="metric-value">${this.risks.length}</div>
            <div class="metric-label">总风险数</div>
          </div>
        </div>

        <div class="tabs">
          <button class="tab ${this.activeTab === 'all' ? 'active' : ''}" @click=${() => this.activeTab = 'all'}>全部风险</button>
          <button class="tab ${this.activeTab === 'open' ? 'active' : ''}" @click=${() => this.activeTab = 'open'}>待处理</button>
          <button class="tab ${this.activeTab === 'mitigating' ? 'active' : ''}" @click=${() => this.activeTab = 'mitigating'}>处理中</button>
          <button class="tab ${this.activeTab === 'closed' ? 'active' : ''}" @click=${() => this.activeTab = 'closed'}>已关闭</button>
        </div>

        <div class="filter-bar">
          <button class="filter-btn ${this.riskLevel === 'all' ? 'active' : ''}" @click=${() => this.riskLevel = 'all'}>全部</button>
          <button class="filter-btn ${this.riskLevel === 'high' ? 'active' : ''}" @click=${() => this.riskLevel = 'high'}>高风险</button>
          <button class="filter-btn ${this.riskLevel === 'medium' ? 'active' : ''}" @click=${() => this.riskLevel = 'medium'}>中风险</button>
          <button class="filter-btn ${this.riskLevel === 'low' ? 'active' : ''}" @click=${() => this.riskLevel = 'low'}>低风险</button>
        </div>

        <div class="risk-table">
          <div class="table-header">📋 风险列表</div>
          <table>
            <thead>
              <tr>
                <th>风险ID</th>
                <th>风险描述</th>
                <th>风险等级</th>
                <th>风险评分</th>
                <th>责任人</th>
                <th>状态</th>
                <th>处置进度</th>
              </tr>
            </thead>
            <tbody>
              ${this.risks
                .filter(r => (this.activeTab === 'all' || r.status === this.activeTab) && (this.riskLevel === 'all' || r.level === this.riskLevel))
                .map(risk => html`
                  <tr>
                    <td><code style="background: var(--sc-bg-tertiary); padding: 2px 6px; border-radius: 4px;">${risk.id}</code></td>
                    <td><strong>${risk.name}</strong></td>
                    <td>
                      <span class="risk-badge risk-${risk.level}">
                        ${risk.level === 'high' ? '🔴 高' : risk.level === 'medium' ? '🟡 中' : '🟢 低'}
                      </span>
                    </td>
                    <td>
                      ${risk.score}
                      <div class="progress-bar">
                        <div class="progress-fill progress-${risk.level}" style="width: ${risk.score}%"></div>
                      </div>
                    </td>
                    <td>${risk.owner}</td>
                    <td>${risk.status === 'open' ? '📋 待处理' : risk.status === 'mitigating' ? '🔧 处理中' : '✓ 已关闭'}</td>
                    <td>${risk.mitigation}</td>
                  </tr>
                `)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sc-risk-center': ScRiskCenter; }
}

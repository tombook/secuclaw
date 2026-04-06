import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { gatewayClient } from '../gateway-client.js';

/**
 * Risk Center Page - Professional Design
 * ⚠️ Risk Management (Pink Theme)
 */
@customElement('sc-risk-page')
export class ScRiskPage extends LitElement {
  @state() private activeTab = 'all';
  @state() private levelFilter = 'all';
  @state() private risks: any[] = [];
  @state() private riskMetrics: any = null;
  @state() private loading = false;

  static styles = css`
    :host {
      --risk-primary: #EC4899;
      --risk-primary-dark: #DB2777;
      --risk-success: #10B981;
      --risk-warning: #F59E0B;
      --risk-danger: #EF4444;
      --risk-bg: var(--sc-bg-primary, #0f172a);
      --risk-bg-card: var(--sc-bg-card, #1e293b);
      --risk-bg-tertiary: var(--sc-bg-tertiary, #334155);
      --risk-bg-hover: var(--sc-bg-hover, #475569);
      --risk-text-primary: var(--sc-text-primary, #f8fafc);
      --risk-text-secondary: var(--sc-text-secondary, #cbd5e1);
      --risk-text-tertiary: var(--sc-text-tertiary, #94a3b8);
      --risk-border: var(--sc-border-color, #334155);
      --risk-radius-sm: 6px;
      --risk-radius-md: 10px;
      --risk-radius-lg: 16px;
      --risk-transition: 200ms ease;
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      color: var(--risk-text-primary);
      background: var(--risk-bg);
      min-height: 100vh;
    }

    .page-container { max-width: 1600px; margin: 0 auto; padding: 24px; }

    /* Hero */
    .hero { display: flex; gap: 32px; align-items: flex-start; padding: 40px; background: linear-gradient(135deg, var(--risk-bg-card) 0%, rgba(236, 72, 153, 0.1) 100%); border: 1px solid var(--risk-border); border-radius: var(--risk-radius-lg); margin-bottom: 32px; position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; top: -50%; right: -5%; width: 350px; height: 350px; background: radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%); pointer-events: none; }
    .hero-icon { width: 80px; height: 80px; background: linear-gradient(135deg, var(--risk-primary) 0%, var(--risk-primary-dark) 100%); border-radius: var(--risk-radius-md); display: flex; align-items: center; justify-content: center; font-size: 40px; flex-shrink: 0; box-shadow: 0 8px 24px rgba(236, 72, 153, 0.4); }
    .hero-content { flex: 1; position: relative; z-index: 1; }
    .hero-title { font-size: 32px; font-weight: 700; margin: 0 0 8px; }
    .hero-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: rgba(236, 72, 153, 0.15); color: var(--risk-primary); border-radius: 20px; font-size: 13px; font-weight: 500; margin-bottom: 16px; }
    .hero-desc { font-size: 15px; line-height: 1.7; color: var(--risk-text-secondary); margin: 0; max-width: 600px; }
    .risk-score { text-align: center; padding: 24px; background: var(--risk-bg-card); border-radius: var(--risk-radius-md); min-width: 140px; }
    .risk-score-value { font-size: 48px; font-weight: 700; color: var(--risk-primary); line-height: 1; }
    .risk-score-label { font-size: 14px; color: var(--risk-text-tertiary); margin-top: 8px; }
    .risk-score-change { font-size: 12px; color: #10B981; margin-top: 4px; }

    /* Metrics Grid */
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .metric-card { background: var(--risk-bg-card); border: 1px solid var(--risk-border); border-radius: var(--risk-radius-md); padding: 24px; position: relative; overflow: hidden; transition: all var(--risk-transition); }
    .metric-card:hover { border-color: var(--risk-primary); transform: translateY(-2px); }
    .metric-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
    .metric-card.red::before { background: linear-gradient(90deg, #EF4444, #F87171); }
    .metric-card.yellow::before { background: linear-gradient(90deg, #F59E0B, #FBBF24); }
    .metric-card.green::before { background: linear-gradient(90deg, #10B981, #34D399); }
    .metric-card.pink::before { background: linear-gradient(90deg, #EC4899, #F472B6); }
    .metric-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .metric-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .metric-card.red .metric-icon { background: rgba(239, 68, 68, 0.15); }
    .metric-card.yellow .metric-icon { background: rgba(245, 158, 11, 0.15); }
    .metric-card.green .metric-icon { background: rgba(16, 185, 129, 0.15); }
    .metric-card.pink .metric-icon { background: rgba(236, 72, 153, 0.15); }
    .metric-value { font-size: 32px; font-weight: 700; color: var(--risk-text-primary); }
    .metric-label { font-size: 13px; color: var(--risk-text-secondary); margin-top: 4px; }

    /* Tabs */
    .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--risk-border); margin-bottom: 24px; }
    .tab { padding: 14px 20px; font-size: 14px; font-weight: 500; color: var(--risk-text-secondary); background: none; border: none; cursor: pointer; position: relative; transition: all var(--risk-transition); }
    .tab:hover { color: var(--risk-text-primary); }
    .tab.active { color: var(--risk-primary); }
    .tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: var(--risk-primary); }

    /* Filter Bar */
    .filter-bar { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .filter-btn { padding: 8px 16px; font-size: 13px; font-weight: 500; border-radius: 20px; border: 1px solid var(--risk-border); background: var(--risk-bg-card); color: var(--risk-text-secondary); cursor: pointer; transition: all var(--risk-transition); }
    .filter-btn:hover { border-color: var(--risk-primary); color: var(--risk-text-primary); }
    .filter-btn.active { background: rgba(236, 72, 153, 0.15); border-color: var(--risk-primary); color: var(--risk-primary); }

    /* Content Grid */
    .content-grid { display: grid; grid-template-columns: 2fr 1fr); gap: 24px; }
    @media (max-width: 1024px) { .content-grid { grid-template-columns: 1fr; } }

    /* Cards */
    .card { background: var(--risk-bg-card); border: 1px solid var(--risk-border); border-radius: var(--risk-radius-lg); overflow: hidden; }
    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid var(--risk-border); background: var(--risk-bg-tertiary); }
    .card-title { font-size: 15px; font-weight: 600; }
    .card-body { padding: 0; }

    /* Table */
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 600; color: var(--risk-text-tertiary); background: var(--risk-bg-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }
    .data-table td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid var(--risk-border); }
    .data-table tbody tr:hover td { background: var(--risk-bg-hover); }

    /* Risk Badge */
    .risk-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .risk-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .risk-high { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
    .risk-medium { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
    .risk-low { background: rgba(16, 185, 129, 0.15); color: #10B981; }

    /* Progress Bar */
    .progress-bar { height: 6px; background: var(--risk-bg-tertiary); border-radius: 10px; overflow: hidden; width: 80px; display: inline-block; vertical-align: middle; margin-left: 8px; }
    .progress-fill { height: 100%; border-radius: 10px; }
    .progress-fill.high { background: #EF4444; }
    .progress-fill.medium { background: #F59E0B; }
    .progress-fill.low { background: #10B981; }

    /* Buttons */
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; font-size: 14px; font-weight: 500; border-radius: var(--risk-radius-sm); border: none; cursor: pointer; transition: all var(--risk-transition); }
    .btn-primary { background: linear-gradient(135deg, var(--risk-primary) 0%, var(--risk-primary-dark) 100%); color: white; box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4); }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(236, 72, 153, 0.5); }
    .btn-secondary { background: var(--risk-bg-tertiary); color: var(--risk-text-primary); border: 1px solid var(--risk-border); }
    .btn-secondary:hover { background: var(--risk-bg-hover); }

    /* Sidebar List */
    .sidebar-list { list-style: none; padding: 0; margin: 0; }
    .sidebar-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--risk-radius-sm); margin-bottom: 4px; cursor: pointer; transition: all var(--risk-transition); color: var(--risk-text-secondary); border: 1px solid transparent; }
    .sidebar-item:hover { background: var(--risk-bg-hover); color: var(--risk-text-primary); }
    .sidebar-item-icon { font-size: 16px; }
    .sidebar-item-content { flex: 1; }
    .sidebar-item-title { font-weight: 500; }
    .sidebar-item-meta { font-size: 11px; color: var(--risk-text-tertiary); margin-top: 2px; }

    code { background: var(--risk-bg-tertiary); padding: 2px 6px; border-radius: 4px; font-size: 12px; }

    @media (max-width: 768px) {
      .page-container { padding: 16px; }
      .hero { flex-direction: column; padding: 24px; }
      .metrics-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `;

  private readonly fallbackRisks = [
    { id: 'RISK-001', name: 'VPN访问控制不足', level: 'high', score: 85, owner: '安全团队', status: 'open', mitigation: '已计划' },
    { id: 'RISK-002', name: '第三方供应链风险', level: 'high', score: 78, owner: '采购部', status: 'open', mitigation: '评估中' },
    { id: 'RISK-003', name: '员工安全意识不足', level: 'medium', score: 55, owner: '人力资源', status: 'mitigating', mitigation: '培训中' },
    { id: 'RISK-004', name: '日志保留策略不完善', level: 'low', score: 30, owner: '运维团队', status: 'mitigating', mitigation: '已优化' },
    { id: 'RISK-005', name: '云账号权限过大', level: 'medium', score: 62, owner: '云架构组', status: 'open', mitigation: '待处理' },
    { id: 'RISK-006', name: '老旧系统未更新', level: 'high', score: 72, owner: '运维团队', status: 'open', mitigation: '计划中' },
  ];

  private handleTab(tab: string) { this.activeTab = tab; }
  private setLevelFilter(level: string) { this.levelFilter = level; }

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
  }

  private async loadData() {
    this.loading = true;
    try {
      const [factorsRes, metricsRes] = await Promise.allSettled([
        gatewayClient.request('risk.listFactors', {}),
        gatewayClient.request('risk.getMetrics', {}),
      ]);
      if (factorsRes.status === 'fulfilled') {
        const data = (factorsRes.value as any)?.data ?? factorsRes.value;
        this.risks = Array.isArray(data) && data.length > 0 ? [...data] : [...this.fallbackRisks];
      } else {
        this.risks = [...this.fallbackRisks];
      }
      if (metricsRes.status === 'fulfilled') {
        this.riskMetrics = (metricsRes.value as any)?.data ?? metricsRes.value;
      }
    } catch (e) {
      console.error('[risk-page] Load failed:', e);
      this.risks = [...this.fallbackRisks];
    }
    this.loading = false;
  }

  private async addRisk() {
    const name = prompt('风险描述:');
    if (!name) return;
    const level = prompt('等级 (high/medium/low):', 'medium') || 'medium';
    const score = parseInt(prompt('评分 (0-100):', '50') || '50', 10);
    const owner = prompt('责任人:') || '';
    try {
      await gatewayClient.request('risk.createFactor', { name, level, score, owner });
      this.loadData();
    } catch (e) {
      console.error('[risk-page] Create failed:', e);
    }
  }

  private async deleteRisk(id: string) {
    if (!confirm('确定删除此风险？')) return;
    try {
      await gatewayClient.request('risk.deleteFactor', { id });
      this.loadData();
    } catch (e) {
      console.error('[risk-page] Delete failed:', e);
    }
  }

  private async runAssessment() {
    const ids = prompt('输入风险ID列表(逗号分隔):');
    if (!ids) return;
    try {
      const res = await gatewayClient.request('risk.createAssessment', { factorIds: ids.split(',').map(s => s.trim()) });
      alert('评估完成: ' + JSON.stringify(res));
    } catch (e) {
      console.error('[risk-page] Assessment failed:', e);
    }
  }

  private async showHistory() {
    try {
      const res = await gatewayClient.request('risk.history', {});
      alert('风险历史: ' + JSON.stringify(res));
    } catch (e) {
      console.error('[risk-page] History failed:', e);
    }
  }

  private async editRisk(risk: any) {
    const name = prompt('风险描述:', risk.name);
    if (!name) return;
    const level = prompt('等级 (high/medium/low):', risk.level) || risk.level;
    const score = parseInt(prompt('评分 (0-100):', String(risk.score)) || String(risk.score), 10);
    try {
      await gatewayClient.request('risk.updateFactor', { id: risk.id, name, level, score });
      this.loadData();
    } catch (e) {
      console.error('[risk-page] Update factor failed:', e);
    }
  }

  private async viewRiskDetail(id: string) {
    try {
      const res = await gatewayClient.request('risk.getFactor', { id });
      const detail = (res as any)?.data ?? res;
      alert(`风险详情:\n${JSON.stringify(detail, null, 2)}`);
    } catch (e) {
      console.error('[risk-page] GetFactor failed:', e);
    }
  }

  render() {
    if (this.loading) {
      return html`<div style="text-align:center;padding:4rem;"><div style="font-size:48px;margin-bottom:16px;">⏳</div><div style="color:var(--risk-text-secondary);">加载中...</div></div>`;
    }
    const filtered = this.levelFilter === 'all' ? this.risks : this.risks.filter(r => r.level === this.levelFilter);
    const highCount = this.risks.filter(r => r.level === 'high').length;
    const mediumCount = this.risks.filter(r => r.level === 'medium').length;
    const lowCount = this.risks.filter(r => r.level === 'low').length;

    return html`
      <div class="page-container">
        <div class="hero">
          <div class="hero-icon">⚠️</div>
          <div class="hero-content">
            <h1 class="hero-title">安全风险</h1>
            <span class="hero-badge">⚠️ 风险管理</span>
            <p class="hero-desc">系统性评估组织安全风险，支持量化和可视化展示。持续跟踪风险处置进度，降低组织风险暴露面。</p>
          </div>
          <div class="risk-score">
            <div class="risk-score-value">${this.riskMetrics?.overallScore ?? 72}</div>
            <div class="risk-score-label">风险指数</div>
            <div class="risk-score-change">↓ 较上月-3</div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card red">
            <div class="metric-header"><div class="metric-icon">🔴</div></div>
            <div class="metric-value">${highCount}</div>
            <div class="metric-label">高风险</div>
          </div>
          <div class="metric-card yellow">
            <div class="metric-header"><div class="metric-icon">🟡</div></div>
            <div class="metric-value">${mediumCount}</div>
            <div class="metric-label">中风险</div>
          </div>
          <div class="metric-card green">
            <div class="metric-header"><div class="metric-icon">🟢</div></div>
            <div class="metric-value">${lowCount}</div>
            <div class="metric-label">低风险</div>
          </div>
          <div class="metric-card pink">
            <div class="metric-header"><div class="metric-icon">📊</div></div>
            <div class="metric-value">${this.risks.length}</div>
            <div class="metric-label">总风险数</div>
          </div>
        </div>

        <div class="tabs">
          <button class="tab ${this.activeTab === 'all' ? 'active' : ''}" @click=${() => this.handleTab('all')}>全部风险</button>
          <button class="tab ${this.activeTab === 'open' ? 'active' : ''}" @click=${() => this.handleTab('open')}>待处理</button>
          <button class="tab ${this.activeTab === 'mitigating' ? 'active' : ''}" @click=${() => this.handleTab('mitigating')}>处理中</button>
          <button class="tab ${this.activeTab === 'closed' ? 'active' : ''}" @click=${() => this.handleTab('closed')}>已关闭</button>
        </div>

        <div class="filter-bar">
          <button class="filter-btn ${this.levelFilter === 'all' ? 'active' : ''}" @click=${() => this.setLevelFilter('all')}>全部</button>
          <button class="filter-btn ${this.levelFilter === 'high' ? 'active' : ''}" @click=${() => this.setLevelFilter('high')}>🔴 高风险</button>
          <button class="filter-btn ${this.levelFilter === 'medium' ? 'active' : ''}" @click=${() => this.setLevelFilter('medium')}>🟡 中风险</button>
          <button class="filter-btn ${this.levelFilter === 'low' ? 'active' : ''}" @click=${() => this.setLevelFilter('low')}>🟢 低风险</button>
        </div>

        <div class="content-grid">
          <div class="card">
            <div class="card-header">
              <span class="card-title">📋 风险列表</span>
              <button class="btn btn-primary" @click=${() => this.addRisk()}>+ 添加风险</button>
            </div>
            <div class="card-body" style="padding: 0;">
              <table class="data-table">
                <thead><tr><th>风险ID</th><th>风险描述</th><th>等级</th><th>评分</th><th>责任人</th><th>状态</th><th>处置进度</th></tr></thead>
                <tbody>
                  ${filtered.map(risk => html`
                    <tr>
                       <td><code>${risk.id}</code></td>
                       <td><strong>${risk.name}</strong></td>
                      <td><span class="risk-badge risk-${risk.level}">${risk.level === 'high' ? '🔴 高' : risk.level === 'medium' ? '🟡 中' : '🟢 低'}</span></td>
                      <td>
                        ${risk.score}
                        <div class="progress-bar"><div class="progress-fill progress-${risk.level}" style="width: ${risk.score}%"></div></div>
                      </td>
                      <td>${risk.owner}</td>
                      <td>${risk.status === 'open' ? '📋 待处理' : risk.status === 'mitigating' ? '🔧 处理中' : '✓ 已关闭'}</td>
                       <td>${risk.mitigation}</td>
                        <td>
                          <button class="btn btn-secondary" style="padding:4px 8px;font-size:12px;margin-right:4px;" @click=${() => this.viewRiskDetail(risk.id)}>详情</button>
                          <button class="btn btn-secondary" style="padding:4px 8px;font-size:12px;margin-right:4px;" @click=${() => this.editRisk(risk)}>编辑</button>
                          <button class="btn btn-secondary" style="padding:4px 8px;font-size:12px;" @click=${() => this.deleteRisk(risk.id)}>删除</button>
                        </td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><span class="card-title">⚡ 快速操作</span></div>
            <div class="card-body">
              <ul class="sidebar-list">
                <li class="sidebar-item"><span class="sidebar-item-icon">+</span><div class="sidebar-item-content"><div class="sidebar-item-title">添加风险</div></div></li>
                <li class="sidebar-item" @click=${() => this.showHistory()}><span class="sidebar-item-icon">📊</span><div class="sidebar-item-content"><div class="sidebar-item-title">风险报告</div></div></li>
                <li class="sidebar-item" @click=${() => this.runAssessment()}><span class="sidebar-item-icon">🎯</span><div class="sidebar-item-content"><div class="sidebar-item-title">风险评估</div></div></li>
                <li class="sidebar-item"><span class="sidebar-item-icon">⚙️</span><div class="sidebar-item-content"><div class="sidebar-item-title">风险配置</div></div></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'sc-risk-page': ScRiskPage; } }

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

/**
 * Data Center Page - Professional Design
 * 💾 Data Management (Blue Theme)
 */
@customElement('sc-datacenter-page')
export class ScDataCenterPage extends LitElement {
  @state() private activeTab = 'overview';

  static styles = css`
    :host {
      --dc-primary: #3B82F6;
      --dc-primary-dark: #2563EB;
      --dc-success: #10B981;
      --dc-warning: #F59E0B;
      --dc-danger: #EF4444;
      --dc-purple: #8B5CF6;
      --dc-bg: var(--sc-bg-primary, #0f172a);
      --dc-bg-card: var(--sc-bg-card, #1e293b);
      --dc-bg-tertiary: var(--sc-bg-tertiary, #334155);
      --dc-bg-hover: var(--sc-bg-hover, #475569);
      --dc-text-primary: var(--sc-text-primary, #f8fafc);
      --dc-text-secondary: var(--sc-text-secondary, #cbd5e1);
      --dc-text-tertiary: var(--sc-text-tertiary, #94a3b8);
      --dc-border: var(--sc-border-color, #334155);
      --dc-radius-sm: 6px;
      --dc-radius-md: 10px;
      --dc-radius-lg: 16px;
      --dc-transition: 200ms ease;
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      color: var(--dc-text-primary);
      background: var(--dc-bg);
      min-height: 100vh;
    }

    .page-container { max-width: 1600px; margin: 0 auto; padding: 24px; }

    /* Hero */
    .hero { display: flex; gap: 32px; align-items: flex-start; padding: 40px; background: linear-gradient(135deg, var(--dc-bg-card) 0%, rgba(59, 130, 246, 0.1) 100%); border: 1px solid var(--dc-border); border-radius: var(--dc-radius-lg); margin-bottom: 32px; position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; top: -50%; right: -5%; width: 350px; height: 350px; background: radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%); pointer-events: none; }
    .hero-icon { width: 80px; height: 80px; background: linear-gradient(135deg, var(--dc-primary) 0%, var(--dc-primary-dark) 100%); border-radius: var(--dc-radius-md); display: flex; align-items: center; justify-content: center; font-size: 40px; flex-shrink: 0; box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3); }
    .hero-content { flex: 1; position: relative; z-index: 1; }
    .hero-title { font-size: 32px; font-weight: 700; margin: 0 0 8px; }
    .hero-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: rgba(59, 130, 246, 0.15); color: var(--dc-primary); border-radius: 20px; font-size: 13px; font-weight: 500; margin-bottom: 16px; }
    .hero-desc { font-size: 15px; line-height: 1.7; color: var(--dc-text-secondary); margin: 0; max-width: 600px; }
    .hero-stats { display: flex; gap: 24px; }
    .hero-stat { text-align: center; padding: 16px 24px; background: var(--dc-bg-card); border-radius: var(--dc-radius-md); min-width: 100px; }
    .hero-stat-value { font-size: 28px; font-weight: 700; color: var(--dc-primary); }
    .hero-stat-label { font-size: 12px; color: var(--dc-text-tertiary); margin-top: 4px; }

    /* Metrics Grid */
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .metric-card { background: var(--dc-bg-card); border: 1px solid var(--dc-border); border-radius: var(--dc-radius-md); padding: 24px; position: relative; overflow: hidden; transition: all var(--dc-transition); }
    .metric-card:hover { border-color: var(--dc-primary); transform: translateY(-2px); }
    .metric-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
    .metric-card.blue::before { background: linear-gradient(90deg, #3B82F6, #60A5FA); }
    .metric-card.green::before { background: linear-gradient(90deg, #10B981, #34D399); }
    .metric-card.yellow::before { background: linear-gradient(90deg, #F59E0B, #FBBF24); }
    .metric-card.red::before { background: linear-gradient(90deg, #EF4444, #F87171); }
    .metric-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .metric-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .metric-card.blue .metric-icon { background: rgba(59, 130, 246, 0.15); }
    .metric-card.green .metric-icon { background: rgba(16, 185, 129, 0.15); }
    .metric-card.yellow .metric-icon { background: rgba(245, 158, 11, 0.15); }
    .metric-card.red .metric-icon { background: rgba(239, 68, 68, 0.15); }
    .metric-value { font-size: 32px; font-weight: 700; color: var(--dc-text-primary); }
    .metric-label { font-size: 13px; color: var(--dc-text-secondary); margin-top: 4px; }

    /* Tabs */
    .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--dc-border); margin-bottom: 24px; }
    .tab { padding: 14px 20px; font-size: 14px; font-weight: 500; color: var(--dc-text-secondary); background: none; border: none; cursor: pointer; position: relative; transition: all var(--dc-transition); }
    .tab:hover { color: var(--dc-text-primary); }
    .tab.active { color: var(--dc-primary); }
    .tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: var(--dc-primary); }

    /* Content Grid */
    .content-grid { display: grid; grid-template-columns: 2fr 1fr); gap: 24px; }
    @media (max-width: 1024px) { .content-grid { grid-template-columns: 1fr; } }

    /* Cards */
    .card { background: var(--dc-bg-card); border: 1px solid var(--dc-border); border-radius: var(--dc-radius-lg); overflow: hidden; }
    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid var(--dc-border); background: var(--dc-bg-tertiary); }
    .card-title { font-size: 15px; font-weight: 600; }
    .card-body { padding: 24px; }

    /* Table */
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 600; color: var(--dc-text-tertiary); background: var(--dc-bg-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }
    .data-table td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid var(--dc-border); }
    .data-table tbody tr:hover td { background: var(--dc-bg-hover); }

    /* Status Badge */
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .status-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .status-healthy { background: rgba(16, 185, 129, 0.15); color: #10B981; }
    .status-warning { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
    .status-error { background: rgba(239, 68, 68, 0.15); color: #EF4444; }

    /* Progress Bar */
    .progress-bar { height: 6px; background: var(--dc-bg-tertiary); border-radius: 10px; overflow: hidden; width: 80px; display: inline-block; vertical-align: middle; margin-left: 8px; }
    .progress-fill { height: 100%; border-radius: 10px; }
    .progress-fill.healthy { background: #10B981; }
    .progress-fill.warning { background: #F59E0B; }
    .progress-fill.error { background: #EF4444; }

    /* Buttons */
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; font-size: 14px; font-weight: 500; border-radius: var(--dc-radius-sm); border: none; cursor: pointer; transition: all var(--dc-transition); }
    .btn-primary { background: linear-gradient(135deg, var(--dc-primary) 0%, var(--dc-primary-dark) 100%); color: white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4); }
    .btn-secondary { background: var(--dc-bg-tertiary); color: var(--dc-text-primary); border: 1px solid var(--dc-border); }
    .btn-secondary:hover { background: var(--dc-bg-hover); }

    /* Sidebar List */
    .sidebar-list { list-style: none; padding: 0; margin: 0; }
    .sidebar-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--dc-radius-sm); margin-bottom: 4px; cursor: pointer; transition: all var(--dc-transition); color: var(--dc-text-secondary); border: 1px solid transparent; }
    .sidebar-item:hover { background: var(--dc-bg-hover); color: var(--dc-text-primary); }
    .sidebar-item-icon { font-size: 16px; }
    .sidebar-item-content { flex: 1; }
    .sidebar-item-title { font-weight: 500; }
    .sidebar-item-meta { font-size: 11px; color: var(--dc-text-tertiary); margin-top: 2px; }

    @media (max-width: 768px) {
      .page-container { padding: 16px; }
      .hero { flex-direction: column; padding: 24px; }
      .metrics-grid { grid-template-columns: repeat(2, 1fr); }
      .hero-stats { flex-direction: column; width: 100%; }
    }
  `;

  private databases = [
    { name: '威胁情报库', type: 'Knowledge', records: '2.3M', size: '45GB', health: 'healthy', sync: '2小时前' },
    { name: '漏洞库', type: 'Business', records: '156K', size: '12GB', health: 'healthy', sync: '1小时前' },
    { name: '事件日志库', type: 'Business', records: '890M', size: '234GB', health: 'warning', sync: '30分钟前' },
    { name: '资产库', type: 'Organization', records: '12K', size: '3GB', health: 'healthy', sync: '5分钟前' },
    { name: '证书库', type: 'Security', records: '2.4K', size: '512MB', health: 'healthy', sync: '1天前' },
    { name: '情报共享库', type: 'Knowledge', records: '45K', size: '8GB', health: 'error', sync: '3天前' },
  ];

  private handleTab(tab: string) { this.activeTab = tab; }

  render() {
    const healthyCount = this.databases.filter(d => d.health === 'healthy').length;
    const warningCount = this.databases.filter(d => d.health === 'warning').length;
    const errorCount = this.databases.filter(d => d.health === 'error').length;

    return html`
      <div class="page-container">
        <div class="hero">
          <div class="hero-icon">🗄️</div>
          <div class="hero-content">
            <h1 class="hero-title">数据资源中心</h1>
            <span class="hero-badge">💾 数据管理</span>
            <p class="hero-desc">统一管理安全运营数据资产，跟踪数据血缘、质量和合规状态。支持多数据源集成和实时同步监控。</p>
          </div>
          <div class="hero-stats">
            <div class="hero-stat"><div class="hero-stat-value">${this.databases.length}</div><div class="hero-stat-label">数据库</div></div>
            <div class="hero-stat"><div class="hero-stat-value">1.2B</div><div class="hero-stat-label">总记录</div></div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card blue">
            <div class="metric-header"><div class="metric-icon">🗄️</div></div>
            <div class="metric-value">${this.databases.length}</div>
            <div class="metric-label">总数据库</div>
          </div>
          <div class="metric-card green">
            <div class="metric-header"><div class="metric-icon">✓</div></div>
            <div class="metric-value">${healthyCount}</div>
            <div class="metric-label">健康</div>
          </div>
          <div class="metric-card yellow">
            <div class="metric-header"><div class="metric-icon">⚠</div></div>
            <div class="metric-value">${warningCount}</div>
            <div class="metric-label">警告</div>
          </div>
          <div class="metric-card red">
            <div class="metric-header"><div class="metric-icon">✗</div></div>
            <div class="metric-value">${errorCount}</div>
            <div class="metric-label">错误</div>
          </div>
        </div>

        <div class="tabs">
          <button class="tab ${this.activeTab === 'overview' ? 'active' : ''}" @click=${() => this.handleTab('overview')}>📊 总览</button>
          <button class="tab ${this.activeTab === 'databases' ? 'active' : ''}" @click=${() => this.handleTab('databases')}>🗄️ 数据库</button>
          <button class="tab ${this.activeTab === 'quality' ? 'active' : ''}" @click=${() => this.handleTab('quality')}>✅ 数据质量</button>
        </div>

        <div class="content-grid">
          <div class="card">
            <div class="card-header">
              <span class="card-title">${this.activeTab === 'overview' ? '📋 数据库列表' : this.activeTab === 'databases' ? '🗄️ 数据库详情' : '✅ 数据质量'}</span>
              <button class="btn btn-secondary">+ 添加数据库</button>
            </div>
            <div class="card-body" style="padding: 0;">
              <table class="data-table">
                <thead><tr><th>名称</th><th>类型</th><th>记录数</th><th>大小</th><th>状态</th><th>最后同步</th></tr></thead>
                <tbody>
                  ${this.databases.map(db => html`
                    <tr>
                      <td><strong>${db.name}</strong></td>
                      <td>${db.type}</td>
                      <td>${db.records}</td>
                      <td>${db.size}</td>
                      <td>
                        <span class="status-badge status-${db.health}">${db.health === 'healthy' ? '✓ 健康' : db.health === 'warning' ? '⚠ 警告' : '✗ 错误'}</span>
                        <div class="progress-bar"><div class="progress-fill ${db.health}" style="width: ${db.health === 'healthy' ? 100 : db.health === 'warning' ? 60 : 20}%"></div></div>
                      </td>
                      <td>${db.sync}</td>
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
                <li class="sidebar-item"><span class="sidebar-item-icon">🔄</span><div class="sidebar-item-content"><div class="sidebar-item-title">同步全部</div></div></li>
                <li class="sidebar-item"><span class="sidebar-item-icon">📊</span><div class="sidebar-item-content"><div class="sidebar-item-title">数据质量报告</div></div></li>
                <li class="sidebar-item"><span class="sidebar-item-icon">🗑️</span><div class="sidebar-item-content"><div class="sidebar-item-title">清理过期数据</div></div></li>
                <li class="sidebar-item"><span class="sidebar-item-icon">⚙️</span><div class="sidebar-item-content"><div class="sidebar-item-title">数据库配置</div></div></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'sc-datacenter-page': ScDataCenterPage; } }

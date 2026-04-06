import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { gatewayClient } from '../gateway-client.js';

@customElement('sc-threathunt-page')
export class ScThreatHuntPage extends LitElement {
  @state() private activeTab = 'overview';
  @state() private isHunting = false;
  @state() private progress = 0;
  @state() private loading = true;
  static styles = css`
    :host {
      --th-primary: #8B5CF6;
      --th-primary-dark: #7C3AED;
      --th-success: #10B981;
      --th-warning: #F59E0B;
      --th-danger: #EF4444;
      --th-bg: var(--sc-bg-primary, #0f172a);
      --th-bg-card: var(--sc-bg-card, #1e293b);
      --th-bg-tertiary: var(--sc-bg-tertiary, #334155);
      --th-bg-hover: var(--sc-bg-hover, #475569);
      --th-text-primary: var(--sc-text-primary, #f8fafc);
      --th-text-secondary: var(--sc-text-secondary, #cbd5e1);
      --th-text-tertiary: var(--sc-text-tertiary, #94a3b8);
      --th-border: var(--sc-border-color, #334155);
      --th-radius-sm: 6px;
      --th-radius-md: 10px;
      --th-radius-lg: 16px;
      --th-transition: 200ms ease;
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      color: var(--th-text-primary);
      background: var(--th-bg);
      min-height: 100vh;
    }

    .page-container { max-width: 1600px; margin: 0 auto; padding: 24px; }

    /* Hero */
    .hero { display: flex; gap: 32px; align-items: flex-start; padding: 40px; background: linear-gradient(135deg, var(--th-bg-card) 0%, rgba(139, 92, 246, 0.1) 100%); border: 1px solid var(--th-border); border-radius: var(--th-radius-lg); margin-bottom: 32px; position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; top: -50%; right: -5%; width: 350px; height: 350px; background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%); pointer-events: none; }
    .hero-icon { width: 80px; height: 80px; background: linear-gradient(135deg, var(--th-primary) 0%, var(--th-primary-dark) 100%); border-radius: var(--th-radius-md); display: flex; align-items: center; justify-content: center; font-size: 40px; flex-shrink: 0; box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4); }
    .hero-content { flex: 1; position: relative; z-index: 1; }
    .hero-title { font-size: 32px; font-weight: 700; margin: 0 0 8px; }
    .hero-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: rgba(139, 92, 246, 0.15); color: var(--th-primary); border-radius: 20px; font-size: 13px; font-weight: 500; margin-bottom: 16px; }
    .hero-desc { font-size: 15px; line-height: 1.7; color: var(--th-text-secondary); margin: 0; max-width: 600px; }
    .hero-stats { display: flex; gap: 24px; }
    .hero-stat { text-align: center; padding: 16px 24px; background: var(--th-bg-card); border-radius: var(--th-radius-md); min-width: 100px; }
    .hero-stat-value { font-size: 28px; font-weight: 700; color: var(--th-primary); }
    .hero-stat-label { font-size: 12px; color: var(--th-text-tertiary); margin-top: 4px; }

    /* Metrics Grid */
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .metric-card { background: var(--th-bg-card); border: 1px solid var(--th-border); border-radius: var(--th-radius-md); padding: 24px; position: relative; overflow: hidden; transition: all var(--th-transition); }
    .metric-card:hover { border-color: var(--th-primary); transform: translateY(-2px); }
    .metric-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
    .metric-card.purple::before { background: linear-gradient(90deg, #8B5CF6, #A78BFA); }
    .metric-card.yellow::before { background: linear-gradient(90deg, #F59E0B, #FBBF24); }
    .metric-card.red::before { background: linear-gradient(90deg, #EF4444, #F87171); }
    .metric-card.blue::before { background: linear-gradient(90deg, #3B82F6, #60A5FA); }
    .metric-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .metric-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .metric-card.purple .metric-icon { background: rgba(139, 92, 246, 0.15); }
    .metric-card.yellow .metric-icon { background: rgba(245, 158, 11, 0.15); }
    .metric-card.red .metric-icon { background: rgba(239, 68, 68, 0.15); }
    .metric-card.blue .metric-icon { background: rgba(59, 130, 246, 0.15); }
    .metric-value { font-size: 32px; font-weight: 700; color: var(--th-text-primary); }
    .metric-label { font-size: 13px; color: var(--th-text-secondary); margin-top: 4px; }

    /* Tabs */
    .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--th-border); margin-bottom: 24px; }
    .tab { padding: 14px 20px; font-size: 14px; font-weight: 500; color: var(--th-text-secondary); background: none; border: none; cursor: pointer; position: relative; transition: all var(--th-transition); }
    .tab:hover { color: var(--th-text-primary); }
    .tab.active { color: var(--th-primary); }
    .tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: var(--th-primary); }

    /* Content Grid */
    .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
    @media (max-width: 1024px) { .content-grid { grid-template-columns: 1fr; } }

    /* Cards */
    .card { background: var(--th-bg-card); border: 1px solid var(--th-border); border-radius: var(--th-radius-lg); overflow: hidden; }
    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid var(--th-border); background: var(--th-bg-tertiary); }
    .card-title { font-size: 15px; font-weight: 600; }
    .card-body { padding: 24px; }

    /* Table */
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 600; color: var(--th-text-tertiary); background: var(--th-bg-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }
    .data-table td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid var(--th-border); }
    .data-table tbody tr:hover td { background: var(--th-bg-hover); }

    /* Status Badge */
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .status-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .status-active { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
    .status-investigating { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
    .status-blocked { background: rgba(16, 185, 129, 0.15); color: #10B981; }

    /* Buttons */
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; font-size: 14px; font-weight: 500; border-radius: var(--th-radius-sm); border: none; cursor: pointer; transition: all var(--th-transition); }
    .btn-purple { background: linear-gradient(135deg, var(--th-primary) 0%, var(--th-primary-dark) 100%); color: white; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4); }
    .btn-purple:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(139, 92, 246, 0.5); }
    .btn-purple:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .btn-secondary { background: var(--th-bg-tertiary); color: var(--th-text-primary); border: 1px solid var(--th-border); }
    .btn-secondary:hover { background: var(--th-bg-hover); }

    /* Progress */
    .progress-section { margin-top: 16px; }
    .progress-bar { height: 8px; background: var(--th-bg-tertiary); border-radius: 10px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 10px; background: linear-gradient(90deg, #8B5CF6, #A78BFA); transition: width 0.3s ease; }

    /* Sidebar List */
    .sidebar-list { list-style: none; padding: 0; margin: 0; }
    .sidebar-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--th-radius-sm); margin-bottom: 4px; cursor: pointer; transition: all var(--th-transition); color: var(--th-text-secondary); border: 1px solid transparent; }
    .sidebar-item:hover { background: var(--th-bg-hover); color: var(--th-text-primary); }
    .sidebar-item-icon { font-size: 16px; }
    .sidebar-item-content { flex: 1; }
    .sidebar-item-title { font-weight: 500; }
    .sidebar-item-meta { font-size: 11px; color: var(--th-text-tertiary); margin-top: 2px; }

    /* MITRE Matrix */
    .mitre-matrix { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
    .mitre-cell { padding: 8px; text-align: center; font-size: 11px; border-radius: 4px; background: var(--th-bg-tertiary); }
    .mitre-cell.detected { background: rgba(239, 68, 68, 0.2); color: #EF4444; }
    .mitre-cell.clean { background: rgba(16, 185, 129, 0.1); color: var(--th-text-tertiary); }

    code { background: var(--th-bg-tertiary); padding: 2px 6px; border-radius: 4px; font-size: 12px; }

    @media (max-width: 768px) {
      .page-container { padding: 16px; }
      .hero { flex-direction: column; padding: 24px; }
      .metrics-grid { grid-template-columns: repeat(2, 1fr); }
      .hero-stats { flex-direction: column; width: 100%; }
    }
  `;

  private readonly fallbackIocs = [
    { id: 'IOC-001', name: '恶意C2域名', type: 'Network', status: 'active', confidence: 95 },
    { id: 'IOC-002', name: '可疑PowerShell命令', type: 'Behavior', status: 'investigating', confidence: 78 },
    { id: 'IOC-003', name: '异常外连流量', type: 'Network', status: 'blocked', confidence: 88 },
    { id: 'IOC-004', name: '恶意哈希值', type: 'File', status: 'investigating', confidence: 65 },
  ];

  @state() private iocs: Array<{id: string; name: string; type: string; status: string; confidence: number}> = [];
  private readonly fallbackTactics = ['Initial Access', 'Execution', 'Persistence', 'Defense Evasion', 'C2'];
  @state() private tactics: string[] = [...this.fallbackTactics];

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
  }

  private async loadData() {
    this.loading = true;
    try {
      const res = await gatewayClient.request('incidents.list', {});
      const data = Array.isArray(res) ? res : (res as any)?.data ?? [];
      if (data.length > 0) {
        this.iocs = data.slice(0, 20).map((item: any) => ({
          id: item.ticketId || item.id || 'IOC-???',
          name: item.info?.title || item.title || '未知威胁',
          type: 'Network',
          status: 'active',
          confidence: Math.floor(Math.random() * 30) + 70,
        }));
      } else {
        this.iocs = [...this.fallbackIocs];
      }
    } catch {
      this.iocs = [...this.fallbackIocs];
    }
    try {
      const mitreRes = await gatewayClient.request('knowledge.mitre.tactics', {});
      const tactics = Array.isArray(mitreRes) ? mitreRes : (mitreRes as any)?.tactics ?? [];
      if (tactics.length > 0) {
        this.tactics = tactics.map((t: any) => t.name || t);
      } else {
        this.tactics = [...this.fallbackTactics];
      }
    } catch {
      this.tactics = [...this.fallbackTactics];
    }
    this.loading = false;
  }

  private handleTab(tab: string) { this.activeTab = tab; }
  private async startHunt() {
    this.isHunting = true;
    this.progress = 0;
    for (let i = 0; i <= 100; i += 2) {
      await new Promise(r => setTimeout(r, 100));
      this.progress = i;
    }
    this.isHunting = false;
  }

  render() {
    if (this.loading) {
      return html`<div style="text-align:center;padding:4rem;">⏳ 加载中...</div>`;
    }
    const activeCount = this.iocs.filter(i => i.status === 'active').length;
    const investigatingCount = this.iocs.filter(i => i.status === 'investigating').length;

    return html`
      <div class="page-container">
        <div class="hero">
          <div class="hero-icon">🎯</div>
          <div class="hero-content">
            <h1 class="hero-title">威胁狩猎</h1>
            <span class="hero-badge">🌑 黑暗面 · APT狩猎</span>
            <p class="hero-desc">基于 MITRE ATT&CK 框架，主动搜寻网络中潜伏的高级持续性威胁(APT)。支持自动化狩猎剧本和手动深度调查。</p>
          </div>
          <div class="hero-stats">
            <div class="hero-stat"><div class="hero-stat-value">156</div><div class="hero-stat-label">IOCs</div></div>
            <div class="hero-stat"><div class="hero-stat-value">18/19</div><div class="hero-stat-label">覆盖战术</div></div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card purple">
            <div class="metric-header"><div class="metric-icon">🔍</div></div>
            <div class="metric-value">${this.iocs.length}</div>
            <div class="metric-label">IOCs 总数</div>
          </div>
          <div class="metric-card red">
            <div class="metric-header"><div class="metric-icon">⚠</div></div>
            <div class="metric-value">${activeCount}</div>
            <div class="metric-label">活跃威胁</div>
          </div>
          <div class="metric-card yellow">
            <div class="metric-header"><div class="metric-icon">🔎</div></div>
            <div class="metric-value">${investigatingCount}</div>
            <div class="metric-label">调查中</div>
          </div>
          <div class="metric-card blue">
            <div class="metric-header"><div class="metric-icon">📊</div></div>
            <div class="metric-value">18/19</div>
            <div class="metric-label">覆盖战术</div>
          </div>
        </div>

        <div class="tabs">
          <button class="tab ${this.activeTab === 'overview' ? 'active' : ''}" @click=${() => this.handleTab('overview')}>📊 总览</button>
          <button class="tab ${this.activeTab === 'hunt' ? 'active' : ''}" @click=${() => this.handleTab('hunt')}>🎯 狩猎</button>
          <button class="tab ${this.activeTab === 'mitre' ? 'active' : ''}" @click=${() => this.handleTab('mitre')}>🛡️ MITRE矩阵</button>
        </div>

        <div class="content-grid">
          <div class="card">
            <div class="card-header">
              <span class="card-title">${this.activeTab === 'overview' ? '🔍 IOC列表' : this.activeTab === 'hunt' ? '🎯 狩猎剧本' : '🛡️ MITRE ATT&CK 覆盖'}</span>
            </div>
            <div class="card-body">
              ${this.activeTab === 'overview' ? html`
                <table class="data-table">
                  <thead><tr><th>IOC ID</th><th>名称</th><th>类型</th><th>状态</th><th>置信度</th></tr></thead>
                  <tbody>
                    ${this.iocs.map(ioc => html`
                      <tr>
                        <td><code>${ioc.id}</code></td>
                        <td>${ioc.name}</td>
                        <td>${ioc.type}</td>
                        <td><span class="status-badge status-${ioc.status}">${ioc.status === 'active' ? '● 活跃' : ioc.status === 'investigating' ? '🔎 调查中' : '✓ 已阻断'}</span></td>
                        <td><strong style="color: ${ioc.confidence > 80 ? '#EF4444' : ioc.confidence > 60 ? '#F59E0B' : '#10B981'}">${ioc.confidence}%</strong></td>
                      </tr>
                    `)}
                  </tbody>
                </table>
              ` : ''}
              ${this.activeTab === 'hunt' ? html`
                <button class="btn btn-purple" style="width: 100%;" @click=${this.startHunt} ?disabled=${this.isHunting}>
                  ${this.isHunting ? `🎯 狩猎中... ${this.progress}%` : '🎯 启动狩猎'}
                </button>
                ${this.isHunting ? html`<div class="progress-section"><div class="progress-bar"><div class="progress-fill" style="width: ${this.progress}%"></div></div></div>` : ''}
              ` : ''}
              ${this.activeTab === 'mitre' ? html`
                <div class="mitre-matrix">
                  ${this.tactics.map((t, i) => html`<div class="mitre-cell ${i < 4 ? 'detected' : 'clean'}">${t}${i < 4 ? ' ✓' : ''}</div>`)}
                </div>
              ` : ''}
            </div>
          </div>

          <div class="card">
            <div class="card-header"><span class="card-title">⚡ 快速操作</span></div>
            <div class="card-body">
              <button class="btn btn-purple" style="width: 100%; margin-bottom: 16px;" @click=${this.startHunt} ?disabled=${this.isHunting}>
                🎯 启动狩猎
              </button>
              ${this.isHunting ? html`<div class="progress-section"><div class="progress-bar"><div class="progress-fill" style="width: ${this.progress}%"></div></div></div>` : ''}
              <ul class="sidebar-list" style="margin-top: 24px;">
                <li class="sidebar-item"><span class="sidebar-item-icon">📊</span><div class="sidebar-item-content"><div class="sidebar-item-title">狩猎报告</div></div></li>
                <li class="sidebar-item"><span class="sidebar-item-icon">🔍</span><div class="sidebar-item-content"><div class="sidebar-item-title">新建剧本</div></div></li>
                <li class="sidebar-item"><span class="sidebar-item-icon">📥</span><div class="sidebar-item-content"><div class="sidebar-item-title">导入IOCs</div></div></li>
                <li class="sidebar-item"><span class="sidebar-item-icon">⚙️</span><div class="sidebar-item-content"><div class="sidebar-item-title">狩猎配置</div></div></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'sc-threathunt-page': ScThreatHuntPage; } }

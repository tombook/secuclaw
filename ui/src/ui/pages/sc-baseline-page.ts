import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { gatewayClient } from '../gateway-client.js';

/**
 * Baseline Check Page - Professional Design
 * ☀️ Light Side - Defense (Green Theme)
 */
@customElement('sc-baseline-page')
export class ScBaselinePage extends LitElement {
  @state() private activeTab = 'overview';
  @state() private isScanning = false;
  @state() private progress = 0;
  @state() private selectedAssets: string[] = [];

  static styles = css`
    /* Design Tokens (8px Grid) */
    :host {
      --bl-primary: #10B981;
      --bl-primary-dark: #059669;
      --bl-success: #10B981;
      --bl-warning: #F59E0B;
      --bl-danger: #EF4444;
      --bl-info: #3B82F6;
      --bl-bg: var(--sc-bg-primary, #0f172a);
      --bl-bg-card: var(--sc-bg-card, #1e293b);
      --bl-bg-tertiary: var(--sc-bg-tertiary, #334155);
      --bl-bg-hover: var(--sc-bg-hover, #475569);
      --bl-text-primary: var(--sc-text-primary, #f8fafc);
      --bl-text-secondary: var(--sc-text-secondary, #cbd5e1);
      --bl-text-tertiary: var(--sc-text-tertiary, #94a3b8);
      --bl-border: var(--sc-border-color, #334155);
      --bl-radius-sm: 6px;
      --bl-radius-md: 10px;
      --bl-radius-lg: 16px;
      --bl-shadow: 0 4px 12px rgba(0,0,0,0.3);
      --bl-transition: 200ms ease;
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      color: var(--bl-text-primary);
      background: var(--bl-bg);
      min-height: 100vh;
    }

    /* Layout */
    .page-container { max-width: 1600px; margin: 0 auto; padding: 24px; }

    /* Hero */
    .hero {
      display: flex;
      gap: 32px;
      align-items: flex-start;
      padding: 40px;
      background: linear-gradient(135deg, var(--bl-bg-card) 0%, var(--bl-bg-tertiary) 100%);
      border: 1px solid var(--bl-border);
      border-radius: var(--bl-radius-lg);
      margin-bottom: 32px;
      position: relative;
      overflow: hidden;
    }
    .hero::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -5%;
      width: 350px;
      height: 350px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%);
      pointer-events: none;
    }
    .hero-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--bl-primary) 0%, var(--bl-primary-dark) 100%);
      border-radius: var(--bl-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      flex-shrink: 0;
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
    }
    .hero-content { flex: 1; position: relative; z-index: 1; }
    .hero-title { font-size: 32px; font-weight: 700; margin: 0 0 8px; }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: rgba(16, 185, 129, 0.15);
      color: var(--bl-primary);
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 16px;
    }
    .hero-desc { font-size: 15px; line-height: 1.7; color: var(--bl-text-secondary); margin: 0; max-width: 600px; }
    .hero-stats { display: flex; gap: 24px; }
    .hero-stat { text-align: center; padding: 16px 24px; background: var(--bl-bg-card); border-radius: var(--bl-radius-md); min-width: 100px; }
    .hero-stat-value { font-size: 28px; font-weight: 700; color: var(--bl-primary); }
    .hero-stat-label { font-size: 12px; color: var(--bl-text-tertiary); margin-top: 4px; }
    .coverage-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
    .coverage-tag { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 500; }
    .coverage-tag.mitre { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
    .coverage-tag.scf { background: rgba(59, 130, 246, 0.15); color: #3B82F6; }

    /* Metrics Grid */
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .metric-card {
      background: var(--bl-bg-card);
      border: 1px solid var(--bl-border);
      border-radius: var(--bl-radius-md);
      padding: 24px;
      position: relative;
      overflow: hidden;
      transition: all var(--bl-transition);
    }
    .metric-card:hover { border-color: var(--bl-primary); transform: translateY(-2px); }
    .metric-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
    .metric-card.green::before { background: linear-gradient(90deg, #10B981, #34D399); }
    .metric-card.red::before { background: linear-gradient(90deg, #EF4444, #F87171); }
    .metric-card.yellow::before { background: linear-gradient(90deg, #F59E0B, #FBBF24); }
    .metric-card.blue::before { background: linear-gradient(90deg, #3B82F6, #60A5FA); }
    .metric-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .metric-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .metric-card.green .metric-icon { background: rgba(16, 185, 129, 0.15); }
    .metric-card.red .metric-icon { background: rgba(239, 68, 68, 0.15); }
    .metric-card.yellow .metric-icon { background: rgba(245, 158, 11, 0.15); }
    .metric-card.blue .metric-icon { background: rgba(59, 130, 246, 0.15); }
    .metric-trend { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
    .metric-trend.up { background: rgba(16, 185, 129, 0.15); color: #10B981; }
    .metric-trend.down { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
    .metric-value { font-size: 32px; font-weight: 700; color: var(--bl-text-primary); }
    .metric-label { font-size: 13px; color: var(--bl-text-secondary); margin-top: 4px; }

    /* Tabs */
    .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--bl-border); margin-bottom: 24px; }
    .tab { padding: 14px 20px; font-size: 14px; font-weight: 500; color: var(--bl-text-secondary); background: none; border: none; cursor: pointer; position: relative; transition: all var(--bl-transition); }
    .tab:hover { color: var(--bl-text-primary); }
    .tab.active { color: var(--bl-primary); }
    .tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: var(--bl-primary); }

    /* Content Grid */
    .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
    @media (max-width: 1024px) { .content-grid { grid-template-columns: 1fr; } }

    /* Cards */
    .card { background: var(--bl-bg-card); border: 1px solid var(--bl-border); border-radius: var(--bl-radius-lg); overflow: hidden; }
    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid var(--bl-border); background: var(--bl-bg-tertiary); }
    .card-title { font-size: 15px; font-weight: 600; }
    .card-body { padding: 24px; }

    /* Table */
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 600; color: var(--bl-text-tertiary); background: var(--bl-bg-tertiary); text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
    .data-table td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid var(--bl-border); }
    .data-table tbody tr:hover td { background: var(--bl-bg-hover); }
    .data-table tbody tr:last-child td { border-bottom: none; }

    /* Status Badge */
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .status-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .status-pass { background: rgba(16, 185, 129, 0.15); color: #10B981; }
    .status-fail { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
    .status-warn { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }

    /* Buttons */
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; font-size: 14px; font-weight: 500; border-radius: var(--bl-radius-sm); border: none; cursor: pointer; transition: all var(--bl-transition); }
    .btn-primary { background: linear-gradient(135deg, var(--bl-primary) 0%, var(--bl-primary-dark) 100%); color: white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .btn-secondary { background: var(--bl-bg-tertiary); color: var(--bl-text-primary); border: 1px solid var(--bl-border); }
    .btn-secondary:hover { background: var(--bl-bg-hover); }

    /* Forms */
    .form-group { margin-bottom: 16px; }
    .form-label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; }
    .form-select { width: 100%; padding: 10px 14px; font-size: 14px; background: var(--bl-bg); border: 1px solid var(--bl-border); border-radius: var(--bl-radius-sm); color: var(--bl-text-primary); cursor: pointer; }
    .form-select:focus { outline: none; border-color: var(--bl-primary); }

    /* Progress */
    .progress-section { margin-top: 16px; }
    .progress-bar { height: 8px; background: var(--bl-bg-tertiary); border-radius: 10px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 10px; background: linear-gradient(90deg, #10B981, #34D399); transition: width 0.3s ease; }

    /* Sidebar List */
    .sidebar-list { list-style: none; padding: 0; margin: 0; }
    .sidebar-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--bl-radius-sm); margin-bottom: 4px; cursor: pointer; transition: all var(--bl-transition); color: var(--bl-text-secondary); border: 1px solid transparent; }
    .sidebar-item:hover { background: var(--bl-bg-hover); color: var(--bl-text-primary); }
    .sidebar-item-icon { font-size: 16px; }
    .sidebar-item-content { flex: 1; }
    .sidebar-item-title { font-weight: 500; }
    .sidebar-item-meta { font-size: 11px; color: var(--bl-text-tertiary); margin-top: 2px; }

    /* Empty State */
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; text-align: center; }
    .empty-icon { font-size: 48px; opacity: 0.5; margin-bottom: 16px; }
    .empty-title { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
    .empty-desc { font-size: 14px; color: var(--bl-text-secondary); }

    code { background: var(--bl-bg-tertiary); padding: 2px 6px; border-radius: 4px; font-size: 12px; }

    /* Responsive */
    @media (max-width: 768px) {
      .page-container { padding: 16px; }
      .hero { flex-direction: column; padding: 24px; }
      .metrics-grid { grid-template-columns: repeat(2, 1fr); }
      .hero-stats { flex-direction: column; width: 100%; }
      .tab { padding: 12px 14px; font-size: 13px; }
    }
  `;

  
  @state() private controls: Array<{id: string; name: string; status: string; category: string; framework: string}> = [];
  @state() private assets: Array<{id: string; name: string; type: string; ip: string; status: string; tags: string[]}> = [];
  @state() private loading = true;
  @state() private fallbackAssets = [
    { id: 'ASSET-1', name: '示例资产-一', type: '服务器', ip: '10.0.0.1', status: 'active', tags: ['internal', 'prod'] as string[] },
    { id: 'ASSET-2', name: '示例资产-二', type: '工作站', ip: '10.0.0.2', status: 'active', tags: ['lab'] as string[] },
  ];
  
  // Backward-compatible hardcoded baseline checks fallback
  @state() private fallbackControls = [
    { id: 'CIS-1.1', name: '密码策略配置', status: 'pass', category: '身份认证', framework: 'CIS' },
    { id: 'CIS-1.2', name: '账户锁定策略', status: 'pass', category: '身份认证', framework: 'CIS' },
    { id: 'CIS-2.1', name: '审计日志配置', status: 'fail', category: '日志监控', framework: 'CIS' },
    { id: 'CIS-3.1', name: '网络分段', status: 'pass', category: '网络安全', framework: 'CIS' },
    { id: 'AWS-WAF-1', name: 'WAF启用状态', status: 'pass', category: '云安全', framework: 'AWS' },
    { id: 'NIST-AC-1', name: '访问控制策略', status: 'warn', category: '访问管理', framework: 'NIST' },
  ];

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
  }

  private async loadData() {
    this.loading = true;
    try {
      const res = await gatewayClient.request('tasks.list', { type: 'baseline' });
      const data = Array.isArray(res) ? res : (res as any)?.data ?? [];
      if (data.length > 0) {
        this.controls = data.slice(0, 20).map((item: any) => ({
          id: item.id || 'CTRL-???',
          name: item.name || item.title || '未知控制项',
          status: item.status === 'completed' ? 'pass' : item.status === 'failed' ? 'fail' : 'warn',
          category: item.category || '通用',
          framework: item.framework || 'CIS',
        }));
      } else {
        this.controls = [...this.fallbackControls];
      }

      // Load assets data from backend with fallback
      const assetsRes = await gatewayClient.request('assets.list', {});
      const assetsData = Array.isArray(assetsRes) ? assetsRes : (assetsRes as any)?.data ?? [];
      if (assetsData.length > 0) {
        this.assets = assetsData.map((a: any) => ({
          id: a.id || 'ASSET-???',
          name: a.name || a.title || '资产',
          type: a.type || '',
          ip: a.ip || '',
          status: a.status || '',
          tags: a.tags || [],
        }));
      } else {
        this.assets = [...this.fallbackAssets];
      }

      // Ensure at least one asset is selected by default if none selected
      if (this.selectedAssets.length === 0 && this.assets.length > 0) {
        this.selectedAssets = [this.assets[0].id];
      }
    } catch {
      this.controls = [...this.fallbackControls];
      // In case of error, still provide assets fallback
      this.assets = [...this.fallbackAssets];
      if (this.selectedAssets.length === 0 && this.assets.length > 0) {
        this.selectedAssets = [this.assets[0].id];
      }
    } finally {
      this.loading = false;
    }
  }

  private handleTab(tab: string) { this.activeTab = tab; }

  private async runScan() {
    this.isScanning = true;
    this.progress = 0;
    // Delegates to baseline task creation and provides minimal progress feedback
    await this.startScan();
  }

  // New: perform aBaseline task creation via backend
  private async startScan() {
    this.progress = 0;
    try {
      await this.runBaseline();
      // simulate a small progress increment to reflect completion
      this.progress = 100;
    } finally {
      this.isScanning = false;
    }
  }

  private async runBaseline() {
    // Create a new baseline task targeting selected assets
    const payload = { type: 'baseline', target: this.selectedAssets, config: {} };
    return await gatewayClient.request('tasks.create', payload);
  }

  render() {
    if (this.loading) {
      return html`<div style="text-align:center;padding:4rem;"><div style="font-size:48px;">⏳</div><div>加载中...</div></div>`;
    }
    const passCount = this.controls.filter(c => c.status === 'pass').length;
    const failCount = this.controls.filter(c => c.status === 'fail').length;
    const warnCount = this.controls.filter(c => c.status === 'warn').length;
    const complianceRate = Math.round((passCount / this.controls.length) * 100);

    return html`
      <div class="page-container">
        <div class="hero">
          <div class="hero-icon">🛡️</div>
          <div class="hero-content">
            <h1 class="hero-title">安全基线检测</h1>
            <span class="hero-badge">☀️ 光明面 · 防御性安全</span>
            <p class="hero-desc">按资产域自动检测 CIS/云/容器/终端安全基线，生成整改任务，跟踪闭环率。支持 CIS Benchmarks、NIST CSF、AWS Well-Architected 等主流框架。</p>
            <div class="coverage-tags">
              <span class="coverage-tag mitre">MITRE: TA0005 Defense Evasion</span>
              <span class="coverage-tag scf">SCF: CM-1 Configuration Management</span>
            </div>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <div class="hero-stat-value">${this.controls.length}</div>
              <div class="hero-stat-label">总控制项</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-value">68</div>
              <div class="hero-stat-label">受控资产</div>
            </div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card green">
            <div class="metric-header">
              <div class="metric-icon">✓</div>
              <span class="metric-trend up">+2</span>
            </div>
            <div class="metric-value">${passCount}</div>
            <div class="metric-label">通过项</div>
          </div>
          <div class="metric-card red">
            <div class="metric-header">
              <div class="metric-icon">✗</div>
              <span class="metric-trend down">-1</span>
            </div>
            <div class="metric-value">${failCount}</div>
            <div class="metric-label">失败项</div>
          </div>
          <div class="metric-card yellow">
            <div class="metric-header"><div class="metric-icon">⚠</div></div>
            <div class="metric-value">${warnCount}</div>
            <div class="metric-label">警告项</div>
          </div>
          <div class="metric-card blue">
            <div class="metric-header"><div class="metric-icon">📊</div></div>
            <div class="metric-value">${complianceRate}%</div>
            <div class="metric-label">合规率</div>
          </div>
        </div>

        <div class="tabs">
          <button class="tab ${this.activeTab === 'overview' ? 'active' : ''}" @click=${() => this.handleTab('overview')}>📊 总览</button>
          <button class="tab ${this.activeTab === 'scan' ? 'active' : ''}" @click=${() => this.handleTab('scan')}>🚀 基线扫描</button>
          <button class="tab ${this.activeTab === 'frameworks' ? 'active' : ''}" @click=${() => this.handleTab('frameworks')}>⚙️ 框架配置</button>
          <button class="tab ${this.activeTab === 'results' ? 'active' : ''}" @click=${() => this.handleTab('results')}>📋 扫描结果</button>
        </div>

        <div class="content-grid">
          <div class="card">
            <div class="card-header">
              <span class="card-title">${this.activeTab === 'overview' ? '🔍 最近检测结果' : this.activeTab === 'scan' ? '⚙️ 扫描配置' : this.activeTab === 'frameworks' ? '📋 框架列表' : '📋 完整结果'}</span>
              ${this.activeTab === 'overview' || this.activeTab === 'results' ? html`<button class="btn btn-secondary">导出</button>` : ''}
            </div>
            <div class="card-body">
              ${this.activeTab === 'overview' || this.activeTab === 'results' ? this.renderResults() : ''}
              ${this.activeTab === 'scan' ? this.renderScanConfig() : ''}
              ${this.activeTab === 'frameworks' ? this.renderFrameworks() : ''}
            </div>
          </div>

          <div class="card">
            <div class="card-header"><span class="card-title">⚡ 快速操作</span></div>
            <div class="card-body">
              <button class="btn btn-primary" style="width: 100%; margin-bottom: 16px;" @click=${this.runScan} ?disabled=${this.isScanning}>
                ${this.isScanning ? `扫描中... ${this.progress}%` : '🚀 立即扫描'}
              </button>
              ${this.isScanning ? html`<div class="progress-section"><div class="progress-bar"><div class="progress-fill" style="width: ${this.progress}%"></div></div></div>` : ''}
              <ul class="sidebar-list" style="margin-top: 24px;">
                <li class="sidebar-item"><span class="sidebar-item-icon">📊</span><div class="sidebar-item-content"><div class="sidebar-item-title">导出报告</div></div></li>
                <li class="sidebar-item"><span class="sidebar-item-icon">📧</span><div class="sidebar-item-content"><div class="sidebar-item-title">发送通知</div></div></li>
                <li class="sidebar-item"><span class="sidebar-item-icon">🔄</span><div class="sidebar-item-content"><div class="sidebar-item-title">计划扫描</div></div></li>
                <li class="sidebar-item"><span class="sidebar-item-icon">⚙️</span><div class="sidebar-item-content"><div class="sidebar-item-title">扫描配置</div></div></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderResults() {
    return html`
      <table class="data-table">
        <thead><tr><th>控制项ID</th><th>名称</th><th>状态</th><th>类别</th><th>框架</th></tr></thead>
        <tbody>
          ${this.controls.map(c => html`
            <tr>
              <td><code>${c.id}</code></td>
              <td>${c.name}</td>
              <td><span class="status-badge status-${c.status}">${c.status === 'pass' ? '✓ 通过' : c.status === 'fail' ? '✗ 失败' : '⚠ 警告'}</span></td>
              <td>${c.category}</td>
              <td>${c.framework}</td>
            </tr>
          `)}
        </tbody>
      </table>
    `;
  }

  private renderScanConfig() {
    return html`
      <div class="form-group">
        <label class="form-label">资产范围</label>
        <select class="form-select">
          <option>全部资产 (68)</option><option>云资产 (24)</option><option>终端设备 (32)</option><option>容器 (12)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">安全框架</label>
        <select class="form-select">
          <option>全部框架</option><option>CIS Benchmarks</option><option>NIST CSF</option><option>AWS Well-Architected</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">扫描深度</label>
        <select class="form-select">
          <option>标准扫描</option><option>深度扫描</option><option>快速扫描</option>
        </select>
      </div>
      <button class="btn btn-primary" style="width: 100%;" @click=${this.runScan} ?disabled=${this.isScanning}>
        ${this.isScanning ? `扫描中... ${this.progress}%` : '🚀 开始扫描'}
      </button>
    `;
  }

  private renderFrameworks() {
    const frameworks = [
      { name: 'CIS Benchmarks', count: 68, enabled: true },
      { name: 'NIST CSF', count: 45, enabled: false },
      { name: 'AWS Well-Architected', count: 32, enabled: false },
      { name: 'PCI-DSS', count: 28, enabled: true },
    ];
    return html`
      <div class="sidebar-list">
        ${frameworks.map(f => html`
          <li class="sidebar-item" style="border: 1px solid var(--bl-border);">
            <div class="sidebar-item-content">
              <div class="sidebar-item-title">${f.name}</div>
              <div class="sidebar-item-meta">${f.count} controls</div>
            </div>
            <span class="status-badge ${f.enabled ? 'status-pass' : 'status-warn'}">${f.enabled ? '✓ 已启用' : '○ 未启用'}</span>
          </li>
        `)}
      </div>
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'sc-baseline-page': ScBaselinePage; } }

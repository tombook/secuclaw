import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../../components/design-system/sc-button.js';
import '../../components/sc-smart-recommendation-bar.js';

/**
 * Professional Baseline Tool Page
 * Redesigned with modern SOC aesthetics
 */
@customElement('sc-tool-baseline-v2')
export class ScToolBaselineV2 extends LitElement {
  @state() private activeTab = 'overview';
  @state() private scanResults: any[] = [];
  @state() private isScanning = false;
  @state() private _selectedFramework = 'all';
  @state() private scanProgress = 0;

  static styles = css`
    :host { display: block; }
    
    .page-container { 
      padding: var(--sc-spacing-xl); 
      max-width: 1600px; 
      margin: 0 auto; 
    }

    /* === Hero Section === */
    .hero-section {
      background: linear-gradient(135deg, var(--sc-bg-card) 0%, var(--sc-bg-secondary) 100%);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-lg);
      padding: var(--sc-spacing-xl);
      margin-bottom: var(--sc-spacing-xl);
      position: relative;
      overflow: hidden;
    }

    .hero-section::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, var(--sc-primary-alpha-10) 0%, transparent 70%);
      pointer-events: none;
    }

    .hero-content {
      display: flex;
      gap: var(--sc-spacing-xl);
      align-items: flex-start;
      position: relative;
      z-index: 1;
    }

    .hero-icon {
      width: 72px;
      height: 72px;
      border-radius: var(--sc-radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
      flex-shrink: 0;
    }

    .hero-info { flex: 1; }

    .hero-title {
      font-size: var(--sc-font-size-2xl);
      font-weight: 700;
      color: var(--sc-text-primary);
      margin: 0 0 var(--sc-spacing-xs);
    }

    .hero-domain {
      display: inline-flex;
      align-items: center;
      gap: var(--sc-spacing-xs);
      padding: 4px 12px;
      background: rgba(16, 185, 129, 0.15);
      color: #10B981;
      border-radius: var(--sc-radius-full);
      font-size: var(--sc-font-size-xs);
      font-weight: 500;
      margin-bottom: var(--sc-spacing-md);
    }

    .hero-description {
      color: var(--sc-text-secondary);
      font-size: var(--sc-font-size-sm);
      line-height: 1.6;
      margin: 0;
      max-width: 600px;
    }

    .hero-stats {
      display: flex;
      gap: var(--sc-spacing-xl);
      margin-top: var(--sc-spacing-lg);
    }

    .hero-stat {
      text-align: center;
    }

    .hero-stat-value {
      font-size: var(--sc-font-size-xl);
      font-weight: 700;
      color: var(--sc-text-primary);
    }

    .hero-stat-label {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-tertiary);
    }

    /* === Metrics Grid === */
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--sc-spacing-md);
      margin-bottom: var(--sc-spacing-xl);
    }

    .metric-card {
      background: var(--sc-bg-card);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-lg);
      padding: var(--sc-spacing-lg);
      position: relative;
      overflow: hidden;
      transition: all var(--sc-transition-normal);
    }

    .metric-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
    }

    .metric-card.green::before { background: linear-gradient(90deg, #10B981, #34D399); }
    .metric-card.red::before { background: linear-gradient(90deg, #EF4444, #F87171); }
    .metric-card.yellow::before { background: linear-gradient(90deg, #F59E0B, #FBBF24); }
    .metric-card.blue::before { background: linear-gradient(90deg, #3B82F6, #60A5FA); }

    .metric-card:hover {
      border-color: var(--sc-primary);
      transform: translateY(-2px);
      box-shadow: var(--sc-shadow-md);
    }

    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-sm);
    }

    .metric-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--sc-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .metric-card.green .metric-icon { background: rgba(16, 185, 129, 0.15); }
    .metric-card.red .metric-icon { background: rgba(239, 68, 68, 0.15); }
    .metric-card.yellow .metric-icon { background: rgba(245, 158, 11, 0.15); }
    .metric-card.blue .metric-icon { background: rgba(59, 130, 246, 0.15); }

    .metric-trend {
      font-size: var(--sc-font-size-xs);
      padding: 2px 8px;
      border-radius: var(--sc-radius-full);
    }

    .metric-trend.up { background: var(--sc-success-bg); color: var(--sc-success); }
    .metric-trend.down { background: var(--sc-error-bg); color: var(--sc-error); }

    .metric-value {
      font-size: var(--sc-font-size-2xl);
      font-weight: 700;
      color: var(--sc-text-primary);
      line-height: 1.2;
    }

    .metric-label {
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-secondary);
      margin-top: var(--sc-spacing-xs);
    }

    .metric-bar {
      height: 4px;
      background: var(--sc-bg-tertiary);
      border-radius: var(--sc-radius-full);
      margin-top: var(--sc-spacing-md);
      overflow: hidden;
    }

    .metric-bar-fill {
      height: 100%;
      border-radius: var(--sc-radius-full);
      transition: width var(--sc-transition-slow);
    }

    .metric-card.green .metric-bar-fill { background: #10B981; }
    .metric-card.red .metric-bar-fill { background: #EF4444; }
    .metric-card.yellow .metric-bar-fill { background: #F59E0B; }
    .metric-card.blue .metric-bar-fill { background: #3B82F6; }

    /* === Tabs === */
    .tabs-container {
      display: flex;
      gap: var(--sc-spacing-xs);
      border-bottom: 1px solid var(--sc-border-color);
      margin-bottom: var(--sc-spacing-lg);
    }

    .tab {
      padding: var(--sc-spacing-md) var(--sc-spacing-lg);
      font-size: var(--sc-font-size-sm);
      font-weight: 500;
      color: var(--sc-text-secondary);
      cursor: pointer;
      border: none;
      background: none;
      position: relative;
      transition: all var(--sc-transition-fast);
    }

    .tab:hover { color: var(--sc-text-primary); }
    
    .tab.active {
      color: var(--sc-primary);
    }

    .tab.active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--sc-primary);
    }

    /* === Content Grid === */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: var(--sc-spacing-lg);
    }

    .card {
      background: var(--sc-bg-card);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-lg);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--sc-spacing-md) var(--sc-spacing-lg);
      border-bottom: 1px solid var(--sc-border-color);
      background: var(--sc-bg-secondary);
    }

    .card-title {
      font-size: var(--sc-font-size-md);
      font-weight: 600;
      color: var(--sc-text-primary);
    }

    .card-body { padding: var(--sc-spacing-lg); }

    /* === Table === */
    .results-table {
      width: 100%;
      border-collapse: collapse;
    }

    .results-table th {
      text-align: left;
      padding: var(--sc-spacing-sm) var(--sc-spacing-md);
      font-size: var(--sc-font-size-xs);
      font-weight: 600;
      color: var(--sc-text-secondary);
      background: var(--sc-bg-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .results-table td {
      padding: var(--sc-spacing-md);
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-primary);
      border-bottom: 1px solid var(--sc-border-color);
    }

    .results-table tr:hover td {
      background: var(--sc-bg-hover);
    }

    /* === Status Badges === */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: var(--sc-radius-full);
      font-size: var(--sc-font-size-xs);
      font-weight: 500;
    }

    .status-badge.pass { background: rgba(16, 185, 129, 0.15); color: #10B981; }
    .status-badge.fail { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
    .status-badge.warn { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }

    .status-badge::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    /* === Form Elements === */
    .form-group { margin-bottom: var(--sc-spacing-md); }
    
    .form-label {
      display: block;
      font-size: var(--sc-font-size-sm);
      font-weight: 500;
      color: var(--sc-text-primary);
      margin-bottom: var(--sc-spacing-xs);
    }

    .form-select {
      width: 100%;
      padding: var(--sc-spacing-sm) var(--sc-spacing-md);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      background: var(--sc-input-bg);
      color: var(--sc-text-primary);
      font-size: var(--sc-font-size-sm);
      cursor: pointer;
    }

    .form-select:focus {
      outline: none;
      border-color: var(--sc-primary);
    }

    /* === Buttons === */
    .btn {
      padding: var(--sc-spacing-sm) var(--sc-spacing-lg);
      border: none;
      border-radius: var(--sc-radius-md);
      font-size: var(--sc-font-size-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--sc-transition-fast);
      display: inline-flex;
      align-items: center;
      gap: var(--sc-spacing-sm);
    }

    .btn-primary {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-secondary {
      background: var(--sc-bg-tertiary);
      color: var(--sc-text-primary);
      border: 1px solid var(--sc-border-color);
    }

    .btn-secondary:hover { background: var(--sc-bg-hover); }

    /* === Scan Progress === */
    .scan-progress {
      margin-top: var(--sc-spacing-md);
    }

    .progress-bar {
      height: 8px;
      background: var(--sc-bg-tertiary);
      border-radius: var(--sc-radius-full);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10B981, #34D399);
      border-radius: var(--sc-radius-full);
      transition: width 0.3s ease;
    }

    .progress-text {
      text-align: center;
      margin-top: var(--sc-spacing-xs);
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-secondary);
    }

    /* === Framework Cards === */
    .framework-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--sc-spacing-md);
    }

    .framework-card {
      background: var(--sc-bg-tertiary);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      padding: var(--sc-spacing-md);
      text-align: center;
      cursor: pointer;
      transition: all var(--sc-transition-fast);
    }

    .framework-card:hover {
      border-color: var(--sc-primary);
      background: var(--sc-bg-hover);
    }

    .framework-card.selected {
      border-color: var(--sc-primary);
      background: rgba(59, 130, 246, 0.1);
    }

    .framework-name {
      font-size: var(--sc-font-size-sm);
      font-weight: 600;
      color: var(--sc-text-primary);
    }

    .framework-count {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-tertiary);
      margin-top: 4px;
    }

    /* === Coverage Tags === */
    .coverage-section {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sc-spacing-sm);
      margin-top: var(--sc-spacing-md);
    }

    .coverage-group {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs);
    }

    .coverage-label {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-tertiary);
      font-weight: 500;
    }

    .coverage-tag {
      padding: 2px 8px;
      border-radius: var(--sc-radius-sm);
      font-size: var(--sc-font-size-xs);
      font-weight: 500;
    }

    .coverage-tag.mitre {
      background: rgba(239, 68, 68, 0.15);
      color: #EF4444;
    }

    .coverage-tag.scf {
      background: rgba(59, 130, 246, 0.15);
      color: #3B82F6;
    }

    /* === Empty State === */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--sc-spacing-2xl);
      text-align: center;
    }

    .empty-icon { font-size: 48px; opacity: 0.5; margin-bottom: var(--sc-spacing-md); }
    .empty-title { font-size: var(--sc-font-size-md); font-weight: 600; color: var(--sc-text-primary); margin-bottom: var(--sc-spacing-xs); }
    .empty-desc { font-size: var(--sc-font-size-sm); color: var(--sc-text-secondary); }

    /* === Sidebar List === */
    .sidebar-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .sidebar-item {
      padding: var(--sc-spacing-sm) var(--sc-spacing-md);
      border-radius: var(--sc-radius-md);
      margin-bottom: var(--sc-spacing-xs);
      cursor: pointer;
      transition: all var(--sc-transition-fast);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm);
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-secondary);
    }

    .sidebar-item:hover {
      background: var(--sc-bg-hover);
      color: var(--sc-text-primary);
    }

    .sidebar-item.active {
      background: rgba(59, 130, 246, 0.15);
      color: var(--sc-primary);
    }

    .sidebar-item-icon { font-size: 16px; }

    @media (max-width: 1200px) {
      .content-grid { grid-template-columns: 1fr; }
      .metric-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 768px) {
      .metric-grid { grid-template-columns: 1fr; }
      .framework-grid { grid-template-columns: 1fr; }
    }
  `;

  private handleTabClick(tab: string) { this.activeTab = tab; }

  private async runScan() {
    this.isScanning = true;
    this.scanProgress = 0;
    
    // Simulate scan progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      this.scanProgress = i;
    }
    
    this.scanResults = [
      { id: 1, control: 'CIS-1.1', title: 'Password Policy', status: 'pass', category: 'Identity', framework: 'CIS' },
      { id: 2, control: 'CIS-1.2', title: 'Account Management', status: 'pass', category: 'Identity', framework: 'CIS' },
      { id: 3, control: 'CIS-2.1', title: 'Audit Logging', status: 'fail', category: 'Logging', framework: 'CIS' },
      { id: 4, control: 'CIS-3.1', title: 'Network Segmentation', status: 'pass', category: 'Network', framework: 'CIS' },
      { id: 5, control: 'CIS-4.2', title: 'DNS Filtering', status: 'warn', category: 'Network', framework: 'CIS' },
      { id: 6, control: 'AWS-WAF-1', title: 'WAF Configuration', status: 'pass', category: 'Cloud', framework: 'AWS' },
      { id: 7, control: 'PCI-DSS-1.1', title: 'Firewall Rules', status: 'pass', category: 'Compliance', framework: 'PCI' },
    ];
    this.isScanning = false;
  }

  render() {
    const passCount = this.scanResults.filter(r => r.status === 'pass').length;
    const failCount = this.scanResults.filter(r => r.status === 'fail').length;
    const warnCount = this.scanResults.filter(r => r.status === 'warn').length;
    const complianceRate = this.scanResults.length > 0 
      ? Math.round((passCount / this.scanResults.length) * 100) 
      : 85;

    return html`
      <sc-smart-recommendation-bar></sc-smart-recommendation-bar>
      <div class="page-container">
        ${this.renderHero()}
        
        <div class="metric-grid">
          <div class="metric-card green">
            <div class="metric-header">
              <div class="metric-icon">✓</div>
              <span class="metric-trend up">+2</span>
            </div>
            <div class="metric-value">${passCount || 48}</div>
            <div class="metric-label">Passed Controls</div>
            <div class="metric-bar"><div class="metric-bar-fill" style="width: 80%"></div></div>
          </div>
          
          <div class="metric-card red">
            <div class="metric-header">
              <div class="metric-icon">✗</div>
              <span class="metric-trend down">-1</span>
            </div>
            <div class="metric-value">${failCount || 12}</div>
            <div class="metric-label">Failed Controls</div>
            <div class="metric-bar"><div class="metric-bar-fill" style="width: 20%"></div></div>
          </div>
          
          <div class="metric-card yellow">
            <div class="metric-header">
              <div class="metric-icon">⚠</div>
            </div>
            <div class="metric-value">${warnCount || 8}</div>
            <div class="metric-label">Warnings</div>
            <div class="metric-bar"><div class="metric-bar-fill" style="width: 35%"></div></div>
          </div>
          
          <div class="metric-card blue">
            <div class="metric-header">
              <div class="metric-icon">📊</div>
              <span class="metric-trend up">+5%</span>
            </div>
            <div class="metric-value">${complianceRate}%</div>
            <div class="metric-label">Compliance Rate</div>
            <div class="metric-bar"><div class="metric-bar-fill" style="width: ${complianceRate}%"></div></div>
          </div>
        </div>

        ${this.renderTabs()}

        ${this.activeTab === 'overview' ? this.renderOverview() : ''}
        ${this.activeTab === 'scan' ? this.renderScan() : ''}
        ${this.activeTab === 'frameworks' ? this.renderFrameworks() : ''}
        ${this.activeTab === 'results' ? this.renderResults() : ''}
      </div>
    `;
  }

  private renderHero() {
    return html`
      <div class="hero-section">
        <div class="hero-content">
          <div class="hero-icon">🛡️</div>
          <div class="hero-info">
            <h1 class="hero-title">安全基线检测</h1>
            <span class="hero-domain">☀️ 光明面 · 防御性安全</span>
            <p class="hero-description">
              按资产域自动检测 CIS/云/容器/终端安全基线，生成整改任务，跟踪闭环率。支持 CIS Benchmarks、NIST CSF、AWS Well-Architected 等主流框架。
            </p>
            <div class="coverage-section">
              <div class="coverage-group">
                <span class="coverage-label">MITRE:</span>
                <span class="coverage-tag mitre">TA0005 Defense Evasion</span>
              </div>
              <div class="coverage-group">
                <span class="coverage-label">SCF:</span>
                <span class="coverage-tag scf">CM-1 Configuration Management</span>
              </div>
            </div>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <div class="hero-stat-value">156</div>
              <div class="hero-stat-label">Total Controls</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-value">68</div>
              <div class="hero-stat-label">Assets</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderTabs() {
    const tabs = [
      { id: 'overview', label: '总览', icon: '📊' },
      { id: 'scan', label: '基线扫描', icon: '🔍' },
      { id: 'frameworks', label: '框架配置', icon: '⚙️' },
      { id: 'results', label: '扫描结果', icon: '📋' },
    ];
    
    return html`
      <div class="tabs-container">
        ${tabs.map(tab => html`
          <button 
            class="tab ${this.activeTab === tab.id ? 'active' : ''}"
            @click=${() => this.handleTabClick(tab.id)}
          >
            <span>${tab.icon}</span> ${tab.label}
          </sc-button>
        `)}
      </div>
    `;
  }

  private renderOverview() {
    return html`
      <div class="content-grid">
        <div class="card">
          <div class="card-header">
            <span class="card-title">最近扫描记录</span>
            <sc-button variant="secondary">查看全部</sc-button>
          </div>
          <table class="results-table">
            <thead>
              <tr>
                <th>控制项</th>
                <th>名称</th>
                <th>状态</th>
                <th>类别</th>
                <th>框架</th>
              </tr>
            </thead>
            <tbody>
              ${this.scanResults.length > 0 ? this.scanResults.slice(0, 5).map(r => html`
                <tr>
                  <td><code>${r.control}</code></td>
                  <td>${r.title}</td>
                  <td><span class="status-badge ${r.status}">${r.status === 'pass' ? '通过' : r.status === 'fail' ? '失败' : '警告'}</span></td>
                  <td>${r.category}</td>
                  <td>${r.framework}</td>
                </tr>
              `) : html`
                <tr>
                  <td colspan="5">
                    <div class="empty-state">
                      <div class="empty-icon">📋</div>
                      <div class="empty-title">暂无扫描结果</div>
                      <div class="empty-desc">运行基线扫描以查看结果</div>
                    </div>
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">快速操作</span>
          </div>
          <div class="card-body">
            <sc-button variant="primary" style="width: 100%; margin-bottom: var(--sc-spacing-md);" @click=${this.runScan} ?disabled=${this.isScanning}>
              ${this.isScanning ? '扫描中...' : '🚀 立即扫描'}
            </sc-button>
            
            ${this.isScanning ? html`
              <div class="scan-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${this.scanProgress}%"></div>
                </div>
                <div class="progress-text">扫描进度: ${this.scanProgress}%</div>
              </div>
            ` : ''}

            <ul class="sidebar-list" style="margin-top: var(--sc-spacing-lg);">
              <li class="sidebar-item"><span class="sidebar-item-icon">📊</span> 导出报告</li>
              <li class="sidebar-item"><span class="sidebar-item-icon">📧</span> 发送通知</li>
              <li class="sidebar-item"><span class="sidebar-item-icon">🔄</span> 计划扫描</li>
              <li class="sidebar-item"><span class="sidebar-item-icon">⚙️</span> 扫描配置</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  private renderScan() {
    return html`
      <div class="content-grid">
        <div class="card">
          <div class="card-header">
            <span class="card-title">扫描配置</span>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">资产范围</label>
              <select class="form-select">
                <option>全部资产 (68)</option>
                <option>仅云资产 (24)</option>
                <option>仅终端 (32)</option>
                <option>仅容器 (12)</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">安全框架</label>
              <select class="form-select">
                <option>全部框架</option>
                <option>CIS Benchmarks</option>
                <option>NIST CSF</option>
                <option>AWS Well-Architected</option>
                <option>PCI-DSS</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">扫描深度</label>
              <select class="form-select">
                <option>标准扫描</option>
                <option>深度扫描 (耗时较长)</option>
                <option>快速扫描</option>
              </select>
            </div>

            <sc-button variant="primary" style="width: 100%;" @click=${this.runScan} ?disabled=${this.isScanning}>
              ${this.isScanning ? `扫描中... ${this.scanProgress}%` : '🚀 开始扫描'}
            </sc-button>

            ${this.isScanning ? html`
              <div class="scan-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${this.scanProgress}%"></div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">扫描历史</span>
          </div>
          <div class="card-body">
            <ul class="sidebar-list">
              <li class="sidebar-item">
                <span class="sidebar-item-icon">✓</span>
                <div>
                  <div style="font-weight: 500;">全面扫描</div>
                  <div style="font-size: 12px; color: var(--sc-text-tertiary);">今天 14:30 · 68项通过, 12项失败</div>
                </div>
              </li>
              <li class="sidebar-item">
                <span class="sidebar-item-icon">✓</span>
                <div>
                  <div style="font-weight: 500;">快速扫描</div>
                  <div style="font-size: 12px; color: var(--sc-text-tertiary);">昨天 10:15 · 45项通过, 5项失败</div>
                </div>
              </li>
              <li class="sidebar-item">
                <span class="sidebar-item-icon">⚠</span>
                <div>
                  <div style="font-weight: 500;">深度扫描</div>
                  <div style="font-size: 12px; color: var(--sc-text-tertiary);">3天前 · 52项通过, 18项失败</div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  private renderFrameworks() {
    const frameworks = [
      { name: 'CIS Benchmarks', count: 68, selected: true },
      { name: 'NIST CSF', count: 45, selected: false },
      { name: 'AWS Well-Architected', count: 32, selected: false },
      { name: 'PCI-DSS', count: 28, selected: false },
      { name: 'SOC 2', count: 24, selected: false },
      { name: 'ISO 27001', count: 18, selected: false },
    ];

    return html`
      <div class="content-grid">
        <div class="card">
          <div class="card-header">
            <span class="card-title">选择框架</span>
            <sc-button variant="secondary">保存配置</sc-button>
          </div>
          <div class="card-body">
            <div class="framework-grid">
              ${frameworks.map(f => html`
                <div class="framework-card ${f.selected ? 'selected' : ''}">
                  <div class="framework-name">${f.name}</div>
                  <div class="framework-count">${f.count} controls</div>
                </div>
              `)}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">框架说明</span>
          </div>
          <div class="card-body">
            <p style="color: var(--sc-text-secondary); font-size: var(--sc-font-size-sm); line-height: 1.6;">
              <strong style="color: var(--sc-text-primary);">CIS Benchmarks</strong> 是 Center for Internet Security 发布的
              自动化配置验证标准，涵盖操作系统、数据库、云平台等 100+ 类系统的安全配置最佳实践。
            </p>
            <p style="color: var(--sc-text-secondary); font-size: var(--sc-font-size-sm); line-height: 1.6; margin-top: var(--sc-spacing-md);">
              选择多个框架可以全面评估组织的安全态势，但会增加扫描时间。建议从 CIS Benchmarks 开始，
              逐步扩展到其他框架。
            </p>
          </div>
        </div>
      </div>
    `;
  }

  private renderResults() {
    return html`
      <div class="card">
        <div class="card-header">
          <span class="card-title">扫描结果 (${this.scanResults.length} 项)</span>
          <div style="display: flex; gap: var(--sc-spacing-sm);">
            <sc-button variant="secondary">导出 CSV</sc-button>
            <sc-button variant="secondary">导出 PDF</sc-button>
          </div>
        </div>
        ${this.scanResults.length > 0 ? html`
          <table class="results-table">
            <thead>
              <tr>
                <th>控制项 ID</th>
                <th>名称</th>
                <th>状态</th>
                <th>类别</th>
                <th>框架</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              ${this.scanResults.map(r => html`
                <tr>
                  <td><code style="background: var(--sc-bg-tertiary); padding: 2px 6px; border-radius: 4px;">${r.control}</code></td>
                  <td>${r.title}</td>
                  <td><span class="status-badge ${r.status}">${r.status === 'pass' ? '✓ 通过' : r.status === 'fail' ? '✗ 失败' : '⚠ 警告'}</span></td>
                  <td>${r.category}</td>
                  <td>${r.framework}</td>
                  <td>
                    <sc-button variant="secondary" style="padding: 4px 8px; font-size: 12px;">
                      ${r.status === 'fail' ? '修复' : '详情'}
                    </sc-button>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        ` : html`
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <div class="empty-title">暂无扫描结果</div>
            <div class="empty-desc">运行基线扫描以查看详细结果</div>
          </div>
        `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sc-tool-baseline-v2': ScToolBaselineV2; }
}

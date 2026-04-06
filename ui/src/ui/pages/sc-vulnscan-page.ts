import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { gatewayClient } from '../gateway-client.js';

/**
 * Vulnerability Scan Page - Professional Design
 * 🔍 Security Technology (Orange/Yellow Theme)
 */
@customElement('sc-vulnscan-page')
export class ScVulnScanPage extends LitElement {
  @state() private activeTab = 'overview';
  @state() private isScanning = false;
  @state() private progress = 0;
  @state() private severityFilter = 'all';
  @state() private loading = true;
  @state() private vulnerabilities: Array<{
    id: string; name: string; severity: string; status: string; cvss: number; asset: string;
  }> = [];
  @state() private scanTaskId: string | null = null;
  @state() private scanTasks: any[] = [];

  static styles = css`
    :host {
      --vln-primary: #F59E0B;
      --vln-primary-dark: #D97706;
      --vln-success: #10B981;
      --vln-warning: #F59E0B;
      --vln-danger: #EF4444;
      --vln-info: #3B82F6;
      --vln-bg: var(--sc-bg-primary, #0f172a);
      --vln-bg-card: var(--sc-bg-card, #1e293b);
      --vln-bg-tertiary: var(--sc-bg-tertiary, #334155);
      --vln-bg-hover: var(--sc-bg-hover, #475569);
      --vln-text-primary: var(--sc-text-primary, #f8fafc);
      --vln-text-secondary: var(--sc-text-secondary, #cbd5e1);
      --vln-text-tertiary: var(--sc-text-tertiary, #94a3b8);
      --vln-border: var(--sc-border-color, #334155);
      --vln-radius-sm: 6px;
      --vln-radius-md: 10px;
      --vln-radius-lg: 16px;
      --vln-transition: 200ms ease;
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      color: var(--vln-text-primary);
      background: var(--vln-bg);
      min-height: 100vh;
    }

    .page-container { max-width: 1600px; margin: 0 auto; padding: 24px; }

    /* Hero */
    .hero { display: flex; gap: 32px; align-items: flex-start; padding: 40px; background: linear-gradient(135deg, var(--vln-bg-card) 0%, var(--vln-bg-tertiary) 100%); border: 1px solid var(--vln-border); border-radius: var(--vln-radius-lg); margin-bottom: 32px; position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; top: -50%; right: -5%; width: 350px; height: 350px; background: radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%); pointer-events: none; }
    .hero-icon { width: 80px; height: 80px; background: linear-gradient(135deg, var(--vln-primary) 0%, var(--vln-primary-dark) 100%); border-radius: var(--vln-radius-md); display: flex; align-items: center; justify-content: center; font-size: 40px; flex-shrink: 0; box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3); }
    .hero-content { flex: 1; position: relative; z-index: 1; }
    .hero-title { font-size: 32px; font-weight: 700; margin: 0 0 8px; }
    .hero-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: rgba(245, 158, 11, 0.15); color: var(--vln-primary); border-radius: 20px; font-size: 13px; font-weight: 500; margin-bottom: 16px; }
    .hero-desc { font-size: 15px; line-height: 1.7; color: var(--vln-text-secondary); margin: 0; max-width: 600px; }
    .hero-stats { display: flex; gap: 24px; }
    .hero-stat { text-align: center; padding: 16px 24px; background: var(--vln-bg-card); border-radius: var(--vln-radius-md); min-width: 100px; }
    .hero-stat-value { font-size: 28px; font-weight: 700; color: var(--vln-primary); }
    .hero-stat-label { font-size: 12px; color: var(--vln-text-tertiary); margin-top: 4px; }

    /* Metrics Grid */
    .metrics-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 32px; }
    .metric-card { background: var(--vln-bg-card); border: 1px solid var(--vln-border); border-radius: var(--vln-radius-md); padding: 24px; position: relative; overflow: hidden; transition: all var(--vln-transition); }
    .metric-card:hover { border-color: var(--vln-primary); transform: translateY(-2px); }
    .metric-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
    .metric-card.critical::before { background: linear-gradient(90deg, #EF4444, #F87171); }
    .metric-card.high::before { background: linear-gradient(90deg, #F97316, #FB923C); }
    .metric-card.medium::before { background: linear-gradient(90deg, #F59E0B, #FBBF24); }
    .metric-card.low::before { background: linear-gradient(90deg, #10B981, #34D399); }
    .metric-card.total::before { background: linear-gradient(90deg, #3B82F6, #60A5FA); }
    .metric-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .metric-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .metric-card.critical .metric-icon { background: rgba(239, 68, 68, 0.15); }
    .metric-card.high .metric-icon { background: rgba(249, 115, 22, 0.15); }
    .metric-card.medium .metric-icon { background: rgba(245, 158, 11, 0.15); }
    .metric-card.low .metric-icon { background: rgba(16, 185, 129, 0.15); }
    .metric-card.total .metric-icon { background: rgba(59, 130, 246, 0.15); }
    .metric-value { font-size: 32px; font-weight: 700; color: var(--vln-text-primary); }
    .metric-label { font-size: 13px; color: var(--vln-text-secondary); margin-top: 4px; }

    /* Tabs */
    .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--vln-border); margin-bottom: 24px; }
    .tab { padding: 14px 20px; font-size: 14px; font-weight: 500; color: var(--vln-text-secondary); background: none; border: none; cursor: pointer; position: relative; transition: all var(--vln-transition); }
    .tab:hover { color: var(--vln-text-primary); }
    .tab.active { color: var(--vln-primary); }
    .tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: var(--vln-primary); }

    /* Content Grid */
    .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
    @media (max-width: 1024px) { .content-grid { grid-template-columns: 1fr; } }

    /* Cards */
    .card { background: var(--vln-bg-card); border: 1px solid var(--vln-border); border-radius: var(--vln-radius-lg); overflow: hidden; }
    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid var(--vln-border); background: var(--vln-bg-tertiary); }
    .card-title { font-size: 15px; font-weight: 600; }
    .card-body { padding: 24px; }

    /* Table */
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 600; color: var(--vln-text-tertiary); background: var(--vln-bg-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }
    .data-table td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid var(--vln-border); }
    .data-table tbody tr:hover td { background: var(--vln-bg-hover); }

    /* Severity Badge */
    .severity-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .severity-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .severity-critical { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
    .severity-high { background: rgba(249, 115, 22, 0.15); color: #F97316; }
    .severity-medium { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
    .severity-low { background: rgba(16, 185, 129, 0.15); color: #10B981; }

    /* Status Badge */
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .status-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .status-open { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
    .status-fixed { background: rgba(16, 185, 129, 0.15); color: #10B981; }
    .status-pending { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }

    /* Buttons */
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; font-size: 14px; font-weight: 500; border-radius: var(--vln-radius-sm); border: none; cursor: pointer; transition: all var(--vln-transition); }
    .btn-primary { background: linear-gradient(135deg, var(--vln-primary) 0%, var(--vln-primary-dark) 100%); color: white; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: var(--vln-bg-tertiary); color: var(--vln-text-primary); border: 1px solid var(--vln-border); }
    .btn-secondary:hover { background: var(--vln-bg-hover); }

    /* Filter Pills */
    .filter-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .filter-pill { padding: 6px 14px; font-size: 12px; font-weight: 500; border-radius: 20px; border: 1px solid var(--vln-border); background: var(--vln-bg-card); color: var(--vln-text-secondary); cursor: pointer; transition: all var(--vln-transition); }
    .filter-pill:hover { border-color: var(--vln-primary); color: var(--vln-text-primary); }
    .filter-pill.active { background: rgba(245, 158, 11, 0.15); border-color: var(--vln-primary); color: var(--vln-primary); }

    /* Progress */
    .progress-section { margin-top: 16px; }
    .progress-bar { height: 8px; background: var(--vln-bg-tertiary); border-radius: 10px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 10px; background: linear-gradient(90deg, #F59E0B, #FBBF24); transition: width 0.3s ease; }

    /* Sidebar List */
    .sidebar-list { list-style: none; padding: 0; margin: 0; }
    .sidebar-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--vln-radius-sm); margin-bottom: 4px; cursor: pointer; transition: all var(--vln-transition); color: var(--vln-text-secondary); border: 1px solid transparent; }
    .sidebar-item:hover { background: var(--vln-bg-hover); color: var(--vln-text-primary); }
    .sidebar-item-icon { font-size: 16px; }
    .sidebar-item-content { flex: 1; }
    .sidebar-item-title { font-weight: 500; }
    .sidebar-item-meta { font-size: 11px; color: var(--vln-text-tertiary); margin-top: 2px; }

    code { background: var(--vln-bg-tertiary); padding: 2px 6px; border-radius: 4px; font-size: 12px; }

    @media (max-width: 768px) {
      .page-container { padding: 16px; }
      .hero { flex-direction: column; padding: 24px; }
      .metrics-grid { grid-template-columns: repeat(2, 1fr); }
      .hero-stats { flex-direction: column; width: 100%; }
    }
  `;

  private readonly fallbackVulnerabilities = [
    { id: 'CVE-2024-1234', name: 'Apache Log4j RCE漏洞', severity: 'critical', status: 'open', cvss: 9.8, asset: 'prod-web-01' },
    { id: 'CVE-2024-5678', name: 'OpenSSL缓冲区溢出', severity: 'high', status: 'open', cvss: 8.2, asset: 'api-gateway' },
    { id: 'CVE-2024-9012', name: 'SQL注入漏洞', severity: 'high', status: 'fixed', cvss: 7.5, asset: 'web-portal' },
    { id: 'CVE-2024-3456', name: 'XSS跨站脚本', severity: 'medium', status: 'open', cvss: 6.1, asset: 'admin-console' },
    { id: 'CVE-2024-7890', name: 'CSRF令牌泄漏', severity: 'low', status: 'pending', cvss: 4.3, asset: 'user-portal' },
  ];

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
    this.loadScanHistory();
  }

  private async loadScanHistory() {
    try {
      const res = await gatewayClient.request('tools.listTasks', { toolId: 'port-scanner' });
      const data = (res as any)?.data ?? res;
      this.scanTasks = Array.isArray(data) ? [...data] : [];
    } catch {
      this.scanTasks = [];
    }
  }

  private async loadData() {
    this.loading = true;
    try {
      const res = await gatewayClient.request('vulnerabilities.list', {});
      const data = Array.isArray(res) ? res : (res as any)?.data;
      if (Array.isArray(data) && data.length > 0) {
        this.vulnerabilities = data.map((v: any) => ({
          id: v.info?.cveId ?? v.id ?? v.cveId ?? '',
          name: v.info?.title ?? v.title ?? '',
          severity: v.info?.cvss?.severity ?? v.severity ?? 'medium',
          status: v.remediation?.status ?? v.status ?? 'open',
          cvss: v.info?.cvss?.score ?? v.cvss ?? 0,
          asset: v.affectedAssets?.[0]?.assetId ?? v.asset ?? '',
        }));
      } else {
        this.vulnerabilities = [...this.fallbackVulnerabilities];
      }
    } catch {
      this.vulnerabilities = [...this.fallbackVulnerabilities];
    } finally {
      this.loading = false;
    }
  }

  private handleTab(tab: string) { this.activeTab = tab; }
  private setSeverityFilter(severity: string) { this.severityFilter = severity; }

  private async runScan() {
    this.isScanning = true;
    this.progress = 0;
    try {
      const res = await gatewayClient.request('tools.createTask', { toolId: 'port-scanner', target: 'localhost', config: {} });
      this.scanTaskId = (res as any)?.taskId ?? (res as any)?.id ?? null;
      if (this.scanTaskId) {
        this.pollScanStatus(this.scanTaskId);
      } else {
        for (let i = 0; i <= 100; i += 5) {
          await new Promise(r => setTimeout(r, 80));
          this.progress = i;
        }
        this.isScanning = false;
        this.loadData();
      }
    } catch {
      for (let i = 0; i <= 100; i += 5) {
        await new Promise(r => setTimeout(r, 80));
        this.progress = i;
      }
      this.isScanning = false;
      this.loadData();
    }
  }

  private async pollScanStatus(taskId: string) {
    try {
      const res = await gatewayClient.request('tools.getTask', { taskId });
      const task = res as any;
      this.progress = task?.progress ?? task?.percent ?? this.progress + 10;
      if (task?.status === 'running' || task?.status === 'pending') {
        setTimeout(() => this.pollScanStatus(taskId), 2000);
      } else {
        this.isScanning = false;
        if (task?.status === 'completed') {
          try {
            const findings = await gatewayClient.request('tools.getFindings', { taskId });
            const data = (findings as any)?.data ?? findings;
            if (Array.isArray(data) && data.length > 0) {
              this.vulnerabilities = [...this.vulnerabilities, ...data.map((v: any) => ({
                id: v.cveId ?? v.id ?? '', name: v.title ?? v.name ?? '',
                severity: v.severity ?? 'medium', status: 'open',
                cvss: v.cvss ?? 0, asset: v.asset ?? '',
              }))];
            }
          } catch {}
        }
        this.loadData();
      }
    } catch {
      this.isScanning = false;
    }
  }

  private async cancelScan() {
    if (!this.scanTaskId) return;
    try {
      await gatewayClient.request('tools.cancelTask', { taskId: this.scanTaskId });
      this.isScanning = false;
      this.scanTaskId = null;
    } catch (e) {
      console.error('[vulnscan] Cancel failed:', e);
    }
  }

  render() {
    if (this.loading) {
      return html`<div style="text-align:center;padding:4rem;"><div style="font-size:48px;margin-bottom:16px;">⏳</div><div style="color:var(--vln-text-secondary);">加载中...</div></div>`;
    }
    const filtered = this.severityFilter === 'all' ? this.vulnerabilities : this.vulnerabilities.filter(v => v.severity === this.severityFilter);
    const criticalCount = this.vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = this.vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumCount = this.vulnerabilities.filter(v => v.severity === 'medium').length;
    const lowCount = this.vulnerabilities.filter(v => v.severity === 'low').length;

    return html`
      <div class="page-container">
        <div class="hero">
          <div class="hero-icon">🔍</div>
          <div class="hero-content">
            <h1 class="hero-title">漏洞扫描</h1>
            <span class="hero-badge">🔒 安全技术</span>
            <p class="hero-desc">全面扫描网络、主机、应用漏洞，基于 CVSS/AI 风险评分优先处理高危漏洞。支持 CVE 数据库同步和自动化修复建议。</p>
          </div>
          <div class="hero-stats">
            <div class="hero-stat"><div class="hero-stat-value">${this.vulnerabilities.length}</div><div class="hero-stat-label">总漏洞数</div></div>
            <div class="hero-stat"><div class="hero-stat-value">68</div><div class="hero-stat-label">受控资产</div></div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card critical">
            <div class="metric-header"><div class="metric-icon">🔴</div></div>
            <div class="metric-value">${criticalCount}</div>
            <div class="metric-label">Critical</div>
          </div>
          <div class="metric-card high">
            <div class="metric-header"><div class="metric-icon">🟠</div></div>
            <div class="metric-value">${highCount}</div>
            <div class="metric-label">High</div>
          </div>
          <div class="metric-card medium">
            <div class="metric-header"><div class="metric-icon">🟡</div></div>
            <div class="metric-value">${mediumCount}</div>
            <div class="metric-label">Medium</div>
          </div>
          <div class="metric-card low">
            <div class="metric-header"><div class="metric-icon">🟢</div></div>
            <div class="metric-value">${lowCount}</div>
            <div class="metric-label">Low</div>
          </div>
          <div class="metric-card total">
            <div class="metric-header"><div class="metric-icon">📊</div></div>
            <div class="metric-value">${this.vulnerabilities.length}</div>
            <div class="metric-label">总计</div>
          </div>
        </div>

        <div class="tabs">
          <button class="tab ${this.activeTab === 'overview' ? 'active' : ''}" @click=${() => this.handleTab('overview')}>📊 总览</button>
          <button class="tab ${this.activeTab === 'scan' ? 'active' : ''}" @click=${() => this.handleTab('scan')}>🚀 扫描</button>
          <button class="tab ${this.activeTab === 'assets' ? 'active' : ''}" @click=${() => this.handleTab('assets')}>💻 资产漏洞</button>
        </div>

        <div class="content-grid">
          <div class="card">
            <div class="card-header">
              <span class="card-title">${this.activeTab === 'overview' ? '🔍 漏洞列表' : this.activeTab === 'scan' ? '⚙️ 扫描配置' : '💻 资产漏洞'}</span>
            </div>
            <div class="card-body">
              ${this.activeTab === 'overview' || this.activeTab === 'assets' ? html`
                <div class="filter-pills">
                  <button class="filter-pill ${this.severityFilter === 'all' ? 'active' : ''}" @click=${() => this.setSeverityFilter('all')}>全部 (${this.vulnerabilities.length})</button>
                  <button class="filter-pill ${this.severityFilter === 'critical' ? 'active' : ''}" @click=${() => this.setSeverityFilter('critical')}>Critical (${criticalCount})</button>
                  <button class="filter-pill ${this.severityFilter === 'high' ? 'active' : ''}" @click=${() => this.setSeverityFilter('high')}>High (${highCount})</button>
                  <button class="filter-pill ${this.severityFilter === 'medium' ? 'active' : ''}" @click=${() => this.setSeverityFilter('medium')}>Medium (${mediumCount})</button>
                </div>
                <table class="data-table">
                  <thead><tr><th>CVE ID</th><th>漏洞名称</th><th>严重性</th><th>CVSS</th><th>状态</th><th>资产</th></tr></thead>
                  <tbody>
                    ${filtered.map(v => html`
                      <tr>
                        <td><code>${v.id}</code></td>
                        <td>${v.name}</td>
                        <td><span class="severity-badge severity-${v.severity}">${v.severity.toUpperCase()}</span></td>
                        <td><strong>${v.cvss}</strong></td>
                        <td><span class="status-badge status-${v.status}">${v.status === 'open' ? '○ 开放' : v.status === 'fixed' ? '✓ 已修复' : '⏳ 待处理'}</span></td>
                        <td>${v.asset}</td>
                      </tr>
                    `)}
                  </tbody>
                </table>
              ` : ''}
              ${this.activeTab === 'scan' ? html`
                <button class="btn btn-primary" style="width: 100%;" @click=${this.runScan} ?disabled=${this.isScanning}>
                  ${this.isScanning ? `扫描中... ${this.progress}%` : '🚀 立即扫描'}
                </button>
                ${this.isScanning ? html`<button class="btn btn-secondary" style="width:100%;margin-top:8px;" @click=${this.cancelScan}>✕ 取消扫描</button>` : ''}
                ${this.isScanning ? html`<div class="progress-section"><div class="progress-bar"><div class="progress-fill" style="width: ${this.progress}%"></div></div></div>` : ''}
                ${this.scanTasks.length > 0 ? html`
                  <div style="margin-top:16px;">
                    <strong style="font-size:13px;color:var(--vln-text-secondary);">扫描历史 (${this.scanTasks.length})</strong>
                    <ul style="list-style:none;padding:0;margin-top:8px;">
                      ${this.scanTasks.slice(0, 5).map((t: any) => html`
                        <li style="padding:8px;border-bottom:1px solid var(--vln-border);font-size:12px;color:var(--vln-text-secondary);">
                          ${(t.target ?? t.toolId ?? 'scan')} — ${t.status ?? 'unknown'} — ${t.createdAt ? new Date(t.createdAt).toLocaleString('zh-CN') : ''}
                        </li>
                      `)}
                    </ul>
                  </div>
                ` : ''}
              ` : ''}
            </div>
          </div>

          <div class="card">
            <div class="card-header"><span class="card-title">⚡ 快速操作</span></div>
            <div class="card-body">
              <ul class="sidebar-list">
                <li class="sidebar-item"><span class="sidebar-item-icon">🚀</span><div class="sidebar-item-content"><div class="sidebar-item-title">立即扫描</div></div></li>
                <li class="sidebar-item"><span class="sidebar-item-icon">📊</span><div class="sidebar-item-content"><div class="sidebar-item-title">导出报告</div></div></li>
                <li class="sidebar-item"><span class="sidebar-item-icon">🔄</span><div class="sidebar-item-content"><div class="sidebar-item-title">计划扫描</div></div></li>
                <li class="sidebar-item"><span class="sidebar-item-icon">⚙️</span><div class="sidebar-item-content"><div class="sidebar-item-title">扫描配置</div></div></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'sc-vulnscan-page': ScVulnScanPage; } }

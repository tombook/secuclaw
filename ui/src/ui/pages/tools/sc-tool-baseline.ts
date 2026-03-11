import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

/** Security Baseline Detection Tool Demo */
@customElement('sc-tool-baseline')
export class ScToolBaseline extends LitElement {
  @state() private activeTab = 'overview';
  @state() private scanResults: any[] = [];
  @state() private isScanning = false;

  static styles = css`
    :host { display: block; }
    .page-container { padding: var(--sc-spacing-xl); max-width: 1400px; margin: 0 auto; }
    .tool-header { display: flex; align-items: flex-start; gap: var(--sc-spacing-lg); margin-bottom: var(--sc-spacing-xl); padding-bottom: var(--sc-spacing-lg); border-bottom: 1px solid var(--sc-border-color); }
    .tool-icon { width: 64px; height: 64px; border-radius: var(--sc-radius-lg); display: flex; align-items: center; justify-content: center; font-size: 32px; flex-shrink: 0; }
    .tool-info { flex: 1; }
    .tool-name { font-size: var(--sc-font-size-2xl); font-weight: 600; color: var(--sc-text-primary); margin: 0; }
    .domain-badge { padding: 4px 12px; border-radius: var(--sc-radius-full); font-size: var(--sc-font-size-xs); font-weight: 500; }
    .tool-description { color: var(--sc-text-secondary); font-size: var(--sc-font-size-sm); margin: var(--sc-spacing-xs) 0 0; line-height: 1.6; }
    .coverage-section { display: flex; flex-wrap: wrap; gap: var(--sc-spacing-md); margin-top: var(--sc-spacing-md); }
    .coverage-group { display: flex; flex-wrap: wrap; gap: var(--sc-spacing-xs); align-items: center; }
    .coverage-label { font-size: var(--sc-font-size-xs); color: var(--sc-text-tertiary); font-weight: 500; }
    .coverage-tag { padding: 2px 8px; border-radius: var(--sc-radius-sm); font-size: var(--sc-font-size-xs); }
    .mitre-tag { background: var(--sc-error-bg); color: var(--sc-error); }
    .scf-tag { background: var(--sc-primary-bg); color: var(--sc-primary); }
    .roles-section { display: flex; gap: var(--sc-spacing-lg); margin-top: var(--sc-spacing-md); }
    .role-group { display: flex; align-items: center; gap: var(--sc-spacing-xs); }
    .role-label { font-size: var(--sc-font-size-xs); color: var(--sc-text-tertiary); }
    .role-tag { padding: 2px 8px; border-radius: var(--sc-radius-sm); font-size: var(--sc-font-size-xs); background: var(--sc-bg-tertiary); color: var(--sc-text-secondary); }
    .role-tag.owner { background: var(--sc-primary-bg); color: var(--sc-primary); }
    .tabs-container { display: flex; gap: var(--sc-spacing-xs); border-bottom: 1px solid var(--sc-border-color); margin-bottom: var(--sc-spacing-lg); }
    .tab { padding: var(--sc-spacing-sm) var(--sc-spacing-lg); font-size: var(--sc-font-size-sm); font-weight: 500; color: var(--sc-text-secondary); cursor: pointer; border-bottom: 2px solid transparent; transition: all var(--sc-transition-fast); background: none; border: none; }
    .tab:hover { color: var(--sc-text-primary); background: var(--sc-bg-tertiary); }
    .tab.active { color: var(--sc-primary); border-bottom-color: var(--sc-primary); }
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--sc-spacing-md); margin-bottom: var(--sc-spacing-lg); }
    .metric-card { background: var(--sc-bg-card); border: 1px solid var(--sc-border-color); border-radius: var(--sc-radius-md); padding: var(--sc-spacing-lg); text-align: center; }
    .metric-value { font-size: var(--sc-font-size-2xl); font-weight: 600; color: var(--sc-text-primary); }
    .metric-label { font-size: var(--sc-font-size-xs); color: var(--sc-text-tertiary); margin-top: var(--sc-spacing-xs); }
    .metric-pass { color: var(--sc-success); }
    .metric-fail { color: var(--sc-error); }
    .overview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--sc-spacing-lg); }
    .overview-card { background: var(--sc-bg-card); border: 1px solid var(--sc-border-color); border-radius: var(--sc-radius-lg); padding: var(--sc-spacing-lg); }
    .overview-card h3 { font-size: var(--sc-font-size-md); font-weight: 600; color: var(--sc-text-primary); margin: 0 0 var(--sc-spacing-md); }
    .form-group { margin-bottom: var(--sc-spacing-md); }
    .form-label { display: block; font-size: var(--sc-font-size-sm); font-weight: 500; color: var(--sc-text-primary); margin-bottom: var(--sc-spacing-xs); }
    .form-input, .form-select { width: 100%; padding: var(--sc-spacing-sm) var(--sc-spacing-md); border: 1px solid var(--sc-border-color); border-radius: var(--sc-radius-md); background: var(--sc-input-bg); color: var(--sc-text-primary); font-size: var(--sc-font-size-sm); }
    .btn { padding: var(--sc-spacing-sm) var(--sc-spacing-lg); border: none; border-radius: var(--sc-radius-md); font-size: var(--sc-font-size-sm); font-weight: 500; cursor: pointer; transition: all var(--sc-transition-fast); }
    .btn-primary { background: var(--sc-primary); color: white; }
    .btn-primary:hover { background: var(--sc-primary-hover); }
    .results-table { width: 100%; border-collapse: collapse; font-size: var(--sc-font-size-sm); }
    .results-table th, .results-table td { padding: var(--sc-spacing-sm) var(--sc-spacing-md); text-align: left; border-bottom: 1px solid var(--sc-border-color); }
    .results-table th { background: var(--sc-bg-tertiary); font-weight: 600; color: var(--sc-text-primary); }
    .status-badge { padding: 2px 8px; border-radius: var(--sc-radius-sm); font-size: var(--sc-font-size-xs); font-weight: 500; }
    .status-pass { background: var(--sc-success-bg); color: var(--sc-success); }
    .status-fail { background: var(--sc-error-bg); color: var(--sc-error); }
    .status-warn { background: var(--sc-warning-bg); color: var(--sc-warning); }
    .empty-state { text-align: center; padding: var(--sc-spacing-2xl); color: var(--sc-text-tertiary); }
  `;

  private handleTabClick(tab: string) { this.activeTab = tab; }

  private async runScan() {
    this.isScanning = true;
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.scanResults = [
      { id: 1, control: 'CIS-1.1', status: 'pass', category: 'Identity' },
      { id: 2, control: 'CIS-1.2', status: 'pass', category: 'Identity' },
      { id: 3, control: 'CIS-2.1', status: 'fail', category: 'Identity' },
      { id: 4, control: 'CIS-3.1', status: 'pass', category: 'Logging' },
    ];
    this.isScanning = false;
  }

  render() {
    return html`
      <div class="page-container">
        ${this.renderHeader()}
        ${this.renderTabs()}
        ${this.renderTabContent()}
      </div>
    `;
  }

  private renderHeader() {
    return html`
      <div class="tool-header">
        <div class="tool-icon" style="background: #10B98120">🛡️</div>
        <div class="tool-info">
          <h1 class="tool-name">安全基线检测</h1>
          <span class="domain-badge" style="background: #10B98120; color: #10B981">光明面</span>
          <p class="tool-description">按资产域自动检测CIS/云/容器/终端安全基线，生成整改任务，跟踪闭环率</p>
          <div class="coverage-section">
            <div class="coverage-group">
              <span class="coverage-label">MITRE:</span>
              <span class="coverage-tag mitre-tag">TA0005</span>
            </div>
            <div class="coverage-group">
              <span class="coverage-label">SCF:</span>
              <span class="coverage-tag scf-tag">CM</span>
            </div>
          </div>
          <div class="roles-section">
            <div class="role-group">
              <span class="role-label">Owner:</span>
              <span class="role-tag owner">安全专家</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderTabs() {
    const tabs = ['overview', 'demo', 'config', 'results'];
    const labels = { overview: 'Overview', demo: 'Baseline Scan', config: 'Frameworks', results: 'Results' };
    return html`
      <div class="tabs-container">
        ${tabs.map(tab => html`
          <button class="tab ${this.activeTab === tab ? 'active' : ''}" @click=${() => this.handleTabClick(tab)}>
            ${labels[tab as keyof typeof labels]}
          </button>
        `)}
      </div>
    `;
  }

  private renderTabContent() {
    const pass = this.scanResults.filter(r => r.status === 'pass').length;
    const fail = this.scanResults.filter(r => r.status === 'fail').length;
    const rate = this.scanResults.length > 0 ? Math.round((pass / this.scanResults.length) * 100) : 85;

    if (this.activeTab === 'overview') return html`
      <div class="metrics-grid">
        <div class="metric-card"><div class="metric-value metric-pass">${pass || 8}</div><div class="metric-label">Passed</div></div>
        <div class="metric-card"><div class="metric-value metric-fail">${fail || 4}</div><div class="metric-label">Failed</div></div>
        <div class="metric-card"><div class="metric-value">${rate}%</div><div class="metric-label">Compliance</div></div>
      </div>
      <div class="overview-grid">
        <div class="overview-card"><h3>Description</h3><p style="color:var(--sc-text-secondary)">自动扫描基础设施的安全基线，识别偏离安全配置的项。</p></div>
        <div class="overview-card"><h3>Supported</h3><p style="color:var(--sc-text-secondary)">CIS, NIST, AWS Well-Architected, Azure Security Benchmark</p></div>
      </div>
    `;

    if (this.activeTab === 'demo') return html`
      <div class="overview-grid">
        <div class="overview-card">
          <h3>Scan Configuration</h3>
          <div class="form-group">
            <label class="form-label">Asset Scope</label>
            <select class="form-select">
              <option>All Assets</option>
              <option>Cloud Only</option>
            </select>
          </div>
          <button class="btn btn-primary" @click=${this.runScan} ?disabled=${this.isScanning}>
            ${this.isScanning ? 'Scanning...' : 'Run Baseline Scan'}
          </button>
        </div>
        <div class="overview-card">
          <h3>Results</h3>
          ${this.scanResults.length > 0 ? html`
            <table class="results-table">
              <thead><tr><th>Control</th><th>Status</th><th>Category</th></tr></thead>
              <tbody>
                ${this.scanResults.map(r => html`
                  <tr><td>${r.control}</td><td><span class="status-badge status-${r.status}">${r.status.toUpperCase()}</span></td><td>${r.category}</td></tr>
                `)}
              </tbody>
            </table>
          ` : html`<div class="empty-state"><p>Run scan to see results</p></div>`}
        </div>
      </div>
    `;

    return html`<div class="overview-card"><h3>${this.activeTab}</h3><p style="color:var(--sc-text-secondary)">Configuration and results tabs coming soon.</p></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sc-tool-baseline': ScToolBaseline; }
}

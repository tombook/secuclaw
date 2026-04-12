import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../../components/design-system/sc-button.js';
import '../../components/sc-smart-recommendation-bar.js';

/**
 * Professional Security Tools Library
 * Unified component for Baseline, Vuln Scan, Pentest, Threat Hunt
 */
@customElement('sc-security-tools')
export class ScSecurityTools extends LitElement {
  @state() private activeTool = 'baseline';
  @state() private activeTab = 'overview';
  @state() private isRunning = false;
  @state() private progress = 0;

  static styles = css`
    :host { display: block; }
    
    .page-container { 
      padding: var(--sc-spacing-xl); 
      max-width: 1600px; 
      margin: 0 auto; 
    }

    /* === Tool Selector === */
    .tool-selector {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--sc-spacing-md);
      margin-bottom: var(--sc-spacing-xl);
    }

    .tool-card {
      background: var(--sc-bg-card);
      border: 2px solid var(--sc-border-color);
      border-radius: var(--sc-radius-lg);
      padding: var(--sc-spacing-lg);
      cursor: pointer;
      transition: all var(--sc-transition-normal);
      text-align: center;
    }

    .tool-card:hover {
      border-color: var(--sc-primary);
      transform: translateY(-4px);
      box-shadow: var(--sc-shadow-lg);
    }

    .tool-card.active {
      border-color: var(--sc-primary);
      background: linear-gradient(135deg, var(--sc-bg-card) 0%, rgba(59, 130, 246, 0.1) 100%);
    }

    .tool-card.light { --tool-color: #10B981; }
    .tool-card.dark { --tool-color: #EF4444; }
    .tool-card.security { --tool-color: #3B82F6; }
    .tool-card.legal { --tool-color: #8B5CF6; }

    .tool-card::before {
      content: '';
      display: block;
      width: 48px;
      height: 48px;
      margin: 0 auto var(--sc-spacing-md);
      border-radius: var(--sc-radius-md);
      background: rgba(var(--tool-color), 0.15);
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tool-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto var(--sc-spacing-md);
      border-radius: var(--sc-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .tool-card.light .tool-icon { background: rgba(16, 185, 129, 0.15); }
    .tool-card.dark .tool-icon { background: rgba(239, 68, 68, 0.15); }
    .tool-card.security .tool-icon { background: rgba(59, 130, 246, 0.15); }
    .tool-card.legal .tool-icon { background: rgba(139, 92, 246, 0.15); }

    .tool-name {
      font-size: var(--sc-font-size-md);
      font-weight: 600;
      color: var(--sc-text-primary);
      margin-bottom: var(--sc-spacing-xs);
    }

    .tool-desc {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-tertiary);
      line-height: 1.4;
    }

    .tool-domain {
      display: inline-block;
      margin-top: var(--sc-spacing-sm);
      padding: 2px 8px;
      border-radius: var(--sc-radius-full);
      font-size: 10px;
      font-weight: 500;
    }

    .tool-card.light .tool-domain { background: rgba(16, 185, 129, 0.15); color: #10B981; }
    .tool-card.dark .tool-domain { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
    .tool-card.security .tool-domain { background: rgba(59, 130, 246, 0.15); color: #3B82F6; }
    .tool-card.legal .tool-domain { background: rgba(139, 92, 246, 0.15); color: #8B5CF6; }

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
      top: -50%;
      right: -10%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
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
      width: 80px;
      height: 80px;
      border-radius: var(--sc-radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      flex-shrink: 0;
    }

    .hero-icon.baseline { background: linear-gradient(135deg, #10B981 0%, #059669 100%); }
    .hero-icon.vulnscan { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); }
    .hero-icon.pentest { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); }
    .hero-icon.threathunt { background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); }

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
      border-radius: var(--sc-radius-full);
      font-size: var(--sc-font-size-xs);
      font-weight: 500;
      margin-bottom: var(--sc-spacing-md);
    }

    .hero-domain.light { background: rgba(16, 185, 129, 0.15); color: #10B981; }
    .hero-domain.dark { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
    .hero-domain.security { background: rgba(59, 130, 246, 0.15); color: #3B82F6; }

    .hero-description {
      color: var(--sc-text-secondary);
      font-size: var(--sc-font-size-sm);
      line-height: 1.6;
      margin: 0;
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
    .metric-card.purple::before { background: linear-gradient(90deg, #8B5CF6, #A78BFA); }

    .metric-card:hover {
      border-color: var(--sc-primary);
      transform: translateY(-2px);
    }

    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-sm);
    }

    .metric-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--sc-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .metric-card.green .metric-icon { background: rgba(16, 185, 129, 0.15); }
    .metric-card.red .metric-icon { background: rgba(239, 68, 68, 0.15); }
    .metric-card.yellow .metric-icon { background: rgba(245, 158, 11, 0.15); }
    .metric-card.blue .metric-icon { background: rgba(59, 130, 246, 0.15); }
    .metric-card.purple .metric-icon { background: rgba(139, 92, 246, 0.15); }

    .metric-value {
      font-size: var(--sc-font-size-2xl);
      font-weight: 700;
      color: var(--sc-text-primary);
    }

    .metric-label {
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-secondary);
      margin-top: var(--sc-spacing-xs);
    }

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
    .tab.active { color: var(--sc-primary); }

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
      grid-template-columns: 2fr 1fr;
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

    .results-table tr:hover td { background: var(--sc-bg-hover); }

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

    .status-badge.critical { background: color-mix(in srgb, var(--sc-danger, #EF4444) 15%, transparent); color: var(--sc-danger, #EF4444); }
    .status-badge.high { background: color-mix(in srgb, var(--sc-warning, #F97316) 15%, transparent); color: var(--sc-warning, #F97316); }
    .status-badge.medium { background: color-mix(in srgb, var(--sc-warning, #F59E0B) 15%, transparent); color: var(--sc-warning, #F59E0B); }
    .status-badge.low { background: color-mix(in srgb, var(--sc-success, #10B981) 15%, transparent); color: var(--sc-success, #10B981); }
    .status-badge.pass { background: color-mix(in srgb, var(--sc-success, #10B981) 15%, transparent); color: var(--sc-success, #10B981); }
    .status-badge.fail { background: color-mix(in srgb, var(--sc-danger, #EF4444) 15%, transparent); color: var(--sc-danger, #EF4444); }
    .status-badge.warn { background: color-mix(in srgb, var(--sc-warning, #F59E0B) 15%, transparent); color: var(--sc-warning, #F59E0B); }

    .status-badge::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
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
      background: linear-gradient(135deg, var(--sc-primary) 0%, #2563EB 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .btn-primary:hover { transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    .btn-secondary {
      background: var(--sc-bg-tertiary);
      color: var(--sc-text-primary);
      border: 1px solid var(--sc-border-color);
    }

    .btn-secondary:hover { background: var(--sc-bg-hover); }

    /* === Form Elements === */
    .form-group { margin-bottom: var(--sc-spacing-md); }
    
    .form-label {
      display: block;
      font-size: var(--sc-font-size-sm);
      font-weight: 500;
      color: var(--sc-text-primary);
      margin-bottom: var(--sc-spacing-xs);
    }

    .form-select, .form-input {
      width: 100%;
      padding: var(--sc-spacing-sm) var(--sc-spacing-md);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      background: var(--sc-input-bg);
      color: var(--sc-text-primary);
      font-size: var(--sc-font-size-sm);
    }

    .form-select:focus, .form-input:focus {
      outline: none;
      border-color: var(--sc-primary);
    }

    /* === Progress Bar === */
    .progress-section { margin-top: var(--sc-spacing-lg); }

    .progress-bar {
      height: 8px;
      background: var(--sc-bg-tertiary);
      border-radius: var(--sc-radius-full);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: var(--sc-radius-full);
      transition: width 0.3s ease;
    }

    .progress-fill.green { background: linear-gradient(90deg, #10B981, #34D399); }
    .progress-fill.red { background: linear-gradient(90deg, #EF4444, #F87171); }
    .progress-fill.yellow { background: linear-gradient(90deg, #F59E0B, #FBBF24); }

    .progress-text {
      text-align: center;
      margin-top: var(--sc-spacing-xs);
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-secondary);
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
    .sidebar-list { list-style: none; padding: 0; margin: 0; }

    .sidebar-item {
      padding: var(--sc-spacing-md);
      border-radius: var(--sc-radius-md);
      margin-bottom: var(--sc-spacing-xs);
      cursor: pointer;
      transition: all var(--sc-transition-fast);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm);
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-secondary);
      border: 1px solid transparent;
    }

    .sidebar-item:hover {
      background: var(--sc-bg-hover);
      color: var(--sc-text-primary);
    }

    .sidebar-item-icon { font-size: 16px; }

    /* === Coverage Tags === */
    .coverage-section {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sc-spacing-sm);
      margin-top: var(--sc-spacing-md);
    }

    .coverage-tag {
      padding: 4px 10px;
      border-radius: var(--sc-radius-sm);
      font-size: var(--sc-font-size-xs);
      font-weight: 500;
    }

    .coverage-tag.mitre { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
    .coverage-tag.scf { background: rgba(59, 130, 246, 0.15); color: #3B82F6; }

    @media (max-width: 1200px) {
      .tool-selector { grid-template-columns: repeat(2, 1fr); }
      .content-grid { grid-template-columns: 1fr; }
      .metric-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 768px) {
      .metric-grid { grid-template-columns: 1fr; }
    }
  `;

  private tools = [
    { id: 'baseline', name: '基线检查', desc: 'CIS/NIST/云平台安全配置检测', domain: 'light', icon: '🛡️' },
    { id: 'vulnscan', name: '漏洞扫描', desc: '自动化漏洞检测与风险评估', domain: 'security', icon: '🔍' },
    { id: 'pentest', name: '渗透测试', desc: '红队攻防演练与漏洞验证', domain: 'dark', icon: '⚔️' },
    { id: 'threathunt', name: '威胁狩猎', desc: '主动发现潜伏的高级威胁', domain: 'dark', icon: '🎯' },
  ];

  private toolConfig: Record<string, any> = {
    baseline: {
      title: '安全基线检测',
      description: '按资产域自动检测 CIS/云/容器/终端安全基线，生成整改任务，跟踪闭环率。',
      domain: 'light',
      domainLabel: '光明面 · 防御',
      icon: '🛡️',
      mitre: ['TA0005 Defense Evasion'],
      scf: ['CM-1 Configuration Management'],
      stats: { total: 156, assets: 68, frameworks: 6 },
      metrics: [
        { label: '通过项', value: 48, trend: '+2', color: 'green', icon: '✓' },
        { label: '失败项', value: 12, trend: '-1', color: 'red', icon: '✗' },
        { label: '警告项', value: 8, color: 'yellow', icon: '⚠' },
        { label: '合规率', value: '85%', trend: '+5%', color: 'blue', icon: '📊' },
      ],
    },
    vulnscan: {
      title: '漏洞扫描',
      description: '全面扫描网络、主机、应用漏洞，基于 CVSS/AI 风险评分优先处理高危漏洞。',
      domain: 'security',
      domainLabel: '安全技术',
      icon: '🔍',
      mitre: ['TA0001 Initial Access', 'TA0004 Privilege Escalation'],
      scf: ['RA-1 Security Assessment'],
      stats: { total: 1247, assets: 68, critical: 23 },
      metrics: [
        { label: 'Critical', value: 23, color: 'red', icon: '🔴' },
        { label: 'High', value: 87, color: 'yellow', icon: '🟡' },
        { label: 'Medium', value: 234, color: 'blue', icon: '🔵' },
        { label: 'Low', value: 903, color: 'green', icon: '🟢' },
      ],
    },
    pentest: {
      title: '渗透测试',
      description: '模拟真实攻击场景，验证安全防护能力，发现潜在攻击路径与漏洞利用链。',
      domain: 'dark',
      domainLabel: '黑暗面 · 攻击',
      icon: '⚔️',
      mitre: ['TA0001 Initial Access', 'TA0002 Execution', 'TA0003 Persistence'],
      scf: ['CA-8 Penetration Testing'],
      stats: { total: 15, findings: 42, critical: 8 },
      metrics: [
        { label: '测试任务', value: 15, color: 'purple', icon: '📋' },
        { label: '发现漏洞', value: 42, color: 'red', icon: '🔍' },
        { label: 'Critical', value: 8, color: 'red', icon: '🔴' },
        { label: '中危', value: 24, color: 'yellow', icon: '🟡' },
      ],
    },
    threathunt: {
      title: '威胁狩猎',
      description: '基于 MITRE ATT&CK 框架，主动搜寻网络中潜伏的高级持续性威胁(APT)。',
      domain: 'dark',
      domainLabel: '黑暗面 · 攻击',
      icon: '🎯',
      mitre: ['TA0011 Command and Control', 'TA0004 Defense Evasion'],
      scf: ['SI-4 Threat Detection'],
      stats: { iocs: 156, suspicius: 12, confirmed: 3 },
      metrics: [
        { label: 'IOCs', value: 156, color: 'purple', icon: '🔍' },
        { label: '可疑活动', value: 12, color: 'yellow', icon: '⚠' },
        { label: '已确认', value: 3, color: 'red', icon: '✓' },
        { label: '覆盖战术', value: '18/19', color: 'blue', icon: '📊' },
      ],
    },
  };

  private handleToolSelect(toolId: string) {
    this.activeTool = toolId;
    this.activeTab = 'overview';
    this.isRunning = false;
    this.progress = 0;
  }

  private handleTabClick(tab: string) { this.activeTab = tab; }

  private async runScan() {
    this.isRunning = true;
    this.progress = 0;
    
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 100));
      this.progress = i;
    }
    
    this.isRunning = false;
  }

  render() {
    const config = this.toolConfig[this.activeTool] || this.toolConfig.baseline;
    
    return html`
      <sc-smart-recommendation-bar></sc-smart-recommendation-bar>
      <div class="page-container">
        ${this.renderToolSelector()}
        ${this.renderHero(config)}
        ${this.renderMetrics(config)}
        ${this.renderTabs()}
        ${this.renderContent(config)}
      </div>
    `;
  }

  private renderToolSelector() {
    return html`
      <div class="tool-selector">
        ${this.tools.map(tool => html`
          <div 
            class="tool-card ${tool.domain} ${this.activeTool === tool.id ? 'active' : ''}"
            @click=${() => this.handleToolSelect(tool.id)}
          >
            <div class="tool-icon">${tool.icon}</div>
            <div class="tool-name">${tool.name}</div>
            <div class="tool-desc">${tool.desc}</div>
            <span class="tool-domain">${tool.domain === 'light' ? '☀️ 光明' : tool.domain === 'dark' ? '🌑 黑暗' : '🔒 安全'}</span>
          </div>
        `)}
      </div>
    `;
  }

  private renderHero(config: any) {
    return html`
      <div class="hero-section">
        <div class="hero-content">
          <div class="hero-icon ${this.activeTool}">${config.icon}</div>
          <div class="hero-info">
            <h1 class="hero-title">${config.title}</h1>
            <span class="hero-domain ${config.domain}">${config.domainLabel}</span>
            <p class="hero-description">${config.description}</p>
            <div class="coverage-section">
              <span style="font-size: var(--sc-font-size-xs); color: var(--sc-text-tertiary); margin-right: var(--sc-spacing-sm);">覆盖:</span>
              ${config.mitre.map((m: string) => html`<span class="coverage-tag mitre">${m}</span>`)}
              ${config.scf.map((s: string) => html`<span class="coverage-tag scf">${s}</span>`)}
            </div>
          </div>
          <div style="text-align: right; color: var(--sc-text-secondary); font-size: var(--sc-font-size-sm);">
            <div style="font-size: var(--sc-font-size-lg); font-weight: 600; color: var(--sc-text-primary);">${config.stats.total}</div>
            <div>总检测项</div>
          </div>
        </div>
      </div>
    `;
  }

  private renderMetrics(config: any) {
    return html`
      <div class="metric-grid">
        ${config.metrics.map((m: any) => html`
          <div class="metric-card ${m.color}">
            <div class="metric-header">
              <div class="metric-icon">${m.icon}</div>
              ${m.trend ? html`<span style="font-size: 11px; padding: 2px 6px; border-radius: 9999px; background: ${m.color === 'green' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${m.color === 'green' ? '#10B981' : '#EF4444'};">${m.trend}</span>` : ''}
            </div>
            <div class="metric-value">${m.value}</div>
            <div class="metric-label">${m.label}</div>
          </div>
        `)}
      </div>
    `;
  }

  private renderTabs() {
    const tabs = ['overview', 'scan', 'history', 'reports'];
    const labels: Record<string, string> = {
      overview: '📊 总览',
      scan: '🚀 ' + (this.activeTool === 'baseline' ? '扫描' : this.activeTool === 'vulnscan' ? '扫描' : this.activeTool === 'pentest' ? '测试' : '狩猎'),
      history: '📋 历史',
      reports: '📄 报告',
    };

    return html`
      <div class="tabs-container">
        ${tabs.map(tab => html`
          <button class="tab ${this.activeTab === tab ? 'active' : ''}" @click=${() => this.handleTabClick(tab)}>
            ${labels[tab]}
          </sc-button>
        `)}
      </div>
    `;
  }

  private renderContent(config: any) {
    return html`
      <div class="content-grid">
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              ${this.activeTab === 'overview' ? '检测结果' : ''}
              ${this.activeTab === 'scan' ? '扫描配置' : ''}
              ${this.activeTab === 'history' ? '扫描历史' : ''}
              ${this.activeTab === 'reports' ? '生成报告' : ''}
            </span>
            ${this.activeTab === 'overview' ? html`<sc-button variant="secondary">导出</sc-button>` : ''}
          </div>
          <div class="card-body">
            ${this.activeTab === 'overview' ? this.renderOverview(config) : ''}
            ${this.activeTab === 'scan' ? this.renderScan(config) : ''}
            ${this.activeTab === 'history' ? this.renderHistory() : ''}
            ${this.activeTab === 'reports' ? this.renderReports() : ''}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">快速操作</span>
          </div>
          <div class="card-body">
            <sc-button variant="primary" style="width: 100%; margin-bottom: var(--sc-spacing-md);" @click=${this.runScan} ?disabled=${this.isRunning}>
              ${this.isRunning ? `运行中... ${this.progress}%` : '🚀 立即执行'}
            </sc-button>

            ${this.isRunning ? html`
              <div class="progress-section">
                <div class="progress-bar">
                  <div class="progress-fill ${config.domain === 'dark' ? 'red' : 'green'}" style="width: ${this.progress}%"></div>
                </div>
              </div>
            ` : ''}

            <ul class="sidebar-list" style="margin-top: var(--sc-spacing-lg);">
              <li class="sidebar-item"><span class="sidebar-item-icon">📊</span> 导出报告</li>
              <li class="sidebar-item"><span class="sidebar-item-icon">📧</span> 发送通知</li>
              <li class="sidebar-item"><span class="sidebar-item-icon">🔄</span> 计划任务</li>
              <li class="sidebar-item"><span class="sidebar-item-icon">⚙️</span> 工具配置</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  private renderOverview(_config: any) {
    const sampleData = this.activeTool === 'baseline' ? [
      { id: 'CIS-1.1', name: '密码策略', status: 'pass', category: '身份认证' },
      { id: 'CIS-2.1', name: '审计日志', status: 'fail', category: '日志监控' },
      { id: 'AWS-WAF-1', name: 'WAF配置', status: 'pass', category: '云安全' },
      { id: 'NIST-AC-1', name: '访问控制', status: 'warn', category: '访问管理' },
    ] : this.activeTool === 'vulnscan' ? [
      { id: 'CVE-2024-1234', name: 'Log4j RCE', severity: 'critical', status: 'open' },
      { id: 'CVE-2024-5678', name: 'OpenSSL Buffer', severity: 'high', status: 'open' },
      { id: 'CVE-2024-9012', name: 'SQL Injection', severity: 'medium', status: 'fixed' },
    ] : [
      { id: 'T1001', name: '数据压缩', status: 'detected', type: 'ATT&CK' },
      { id: 'T1005', name: '本地数据', status: 'detected', type: 'ATT&CK' },
    ];

    return html`
      <table class="results-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>名称/描述</th>
            <th>状态</th>
            <th>类别</th>
          </tr>
        </thead>
        <tbody>
          ${sampleData.map(item => html`
            <tr>
              <td><code style="background: var(--sc-bg-tertiary); padding: 2px 6px; border-radius: 4px;">${item.id}</code></td>
              <td>${item.name}</td>
              <td>
                <span class="status-badge ${item.status === 'pass' || item.status === 'detected' ? 'pass' : item.status === 'fail' || item.status === 'open' ? 'fail' : 'warn'}">
                  ${item.status === 'pass' ? '✓ 通过' : item.status === 'fail' ? '✗ 失败' : item.status === 'warn' ? '⚠ 警告' : item.status === 'detected' ? '● 发现' : '○ 开放'}
                </span>
              </td>
              <td>${(item as any).category || (item as any).type || '-'}</td>
            </tr>
          `)}
        </tbody>
      </table>
    `;
  }

  private renderScan(config: any) {
    return html`
      <div class="form-group">
        <label class="form-label">扫描范围</label>
        <select class="form-select">
          <option>全部资产 (${config.stats.assets})</option>
          <option>云资产</option>
          <option>终端设备</option>
          <option>网络设备</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">扫描类型</label>
        <select class="form-select">
          <option>全面扫描</option>
          <option>快速扫描</option>
          <option>深度扫描</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">优先级过滤</label>
        <select class="form-select">
          <option>全部</option>
          <option>仅 Critical/High</option>
          <option>仅 Medium/Low</option>
        </select>
      </div>

      <sc-button variant="primary" style="width: 100%;" @click=${this.runScan} ?disabled=${this.isRunning}>
        ${this.isRunning ? `扫描中... ${this.progress}%` : '🚀 开始扫描'}
      </sc-button>
    `;
  }

  private renderHistory() {
    return html`
      <ul class="sidebar-list">
        <li class="sidebar-item" style="border: 1px solid var(--sc-border-color);">
          <span class="sidebar-item-icon">✓</span>
          <div>
            <div style="font-weight: 500;">全面扫描</div>
            <div style="font-size: 12px; color: var(--sc-text-tertiary);">今天 14:30 · 用时 12分钟</div>
          </div>
        </li>
        <li class="sidebar-item" style="border: 1px solid var(--sc-border-color);">
          <span class="sidebar-item-icon">✓</span>
          <div>
            <div style="font-weight: 500;">快速扫描</div>
            <div style="font-size: 12px; color: var(--sc-text-tertiary);">昨天 10:15 · 用时 3分钟</div>
          </div>
        </li>
        <li class="sidebar-item" style="border: 1px solid var(--sc-border-color);">
          <span class="sidebar-item-icon">⚠</span>
          <div>
            <div style="font-weight: 500;">深度扫描</div>
            <div style="font-size: 12px; color: var(--sc-text-tertiary);">3天前 · 用时 45分钟</div>
          </div>
        </li>
      </ul>
    `;
  }

  private renderReports() {
    return html`
      <div class="empty-state">
        <div class="empty-icon">📄</div>
        <div class="empty-title">生成安全报告</div>
        <div class="empty-desc">一键生成符合合规要求的分析报告</div>
      </div>
      <div style="display: flex; gap: var(--sc-spacing-sm); flex-wrap: wrap; margin-top: var(--sc-spacing-md);">
        <sc-button variant="secondary">📊 执行摘要</sc-button>
        <sc-button variant="secondary">📋 详细报告</sc-button>
        <sc-button variant="secondary">📧 邮件报告</sc-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sc-security-tools': ScSecurityTools; }
}

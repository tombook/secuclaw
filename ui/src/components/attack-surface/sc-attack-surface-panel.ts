import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * Attack Surface Management Panel Component v2.0
 * 
 * Features:
 * - Asset Discovery with real-time monitoring
 * - Domain Tracking with SSL grading
 * - Network Topology Visualization
 * - Risk Scoring with factor breakdown
 * - Full Dark Mode with CSS Custom Properties
 * - WCAG 2.1 AAA Accessibility
 * 
 * @enhanced - Uses CSS custom properties for full theme consistency
 */
@customElement('sc-attack-surface-panel')
export class ScAttackSurfacePanel extends LitElement {
  
  static styles = css`
    :host {
      display: block;
      /* Full CSS Custom Properties for Dark Mode Consistency */
      --sc-bg-primary: #0a0f1a;
      --sc-bg-secondary: #111827;
      --sc-bg-tertiary: #1f2937;
      --sc-bg-elevated: #263348;
      --sc-bg-hover: #1e2937;
      --sc-text-primary: #f9fafb;
      --sc-text-secondary: #9ca3af;
      --sc-text-muted: #6b7280;
      --sc-border: #374151;
      --sc-border-strong: #4b5563;
      --sc-primary: #00d4ff;
      --sc-primary-hover: #00b8e6;
      --sc-primary-muted: rgba(0, 212, 255, 0.12);
      --sc-secondary: #7c3aed;
      --sc-secondary-muted: rgba(124, 58, 237, 0.15);
      --sc-critical: #ef4444;
      --sc-critical-bg: rgba(239, 68, 68, 0.15);
      --sc-high: #f97316;
      --sc-high-bg: rgba(249, 115, 22, 0.15);
      --sc-medium: #f59e0b;
      --sc-medium-bg: rgba(245, 158, 11, 0.15);
      --sc-low: #22c55e;
      --sc-low-bg: rgba(34, 197, 94, 0.15);
      --sc-info: #3b82f6;
      --sc-info-bg: rgba(59, 130, 246, 0.15);
      --sc-success: #22c55e;
      --sc-success-bg: rgba(34, 197, 94, 0.15);
      --sc-warning: #f59e0b;
      --sc-warning-bg: rgba(245, 158, 11, 0.15);
      --sc-danger: #ef4444;
      --sc-danger-bg: rgba(239, 68, 68, 0.15);
      --sc-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
      --sc-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.5);
      --sc-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.6);
      --sc-shadow-glow: 0 0 20px rgba(0, 212, 255, 0.25);
      --sc-space-xs: 4px;
      --sc-space-sm: 8px;
      --sc-space-md: 16px;
      --sc-space-lg: 24px;
      --sc-radius-sm: 4px;
      --sc-radius-md: 8px;
      --sc-radius-lg: 12px;
      --sc-transition-fast: 150ms ease;
      --sc-transition-base: 200ms ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
      color: var(--sc-text-primary);
      background: var(--sc-bg-primary);
    }

    /* Accessibility: Focus visible */
    :focus-visible {
      outline: 3px solid var(--sc-primary);
      outline-offset: 2px;
    }

    /* Screen reader only */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .panel-container {
      background: var(--sc-bg-primary);
      border-radius: var(--sc-radius-lg);
      padding: var(--sc-space-lg);
      color: var(--sc-text-primary);
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-space-lg);
      padding-bottom: var(--sc-space-md);
      border-bottom: 1px solid var(--sc-border);
    }

    .panel-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--sc-text-primary);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .panel-title svg {
      width: 24px;
      height: 24px;
      color: var(--sc-primary);
    }

    .header-actions {
      display: flex;
      gap: var(--sc-space-sm);
      align-items: center;
    }

    /* Live indicator for accessibility */
    .live-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--sc-success);
      padding: 6px 12px;
      background: var(--sc-success-bg);
      border-radius: var(--sc-radius-sm);
    }

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--sc-success);
      animation: pulse-glow 2s infinite;
    }

    @keyframes pulse-glow {
      0%, 100% { opacity: 1; box-shadow: 0 0 8px var(--sc-success); }
      50% { opacity: 0.6; box-shadow: 0 0 4px var(--sc-success); }
    }

    /* Buttons with full theme support */
    .btn {
      padding: 10px 16px;
      border-radius: var(--sc-radius-md);
      border: 1px solid var(--sc-border);
      background: var(--sc-bg-tertiary);
      color: var(--sc-text-primary);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--sc-transition-fast);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn:hover {
      background: var(--sc-bg-hover);
      border-color: var(--sc-primary);
      color: var(--sc-primary);
    }

    .btn:focus-visible {
      outline: 3px solid var(--sc-primary);
      outline-offset: 2px;
    }

    .btn-primary {
      background: var(--sc-primary);
      color: var(--sc-bg-primary);
      border-color: var(--sc-primary);
    }

    .btn-primary:hover {
      background: var(--sc-primary-hover);
      border-color: var(--sc-primary-hover);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--sc-space-md);
      margin-bottom: var(--sc-space-lg);
    }

    .stat-card {
      background: var(--sc-bg-secondary);
      border: 1px solid var(--sc-border);
      border-radius: var(--sc-radius-md);
      padding: var(--sc-space-md);
      transition: all var(--sc-transition-base);
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--stat-accent, var(--sc-primary));
    }

    .stat-card:hover {
      border-color: var(--sc-primary);
      transform: translateY(-2px);
      box-shadow: var(--sc-shadow-lg);
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--sc-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }

    .stat-icon svg {
      width: 22px;
      height: 22px;
    }

    .stat-icon.assets {
      background: var(--sc-primary-muted);
      color: var(--sc-primary);
    }

    .stat-icon.domains {
      background: var(--sc-secondary-muted);
      color: var(--sc-secondary);
    }

    .stat-icon.risk {
      background: var(--sc-danger-bg);
      color: var(--sc-danger);
    }

    .stat-icon.network {
      background: var(--sc-success-bg);
      color: var(--sc-success);
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--sc-text-primary);
      margin-bottom: 4px;
      line-height: 1;
    }

    .stat-label {
      font-size: 13px;
      color: var(--sc-text-secondary);
    }

    .stat-change {
      font-size: 12px;
      margin-top: 8px;
      font-weight: 500;
    }

    .stat-change.positive {
      color: var(--sc-success);
    }

    .stat-change.negative {
      color: var(--sc-danger);
    }

    /* Tabs */
    .tabs-container {
      margin-bottom: var(--sc-space-md);
    }

    .tabs {
      display: flex;
      gap: 4px;
      background: var(--sc-bg-secondary);
      padding: 4px;
      border-radius: var(--sc-radius-md);
      border: 1px solid var(--sc-border);
    }

    .tab {
      flex: 1;
      padding: 12px 16px;
      background: transparent;
      border: none;
      border-radius: var(--sc-radius-sm);
      color: var(--sc-text-secondary);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--sc-transition-fast);
    }

    .tab:hover {
      color: var(--sc-text-primary);
      background: var(--sc-bg-hover);
    }

    .tab.active {
      background: var(--sc-primary);
      color: var(--sc-bg-primary);
    }

    .tab:focus-visible {
      outline: 2px solid var(--sc-primary);
      outline-offset: -2px;
    }

    .tab-content {
      background: var(--sc-bg-secondary);
      border: 1px solid var(--sc-border);
      border-radius: var(--sc-radius-md);
      padding: var(--sc-space-lg);
      min-height: 320px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--sc-text-primary);
      margin-bottom: var(--sc-space-md);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Asset List */
    .asset-list {
      display: flex;
      flex-direction: column;
      gap: var(--sc-space-sm);
    }

    .asset-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px;
      background: var(--sc-bg-primary);
      border: 1px solid var(--sc-border);
      border-radius: var(--sc-radius-md);
      transition: all var(--sc-transition-fast);
    }

    .asset-item:hover {
      border-color: var(--sc-primary);
      background: var(--sc-bg-tertiary);
      transform: translateX(4px);
    }

    .asset-info {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .asset-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--sc-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--sc-primary-muted);
      color: var(--sc-primary);
    }

    .asset-icon svg {
      width: 20px;
      height: 20px;
    }

    .asset-details h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--sc-text-primary);
    }

    .asset-details p {
      margin: 4px 0 0;
      font-size: 12px;
      color: var(--sc-text-muted);
    }

    /* Risk Badges - Using CSS custom properties */
    .risk-badge {
      padding: 4px 12px;
      border-radius: var(--sc-radius-sm);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border: 1px solid;
    }

    .risk-badge.critical {
      background: var(--sc-critical-bg);
      color: var(--sc-critical);
      border-color: rgba(239, 68, 68, 0.4);
    }

    .risk-badge.high {
      background: var(--sc-high-bg);
      color: var(--sc-high);
      border-color: rgba(249, 115, 22, 0.4);
    }

    .risk-badge.medium {
      background: var(--sc-medium-bg);
      color: var(--sc-medium);
      border-color: rgba(245, 158, 11, 0.4);
    }

    .risk-badge.low {
      background: var(--sc-low-bg);
      color: var(--sc-low);
      border-color: rgba(34, 197, 94, 0.4);
    }

    /* Domain Cards */
    .domain-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--sc-space-md);
    }

    .domain-card {
      background: var(--sc-bg-primary);
      border: 1px solid var(--sc-border);
      border-radius: var(--sc-radius-md);
      padding: var(--sc-space-md);
      transition: all var(--sc-transition-base);
    }

    .domain-card:hover {
      border-color: var(--sc-secondary);
      transform: translateY(-2px);
      box-shadow: var(--sc-shadow-md);
    }

    .domain-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .domain-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--sc-text-primary);
      word-break: break-all;
    }

    .domain-status {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-left: 8px;
    }

    .domain-status.active {
      background: var(--sc-success);
      box-shadow: 0 0 8px var(--sc-success);
    }

    .domain-status.warning {
      background: var(--sc-warning);
      box-shadow: 0 0 8px var(--sc-warning);
    }

    .domain-status.danger {
      background: var(--sc-danger);
      box-shadow: 0 0 8px var(--sc-danger);
    }

    .domain-stats {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .domain-stat {
      font-size: 12px;
      color: var(--sc-text-secondary);
    }

    .domain-stat span {
      color: var(--sc-text-primary);
      font-weight: 600;
    }

    /* Network Visualization */
    .network-viz {
      position: relative;
      height: 300px;
      background: var(--sc-bg-primary);
      border-radius: var(--sc-radius-md);
      overflow: hidden;
    }

    .network-canvas {
      width: 100%;
      height: 100%;
    }

    .network-legend {
      position: absolute;
      bottom: var(--sc-space-md);
      left: var(--sc-space-md);
      background: var(--sc-bg-secondary);
      padding: 12px;
      border-radius: var(--sc-radius-sm);
      border: 1px solid var(--sc-border);
    }

    .legend-title {
      font-size: 11px;
      font-weight: 600;
      color: var(--sc-text-muted);
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: var(--sc-text-primary);
      margin-bottom: 4px;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    /* Risk Gauge */
    .risk-gauge {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--sc-space-md);
    }

    .gauge-container {
      position: relative;
      width: 200px;
      height: 110px;
      margin-bottom: var(--sc-space-md);
    }

    .gauge-svg {
      width: 100%;
      height: 100%;
    }

    .gauge-bg {
      fill: none;
      stroke: var(--sc-border);
      stroke-width: 12;
    }

    .gauge-fill {
      fill: none;
      stroke-width: 12;
      stroke-linecap: round;
      transition: stroke-dashoffset 1s ease-out;
    }

    .gauge-value {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      font-size: 40px;
      font-weight: 700;
      color: var(--sc-text-primary);
    }

    .gauge-label {
      font-size: 14px;
      color: var(--sc-text-secondary);
      margin-bottom: var(--sc-space-lg);
    }

    /* Risk Factors */
    .risk-factors {
      width: 100%;
    }

    .risk-factor {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px;
      background: var(--sc-bg-primary);
      border-radius: var(--sc-radius-md);
      margin-bottom: 8px;
      transition: all var(--sc-transition-fast);
    }

    .risk-factor:hover {
      background: var(--sc-bg-tertiary);
    }

    .risk-factor-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .risk-factor-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--sc-radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .risk-factor-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--sc-text-primary);
    }

    .risk-factor-impact {
      font-size: 11px;
      color: var(--sc-text-muted);
    }

    .risk-factor-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--sc-warning);
    }

    /* Search Input */
    .search-container {
      margin-bottom: var(--sc-space-md);
    }

    .search-input {
      width: 100%;
      padding: 12px 16px;
      background: var(--sc-bg-primary);
      border: 1px solid var(--sc-border);
      border-radius: var(--sc-radius-md);
      color: var(--sc-text-primary);
      font-size: 13px;
      outline: none;
      transition: all var(--sc-transition-fast);
    }

    .search-input:focus {
      border-color: var(--sc-primary);
      box-shadow: 0 0 0 3px var(--sc-primary-muted);
    }

    .search-input::placeholder {
      color: var(--sc-text-muted);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--sc-text-muted);
    }

    .empty-state svg {
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .stat-card, .btn, .asset-item, .domain-card, .risk-factor, .gauge-fill {
        transition: none;
      }
      .live-dot {
        animation: none;
      }
    }
  `;

  @property({ type: String }) activeTab = 'assets';
  @property({ type: Boolean }) loading = false;
  
  @state() private searchQuery = '';
  @state() private assets: Array<{
    id: number;
    name: string;
    ip: string;
    type: string;
    status: string;
    risk: 'critical' | 'high' | 'medium' | 'low';
    lastSeen: string;
  }> = [];
  
  @state() private domains: Array<{
    name: string;
    status: 'active' | 'warning' | 'danger';
    subdomains: number;
    dnsRecords: number;
    sslGrade: string;
  }> = [];
  
  @state() private riskScore = 0;
  @state() private riskFactors: Array<{
    name: string;
    impact: string;
    icon: string;
    color: string;
  }> = [];
  
  @state() private networkNodes: Array<{
    id: number;
    label: string;
    type: string;
    x: number;
    y: number;
  }> = [];

  connectedCallback() {
    super.connectedCallback();
    this.loadMockData();
  }

  private loadMockData() {
    this.assets = [
      { id: 1, name: 'web-server-01.prod', ip: '192.168.1.10', type: 'server', status: 'active', risk: 'high', lastSeen: '2 min ago' },
      { id: 2, name: 'db-primary.internal', ip: '192.168.1.20', type: 'database', status: 'active', risk: 'critical', lastSeen: '1 min ago' },
      { id: 3, name: 'api-gateway.prod', ip: '192.168.1.30', type: 'service', status: 'active', risk: 'medium', lastSeen: '5 min ago' },
      { id: 4, name: 'cdn-edge-01', ip: '203.0.113.50', type: 'cdn', status: 'active', risk: 'low', lastSeen: '30 sec ago' },
      { id: 5, name: 'monitoring.internal', ip: '192.168.1.100', type: 'monitoring', status: 'active', risk: 'low', lastSeen: '10 sec ago' },
    ];

    this.domains = [
      { name: 'api.secuclaw.io', status: 'active', subdomains: 24, dnsRecords: 156, sslGrade: 'A+' },
      { name: 'portal.secuclaw.io', status: 'active', subdomains: 12, dnsRecords: 89, sslGrade: 'A' },
      { name: 'cdn.secuclaw.io', status: 'warning', subdomains: 8, dnsRecords: 45, sslGrade: 'B' },
      { name: 'dev.secuclaw.io', status: 'active', subdomains: 31, dnsRecords: 201, sslGrade: 'A+' },
      { name: 'staging.secuclaw.io', status: 'danger', subdomains: 15, dnsRecords: 98, sslGrade: 'C' },
      { name: 'legacy.secuclaw.io', status: 'warning', subdomains: 6, dnsRecords: 42, sslGrade: 'B' },
    ];

    this.riskScore = 67;
    this.riskFactors = [
      { name: 'Exposed Services', impact: '+15', icon: 'globe', color: 'var(--sc-warning)' },
      { name: 'Vulnerable Ports', impact: '+22', icon: 'shield', color: 'var(--sc-danger)' },
      { name: 'Outdated SSL', impact: '+12', icon: 'lock', color: 'var(--sc-warning)' },
      { name: 'DNS Misconfigs', impact: '+8', icon: 'dns', color: 'var(--sc-primary)' },
      { name: 'Open Endpoints', impact: '+10', icon: 'link', color: 'var(--sc-warning)' },
    ];

    this.networkNodes = [
      { id: 1, label: 'Firewall', type: 'security', x: 0.5, y: 0.1 },
      { id: 2, label: 'Web Server', type: 'server', x: 0.3, y: 0.3 },
      { id: 3, label: 'API Gateway', type: 'service', x: 0.7, y: 0.3 },
      { id: 4, label: 'Database', type: 'database', x: 0.2, y: 0.6 },
      { id: 5, label: 'Cache', type: 'cache', x: 0.5, y: 0.5 },
      { id: 6, label: 'CDN', type: 'cdn', x: 0.8, y: 0.6 },
      { id: 7, label: 'Load Balancer', type: 'network', x: 0.5, y: 0.2 },
    ];
  }

  private get filteredAssets() {
    if (!this.searchQuery) return this.assets;
    const query = this.searchQuery.toLowerCase();
    return this.assets.filter(
      a => a.name.toLowerCase().includes(query) || a.ip.includes(query)
    );
  }

  private get filteredDomains() {
    if (!this.searchQuery) return this.domains;
    const query = this.searchQuery.toLowerCase();
    return this.domains.filter(d => d.name.toLowerCase().includes(query));
  }

  private getRiskColor(score: number): string {
    if (score >= 80) return 'var(--sc-danger)';
    if (score >= 60) return 'var(--sc-warning)';
    if (score >= 40) return 'var(--sc-primary)';
    return 'var(--sc-success)';
  }

  private renderAssetsTab() {
    return html`
      <div class="search-container">
        <label for="asset-search" class="sr-only">Search assets</label>
        <input 
          id="asset-search"
          type="text" 
          class="search-input" 
          placeholder="Search assets by name or IP..." 
          .value="${this.searchQuery}"
          @input="${(e: InputEvent) => this.searchQuery = (e.target as HTMLInputElement).value}"
        />
      </div>
      <div class="asset-list" role="list" aria-label="Asset inventory">
        ${this.filteredAssets.length > 0
          ? this.filteredAssets.map(asset => html`
              <div class="asset-item" role="listitem">
                <div class="asset-info">
                  <div class="asset-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="3" width="20" height="14" rx="2"/>
                      <path d="M8 21h8M12 17v4"/>
                    </svg>
                  </div>
                  <div class="asset-details">
                    <h4>${asset.name}</h4>
                    <p>${asset.ip} · ${asset.type} · ${asset.lastSeen}</p>
                  </div>
                </div>
                <span class="risk-badge ${asset.risk}" role="status" aria-label="Risk level: ${asset.risk}">
                  ${asset.risk}
                </span>
              </div>
            `)
          : html`
              <div class="empty-state" role="status">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <p>No assets found matching your search</p>
              </div>
            `
        }
      </div>
    `;
  }

  private renderDomainsTab() {
    return html`
      <div class="search-container">
        <label for="domain-search" class="sr-only">Search domains</label>
        <input 
          id="domain-search"
          type="text" 
          class="search-input" 
          placeholder="Search domains..." 
          .value="${this.searchQuery}"
          @input="${(e: InputEvent) => this.searchQuery = (e.target as HTMLInputElement).value}"
        />
      </div>
      <div class="domain-list" role="list" aria-label="Domain inventory">
        ${this.filteredDomains.map(domain => html`
          <div class="domain-card" role="listitem">
            <div class="domain-header">
              <span class="domain-name">${domain.name}</span>
              <span class="domain-status ${domain.status}" aria-label="Status: ${domain.status}"></span>
            </div>
            <div class="domain-stats">
              <span class="domain-stat">Subdomains: <span>${domain.subdomains}</span></span>
              <span class="domain-stat">DNS: <span>${domain.dnsRecords}</span></span>
              <span class="domain-stat">SSL: <span>${domain.sslGrade}</span></span>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  private renderNetworkTab() {
    return html`
      <div class="network-viz" role="img" aria-label="Network topology visualization">
        <svg class="network-canvas" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <line x1="50" y1="10" x2="30" y2="30" stroke="var(--sc-border)" stroke-width="0.5"/>
          <line x1="50" y1="10" x2="70" y2="30" stroke="var(--sc-border)" stroke-width="0.5"/>
          <line x1="50" y1="10" x2="50" y2="20" stroke="var(--sc-border)" stroke-width="0.5"/>
          <line x1="30" y1="30" x2="20" y2="60" stroke="var(--sc-border)" stroke-width="0.5"/>
          <line x1="30" y1="30" x2="50" y2="50" stroke="var(--sc-border)" stroke-width="0.5"/>
          <line x1="70" y1="30" x2="80" y2="60" stroke="var(--sc-border)" stroke-width="0.5"/>
          <line x1="70" y1="30" x2="50" y2="50" stroke="var(--sc-border)" stroke-width="0.5"/>
          <line x1="50" y1="50" x2="20" y2="60" stroke="var(--sc-border)" stroke-width="0.5"/>
          <line x1="50" y1="50" x2="80" y2="60" stroke="var(--sc-border)" stroke-width="0.5"/>
          
          ${this.networkNodes.map(node => {
            const colors: Record<string, string> = {
              security: 'var(--sc-danger)',
              server: 'var(--sc-primary)',
              service: 'var(--sc-secondary)',
              database: 'var(--sc-warning)',
              cache: 'var(--sc-success)',
              cdn: 'var(--sc-primary)',
              network: 'var(--sc-secondary)'
            };
            const color = colors[node.type] || 'var(--sc-text-muted)';
            return html`
              <g transform="translate(${node.x * 100}, ${node.y * 100})">
                <circle r="5" fill="${color}" opacity="0.3"/>
                <circle r="3" fill="${color}"/>
                <text y="10" text-anchor="middle" font-size="3" fill="var(--sc-text-secondary)">${node.label}</text>
              </g>
            `;
          })}
        </svg>
        <div class="network-legend">
          <div class="legend-title">Node Types</div>
          <div class="legend-item">
            <span class="legend-dot" style="background: var(--sc-danger)"></span>
            Security
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: var(--sc-primary)"></span>
            Server/CDN
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: var(--sc-secondary)"></span>
            Service
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: var(--sc-warning)"></span>
            Database
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: var(--sc-success)"></span>
            Cache
          </div>
        </div>
      </div>
    `;
  }

  private renderRiskTab() {
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (this.riskScore / 100) * circumference;
    const riskColor = this.getRiskColor(this.riskScore);

    return html`
      <div class="risk-gauge" role="img" aria-label="Risk score: ${this.riskScore} out of 100">
        <div class="gauge-container">
          <svg class="gauge-svg" viewBox="0 0 100 60" aria-hidden="true">
            <path class="gauge-bg" d="M 10 55 A 40 40 0 0 1 90 55"/>
            <path 
              class="gauge-fill" 
              d="M 10 55 A 40 40 0 0 1 90 55"
              stroke="${riskColor}"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${offset}"
            />
          </svg>
          <div class="gauge-value" style="color: ${riskColor}">${this.riskScore}</div>
        </div>
        <span class="gauge-label">Overall Attack Surface Risk Score</span>
        
        <div class="risk-factors">
          <div class="section-title">Risk Factors</div>
          ${this.riskFactors.map(factor => html`
            <div class="risk-factor">
              <div class="risk-factor-info">
                <div class="risk-factor-icon" style="background: ${factor.color}20; color: ${factor.color}">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div>
                  <div class="risk-factor-name">${factor.name}</div>
                  <div class="risk-factor-impact">Impact on score</div>
                </div>
              </div>
              <span class="risk-factor-value">${factor.impact}</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  render() {
    const totalAssets = this.assets.length;
    const totalDomains = this.domains.length;
    const criticalAssets = this.assets.filter(a => a.risk === 'critical' || a.risk === 'high').length;
    const activeEndpoints = this.networkNodes.length;

    return html`
      <div class="panel-container" role="region" aria-label="Attack Surface Management">
        <div class="panel-header">
          <h2 class="panel-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
              <path d="M2 12h4M18 12h4M12 2v4M12 18v4"/>
            </svg>
            Attack Surface Management
          </h2>
          <div class="header-actions">
            <div class="live-indicator" role="status" aria-label="Real-time monitoring active">
              <span class="live-dot" aria-hidden="true"></span>
              LIVE
            </div>
            <button class="btn btn-primary" aria-label="Add new asset">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add Asset
            </button>
            <button class="btn" aria-label="Export data">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Export
            </button>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card" style="--stat-accent: var(--sc-primary)">
            <div class="stat-icon assets">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8M12 17v4"/>
              </svg>
            </div>
            <div class="stat-value">${totalAssets}</div>
            <div class="stat-label">Total Assets</div>
            <div class="stat-change positive">+3 this week</div>
          </div>

          <div class="stat-card" style="--stat-accent: var(--sc-secondary)">
            <div class="stat-icon domains">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
              </svg>
            </div>
            <div class="stat-value">${totalDomains}</div>
            <div class="stat-label">Tracked Domains</div>
            <div class="stat-change positive">+1 this week</div>
          </div>

          <div class="stat-card" style="--stat-accent: var(--sc-danger)">
            <div class="stat-icon risk">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div class="stat-value" style="color: var(--sc-warning)">${criticalAssets}</div>
            <div class="stat-label">High Risk Assets</div>
            <div class="stat-change negative">+2 this week</div>
          </div>

          <div class="stat-card" style="--stat-accent: var(--sc-success)">
            <div class="stat-icon network">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="5" r="3"/>
                <circle cx="5" cy="19" r="3"/>
                <circle cx="19" cy="19" r="3"/>
                <path d="M12 8v4M8.5 14.5L5 16M15.5 14.5L19 16"/>
              </svg>
            </div>
            <div class="stat-value">${activeEndpoints}</div>
            <div class="stat-label">Network Endpoints</div>
            <div class="stat-change positive">+2 active</div>
          </div>
        </div>

        <div class="tabs-container">
          <div class="tabs" role="tablist" aria-label="Attack surface views">
            <button 
              class="tab ${this.activeTab === 'assets' ? 'active' : ''}"
              role="tab"
              aria-selected="${this.activeTab === 'assets'}"
              aria-controls="assets-panel"
              @click="${() => this.activeTab = 'assets'}"
            >
              Asset Discovery
            </button>
            <button 
              class="tab ${this.activeTab === 'domains' ? 'active' : ''}"
              role="tab"
              aria-selected="${this.activeTab === 'domains'}"
              aria-controls="domains-panel"
              @click="${() => this.activeTab = 'domains'}"
            >
              Domain Tracking
            </button>
            <button 
              class="tab ${this.activeTab === 'network' ? 'active' : ''}"
              role="tab"
              aria-selected="${this.activeTab === 'network'}"
              aria-controls="network-panel"
              @click="${() => this.activeTab = 'network'}"
            >
              Network Topology
            </button>
            <button 
              class="tab ${this.activeTab === 'risk' ? 'active' : ''}"
              role="tab"
              aria-selected="${this.activeTab === 'risk'}"
              aria-controls="risk-panel"
              @click="${() => this.activeTab = 'risk'}"
            >
              Risk Scoring
            </button>
          </div>
        </div>

        <div 
          class="tab-content" 
          role="tabpanel" 
          id="${this.activeTab}-panel"
          aria-label="${this.activeTab} view"
        >
          ${this.activeTab === 'assets' ? this.renderAssetsTab() : nothing}
          ${this.activeTab === 'domains' ? this.renderDomainsTab() : nothing}
          ${this.activeTab === 'network' ? this.renderNetworkTab() : nothing}
          ${this.activeTab === 'risk' ? this.renderRiskTab() : nothing}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-attack-surface-panel': ScAttackSurfacePanel;
  }
}

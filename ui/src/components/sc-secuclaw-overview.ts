/**
 * SecuClaw Cybersecurity Platform - Comprehensive Security Overview
 * 
 * Unified security dashboard integrating all security modules:
 * - Attack Surface Management
 * - Vulnerability Lifecycle Tracking
 * - Security Posture Scoring
 * - Threat Hunting Workspace
 * - SOC Workflow Automation
 * - Security KPI Metrics
 * - Incident Timeline Visualization
 * - Compliance Audit Modules
 * - Asset Inventory Management
 * - Network Security Monitoring
 * - IAM Analytics
 * - DLP Panel
 * - Security Training Tracker
 * - Vendor Risk Assessment
 * - Security Policy Management
 * - Pentest Report Generator
 * - Remediation Tracking
 * - Security ROI Calculator
 * - Threat Model Visualization
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

// Security theme colors for dark mode consistency
const COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#22c55e',
  info: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  bgPrimary: '#0a0f1a',
  bgSecondary: '#111827',
  bgTertiary: '#1f2937',
  bgElevated: '#374151',
  textPrimary: '#f9fafb',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  borderColor: '#374151',
  primary: '#00d4ff',
  secondary: '#7c3aed',
  accent: '#fbbf24',
};

interface SecurityMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

interface ThreatEvent {
  id: string;
  timestamp: Date;
  type: 'attack' | 'vulnerability' | 'compliance' | 'policy' | 'incident';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  source: string;
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  assignee?: string;
}

interface ComplianceStatus {
  framework: string;
  score: number;
  status: 'compliant' | 'partial' | 'non-compliant';
  lastAudit: Date;
  findings: number;
}

@customElement('sc-secuclaw-overview')
export class ScSecuClawOverview extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
      background: var(--bg-primary, #0a0f1a);
      color: var(--text-primary, #f9fafb);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
      --primary: #00d4ff;
      --primary-hover: #00b8e6;
      --primary-muted: rgba(0, 212, 255, 0.1);
      --secondary: #7c3aed;
      --success: #22c55e;
      --warning: #f59e0b;
      --danger: #ef4444;
      --bg-primary: #0a0f1a;
      --bg-secondary: #111827;
      --bg-tertiary: #1f2937;
      --bg-elevated: #374151;
      --text-primary: #f9fafb;
      --text-secondary: #9ca3af;
      --text-muted: #6b7280;
      --border-color: #374151;
    }

    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg-secondary); }
    ::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

    .overview-container {
      height: 100%;
      display: grid;
      grid-template-columns: 1fr 300px;
      grid-template-rows: auto 1fr auto;
      gap: 12px;
      padding: 16px;
      box-sizing: border-box;
      overflow: hidden;
    }

    .header-section {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }

    .header-left { display: flex; align-items: center; gap: 16px; }
    .logo { display: flex; align-items: center; gap: 8px; }
    .logo-icon {
      width: 32px; height: 32px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    }
    .logo-text { font-size: 18px; font-weight: 800; color: var(--primary); letter-spacing: -0.02em; }
    .header-title { font-size: 14px; color: var(--text-secondary); }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .time-display { font-size: 12px; color: var(--text-muted); font-family: monospace; }
    
    .quick-actions { display: flex; gap: 8px; }
    .action-btn {
      padding: 6px 12px; border: 1px solid var(--border-color); border-radius: 6px;
      background: transparent; color: var(--text-secondary); font-size: 12px;
      cursor: pointer; transition: all 150ms ease; display: flex; align-items: center; gap: 6px;
    }
    .action-btn:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-muted); }
    .action-btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
    .action-btn.primary { background: var(--primary); border-color: var(--primary); color: var(--bg-primary); }
    .action-btn.primary:hover { background: var(--primary-hover); }

    .dashboard-main {
      display: grid;
      grid-template-rows: auto auto auto 1fr;
      gap: 12px;
      overflow-y: auto;
    }

    .metrics-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
    
    .metric-card {
      background: var(--bg-secondary); border: 1px solid var(--border-color);
      border-radius: 8px; padding: 14px; display: flex; flex-direction: column; gap: 8px;
      transition: all 150ms ease;
    }
    .metric-card:hover { border-color: var(--primary); transform: translateY(-2px); }
    .metric-card.critical { border-left: 3px solid var(--danger); }
    .metric-card.warning { border-left: 3px solid var(--warning); }
    .metric-card.success { border-left: 3px solid var(--success); }
    
    .metric-header { display: flex; align-items: center; justify-content: space-between; }
    .metric-icon {
      width: 36px; height: 36px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; font-size: 16px;
    }
    .metric-icon.score { background: rgba(34, 197, 94, 0.12); }
    .metric-icon.events { background: rgba(239, 68, 68, 0.12); }
    .metric-icon.vulns { background: rgba(245, 158, 11, 0.12); }
    .metric-icon.compliance { background: rgba(59, 130, 246, 0.12); }
    .metric-icon.assets { background: rgba(124, 58, 237, 0.12); }
    
    .metric-trend {
      display: flex; align-items: center; gap: 4px; font-size: 11px; padding: 2px 6px; border-radius: 4px;
    }
    .metric-trend.up { background: rgba(239, 68, 68, 0.12); color: var(--danger); }
    .metric-trend.down { background: rgba(34, 197, 94, 0.12); color: var(--success); }
    
    .metric-value { font-size: 28px; font-weight: 800; line-height: 1; }
    .metric-value.danger { color: var(--danger); }
    .metric-value.warning { color: var(--warning); }
    .metric-value.success { color: var(--success); }
    .metric-value.info { color: var(--primary); }
    .metric-label { font-size: 12px; color: var(--text-secondary); }

    .panels-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .panel {
      background: var(--bg-secondary); border: 1px solid var(--border-color);
      border-radius: 8px; overflow: hidden;
    }
    .panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px; border-bottom: 1px solid var(--border-color); background: var(--bg-tertiary);
    }
    .panel-title {
      display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700;
      color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em;
    }
    .panel-badge {
      font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600;
    }
    .panel-badge.critical { background: rgba(239, 68, 68, 0.2); color: var(--danger); }
    .panel-badge.warning { background: rgba(245, 158, 11, 0.2); color: var(--warning); }
    .panel-badge.success { background: rgba(34, 197, 94, 0.2); color: var(--success); }
    .panel-content { padding: 12px; max-height: 180px; overflow-y: auto; }

    .attack-surface-list { display: flex; flex-direction: column; gap: 8px; }
    .surface-item {
      display: flex; align-items: center; gap: 10px; padding: 8px 10px;
      background: var(--bg-primary); border-radius: 6px; transition: background 100ms ease;
    }
    .surface-item:hover { background: var(--bg-tertiary); }
    .surface-icon {
      width: 32px; height: 32px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;
    }
    .surface-info { flex: 1; min-width: 0; }
    .surface-name {
      font-size: 12px; font-weight: 600; color: var(--text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .surface-detail { font-size: 10px; color: var(--text-muted); }
    .surface-risk { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; flex-shrink: 0; }
    .surface-risk.critical { background: rgba(239, 68, 68, 0.2); color: var(--danger); }
    .surface-risk.high { background: rgba(249, 115, 22, 0.2); color: #f97316; }
    .surface-risk.medium { background: rgba(245, 158, 11, 0.2); color: var(--warning); }
    .surface-risk.low { background: rgba(34, 197, 94, 0.2); color: var(--success); }

    .vuln-list { display: flex; flex-direction: column; gap: 6px; }
    .vuln-item {
      display: flex; align-items: center; gap: 10px; padding: 8px 10px;
      background: var(--bg-primary); border-radius: 6px; border-left: 3px solid;
    }
    .vuln-item.critical { border-color: var(--danger); }
    .vuln-item.high { border-color: #f97316; }
    .vuln-item.medium { border-color: var(--warning); }
    .vuln-item.low { border-color: var(--success); }
    .vuln-severity {
      font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 3px;
      text-transform: uppercase; flex-shrink: 0;
    }
    .vuln-severity.critical { background: rgba(239, 68, 68, 0.2); color: var(--danger); }
    .vuln-severity.high { background: rgba(249, 115, 22, 0.2); color: #f97316; }
    .vuln-severity.medium { background: rgba(245, 158, 11, 0.2); color: var(--warning); }
    .vuln-severity.low { background: rgba(34, 197, 94, 0.2); color: var(--success); }
    .vuln-info { flex: 1; min-width: 0; }
    .vuln-title {
      font-size: 11px; font-weight: 600; color: var(--text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .vuln-meta { font-size: 10px; color: var(--text-muted); }
    .vuln-status { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 3px; flex-shrink: 0; }
    .vuln-status.open { background: rgba(239, 68, 68, 0.2); color: var(--danger); }
    .vuln-status.in-progress { background: rgba(59, 130, 246, 0.2); color: var(--primary); }
    .vuln-status.remediated { background: rgba(34, 197, 94, 0.2); color: var(--success); }

    .compliance-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .compliance-item { padding: 10px; background: var(--bg-primary); border-radius: 6px; text-align: center; }
    .compliance-framework { font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px; }
    .compliance-score { font-size: 24px; font-weight: 800; }
    .compliance-score.excellent { color: var(--success); }
    .compliance-score.good { color: var(--primary); }
    .compliance-score.warning { color: var(--warning); }
    .compliance-score.poor { color: var(--danger); }
    .compliance-status { font-size: 10px; margin-top: 4px; }
    .compliance-status.pass { color: var(--success); }
    .compliance-status.fail { color: var(--danger); }

    .dashboard-sidebar { display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }

    .incident-timeline { position: relative; padding-left: 20px; }
    .incident-timeline::before {
      content: ''; position: absolute; left: 6px; top: 0; bottom: 0; width: 2px;
      background: linear-gradient(to bottom, var(--primary), var(--border-color));
    }
    .incident-item {
      position: relative; padding: 10px 12px; background: var(--bg-primary);
      border-radius: 6px; margin-bottom: 8px;
    }
    .incident-item::before {
      content: ''; position: absolute; left: -17px; top: 14px; width: 10px; height: 10px;
      border-radius: 50%; background: var(--bg-secondary); border: 2px solid;
    }
    .incident-item.critical::before { border-color: var(--danger); }
    .incident-item.high::before { border-color: #f97316; }
    .incident-item.medium::before { border-color: var(--warning); }
    .incident-item.low::before { border-color: var(--success); }
    .incident-time { font-size: 10px; color: var(--text-muted); margin-bottom: 4px; }
    .incident-title { font-size: 11px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
    .incident-meta { display: flex; gap: 8px; flex-wrap: wrap; }
    .incident-tag { font-size: 9px; padding: 2px 6px; border-radius: 3px; background: var(--bg-tertiary); color: var(--text-secondary); }

    .asset-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .asset-item { padding: 10px; background: var(--bg-primary); border-radius: 6px; text-align: center; }
    .asset-icon { font-size: 20px; margin-bottom: 6px; }
    .asset-count { font-size: 18px; font-weight: 800; color: var(--text-primary); }
    .asset-label { font-size: 10px; color: var(--text-muted); }

    .module-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
    .module-item {
      padding: 10px 8px; background: var(--bg-primary); border: 1px solid var(--border-color);
      border-radius: 6px; text-align: center; cursor: pointer; transition: all 150ms ease;
    }
    .module-item:hover { border-color: var(--primary); background: var(--primary-muted); }
    .module-item:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
    .module-icon { font-size: 18px; margin-bottom: 4px; }
    .module-name { font-size: 9px; color: var(--text-secondary); line-height: 1.2; }

    .status-bar {
      grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between;
      padding: 8px 16px; background: var(--bg-secondary); border: 1px solid var(--border-color);
      border-radius: 6px; font-size: 11px;
    }
    .status-left { display: flex; align-items: center; gap: 16px; }
    .status-item { display: flex; align-items: center; gap: 6px; color: var(--text-muted); }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; }
    .status-dot.online { background: var(--success); }
    .status-dot.warning { background: var(--warning); }
    .status-dot.error { background: var(--danger); }
    .status-right { display: flex; align-items: center; gap: 16px; color: var(--text-muted); }

    .section-title {
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--text-secondary); margin-bottom: 8px; display: flex; align-items: center; gap: 8px;
    }

    @media (max-width: 1200px) {
      .overview-container { grid-template-columns: 1fr; }
      .metrics-row { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 768px) {
      .metrics-row { grid-template-columns: repeat(2, 1fr); }
      .panels-grid { grid-template-columns: 1fr; }
      .header-section { flex-direction: column; gap: 12px; }
      .header-right { width: 100%; justify-content: space-between; }
    }
    @media (prefers-contrast: high) {
      .metric-card, .panel, .surface-item, .vuln-item, .incident-item { border-width: 2px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .metric-card, .action-btn, .surface-item, .vuln-item, .module-item { transition: none; }
    }
    .sr-only {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
    }
  `;

  @state() private _currentTime = new Date();
  @state() private _metrics: SecurityMetric[] = [];
  @state() private _threats: ThreatEvent[] = [];
  @state() private _compliance: ComplianceStatus[] = [];
  @state() private _assets: Array<{ type: string; count: number; icon: string }> = [];
  @state() private _attackSurface: Array<{ name: string; type: string; risk: string; count: number }> = [];
  
  private _timeInterval: number | null = null;

  connectedCallback() {
    super.connectedCallback();
    this._loadData();
    this._timeInterval = window.setInterval(() => { this._currentTime = new Date(); }, 1000);
    this._announce('SecuClaw Security Overview loaded');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._timeInterval) clearInterval(this._timeInterval);
  }

  private _announce(message: string) {
    const liveRegion = document.getElementById('secuclaw-live-region');
    if (liveRegion) { liveRegion.textContent = message; setTimeout(() => { liveRegion.textContent = ''; }, 1000); }
  }

  private _loadData() {
    this._metrics = [
      { id: 'score', label: '安全评分', value: 78, unit: '', trend: 'down', trendValue: 2, severity: 'info' },
      { id: 'events', label: '活跃威胁', value: 12, unit: '', trend: 'up', trendValue: 3, severity: 'critical' },
      { id: 'vulns', label: '待修复漏洞', value: 47, unit: '', trend: 'down', trendValue: 5, severity: 'warning' },
      { id: 'compliance', label: '合规达成率', value: 89, unit: '%', trend: 'up', trendValue: 3, severity: 'success' },
      { id: 'assets', label: '受保护资产', value: 1247, unit: '', trend: 'stable', trendValue: 0, severity: 'info' },
    ];
    this._attackSurface = [
      { name: 'Web Applications', type: 'web', risk: 'critical', count: 23 },
      { name: 'API Endpoints', type: 'api', risk: 'high', count: 156 },
      { name: 'Cloud Workloads', type: 'cloud', risk: 'medium', count: 89 },
      { name: 'Endpoints', type: 'endpoint', risk: 'low', count: 2340 },
      { name: 'Network Perimeters', type: 'network', risk: 'medium', count: 12 },
    ];
    this._compliance = [
      { framework: 'SOC 2', score: 92, status: 'compliant', lastAudit: new Date('2025-01-15'), findings: 2 },
      { framework: 'GDPR', score: 78, status: 'partial', lastAudit: new Date('2025-01-10'), findings: 5 },
      { framework: 'ISO 27001', score: 88, status: 'compliant', lastAudit: new Date('2025-01-08'), findings: 3 },
      { framework: 'PCI-DSS', score: 95, status: 'compliant', lastAudit: new Date('2025-01-05'), findings: 1 },
    ];
    this._threats = [
      { id: 'v1', timestamp: new Date(), type: 'vulnerability', severity: 'critical', title: 'CVE-2024-21762', description: 'FortiOS RCE漏洞', source: '漏洞扫描', status: 'open', assignee: '安全团队' },
      { id: 'v2', timestamp: new Date(Date.now() - 3600000), type: 'vulnerability', severity: 'high', title: 'CVE-2024-3400', description: 'Palo Alto PAN-OS命令注入', source: '威胁情报', status: 'investigating', assignee: '网络团队' },
      { id: 'v3', timestamp: new Date(Date.now() - 7200000), type: 'vulnerability', severity: 'high', title: 'Log4Shell变体', description: 'Log4j新的绕过方式', source: '供应商警告', status: 'open' },
      { id: 'v4', timestamp: new Date(Date.now() - 10800000), type: 'vulnerability', severity: 'medium', title: 'OpenSSL缓冲区溢出', description: 'OpenSSL 3.x漏洞', source: 'CVE数据库', status: 'in-progress', assignee: '运维团队' },
    ];
    this._assets = [
      { type: '服务器', count: 234, icon: '🖥️' },
      { type: '工作站', count: 1890, icon: '💻' },
      { type: '网络设备', count: 89, icon: '🔧' },
      { type: '云资源', count: 456, icon: '☁️' },
    ];
  }

  private _formatTime(date: Date): string {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  private _formatRelativeTime(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return '刚刚';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`;
    return `${Math.floor(seconds / 86400)}天前`;
  }

  private _getScoreClass(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'warning';
    return 'poor';
  }

  private _navigateToModule(module: string) {
    this.dispatchEvent(new CustomEvent('navigate-module', { detail: { module }, bubbles: true, composed: true }));
    this._announce(`Navigating to ${module}`);
  }

  render() {
    return html`
      <a href="#main-content" class="sr-only">Skip to main content</a>
      <div id="secuclaw-live-region" class="sr-only" aria-live="polite" aria-atomic="true"></div>

      <div class="overview-container" id="main-content" role="main">
        <header class="header-section" role="banner">
          <div class="header-left">
            <div class="logo">
              <div class="logo-icon">🛡️</div>
              <span class="logo-text">SecuClaw</span>
            </div>
            <span class="header-title">| 统一安全态势感知平台</span>
          </div>
          <div class="header-right">
            <span class="time-display" aria-label="Current time">${this._formatTime(this._currentTime)}</span>
            <div class="quick-actions">
              <button class="action-btn" aria-label="Refresh data">🔄 刷新</button>
              <button class="action-btn" aria-label="Export report">📤 导出</button>
              <button class="action-btn primary" aria-label="Create incident">+ 新建事件</button>
            </div>
          </div>
        </header>

        <div class="dashboard-main">
          <!-- Metrics Row -->
          <div class="metrics-row" role="region" aria-label="Security metrics">
            ${this._metrics.map(metric => html`
              <div class="metric-card ${metric.severity || ''}" role="article">
                <div class="metric-header">
                  <div class="metric-icon ${metric.id}">
                    ${metric.id === 'score' ? '📊' : metric.id === 'events' ? '🚨' : metric.id === 'vulns' ? '🔓' : metric.id === 'compliance' ? '✓' : '🛡️'}
                  </div>
                  <span class="metric-trend ${metric.trend}">${metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'} ${Math.abs(metric.trendValue)}</span>
                </div>
                <div class="metric-value ${metric.severity || 'info'}">${metric.value}${metric.unit}</div>
                <div class="metric-label">${metric.label}</div>
              </div>
            `)}
          </div>

          <!-- Attack Surface & Vulnerability Panels -->
          <div class="panels-grid">
            <div class="panel" role="region" aria-labelledby="attack-surface-title">
              <div class="panel-header">
                <div class="panel-title"><span>🎯</span><span id="attack-surface-title">攻击面概览</span></div>
                <span class="panel-badge critical">${this._attackSurface.filter(s => s.risk === 'critical' || s.risk === 'high').length} 高风险</span>
              </div>
              <div class="panel-content">
                <div class="attack-surface-list" role="list">
                  ${this._attackSurface.map(surface => html`
                    <div class="surface-item" role="listitem" tabindex="0">
                      <div class="surface-icon" style="background: var(--primary-muted)">
                        ${surface.type === 'web' ? '🌐' : surface.type === 'api' ? '🔗' : surface.type === 'cloud' ? '☁️' : surface.type === 'endpoint' ? '💻' : '🔧'}
                      </div>
                      <div class="surface-info">
                        <div class="surface-name">${surface.name}</div>
                        <div class="surface-detail">${surface.count} 个暴露点</div>
                      </div>
                      <span class="surface-risk ${surface.risk}">${surface.risk.toUpperCase()}</span>
                    </div>
                  `)}
                </div>
              </div>
            </div>

            <div class="panel" role="region" aria-labelledby="vuln-title">
              <div class="panel-header">
                <div class="panel-title"><span>🔓</span><span id="vuln-title">漏洞生命周期</span></div>
                <span class="panel-badge warning">${this._threats.filter(v => v.status === 'open').length} 待处理</span>
              </div>
              <div class="panel-content">
                <div class="vuln-list" role="list">
                  ${this._threats.slice(0, 4).map(vuln => html`
                    <div class="vuln-item ${vuln.severity}" role="listitem">
                      <span class="vuln-severity ${vuln.severity}">${vuln.severity}</span>
                      <div class="vuln-info">
                        <div class="vuln-title">${vuln.title}</div>
                        <div class="vuln-meta">${vuln.description}</div>
                      </div>
                      <span class="vuln-status ${vuln.status}">
                        ${vuln.status === 'open' ? '待修复' : vuln.status === 'investigating' ? '调查中' : vuln.status === 'in-progress' ? '修复中' : '已修复'}
                      </span>
                    </div>
                  `)}
                </div>
              </div>
            </div>
          </div>

          <!-- Compliance & Assets Panels -->
          <div class="panels-grid">
            <div class="panel" role="region" aria-labelledby="compliance-title">
              <div class="panel-header">
                <div class="panel-title"><span>📋</span><span id="compliance-title">合规状态</span></div>
                <span class="panel-badge success">${this._compliance.filter(c => c.status === 'compliant').length}/${this._compliance.length}</span>
              </div>
              <div class="panel-content">
                <div class="compliance-grid">
                  ${this._compliance.map(c => html`
                    <div class="compliance-item" role="article">
                      <div class="compliance-framework">${c.framework}</div>
                      <div class="compliance-score ${this._getScoreClass(c.score)}">${c.score}%</div>
                      <div class="compliance-status ${c.status === 'compliant' ? 'pass' : 'fail'}">
                        ${c.status === 'compliant' ? '✓ 达标' : c.status === 'partial' ? '~ 部分' : '✗ 不达标'}
                      </div>
                    </div>
                  `)}
                </div>
              </div>
            </div>

            <div class="panel" role="region" aria-labelledby="asset-title">
              <div class="panel-header">
                <div class="panel-title"><span>🗄️</span><span id="asset-title">资产清单</span></div>
                <span class="panel-badge success">${this._assets.reduce((sum, a) => sum + a.count, 0)} 总计</span>
              </div>
              <div class="panel-content">
                <div class="asset-grid">
                  ${this._assets.map(asset => html`
                    <div class="asset-item" role="article">
                      <div class="asset-icon">${asset.icon}</div>
                      <div class="asset-count">${asset.count}</div>
                      <div class="asset-label">${asset.type}</div>
                    </div>
                  `)}
                </div>
              </div>
            </div>
          </div>

          <!-- Security Modules Quick Access -->
          <div class="panel" role="region" aria-labelledby="modules-title">
            <div class="panel-header">
              <div class="panel-title"><span>🧩</span><span id="modules-title">安全模块快速访问</span></div>
            </div>
            <div class="panel-content" style="max-height: 120px;">
              <div class="module-grid" role="navigation">
                ${[
                  { id: 'attack-surface', name: '攻击面', icon: '🎯' },
                  { id: 'vulnerability', name: '漏洞管理', icon: '🔓' },
                  { id: 'compliance', name: '合规审计', icon: '📋' },
                  { id: 'iam', name: '身份安全', icon: '🔐' },
                  { id: 'dlp', name: '数据防泄', icon: '🛡️' },
                  { id: 'network', name: '网络安全', icon: '🌐' },
                  { id: 'training', name: '安全培训', icon: '📚' },
                  { id: 'vendor', name: '供应商', icon: '🔗' },
                  { id: 'roi', name: 'ROI计算', icon: '💰' },
                ].map(mod => html`
                  <button class="module-item" @click=${() => this._navigateToModule(mod.id)} aria-label="${mod.name} module">
                    <div class="module-icon">${mod.icon}</div>
                    <div class="module-name">${mod.name}</div>
                  </button>
                `)}
              </div>
            </div>
          </div>
        </div>

        <!-- Right Sidebar -->
        <aside class="dashboard-sidebar" role="complementary">
          <div class="panel" role="region" aria-labelledby="incident-title">
            <div class="panel-header">
              <div class="panel-title"><span>⚡</span><span id="incident-title">事件时间线</span></div>
            </div>
            <div class="panel-content">
              <div class="incident-timeline" role="list">
                ${[
                  { id: 'i1', time: '刚刚', title: '异常登录尝试', source: 'SIEM', severity: 'high', status: '调查中' },
                  { id: 'i2', time: '30分钟前', title: '数据外泄警报', source: 'DLP', severity: 'medium', status: '待处理' },
                  { id: 'i3', time: '1小时前', title: '策略违规', source: 'EDR', severity: 'low', status: '已解决' },
                  { id: 'i4', time: '2小时前', title: '勒索软件警报', source: 'EDR', severity: 'critical', status: '已升级' },
                ].map(incident => html`
                  <div class="incident-item ${incident.severity}" role="listitem">
                    <div class="incident-time">${incident.time}</div>
                    <div class="incident-title">${incident.title}</div>
                    <div class="incident-meta">
                      <span class="incident-tag">${incident.source}</span>
                      <span class="incident-tag">${incident.status}</span>
                    </div>
                  </div>
                `)}
              </div>
            </div>
          </div>

          <div class="panel" role="region" aria-labelledby="kpi-title">
            <div class="panel-header">
              <div class="panel-title"><span>📊</span><span id="kpi-title">安全KPI</span></div>
            </div>
            <div class="panel-content">
              <div class="asset-grid">
                <div class="asset-item"><div class="asset-icon">⏱️</div><div class="asset-count">2.3h</div><div class="asset-label">平均响应时间</div></div>
                <div class="asset-item"><div class="asset-icon">📈</div><div class="asset-count">94%</div><div class="asset-label">漏洞修复率</div></div>
                <div class="asset-item"><div class="asset-icon">🔍</div><div class="asset-count">156</div><div class="asset-label">月扫描次数</div></div>
                <div class="asset-item"><div class="asset-icon">✓</div><div class="asset-count">23</div><div class="asset-label">合规项达标</div></div>
              </div>
            </div>
          </div>
        </aside>

        <footer class="status-bar" role="contentinfo">
          <div class="status-left">
            <div class="status-item"><span class="status-dot online"></span><span>系统正常</span></div>
            <div class="status-item"><span class="status-dot online"></span><span>SIEM 连接</span></div>
            <div class="status-item"><span class="status-dot warning"></span><span>3 服务待优化</span></div>
          </div>
          <div class="status-right">
            <span>SecuClaw v2.0 | 最后更新: ${this._formatTime(this._currentTime)}</span>
          </div>
        </footer>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-secuclaw-overview': ScSecuClawOverview;
  }
}

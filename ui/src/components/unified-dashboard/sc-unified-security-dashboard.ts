/**
 * SecuClaw Unified Security Dashboard - Enhanced Version
 * Comprehensive security operations center with all modules
 * Features: Dark mode consistency, WCAG 2.1 AA accessibility, responsive design
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

// Enhanced dark mode color palette with proper contrast
const DARK_COLORS = {
  '--bg-base': '#0a0f1a',
  '--bg-primary': '#0f172a',
  '--bg-secondary': '#1e293b',
  '--bg-tertiary': '#2d3748',
  '--bg-elevated': '#374151',
  '--bg-overlay': '#1a1f2e',
  '--text-primary': '#f8fafc',
  '--text-secondary': '#cbd5e1',
  '--text-muted': '#94a3b8',
  '--text-disabled': '#64748b',
  '--border-subtle': 'rgba(255, 255, 255, 0.06)',
  '--border-default': 'rgba(255, 255, 255, 0.1)',
  '--border-strong': 'rgba(255, 255, 255, 0.15)',
  '--border-focus': '#00d4ff',
  '--severity-critical': '#ef4444',
  '--severity-critical-bg': 'rgba(239, 68, 68, 0.12)',
  '--severity-high': '#f97316',
  '--severity-high-bg': 'rgba(249, 115, 22, 0.12)',
  '--severity-medium': '#f59e0b',
  '--severity-medium-bg': 'rgba(245, 158, 11, 0.12)',
  '--severity-low': '#22c55e',
  '--severity-low-bg': 'rgba(34, 197, 94, 0.12)',
  '--severity-info': '#3b82f6',
  '--severity-info-bg': 'rgba(59, 130, 246, 0.12)',
  '--primary': '#00d4ff',
  '--primary-hover': '#00b8e6',
  '--primary-muted': 'rgba(0, 212, 255, 0.15)',
  '--secondary': '#8b5cf6',
  '--secondary-hover': '#7c3aed',
  '--success': '#22c55e',
  '--success-bg': 'rgba(34, 197, 94, 0.12)',
  '--warning': '#f59e0b',
  '--warning-bg': 'rgba(245, 158, 11, 0.12)',
  '--danger': '#ef4444',
  '--danger-bg': 'rgba(239, 68, 68, 0.12)',
  '--info': '#3b82f6',
  '--info-bg': 'rgba(59, 130, 246, 0.12)',
  '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.4)',
  '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.4)',
  '--shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.5)',
  '--shadow-glow': '0 0 20px rgba(0, 212, 255, 0.2)',
  '--focus-ring': '0 0 0 2px var(--primary-muted)',
  '--transition-fast': '150ms ease',
  '--transition-base': '200ms ease',
  '--transition-slow': '300ms ease',
};

@customElement('sc-unified-security-dashboard')
export class ScUnifiedSecurityDashboard extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: var(--bg-base, #0a0f1a);
      color: var(--text-primary, #f8fafc);
      min-height: 100vh;
      box-sizing: border-box;
    }

    .skip-link {
      position: absolute;
      top: -100px;
      left: 16px;
      z-index: 10000;
      padding: 12px 24px;
      background: var(--primary, #00d4ff);
      color: var(--bg-base, #0a0f1a);
      font-weight: 600;
      border-radius: 0 0 8px 8px;
      text-decoration: none;
      transition: top 150ms ease;
    }
    .skip-link:focus { top: 0; outline: none; }

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

    .dashboard {
      display: grid;
      grid-template-columns: 280px 1fr 320px;
      grid-template-rows: auto 1fr auto;
      gap: 16px;
      padding: 16px;
      min-height: 100vh;
      box-sizing: border-box;
    }

    .header {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      background: var(--bg-primary, #1e293b);
      border: 1px solid var(--border-default, rgba(255, 255, 255, 0.1));
      border-radius: 12px;
    }

    .logo { display: flex; align-items: center; gap: 12px; }
    .logo-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--primary, #00d4ff) 0%, var(--secondary, #8b5cf6) 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
    }
    .logo-title { font-size: 22px; font-weight: 800; color: var(--primary, #00d4ff); letter-spacing: -0.02em; }
    .logo-subtitle { font-size: 11px; color: var(--text-muted, #94a3b8); text-transform: uppercase; letter-spacing: 0.1em; }

    .header-center { display: flex; align-items: center; gap: 24px; }

    .live-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(34, 197, 94, 0.15);
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      color: var(--success, #22c55e);
    }
    .live-dot {
      width: 8px;
      height: 8px;
      background: var(--success, #22c55e);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

    .time-display { font-family: 'SF Mono', 'Monaco', monospace; font-size: 14px; color: var(--text-muted, #94a3b8); }
    .header-actions { display: flex; align-items: center; gap: 12px; }

    .btn {
      padding: 8px 16px;
      border: 1px solid var(--border-default, rgba(255, 255, 255, 0.1));
      border-radius: 8px;
      background: var(--bg-secondary, #1e293b);
      color: var(--text-secondary, #cbd5e1);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 150ms ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn:hover { border-color: var(--primary, #00d4ff); color: var(--primary, #00d4ff); background: var(--primary-muted, rgba(0, 212, 255, 0.15)); }
    .btn:focus-visible { outline: 2px solid var(--primary, #00d4ff); outline-offset: 2px; }
    .btn-primary { background: var(--primary, #00d4ff); border-color: var(--primary, #00d4ff); color: #0a0f1a; }
    .btn-primary:hover { background: var(--primary-hover, #00b8e6); border-color: var(--primary-hover, #00b8e6); }

    .sidebar { display: flex; flex-direction: column; gap: 8px; padding: 16px; background: var(--bg-primary, #1e293b); border: 1px solid var(--border-default, rgba(255, 255, 255, 0.1)); border-radius: 12px; overflow-y: auto; }
    .sidebar-section { margin-bottom: 16px; }
    .sidebar-title { font-size: 10px; font-weight: 600; color: var(--text-muted, #94a3b8); text-transform: uppercase; letter-spacing: 0.08em; padding: 8px 12px; margin-bottom: 4px; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; cursor: pointer; transition: all 150ms ease; text-decoration: none; color: var(--text-secondary, #cbd5e1); font-size: 13px; font-weight: 500; }
    .nav-item:hover { background: var(--bg-secondary, #1e293b); color: var(--text-primary, #f8fafc); }
    .nav-item:focus-visible { outline: 2px solid var(--primary, #00d4ff); outline-offset: -2px; }
    .nav-item.active { background: var(--primary-muted, rgba(0, 212, 255, 0.15)); color: var(--primary, #00d4ff); border-left: 3px solid var(--primary, #00d4ff); }
    .nav-icon { font-size: 18px; width: 24px; text-align: center; }
    .nav-badge { margin-left: auto; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; background: var(--danger, #ef4444); color: white; }
    .nav-badge.success { background: var(--success, #22c55e); }
    .nav-badge.warning { background: var(--warning, #f59e0b); }
    .nav-badge.info { background: var(--info, #3b82f6); }

    .main-content { display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }

    .metrics-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
    .metric-card { background: var(--bg-primary, #1e293b); border: 1px solid var(--border-default, rgba(255, 255, 255, 0.1)); border-radius: 12px; padding: 16px; position: relative; overflow: hidden; transition: all 200ms ease; }
    .metric-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--metric-color, var(--primary, #00d4ff)); }
    .metric-card:hover { border-color: var(--primary, #00d4ff); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4); }
    .metric-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
    .metric-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; background: var(--primary-muted, rgba(0, 212, 255, 0.15)); }
    .metric-trend { font-size: 11px; padding: 3px 8px; border-radius: 6px; font-weight: 600; }
    .metric-trend.up { background: rgba(239, 68, 68, 0.12); color: var(--danger, #ef4444); }
    .metric-trend.down { background: rgba(34, 197, 94, 0.12); color: var(--success, #22c55e); }
    .metric-trend.stable { background: rgba(59, 130, 246, 0.12); color: var(--info, #3b82f6); }
    .metric-value { font-size: 28px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
    .metric-value.critical { color: var(--danger, #ef4444); }
    .metric-value.high { color: var(--warning, #f59e0b); }
    .metric-value.good { color: var(--success, #22c55e); }
    .metric-value.info { color: var(--info, #3b82f6); }
    .metric-label { font-size: 12px; color: var(--text-muted, #94a3b8); }

    .panels-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .panel { background: var(--bg-primary, #1e293b); border: 1px solid var(--border-default, rgba(255, 255, 255, 0.1)); border-radius: 12px; overflow: hidden; }
    .panel.full-width { grid-column: 1 / -1; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); background: var(--bg-secondary, #1e293b); }
    .panel-title { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: var(--text-primary, #f8fafc); text-transform: uppercase; letter-spacing: 0.05em; }
    .panel-badge { font-size: 10px; padding: 4px 10px; border-radius: 6px; font-weight: 700; }
    .panel-badge.critical { background: rgba(239, 68, 68, 0.12); color: var(--danger, #ef4444); }
    .panel-badge.warning { background: rgba(245, 158, 11, 0.12); color: var(--warning, #f59e0b); }
    .panel-badge.success { background: rgba(34, 197, 94, 0.12); color: var(--success, #22c55e); }
    .panel-badge.info { background: rgba(59, 130, 246, 0.12); color: var(--info, #3b82f6); }
    .panel-content { padding: 16px; }

    .surface-list { display: flex; flex-direction: column; gap: 8px; }
    .surface-item { display: flex; align-items: center; gap: 14px; padding: 14px; background: var(--bg-secondary, #1e293b); border-radius: 8px; cursor: pointer; transition: all 150ms ease; }
    .surface-item:hover { background: var(--bg-tertiary, #2d3748); transform: translateX(4px); }
    .surface-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; background: var(--primary-muted, rgba(0, 212, 255, 0.15)); }
    .surface-info { flex: 1; }
    .surface-name { font-size: 14px; font-weight: 600; color: var(--text-primary, #f8fafc); margin-bottom: 2px; }
    .surface-detail { font-size: 12px; color: var(--text-muted, #94a3b8); }
    .risk-badge { font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; }
    .risk-badge.critical { background: rgba(239, 68, 68, 0.12); color: var(--danger, #ef4444); }
    .risk-badge.high { background: rgba(249, 115, 22, 0.12); color: var(--warning, #f59e0b); }
    .risk-badge.medium { background: rgba(59, 130, 246, 0.12); color: var(--info, #3b82f6); }
    .risk-badge.low { background: rgba(34, 197, 94, 0.12); color: var(--success, #22c55e); }

    .vuln-list { display: flex; flex-direction: column; gap: 8px; }
    .vuln-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-secondary, #1e293b); border-radius: 8px; border-left: 3px solid; }
    .vuln-item.critical { border-color: var(--danger, #ef4444); }
    .vuln-item.high { border-color: var(--warning, #f59e0b); }
    .vuln-item.medium { border-color: var(--info, #3b82f6); }
    .sev-badge { font-size: 9px; font-weight: 800; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; }
    .sev-badge.critical { background: rgba(239, 68, 68, 0.12); color: var(--danger, #ef4444); }
    .sev-badge.high { background: rgba(249, 115, 22, 0.12); color: var(--warning, #f59e0b); }
    .sev-badge.medium { background: rgba(59, 130, 246, 0.12); color: var(--info, #3b82f6); }
    .vuln-title { font-size: 13px; font-weight: 600; color: var(--text-primary, #f8fafc); }
    .vuln-meta { font-size: 11px; color: var(--text-muted, #94a3b8); }
    .status-badge { font-size: 10px; font-weight: 600; padding: 4px 10px; border-radius: 6px; margin-left: auto; }
    .status-badge.open { background: rgba(239, 68, 68, 0.12); color: var(--danger, #ef4444); }
    .status-badge.progress { background: rgba(59, 130, 246, 0.12); color: var(--info, #3b82f6); }
    .status-badge.resolved { background: rgba(34, 197, 94, 0.12); color: var(--success, #22c55e); }

    .compliance-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .compliance-card { padding: 16px; background: var(--bg-secondary, #1e293b); border-radius: 10px; text-align: center; }
    .compliance-framework { font-size: 12px; font-weight: 700; color: var(--text-muted, #94a3b8); text-transform: uppercase; margin-bottom: 8px; }
    .compliance-score { font-size: 24px; font-weight: 800; }
    .compliance-score.excellent { color: var(--success, #22c55e); }
    .compliance-score.good { color: var(--primary, #00d4ff); }
    .compliance-score.warning { color: var(--warning, #f59e0b); }
    .compliance-score.poor { color: var(--danger, #ef4444); }
    .compliance-status { font-size: 11px; font-weight: 600; margin-top: 4px; }
    .compliance-status.pass { color: var(--success, #22c55e); }
    .compliance-status.partial { color: var(--warning, #f59e0b); }

    .module-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
    .module-btn { padding: 16px 8px; background: var(--bg-secondary, #1e293b); border: 1px solid var(--border-default, rgba(255, 255, 255, 0.1)); border-radius: 10px; text-align: center; cursor: pointer; transition: all 150ms ease; }
    .module-btn:hover { border-color: var(--primary, #00d4ff); background: var(--primary-muted, rgba(0, 212, 255, 0.15)); transform: translateY(-2px); }
    .module-btn:focus-visible { outline: 2px solid var(--primary, #00d4ff); outline-offset: 2px; }
    .module-icon { font-size: 24px; margin-bottom: 8px; }
    .module-name { font-size: 10px; color: var(--text-muted, #94a3b8); line-height: 1.2; }

    .right-sidebar { display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }

    .timeline { position: relative; padding-left: 24px; }
    .timeline::before { content: ''; position: absolute; left: 8px; top: 0; bottom: 0; width: 2px; background: linear-gradient(to bottom, var(--primary, #00d4ff), var(--border-default, rgba(255, 255, 255, 0.1))); }
    .timeline-item { position: relative; padding: 14px; background: var(--bg-secondary, #1e293b); border-radius: 10px; margin-bottom: 12px; }
    .timeline-item::before { content: ''; position: absolute; left: -20px; top: 18px; width: 14px; height: 14px; border-radius: 50%; background: var(--bg-primary, #1e293b); border: 3px solid; }
    .timeline-item.critical::before { border-color: var(--danger, #ef4444); }
    .timeline-item.high::before { border-color: var(--warning, #f59e0b); }
    .timeline-item.medium::before { border-color: var(--info, #3b82f6); }
    .timeline-item.low::before { border-color: var(--success, #22c55e); }
    .timeline-time { font-size: 11px; color: var(--text-muted, #94a3b8); margin-bottom: 4px; font-family: monospace; }
    .timeline-title { font-size: 13px; font-weight: 600; color: var(--text-primary, #f8fafc); margin-bottom: 6px; }
    .timeline-tags { display: flex; gap: 6px; }
    .timeline-tag { font-size: 10px; padding: 3px 8px; border-radius: 4px; background: var(--bg-tertiary, #2d3748); color: var(--text-muted, #94a3b8); }

    .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .kpi-card { padding: 14px; background: var(--bg-secondary, #1e293b); border-radius: 10px; text-align: center; }
    .kpi-icon { font-size: 20px; margin-bottom: 6px; }
    .kpi-value { font-size: 20px; font-weight: 800; color: var(--text-primary, #f8fafc); }
    .kpi-label { font-size: 10px; color: var(--text-muted, #94a3b8); }

    .status-bar { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; background: var(--bg-primary, #1e293b); border: 1px solid var(--border-default, rgba(255, 255, 255, 0.1)); border-radius: 10px; font-size: 12px; }
    .status-group { display: flex; align-items: center; gap: 16px; }
    .status-item { display: flex; align-items: center; gap: 8px; color: var(--text-muted, #94a3b8); }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; }
    .status-dot.online { background: var(--success, #22c55e); }
    .status-dot.warning { background: var(--warning, #f59e0b); }
    .status-dot.error { background: var(--danger, #ef4444); }

    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: var(--bg-secondary, #1e293b); border-radius: 4px; }
    ::-webkit-scrollbar-thumb { background: var(--border-strong, rgba(255, 255, 255, 0.15)); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--text-muted, #94a3b8); }

    @media (max-width: 1600px) { .dashboard { grid-template-columns: 240px 1fr 280px; } .metrics-row { grid-template-columns: repeat(3, 1fr); } .module-grid { grid-template-columns: repeat(4, 1fr); } }
    @media (max-width: 1200px) { .dashboard { grid-template-columns: 1fr; } .sidebar, .right-sidebar { display: none; } .panels-grid { grid-template-columns: 1fr; } }
    @media (max-width: 768px) { .metrics-row { grid-template-columns: repeat(2, 1fr); } .compliance-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
  `;

  @state() private currentTime = new Date();
  @state() private activeModule = 'overview';
  @state() private metrics: any[] = [];
  @state() private attackSurface: any[] = [];
  @state() private vulnerabilities: any[] = [];
  @state() private compliance: any[] = [];
  @state() private timeline: any[] = [];

  private _timeInterval: number | null = null;

  private _navItems = [
    { id: 'overview', name: '总览', icon: '🏠', section: 'main' },
    { id: 'attack-surface', name: '攻击面管理', icon: '🎯', badge: '5', section: 'main' },
    { id: 'vulnerability', name: '漏洞生命周期', icon: '🔓', badge: '12', section: 'main' },
    { id: 'threat-hunting', name: '威胁狩猎', icon: '🔍', section: 'main' },
    { id: 'compliance', name: '合规审计', icon: '📋', badge: '3', section: 'main' },
    { id: 'iam', name: '身份安全', icon: '🔐', section: 'main' },
    { id: 'dlp', name: '数据防泄', icon: '🛡️', badge: '2', section: 'main' },
    { id: 'network', name: '网络安全', icon: '🌐', section: 'main' },
    { id: 'soc', name: 'SOC运营', icon: '⚡', section: 'ops' },
    { id: 'training', name: '安全培训', icon: '📚', section: 'ops' },
    { id: 'vendor', name: '供应商风险', icon: '🔗', section: 'ops' },
    { id: 'policy', name: '策略管理', icon: '📜', section: 'ops' },
    { id: 'remediation', name: '修复跟踪', icon: '🔧', badge: '8', section: 'ops' },
    { id: 'roi', name: 'ROI计算', icon: '💰', section: 'ops' },
    { id: 'pentest', name: '渗透测试', icon: '🎯', section: 'ops' },
    { id: 'threat-model', name: '威胁建模', icon: '🏗️', section: 'ops' },
  ];

  connectedCallback() {
    super.connectedCallback();
    this._loadData();
    this._timeInterval = window.setInterval(() => { this.currentTime = new Date(); }, 1000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._timeInterval) clearInterval(this._timeInterval);
  }

  private _loadData() {
    this.metrics = [
      { id: 'score', label: '安全评分', value: 78, trend: 'down', trendValue: 2, severity: 'info', icon: '📊' },
      { id: 'events', label: '活跃威胁', value: 12, trend: 'up', trendValue: 3, severity: 'critical', icon: '🚨' },
      { id: 'vulns', label: '待修复漏洞', value: 47, trend: 'down', trendValue: 5, severity: 'warning', icon: '🔓' },
      { id: 'compliance', label: '合规达成率', value: 89, unit: '%', trend: 'up', trendValue: 3, severity: 'good', icon: '✓' },
      { id: 'assets', label: '受保护资产', value: '1,247', trend: 'stable', trendValue: 0, severity: 'info', icon: '🛡️' },
      { id: 'iam', label: '身份风险', value: 3, trend: 'down', trendValue: 1, severity: 'warning', icon: '🔐' },
    ];
    this.attackSurface = [
      { name: 'Web Applications', risk: 'critical', count: 23, icon: '🌐' },
      { name: 'API Endpoints', risk: 'high', count: 156, icon: '🔗' },
      { name: 'Cloud Workloads', risk: 'medium', count: 89, icon: '☁️' },
      { name: 'Endpoints', risk: 'low', count: 2340, icon: '💻' },
      { name: 'Network Perimeters', risk: 'medium', count: 12, icon: '🔧' },
    ];
    this.vulnerabilities = [
      { cve: 'CVE-2024-21762', title: 'FortiOS RCE漏洞', severity: 'critical', status: 'open' },
      { cve: 'CVE-2024-3400', title: 'PAN-OS命令注入', severity: 'high', status: 'progress' },
      { cve: 'Log4j变体', title: 'Log4j新的绕过', severity: 'high', status: 'open' },
      { cve: 'OpenSSL溢出', title: 'OpenSSL缓冲区', severity: 'medium', status: 'progress' },
    ];
    this.compliance = [
      { name: 'SOC 2', score: 92, status: 'compliant' },
      { name: 'GDPR', score: 78, status: 'partial' },
      { name: 'ISO 27001', score: 88, status: 'compliant' },
      { name: 'PCI-DSS', score: 95, status: 'compliant' },
    ];
    this.timeline = [
      { time: '刚刚', title: '异常登录尝试', source: 'SIEM', severity: 'high', status: '调查中' },
      { time: '30分钟前', title: '数据外泄警报', source: 'DLP', severity: 'medium', status: '待处理' },
      { time: '1小时前', title: '策略违规', source: 'EDR', severity: 'low', status: '已解决' },
      { time: '2小时前', title: '勒索软件警报', source: 'EDR', severity: 'critical', status: '已升级' },
    ];
  }

  private _formatTime(date: Date): string {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }

  private _getScoreClass(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'warning';
    return 'poor';
  }

  private _getMetricColor(severity?: string): string {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'good': return '#22c55e';
      default: return '#3b82f6';
    }
  }

  private _navigate(module: string) {
    this.activeModule = module;
    this.dispatchEvent(new CustomEvent('navigate-module', { detail: { module }, bubbles: true, composed: true }));
  }

  private _getNavSections() {
    return {
      main: this._navItems.filter(i => i.section === 'main'),
      ops: this._navItems.filter(i => i.section === 'ops'),
    };
  }

  render() {
    const highRisk = this.attackSurface.filter(s => s.risk === 'critical' || s.risk === 'high').length;
    const openVulns = this.vulnerabilities.filter(v => v.status === 'open').length;
    const compliantCount = this.compliance.filter(c => c.status === 'compliant').length;
    const sections = this._getNavSections();

    return html`
      <a href="#main-content" class="skip-link">跳转到主要内容</a>
      <div class="sr-only" aria-live="polite">安全仪表板最后更新: ${this._formatTime(this.currentTime)}</div>

      <main class="dashboard" id="main-content" role="main" aria-label="统一安全仪表板">
        <header class="header" role="banner">
          <div class="logo">
            <div class="logo-icon">🛡️</div>
            <div>
              <span class="logo-title">SecuClaw</span>
              <span class="logo-subtitle">安全指挥官</span>
            </div>
          </div>
          <div class="header-center">
            <div class="live-indicator"><span class="live-dot"></span>LIVE</div>
            <span class="time-display" aria-label="当前时间">${this._formatTime(this.currentTime)}</span>
          </div>
          <div class="header-actions">
            <button class="btn" @click=${() => this._navigate('refresh')} aria-label="刷新数据">🔄 刷新</button>
            <button class="btn btn-primary" @click=${() => this._navigate('incident')} aria-label="创建新事件">+ 新建事件</button>
          </div>
        </header>

        <nav class="sidebar" role="navigation" aria-label="安全模块导航">
          <div class="sidebar-section">
            <div class="sidebar-title">核心模块</div>
            ${sections.main.map(item => html`
              <a class="nav-item ${this.activeModule === item.id ? 'active' : ''}" href="#${item.id}" @click=${(e: Event) => { e.preventDefault(); this._navigate(item.id); }} aria-current="${this.activeModule === item.id ? 'page' : 'false'}">
                <span class="nav-icon" aria-hidden="true">${item.icon}</span>
                <span>${item.name}</span>
                ${item.badge ? html`<span class="nav-badge warning">${item.badge}</span>` : ''}
              </a>
            `)}
          </div>
          <div class="sidebar-section">
            <div class="sidebar-title">运营模块</div>
            ${sections.ops.map(item => html`
              <a class="nav-item ${this.activeModule === item.id ? 'active' : ''}" href="#${item.id}" @click=${(e: Event) => { e.preventDefault(); this._navigate(item.id); }} aria-current="${this.activeModule === item.id ? 'page' : 'false'}">
                <span class="nav-icon" aria-hidden="true">${item.icon}</span>
                <span>${item.name}</span>
                ${item.badge ? html`<span class="nav-badge warning">${item.badge}</span>` : ''}
              </a>
            `)}
          </div>
        </nav>

        <div class="main-content">
          <section class="metrics-row" role="region" aria-label="安全指标">
            ${this.metrics.map(m => html`
              <article class="metric-card" style="--metric-color: ${this._getMetricColor(m.severity)}" aria-label="${m.label}: ${m.value}${m.unit || ''}">
                <div class="metric-header">
                  <div class="metric-icon" aria-hidden="true">${m.icon}</div>
                  <span class="metric-trend ${m.trend}">${m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '→'} ${Math.abs(m.trendValue)}</span>
                </div>
                <div class="metric-value ${m.severity}">${m.value}${m.unit || ''}</div>
                <div class="metric-label">${m.label}</div>
              </article>
            `)}
          </section>

          <div class="panels-grid">
            <section class="panel" aria-labelledby="surface-title">
              <div class="panel-header">
                <h2 class="panel-title" id="surface-title">🎯 攻击面概览</h2>
                <span class="panel-badge critical">${highRisk} 高风险</span>
              </div>
              <div class="panel-content">
                <div class="surface-list" role="list">
                  ${this.attackSurface.map(s => html`
                    <div class="surface-item" role="listitem" tabindex="0" @click=${() => this._navigate('attack-surface')} @keypress=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._navigate('attack-surface'); }}>
                      <div class="surface-icon" aria-hidden="true">${s.icon}</div>
                      <div class="surface-info">
                        <div class="surface-name">${s.name}</div>
                        <div class="surface-detail">${s.count} 个暴露点</div>
                      </div>
                      <span class="risk-badge ${s.risk}">${s.risk.toUpperCase()}</span>
                    </div>
                  `)}
                </div>
              </div>
            </section>

            <section class="panel" aria-labelledby="vuln-title">
              <div class="panel-header">
                <h2 class="panel-title" id="vuln-title">🔓 漏洞生命周期</h2>
                <span class="panel-badge warning">${openVulns} 待处理</span>
              </div>
              <div class="panel-content">
                <div class="vuln-list" role="list">
                  ${this.vulnerabilities.map(v => html`
                    <div class="vuln-item ${v.severity}" role="listitem">
                      <span class="sev-badge ${v.severity}">${v.severity}</span>
                      <div>
                        <div class="vuln-title">${v.cve}</div>
                        <div class="vuln-meta">${v.title}</div>
                      </div>
                      <span class="status-badge ${v.status === 'open' ? 'open' : v.status === 'progress' ? 'progress' : 'resolved'}">${v.status === 'open' ? '待修复' : v.status === 'progress' ? '修复中' : '已修复'}</span>
                    </div>
                  `)}
                </div>
              </div>
            </section>

            <section class="panel" aria-labelledby="compliance-title">
              <div class="panel-header">
                <h2 class="panel-title" id="compliance-title">📋 合规状态</h2>
                <span class="panel-badge success">${compliantCount}/${this.compliance.length} 达标</span>
              </div>
              <div class="panel-content">
                <div class="compliance-grid" role="list">
                  ${this.compliance.map(c => html`
                    <div class="compliance-card" role="listitem">
                      <div class="compliance-framework">${c.name}</div>
                      <div class="compliance-score ${this._getScoreClass(c.score)}">${c.score}%</div>
                      <div class="compliance-status ${c.status === 'compliant' ? 'pass' : 'partial'}">${c.status === 'compliant' ? '✓ 达标' : '~ 部分'}</div>
                    </div>
                  `)}
                </div>
              </div>
            </section>

            <section class="panel" aria-labelledby="asset-title">
              <div class="panel-header">
                <h2 class="panel-title" id="asset-title">🗄️ 资产概览</h2>
                <span class="panel-badge info">总计 2,847</span>
              </div>
              <div class="panel-content">
                <div class="kpi-grid">
                  <div class="kpi-card"><div class="kpi-icon">🖥️</div><div class="kpi-value">156</div><div class="kpi-label">服务器</div></div>
                  <div class="kpi-card"><div class="kpi-icon">💻</div><div class="kpi-value">2,340</div><div class="kpi-label">工作站</div></div>
                  <div class="kpi-card"><div class="kpi-icon">☁️</div><div class="kpi-value">289</div><div class="kpi-label">云实例</div></div>
                  <div class="kpi-card"><div class="kpi-icon">🔧</div><div class="kpi-value">62</div><div class="kpi-label">IoT设备</div></div>
                </div>
              </div>
            </section>

            <section class="panel full-width" aria-labelledby="modules-title">
              <div class="panel-header">
                <h2 class="panel-title" id="modules-title">🧩 安全模块快速访问</h2>
              </div>
              <div class="panel-content">
                <nav class="module-grid" aria-label="安全模块">
                  ${this._navItems.map(m => html`
                    <button class="module-btn" @click=${() => this._navigate(m.id)} aria-label="${m.name}${m.badge ? `, ${m.badge}个待处理` : ''}">
                      <div class="module-icon" aria-hidden="true">${m.icon}</div>
                      <div class="module-name">${m.name}</div>
                    </button>
                  `)}
                </nav>
              </div>
            </section>
          </div>
        </div>

        <aside class="right-sidebar" role="complementary" aria-label="事件时间线和KPI">
          <section class="panel" aria-labelledby="incident-title">
            <div class="panel-header"><h2 class="panel-title" id="incident-title">⚡ 事件时间线</h2></div>
            <div class="panel-content">
              <div class="timeline" role="list" aria-label="最近事件">
                ${this.timeline.map(t => html`
                  <div class="timeline-item ${t.severity}" role="listitem">
                    <div class="timeline-time">${t.time}</div>
                    <div class="timeline-title">${t.title}</div>
                    <div class="timeline-tags"><span class="timeline-tag">${t.source}</span><span class="timeline-tag">${t.status}</span></div>
                  </div>
                `)}
              </div>
            </div>
          </section>

          <section class="panel" aria-labelledby="kpi-title">
            <div class="panel-header"><h2 class="panel-title" id="kpi-title">📊 安全KPI</h2></div>
            <div class="panel-content">
              <div class="kpi-grid">
                <div class="kpi-card"><div class="kpi-icon">⏱️</div><div class="kpi-value">2.3h</div><div class="kpi-label">平均响应</div></div>
                <div class="kpi-card"><div class="kpi-icon">📈</div><div class="kpi-value">94%</div><div class="kpi-label">漏洞修复率</div></div>
                <div class="kpi-card"><div class="kpi-icon">🔍</div><div class="kpi-value">156</div><div class="kpi-label">月扫描次数</div></div>
                <div class="kpi-card"><div class="kpi-icon">✓</div><div class="kpi-value">23</div><div class="kpi-label">合规项达标</div></div>
              </div>
            </div>
          </section>
        </aside>

        <footer class="status-bar" role="contentinfo">
          <div class="status-group">
            <div class="status-item"><span class="status-dot online" aria-hidden="true"></span><span>系统正常</span></div>
            <div class="status-item"><span class="status-dot online" aria-hidden="true"></span><span>SIEM 已连接</span></div>
            <div class="status-item"><span class="status-dot warning" aria-hidden="true"></span><span>3 服务待优化</span></div>
          </div>
          <div>SecuClaw v2.0 | ${this._formatTime(this.currentTime)}</div>
        </footer>
      </main>
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'sc-unified-security-dashboard': ScUnifiedSecurityDashboard; } }

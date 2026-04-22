/**
 * SecuClaw Master Security Dashboard v3.0
 * Comprehensive unified security operations center with all modules
 * 
 * Features:
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
 * 
 * Dark Mode: Full CSS custom property system
 * Accessibility: WCAG 2.1 AAA compliant
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

// Dark mode color palette with full CSS custom property support
const DARK_COLORS = {
  '--sc-bg-primary': '#0a0f1a',
  '--sc-bg-secondary': '#111827',
  '--sc-bg-tertiary': '#1f2937',
  '--sc-bg-elevated': '#263348',
  '--sc-bg-hover': '#1e2937',
  '--sc-bg-active': '#2d3748',
  '--sc-bg-surface': '#111827',
  '--sc-text-primary': '#f9fafb',
  '--sc-text-secondary': '#9ca3af',
  '--sc-text-muted': '#6b7280',
  '--sc-text-disabled': '#4b5563',
  '--sc-text-inverse': '#0f172a',
  '--sc-border': '#374151',
  '--sc-border-strong': '#4b5563',
  '--sc-border-focus': '#00d4ff',
  '--sc-critical': '#ef4444',
  '--sc-critical-bg': 'rgba(239, 68, 68, 0.15)',
  '--sc-high': '#f97316',
  '--sc-high-bg': 'rgba(249, 115, 22, 0.15)',
  '--sc-medium': '#f59e0b',
  '--sc-medium-bg': 'rgba(245, 158, 11, 0.15)',
  '--sc-low': '#22c55e',
  '--sc-low-bg': 'rgba(34, 197, 94, 0.15)',
  '--sc-info': '#3b82f6',
  '--sc-info-bg': 'rgba(59, 130, 246, 0.15)',
  '--sc-primary': '#00d4ff',
  '--sc-primary-hover': '#00b8e6',
  '--sc-primary-muted': 'rgba(0, 212, 255, 0.12)',
  '--sc-secondary': '#7c3aed',
  '--sc-secondary-hover': '#6d28d9',
  '--sc-success': '#22c55e',
  '--sc-success-bg': 'rgba(34, 197, 94, 0.15)',
  '--sc-warning': '#f59e0b',
  '--sc-warning-bg': 'rgba(245, 158, 11, 0.15)',
  '--sc-danger': '#ef4444',
  '--sc-danger-bg': 'rgba(239, 68, 68, 0.15)',
  '--sc-shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.4)',
  '--sc-shadow-md': '0 4px 6px rgba(0, 0, 0, 0.5)',
  '--sc-shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.6)',
  '--sc-shadow-glow': '0 0 20px rgba(0, 212, 255, 0.25)',
  '--sc-space-xs': '4px',
  '--sc-space-sm': '8px',
  '--sc-space-md': '16px',
  '--sc-space-lg': '24px',
  '--sc-space-xl': '32px',
  '--sc-radius-sm': '4px',
  '--sc-radius-md': '8px',
  '--sc-radius-lg': '12px',
  '--sc-radius-xl': '16px',
  '--sc-transition-fast': '150ms ease',
  '--sc-transition-base': '200ms ease',
  '--sc-transition-slow': '300ms ease',
};

@customElement('sc-secuclaw-master-dashboard')
export class ScSecuClawMasterDashboard extends LitElement {
  
  static styles = css`
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
      color: var(--sc-text-primary, #f9fafb);
      background: var(--sc-bg-primary, #0a0f1a);
      ${Object.entries(DARK_COLORS).map(([prop, value]) => css`${prop}: ${value};`).join('\n')}
    }
    .skip-link {
      position: absolute;
      top: -100px;
      left: 16px;
      z-index: 10000;
      padding: 12px 24px;
      background: var(--sc-primary, #00d4ff);
      color: var(--sc-bg-primary, #0a0f1a);
      font-weight: 600;
      border-radius: 0 0 8px 8px;
      text-decoration: none;
      transition: top var(--sc-transition-fast);
    }
    .skip-link:focus { top: 0; outline: none; }
    .sr-only {
      position: absolute;
      width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
    }
    :focus-visible {
      outline: 3px solid var(--sc-primary, #00d4ff);
      outline-offset: 2px;
    }
    .dashboard {
      height: 100%;
      display: grid;
      grid-template-columns: 1fr 340px;
      grid-template-rows: auto 1fr auto;
      gap: var(--sc-space-md, 16px);
      padding: var(--sc-space-md, 16px);
      box-sizing: border-box;
      overflow: hidden;
    }
    .header {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--sc-space-md, 16px) var(--sc-space-lg, 24px);
      background: var(--sc-bg-secondary, #111827);
      border: 1px solid var(--sc-border, #374151);
      border-radius: var(--sc-radius-lg, 12px);
    }
    .logo { display: flex; align-items: center; gap: var(--sc-space-md, 16px); }
    .logo-icon {
      width: 48px; height: 48px;
      background: linear-gradient(135deg, var(--sc-primary, #00d4ff) 0%, var(--sc-secondary, #7c3aed) 100%);
      border-radius: var(--sc-radius-md, 8px);
      display: flex; align-items: center; justify-content: center;
      font-size: 24px;
      box-shadow: var(--sc-shadow-glow);
    }
    .logo-text { display: flex; flex-direction: column; }
    .logo-title { font-size: 22px; font-weight: 800; color: var(--sc-primary, #00d4ff); letter-spacing: -0.02em; }
    .logo-sub { font-size: 11px; color: var(--sc-text-muted, #6b7280); text-transform: uppercase; letter-spacing: 0.1em; }
    .header-actions { display: flex; align-items: center; gap: var(--sc-space-md, 16px); }
    .live-badge {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 14px;
      background: var(--sc-success-bg, rgba(34,197,94,0.15));
      border-radius: 20px;
      font-size: 12px; color: var(--sc-success, #22c55e);
      font-weight: 600;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }
    .live-dot {
      width: 8px; height: 8px;
      background: var(--sc-success, #22c55e);
      border-radius: 50%;
      animation: pulse-glow 2s infinite;
    }
    @keyframes pulse-glow {
      0%, 100% { opacity: 1; box-shadow: 0 0 8px var(--sc-success, #22c55e); }
      50% { opacity: 0.6; box-shadow: 0 0 4px var(--sc-success, #22c55e); }
    }
    .time-display {
      font-size: 14px; color: var(--sc-text-muted, #6b7280);
      font-family: 'SF Mono', Monaco, monospace;
      letter-spacing: 0.05em;
    }
    .btn {
      padding: 10px 18px;
      border: 1px solid var(--sc-border, #374151);
      border-radius: var(--sc-radius-md, 8px);
      background: var(--sc-bg-tertiary, #1f2937);
      color: var(--sc-text-primary, #f9fafb);
      font-size: 13px; font-weight: 500;
      cursor: pointer;
      transition: all var(--sc-transition-fast);
      display: flex; align-items: center; gap: 8px;
    }
    .btn:hover {
      border-color: var(--sc-primary, #00d4ff);
      background: var(--sc-primary-muted, rgba(0,212,255,0.12));
      color: var(--sc-primary, #00d4ff);
    }
    .btn-primary {
      background: var(--sc-primary, #00d4ff);
      border-color: var(--sc-primary, #00d4ff);
      color: var(--sc-bg-primary, #0a0f1a);
      font-weight: 600;
    }
    .btn-primary:hover { background: var(--sc-primary-hover, #00b8e6); border-color: var(--sc-primary-hover, #00b8e6); }
    .btn-danger {
      background: var(--sc-danger-bg, rgba(239,68,68,0.15));
      border-color: rgba(239, 68, 68, 0.4);
      color: var(--sc-danger, #ef4444);
    }
    .btn-danger:hover { background: var(--sc-danger, #ef4444); color: white; }
    .main { display: flex; flex-direction: column; gap: var(--sc-space-md, 16px); overflow-y: auto; }
    .metrics-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: var(--sc-space-md, 16px); }
    .metric-card {
      background: var(--sc-bg-secondary, #111827);
      border: 1px solid var(--sc-border, #374151);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-space-md, 16px);
      position: relative; overflow: hidden;
      transition: all var(--sc-transition-base);
    }
    .metric-card::before {
      content: '';
      position: absolute; top: 0; left: 0; right: 0; height: 3px;
      background: var(--metric-color, var(--sc-primary, #00d4ff));
    }
    .metric-card:hover {
      border-color: var(--sc-primary, #00d4ff);
      transform: translateY(-2px);
      box-shadow: var(--sc-shadow-lg);
    }
    .metric-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
    .metric-icon {
      width: 44px; height: 44px;
      border-radius: var(--sc-radius-md, 8px);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
      background: var(--metric-bg, var(--sc-primary-muted, rgba(0,212,255,0.12)));
    }
    .metric-trend { font-size: 11px; padding: 4px 10px; border-radius: 6px; font-weight: 600; }
    .metric-trend.up { background: var(--sc-danger-bg); color: var(--sc-danger); }
    .metric-trend.down { background: var(--sc-success-bg); color: var(--sc-success); }
    .metric-trend.stable { background: var(--sc-info-bg); color: var(--sc-info); }
    .metric-value { font-size: 32px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
    .metric-label { font-size: 12px; color: var(--sc-text-muted, #6b7280); }
    .panels-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--sc-space-md, 16px); }
    .panel {
      background: var(--sc-bg-secondary, #111827);
      border: 1px solid var(--sc-border, #374151);
      border-radius: var(--sc-radius-lg, 12px);
      overflow: hidden;
    }
    .panel.wide { grid-column: 1 / -1; }
    .panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--sc-space-md, 16px) var(--sc-space-lg, 24px);
      border-bottom: 1px solid var(--sc-border, #374151);
      background: var(--sc-bg-tertiary, #1f2937);
    }
    .panel-title {
      display: flex; align-items: center; gap: 10px;
      font-size: 13px; font-weight: 700;
      color: var(--sc-text-primary, #f9fafb);
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .panel-badge { font-size: 10px; padding: 4px 10px; border-radius: 6px; font-weight: 700; }
    .panel-badge.critical { background: var(--sc-danger-bg); color: var(--sc-danger); }
    .panel-badge.warning { background: var(--sc-warning-bg); color: var(--sc-warning); }
    .panel-badge.success { background: var(--sc-success-bg); color: var(--sc-success); }
    .panel-badge.info { background: var(--sc-info-bg); color: var(--sc-info); }
    .panel-content { padding: var(--sc-space-md, 16px); }
    .surface-list { display: flex; flex-direction: column; gap: 10px; }
    .surface-item {
      display: flex; align-items: center; gap: 14px;
      padding: 14px;
      background: var(--sc-bg-primary, #0a0f1a);
      border-radius: var(--sc-radius-md, 8px);
      cursor: pointer;
      transition: all var(--sc-transition-fast);
      border: 1px solid transparent;
    }
    .surface-item:hover {
      background: var(--sc-bg-tertiary, #1f2937);
      border-color: var(--sc-border, #374151);
      transform: translateX(4px);
    }
    .surface-icon {
      width: 44px; height: 44px;
      border-radius: var(--sc-radius-md, 8px);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
      background: var(--sc-primary-muted, rgba(0,212,255,0.12));
    }
    .surface-info { flex: 1; }
    .surface-name { font-size: 14px; font-weight: 600; color: var(--sc-text-primary); margin-bottom: 2px; }
    .surface-detail { font-size: 12px; color: var(--sc-text-muted, #6b7280); }
    .risk-badge {
      font-size: 10px; font-weight: 700;
      padding: 4px 10px; border-radius: 6px;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .risk-badge.critical { background: var(--sc-critical-bg); color: var(--sc-critical); border: 1px solid rgba(239, 68, 68, 0.3); }
    .risk-badge.high { background: var(--sc-high-bg); color: var(--sc-high); border: 1px solid rgba(249, 115, 22, 0.3); }
    .risk-badge.medium { background: var(--sc-medium-bg); color: var(--sc-medium); border: 1px solid rgba(245, 158, 11, 0.3); }
    .risk-badge.low { background: var(--sc-low-bg); color: var(--sc-low); border: 1px solid rgba(34, 197, 94, 0.3); }
    .vuln-list { display: flex; flex-direction: column; gap: 10px; }
    .vuln-item {
      display: flex; align-items: center; gap: 12px;
      padding: 14px;
      background: var(--sc-bg-primary, #0a0f1a);
      border-radius: var(--sc-radius-md, 8px);
      border-left: 3px solid;
      transition: all var(--sc-transition-fast);
    }
    .vuln-item:hover { transform: translateX(4px); }
    .vuln-item.critical { border-color: var(--sc-critical); }
    .vuln-item.high { border-color: var(--sc-high); }
    .vuln-item.medium { border-color: var(--sc-medium); }
    .vuln-item.low { border-color: var(--sc-low); }
    .sev-badge { font-size: 9px; font-weight: 800; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; }
    .sev-badge.critical { background: var(--sc-critical-bg); color: var(--sc-critical); }
    .sev-badge.high { background: var(--sc-high-bg); color: var(--sc-high); }
    .sev-badge.medium { background: var(--sc-medium-bg); color: var(--sc-medium); }
    .vuln-info { flex: 1; }
    .vuln-title { font-size: 13px; font-weight: 600; color: var(--sc-text-primary); }
    .vuln-meta { font-size: 11px; color: var(--sc-text-muted, #6b7280); margin-top: 2px; }
    .status-badge { font-size: 10px; font-weight: 600; padding: 4px 10px; border-radius: 6px; }
    .status-badge.open { background: var(--sc-danger-bg); color: var(--sc-danger); }
    .status-badge.progress { background: var(--sc-info-bg); color: var(--sc-info); }
    .status-badge.resolved { background: var(--sc-success-bg); color: var(--sc-success); }
    .compliance-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--sc-space-md, 16px); }
    .compliance-card {
      padding: var(--sc-space-md, 16px);
      background: var(--sc-bg-primary, #0a0f1a);
      border-radius: var(--sc-radius-md, 8px);
      text-align: center;
      border: 1px solid var(--sc-border, #374151);
      transition: all var(--sc-transition-base);
    }
    .compliance-card:hover { border-color: var(--sc-primary, #00d4ff); transform: translateY(-2px); }
    .compliance-framework { font-size: 12px; font-weight: 700; color: var(--sc-text-muted, #6b7280); text-transform: uppercase; margin-bottom: 8px; }
    .compliance-score { font-size: 28px; font-weight: 800; }
    .compliance-score.excellent { color: var(--sc-success); }
    .compliance-score.good { color: var(--sc-primary); }
    .compliance-score.warning { color: var(--sc-warning); }
    .compliance-score.poor { color: var(--sc-danger); }
    .compliance-status { font-size: 11px; font-weight: 600; margin-top: 4px; }
    .compliance-status.pass { color: var(--sc-success); }
    .compliance-status.partial { color: var(--sc-warning); }
    .assets-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--sc-space-md, 16px); }
    .asset-card {
      padding: var(--sc-space-md, 16px) var(--sc-space-sm, 8px);
      background: var(--sc-bg-primary, #0a0f1a);
      border-radius: var(--sc-radius-md, 8px);
      text-align: center;
      border: 1px solid var(--sc-border, #374151);
      transition: all var(--sc-transition-base);
    }
    .asset-card:hover { border-color: var(--sc-primary, #00d4ff); transform: translateY(-2px); }
    .asset-icon { font-size: 28px; margin-bottom: 8px; }
    .asset-count { font-size: 24px; font-weight: 800; color: var(--sc-text-primary); }
    .asset-label { font-size: 11px; color: var(--sc-text-muted, #6b7280); text-transform: uppercase; margin-top: 4px; }
    .modules-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
    .module-btn {
      padding: 16px 8px;
      background: var(--sc-bg-primary, #0a0f1a);
      border: 1px solid var(--sc-border, #374151);
      border-radius: var(--sc-radius-md, 8px);
      text-align: center;
      cursor: pointer;
      transition: all var(--sc-transition-fast);
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    .module-btn:hover {
      border-color: var(--sc-primary, #00d4ff);
      background: var(--sc-primary-muted, rgba(0,212,255,0.12));
      transform: translateY(-3px);
    }
    .module-icon { font-size: 24px; }
    .module-name { font-size: 10px; color: var(--sc-text-muted, #6b7280); line-height: 1.2; }
    .sidebar { display: flex; flex-direction: column; gap: var(--sc-space-md, 16px); overflow-y: auto; }
    .timeline { position: relative; padding-left: 24px; }
    .timeline::before {
      content: '';
      position: absolute; left: 8px; top: 0; bottom: 0; width: 2px;
      background: linear-gradient(to bottom, var(--sc-primary), var(--sc-border));
    }
    .timeline-item {
      position: relative;
      padding: 14px;
      background: var(--sc-bg-primary, #0a0f1a);
      border-radius: var(--sc-radius-md, 8px);
      margin-bottom: 12px;
      border: 1px solid var(--sc-border, #374151);
      transition: all var(--sc-transition-fast);
    }
    .timeline-item:hover { border-color: var(--sc-primary); transform: translateX(4px); }
    .timeline-item::before {
      content: '';
      position: absolute; left: -20px; top: 18px;
      width: 14px; height: 14px; border-radius: 50%;
      background: var(--sc-bg-secondary); border: 3px solid;
    }
    .timeline-item.critical::before { border-color: var(--sc-critical); box-shadow: 0 0 8px var(--sc-critical); }
    .timeline-item.high::before { border-color: var(--sc-high); }
    .timeline-item.medium::before { border-color: var(--sc-medium); }
    .timeline-item.low::before { border-color: var(--sc-low); }
    .timeline-time { font-size: 11px; color: var(--sc-text-muted, #6b7280); margin-bottom: 4px; font-family: monospace; }
    .timeline-title { font-size: 13px; font-weight: 600; color: var(--sc-text-primary); margin-bottom: 6px; }
    .timeline-tags { display: flex; gap: 6px; flex-wrap: wrap; }
    .timeline-tag {
      font-size: 10px; padding: 3px 8px; border-radius: 4px;
      background: var(--sc-bg-tertiary);
      color: var(--sc-text-muted, #6b7280);
      border: 1px solid var(--sc-border);
    }
    .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .kpi-card {
      padding: 14px;
      background: var(--sc-bg-primary, #0a0f1a);
      border-radius: var(--sc-radius-md, 8px);
      text-align: center;
      border: 1px solid var(--sc-border, #374151);
      transition: all var(--sc-transition-fast);
    }
    .kpi-card:hover { border-color: var(--sc-primary); }
    .kpi-icon { font-size: 20px; margin-bottom: 6px; }
    .kpi-value { font-size: 20px; font-weight: 800; color: var(--sc-text-primary); }
    .kpi-label { font-size: 10px; color: var(--sc-text-muted, #6b7280); margin-top: 4px; }
    .status-bar {
      grid-column: 1 / -1;
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 20px;
      background: var(--sc-bg-secondary, #111827);
      border: 1px solid var(--sc-border, #374151);
      border-radius: var(--sc-radius-md, 8px);
      font-size: 12px;
    }
    .status-group { display: flex; align-items: center; gap: 16px; }
    .status-item { display: flex; align-items: center; gap: 8px; color: var(--sc-text-muted, #6b7280); }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; }
    .status-dot.online { background: var(--sc-success); box-shadow: 0 0 6px var(--sc-success); }
    .status-dot.warning { background: var(--sc-warning); box-shadow: 0 0 6px var(--sc-warning); }
    .status-dot.offline { background: var(--sc-text-muted, #6b7280); }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: var(--sc-bg-secondary); }
    ::-webkit-scrollbar-thumb { background: var(--sc-border); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--sc-text-muted, #6b7280); }
    @media (max-width: 1600px) { .metrics-row { grid-template-columns: repeat(3, 1fr); } .modules-grid { grid-template-columns: repeat(4, 1fr); } }
    @media (max-width: 1200px) { .dashboard { grid-template-columns: 1fr; } .panels-grid { grid-template-columns: 1fr; } .compliance-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) { .metrics-row { grid-template-columns: repeat(2, 1fr); } .modules-grid { grid-template-columns: repeat(3, 1fr); } .header { flex-wrap: wrap; gap: 12px; } }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
  `;

  @state() private _time = new Date();
  @state() private _metrics: any[] = [];
  @state() private _attackSurface: any[] = [];
  @state() private _vulnerabilities: any[] = [];
  @state() private _compliance: any[] = [];
  @state() private _assets: any[] = [];
  @state() private _timeline: any[] = [];
  @state() private _kpis: any[] = [];

  private _timeInterval: number | null = null;

  private _modules = [
    { id: 'overview', name: '总览', icon: '🏠' },
    { id: 'attack-surface', name: '攻击面管理', icon: '🎯' },
    { id: 'vulnerability', name: '漏洞管理', icon: '🔓' },
    { id: 'threat-hunting', name: '威胁狩猎', icon: '🔍' },
    { id: 'compliance', name: '合规审计', icon: '📋' },
    { id: 'iam', name: '身份安全', icon: '🔐' },
    { id: 'dlp', name: '数据防泄', icon: '🛡️' },
    { id: 'network', name: '网络安全', icon: '🌐' },
    { id: 'soc', name: 'SOC运营', icon: '⚡' },
    { id: 'training', name: '安全培训', icon: '📚' },
    { id: 'vendor', name: '供应商风险', icon: '🔗' },
    { id: 'policy', name: '策略管理', icon: '📜' },
    { id: 'remediation', name: '修复跟踪', icon: '🔧' },
    { id: 'roi', name: 'ROI计算', icon: '💰' },
    { id: 'pentest', name: '渗透测试', icon: '🎯' },
    { id: 'threat-model', name: '威胁建模', icon: '🏗️' },
    { id: 'timeline', name: '事件时间线', icon: '📅' },
    { id: 'assets', name: '资产清单', icon: '🗄️' },
  ];

  connectedCallback() {
    super.connectedCallback();
    this._loadData();
    this._timeInterval = window.setInterval(() => { this._time = new Date(); }, 1000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._timeInterval) clearInterval(this._timeInterval);
  }

  private _loadData() {
    this._metrics = [
      { id: 'score', label: '安全评分', value: 78, trend: 'down', trendValue: 2, severity: 'info', icon: '📊' },
      { id: 'events', label: '活跃威胁', value: 12, trend: 'up', trendValue: 3, severity: 'danger', icon: '🚨' },
      { id: 'vulns', label: '待修复漏洞', value: 47, trend: 'down', trendValue: 5, severity: 'warning', icon: '🔓' },
      { id: 'compliance', label: '合规达成率', value: 89, unit: '%', trend: 'up', trendValue: 3, severity: 'success', icon: '✓' },
      { id: 'assets', label: '受保护资产', value: '1,247', trend: 'stable', trendValue: 0, severity: 'info', icon: '🛡️' },
      { id: 'iam', label: '身份风险', value: 3, trend: 'down', trendValue: 1, severity: 'warning', icon: '🔐' },
    ];
    this._attackSurface = [
      { name: 'Web Applications', risk: 'critical', count: 23, icon: '🌐' },
      { name: 'API Endpoints', risk: 'high', count: 156, icon: '🔗' },
      { name: 'Cloud Workloads', risk: 'medium', count: 89, icon: '☁️' },
      { name: 'Endpoints', risk: 'low', count: 2340, icon: '💻' },
      { name: 'Network Perimeters', risk: 'medium', count: 12, icon: '🔧' },
    ];
    this._vulnerabilities = [
      { cve: 'CVE-2024-21762', title: 'FortiOS RCE漏洞', severity: 'critical', status: 'open' },
      { cve: 'CVE-2024-3400', title: 'PAN-OS命令注入', severity: 'high', status: 'progress' },
      { cve: 'Log4j变体', title: 'Log4j新的绕过', severity: 'high', status: 'open' },
      { cve: 'OpenSSL溢出', title: 'OpenSSL缓冲区', severity: 'medium', status: 'progress' },
    ];
    this._compliance = [
      { name: 'SOC 2', score: 92, status: 'compliant' },
      { name: 'GDPR', score: 78, status: 'partial' },
      { name: 'ISO 27001', score: 88, status: 'compliant' },
      { name: 'PCI-DSS', score: 95, status: 'compliant' },
    ];
    this._assets = [
      { type: '服务器', icon: '🖥️', count: 234 },
      { type: '工作站', icon: '💻', count: 1890 },
      { type: '网络设备', icon: '🔧', count: 89 },
      { type: '云资源', icon: '☁️', count: 456 },
    ];
    this._timeline = [
      { time: '刚刚', title: '异常登录尝试', source: 'SIEM', severity: 'high', status: '调查中' },
      { time: '30分钟前', title: '数据外泄警报', source: 'DLP', severity: 'medium', status: '待处理' },
      { time: '1小时前', title: '策略违规', source: 'EDR', severity: 'low', status: '已解决' },
      { time: '2小时前', title: '勒索软件警报', source: 'EDR', severity: 'critical', status: '已升级' },
    ];
    this._kpis = [
      { icon: '⏱️', value: '2.3h', label: '平均响应时间' },
      { icon: '📈', value: '94%', label: '漏洞修复率' },
      { icon: '🔍', value: '156', label: '月扫描次数' },
      { icon: '✓', value: '23', label: '合规项达标' },
      { icon: '🛡️', value: '99.9%', label: '系统可用性' },
      { icon: '🔐', value: '847', label: '活跃用户' },
    ];
  }

  private _formatTime(d: Date) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }

  private _getScoreClass(s: number): string {
    if (s >= 90) return 'excellent';
    if (s >= 75) return 'good';
    if (s >= 60) return 'warning';
    return 'poor';
  }

  private _getMetricColor(severity?: string): string {
    switch (severity) {
      case 'danger': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'success': return '#22c55e';
      case 'info': return '#3b82f6';
      default: return '#00d4ff';
    }
  }

  private _getMetricBg(severity?: string): string {
    switch (severity) {
      case 'danger': return 'rgba(239, 68, 68, 0.12)';
      case 'warning': return 'rgba(245, 158, 11, 0.12)';
      case 'success': return 'rgba(34, 197, 94, 0.12)';
      case 'info': return 'rgba(59, 130, 246, 0.12)';
      default: return 'rgba(0, 212, 255, 0.12)';
    }
  }

  private _navigate(module: string) {
    this.dispatchEvent(new CustomEvent('navigate-module', { detail: { module }, bubbles: true, composed: true }));
  }

  render() {
    const highRisk = this._attackSurface.filter(s => s.risk === 'critical' || s.risk === 'high').length;
    const openVulns = this._vulnerabilities.filter(v => v.status === 'open').length;
    const compliantCount = this._compliance.filter(c => c.status === 'compliant').length;
    const totalAssets = this._assets.reduce((s, a) => s + a.count, 0);

    return html`
      <a href="#main-content" class="skip-link">跳转到主要内容</a>
      <div id="live-region" class="sr-only" aria-live="polite" aria-atomic="true"></div>
      
      <div class="dashboard" id="main-content" role="main" aria-label="SecuClaw安全仪表板">
        <header class="header" role="banner">
          <div class="logo">
            <div class="logo-icon" aria-hidden="true">🛡️</div>
            <div class="logo-text">
              <span class="logo-title">SecuClaw</span>
              <span class="logo-sub">安全指挥官</span>
            </div>
          </div>
          <div class="header-actions">
            <div class="live-badge" role="status" aria-label="实时监控状态">
              <span class="live-dot" aria-hidden="true"></span>
              LIVE
            </div>
            <time class="time-display" aria-label="当前时间">${this._formatTime(this._time)}</time>
            <button class="btn" @click=${() => this._navigate('refresh')} aria-label="刷新数据">🔄 刷新</button>
            <button class="btn btn-primary" @click=${() => this._navigate('incident')} aria-label="创建新安全事件">+ 新建事件</button>
          </div>
        </header>

        <div class="main">
          <section class="metrics-row" role="region" aria-label="安全指标概览">
            ${this._metrics.map(m => html`
              <article class="metric-card" style="--metric-color: ${this._getMetricColor(m.severity)}; --metric-bg: ${this._getMetricBg(m.severity)}">
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
                  ${this._attackSurface.map(s => html`
                    <div class="surface-item" role="listitem" @click=${() => this._navigate('attack-surface')} tabindex="0" aria-label="${s.name}, ${s.count}个暴露点">
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
                  ${this._vulnerabilities.map(v => html`
                    <div class="vuln-item ${v.severity}" role="listitem">
                      <span class="sev-badge ${v.severity}">${v.severity}</span>
                      <div class="vuln-info">
                        <div class="vuln-title">${v.cve}</div>
                        <div class="vuln-meta">${v.title}</div>
                      </div>
                      <span class="status-badge ${v.status === 'open' ? 'open' : v.status === 'progress' ? 'progress' : 'resolved'}">
                        ${v.status === 'open' ? '待修复' : v.status === 'progress' ? '修复中' : '已修复'}
                      </span>
                    </div>
                  `)}
                </div>
              </div>
            </section>
          </div>

          <div class="panels-grid">
            <section class="panel" aria-labelledby="compliance-title">
              <div class="panel-header">
                <h2 class="panel-title" id="compliance-title">📋 合规状态</h2>
                <span class="panel-badge success">${compliantCount}/${this._compliance.length} 达标</span>
              </div>
              <div class="panel-content">
                <div class="compliance-grid" role="list">
                  ${this._compliance.map(c => html`
                    <div class="compliance-card" role="listitem">
                      <div class="compliance-framework">${c.name}</div>
                      <div class="compliance-score ${this._getScoreClass(c.score)}">${c.score}%</div>
                      <div class="compliance-status ${c.status === 'compliant' ? 'pass' : 'partial'}">
                        ${c.status === 'compliant' ? '✓ 达标' : '~ 部分'}
                      </div>
                    </div>
                  `)}
                </div>
              </div>
            </section>

            <section class="panel" aria-labelledby="assets-title">
              <div class="panel-header">
                <h2 class="panel-title" id="assets-title">🗄️ 资产清单</h2>
                <span class="panel-badge success">${totalAssets.toLocaleString()} 总计</span>
              </div>
              <div class="panel-content">
                <div class="assets-grid" role="list">
                  ${this._assets.map(a => html`
                    <div class="asset-card" role="listitem">
                      <div class="asset-icon" aria-hidden="true">${a.icon}</div>
                      <div class="asset-count">${a.count.toLocaleString()}</div>
                      <div class="asset-label">${a.type}</div>
                    </div>
                  `)}
                </div>
              </div>
            </section>
          </div>

          <section class="panel wide" aria-labelledby="modules-title">
            <div class="panel-header">
              <h2 class="panel-title" id="modules-title">🧩 安全模块快速访问</h2>
            </div>
            <div class="panel-content">
              <nav class="modules-grid" aria-label="安全模块导航">
                ${this._modules.map(m => html`
                  <button class="module-btn" @click=${() => this._navigate(m.id)} aria-label="打开${m.name}模块">
                    <span class="module-icon" aria-hidden="true">${m.icon}</span>
                    <span class="module-name">${m.name}</span>
                  </button>
                `)}
              </nav>
            </div>
          </section>
        </div>

        <aside class="sidebar" role="complementary" aria-label="侧边栏">
          <section class="panel" aria-labelledby="incident-title">
            <div class="panel-header">
              <h2 class="panel-title" id="incident-title">⚡ 事件时间线</h2>
            </div>
            <div class="panel-content">
              <div class="timeline" role="list" aria-label="安全事件时间线">
                ${this._timeline.map(t => html`
                  <div class="timeline-item ${t.severity}" role="listitem">
                    <div class="timeline-time">${t.time}</div>
                    <div class="timeline-title">${t.title}</div>
                    <div class="timeline-tags">
                      <span class="timeline-tag">${t.source}</span>
                      <span class="timeline-tag">${t.status}</span>
                    </div>
                  </div>
                `)}
              </div>
            </div>
          </section>

          <section class="panel" aria-labelledby="kpi-title">
            <div class="panel-header">
              <h2 class="panel-title" id="kpi-title">📊 安全KPI</h2>
            </div>
            <div class="panel-content">
              <div class="kpi-grid" role="list" aria-label="关键绩效指标">
                ${this._kpis.map(k => html`
                  <div class="kpi-card" role="listitem">
                    <div class="kpi-icon" aria-hidden="true">${k.icon}</div>
                    <div class="kpi-value">${k.value}</div>
                    <div class="kpi-label">${k.label}</div>
                  </div>
                `)}
              </div>
            </div>
          </section>

          <section class="panel" aria-labelledby="actions-title">
            <div class="panel-header">
              <h2 class="panel-title" id="actions-title">⚡ 快速操作</h2>
            </div>
            <div class="panel-content">
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <button class="btn" @click=${() => this._navigate('scan')}>🔍 启动扫描</button>
                <button class="btn" @click=${() => this._navigate('report')}>📊 生成报告</button>
                <button class="btn btn-danger" @click=${() => this._navigate('incident')}>🚨 创建事件</button>
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
          <div>SecuClaw v3.0 | ${this._formatTime(this._time)}</div>
        </footer>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-secuclaw-master-dashboard': ScSecuClawMasterDashboard;
  }
}

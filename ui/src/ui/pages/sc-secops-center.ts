import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { gatewayClient } from '../gateway-client.js';

/**
 * Professional Security Operations Center
 * Unified Design System for All Security Tools
 * Based on: Mobile-First, 8px Grid, WCAG 2.2
 */
@customElement('sc-secops-center')
export class ScSecOpsCenter extends LitElement {
  @state() private activeTool: string = 'baseline';
  @state() private activeTab: string = 'overview';
  @state() private isRunning: boolean = false;
  @state() private progress: number = 0;
  @state() private loading: boolean = false;

  @state() private incidents: any[] = [];
  @state() private vulnerabilities: any[] = [];
  @state() private threats: any[] = [];
  @state() private tasks: any[] = [];
  @state() private reports: any[] = [];
  @state() private risks: any[] = [];
  @state() private knowledgeTactics: any[] = [];
  @state() private _availableTools: any[] = [];
  @state() private tools: any[] = [];

  static styles = css`
    /* ===========================
       DESIGN TOKENS (8px Grid System)
       =========================== */
    :host {
      --secops-primary: #3B82F6;
      --secops-success: #10B981;
      --secops-warning: #F59E0B;
      --secops-danger: #EF4444;
      --secops-purple: #8B5CF6;
      
      --secops-bg-primary: var(--sc-bg-primary, #0f172a);
      --secops-bg-secondary: var(--sc-bg-secondary, #1e293b);
      --secops-bg-card: var(--sc-bg-card, #1e293b);
      --secops-bg-tertiary: var(--sc-bg-tertiary, #334155);
      --secops-bg-hover: var(--sc-bg-hover, #475569);
      
      --secops-text-primary: var(--sc-text-primary, #f8fafc);
      --secops-text-secondary: var(--sc-text-secondary, #cbd5e1);
      --secops-text-tertiary: var(--sc-text-tertiary, #94a3b8);
      
      --secops-border: var(--sc-border-color, #334155);
      
      --secops-radius-sm: 6px;
      --secops-radius-md: 10px;
      --secops-radius-lg: 16px;
      
      --secops-shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
      --secops-shadow-md: 0 4px 12px rgba(0,0,0,0.4);
      --secops-shadow-lg: 0 12px 32px rgba(0,0,0,0.5);
      
      --secops-transition: 200ms ease;
      
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      color: var(--secops-text-primary);
      background: var(--secops-bg-primary);
      min-height: 100vh;
    }

    /* ===========================
       LAYOUT
       =========================== */
    .secops-container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 24px;
    }

    /* ===========================
       TOOL SELECTOR (Pills)
       =========================== */
    .tool-selector {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--secops-border);
    }

    .tool-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 20px;
      border-radius: 50px;
      border: 2px solid var(--secops-border);
      background: var(--secops-bg-card);
      color: var(--secops-text-secondary);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--secops-transition);
      white-space: nowrap;
    }

    .tool-pill:hover {
      border-color: var(--secops-primary);
      color: var(--secops-text-primary);
      transform: translateY(-2px);
      box-shadow: var(--secops-shadow-md);
    }

    .tool-pill.active {
      border-color: var(--secops-primary);
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%);
      color: var(--secops-primary);
    }

    .tool-pill-icon {
      font-size: 18px;
    }

    .tool-pill-domain {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .domain-light { background: rgba(16, 185, 129, 0.2); color: #10B981; }
    .domain-dark { background: rgba(239, 68, 68, 0.2); color: #EF4444; }
    .domain-security { background: rgba(59, 130, 246, 0.2); color: #3B82F6; }

    /* ===========================
       HERO SECTION
       =========================== */
    .hero-section {
      display: flex;
      gap: 24px;
      align-items: flex-start;
      padding: 32px;
      background: linear-gradient(135deg, var(--secops-bg-card) 0%, var(--secops-bg-secondary) 100%);
      border: 1px solid var(--secops-border);
      border-radius: var(--secops-radius-lg);
      margin-bottom: 32px;
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
      background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%);
      pointer-events: none;
    }

    .hero-icon {
      width: 72px;
      height: 72px;
      border-radius: var(--secops-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      flex-shrink: 0;
    }

    .hero-icon.light { background: linear-gradient(135deg, #10B981, #059669); }
    .hero-icon.dark { background: linear-gradient(135deg, #EF4444, #DC2626); }
    .hero-icon.security { background: linear-gradient(135deg, #3B82F6, #2563EB); }
    .hero-icon.data { background: linear-gradient(135deg, #8B5CF6, #7C3AED); }
    .hero-icon.report { background: linear-gradient(135deg, #F59E0B, #D97706); }
    .hero-icon.risk { background: linear-gradient(135deg, #EC4899, #DB2777); }

    .hero-content { flex: 1; position: relative; z-index: 1; }

    .hero-title {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px;
      color: var(--secops-text-primary);
    }

    .hero-domain {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 12px;
    }

    .hero-domain.light { background: rgba(16, 185, 129, 0.15); color: #10B981; }
    .hero-domain.dark { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
    .hero-domain.security { background: rgba(59, 130, 246, 0.15); color: #3B82F6; }
    .hero-domain.data { background: rgba(139, 92, 246, 0.15); color: #8B5CF6; }

    .hero-description {
      font-size: 15px;
      line-height: 1.6;
      color: var(--secops-text-secondary);
      margin: 0;
      max-width: 600px;
    }

    .hero-stats {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      text-align: right;
    }

    .hero-stat-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--secops-text-primary);
    }

    .hero-stat-label {
      font-size: 12px;
      color: var(--secops-text-tertiary);
    }

    .coverage-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
    }

    .coverage-tag {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
    }

    .coverage-tag.mitre { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
    .coverage-tag.scf { background: rgba(59, 130, 246, 0.15); color: #3B82F6; }

    /* ===========================
       METRICS GRID
       =========================== */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .metric-card {
      background: var(--secops-bg-card);
      border: 1px solid var(--secops-border);
      border-radius: var(--secops-radius-md);
      padding: 20px;
      position: relative;
      overflow: hidden;
      transition: all var(--secops-transition);
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
      border-color: var(--secops-primary);
      transform: translateY(-2px);
    }

    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .metric-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
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

    .metric-trend {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 500;
    }

    .metric-trend.up { background: rgba(16, 185, 129, 0.15); color: #10B981; }
    .metric-trend.down { background: rgba(239, 68, 68, 0.15); color: #EF4444; }

    .metric-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--secops-text-primary);
      line-height: 1.2;
    }

    .metric-label {
      font-size: 13px;
      color: var(--secops-text-secondary);
      margin-top: 4px;
    }

    /* ===========================
       TABS
       =========================== */
    .tabs-container {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--secops-border);
      margin-bottom: 24px;
    }

    .tab-btn {
      padding: 12px 20px;
      font-size: 14px;
      font-weight: 500;
      color: var(--secops-text-secondary);
      background: none;
      border: none;
      cursor: pointer;
      position: relative;
      transition: all var(--secops-transition);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tab-btn:hover { color: var(--secops-text-primary); }
    
    .tab-btn.active {
      color: var(--secops-primary);
    }

    .tab-btn.active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--secops-primary);
    }

    /* ===========================
       CONTENT GRID
       =========================== */
    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
    }

    @media (max-width: 1024px) {
      .content-grid { grid-template-columns: 1fr; }
    }

    /* ===========================
       CARDS
       =========================== */
    .card {
      background: var(--secops-bg-card);
      border: 1px solid var(--secops-border);
      border-radius: var(--secops-radius-lg);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid var(--secops-border);
      background: var(--secops-bg-secondary);
    }

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--secops-text-primary);
    }

    .card-body {
      padding: 24px;
    }

    /* ===========================
       TABLES
       =========================== */
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      text-align: left;
      padding: 12px 16px;
      font-size: 11px;
      font-weight: 600;
      color: var(--secops-text-tertiary);
      background: var(--secops-bg-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    .data-table td {
      padding: 14px 16px;
      font-size: 14px;
      color: var(--secops-text-primary);
      border-bottom: 1px solid var(--secops-border);
    }

    .data-table tbody tr:hover td {
      background: var(--secops-bg-hover);
    }

    .data-table tbody tr:last-child td {
      border-bottom: none;
    }

    /* ===========================
       STATUS BADGES
       =========================== */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-badge::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .status-critical { background: color-mix(in srgb, var(--sc-danger, #EF4444) 15%, transparent); color: var(--sc-danger, #EF4444); }
    .status-high { background: color-mix(in srgb, var(--sc-warning, #F97316) 15%, transparent); color: var(--sc-warning, #F97316); }
    .status-medium { background: color-mix(in srgb, var(--sc-warning, #F59E0B) 15%, transparent); color: var(--sc-warning, #F59E0B); }
    .status-low { background: color-mix(in srgb, var(--sc-success, #10B981) 15%, transparent); color: var(--sc-success, #10B981); }
    .status-pass { background: color-mix(in srgb, var(--sc-success, #10B981) 15%, transparent); color: var(--sc-success, #10B981); }
    .status-fail { background: color-mix(in srgb, var(--sc-danger, #EF4444) 15%, transparent); color: var(--sc-danger, #EF4444); }
    .status-warn { background: color-mix(in srgb, var(--sc-warning, #F59E0B) 15%, transparent); color: var(--sc-warning, #F59E0B); }
    .status-info { background: color-mix(in srgb, var(--sc-info, #3B82F6) 15%, transparent); color: var(--sc-info, #3B82F6); }

    /* ===========================
       BUTTONS
       =========================== */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      border-radius: var(--secops-radius-sm);
      border: none;
      cursor: pointer;
      transition: all var(--secops-transition);
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--secops-primary) 0%, #2563EB 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-secondary {
      background: var(--secops-bg-tertiary);
      color: var(--secops-text-primary);
      border: 1px solid var(--secops-border);
    }

    .btn-secondary:hover {
      background: var(--secops-bg-hover);
    }

    .btn-danger {
      background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    .btn-success {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    /* ===========================
       FORMS
       =========================== */
    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--secops-text-primary);
      margin-bottom: 6px;
    }

    .form-input, .form-select {
      width: 100%;
      padding: 10px 14px;
      font-size: 14px;
      background: var(--secops-bg-primary);
      border: 1px solid var(--secops-border);
      border-radius: var(--secops-radius-sm);
      color: var(--secops-text-primary);
      transition: border-color var(--secops-transition);
    }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: var(--secops-primary);
    }

    .form-select {
      cursor: pointer;
    }

    /* ===========================
       PROGRESS BAR
       =========================== */
    .progress-section {
      margin-top: 16px;
    }

    .progress-bar {
      height: 8px;
      background: var(--secops-bg-tertiary);
      border-radius: 10px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 10px;
      transition: width 0.3s ease;
    }

    .progress-fill.green { background: linear-gradient(90deg, #10B981, #34D399); }
    .progress-fill.red { background: linear-gradient(90deg, #EF4444, #F87171); }
    .progress-fill.blue { background: linear-gradient(90deg, #3B82F6, #60A5FA); }

    .progress-text {
      text-align: center;
      margin-top: 8px;
      font-size: 13px;
      color: var(--secops-text-secondary);
    }

    /* ===========================
       SIDEBAR LIST
       =========================== */
    .sidebar-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .sidebar-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: var(--secops-radius-sm);
      margin-bottom: 4px;
      cursor: pointer;
      transition: all var(--secops-transition);
      font-size: 14px;
      color: var(--secops-text-secondary);
      border: 1px solid transparent;
    }

    .sidebar-item:hover {
      background: var(--secops-bg-hover);
      color: var(--secops-text-primary);
    }

    .sidebar-item-icon {
      font-size: 16px;
      opacity: 0.7;
    }

    .sidebar-item-content {
      flex: 1;
    }

    .sidebar-item-title {
      font-weight: 500;
      color: var(--secops-text-primary);
    }

    .sidebar-item-meta {
      font-size: 11px;
      color: var(--secops-text-tertiary);
      margin-top: 2px;
    }

    /* ===========================
       EMPTY STATE
       =========================== */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .empty-icon {
      font-size: 48px;
      opacity: 0.5;
      margin-bottom: 16px;
    }

    .empty-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--secops-text-primary);
      margin-bottom: 4px;
    }

    .empty-desc {
      font-size: 14px;
      color: var(--secops-text-secondary);
    }

    /* ===========================
       CODE BLOCK
       =========================== */
    code {
      background: var(--secops-bg-tertiary);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'SF Mono', monospace;
      font-size: 12px;
    }

    /* ===========================
       RESPONSIVE
       =========================== */
    @media (max-width: 768px) {
      .secops-container { padding: 16px; }
      .tool-selector { gap: 6px; }
      .tool-pill { padding: 8px 14px; font-size: 13px; }
      .hero-section { flex-direction: column; padding: 20px; }
      .hero-icon { width: 56px; height: 56px; font-size: 28px; }
      .hero-stats { align-items: flex-start; text-align: left; }
      .metrics-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
      .card-body { padding: 16px; }
      .data-table { font-size: 12px; }
      .data-table th, .data-table td { padding: 10px 12px; }
    }

    @media (max-width: 480px) {
      .metrics-grid { grid-template-columns: 1fr; }
      .hero-stat-value { font-size: 24px; }
      .tabs-container { overflow-x: auto; }
      .tab-btn { padding: 10px 14px; font-size: 13px; white-space: nowrap; }
    }
  `;

  // Tool definitions
  private tools = [
    { id: 'baseline', name: '基线检查', icon: '🛡️', domain: 'light', label: '光明面' },
    { id: 'vulnscan', name: '漏洞扫描', icon: '🔍', domain: 'security', label: '安全技术' },
    { id: 'pentest', name: '渗透测试', icon: '⚔️', domain: 'dark', label: '黑暗面' },
    { id: 'threathunt', name: '威胁狩猎', icon: '🎯', domain: 'dark', label: '黑暗面' },
    { id: 'datacenter', name: '数据资源', icon: '🗄️', domain: 'data', label: '数据中心' },
    { id: 'reports', name: '分析报告', icon: '📊', domain: 'report', label: '分析洞察' },
    { id: 'risk', name: '安全风险', icon: '⚠️', domain: 'risk', label: '风险管理' },
  ];

  // Tool configurations
  private toolConfigs: Record<string, any> = {
    baseline: {
      title: '安全基线检测',
      description: '按资产域自动检测 CIS/云/容器/终端安全基线，生成整改任务，跟踪闭环率。',
      domain: 'light',
      icon: '🛡️',
      stats: { total: 156, items: 'controls' },
      metrics: [
        { label: '通过项', value: 48, trend: '+2', color: 'green', icon: '✓' },
        { label: '失败项', value: 12, trend: '-1', color: 'red', icon: '✗' },
        { label: '警告项', value: 8, color: 'yellow', icon: '⚠' },
        { label: '合规率', value: '85%', trend: '+5%', color: 'blue', icon: '📊' },
      ],
      mitre: ['TA0005 Defense Evasion'],
      scf: ['CM-1 Configuration Management'],
      samples: [
        { id: 'CIS-1.1', name: '密码策略', status: 'pass', category: '身份认证' },
        { id: 'CIS-2.1', name: '审计日志配置', status: 'fail', category: '日志监控' },
        { id: 'AWS-WAF-1', name: 'WAF启用状态', status: 'pass', category: '云安全' },
        { id: 'NIST-AC-1', name: '访问控制策略', status: 'warn', category: '访问管理' },
      ],
    },
    vulnscan: {
      title: '漏洞扫描',
      description: '全面扫描网络、主机、应用漏洞，基于 CVSS/AI 风险评分优先处理高危漏洞。',
      domain: 'security',
      icon: '🔍',
      stats: { total: 1247, items: 'vulnerabilities' },
      metrics: [
        { label: 'Critical', value: 23, color: 'red', icon: '🔴' },
        { label: 'High', value: 87, color: 'yellow', icon: '🟡' },
        { label: 'Medium', value: 234, color: 'blue', icon: '🔵' },
        { label: 'Total', value: 1247, trend: '-12', color: 'green', icon: '📊' },
      ],
      mitre: ['TA0001 Initial Access'],
      scf: ['RA-1 Security Assessment'],
      samples: [
        { id: 'CVE-2024-1234', name: 'Log4j RCE漏洞', severity: 'critical', status: 'open' },
        { id: 'CVE-2024-5678', name: 'OpenSSL缓冲区溢出', severity: 'high', status: 'open' },
        { id: 'CVE-2024-9012', name: 'SQL注入漏洞', severity: 'medium', status: 'fixed' },
        { id: 'CVE-2024-3456', name: 'XSS跨站脚本', severity: 'low', status: 'open' },
      ],
    },
    pentest: {
      title: '渗透测试',
      description: '模拟真实攻击场景，验证安全防护能力，发现潜在攻击路径与漏洞利用链。',
      domain: 'dark',
      icon: '⚔️',
      stats: { total: 15, items: 'tasks' },
      metrics: [
        { label: '测试任务', value: 15, color: 'purple', icon: '📋' },
        { label: '发现漏洞', value: 42, color: 'red', icon: '🔍' },
        { label: 'Critical', value: 8, color: 'red', icon: '🔴' },
        { label: '中危', value: 24, color: 'yellow', icon: '🟡' },
      ],
      mitre: ['TA0001 Initial Access', 'TA0002 Execution'],
      scf: ['CA-8 Penetration Testing'],
      samples: [
        { id: 'T1001', name: '数据压缩隐蔽通信', type: 'ATT&CK', status: 'detected' },
        { id: 'T1005', name: '本地数据窃取', type: 'ATT&CK', status: 'blocked' },
        { id: 'T1055', name: '进程注入攻击', type: 'ATT&CK', status: 'detected' },
      ],
    },
    threathunt: {
      title: '威胁狩猎',
      description: '基于 MITRE ATT&CK 框架，主动搜寻网络中潜伏的高级持续性威胁(APT)。',
      domain: 'dark',
      icon: '🎯',
      stats: { total: 156, items: 'IOCs' },
      metrics: [
        { label: 'IOCs', value: 156, color: 'purple', icon: '🔍' },
        { label: '可疑活动', value: 12, color: 'yellow', icon: '⚠' },
        { label: '已确认', value: 3, color: 'red', icon: '✓' },
        { label: '覆盖战术', value: '18/19', color: 'blue', icon: '📊' },
      ],
      mitre: ['TA0011 Command and Control'],
      scf: ['SI-4 Threat Detection'],
      samples: [
        { id: 'IOC-001', name: '恶意C2域名', type: 'Network', status: 'active' },
        { id: 'IOC-002', name: '可疑PowerShell', type: 'Behavior', status: 'investigating' },
        { id: 'IOC-003', name: '异常外连流量', type: 'Network', status: 'blocked' },
      ],
    },
    datacenter: {
      title: '数据资源中心',
      description: '统一管理安全运营数据资产，跟踪数据血缘、质量和合规状态。',
      domain: 'data',
      icon: '🗄️',
      stats: { total: 24, items: 'databases' },
      metrics: [
        { label: '总数据库', value: 24, color: 'blue', icon: '🗄️' },
        { label: '健康', value: 18, color: 'green', icon: '✓' },
        { label: '警告', value: 4, color: 'yellow', icon: '⚠' },
        { label: '错误', value: 2, color: 'red', icon: '✗' },
      ],
      mitre: [],
      scf: ['DM-1 Data Inventory'],
      samples: [
        { name: '威胁情报库', type: 'Knowledge', records: '2.3M', health: 'healthy' },
        { name: '漏洞库', type: 'Business', records: '156K', health: 'healthy' },
        { name: '事件日志库', type: 'Business', records: '890M', health: 'warning' },
        { name: '资产库', type: 'Organization', records: '12K', health: 'healthy' },
      ],
    },
    reports: {
      title: '分析报告',
      description: '生成多维度安全分析报告，支持自定义模板和自动定时推送。',
      domain: 'report',
      icon: '📊',
      stats: { total: 48, items: 'reports' },
      metrics: [
        { label: '本周报告', value: 12, color: 'blue', icon: '📄' },
        { label: '待处理', value: 3, color: 'yellow', icon: '⏳' },
        { label: '已发送', value: 45, color: 'green', icon: '✓' },
        { label: '定时任务', value: 8, color: 'purple', icon: '🔄' },
      ],
      mitre: [],
      scf: ['RA-5 Vulnerability Reporting'],
      samples: [
        { name: '周度安全简报', type: 'Summary', date: '2026-03-24', status: 'ready' },
        { name: '漏洞分析报告', type: 'Detailed', date: '2026-03-23', status: 'pending' },
        { name: '合规审计报告', type: 'Compliance', date: '2026-03-20', status: 'sent' },
        { name: '红队评估报告', type: 'Security', date: '2026-03-15', status: 'sent' },
      ],
    },
    risk: {
      title: '安全风险',
      description: '系统性评估组织安全风险，支持量化和可视化展示。',
      domain: 'risk',
      icon: '⚠️',
      stats: { total: 35, items: 'risks' },
      metrics: [
        { label: '高风险', value: 8, color: 'red', icon: '🔴' },
        { label: '中风险', value: 15, color: 'yellow', icon: '🟡' },
        { label: '低风险', value: 12, color: 'green', icon: '🟢' },
        { label: '风险指数', value: '72', trend: '-3', color: 'blue', icon: '📊' },
      ],
      mitre: [],
      scf: ['RM-1 Risk Management Strategy'],
      samples: [
        { id: 'RISK-001', name: 'VPN访问控制不足', level: 'high', owner: '安全团队' },
        { id: 'RISK-002', name: '第三方供应链风险', level: 'high', owner: '采购部' },
        { id: 'RISK-003', name: '员工安全意识不足', level: 'medium', owner: '人力资源' },
        { id: 'RISK-004', name: '日志保留策略不完善', level: 'low', owner: '运维团队' },
      ],
    },
  };

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
  }

  private async loadData() {
    this.loading = true;
    try {
      const [incRes, vulnRes, taskRes, reportRes, riskRes, tacticRes, toolsRes] = await Promise.allSettled([
        gatewayClient.request('incidents.list', {}),
        gatewayClient.request('vulnerabilities.list', {}),
        gatewayClient.request('tasks.list', {}),
        gatewayClient.request('reports.list', {}),
        gatewayClient.request('risk.list', {}),
        gatewayClient.request('knowledge.mitre.tactics', {}),
        gatewayClient.request('tools.list', {}),
      ]);

      if (incRes.status === 'fulfilled') {
        const d = incRes.value as Record<string, unknown>;
        if (Array.isArray(d?.incidents)) this.incidents = [...d.incidents as any[]];
      }
      if (vulnRes.status === 'fulfilled') {
        const d = vulnRes.value as Record<string, unknown>;
        if (Array.isArray(d?.vulnerabilities)) this.vulnerabilities = [...d.vulnerabilities as any[]];
      }
      if (taskRes.status === 'fulfilled') {
        const d = taskRes.value as Record<string, unknown>;
        if (Array.isArray(d?.tasks)) this.tasks = [...d.tasks as any[]];
      }
      if (reportRes.status === 'fulfilled') {
        const d = reportRes.value as Record<string, unknown>;
        if (Array.isArray(d?.reports)) this.reports = [...d.reports as any[]];
      }
      if (riskRes.status === 'fulfilled') {
        const d = riskRes.value as Record<string, unknown>;
        if (Array.isArray(d?.risks)) this.risks = [...d.risks as any[]];
      }
      if (tacticRes.status === 'fulfilled') {
        const d = tacticRes.value as Record<string, unknown>;
        if (Array.isArray(d?.tactics)) this.knowledgeTactics = [...d.tactics as any[]];
      }
      if (toolsRes.status === 'fulfilled') {
        const d = toolsRes.value as Record<string, unknown>;
        const list = Array.isArray(d?.tools) ? (d.tools as any[]) : Array.isArray(d) ? (d as any[]) : [];
        this._availableTools = [...list];
        this.tools = [...list];
      }
    } catch (e) {
      console.error('[secops-center] Failed to load data:', e);
    }
    this.loading = false;
  }

  private getDynamicConfig(toolId: string) {
    const base = this.toolConfigs[toolId] || this.toolConfigs.baseline;
    switch (toolId) {
      case 'baseline': {
        const total = this.tasks.length || base.stats.total;
        const passed = this.tasks.filter((t: any) => t.status === 'completed' || t.status === 'pass').length || base.metrics[0].value;
        const failed = this.tasks.filter((t: any) => t.status === 'failed' || t.status === 'fail').length || base.metrics[1].value;
        return {
          ...base,
          stats: { total, items: base.stats.items },
          metrics: [
            { label: '通过项', value: passed, trend: '+2', color: 'green', icon: '✓' },
            { label: '失败项', value: failed, trend: '-1', color: 'red', icon: '✗' },
            { label: '警告项', value: base.metrics[2].value, color: 'yellow', icon: '⚠' },
            { label: '合规率', value: total > 0 ? Math.round((passed / total) * 100) + '%' : base.metrics[3].value, trend: '+5%', color: 'blue', icon: '📊' },
          ],
          samples: this.tasks.length > 0
            ? this.tasks.slice(0, 5).map((t: any) => ({ id: t.id || t.taskId || '-', name: t.title || t.name || '-', status: t.status || 'unknown', category: t.type || t.category || '-' }))
            : base.samples,
        };
      }
      case 'vulnscan': {
        const total = this.vulnerabilities.length || base.stats.total;
        const critical = this.vulnerabilities.filter((v: any) => v.severity === 'critical').length || base.metrics[0].value;
        const high = this.vulnerabilities.filter((v: any) => v.severity === 'high').length || base.metrics[1].value;
        const medium = this.vulnerabilities.filter((v: any) => v.severity === 'medium').length || base.metrics[2].value;
        return {
          ...base,
          stats: { total, items: base.stats.items },
          metrics: [
            { label: 'Critical', value: critical, color: 'red', icon: '🔴' },
            { label: 'High', value: high, color: 'yellow', icon: '🟡' },
            { label: 'Medium', value: medium, color: 'blue', icon: '🔵' },
            { label: 'Total', value: total, trend: '-12', color: 'green', icon: '📊' },
          ],
          samples: this.vulnerabilities.length > 0
            ? this.vulnerabilities.slice(0, 5).map((v: any) => ({ id: v.cveId || v.id || '-', name: v.title || v.name || '-', severity: v.severity || 'medium', status: v.status || 'open' }))
            : base.samples,
        };
      }
      case 'pentest': {
        return {
          ...base,
          stats: { total: this.tasks.length || base.stats.total, items: base.stats.items },
          metrics: [
            { label: '测试任务', value: this.tasks.length || base.metrics[0].value, color: 'purple', icon: '📋' },
            { label: '发现漏洞', value: base.metrics[1].value, color: 'red', icon: '🔍' },
            { label: 'Critical', value: this.vulnerabilities.filter((v: any) => v.severity === 'critical').length || base.metrics[2].value, color: 'red', icon: '🔴' },
            { label: '中危', value: this.vulnerabilities.filter((v: any) => v.severity === 'medium').length || base.metrics[3].value, color: 'yellow', icon: '🟡' },
          ],
          samples: this.knowledgeTactics.length > 0
            ? this.knowledgeTactics.slice(0, 5).map((t: any) => ({ id: t.id || t.externalId || '-', name: t.name || '-', type: 'ATT&CK', status: 'detected' }))
            : base.samples,
        };
      }
      case 'threathunt': {
        return {
          ...base,
          metrics: [
            { label: 'IOCs', value: this.threats.length || base.metrics[0].value, color: 'purple', icon: '🔍' },
            { label: '可疑活动', value: this.incidents.filter((i: any) => i.severity === 'high' || i.severity === 'critical').length || base.metrics[1].value, color: 'yellow', icon: '⚠' },
            { label: '已确认', value: this.incidents.filter((i: any) => i.status === 'confirmed').length || base.metrics[2].value, color: 'red', icon: '✓' },
            { label: '覆盖战术', value: `${this.knowledgeTactics.length}/19`, color: 'blue', icon: '📊' },
          ],
          samples: this.incidents.length > 0
            ? this.incidents.slice(0, 5).map((i: any) => ({ id: i.id || '-', name: i.title || i.name || '-', type: i.type || 'Behavior', status: i.status || 'active' }))
            : base.samples,
        };
      }
      case 'reports': {
        return {
          ...base,
          stats: { total: this.reports.length || base.stats.total, items: base.stats.items },
          metrics: [
            { label: '本周报告', value: this.reports.filter((r: any) => r.createdAt && new Date(r.createdAt) > new Date(Date.now() - 7 * 86400000)).length || base.metrics[0].value, color: 'blue', icon: '📄' },
            { label: '待处理', value: this.reports.filter((r: any) => r.status === 'pending' || r.status === 'draft').length || base.metrics[1].value, color: 'yellow', icon: '⏳' },
            { label: '已发送', value: this.reports.filter((r: any) => r.status === 'sent' || r.status === 'completed').length || base.metrics[2].value, color: 'green', icon: '✓' },
            { label: '定时任务', value: base.metrics[3].value, color: 'purple', icon: '🔄' },
          ],
          samples: this.reports.length > 0
            ? this.reports.slice(0, 5).map((r: any) => ({ name: r.title || r.name || '-', type: r.type || 'Summary', date: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : '-', status: r.status || 'ready' }))
            : base.samples,
        };
      }
      case 'risk': {
        return {
          ...base,
          stats: { total: this.risks.length || base.stats.total, items: base.stats.items },
          metrics: [
            { label: '高风险', value: this.risks.filter((r: any) => r.level === 'high' || r.severity === 'high').length || base.metrics[0].value, color: 'red', icon: '🔴' },
            { label: '中风险', value: this.risks.filter((r: any) => r.level === 'medium' || r.severity === 'medium').length || base.metrics[1].value, color: 'yellow', icon: '🟡' },
            { label: '低风险', value: this.risks.filter((r: any) => r.level === 'low' || r.severity === 'low').length || base.metrics[2].value, color: 'green', icon: '🟢' },
            { label: '风险指数', value: base.metrics[3].value, trend: '-3', color: 'blue', icon: '📊' },
          ],
          samples: this.risks.length > 0
            ? this.risks.slice(0, 5).map((r: any) => ({ id: r.id || '-', name: r.title || r.name || '-', level: r.level || r.severity || 'medium', owner: r.owner || '-' }))
            : base.samples,
        };
      }
      default:
        return base;
    }
  }

  private handleToolSelect(toolId: string) {
    this.activeTool = toolId;
    this.activeTab = 'overview';
  }

  private handleTabChange(tab: string) {
    this.activeTab = tab;
  }

  private async runAction() {
    this.isRunning = true;
    this.progress = 0;
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(r => setTimeout(r, 80));
      this.progress = i;
    }
    this.isRunning = false;
  }

  render() {
    const config = this.getDynamicConfig(this.activeTool);
    return html`
      <div class="secops-container">
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
          <button 
            class="tool-pill ${this.activeTool === tool.id ? 'active' : ''}"
            @click=${() => this.handleToolSelect(tool.id)}
          >
            <span class="tool-pill-icon">${tool.icon}</span>
            <span>${tool.name}</span>
            <span class="tool-pill-domain domain-${tool.domain}">${tool.label}</span>
          </button>
        `)}
      </div>
    `;
  }

  private renderHero(config: any) {
    const domainClass = config.domain === 'light' ? 'light' : config.domain === 'dark' ? 'dark' : config.domain === 'data' ? 'data' : 'security';
    return html`
      <div class="hero-section">
        <div class="hero-icon ${domainClass}">${config.icon}</div>
        <div class="hero-content">
          <h1 class="hero-title">${config.title}${this.loading ? html` <span style="font-size:14px;color:var(--secops-text-tertiary);">加载中...</span>` : ''}</h1>
          <span class="hero-domain ${domainClass}">${config.domain === 'light' ? '☀️ 光明面' : config.domain === 'dark' ? '🌑 黑暗面' : config.domain === 'data' ? '💾 数据中心' : '🔒 安全技术'}</span>
          <p class="hero-description">${config.description}</p>
          ${config.mitre?.length ? html`
            <div class="coverage-tags">
              ${config.mitre.map((m: string) => html`<span class="coverage-tag mitre">${m}</span>`)}
              ${config.scf.map((s: string) => html`<span class="coverage-tag scf">${s}</span>`)}
            </div>
          ` : ''}
        </div>
        <div class="hero-stats">
          <div class="hero-stat-value">${config.stats.total}</div>
          <div class="hero-stat-label">${config.stats.items}</div>
        </div>
      </div>
    `;
  }

  private renderMetrics(config: any) {
    return html`
      <div class="metrics-grid">
        ${config.metrics.map((m: any) => html`
          <div class="metric-card ${m.color}">
            <div class="metric-header">
              <div class="metric-icon">${m.icon}</div>
              ${m.trend ? html`<span class="metric-trend ${m.trend.startsWith('+') ? 'up' : 'down'}">${m.trend}</span>` : ''}
            </div>
            <div class="metric-value">${m.value}</div>
            <div class="metric-label">${m.label}</div>
          </div>
        `)}
      </div>
    `;
  }

  private renderTabs() {
    const tabs = [
      { id: 'overview', label: '📊 总览', icon: '' },
      { id: 'scan', label: '🚀 扫描', icon: '' },
      { id: 'history', label: '📋 历史', icon: '' },
      { id: 'reports', label: '📄 报告', icon: '' },
    ];
    
    return html`
      <div class="tabs-container">
        ${tabs.map(tab => html`
          <button 
            class="tab-btn ${this.activeTab === tab.id ? 'active' : ''}"
            @click=${() => this.handleTabChange(tab.id)}
          >
            ${tab.label}
          </button>
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
              ${this.activeTab === 'overview' ? '🔍 检测结果' : ''}
              ${this.activeTab === 'scan' ? '⚙️ 扫描配置' : ''}
              ${this.activeTab === 'history' ? '📋 扫描历史' : ''}
              ${this.activeTab === 'reports' ? '📄 报告中心' : ''}
            </span>
            ${this.activeTab === 'overview' ? html`<button class="btn btn-secondary">导出</button>` : ''}
          </div>
          <div class="card-body">
            ${this.activeTab === 'overview' ? this.renderOverview(config) : ''}
            ${this.activeTab === 'scan' ? this.renderScanConfig(config) : ''}
            ${this.activeTab === 'history' ? this.renderHistory(config) : ''}
            ${this.activeTab === 'reports' ? this.renderReportsCenter(config) : ''}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">⚡ 快速操作</span>
          </div>
          <div class="card-body">
            <button 
              class="btn ${this.activeTool === 'pentest' || this.activeTool === 'threathunt' ? 'btn-danger' : 'btn-primary'}" 
              style="width: 100%; margin-bottom: 16px;"
              @click=${this.runAction}
              ?disabled=${this.isRunning}
            >
              ${this.isRunning ? `执行中... ${this.progress}%` : '🚀 立即执行'}
            </button>

            ${this.isRunning ? html`
              <div class="progress-section">
                <div class="progress-bar">
                  <div class="progress-fill ${this.activeTool === 'pentest' || this.activeTool === 'threathunt' ? 'red' : 'green'}" style="width: ${this.progress}%"></div>
                </div>
              </div>
            ` : ''}

            <ul class="sidebar-list" style="margin-top: 24px;">
              <li class="sidebar-item"><span class="sidebar-item-icon">📊</span><div class="sidebar-item-content"><div class="sidebar-item-title">导出报告</div></div></li>
              <li class="sidebar-item"><span class="sidebar-item-icon">📧</span><div class="sidebar-item-content"><div class="sidebar-item-title">发送通知</div></div></li>
              <li class="sidebar-item"><span class="sidebar-item-icon">🔄</span><div class="sidebar-item-content"><div class="sidebar-item-title">计划任务</div></div></li>
              <li class="sidebar-item"><span class="sidebar-item-icon">⚙️</span><div class="sidebar-item-content"><div class="sidebar-item-title">工具配置</div></div></li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  private renderOverview(config: any) {
    const hasSeverity = config.metrics.some((m: any) => m.label === 'Critical');
    
    return html`
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>名称</th>
            <th>${hasSeverity ? '严重程度' : '状态'}</th>
            <th>类别</th>
          </tr>
        </thead>
        <tbody>
          ${config.samples.map((s: any) => html`
            <tr>
              <td><code>${s.id}</code></td>
              <td>${s.name}</td>
              <td>
                <span class="status-badge ${hasSeverity ? (s.severity || s.level) : s.status}">
                  ${hasSeverity ? (s.severity || s.level || s.status) : (s.status === 'pass' ? '通过' : s.status === 'fail' ? '失败' : s.status === 'detected' ? '发现' : s.health === 'healthy' ? '健康' : s.health === 'warning' ? '警告' : s.status === 'ready' ? '就绪' : s.status === 'sent' ? '已发送' : s.status === 'open' ? '开放' : s.status)}
                </span>
              </td>
              <td>${s.category || s.type || s.level || '-'}</td>
            </tr>
          `)}
        </tbody>
      </table>
    `;
  }

  private renderScanConfig(config: any) {
    return html`
      <div class="form-group">
        <label class="form-label">扫描范围</label>
        <select class="form-select">
          <option>全部资产 (${config.stats.total})</option>
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
      <button 
        class="btn ${this.activeTool === 'pentest' || this.activeTool === 'threathunt' ? 'btn-danger' : 'btn-primary'}" 
        style="width: 100%;"
        @click=${this.runAction}
        ?disabled=${this.isRunning}
      >
        ${this.isRunning ? `扫描中... ${this.progress}%` : '🚀 开始扫描'}
      </button>
    `;
  }

  private renderHistory(_config: any) {
    return html`
      <ul class="sidebar-list">
        <li class="sidebar-item" style="border: 1px solid var(--secops-border);">
          <span class="sidebar-item-icon">✓</span>
          <div class="sidebar-item-content">
            <div class="sidebar-item-title">全面扫描</div>
            <div class="sidebar-item-meta">今天 14:30 · 用时 12分钟</div>
          </div>
        </li>
        <li class="sidebar-item" style="border: 1px solid var(--secops-border);">
          <span class="sidebar-item-icon">✓</span>
          <div class="sidebar-item-content">
            <div class="sidebar-item-title">快速扫描</div>
            <div class="sidebar-item-meta">昨天 10:15 · 用时 3分钟</div>
          </div>
        </li>
        <li class="sidebar-item" style="border: 1px solid var(--secops-border);">
          <span class="sidebar-item-icon">⚠</span>
          <div class="sidebar-item-content">
            <div class="sidebar-item-title">深度扫描</div>
            <div class="sidebar-item-meta">3天前 · 用时 45分钟</div>
          </div>
        </li>
      </ul>
    `;
  }

  private renderReportsCenter(_config: any) {
    return html`
      <div class="empty-state">
        <div class="empty-icon">📄</div>
        <div class="empty-title">生成安全报告</div>
        <div class="empty-desc">一键生成符合合规要求的分析报告</div>
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px;">
        <button class="btn btn-secondary">📊 执行摘要</button>
        <button class="btn btn-secondary">📋 详细报告</button>
        <button class="btn btn-secondary">📧 邮件报告</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sc-secops-center': ScSecOpsCenter; }
}

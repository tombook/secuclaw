import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { gatewayClient } from '../gateway-client.js';
import '../components/design-system/sc-button.js';
import '../components/design-system/sc-card.js';
import '../components/design-system/sc-badge.js';
import '../components/sc-smart-recommendation-bar.js';

function mapTypeToIcon(type: string): string {
  const t = (type ?? '').toLowerCase();
  if (t === 'summary') return 'summary';
  if (t === 'detailed' || t === 'threat') return 'detailed';
  if (t === 'compliance') return 'compliance';
  if (t === 'security') return 'security';
  return 'threat';
}

/**
 * Analysis Reports Page - Professional Design
 * Redesigned with modern UI/UX principles
 */
@customElement('sc-reports-pro')
export class ScReportsPro extends LitElement {
  @state() private activeTab = 'all';
  @state() private selectedReport: any = null;
  @state() private searchQuery = '';
  @state() private loading = true;
  @state() private reports: any[] = [];
  @state() private _templates: any[] = [];

  private readonly fallbackReports = [
    { id: 1, name: '周度安全简报', type: 'Summary', date: '2026-03-24', time: '14:30', generatedBy: '系统自动', status: 'ready', pages: 12, icon: 'summary' },
    { id: 2, name: '漏洞分析报告', type: 'Detailed', date: '2026-03-23', time: '10:15', generatedBy: 'AI分析引擎', status: 'pending', pages: 28, icon: 'detailed' },
    { id: 3, name: '合规审计报告', type: 'Compliance', date: '2026-03-20', time: '09:00', generatedBy: '合规系统', status: 'sent', pages: 45, icon: 'compliance' },
    { id: 4, name: '红队评估报告', type: 'Security', date: '2026-03-15', time: '16:45', generatedBy: '安全团队', status: 'sent', pages: 62, icon: 'security' },
    { id: 5, name: '威胁狩猎季报', type: 'Detailed', date: '2026-03-10', time: '11:20', generatedBy: 'AI分析引擎', status: 'sent', pages: 35, icon: 'threat' },
    { id: 6, name: '渗透测试报告', type: 'Security', date: '2026-03-05', time: '14:00', generatedBy: '红队', status: 'sent', pages: 48, icon: 'security' },
    { id: 7, name: 'APT威胁分析', type: 'Detailed', date: '2026-03-01', time: '08:30', generatedBy: 'AI分析引擎', status: 'sent', pages: 22, icon: 'threat' },
  ];

  static styles = css`
    /* ========================================
       DESIGN TOKENS (8px Grid System)
       ======================================== */
    :host {
      --rpt-primary: #F59E0B;
      --rpt-primary-dark: #D97706;
      --rpt-success: #10B981;
      --rpt-warning: #F59E0B;
      --rpt-danger: #EF4444;
      --rpt-info: #3B82F6;
      
      --rpt-bg-primary: var(--sc-bg-primary, #0f172a);
      --rpt-bg-secondary: var(--sc-bg-secondary, #1e293b);
      --rpt-bg-card: var(--sc-bg-card, #1e293b);
      --rpt-bg-tertiary: var(--sc-bg-tertiary, #334155);
      --rpt-bg-hover: var(--sc-bg-hover, #475569);
      
      --rpt-text-primary: var(--sc-text-primary, #f8fafc);
      --rpt-text-secondary: var(--sc-text-secondary, #cbd5e1);
      --rpt-text-tertiary: var(--sc-text-tertiary, #94a3b8);
      
      --rpt-border: var(--sc-border-color, #334155);
      
      --rpt-radius-sm: 6px;
      --rpt-radius-md: 10px;
      --rpt-radius-lg: 16px;
      
      --rpt-shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
      --rpt-shadow-md: 0 4px 12px rgba(0,0,0,0.4);
      --rpt-shadow-lg: 0 12px 32px rgba(0,0,0,0.5);
      
      --rpt-transition: 200ms ease;
      
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      color: var(--rpt-text-primary);
      background: var(--rpt-bg-primary);
      min-height: 100vh;
    }

    /* ========================================
       LAYOUT
       ======================================== */
    .reports-container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 24px;
    }

    /* ========================================
       HERO SECTION
       ======================================== */
    .hero-section {
      display: flex;
      gap: 32px;
      align-items: flex-start;
      padding: 40px;
      background: linear-gradient(135deg, var(--rpt-bg-card) 0%, var(--rpt-bg-secondary) 100%);
      border: 1px solid var(--rpt-border);
      border-radius: var(--rpt-radius-lg);
      margin-bottom: 32px;
      position: relative;
      overflow: hidden;
    }

    .hero-section::before {
      content: '';
      position: absolute;
      top: -100px;
      right: -100px;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%);
      pointer-events: none;
    }

    .hero-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--rpt-primary) 0%, var(--rpt-primary-dark) 100%);
      border-radius: var(--rpt-radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      flex-shrink: 0;
      box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);
    }

    .hero-content { flex: 1; position: relative; z-index: 1; }

    .hero-title {
      font-size: 32px;
      font-weight: 700;
      margin: 0 0 8px;
      color: var(--rpt-text-primary);
    }

    .hero-domain {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: rgba(245, 158, 11, 0.15);
      color: var(--rpt-primary);
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 16px;
    }

    .hero-description {
      font-size: 15px;
      line-height: 1.7;
      color: var(--rpt-text-secondary);
      margin: 0;
      max-width: 600px;
    }

    .hero-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .hero-stats {
      display: flex;
      gap: 32px;
      position: relative;
      z-index: 1;
    }

    .hero-stat {
      text-align: center;
      padding: 16px 24px;
      background: var(--rpt-bg-tertiary);
      border-radius: var(--rpt-radius-md);
      min-width: 100px;
    }

    .hero-stat-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--rpt-primary);
    }

    .hero-stat-label {
      font-size: 12px;
      color: var(--rpt-text-tertiary);
      margin-top: 4px;
    }

    /* ========================================
       METRICS ROW
       ======================================== */
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }

    .metric-card {
      background: var(--rpt-bg-card);
      border: 1px solid var(--rpt-border);
      border-radius: var(--rpt-radius-md);
      padding: 24px;
      position: relative;
      overflow: hidden;
      transition: all var(--rpt-transition);
    }

    .metric-card:hover {
      border-color: var(--rpt-primary);
      transform: translateY(-2px);
    }

    .metric-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
    }

    .metric-card.orange::before { background: linear-gradient(90deg, #F59E0B, #FBBF24); }
    .metric-card.green::before { background: linear-gradient(90deg, #10B981, #34D399); }
    .metric-card.blue::before { background: linear-gradient(90deg, #3B82F6, #60A5FA); }
    .metric-card.purple::before { background: linear-gradient(90deg, #8B5CF6, #A78BFA); }

    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .metric-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .metric-card.orange .metric-icon { background: rgba(245, 158, 11, 0.15); }
    .metric-card.green .metric-icon { background: rgba(16, 185, 129, 0.15); }
    .metric-card.blue .metric-icon { background: rgba(59, 130, 246, 0.15); }
    .metric-card.purple .metric-icon { background: rgba(139, 92, 246, 0.15); }

    .metric-trend {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 10px;
      font-weight: 500;
    }

    .metric-trend.up { background: rgba(16, 185, 129, 0.15); color: #10B981; }
    .metric-trend.down { background: rgba(239, 68, 68, 0.15); color: #EF4444; }

    .metric-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--rpt-text-primary);
      line-height: 1.2;
    }

    .metric-label {
      font-size: 14px;
      color: var(--rpt-text-secondary);
      margin-top: 6px;
    }

    .metric-chart {
      height: 40px;
      margin-top: 12px;
      display: flex;
      align-items: flex-end;
      gap: 3px;
    }

    .chart-bar {
      flex: 1;
      background: var(--rpt-bg-tertiary);
      border-radius: 2px;
      transition: height var(--rpt-transition);
    }

    .chart-bar.active { background: var(--rpt-primary); }

    /* ========================================
       SEARCH & FILTER BAR
       ======================================== */
    .filter-section {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      align-items: center;
    }

    .search-box {
      flex: 1;
      min-width: 280px;
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 16px;
      color: var(--rpt-text-tertiary);
    }

    .search-input {
      width: 100%;
      padding: 12px 14px 12px 44px;
      font-size: 14px;
      background: var(--rpt-bg-card);
      border: 1px solid var(--rpt-border);
      border-radius: var(--rpt-radius-md);
      color: var(--rpt-text-primary);
      transition: border-color var(--rpt-transition);
    }

    .search-input:focus {
      outline: none;
      border-color: var(--rpt-primary);
    }

    .search-input::placeholder {
      color: var(--rpt-text-tertiary);
    }

    .filter-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .filter-pill {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 500;
      border-radius: 20px;
      border: 1px solid var(--rpt-border);
      background: var(--rpt-bg-card);
      color: var(--rpt-text-secondary);
      cursor: pointer;
      transition: all var(--rpt-transition);
    }

    .filter-pill:hover {
      border-color: var(--rpt-primary);
      color: var(--rpt-text-primary);
    }

    .filter-pill.active {
      background: rgba(245, 158, 11, 0.15);
      border-color: var(--rpt-primary);
      color: var(--rpt-primary);
    }

    /* ========================================
       CONTENT GRID
       ======================================== */
    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
    }

    @media (max-width: 1024px) {
      .content-grid { grid-template-columns: 1fr; }
      .metrics-row { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      .metrics-row { grid-template-columns: 1fr; }
      .hero-section { flex-direction: column; padding: 24px; }
      .hero-stats { flex-direction: column; width: 100%; }
      .hero-stat { width: 100%; }
    }

    /* ========================================
       CARDS
       ======================================== */
    .card {
      background: var(--rpt-bg-card);
      border: 1px solid var(--rpt-border);
      border-radius: var(--rpt-radius-lg);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid var(--rpt-border);
      background: var(--rpt-bg-secondary);
    }

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--rpt-text-primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card-body { padding: 0; }

    /* ========================================
       REPORT CARDS
       ======================================== */
    .report-list {
      display: flex;
      flex-direction: column;
    }

    .report-card {
      display: flex;
      gap: 16px;
      padding: 20px 24px;
      border-bottom: 1px solid var(--rpt-border);
      cursor: pointer;
      transition: background var(--rpt-transition);
    }

    .report-card:last-child { border-bottom: none; }
    .report-card:hover { background: var(--rpt-bg-hover); }

    .report-icon {
      width: 52px;
      height: 52px;
      border-radius: var(--rpt-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }

    .report-icon.summary { background: rgba(245, 158, 11, 0.15); }
    .report-icon.detailed { background: rgba(59, 130, 246, 0.15); }
    .report-icon.compliance { background: rgba(16, 185, 129, 0.15); }
    .report-icon.security { background: rgba(239, 68, 68, 0.15); }
    .report-icon.threat { background: rgba(139, 92, 246, 0.15); }

    .report-content { flex: 1; min-width: 0; }

    .report-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--rpt-text-primary);
      margin: 0 0 6px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .report-title-text { flex: 1; }

    .report-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 13px;
      color: var(--rpt-text-tertiary);
    }

    .report-meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .report-actions {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }

    /* ========================================
       STATUS BADGES
       ======================================== */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
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

    .status-ready { background: rgba(16, 185, 129, 0.15); color: #10B981; }
    .status-pending { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
    .status-sent { background: rgba(59, 130, 246, 0.15); color: #3B82F6; }
    .status-failed { background: rgba(239, 68, 68, 0.15); color: #EF4444; }

    /* ========================================
       BUTTONS
       ======================================== */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      border-radius: var(--rpt-radius-sm);
      border: none;
      cursor: pointer;
      transition: all var(--rpt-transition);
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--rpt-primary) 0%, var(--rpt-primary-dark) 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
    }

    .btn-secondary {
      background: var(--rpt-bg-tertiary);
      color: var(--rpt-text-primary);
      border: 1px solid var(--rpt-border);
    }

    .btn-secondary:hover {
      background: var(--rpt-bg-hover);
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
    }

    .btn-icon {
      padding: 8px;
      min-width: 36px;
    }

    /* ========================================
       SIDEBAR
       ======================================== */
    .sidebar-section {
      margin-bottom: 24px;
    }

    .sidebar-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--rpt-text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }

    .quick-action-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .quick-action {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: var(--rpt-radius-md);
      background: var(--rpt-bg-tertiary);
      cursor: pointer;
      transition: all var(--rpt-transition);
    }

    .quick-action:hover {
      background: var(--rpt-bg-hover);
      transform: translateX(4px);
    }

    .quick-action-icon {
      font-size: 18px;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--rpt-bg-card);
    }

    .quick-action-text {
      flex: 1;
    }

    .quick-action-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--rpt-text-primary);
    }

    .quick-action-desc {
      font-size: 12px;
      color: var(--rpt-text-tertiary);
    }

    /* ========================================
       EMPTY STATE
       ======================================== */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      text-align: center;
    }

    .empty-icon {
      font-size: 56px;
      opacity: 0.5;
      margin-bottom: 16px;
    }

    .empty-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--rpt-text-primary);
      margin-bottom: 8px;
    }

    .empty-desc {
      font-size: 14px;
      color: var(--rpt-text-secondary);
      max-width: 300px;
    }

    /* ========================================
       TABS
       ======================================== */
    .tabs-container {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--rpt-border);
      margin-bottom: 0;
    }

    .tab-btn {
      padding: 14px 20px;
      font-size: 14px;
      font-weight: 500;
      color: var(--rpt-text-secondary);
      background: none;
      border: none;
      cursor: pointer;
      position: relative;
      transition: all var(--rpt-transition);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tab-btn:hover { color: var(--rpt-text-primary); }
    
    .tab-btn.active {
      color: var(--rpt-primary);
    }

    .tab-btn.active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--rpt-primary);
    }

    .tab-count {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
      background: var(--rpt-bg-tertiary);
    }

    .tab-btn.active .tab-count {
      background: rgba(245, 158, 11, 0.2);
      color: var(--rpt-primary);
    }
  `;

  private getReportIcon(type: string): string {
    const t = (type ?? '').toString().toLowerCase();
    switch (t) {
      case 'summary':
        return 'summary';
      case 'detailed':
        return 'detailed';
      case 'compliance':
        return 'compliance';
      case 'security':
        return 'security';
      case 'threat':
        return 'threat';
      default:
        return 'summary';
    }
  }

  private quickActions = [
    { icon: '📊', title: '执行摘要', desc: '生成安全态势总览' },
    { icon: '🔍', title: '漏洞详情', desc: '按类型/严重性分类' },
    { icon: '✓', title: '合规报告', desc: '满足审计要求' },
    { icon: '⚔️', title: '红队评估', desc: '攻击路径分析' },
  ];

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
  }

  private async loadData() {
    this.loading = true;
    try {
      const [reportsRes, templatesRes] = await Promise.all([
        gatewayClient.request('reports.list', {}),
        gatewayClient.request('reports.listTemplates', {}),
      ]);
      const reportData = (reportsRes as any)?.data ?? reportsRes;
      if (Array.isArray(reportData) && reportData.length > 0) {
        this.reports = reportData.map((r: any) => ({
          id: r.id,
          name: r.title ?? r.name ?? '未命名报告',
          type: r.type ?? 'Summary',
          date: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          time: r.createdAt ? new Date(r.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '00:00',
          generatedBy: r.generatedBy ?? '系统',
          status: r.status === 'completed' ? 'ready' : r.status === 'generating' ? 'pending' : (r.status ?? 'ready'),
          pages: r.pages ?? Math.floor(Math.random() * 40) + 10,
          icon: this.getReportIcon(r.type ?? 'Summary'),
        }));
      } else {
        this.reports = this.fallbackReports.map(r => ({ ...r }));
      }
      const templateData = (templatesRes as any)?.data ?? templatesRes;
      if (Array.isArray(templateData) && templateData.length > 0) {
        this._templates = [...templateData];
      }
    } catch {
      this.reports = this.fallbackReports.map(r => ({ ...r }));
    } finally {
      this.loading = false;
    }
  }

  private async exportReport(report: any) {
    if (!report) return;
    try {
      const res = await gatewayClient.request('reports.get', { id: report.id ?? report.reportId ?? String(report.id) });
      const data: any = (res as any)?.data ?? res;
      const url = data?.downloadUrl ?? data?.url ?? null;
      if (url) {
        window.open(url, '_blank');
        return;
      }
      const blob = data?.blob ?? null;
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${report.name ?? 'report'}.pdf`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error('exportReport error', err);
    }
  }

  private async exportAllReports() {
    const list = this.getFilteredReports();
    for (const r of list) {
      try {
        await this.exportReport(r);
      } catch {
        // error exporting one report; continue exporting others
      }
    }
  }

  private async handleQuickAction(action: any) {
    if (!action) return;
    switch (action.title) {
      case '执行摘要':
        await this.generateReport('tpl-summary');
        break;
      case '漏洞详情':
        await this.generateReport('tpl-detailed');
        break;
      case '合规报告':
        await this.generateReport('tpl-compliance');
        break;
      case '红队评估':
        await this.generateReport('tpl-security');
        break;
      default:
        await this.generateReport();
        break;
    }
    // Refresh to reflect newly generated reports
    await this.loadData();
  }

  private async generateReport(templateId?: string) {
    try {
      const payload: any = {};
      if (templateId) payload.templateId = templateId;
      const res = await gatewayClient.request('reports.generate', payload);
      const data: any = (res as any)?.data ?? res;
      const item = Array.isArray(data) ? data[0] : data?.report ?? data;
      if (item) {
        const added = {
          id: item.id ?? item.reportId ?? String(item.id),
          name: item.title ?? item.name ?? 'New Report',
          type: item.type ?? item.category ?? 'Summary',
          date: item.generatedAt ? new Date(item.generatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          time: item.generatedAt ? new Date(item.generatedAt).toISOString().split('T')[1] ?? '' : '',
          generatedBy: item.generatedBy ?? 'System',
          status: item.status ?? 'ready',
          pages: item.pages ?? 0,
          icon: this.getReportIcon(item.type),
        };
        this.reports = [added, ...this.reports];
      }
    } catch (err) {
      console.error('generateReport error', err);
    }
  }

  private handleTabChange(tab: string) {
    this.activeTab = tab;
  }

  private getStatusLabel(status: string) {
    switch (status) {
      case 'ready': return '✓ 就绪';
      case 'pending': return '⏳ 生成中';
      case 'sent': return '📧 已发送';
      case 'failed': return '✗ 失败';
      default: return status;
    }
  }

  private getTypeLabel(type: string) {
    switch (type) {
      case 'Summary': return '📊 摘要';
      case 'Detailed': return '🔍 详情';
      case 'Compliance': return '✓ 合规';
      case 'Security': return '⚔️ 安全';
      default: return type;
    }
  }

  private getFilteredReports() {
    let filtered = this.reports;
    if (this.activeTab !== 'all') {
      filtered = filtered.filter(r => r.status === this.activeTab);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.type.toLowerCase().includes(q)
      );
    }
    return filtered;
  }

  render() {
    if (this.loading) {
      return html`<div style="display:flex;justify-content:center;align-items:center;min-height:400px;"><div style="text-align:center;"><div style="font-size:48px;margin-bottom:16px;">⏳</div><div style="color:var(--rpt-text-secondary);">加载中...</div></div></div>`;
    }

    const filteredReports = this.getFilteredReports();
    const readyCount = this.reports.filter(r => r.status === 'ready').length;
    const pendingCount = this.reports.filter(r => r.status === 'pending').length;
    const sentCount = this.reports.filter(r => r.status === 'sent').length;

    return html`
      <sc-smart-recommendation-bar></sc-smart-recommendation-bar>
      <div class="reports-container">
        ${this.renderHero()}
        ${this.renderMetrics(readyCount, pendingCount, sentCount)}
        ${this.renderTabs()}
        ${this.renderContent(filteredReports)}
      </div>
    `;
  }

  private renderHero() {
    return html`
      <div class="hero-section">
        <div class="hero-icon">📊</div>
        <div class="hero-content">
          <h1 class="hero-title">分析报告</h1>
          <span class="hero-domain">📊 分析洞察</span>
          <p class="hero-description">
            生成多维度安全分析报告，支持自定义模板和自动定时推送。涵盖漏洞分析、合规审计、红队评估等各类专业报告。
          </p>
          <div class="hero-actions">
            <sc-button size="sm" variant="primary" @click=${() => this.generateReport()}>🚀 生成新报告</sc-button>
            <sc-button size="sm" variant="secondary">⚙️ 报告模板</sc-button>
          </div>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <div class="hero-stat-value">${this.reports.length}</div>
            <div class="hero-stat-label">总报告数</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-value">${this.reports.reduce((sum, r) => sum + r.pages, 0)}</div>
            <div class="hero-stat-label">总页数</div>
          </div>
        </div>
        ${this.selectedReport ? html`<div style="display:none">Selected: ${this.selectedReport.name}</div>` : ''}
      </div>
    `;
  }

  private renderMetrics(ready: number, pending: number, sent: number) {
    const chartData = [30, 45, 60, 45, 55, 70, 65, 80];
    const maxVal = Math.max(...chartData);

    return html`
      <div class="metrics-row">
        <div class="metric-card orange">
          <div class="metric-header">
            <div class="metric-icon">📋</div>
            <span class="metric-trend up">+3</span>
          </div>
          <div class="metric-value">${this.reports.length}</div>
          <div class="metric-label">本周生成</div>
          <div class="metric-chart">
            ${chartData.slice(0, 4).map((v, i) => html`
              <div class="chart-bar ${i === 3 ? 'active' : ''}" style="height: ${(v / maxVal) * 100}%"></div>
            `)}
          </div>
        </div>

        <div class="metric-card green">
          <div class="metric-header">
            <div class="metric-icon">✓</div>
          </div>
          <div class="metric-value">${ready}</div>
          <div class="metric-label">待查看</div>
        </div>

        <div class="metric-card purple">
          <div class="metric-header">
            <div class="metric-icon">⏳</div>
          </div>
          <div class="metric-value">${pending}</div>
          <div class="metric-label">生成中</div>
        </div>

        <div class="metric-card blue">
          <div class="metric-header">
            <div class="metric-icon">📧</div>
            <span class="metric-trend up">+12</span>
          </div>
          <div class="metric-value">${sent}</div>
          <div class="metric-label">已发送</div>
        </div>
      </div>
    `;
  }

  private renderTabs() {
    const filteredReports = this.getFilteredReports();
    
    return html`
      <div class="card" style="margin-bottom: 24px;">
        <div class="filter-section" style="padding: 16px 24px; margin: 0; border-bottom: 1px solid var(--rpt-border);">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              class="search-input" 
              placeholder="搜索报告名称..."
              .value=${this.searchQuery}
              @input=${(e: any) => this.searchQuery = e.target.value}
            >
          </div>
          <div class="filter-pills">
            <button class="filter-pill ${this.activeTab === 'all' ? 'active' : ''}" @click=${() => this.handleTabChange('all')}>
              全部 (${this.reports.length})
            </button>
            <button class="filter-pill ${this.activeTab === 'ready' ? 'active' : ''}" @click=${() => this.handleTabChange('ready')}>
              就绪 (${filteredReports.filter(r => r.status === 'ready').length})
            </button>
            <button class="filter-pill ${this.activeTab === 'pending' ? 'active' : ''}" @click=${() => this.handleTabChange('pending')}>
              生成中 (${filteredReports.filter(r => r.status === 'pending').length})
            </button>
            <button class="filter-pill ${this.activeTab === 'sent' ? 'active' : ''}" @click=${() => this.handleTabChange('sent')}>
              已发送 (${filteredReports.filter(r => r.status === 'sent').length})
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderContent(reports: any[]) {
    return html`
      <div class="content-grid">
        <div class="card">
          <div class="card-header">
            <span class="card-title">📄 报告列表</span>
            <sc-button size="sm" variant="secondary" @click=${() => this.exportAllReports()}>导出全部</sc-button>
          </div>
          <div class="card-body" style="padding: 0;">
            ${reports.length > 0 ? html`
              <div class="report-list">
                ${reports.map(report => html`
                  <div class="report-card">
                    <div class="report-icon ${report.icon}">${this.getIconForType(report.icon)}</div>
                    <div class="report-content">
                      <div class="report-title">
                        <span class="report-title-text">${report.name}</span>
                        <span class="status-badge status-${report.status}">${this.getStatusLabel(report.status)}</span>
                      </div>
                      <div class="report-meta">
                        <span class="report-meta-item">📅 ${report.date} ${report.time}</span>
                        <span class="report-meta-item">👤 ${report.generatedBy}</span>
                        <span class="report-meta-item">📄 ${report.pages}页</span>
                        <span class="report-meta-item">${this.getTypeLabel(report.type)}</span>
                      </div>
                    </div>
                    <div class="report-actions">
                      <sc-button size="sm" variant="primary" @click=${() => this.selectedReport = report}>查看</sc-button>
                      <sc-button size="sm" variant="secondary" @click=${() => this.exportReport(report)}>导出</sc-button>
                    </div>
                  </div>
                `)}
              </div>
            ` : html`
              <div class="empty-state">
                <div class="empty-icon">📋</div>
                <div class="empty-title">暂无报告</div>
                <div class="empty-desc">没有找到符合条件的报告</div>
              </div>
            `}
          </div>
        </div>

        <div class="sidebar">
          <div class="card">
            <div class="card-header">
              <span class="card-title">⚡ 快速操作</span>
            </div>
            <div class="card-body" style="padding: 16px;">
              <div class="sidebar-section">
                <div class="sidebar-title">常用报告</div>
                <div class="quick-action-list">
                  ${this.quickActions.map(action => html`
                    <div class="quick-action" @click=${() => this.handleQuickAction(action)}>
                      <div class="quick-action-icon">${action.icon}</div>
                      <div class="quick-action-text">
                        <div class="quick-action-title">${action.title}</div>
                        <div class="quick-action-desc">${action.desc}</div>
                      </div>
                    </div>
                  `)}
                </div>
              </div>

              <div class="sidebar-section" style="margin-top: 24px;">
                <div class="sidebar-title">定时任务</div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--rpt-bg-tertiary); border-radius: 8px;">
                    <div>
                      <div style="font-size: 14px; font-weight: 500;">周度简报</div>
                      <div style="font-size: 12px; color: var(--rpt-text-tertiary);">每周一 09:00</div>
                    </div>
                    <label style="position: relative; display: inline-block; width: 40px; height: 22px;">
                      <input type="checkbox" checked style="opacity: 0; width: 0; height: 0;">
                      <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: var(--rpt-primary); border-radius: 22px; transition: 0.3s;">
                      <span style="position: absolute; content: ''; height: 16px; width: 16px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s;"></span>
                    </label>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--rpt-bg-tertiary); border-radius: 8px;">
                    <div>
                      <div style="font-size: 14px; font-weight: 500;">月度审计</div>
                      <div style="font-size: 12px; color: var(--rpt-text-tertiary);">每月1日 08:00</div>
                    </div>
                    <label style="position: relative; display: inline-block; width: 40px; height: 22px;">
                      <input type="checkbox" checked style="opacity: 0; width: 0; height: 0;">
                      <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: var(--rpt-primary); border-radius: 22px; transition: 0.3s;">
                      <span style="position: absolute; content: ''; height: 16px; width: 16px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s;"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private getIconForType(icon: string) {
    switch (icon) {
      case 'summary': return '📊';
      case 'detailed': return '🔍';
      case 'compliance': return '✓';
      case 'security': return '⚔️';
      case 'threat': return '🎯';
      default: return '📄';
    }
  }

  private _getSelectedReportName(): string {
    return (this.selectedReport?.name) ?? '';
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sc-reports-pro': ScReportsPro; }
}

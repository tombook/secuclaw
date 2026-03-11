/**
 * SecuClaw Analysis Reports Page - 分析报告页面
 * 
 * 报告生成、报告管理、数据洞察、报告导出
 * AI能力: 报告生成、数据洞察
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { aiService, type SmartInsight, type AIRecommendation } from '../ai-service.js';
import '../components/sc-ai-assistant.js';
import '../components/sc-smart-card.js';

// ============ 类型定义 ============

type ReportType = 'executive' | 'technical' | 'compliance' | 'incident' | 'risk' | 'vulnerability';
type ReportStatus = 'draft' | 'generating' | 'completed' | 'scheduled';
type ReportFormat = 'pdf' | 'html' | 'word' | 'excel';

interface Report {
  id: string;
  title: string;
  type: ReportType;
  status: ReportStatus;
  format: ReportFormat;
  author: string;
  createdAt: Date;
  scheduledFor?: Date;
  period: { start: Date; end: Date };
  summary: string;
  aiInsight?: string;
  sections: ReportSection[];
}

interface ReportSection {
  id: string;
  title: string;
  content: string;
  charts?: ChartData[];
}

interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'table';
  title: string;
  data: Record<string, unknown>[];
}

interface ReportTemplate {
  id: string;
  name: string;
  type: ReportType;
  description: string;
  sections: string[];
}

// ============ 页面组件 ============

@customElement('sc-reports-page')
export class ScReportsPage extends LitElement {
  private i18n = new I18nController(this);

  @state() private loading = true;
  @state() private reports: Report[] = [];
  @state() private templates: ReportTemplate[] = [];
  @state() private insights: SmartInsight[] = [];
  @state() private recommendations: AIRecommendation[] = [];
  @state() private selectedReport: Report | null = null;
  @state() private filterType: ReportType | 'all' = 'all';

  staticstyles= css`
    :host { display: block; }
    .reports-container{
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: var(--sc-spacing-lg, 20px);
      height: 100%;
    }
    @media (max-width: 1200px) {
      .reports-container { grid-template-columns: 1fr; }
    }
    .main-content{
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-lg, 20px);
      overflow-y: auto;
    }
    .page-header{
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .page-title{
      font-size: var(--sc-font-size-2xl, 24px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
    }
    .header-actions{
      display: flex;
      gap: var(--sc-spacing-sm, 8px);
    }
    .btn{
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 16px);
      border-radius: var(--sc-radius-md, 8px);
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }
    .btn-primary{
      background-color: var(--sc-primary, #3b82f6);
      color: white;
    }
    .btn-secondary{
      background-color: var(--sc-bg-secondary, #f8fafc);
      color: var(--sc-text-primary, #1e293b);
      border: 1px solid var(--sc-border-color, #e2e8f0);
    }
    /* 统计卡片 */
    .stats-grid{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--sc-spacing-md, 16px);
    }
    @media (max-width: 900px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
    /* 模板区域 */
    .templates-section{
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }
    .section-header{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-md, 16px);
    }
    .section-title{
      font-size: var(--sc-font-size-lg, 18px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
    }
    .templates-grid{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--sc-spacing-md, 16px);
    }
    .template-card{
      padding: var(--sc-spacing-md, 16px);
      background-color: var(--sc-bg-secondary, #f8fafc);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-md, 8px);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .template-card:hover{
      border-color: var(--sc-primary, #3b82f6);
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
    }
    .template-icon{
      font-size: 24px;
      margin-bottom: var(--sc-spacing-sm, 8px);
    }
    .template-name{
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      color: var(--sc-text-primary, #1e293b);
    }
    .template-desc{
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
      margin-top: 4px;
    }
    /* 报告列表 */
    .reports-section{
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }
    .filter-bar{
      display: flex;
      gap: var(--sc-spacing-sm, 8px);
      margin-bottom: var(--sc-spacing-md, 16px);
      flex-wrap: wrap;
    }
    .filter-chip{
      padding: var(--sc-spacing-xs, 4px) var(--sc-spacing-sm, 8px);
      border-radius: var(--sc-radius-full, 999px);
      font-size: var(--sc-font-size-sm, 14px);
      cursor: pointer;
      border: 1px solid var(--sc-border-color, #e2e8f0);
      background-color: var(--sc-bg-secondary, #f8fafc);
      transition: all 0.2s ease;
    }
    .filter-chip.active{
      background-color: var(--sc-primary, #3b82f6);
      color: white;
      border-color: var(--sc-primary, #3b82f6);
    }
    .reports-table{
      width: 100%;
      border-collapse: collapse;
    }
    .reports-table th,
    .reports-table td{
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 16px);
      text-align: left;
      border-bottom: 1px solid var(--sc-border-color, #e2e8f0);
    }
    .reports-table th{
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 600;
      color: var(--sc-text-secondary, #64748b);
      text-transform: uppercase;
    }
    .reports-table tr:hover{
      background-color: var(--sc-bg-secondary, #f8fafc);
    }
    .reports-table tr.selected{
      background-color: rgba(59, 130, 246, 0.05);
    }
    .report-title{
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      color: var(--sc-text-primary, #1e293b);
    }
    .type-badge{
      padding: 2px 6px;
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-xs, 12px);
    }
    .type-badge.executive{ background-color: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
    .type-badge.technical{ background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .type-badge.compliance{ background-color: rgba(34, 197, 94, 0.1); color: #22c55e; }
    .type-badge.incident{ background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .type-badge.risk{ background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .type-badge.vulnerability{ background-color: rgba(236, 72, 153, 0.1); color: #ec4899; }
    .status-badge{
      padding: 2px 6px;
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-xs, 12px);
    }
    .status-badge.draft{ background-color: rgba(100, 116, 139, 0.1); color: #64748b; }
    .status-badge.generating{ background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .status-badge.completed{ background-color: rgba(34, 197, 94, 0.1); color: #22c55e; }
    .status-badge.scheduled{ background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .format-icon{
      font-size: 16px;
    }
    .action-btn{
      padding: 4px 8px;
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-xs, 12px);
      cursor: pointer;
      border: 1px solid var(--sc-border-color, #e2e8f0);
      background-color: var(--sc-bg-secondary, #f8fafc);
      margin-right: 4px;
    }
    .action-btn:hover{
      background-color: var(--sc-bg-tertiary, #f1f5f9);
    }
    /* AI洞察 */
    .insights-section{
      background-color: rgba(59, 130, 246, 0.05);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }
    .ai-title{
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 600;
      color: var(--sc-primary, #3b82f6);
      margin-bottom: var(--sc-spacing-sm, 8px);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs, 4px);
    }
    .insight-list{
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-xs, 4px);
    }
    .insight-item{
      display: flex;
      align-items: flex-start;
      gap: var(--sc-spacing-sm, 8px);
      padding: var(--sc-spacing-sm, 8px);
      background-color: rgba(255, 255, 255, 0.5);
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #64748b);
    }
    .ai-sidebar{
      position: sticky;
      top: 0;
      height: calc(100vh - var(--sc-spacing-lg, 20px) * 2);
      overflow: hidden;
    }
  `;

  constructor() {
    super();
    this.loadReportsData();
  }

  private async loadReportsData() {
    this.loading = true;
    try {
      await this.loadReports();
      await this.loadTemplates();
      await this.loadAIInsights();
    } finally {
      this.loading = false;
    }
  }

  private async loadReports() {
    this.reports = [
      { id: 'r1', title: '2024年Q1安全态势报告', type: 'executive', status: 'completed', format: 'pdf', author: '系统', createdAt: new Date('2024-04-01'), period: { start: new Date('2024-01-01'), end: new Date('2024-03-31') }, summary: '本季度安全态势整体良好，共处理安全事件156起，修复漏洞89个', aiInsight: '建议加强供应链安全管理', sections: [] },
      { id: 'r2', title: '勒索软件攻击分析报告', type: 'incident', status: 'completed', format: 'pdf', author: '张安全', createdAt: new Date('2024-03-10'), period: { start: new Date('2024-03-01'), end: new Date('2024-03-10') }, summary: 'LockBit 3.0勒索软件攻击分析，包含攻击链、影响范围和处置建议', sections: [] },
      { id: 'r3', title: 'ISO 27001合规审计报告', type: 'compliance', status: 'generating', format: 'pdf', author: 'AI助手', createdAt: new Date(), period: { start: new Date('2024-01-01'), end: new Date('2024-03-31') }, summary: '正在生成...', sections: [] },
      { id: 'r4', title: '月度漏洞扫描报告', type: 'vulnerability', status: 'scheduled', format: 'html', author: '系统', createdAt: new Date('2024-03-01'), scheduledFor: new Date('2024-04-01'), period: { start: new Date('2024-03-01'), end: new Date('2024-03-31') }, summary: '计划中', sections: [] },
      { id: 'r5', title: '风险评估报告', type: 'risk', status: 'draft', format: 'word', author: '王合规', createdAt: new Date('2024-03-05'), period: { start: new Date('2024-01-01'), end: new Date('2024-03-31') }, summary: '草稿状态', sections: [] },
    ];
  }

  private async loadTemplates() {
    this.templates = [
      { id: 't1', name: '执行摘要报告', type: 'executive', description: '面向高管的安全态势摘要', sections: ['概述', '关键指标', '趋势分析', '建议'] },
      { id: 't2', name: '技术分析报告', type: 'technical', description: '详细的技术安全分析', sections: ['漏洞详情', '威胁分析', '配置审计', '修复建议'] },
      { id: 't3', name: '合规报告', type: 'compliance', description: '合规框架评估报告', sections: ['框架概述', '控制项评估', '差距分析', '整改计划'] },
      { id: 't4', name: '事件响应报告', type: 'incident', description: '安全事件响应分析', sections: ['事件概述', '影响分析', '响应时间线', '经验教训'] },
      { id: 't5', name: '风险评估报告', type: 'risk', description: '组织风险评估报告', sections: ['风险识别', '风险分析', '风险处置', '监控计划'] },
      { id: 't6', name: '漏洞管理报告', type: 'vulnerability', description: '漏洞扫描和修复报告', sections: ['扫描概览', '漏洞分布', '修复进度', '趋势分析'] },
    ];
  }

  private async loadAIInsights() {
    try {
      this.insights = await aiService.generateInsights('reports', { reports: this.reports });
      this.recommendations = await aiService.generateRecommendations('reports', { reports: this.reports });
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    }
  }

  private handleFilterChange(type: ReportType | 'all') {
    this.filterType = type;
  }

  private handleReportClick(report: Report) {
    this.selectedReport = this.selectedReport?.id === report.id? null : report;
  }

  private getFilteredReports() {
    if (this.filterType === 'all') return this.reports;
    return this.reports.filter(r => r.type === this.filterType);
  }

  private getFormatIcon(format: ReportFormat): string {
    const icons: Record<ReportFormat, string> = { pdf: '📄', html: '🌐', word: '📝', excel: '📊' };
    return icons[format];
  }

  render() {
    if (this.loading) {
      return html`<div style="text-align:center;padding:2rem;"><div style="font-size:48px;margin-bottom:16px;">⏳</div><div style="color:var(--sc-text-secondary);">${this.i18n.t('common.loading')}</div></div>`;
    }

    const completedCount = this.reports.filter(r => r.status === 'completed').length;
    const generatingCount = this.reports.filter(r => r.status === 'generating').length;
    const scheduledCount = this.reports.filter(r => r.status === 'scheduled').length;
    const draftCount = this.reports.filter(r => r.status === 'draft').length;

    return html`
      <div class="reports-container">
        <div class="main-content">
          <div class="page-header">
            <h1 class="page-title">${this.i18n.t('nav.reports') || '分析报告'}</h1>
            <div class="header-actions">
              <button class="btn btn-secondary">📅 计划任务</button>
              <button class="btn btn-primary">+ 新建报告</button>
            </div>
          </div>

          <div class="stats-grid">
            <sc-smart-card title="已完成" value="${completedCount}" icon="✅" status="success"></sc-smart-card>
            <sc-smart-card title="生成中" value="${generatingCount}" icon="⏳" status="warning"></sc-smart-card>
            <sc-smart-card title="已计划" value="${scheduledCount}" icon="📅" status="neutral"></sc-smart-card>
            <sc-smart-card title="草稿" value="${draftCount}" icon="📝" status="neutral"></sc-smart-card>
          </div>

          <div class="templates-section">
            <div class="section-header">
              <h3 class="section-title">📋 报告模板</h3>
            </div>
            <div class="templates-grid">
              ${this.templates.map(template => html`
                <div class="template-card">
                  <div class="template-icon">${template.type === 'executive'? '📊': template.type === 'technical'? '🔧': template.type === 'compliance'? '✅': template.type === 'incident'? '🚨': template.type === 'risk'? '⚠️': '🐛'}</div>
                  <div class="template-name">${template.name}</div>
                  <div class="template-desc">${template.description}</div>
                </div>
              `)}
            </div>
          </div>

          <div class="reports-section">
            <div class="section-header">
              <h3 class="section-title">📄 报告列表</h3>
            </div>
            
            <div class="filter-bar">
              <button class="filter-chip ${this.filterType === 'all'? 'active': ''}" @click=${() => this.handleFilterChange('all')}>全部</button>
              <button class="filter-chip ${this.filterType === 'executive'? 'active': ''}" @click=${() => this.handleFilterChange('executive')}>执行摘要</button>
              <button class="filter-chip ${this.filterType === 'technical'? 'active': ''}" @click=${() => this.handleFilterChange('technical')}>技术分析</button>
              <button class="filter-chip ${this.filterType === 'compliance'? 'active': ''}" @click=${() => this.handleFilterChange('compliance')}>合规报告</button>
              <button class="filter-chip ${this.filterType === 'incident'? 'active': ''}" @click=${() => this.handleFilterChange('incident')}>事件报告</button>
            </div>

            <table class="reports-table">
              <thead>
                <tr>
                  <th>标题</th>
                  <th>类型</th>
                  <th>状态</th>
                  <th>格式</th>
                  <th>作者</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                ${this.getFilteredReports().map(report => html`
                  <tr class="${this.selectedReport?.id === report.id? 'selected': ''}" @click=${() => this.handleReportClick(report)}>
                    <td><span class="report-title">${report.title}</span></td>
                    <td><span class="type-badge ${report.type}">${report.type}</span></td>
                    <td><span class="status-badge ${report.status}">${report.status}</span></td>
                    <td><span class="format-icon">${this.getFormatIcon(report.format)}</span></td>
                    <td>${report.author}</td>
                    <td>${report.createdAt.toLocaleDateString()}</td>
                    <td>
                      <button class="action-btn">👁️ 查看</button>
                      <button class="action-btn">📥 下载</button>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>

          ${this.insights.length > 0? html`
            <div class="insights-section">
              <div class="ai-title">🤖 AI数据洞察</div>
              <div class="insight-list">
                ${this.insights.slice(0, 3).map(insight => html`
                  <div class="insight-item">
                    <span>💡</span>
                    <span>${insight.title}: ${insight.description}</span>
                  </div>
                `)}
              </div>
            </div>
          `: ''}
        </div>

        <div class="ai-sidebar">
          <sc-ai-assistant
            pageId="reports"
            pageTitle="分析报告"
            .pageData=${{ reports: this.reports, templates: this.templates }}
            userRole="security-expert"
          ></sc-ai-assistant>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-reports-page': ScReportsPage;
  }
}

/**
 * SecuClaw Security Risk Page - 安全风险页面
 * 
 * 风险评估、风险量化、风险处置、风险趋势
 * AI能力: 风险评估、处置建议
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { aiService, type SmartInsight, type AIRecommendation, type TrendPrediction } from '../ai-service.js';
import '../components/sc-ai-assistant.js';
import '../components/sc-smart-card.js';
import '../components/sc-metric-card.js';

// ============ 类型定义 ============

type RiskCategory = 'strategic' | 'operational' | 'compliance' | 'financial' | 'reputational';
type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
type RiskStatus = 'open' | 'mitigating' | 'accepted' | 'closed';
type TreatmentType = 'avoid' | 'transfer' | 'mitigate' | 'accept';

interface Risk {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  level: RiskLevel;
  status: RiskStatus;
  owner?: string;
  affectedAssets: string[];
  likelihood: number;
  impact: number;
  riskScore: number;
  treatment?: {
    type: TreatmentType;
    description: string;
    dueDate?: Date;
    progress: number;
  };
  createdAt: Date;
  updatedAt: Date;
  aiAssessment?: string;
  aiTreatmentRecommendation?: string;
}

// ============ 页面组件 ============

@customElement('sc-risk-page')
export class ScRiskPage extends LitElement {
  private i18n = new I18nController(this);

  @state() private loading = true;
  @state() private risks: Risk[] = [];
  @state() private filteredRisks: Risk[] = [];
  @state() private insights: SmartInsight[] = [];
  @state() private recommendations: AIRecommendation[] = [];
  @state() private predictions: TrendPrediction[] = [];
  @state() private selectedRisk: Risk | null = null;
  @state() private categoryFilter: RiskCategory |'all' = 'all';
  @state() private levelFilter: RiskLevel|'all' = 'all';

  static styles = css`
    :host { display: block; }
    .risk-container {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: var(--sc-spacing-lg, 20px);
      height: 100%;
    }
    @media (max-width: 1200px) {
      .risk-container { grid-template-columns: 1fr; }
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
    /* 风险矩阵 */
    .matrix-section{
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
    .risk-matrix{
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 2px;
    }
    .matrix-cell{
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-xs, 12px);
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .matrix-cell:hover{
      transform: scale(1.05);
      z-index: 1;
    }
    .matrix-cell.critical{ background-color: var(--sc-danger, #ef4444); }
    .matrix-cell.high{ background-color: var(--sc-warning, #f59e0b); }
    .matrix-cell.medium{ background-color: var(--sc-primary, #3b82f6); }
    .matrix-cell.low{ background-color: var(--sc-success, #22c55e); }
    .matrix-cell.empty{ background-color: var(--sc-bg-tertiary, #f1f5f9); color: var(--sc-text-tertiary, #94a3b8); }
    /* 风险列表 */
    .risk-section{
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
    .risk-list{
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-sm, 8px);
    }
    .risk-item{
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md, 16px);
      padding: var(--sc-spacing-md, 16px);
      background-color: var(--sc-bg-secondary, #f8fafc);
      border-radius: var(--sc-radius-md, 8px);
      cursor: pointer;
      transition: all 0.2s ease;
      border-left: 4px solid transparent;
    }
    .risk-item:hover{
      background-color: var(--sc-bg-tertiary, #f1f5f9);
    }
    .risk-item.critical{ border-left-color: var(--sc-danger, #ef4444); }
    .risk-item.high{ border-left-color: var(--sc-warning, #f59e0b); }
    .risk-item.medium{ border-left-color: var(--sc-primary, #3b82f6); }
    .risk-item.low{ border-left-color: var(--sc-success, #22c55e); }
    .risk-item.selected{
      background-color: rgba(59, 130, 246, 0.1);
    }
    .risk-score{
      width: 48px;
      height: 48px;
      border-radius: var(--sc-radius-md, 8px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--sc-font-size-lg, 18px);
      font-weight: 700;
      color: white;
    }
    .risk-score.critical{ background-color: var(--sc-danger, #ef4444); }
    .risk-score.high{ background-color: var(--sc-warning, #f59e0b); }
    .risk-score.medium{ background-color: var(--sc-primary, #3b82f6); }
    .risk-score.low{ background-color: var(--sc-success, #22c55e); }
    .risk-info{
      flex: 1;
    }
    .risk-title{
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      color: var(--sc-text-primary, #1e293b);
      margin-bottom: var(--sc-spacing-xs, 4px);
    }
    .risk-meta{
      display: flex;
      gap: var(--sc-spacing-md, 16px);
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
    }
    .category-badge{
      padding: 2px 6px;
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-xs, 12px);
    }
    .category-badge.strategic{ background-color: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
    .category-badge.operational{ background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .category-badge.compliance{ background-color: rgba(34, 197, 94, 0.1); color: #22c55e; }
    .category-badge.financial{ background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .category-badge.reputational{ background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .status-badge{
      padding: 2px 6px;
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-xs, 12px);
    }
    .status-badge.open{ background-color: rgba(239, 68, 68, 0.1); color: var(--sc-danger, #ef4444); }
    .status-badge.mitigating{ background-color: rgba(59, 130, 246, 0.1); color: var(--sc-primary, #3b82f6); }
    .status-badge.accepted{ background-color: rgba(245, 158, 11, 0.1); color: var(--sc-warning, #f59e0b); }
    .status-badge.closed{ background-color: rgba(34, 197, 94, 0.1); color: var(--sc-success, #22c55e); }
    /* 风险详情 */
    .risk-detail{
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
      margin-top: var(--sc-spacing-lg, 20px);
    }
    .detail-header{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--sc-spacing-md, 16px);
      padding-bottom: var(--sc-spacing-md, 16px);
      border-bottom: 1px solid var(--sc-border-color, #e2e8f0);
    }
    .detail-title{
      font-size: var(--sc-font-size-lg, 18px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
    }
    .detail-grid{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--sc-spacing-md, 16px);
    }
    .detail-item label{
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
      display: block;
      margin-bottom: var(--sc-spacing-xs, 4px);
    }
    .detail-item span{
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-primary, #1e293b);
    }
    .treatment-section{
      margin-top: var(--sc-spacing-md, 16px);
      padding: var(--sc-spacing-md, 16px);
      background-color: var(--sc-bg-secondary, #f8fafc);
      border-radius: var(--sc-radius-md, 8px);
    }
    .treatment-header{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-sm, 8px);
    }
    .treatment-type{
      padding: 2px 8px;
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 500;
    }
    .treatment-type.avoid{ background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .treatment-type.transfer{ background-color: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
    .treatment-type.mitigate{ background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .treatment-type.accept{ background-color: rgba(34, 197, 94, 0.1); color: #22c55e; }
    .progress-bar{
      height: 6px;
      background-color: var(--sc-bg-tertiary, #f1f5f9);
      border-radius: var(--sc-radius-full, 999px);
      overflow: hidden;
      margin-top: var(--sc-spacing-xs, 4px);
    }
    .progress-fill{
      height: 100%;
      background-color: var(--sc-primary, #3b82f6);
      border-radius: var(--sc-radius-full, 999px);
      transition: width 0.3s ease;
    }
    .ai-section{
      background-color: rgba(59, 130, 246, 0.05);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: var(--sc-radius-md, 8px);
      padding: var(--sc-spacing-md, 16px);
      margin-top: var(--sc-spacing-md, 16px);
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
    .ai-content{
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
    this.loadRiskData();
  }

  private async loadRiskData() {
    this.loading = true;
    try {
      await this.loadRisks();
      await this.loadAIInsights();
    } finally {
      this.loading = false;
    }
  }

  private async loadRisks() {
    this.risks = [
      {
        id: 'r1', title: '供应链攻击风险', description: '第三方供应商可能存在安全漏洞，导致供应链攻击', category: 'strategic', level: 'critical', status: 'open',
        owner: '张采购', affectedAssets: ['供应链系统', 'ERP系统', '供应商门户'],
        likelihood: 4, impact: 5, riskScore: 20,
        treatment: { type: 'mitigate', description: '实施供应商安全评估计划', dueDate: new Date('2024-04-01'), progress: 30 },
        createdAt: new Date('2024-02-15'), updatedAt: new Date('2024-03-08'),
        aiAssessment: '该风险影响核心业务系统，建议优先处理',
        aiTreatmentRecommendation: '1. 建立供应商安全评估流程\n2. 要求供应商通过安全认证\n3. 实施供应链安全监控'
      },
      {
        id: 'r2', title: '勒索软件攻击风险', description: '员工可能点击钓鱼邮件导致勒索软件感染', category: 'operational', level: 'high', status: 'mitigating',
        owner: '李安全', affectedAssets: ['员工工作站', '文件服务器', '备份系统'],
        likelihood: 3, impact: 5, riskScore: 15,
        treatment: { type: 'mitigate', description: '部署EDR和加强安全意识培训', progress: 60 },
        createdAt: new Date('2024-01-20'), updatedAt: new Date('2024-03-05')
      },
      {
        id: 'r3', title: '数据泄露风险', description: '敏感数据可能因内部人员或系统漏洞泄露', category: 'compliance', level: 'high', status: 'open',
        owner: '王合规', affectedAssets: ['客户数据库', '员工信息', '财务数据'],
        likelihood: 3, impact: 4, riskScore: 12,
        createdAt: new Date('2024-02-28'), updatedAt: new Date('2024-03-08')
      },
      {
        id: 'r4', title: '云服务配置错误', description: '云资源配置不当可能导致数据暴露', category: 'operational', level: 'medium', status: 'mitigating',
        owner: '赵运维', affectedAssets: ['AWS生产环境', 'Azure开发环境'],
        likelihood: 2, impact: 4, riskScore: 8,
        treatment: { type: 'mitigate', description: '实施云安全配置审计', progress: 45 },
        createdAt: new Date('2024-03-01'), updatedAt: new Date('2024-03-07')
      },
      {
        id: 'r5', title: 'DDoS攻击风险', description: '业务系统可能遭受分布式拒绝服务攻击', category: 'operational', level: 'medium', status: 'accepted',
        owner: '李安全', affectedAssets: ['网站', 'API服务'],
        likelihood: 2, impact: 3, riskScore: 6,
        treatment: { type: 'transfer', description: '购买DDoS防护服务', progress: 100 },
        createdAt: new Date('2024-02-10'), updatedAt: new Date('2024-03-01')
      },
      {
        id: 'r6', title: '内部威胁风险', description: '离职员工可能带走敏感信息', category: 'reputational', level: 'low', status: 'closed',
        owner: 'HR部门', affectedAssets: ['代码仓库', '文档系统'],
        likelihood: 1, impact: 3, riskScore: 3,
        treatment: { type: 'mitigate', description: '实施离职审计流程', progress: 100 },
        createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-02-28')
      }
    ];
    this.filteredRisks = [...this.risks];
  }

  private async loadAIInsights() {
    try {
      this.insights = await aiService.generateInsights('risk', { risks: this.risks });
      this.recommendations = await aiService.generateRecommendations('risk', { risks: this.risks, insights: this.insights });
      this.predictions = await aiService.predictTrend('risk', { metric: 'risk-score', timeframe: '30d' });
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    }
  }

  private applyFilters() {
    let filtered = [...this.risks];
    if (this.categoryFilter !== 'all') {
      filtered = filtered.filter(r => r.category === this.categoryFilter);
    }
    if (this.levelFilter !== 'all') {
      filtered = filtered.filter(r => r.level === this.levelFilter);
    }
    this.filteredRisks = filtered.sort((a, b) => b.riskScore - a.riskScore);
  }

  private handleCategoryFilter(category: RiskCategory | 'all') {
    this.categoryFilter = category;
    this.applyFilters();
  }

  private handleLevelFilter(level: RiskLevel | 'all') {
    this.levelFilter = level;
    this.applyFilters();
  }

  private handleRiskClick(risk: Risk) {
    this.selectedRisk = this.selectedRisk?.id === risk.id ? null : risk;
  }

  private getRiskMatrix() {
    const matrix: { level: RiskLevel; category: RiskCategory; count: number; avgScore: number }[] = [];
    const levels: RiskLevel[] = ['critical', 'high', 'medium', 'low'];
    const categories: RiskCategory[] = ['strategic', 'operational', 'compliance', 'financial', 'reputational'];

    for (const level of levels) {
      for (const category of categories) {
        const risks = this.risks.filter(r => r.level === level && r.category === category);
        matrix.push({
          level,
          category,
          count: risks.length,
          avgScore: risks.length > 0 ? risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length : 0
        });
      }
    }
    return matrix;
  }

  render() {
    if (this.loading) {
      return html`<div style="text-align:center;padding:2rem;"><div style="font-size:48px;margin-bottom:16px;">⏳</div><div style="color:var(--sc-text-secondary);">${this.i18n.t('common.loading')}</div></div>`;
    }

    const criticalCount = this.risks.filter(r => r.level === 'critical' && r.status === 'open').length;
    const highCount = this.risks.filter(r => r.level === 'high' && r.status === 'open').length;
    const openRisks = this.risks.filter(r => r.status === 'open').length;
    const avgScore = this.risks.length > 0 ? Math.round(this.risks.reduce((sum, r) => sum + r.riskScore, 0) / this.risks.length) : 0;

    return html`
      <div class="risk-container">
        <div class="main-content">
          <div class="page-header">
            <h1 class="page-title">${this.i18n.t('nav.risk') || '安全风险'}</h1>
            <div class="header-actions">
              <button class="btn btn-secondary">📊 风险报告</button>
              <button class="btn btn-primary">+ 新建风险</button>
            </div>
          </div>

          <div class="stats-grid">
            <sc-smart-card title="严重风险" value="${criticalCount}" icon="🔴" status="error"></sc-smart-card>
            <sc-smart-card title="高危风险" value="${highCount}" icon="🟠" status="warning"></sc-smart-card>
            <sc-smart-card title="待处理" value="${openRisks}" icon="⚠️" trend="down" trendValue="-3" status="warning"></sc-smart-card>
            <sc-smart-card title="平均分值" value="${avgScore}" icon="📊" subtitle="风险评分" status="success"></sc-smart-card>
          </div>

          <div class="matrix-section">
            <div class="section-header">
              <h3 class="section-title">📊 风险矩阵</h3>
            </div>
            <div class="risk-matrix">
              ${this.getRiskMatrix().map(cell => html`
                <div class="matrix-cell ${cell.count > 0 ? cell.level : 'empty'}" title="${cell.category}: ${cell.count}个风险, 平均${cell.avgScore.toFixed(1)}分">
                  ${cell.count > 0 ? cell.count : '-'}
                </div>
              `)}
            </div>
          </div>

          <div class="risk-section">
            <div class="section-header">
              <h3 class="section-title">⚠️ 风险列表</h3>
              <span style="font-size:12px;color:var(--sc-text-secondary);">${this.filteredRisks.length} 项</span>
            </div>
            
            <div class="filter-bar">
              <button class="filter-chip ${this.categoryFilter === 'all' ? 'active' : ''}" @click=${() => this.handleCategoryFilter('all')}>全部类型</button>
              <button class="filter-chip ${this.categoryFilter === 'strategic' ? 'active' : ''}" @click=${() => this.handleCategoryFilter('strategic')}>战略</button>
              <button class="filter-chip ${this.categoryFilter === 'operational' ? 'active' : ''}" @click=${() => this.handleCategoryFilter('operational')}>运营</button>
              <button class="filter-chip ${this.categoryFilter === 'compliance' ? 'active' : ''}" @click=${() => this.handleCategoryFilter('compliance')}>合规</button>
              <button class="filter-chip ${this.categoryFilter === 'financial' ? 'active' : ''}" @click=${() => this.handleCategoryFilter('financial')}>财务</button>
              <button class="filter-chip ${this.levelFilter === 'critical' ? 'active' : ''}" @click=${() => this.handleLevelFilter('critical')}>🔴 严重</button>
              <button class="filter-chip ${this.levelFilter === 'high' ? 'active' : ''}" @click=${() => this.handleLevelFilter('high')}>🟠 高危</button>
            </div>

            <div class="risk-list">
              ${this.filteredRisks.map(risk => html`
                <div class="risk-item ${risk.level} ${this.selectedRisk?.id === risk.id ? 'selected' : ''}" @click=${() => this.handleRiskClick(risk)}>
                  <div class="risk-score ${risk.level}">${risk.riskScore}</div>
                  <div class="risk-info">
                    <div class="risk-title">${risk.title}</div>
                    <div class="risk-meta">
                      <span class="category-badge ${risk.category}">${risk.category}</span>
                      <span class="status-badge ${risk.status}">${risk.status}</span>
                      <span>负责人: ${risk.owner || '未分配'}</span>
                    </div>
                  </div>
                </div>
              `)}
            </div>

            ${this.selectedRisk ? this.renderRiskDetail() : ''}
          </div>
        </div>

        <div class="ai-sidebar">
          <sc-ai-assistant
            pageId="risk"
            pageTitle="安全风险"
            .pageData=${{ risks: this.risks, selectedRisk: this.selectedRisk }}
            userRole="security-expert"
          ></sc-ai-assistant>
        </div>
      </div>
    `;
  }

  private renderRiskDetail() {
    if (!this.selectedRisk) return html``;
    const risk = this.selectedRisk;
    return html`
      <div class="risk-detail">
        <div class="detail-header">
          <div>
            <div class="detail-title">${risk.title}</div>
            <div style="font-size:12px;color:var(--sc-text-secondary);">${risk.description}</div>
          </div>
          <div style="display:flex;gap:8px;">
            <span class="category-badge ${risk.category}">${risk.category}</span>
            <span class="status-badge ${risk.status}">${risk.status}</span>
          </div>
        </div>
        
        <div class="detail-grid">
          <div class="detail-item">
            <label>风险评分</label>
            <span>${risk.riskScore} (可能性: ${risk.likelihood} × 影响: ${risk.impact})</span>
          </div>
          <div class="detail-item">
            <label>负责人</label>
            <span>${risk.owner || '未分配'}</span>
          </div>
          <div class="detail-item">
            <label>受影响资产</label>
            <span>${risk.affectedAssets.join(', ')}</span>
          </div>
          <div class="detail-item">
            <label>更新时间</label>
            <span>${risk.updatedAt.toLocaleString()}</span>
          </div>
        </div>

        ${risk.treatment ? html`
          <div class="treatment-section">
            <div class="treatment-header">
              <span class="treatment-type ${risk.treatment!.type}">${risk.treatment!.type}</span>
              <span style="font-size:12px;color:var(--sc-text-secondary);">进度: ${risk.treatment!.progress}%</span>
            </div>
            <div style="font-size:14px;color:var(--sc-text-primary);margin-bottom:8px;">${risk.treatment!.description}</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${risk.treatment!.progress}%"></div>
            </div>
          </div>
        ` : ''}

        ${risk.aiAssessment ? html`
          <div class="ai-section">
            <div class="ai-title">🤖 AI评估</div>
            <div class="ai-content">${risk.aiAssessment}</div>
            ${risk.aiTreatmentRecommendation ? html`
              <div style="margin-top:8px;font-size:13px;color:var(--sc-primary);font-weight:500;">建议处置方案:</div>
              <pre style="font-size:12px;color:var(--sc-text-secondary);margin:4px 0;white-space:pre-wrap;">${risk.aiTreatmentRecommendation}</pre>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-risk-page': ScRiskPage;
  }
}

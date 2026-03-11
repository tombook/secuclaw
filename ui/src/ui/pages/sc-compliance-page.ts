/**
 * SecuClaw Compliance Audit Page - 合规审计页面
 * 
 * 合规框架管理、控制项评估、差距分析、整改跟踪
 * AI能力: 合规差距分析、整改建议
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { aiService, type SmartInsight, type AIRecommendation } from '../ai-service.js';
import '../components/sc-ai-assistant.js';
import '../components/sc-smart-card.js';

// ============ 类型定义 ============

type ComplianceStatus = 'compliant' | 'partial' | 'non-compliant' | 'not-applicable';
type ControlPriority = 'critical' | 'high' | 'medium' | 'low';
type EvidenceStatus = 'verified' | 'pending' | 'missing';

interface ComplianceFramework {
  id: string;
  name: string;
  shortName: string;
  version: string;
  totalControls: number;
  compliantControls: number;
  status: ComplianceStatus;
  lastAssessment: Date;
  nextAssessment: Date;
  icon: string;
}

interface ControlItem {
  id: string;
  frameworkId: string;
  controlId: string;
  title: string;
  description: string;
  priority: ControlPriority;
  status: ComplianceStatus;
  evidenceStatus: EvidenceStatus;
  assignee?: string;
  dueDate?: Date;
  lastReview?: Date;
  aiGap?: string;
  aiRecommendation?: string;
}

interface AuditTask {
  id: string;
  title: string;
  framework: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'failed';
  scheduledDate: Date;
  auditor: string;
  scope: string[];
}

// ============ 页面组件 ============

@customElement('sc-compliance-page')
export class ScCompliancePage extends LitElement {
  private i18n = new I18nController(this);

  @state()
  private loading = true;

  @state()
  private frameworks: ComplianceFramework[] = [];

  @state()
  private controls: ControlItem[] = [];

  @state()
  private auditTasks: AuditTask[] = [];

  @state()
  private selectedFramework: string = 'all';

  @state()
  private insights: SmartInsight[] = [];

  @state()
  private recommendations: AIRecommendation[] = [];

  @state()
  private selectedControl: ControlItem | null = null;

  static styles = css`
    :host { display: block; }

    .compliance-container {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: var(--sc-spacing-lg, 20px);
      height: 100%;
    }

    @media (max-width: 1200px) {
      .compliance-container { grid-template-columns: 1fr; }
    }

    .main-content {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-lg, 20px);
      overflow-y: auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-title {
      font-size: var(--sc-font-size-2xl, 24px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
    }

    .header-actions {
      display: flex;
      gap: var(--sc-spacing-sm, 8px);
    }

    .btn {
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 16px);
      border-radius: var(--sc-radius-md, 8px);
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background-color: var(--sc-primary, #3b82f6);
      color: white;
    }

    .btn-secondary {
      background-color: var(--sc-bg-secondary, #f8fafc);
      color: var(--sc-text-primary, #1e293b);
      border: 1px solid var(--sc-border-color, #e2e8f0);
    }

    /* 框架卡片网格 */
    .frameworks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--sc-spacing-md, 16px);
    }

    .framework-card {
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .framework-card:hover {
      border-color: var(--sc-primary, #3b82f6);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
    }

    .framework-card.selected {
      border-color: var(--sc-primary, #3b82f6);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .framework-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--sc-spacing-md, 16px);
    }

    .framework-icon {
      font-size: 32px;
    }

    .framework-badge {
      padding: 2px 8px;
      border-radius: var(--sc-radius-full, 999px);
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 500;
    }

    .framework-badge.compliant { background-color: rgba(34, 197, 94, 0.1); color: var(--sc-success, #22c55e); }
    .framework-badge.partial { background-color: rgba(245, 158, 11, 0.1); color: var(--sc-warning, #f59e0b); }
    .framework-badge.non-compliant { background-color: rgba(239, 68, 68, 0.1); color: var(--sc-danger, #ef4444); }

    .framework-name {
      font-size: var(--sc-font-size-lg, 18px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
      margin-bottom: var(--sc-spacing-xs, 4px);
    }

    .framework-version {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-tertiary, #94a3b8);
    }

    .framework-progress {
      margin-top: var(--sc-spacing-md, 16px);
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--sc-spacing-xs, 4px);
    }

    .progress-label {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
    }

    .progress-value {
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
    }

    .progress-bar {
      height: 8px;
      background-color: var(--sc-bg-tertiary, #f1f5f9);
      border-radius: var(--sc-radius-full, 999px);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: var(--sc-radius-full, 999px);
      transition: width 0.3s ease;
    }

    .progress-fill.compliant { background-color: var(--sc-success, #22c55e); }
    .progress-fill.partial { background-color: var(--sc-warning, #f59e0b); }
    .progress-fill.non-compliant { background-color: var(--sc-danger, #ef4444); }

    .framework-meta {
      display: flex;
      justify-content: space-between;
      margin-top: var(--sc-spacing-sm, 8px);
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-tertiary, #94a3b8);
    }

    /* 控制项区域 */
    .controls-section {
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-md, 16px);
    }

    .section-title {
      font-size: var(--sc-font-size-lg, 18px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
    }

    .controls-table {
      width: 100%;
      border-collapse: collapse;
    }

    .controls-table th,
    .controls-table td {
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 16px);
      text-align: left;
      border-bottom: 1px solid var(--sc-border-color, #e2e8f0);
    }

    .controls-table th {
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 600;
      color: var(--sc-text-secondary, #64748b);
      text-transform: uppercase;
    }

    .controls-table tr:hover {
      background-color: var(--sc-bg-secondary, #f8fafc);
    }

    .control-id {
      font-family: monospace;
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-primary, #3b82f6);
      font-weight: 500;
    }

    .control-title {
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-primary, #1e293b);
    }

    .status-badge {
      padding: 2px 6px;
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 500;
    }

    .status-badge.compliant { background-color: rgba(34, 197, 94, 0.1); color: var(--sc-success, #22c55e); }
    .status-badge.partial { background-color: rgba(245, 158, 11, 0.1); color: var(--sc-warning, #f59e0b); }
    .status-badge.non-compliant { background-color: rgba(239, 68, 68, 0.1); color: var(--sc-danger, #ef4444); }
    .status-badge.not-applicable { background-color: rgba(100, 116, 139, 0.1); color: var(--sc-text-secondary, #64748b); }

    .evidence-badge {
      padding: 2px 6px;
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-xs, 12px);
    }

    .evidence-badge.verified { background-color: rgba(34, 197, 94, 0.1); color: var(--sc-success, #22c55e); }
    .evidence-badge.pending { background-color: rgba(245, 158, 11, 0.1); color: var(--sc-warning, #f59e0b); }
    .evidence-badge.missing { background-color: rgba(239, 68, 68, 0.1); color: var(--sc-danger, #ef4444); }

    .priority-indicator {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .priority-indicator.critical { background-color: var(--sc-danger, #ef4444); }
    .priority-indicator.high { background-color: var(--sc-warning, #f59e0b); }
    .priority-indicator.medium { background-color: var(--sc-primary, #3b82f6); }
    .priority-indicator.low { background-color: var(--sc-success, #22c55e); }

    /* 审计任务 */
    .audit-section {
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }

    .audit-list {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-sm, 8px);
    }

    .audit-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--sc-spacing-md, 16px);
      background-color: var(--sc-bg-secondary, #f8fafc);
      border-radius: var(--sc-radius-md, 8px);
    }

    .audit-info {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-xs, 4px);
    }

    .audit-title {
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      color: var(--sc-text-primary, #1e293b);
    }

    .audit-meta {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
    }

    .audit-status {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs, 4px);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .status-dot.scheduled { background-color: var(--sc-primary, #3b82f6); }
    .status-dot.in-progress { background-color: var(--sc-warning, #f59e0b); animation: pulse 1.5s infinite; }
    .status-dot.completed { background-color: var(--sc-success, #22c55e); }
    .status-dot.failed { background-color: var(--sc-danger, #ef4444); }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* AI分析 */
    .ai-section {
      background-color: rgba(59, 130, 246, 0.05);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: var(--sc-radius-md, 8px);
      padding: var(--sc-spacing-md, 16px);
      margin-top: var(--sc-spacing-md, 16px);
    }

    .ai-title {
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 600;
      color: var(--sc-primary, #3b82f6);
      margin-bottom: var(--sc-spacing-sm, 8px);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs, 4px);
    }

    .ai-content {
      font-size: var(--sc-font-size-sm, 14px;
      color: var(--sc-text-secondary, #64748b);
    }

    .ai-sidebar {
      position: sticky;
      top: 0;
      height: calc(100vh - var(--sc-spacing-lg, 20px) * 2);
      overflow: hidden;
    }
  `;

  constructor() {
    super();
    this.loadComplianceData();
  }

  private async loadComplianceData() {
    this.loading = true;
    try {
      await this.loadFrameworks();
      await this.loadControls();
      await this.loadAuditTasks();
      await this.loadAIInsights();
    } finally {
      this.loading = false;
    }
  }

  private async loadFrameworks() {
    this.frameworks = [
      { id: 'gdpr', name: 'GDPR', shortName: 'GDPR', version: '2018', totalControls: 99, compliantControls: 84, status: 'partial', lastAssessment: new Date('2024-02-15'), nextAssessment: new Date('2024-08-15'), icon: '🇪🇺' },
      { id: 'iso27001', name: 'ISO 27001', shortName: 'ISO', version: '2022', totalControls: 93, compliantControls: 89, status: 'compliant', lastAssessment: new Date('2024-01-20'), nextAssessment: new Date('2025-01-20'), icon: '🏛️' },
      { id: 'soc2', name: 'SOC 2 Type II', shortName: 'SOC2', version: '2017', totalControls: 115, compliantControls: 86, status: 'partial', lastAssessment: new Date('2024-03-01'), nextAssessment: new Date('2024-09-01'), icon: '📋' },
      { id: 'nist', name: 'NIST CSF', shortName: 'NIST', version: '2.0', totalControls: 108, compliantControls: 95, status: 'compliant', lastAssessment: new Date('2024-02-28'), nextAssessment: new Date('2025-02-28'), icon: '🛡️' },
      { id: 'pipl', name: '个人信息保护法', shortName: 'PIPL', version: '2021', totalControls: 78, compliantControls: 53, status: 'non-compliant', lastAssessment: new Date('2024-01-10'), nextAssessment: new Date('2024-07-10'), icon: '🇨🇳' },
      { id: 'hipaa', name: 'HIPAA', shortName: 'HIPAA', version: '2013', totalControls: 75, compliantControls: 70, status: 'partial', lastAssessment: new Date('2024-02-01'), nextAssessment: new Date('2025-02-01'), icon: '🏥' }
    ];
  }

  private async loadControls() {
    this.controls = [
      { id: 'c1', frameworkId: 'gdpr', controlId: 'Art.5', title: '数据处理原则', description: '确保个人数据处理的合法性、公平性和透明性', priority: 'critical', status: 'compliant', evidenceStatus: 'verified', assignee: '张合规', lastReview: new Date('2024-02-10') },
      { id: 'c2', frameworkId: 'gdpr', controlId: 'Art.32', title: '安全措施', description: '实施适当的技术和组织措施保护个人数据', priority: 'critical', status: 'partial', evidenceStatus: 'pending', assignee: '李安全', dueDate: new Date('2024-03-15'), aiGap: '缺少数据加密策略文档', aiRecommendation: '建议制定数据分类标准和加密策略' },
      { id: 'c3', frameworkId: 'iso27001', controlId: 'A.5.1', title: '信息安全方针', description: '建立管理层对信息安全的支持和承诺', priority: 'high', status: 'compliant', evidenceStatus: 'verified', assignee: '王主管', lastReview: new Date('2024-01-15') },
      { id: 'c4', frameworkId: 'iso27001', controlId: 'A.12.6', title: '技术脆弱性管理', description: '及时获取、评估和修补技术脆弱性', priority: 'high', status: 'compliant', evidenceStatus: 'verified', lastReview: new Date('2024-02-20') },
      { id: 'c5', frameworkId: 'soc2', controlId: 'CC6.1', title: '逻辑访问安全', description: '实施逻辑访问安全措施保护系统', priority: 'critical', status: 'partial', evidenceStatus: 'pending', aiGap: '缺少特权账户访问审计记录' },
      { id: 'c6', frameworkId: 'pipl', controlId: 'Art.13', title: '个人信息处理告知', description: '处理个人信息前应告知个人信息处理者的信息', priority: 'critical', status: 'non-compliant', evidenceStatus: 'missing', dueDate: new Date('2024-04-01'), aiGap: '隐私政策未涵盖所有必需告知事项', aiRecommendation: '更新隐私政策，增加个人信息保存期限、处理方式等告知内容' }
    ];
  }

  private async loadAuditTasks() {
    this.auditTasks = [
      { id: 'audit-1', title: 'GDPR年度审计', framework: 'GDPR', status: 'scheduled', scheduledDate: new Date('2024-04-15'), auditor: '安永会计师事务所', scope: ['数据处理', '数据主体权利', '跨境传输'] },
      { id: 'audit-2', title: 'ISO 27001监督审核', framework: 'ISO 27001', status: 'in-progress', scheduledDate: new Date('2024-03-08'), auditor: 'BSI', scope: ['访问控制', '加密管理', '事件管理'] },
      { id: 'audit-3', title: 'SOC 2 Type II审计', framework: 'SOC 2', status: 'scheduled', scheduledDate: new Date('2024-06-01'), auditor: '德勤', scope: ['安全', '可用性', '机密性'] }
    ];
  }

  private async loadAIInsights() {
    try {
      this.insights = await aiService.generateInsights('compliance', { frameworks: this.frameworks, controls: this.controls });
      this.recommendations = await aiService.generateRecommendations('compliance', { insights: this.insights });
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    }
  }

  private handleFrameworkClick(framework: ComplianceFramework) {
    this.selectedFramework = this.selectedFramework === framework.id ? 'all' : framework.id;
  }

  private getFilteredControls() {
    if (this.selectedFramework === 'all') return this.controls;
    return this.controls.filter(c => c.frameworkId === this.selectedFramework);
  }

  render() {
    if (this.loading) {
      return html`<div style="text-align:center;padding:2rem;"><div style="font-size:48px;margin-bottom:16px;">⏳</div><div style="color:var(--sc-text-secondary);">${this.i18n.t('common.loading')}</div></div>`;
    }

    return html`
      <div class="compliance-container">
        <div class="main-content">
          <div class="page-header">
            <h1 class="page-title">${this.i18n.t('nav.compliance') || '合规审计'}</h1>
            <div class="header-actions">
              <button class="btn btn-secondary">📊 合规报告</button>
              <button class="btn btn-primary">+ 新建评估</button>
            </div>
          </div>

          <div class="frameworks-grid">
            ${this.frameworks.map(fw => html`
              <div class="framework-card ${this.selectedFramework === fw.id ? 'selected' : ''}" @click=${() => this.handleFrameworkClick(fw)}>
                <div class="framework-header">
                  <span class="framework-icon">${fw.icon}</span>
                  <span class="framework-badge ${fw.status}">${fw.status === 'compliant' ? '合规' : fw.status === 'partial' ? '部分合规' : '不合规'}</span>
                </div>
                <div class="framework-name">${fw.name}</div>
                <div class="framework-version">v${fw.version}</div>
                <div class="framework-progress">
                  <div class="progress-header">
                    <span class="progress-label">合规进度</span>
                    <span class="progress-value">${Math.round(fw.compliantControls / fw.totalControls * 100)}%</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill ${fw.status}" style="width: ${fw.compliantControls / fw.totalControls * 100}%"></div>
                  </div>
                </div>
                <div class="framework-meta">
                  <span>上次: ${fw.lastAssessment.toLocaleDateString()}</span>
                  <span>下次: ${fw.nextAssessment.toLocaleDateString()}</span>
                </div>
              </div>
            `)}
          </div>

          <div class="controls-section">
            <div class="section-header">
              <h3 class="section-title">📋 控制项评估</h3>
              <span style="font-size:12px;color:var(--sc-text-secondary);">${this.getFilteredControls().length} 项</span>
            </div>
            <table class="controls-table">
              <thead>
                <tr>
                  <th>控制项</th>
                  <th>描述</th>
                  <th>优先级</th>
                  <th>状态</th>
                  <th>证据</th>
                  <th>负责人</th>
                </tr>
              </thead>
              <tbody>
                ${this.getFilteredControls().map(ctrl => html`
                  <tr>
                    <td><span class="control-id">${ctrl.controlId}</span></td>
                    <td>
                      <div class="control-title">${ctrl.title}</div>
                      ${ctrl.aiGap ? html`<div style="font-size:11px;color:var(--sc-warning);margin-top:2px;">⚠️ ${ctrl.aiGap}</div>` : ''}
                    </td>
                    <td><span class="priority-indicator ${ctrl.priority}"></span></td>
                    <td><span class="status-badge ${ctrl.status}">${ctrl.status === 'compliant' ? '合规' : ctrl.status === 'partial' ? '部分' : ctrl.status === 'non-compliant' ? '不合规' : '不适用'}</span></td>
                    <td><span class="evidence-badge ${ctrl.evidenceStatus}">${ctrl.evidenceStatus === 'verified' ? '已验证' : ctrl.evidenceStatus === 'pending' ? '待审核' : '缺失'}</span></td>
                    <td>${ctrl.assignee || '-'}</td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>

          <div class="audit-section">
            <div class="section-header">
              <h3 class="section-title">🔍 审计任务</h3>
              <button class="btn btn-secondary">+ 安排审计</button>
            </div>
            <div class="audit-list">
              ${this.auditTasks.map(task => html`
                <div class="audit-item">
                  <div class="audit-info">
                    <div class="audit-title">${task.title}</div>
                    <div class="audit-meta">${task.auditor} · ${task.scheduledDate.toLocaleDateString()} · ${task.scope.join(', ')}</div>
                  </div>
                  <div class="audit-status">
                    <span class="status-dot ${task.status}"></span>
                    <span style="font-size:12px;color:var(--sc-text-secondary);">${task.status === 'scheduled' ? '已安排' : task.status === 'in-progress' ? '进行中' : task.status === 'completed' ? '已完成' : '失败'}</span>
                  </div>
                </div>
              `)}
            </div>
          </div>

          ${this.insights.length > 0 ? html`
            <div class="ai-section">
              <div class="ai-title">🤖 AI合规分析</div>
              <div class="ai-content">${this.insights[0]?.description || '暂无分析'}</div>
            </div>
          ` : ''}
        </div>

        <div class="ai-sidebar">
          <sc-ai-assistant
            pageId="compliance"
            pageTitle="合规审计"
            .pageData=${{ frameworks: this.frameworks, controls: this.controls }}
            userRole="security-expert"
          ></sc-ai-assistant>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-compliance-page': ScCompliancePage;
  }
}

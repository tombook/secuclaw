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
import { gatewayClient } from '../gateway-client.js';
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
  private selectedControl: ControlItem | null = null;

  @state()
  private posture: { overallScore: number; frameworksCount: number; criticalGaps: number } = {
    overallScore: 0,
    frameworksCount: 0,
    criticalGaps: 0,
  };

  @state()
  private insights: SmartInsight[] = [];

  @state()
  private recommendations: AIRecommendation[] = [];

  @state()
  private complianceStats: {
    overallScore: number;
    frameworksCount: number;
    controlsCount: number;
    auditCount: number;
  } = {
    overallScore: 0, frameworksCount: 0, controlsCount: 0,
    auditCount: 0,
  };

  // Modal state
  @state()
  private showControlModal = false;

  @state()
  private editingControl: ControlItem | null = null;

  @state()
  private controlForm = {
    title: '',
    description: '',
    priority: 'medium' as ControlPriority,
    status: 'partial' as ComplianceStatus,
    evidenceStatus: 'pending' as EvidenceStatus,
    assignee: ''
  };

  // Toast state
  @state()
  private toastMessage = '';

  @state()
  private toastType: 'success' | 'error' | 'info' = 'info';

  private toastTimeout: number | null = null;

  // LocalStorage key
  private readonly STORAGE_KEY = 'secuclaw-compliance-controls';

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
      align-items: flex-start;
    }

    .page-title-section {
      flex: 1;
    }

    .page-title {
      font-size: var(--sc-font-size-2xl, 24px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
    }

    .page-description {
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #64748b);
      margin-top: var(--sc-spacing-xs, 4px);
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

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: var(--sc-bg-primary, #ffffff);
      border-radius: var(--sc-radius-lg, 12px);
      width: 480px;
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
      box-shadow: var(--sc-shadow-lg, 0 10px 25px rgba(0, 0, 0, 0.15));
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--sc-border-color, #e5e7eb);
    }

    .modal-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--sc-text-primary, #111827);
    }

    .modal-close {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      font-size: 24px;
      cursor: pointer;
      color: var(--sc-text-secondary, #6b7280);
      border-radius: var(--sc-radius-md, 8px);
    }

    .modal-close:hover {
      background: var(--sc-bg-hover, #f3f4f6);
    }

    .modal-body {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: var(--sc-text-primary, #111827);
      margin-bottom: 6px;
    }

    .form-input, .form-select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--sc-border-color, #e5e7eb);
      border-radius: var(--sc-radius-md, 8px);
      font-size: 14px;
      background: var(--sc-bg-primary, #ffffff);
      color: var(--sc-text-primary, #111827);
      box-sizing: border-box;
    }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: var(--sc-primary, #3b82f6);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid var(--sc-border-color, #e5e7eb);
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: var(--sc-radius-md, 8px);
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }

    .btn-primary {
      background: var(--sc-primary, #3b82f6);
      color: white;
    }

    .btn-primary:hover {
      background: color-mix(in srgb, var(--sc-primary, #3b82f6) 85%, black);
    }

    .btn-secondary {
      background: var(--sc-bg-secondary, #f3f4f6);
      color: var(--sc-text-primary, #111827);
    }

    .btn-danger {
      background: var(--sc-danger, #ef4444);
      color: white;
    }

    /* Toast Styles */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 20px;
      border-radius: var(--sc-radius-md, 8px);
      font-size: 14px;
      font-weight: 500;
      z-index: 1001;
      animation: slideIn 0.3s ease;
      box-shadow: var(--sc-shadow-lg);
    }

    .toast.success { background: var(--sc-success, #10b981); color: white; }
    .toast.error { background: var(--sc-danger, #ef4444); color: white; }
    .toast.info { background: var(--sc-primary, #3b82f6); color: white; }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;

  constructor() {
    super();
    this.loadComplianceData();
  }

  private async loadComplianceData() {
    this.loading = true;
    try {
      // Attempt to load real data from SCF backend via gatewayClient
      try {
        // Load domains (frameworks)
        const domainsRes: any = await gatewayClient.request('knowledge.scf.domains', {});
        const domains: any[] = Array.isArray(domainsRes)
          ? domainsRes
          : (domainsRes?.domains ?? []);

        this.frameworks = domains.map(d => ({
          id: String(d.id ?? ''),
          name: String(d.name ?? ''),
          shortName: String(d.code ?? d.shortName ?? '') as string,
          version: String(d.version ?? ''),
          totalControls: Number(d.controlCount ?? 0),
          compliantControls: 0,
          status: 'not-applicable' as ComplianceStatus,
          lastAssessment: new Date(),
          nextAssessment: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          icon: this.getComplianceIcon(d.name ?? '')
        }));

        // Load controls related to SCF
        const controlsRes: any = await gatewayClient.request('knowledge.scf.controls', {});
        const controlsRaw: any[] = Array.isArray(controlsRes)
          ? controlsRes
          : (controlsRes?.controls ?? []);
        // Map to our ControlItem interface
        this.controls = controlsRaw.map(ctrl => ({
          id: String(ctrl.id ?? ''),
          frameworkId: String(ctrl.domain ?? ''),
          controlId: String(ctrl.controlId ?? ''),
          title: String(ctrl.title ?? ''),
          description: String(ctrl.description ?? ''),
          priority: (ctrl.priority ?? 'medium') as ControlPriority,
          status: (ctrl.status ?? 'not-applicable') as ComplianceStatus,
          evidenceStatus: 'verified' as EvidenceStatus,
          assignee: ctrl.assignee ?? undefined,
          lastReview: ctrl.lastReview ? new Date(ctrl.lastReview) : undefined,
          aiGap: undefined,
          aiRecommendation: undefined
        }));

        // Compute compliant controls per framework
        const map: Record<string, number> = {};
        this.controls.forEach(c => {
          if (c.status === 'compliant') {
            map[c.frameworkId] = (map[c.frameworkId] ?? 0) + 1;
          }
        });
        this.frameworks = this.frameworks.map(f => ({ ...f, compliantControls: map[f.id] ?? 0 }));

        // Stats from SCF (if provided)
        try {
          const statsRes: any = await gatewayClient.request('knowledge.scf.stats', {});
          const stats = statsRes ?? {};
          const totalDomains = Number(stats.totalDomains ?? 0) || this.frameworks.length;
          const totalControls = Number(stats.totalControls ?? 0);
          const compliantCount = Number(stats.compliantCount ?? 0);
          const overallScore = totalDomains > 0 ? Math.round((compliantCount / totalDomains) * 100) : 0;
          this.complianceStats = {
            overallScore,
            frameworksCount: totalDomains,
            controlsCount: totalControls,
            auditCount: this.complianceStats.auditCount
          };
        } catch (e) {
          // If stats fail, keep existing values (fallback to mock will fill later)
        }
      } catch (e) {
        // If API fails, fall back to mock data below
        console.error('Failed to load from SCF API:', e);
      }

      // If API data was not loaded, use existing mock data as fallback
      if (this.frameworks.length === 0 || this.controls.length === 0) {
        await this.loadFrameworks();
        await this.loadControls();
        this.computePostureStats();
      } else {
        // Still compute posture with real data
        this.computePostureStats();
      }
      await this.loadAuditTasks();
      await this.loadAIInsights();
    } finally {
      this.loading = false;
    }
  }

  private getComplianceIcon(jurisdiction: string): string {
    const map: Record<string, string> = {
      'European Union': '🇪🇺',
      "People's Republic of China": '🇨🇳',
      'United States': '🇺🇸',
      'International': '🏛️'
    };
    return map[jurisdiction] || '📋';
  }

  private computePostureStats() {
    const totalFrames = this.frameworks.length;
    const totalControls = this.frameworks.reduce((acc, f) => acc + f.totalControls, 0);
    const compliantControls = this.frameworks.reduce((acc, f) => acc + f.compliantControls, 0);
    const overallScore = totalControls > 0 ? Math.round((compliantControls / totalControls) * 100) : 0;
    const criticalGaps = this.controls.filter(c => c.status !== 'compliant').length;
    this.posture = { overallScore, frameworksCount: totalFrames, criticalGaps };
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
    // 优先从 localStorage 加载
    const stored = this.loadFromLocalStorage();
    
    if (stored.length > 0) {
      this.controls = stored;
      return;
    }
    
    // 默认示例数据
    this.controls = [
      { id: 'c1', frameworkId: 'gdpr', controlId: 'Art.5', title: '数据处理原则', description: '确保个人数据处理的合法性、公平性和透明性', priority: 'critical', status: 'compliant', evidenceStatus: 'verified', assignee: '张合规', lastReview: new Date('2024-02-10') },
      { id: 'c2', frameworkId: 'gdpr', controlId: 'Art.32', title: '安全措施', description: '实施适当的技术和组织措施保护个人数据', priority: 'critical', status: 'partial', evidenceStatus: 'pending', assignee: '李安全', dueDate: new Date('2024-03-15'), aiGap: '缺少数据加密策略文档', aiRecommendation: '建议制定数据分类标准和加密策略' },
      { id: 'c3', frameworkId: 'iso27001', controlId: 'A.5.1', title: '信息安全方针', description: '建立管理层对信息安全的支持和承诺', priority: 'high', status: 'compliant', evidenceStatus: 'verified', assignee: '王主管', lastReview: new Date('2024-01-15') },
      { id: 'c4', frameworkId: 'iso27001', controlId: 'A.12.6', title: '技术脆弱性管理', description: '及时获取、评估和修补技术脆弱性', priority: 'high', status: 'compliant', evidenceStatus: 'verified', lastReview: new Date('2024-02-20') },
      { id: 'c5', frameworkId: 'soc2', controlId: 'CC6.1', title: '逻辑访问安全', description: '实施逻辑访问安全措施保护系统', priority: 'critical', status: 'partial', evidenceStatus: 'pending', aiGap: '缺少特权账户访问审计记录' },
      { id: 'c6', frameworkId: 'pipl', controlId: 'Art.13', title: '个人信息处理告知', description: '处理个人信息前应告知个人信息处理者的信息', priority: 'critical', status: 'non-compliant', evidenceStatus: 'missing', dueDate: new Date('2024-04-01'), aiGap: '隐私政策未涵盖所有必需告知事项', aiRecommendation: '更新隐私政策，增加个人信息保存期限、处理方式等告知内容' }
    ];
    this.saveToLocalStorage(this.controls);
  }

  private loadFromLocalStorage(): ControlItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ControlItem[];
        return parsed.map(c => ({
          ...c,
          dueDate: c.dueDate ? new Date(c.dueDate) : undefined,
          lastReview: c.lastReview ? new Date(c.lastReview) : undefined
        }));
      }
    } catch (e) {
      console.error('[Compliance] Failed to load from localStorage:', e);
    }
    return [];
  }

  private saveToLocalStorage(controls: ControlItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(controls));
    } catch (e) {
      console.error('[Compliance] Failed to save to localStorage:', e);
    }
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = window.setTimeout(() => {
      this.toastMessage = '';
    }, 3000);
  }

  // Control CRUD operations
  private openAddControlModal() {
    this.editingControl = null;
    this.controlForm = {
      title: '',
      description: '',
      priority: 'medium',
      status: 'partial',
      evidenceStatus: 'pending',
      assignee: ''
    };
    this.showControlModal = true;
  }

  private openEditControlModal(control: ControlItem) {
    this.editingControl = control;
    this.controlForm = {
      title: control.title,
      description: control.description,
      priority: control.priority,
      status: control.status,
      evidenceStatus: control.evidenceStatus,
      assignee: control.assignee || ''
    };
    this.showControlModal = true;
  }

  private closeControlModal() {
    this.showControlModal = false;
    this.editingControl = null;
  }

  private updateControlFormField(field: string, value: string) {
    this.controlForm = { ...this.controlForm, [field]: value };
  }

  private async handleSaveControl() {
    if (!this.controlForm.title.trim()) {
      this.showToast('请输入控制项标题', 'error');
      return;
    }

    if (this.editingControl) {
      const index = this.controls.findIndex(c => c.id === this.editingControl!.id);
      if (index >= 0) {
        this.controls[index] = {
          ...this.controls[index],
          title: this.controlForm.title,
          description: this.controlForm.description,
          priority: this.controlForm.priority as ControlPriority,
          status: this.controlForm.status as ComplianceStatus,
          evidenceStatus: this.controlForm.evidenceStatus as EvidenceStatus,
          assignee: this.controlForm.assignee || undefined
        };
        this.saveToLocalStorage(this.controls);
        this.showToast('控制项更新成功', 'success');
      }
    } else {
      const newControl: ControlItem = {
        id: `c-${Date.now()}`,
        frameworkId: this.selectedFramework !== 'all' ? this.selectedFramework : 'gdpr',
        controlId: `Custom-${Date.now()}`,
        title: this.controlForm.title,
        description: this.controlForm.description,
        priority: this.controlForm.priority as ControlPriority,
        status: this.controlForm.status as ComplianceStatus,
        evidenceStatus: this.controlForm.evidenceStatus as EvidenceStatus,
        assignee: this.controlForm.assignee || undefined
      };
      this.controls = [...this.controls, newControl];
      this.saveToLocalStorage(this.controls);
      this.showToast('控制项添加成功', 'success');
    }

    this.closeControlModal();
  }

  private async handleDeleteControl(id: string) {
    if (!confirm('确定要删除这个控制项吗？')) return;
    this.controls = this.controls.filter(c => c.id !== id);
    this.saveToLocalStorage(this.controls);
    this.showToast('控制项已删除', 'success');
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
      this.insights = await aiService.generateInsights({
        pageId: 'compliance',
        data: { frameworks: this.frameworks, controls: this.controls },
        userRole: 'analyst',
      });
      this.recommendations = await aiService.generateRecommendations({
        pageId: 'compliance',
        data: { insights: this.insights },
        userRole: 'analyst',
      });
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
          <div style="display:flex;gap:12px;margin-bottom:16px;">
            <div style="flex:1;padding:12px 16px;border-radius:8px;border:1px solid var(--sc-border-color, #e0e0e0);text-align:center;">
              <div style="font-size:24px;font-weight:700;color:var(--sc-primary);">${this.complianceStats.overallScore}%</div>
              <div style="font-size:12px;color:var(--sc-text-secondary);">合规评分</div>
            </div>
            <div style="flex:1;padding:12px 16px;border-radius:8px;border:1px solid var(--sc-border-color, #e0e0e0);text-align:center;">
              <div style="font-size:24px;font-weight:700;">${this.complianceStats.frameworksCount}</div>
              <div style="font-size:12px;color:var(--sc-text-secondary);">合规框架</div>
            </div>
            <div style="flex:1;padding:12px 16px;border-radius:8px;border:1px solid var(--sc-border-color, #e0e0e0);text-align:center;">
              <div style="font-size:24px;font-weight:700;">${this.complianceStats.controlsCount}</div>
              <div style="font-size:12px;color:var(--sc-text-secondary);">控制项</div>
            </div>
            <div style="flex:1;padding:12px 16px;border-radius:8px;border:1px solid var(--sc-border-color, #e0e0e0);text-align:center;">
              <div style="font-size:24px;font-weight:700;">${this.complianceStats.auditCount}</div>
              <div style="font-size:12px;color:var(--sc-text-secondary);">审计任务</div>
            </div>
          </div>

          <!-- Posture overview -->
          <div class="stats-grid" style="margin-top: 8px; margin-bottom: 8px; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
            <sc-smart-card
              title="合规整体分数"
              value="${this.posture?.overallScore ?? 0}"
              icon="📈"
              status="success"
            ></sc-smart-card>
            <sc-smart-card
              title="框架数量"
              value="${this.posture?.frameworksCount ?? 0}"
              icon="🗂️"
              status="neutral"
            ></sc-smart-card>
            <sc-smart-card
              title="关键差距"
              value="${this.posture?.criticalGaps ?? 0}"
              icon="⚠️"
              status="warning"
            ></sc-smart-card>
          </div>

          <div class="page-header">
            <div class="page-title-section">
              <h1 class="page-title">
                <span>✅</span>
                ${this.i18n.t('nav.compliance') || '合规审计'}
              </h1>
              <div class="page-description">
                <span>确保企业符合各项法规要求，准备好随时应对审计</span>
              </div>
            </div>
            <div class="header-actions">
              <button class="btn btn-secondary">📊 合规报告</button>
              <button class="btn btn-primary" @click=${this.openAddControlModal}>+ 新建评估</button>
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

          ${this.frameworks.length > 0 ? html`
            <div class="frameworks-grid" style="margin-top: 8px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));">
              ${this.frameworks.map(fw => html`
                <div class="framework-card" style="min-height: 120px;">
                  <div class="framework-header">
                    <span class="framework-icon">${fw.icon}</span>
                    <span class="framework-badge ${fw.status}">${fw.status === 'compliant' ? '合规' : fw.status === 'partial' ? '部分合规' : '不合规'}</span>
                  </div>
                  <div class="framework-name">${fw.name}</div>
                  <div class="framework-version">v${fw.version}</div>
                  <div class="framework-progress" aria-label="framework-progress">
                    <div class="progress-header">
                      <span class="progress-label">合规进度</span>
                      <span class="progress-value">${Math.round((fw.compliantControls / fw.totalControls) * 100)}%</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill ${fw.status}" style="width: ${Math.min(100, Math.round((fw.compliantControls / fw.totalControls) * 100))}%;"></div>
                    </div>
                  </div>
                  <div class="framework-meta">
                    <span>上次: ${fw.lastAssessment.toLocaleDateString()}</span>
                    <span>下次: ${fw.nextAssessment.toLocaleDateString()}</span>
                  </div>
                </div>
              `)}
            </div>
          ` : ''}

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
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                ${this.getFilteredControls().map(ctrl => html`
                  <tr @click=${() => { this.selectedControl = ctrl; }} style="cursor:pointer;">
                    <td><span class="control-id">${ctrl.controlId}</span></td>
                    <td>
                      <div class="control-title">${ctrl.title}</div>
                      ${ctrl.aiGap ? html`<div style="font-size:11px;color:var(--sc-warning);margin-top:2px;">⚠️ ${ctrl.aiGap}</div>` : ''}
                    </td>
                    <td><span class="priority-indicator ${ctrl.priority}"></span></td>
                    <td><span class="status-badge ${ctrl.status}">${ctrl.status === 'compliant' ? '合规' : ctrl.status === 'partial' ? '部分' : ctrl.status === 'non-compliant' ? '不合规' : '不适用'}</span></td>
                    <td><span class="evidence-badge ${ctrl.evidenceStatus}">${ctrl.evidenceStatus === 'verified' ? '已验证' : ctrl.evidenceStatus === 'pending' ? '待审核' : '缺失'}</span></td>
                    <td>${ctrl.assignee || '-'}</td>
                    <td>
                      <button class="btn" style="padding: 4px 8px; font-size: 12px; margin-right: 4px;" @click=${(e: Event) => { e.stopPropagation(); this.openEditControlModal(ctrl); }}>编辑</button>
                      <button class="btn btn-danger" style="padding: 4px 8px; font-size: 12px;" @click=${(e: Event) => { e.stopPropagation(); this.handleDeleteControl(ctrl.id); }}>删除</button>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>

            ${this.selectedControl ? html`
              <div style="margin-top:16px;padding:16px;border:1px solid var(--sc-border-color, #e0e0e0);border-radius:8px;background:var(--sc-surface, #fafafa);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <span class="control-id" style="font-weight:700;">${this.selectedControl.controlId}</span>
                    <span style="margin-left:8px;font-size:14px;">${this.selectedControl.title}</span>
                  </div>
                  <button class="btn btn-secondary" @click=${() => { this.selectedControl = null; }}>关闭</button>
                </div>
                <p style="font-size:13px;color:var(--sc-text-secondary);margin-top:8px;">${this.selectedControl.description}</p>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:12px;font-size:13px;">
                  <div><strong>优先级:</strong> ${this.selectedControl.priority}</div>
                  <div><strong>状态:</strong> ${this.selectedControl.status}</div>
                  <div><strong>证据:</strong> ${this.selectedControl.evidenceStatus}</div>
                  <div><strong>负责人:</strong> ${this.selectedControl.assignee || '-'}</div>
                  <div><strong>截止:</strong> ${this.selectedControl.dueDate?.toLocaleDateString() || '-'}</div>
                  <div><strong>上次审查:</strong> ${this.selectedControl.lastReview?.toLocaleDateString() || '-'}</div>
                </div>
                ${this.selectedControl.aiGap ? html`<div style="margin-top:12px;padding:8px;border-radius:4px;background:var(--sc-warning-bg, #fff3cd);font-size:13px;">⚠️ ${this.selectedControl.aiGap}</div>` : ''}
                ${this.selectedControl.aiRecommendation ? html`<div style="margin-top:8px;padding:8px;border-radius:4px;background:var(--sc-info-bg, #d1ecf1);font-size:13px;">💡 ${this.selectedControl.aiRecommendation}</div>` : ''}
              </div>
            ` : ''}
          </div>

          <div class="audit-section">
            <div class="section-header">
              <h3 class="section-title">🔍 审计任务</h3>
              <button class="btn btn-secondary">+ 安排审计</button>
            </div>
            <div class="audit-list">
              ${this.auditTasks.map(task => {
                const nextAudit = new Date(task.scheduledDate);
                nextAudit.setFullYear(nextAudit.getFullYear() + 1);
                return html`
                  <div class="audit-item">
                    <div class="audit-info">
                      <div class="audit-title">${task.title}</div>
                      <div class="audit-meta">${task.framework} · ${task.scheduledDate.toLocaleDateString()} · 下次审计: ${nextAudit.toLocaleDateString()}</div>
                    </div>
                    <div class="audit-status">
                      <span class="status-dot ${task.status}"></span>
                      <span style="font-size:12px;color:var(--sc-text-secondary);">${task.status}</span>
                    </div>
                  </div>
                `;
              })}
            </div>
          </div>

          ${this.insights.length > 0 ? html`
            <div class="ai-section">
              <div class="ai-title">🤖 AI合规分析</div>
              <div class="ai-content">${this.insights[0]?.description || '暂无分析'}</div>
            </div>
          ` : ''}

          ${this.recommendations.length > 0 ? html`
            <div class="ai-section" style="margin-top:16px;">
              <div class="ai-title">💡 AI整改建议</div>
              ${this.recommendations.slice(0, 5).map(rec => html`
                <div style="padding:10px 0;border-bottom:1px solid var(--sc-border-color, #e0e0e0);">
                  <div style="font-size:14px;font-weight:600;">${rec.impact === 'high' ? '🔴' : rec.impact === 'medium' ? '🟡' : '🟢'} ${rec.title}</div>
                  <div style="font-size:13px;color:var(--sc-text-secondary);margin-top:4px;">${rec.description}</div>
                </div>
              `)}
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

      ${this.renderControlModal()}
      ${this.renderToast()}
    `;
  }

  private renderControlModal() {
    if (!this.showControlModal) return html``;

    return html`
      <div class="modal-overlay" @click=${(e: Event) => e.target === e.currentTarget && this.closeControlModal()}>
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">
              ${this.editingControl ? '✏️ 编辑控制项' : '➕ 新建评估'}
            </h2>
            <button class="modal-close" @click=${this.closeControlModal}>×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">控制项标题 *</label>
              <input type="text" class="form-input" .value=${this.controlForm.title} @input=${(e: Event) => this.updateControlFormField('title', (e.target as HTMLInputElement).value)} placeholder="输入控制项标题" />
            </div>
            <div class="form-group">
              <label class="form-label">描述</label>
              <input type="text" class="form-input" .value=${this.controlForm.description} @input=${(e: Event) => this.updateControlFormField('description', (e.target as HTMLInputElement).value)} placeholder="输入描述" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">优先级</label>
                <select class="form-select" .value=${this.controlForm.priority} @change=${(e: Event) => this.updateControlFormField('priority', (e.target as HTMLSelectElement).value)}>
                  <option value="critical">严重</option>
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">状态</label>
                <select class="form-select" .value=${this.controlForm.status} @change=${(e: Event) => this.updateControlFormField('status', (e.target as HTMLSelectElement).value)}>
                  <option value="compliant">合规</option>
                  <option value="partial">部分合规</option>
                  <option value="non-compliant">不合规</option>
                  <option value="not-applicable">不适用</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">证据状态</label>
                <select class="form-select" .value=${this.controlForm.evidenceStatus} @change=${(e: Event) => this.updateControlFormField('evidenceStatus', (e.target as HTMLSelectElement).value)}>
                  <option value="verified">已验证</option>
                  <option value="pending">待验证</option>
                  <option value="missing">缺失</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">负责人</label>
                <input type="text" class="form-input" .value=${this.controlForm.assignee} @input=${(e: Event) => this.updateControlFormField('assignee', (e.target as HTMLInputElement).value)} placeholder="输入负责人" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click=${this.closeControlModal}>取消</button>
            <button class="btn btn-primary" @click=${this.handleSaveControl}>
              ${this.editingControl ? '保存' : '创建'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderToast() {
    if (!this.toastMessage) return html``;

    return html`
      <div class="toast ${this.toastType}">
        ${this.toastType === 'success' ? '✅ ' : this.toastType === 'error' ? '❌ ' : 'ℹ️ '}
        ${this.toastMessage}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-compliance-page': ScCompliancePage;
  }
}

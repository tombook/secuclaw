/**
 * SecuClaw Threat Intelligence Page - 威胁情报页面
 * 
 * IOC管理、威胁源、MITRE ATT&CK映射、威胁报告、关联分析
 * AI能力: 威胁分析、MITRE映射建议
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { aiService, type SmartInsight, type AIRecommendation } from '../ai-service.js';
import { dataService } from '../data-service.js';
import { roleContext } from '../store/role-context.js';
import '../components/sc-ai-assistant.js';
import '../components/sc-smart-card.js';
import '../components/sc-role-perspective.js';
import '../components/design-system/sc-button.js';
import '../components/design-system/sc-card.js';
import '../components/design-system/sc-badge.js';
import '../components/sc-smart-recommendation-bar.js';

// ============ 类型定义 ============

type IOCType = 'ip' | 'domain' | 'hash' | 'url' | 'email';
type IOCSeverity = 'critical' | 'high' | 'medium' | 'low';
type IOCStatus = 'active' | 'inactive' | 'expired';

interface IOC {
  id: string;
  type: IOCType;
  value: string;
  severity: IOCSeverity;
  status: IOCStatus;
  source: string;
  tags: string[];
  mitreTactics: string[];
  mitreTechniques: string[];
  firstSeen: Date;
  lastSeen: Date;
  confidence: number;
  aiAnalysis?: string;
}

interface ThreatSource {
  id: string;
  name: string;
  type: 'commercial' | 'open-source' | 'internal';
  status: 'active' | 'inactive' | 'error';
  lastSync: Date;
  indicators: number;
}

interface MITRETechnique {
  id: string;
  name: string;
  tactic: string;
  count: number;
  severity: IOCSeverity;
}

// ============ 页面组件 ============

@customElement('sc-threats-page')
export class ScThreatsPage extends LitElement {
  // ============ 状态 ============

  private i18n = new I18nController(this);

  @state()
  private loading = true;

  @state()
  private iocs: IOC[] = [];

  @state()
  private filteredIOCs: IOC[] = [];

  @state()
  private threatSources: ThreatSource[] = [];

  @state()
  private mitreTechniques: MITRETechnique[] = [];

  @state()
  private insights: SmartInsight[] = [];

  @state()
  private threatStats: {
    totalActors: number;
    activeCampaigns: number;
    iocCount: number;
    avgConfidence: number;
  } = {
    totalActors: 0, activeCampaigns: 0, iocCount: 0,
    avgConfidence: 0,
  };

  @state()
  private selectedFilter: IOCType | 'all' = 'all';

  @state()
  private searchQuery = '';

  @state()
  private selectedIOC: IOC | null = null;

  @state()
  private selectedThreat: any = null;

  @state()
  private threatActors: any[] = [];

  @state()
  private recommendations: AIRecommendation[] = [];

  // IOC Modal state
  @state()
  private showIOCModal = false;

  @state()
  private editingIOC: IOC | null = null;

  @state()
  private iocForm = {
    type: 'ip' as IOCType,
    value: '',
    severity: 'medium' as IOCSeverity,
    source: '',
    tags: ''
  };

  // Toast state
  @state()
  private toastMessage = '';

  @state()
  private toastType: 'success' | 'error' | 'info' = 'info';

  private toastTimeout: number | null = null;

  // LocalStorage key
  private readonly STORAGE_KEY = 'secuclaw-threats-iocs';

  // Data source indicator
  @state()
  private dataSource: 'local' | 'demo' | 'api' = 'demo';

  // ============ 样式 ============

  static styles = css`
    :host {
      display: block;
    }

    .threats-container {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: var(--sc-spacing-lg, 20px);
      height: 100%;
    }

    @media (max-width: 1200px) {
      .threats-container {
        grid-template-columns: 1fr;
      }
    }

    .main-content {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-lg, 20px);
      overflow-y: auto;
    }

    /* 页面头部 */
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

    .btn-primary:hover {
      background-color: var(--sc-primary-dark, #2563eb);
    }

    .btn-secondary {
      background-color: var(--sc-bg-secondary, #f8fafc);
      color: var(--sc-text-primary, #1e293b);
      border: 1px solid var(--sc-border-color, #e2e8f0);
    }

    /* 统计卡片 */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--sc-spacing-md, 16px);
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* 威胁源状态 */
    .sources-section {
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

    .sources-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--sc-spacing-md, 16px);
    }

    .source-card {
      padding: var(--sc-spacing-md, 16px);
      background-color: var(--sc-bg-secondary, #f8fafc);
      border-radius: var(--sc-radius-md, 8px);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md, 16px);
    }

    .source-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--sc-radius-md, 8px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .source-icon.active { background-color: rgba(34, 197, 94, 0.1); }
    .source-icon.inactive { background-color: rgba(100, 116, 139, 0.1); }
    .source-icon.error { background-color: rgba(239, 68, 68, 0.1); }

    .source-info {
      flex: 1;
    }

    .source-name {
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      color: var(--sc-text-primary, #1e293b);
    }

    .source-meta {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
    }

    .source-status {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .source-status.active { background-color: var(--sc-success, #22c55e); }
    .source-status.inactive { background-color: var(--sc-text-tertiary, #94a3b8); }
    .source-status.error { background-color: var(--sc-danger, #ef4444); }

    /* MITRE ATT&CK 热力图 */
    .mitre-section {
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }

    .mitre-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: var(--sc-spacing-xs, 4px);
    }

    .mitre-cell {
      padding: var(--sc-spacing-sm, 8px);
      border-radius: var(--sc-radius-sm, 4px);
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .mitre-cell:hover {
      transform: scale(1.05);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .mitre-cell.critical { background-color: rgba(239, 68, 68, 0.2); border: 1px solid var(--sc-danger, #ef4444); }
    .mitre-cell.high { background-color: rgba(245, 158, 11, 0.2); border: 1px solid var(--sc-warning, #f59e0b); }
    .mitre-cell.medium { background-color: rgba(59, 130, 246, 0.2); border: 1px solid var(--sc-primary, #3b82f6); }
    .mitre-cell.low { background-color: rgba(34, 197, 94, 0.2); border: 1px solid var(--sc-success, #22c55e); }
    .mitre-cell.empty { background-color: var(--sc-bg-tertiary, #f1f5f9); border: 1px solid var(--sc-border-color, #e2e8f0); }

    .mitre-id {
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
    }

    .mitre-count {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
    }

    /* IOC 列表 */
    .ioc-section {
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }

    .filter-bar {
      display: flex;
      gap: var(--sc-spacing-sm, 8px);
      margin-bottom: var(--sc-spacing-md, 16px);
      flex-wrap: wrap;
    }

    .filter-chip {
      padding: var(--sc-spacing-xs, 4px) var(--sc-spacing-sm, 8px);
      border-radius: var(--sc-radius-full, 999px);
      font-size: var(--sc-font-size-sm, 14px);
      cursor: pointer;
      border: 1px solid var(--sc-border-color, #e2e8f0);
      background-color: var(--sc-bg-secondary, #f8fafc);
      transition: all 0.2s ease;
    }

    .filter-chip.active {
      background-color: var(--sc-primary, #3b82f6);
      color: white;
      border-color: var(--sc-primary, #3b82f6);
    }

    .search-input {
      flex: 1;
      min-width: 200px;
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 16px);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-md, 8px);
      font-size: var(--sc-font-size-sm, 14px);
    }

    .ioc-table {
      width: 100%;
      border-collapse: collapse;
    }

    .ioc-table th,
    .ioc-table td {
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 16px);
      text-align: left;
      border-bottom: 1px solid var(--sc-border-color, #e2e8f0);
    }

    .ioc-table th {
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 600;
      color: var(--sc-text-secondary, #64748b);
      text-transform: uppercase;
    }

    .ioc-table tr:hover {
      background-color: var(--sc-bg-secondary, #f8fafc);
    }

    .ioc-value {
      font-family: monospace;
      font-size: var(--sc-font-size-sm, 14px);
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .severity-badge {
      padding: 2px 6px;
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 500;
    }

    .severity-badge.critical { background-color: rgba(239, 68, 68, 0.1); color: var(--sc-danger, #ef4444); }
    .severity-badge.high { background-color: rgba(245, 158, 11, 0.1); color: var(--sc-warning, #f59e0b); }
    .severity-badge.medium { background-color: rgba(59, 130, 246, 0.1); color: var(--sc-primary, #3b82f6); }
    .severity-badge.low { background-color: rgba(34, 197, 94, 0.1); color: var(--sc-success, #22c55e); }

    .tag {
      display: inline-block;
      padding: 2px 6px;
      background-color: var(--sc-bg-tertiary, #f1f5f9);
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-xs, 12px);
      margin-right: 4px;
    }

    /* AI分析提示 */
    .ai-analysis {
      margin-top: var(--sc-spacing-sm, 8px);
      padding: var(--sc-spacing-sm, 8px);
      background-color: rgba(59, 130, 246, 0.05);
      border-left: 3px solid var(--sc-primary, #3b82f6);
      border-radius: 0 var(--sc-radius-sm, 4px) var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
    }

    /* AI洞察 */
    .insights-section {
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }

    .insight-item {
      display: flex;
      align-items: flex-start;
      gap: var(--sc-spacing-sm, 8px);
      padding: var(--sc-spacing-sm, 8px);
      background-color: var(--sc-bg-secondary, #f8fafc);
      border-radius: var(--sc-radius-md, 8px);
      margin-bottom: var(--sc-spacing-sm, 8px);
    }

    .insight-icon {
      font-size: 18px;
      flex-shrink: 0;
    }

    .insight-content {
      flex: 1;
    }

    .insight-title {
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      color: var(--sc-text-primary, #1e293b);
    }

    .insight-description {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
    }

    /* AI助手侧边栏 */
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

  // ============ 生命周期 ============

  constructor() {
    super();
    this.loadThreatData();
  }

  private async loadThreatData() {
    this.loading = true;
    
    try {
      // Load from API
      try {
        const threats = await dataService.getThreats({ pageSize: 50 });
        if (threats.length > 0) {
          // Convert to UI format
          this.threatActors = threats.map(t => ({
            id: t.id,
            name: t.name,
            aliases: t.aliases || [],
            type: t.type,
            motivation: Array.isArray(t.motivation) ? t.motivation.join(', ') : t.motivation,
            sophistication: t.capabilities?.sophistication,
            techniqueCount: t.capabilities?.techniques?.length || 0,
            campaignCount: t.campaigns?.length || 0,
            lastActivity: t.campaigns?.[0]?.startDate,
            risk: this.calculateThreatRisk(t)
          }));
        }
        
        const stats = await dataService.getThreatStats();
        if (stats) {
          this.threatStats = {
            totalActors: stats.total || 0,
            activeCampaigns: 0,
            iocCount: 0,
            avgConfidence: stats.avgConfidence || 0
          };
        }
      } catch (e) {
        console.error('Failed to load from API:', e);
      }
      
      await this.loadIOCs();
      await this.loadThreatSources();
      await this.loadMITREData();
      await this.loadAIInsights();
    } catch (error) {
      console.error('Failed to load threat data:', error);
    } finally {
      this.loading = false;
    }
  }

  private calculateThreatRisk(threat: any): number {
    const sophisticationMap: Record<string, number> = {
      'advanced': 90, 'moderate': 60, 'low': 30
    };
    const baseScore = sophisticationMap[threat.capabilities?.sophistication] || 50;
    const techniqueBonus = (threat.capabilities?.techniques?.length || 0) * 2;
    const campaignBonus = (threat.campaigns?.length || 0) * 5;
    return Math.min(100, baseScore + techniqueBonus + campaignBonus);
  }

  private get avgThreatConfidence(): number {
    if (!this.iocs || this.iocs.length === 0) return 0;
    const sum = this.iocs.reduce((acc, ioc) => acc + (ioc.confidence ?? 0), 0);
    return Math.round(sum / this.iocs.length);
  }

  private async loadIOCs() {
    // 优先从 localStorage 加载
    const stored = this.loadFromLocalStorage();
    
    if (stored.length > 0) {
      this.iocs = stored;
      this.filteredIOCs = [...this.iocs];
      this.dataSource = 'local';
      return;
    }
    
    // 如果没有存储数据，使用示例数据并存入 localStorage
    const sampleIOCs: IOC[] = [
      {
        id: 'ioc-1',
        type: 'ip',
        value: '192.168.1.100',
        severity: 'critical',
        status: 'active',
        source: 'VirusTotal',
        tags: ['APT29', 'malware-c2'],
        mitreTactics: ['Command and Control'],
        mitreTechniques: ['T1071'],
        firstSeen: new Date('2024-01-15'),
        lastSeen: new Date('2024-03-08'),
        confidence: 95,
        aiAnalysis: '该IP与APT29组织高度关联，建议立即封禁'
      },
      {
        id: 'ioc-2',
        type: 'domain',
        value: 'malicious-domain.com',
        severity: 'high',
        status: 'active',
        source: 'AlienVault OTX',
        tags: ['phishing', 'credential-harvest'],
        mitreTactics: ['Initial Access', 'Credential Access'],
        mitreTechniques: ['T1566', 'T1528'],
        firstSeen: new Date('2024-02-20'),
        lastSeen: new Date('2024-03-07'),
        confidence: 88
      },
      {
        id: 'ioc-3',
        type: 'hash',
        value: 'a1b2c3d4e5f67890abcdef1234567890',
        severity: 'critical',
        status: 'active',
        source: 'Hybrid Analysis',
        tags: ['ransomware', 'LockBit'],
        mitreTactics: ['Execution', 'Impact'],
        mitreTechniques: ['T1204', 'T1486'],
        firstSeen: new Date('2024-03-01'),
        lastSeen: new Date('2024-03-08'),
        confidence: 97,
        aiAnalysis: 'LockBit 3.0勒索软件变种，具备强加密能力'
      },
      {
        id: 'ioc-4',
        type: 'url',
        value: 'https://evil-site.com/payload.exe',
        severity: 'high',
        status: 'active',
        source: 'URLhaus',
        tags: ['malware-download', 'Emotet'],
        mitreTactics: ['Initial Access', 'Execution'],
        mitreTechniques: ['T1566', 'T1204'],
        firstSeen: new Date('2024-02-25'),
        lastSeen: new Date('2024-03-06'),
        confidence: 92
      },
      {
        id: 'ioc-5',
        type: 'email',
        value: 'attacker@evil.com',
        severity: 'medium',
        status: 'active',
        source: 'Internal',
        tags: ['spear-phishing'],
        mitreTactics: ['Initial Access'],
        mitreTechniques: ['T1566'],
        firstSeen: new Date('2024-03-05'),
        lastSeen: new Date('2024-03-08'),
        confidence: 78
      }
    ];
    
    this.iocs = sampleIOCs;
    this.filteredIOCs = [...this.iocs];
    this.dataSource = 'demo';
    this.saveToLocalStorage(sampleIOCs);
  }

  private loadFromLocalStorage(): IOC[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as IOC[];
        return parsed.map(ioc => ({
          ...ioc,
          firstSeen: new Date(ioc.firstSeen),
          lastSeen: new Date(ioc.lastSeen)
        }));
      }
    } catch (e) {
      console.error('[Threats] Failed to load from localStorage:', e);
    }
    return [];
  }

  private saveToLocalStorage(iocs: IOC[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(iocs));
    } catch (e) {
      console.error('[Threats] Failed to save to localStorage:', e);
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

  // IOC CRUD operations
  private openAddIOCModal() {
    this.editingIOC = null;
    this.iocForm = {
      type: 'ip',
      value: '',
      severity: 'medium',
      source: '',
      tags: ''
    };
    this.showIOCModal = true;
  }

  private openEditIOCModal(ioc: IOC) {
    this.editingIOC = ioc;
    this.iocForm = {
      type: ioc.type,
      value: ioc.value,
      severity: ioc.severity,
      source: ioc.source,
      tags: ioc.tags.join(', ')
    };
    this.showIOCModal = true;
  }

  private closeIOCModal() {
    this.showIOCModal = false;
    this.editingIOC = null;
  }

  private updateIOCFormField(field: string, value: string) {
    this.iocForm = { ...this.iocForm, [field]: value };
  }

  private async handleSaveIOC() {
    if (!this.iocForm.value.trim()) {
      this.showToast('请输入IOC值', 'error');
      return;
    }

    if (this.editingIOC) {
      // Update existing IOC
      const index = this.iocs.findIndex(i => i.id === this.editingIOC!.id);
      if (index >= 0) {
        this.iocs[index] = {
          ...this.iocs[index],
          type: this.iocForm.type as IOCType,
          value: this.iocForm.value,
          severity: this.iocForm.severity as IOCSeverity,
          source: this.iocForm.source,
          tags: this.iocForm.tags.split(',').map(t => t.trim()).filter(Boolean),
          lastSeen: new Date()
        };
        this.saveToLocalStorage(this.iocs);
        this.showToast('IOC更新成功', 'success');
      }
    } else {
      // Add new IOC
      const newIOC: IOC = {
        id: `ioc-${Date.now()}`,
        type: this.iocForm.type as IOCType,
        value: this.iocForm.value,
        severity: this.iocForm.severity as IOCSeverity,
        status: 'active',
        source: this.iocForm.source || 'Manual',
        tags: this.iocForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        mitreTactics: [],
        mitreTechniques: [],
        firstSeen: new Date(),
        lastSeen: new Date(),
        confidence: 70
      };
      this.iocs = [newIOC, ...this.iocs];
      this.saveToLocalStorage(this.iocs);
      this.showToast('IOC添加成功', 'success');
    }

    this.filteredIOCs = [...this.iocs];
    this.closeIOCModal();
  }

  private async handleDeleteIOC(id: string) {
    if (!confirm('确定要删除这个IOC吗？')) return;
    this.iocs = this.iocs.filter(i => i.id !== id);
    this.saveToLocalStorage(this.iocs);
    this.filteredIOCs = [...this.iocs];
    this.showToast('IOC已删除', 'success');
  }

  private async loadThreatSources() {
    this.threatSources = [
      { id: '1', name: 'VirusTotal', type: 'commercial', status: 'active', lastSync: new Date(), indicators: 12456 },
      { id: '2', name: 'AlienVault OTX', type: 'open-source', status: 'active', lastSync: new Date(), indicators: 8923 },
      { id: '3', name: 'MISP', type: 'internal', status: 'active', lastSync: new Date(), indicators: 5678 },
      { id: '4', name: 'ThreatConnect', type: 'commercial', status: 'error', lastSync: new Date(Date.now() - 86400000), indicators: 0 },
      { id: '5', name: 'Hybrid Analysis', type: 'commercial', status: 'active', lastSync: new Date(), indicators: 3456 },
      { id: '6', name: 'URLhaus', type: 'open-source', status: 'active', lastSync: new Date(), indicators: 2345 }
    ];
  }

  private formatThreatTypeBreakdown(): string {
    const map: Record<string, number> = {};
    for (const a of this.threatActors) {
      const t = (a.type as string) || 'unknown';
      map[t] = (map[t] || 0) + 1;
    }
    return Object.entries(map).map(([k,v]) => `${k}:${v}`).join(', ');
  }

  private async loadMITREData() {
    this.mitreTechniques = [
      { id: 'T1566', name: 'Phishing', tactic: 'Initial Access', count: 45, severity: 'critical' },
      { id: 'T1071', name: 'Application Layer Protocol', tactic: 'Command and Control', count: 32, severity: 'high' },
      { id: 'T1204', name: 'User Execution', tactic: 'Execution', count: 28, severity: 'high' },
      { id: 'T1059', name: 'Command and Scripting Interpreter', tactic: 'Execution', count: 25, severity: 'high' },
      { id: 'T1486', name: 'Data Encrypted for Impact', tactic: 'Impact', count: 15, severity: 'critical' },
      { id: 'T1027', name: 'Obfuscated Files', tactic: 'Defense Evasion', count: 12, severity: 'medium' },
      { id: 'T1003', name: 'OS Credential Dumping', tactic: 'Credential Access', count: 10, severity: 'high' },
      { id: 'T1083', name: 'File and Directory Discovery', tactic: 'Discovery', count: 8, severity: 'low' }
    ];
  }

  private async loadAIInsights() {
    try {
      this.insights = await aiService.generateInsights({
        pageId: 'threats',
        data: { iocs: this.iocs, sources: this.threatSources },
        userRole: 'analyst',
      });

      this.recommendations = await aiService.generateRecommendations({
        pageId: 'threats',
        data: { insights: this.insights },
        userRole: 'analyst',
      });
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    }
  }

  // ============ 事件处理 ============

  private handleFilterChange(type: IOCType | 'all') {
    this.selectedFilter = type;
    this.applyFilters();
  }

  private async handleSearch(e: Event) {
    this.searchQuery = (e.target as HTMLInputElement).value;
    if (this.searchQuery.trim().length > 0) {
      try {
        const threats = await dataService.searchThreats(this.searchQuery);
        this.threatActors = threats.map((t: any) => ({
          id: t.id,
          name: t.name,
          aliases: t.aliases || [],
          type: t.type,
          motivation: t.motivation || '',
          capabilities: { techniques: t.capabilities?.techniques || [] },
          campaignCount: (t.campaigns?.length) || 0,
          lastActivity: t.lastSeen,
          risk: this.calculateThreatRisk(t),
          iocs: t.iocs || [],
          confidence: t.confidence || 0
        }));
      } catch {
        // fallback to local filtering
        this.applyFilters();
      }
    } else {
      await this.loadThreatData();
    }
    this.applyFilters();
  }

  private applyFilters() {
    let filtered = [...this.iocs];
    
    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(ioc => ioc.type === this.selectedFilter);
    }
    
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(ioc => 
        ioc.value.toLowerCase().includes(query) ||
        ioc.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    this.filteredIOCs = filtered;
  }

  private handleIOCClick(ioc: IOC) {
    this.selectedIOC = this.selectedIOC?.id === ioc.id ? null : ioc;
  }

  // ============ 渲染方法 ============

  private renderStats() {
    const activeCount = this.iocs.filter(i => i.status === 'active').length;
    const criticalCount = this.iocs.filter(i => i.severity === 'critical').length;
    const highCount = this.iocs.filter(i => i.severity === 'high').length;
    const sourcesActive = this.threatSources.filter(s => s.status === 'active').length;
    const ts = this.threatStats;

    return html`
      <div class="stats-grid">
        ${this.threatStats && this.threatStats.totalActors !== undefined ? html`
          <sc-smart-card
            title="威胁总数"
            value="${this.threatStats.totalActors ?? 0}"
            icon="🎯"
            status="success"
          ></sc-smart-card>
          <sc-smart-card
            title="类型分布"
            value="${this.formatThreatTypeBreakdown()}"
            icon="🗺️"
            status="neutral"
          ></sc-smart-card>
          <sc-smart-card
            title="平均置信度"
            value="${this.avgThreatConfidence}%"
            icon="📈"
            status="success"
          ></sc-smart-card>
        ` : ''}
        <sc-smart-card
          title="活跃IOC"
          value="${activeCount}"
          icon="🎯"
          trend="up"
          trendValue="+12%"
          status="warning"
        ></sc-smart-card>
        <sc-smart-card
          title="高危威胁"
          value="${criticalCount + highCount}"
          icon="🔴"
          trend="stable"
          trendValue="0"
          status="error"
        ></sc-smart-card>
        <sc-smart-card
          title="威胁源"
          value="${sourcesActive}/${this.threatSources.length}"
          icon="📡"
          status="success"
        ></sc-smart-card>
        <sc-smart-card
          title="MITRE覆盖"
          value="${this.mitreTechniques.length}"
          icon="🗺️"
          subtitle="技术覆盖"
          status="success"
        ></sc-smart-card>
        <sc-smart-card
          title="威胁行为体"
          value="${ts.totalActors}"
          icon="👤"
          subtitle="${ts.activeCampaigns} 活跃活动"
          status="info"
        ></sc-smart-card>
        <sc-smart-card
          title="平均置信度"
          value="${(ts.avgConfidence * 100).toFixed(0)}%"
          icon="📊"
          status="${ts.avgConfidence > 0.7 ? 'success' : 'warning'}"
        ></sc-smart-card>
      </div>
    `;
  }

  private renderThreatSources() {
    return html`
      <div class="sources-section">
        <div class="section-header">
          <h3 class="section-title">📡 威胁情报源</h3>
          <sc-button size="sm" variant="secondary">+ 添加源</sc-button>
        </div>
        <div class="sources-grid">
          ${this.threatSources.map(source => html`
            <div class="source-card">
              <div class="source-icon ${source.status}">
                ${source.type === 'commercial' ? '💰' : source.type === 'open-source' ? '🔓' : '🏢'}
              </div>
              <div class="source-info">
                <div class="source-name">${source.name}</div>
                <div class="source-meta">
                  ${source.indicators.toLocaleString()} indicators · 
                  ${source.status === 'active' ? '刚刚同步' : source.status === 'error' ? '同步失败' : '未激活'}
                </div>
              </div>
              <div class="source-status ${source.status}"></div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private renderMITREMatrix() {
    return html`
      <div class="mitre-section">
        <div class="section-header">
          <h3 class="section-title">🗺️ MITRE ATT&CK 覆盖</h3>
          <sc-button size="sm" variant="secondary">查看完整矩阵</sc-button>
        </div>
        <div class="mitre-grid">
          ${this.mitreTechniques.map(tech => html`
            <div class="mitre-cell ${tech.severity}" title="${tech.name}">
              <div class="mitre-id">${tech.id}</div>
              <div class="mitre-count">${tech.count} IOCs</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private renderIOCList() {
    return html`
      <div class="ioc-section">
        <div class="section-header">
          <h3 class="section-title">🎯 IOC 列表</h3>
          <span style="font-size:11px;padding:2px 8px;border-radius:4px;background:${this.dataSource === 'local' ? '#d4edda' : this.dataSource === 'api' ? '#cce5ff' : '#fff3cd'};color:${this.dataSource === 'local' ? '#155724' : this.dataSource === 'api' ? '#004085' : '#856404'};">
            ${this.dataSource === 'local' ? '📁 本地数据' : this.dataSource === 'api' ? '☁️ 实时数据' : '📝 演示数据'}
          </span>
        </div>
        
        <div class="filter-bar">
          <button 
            class="filter-chip ${this.selectedFilter === 'all' ? 'active' : ''}"
            @click=${() => this.handleFilterChange('all')}
          >全部</button>
          <button 
            class="filter-chip ${this.selectedFilter === 'ip' ? 'active' : ''}"
            @click=${() => this.handleFilterChange('ip')}
          >IP</button>
          <button 
            class="filter-chip ${this.selectedFilter === 'domain' ? 'active' : ''}"
            @click=${() => this.handleFilterChange('domain')}
          >域名</button>
          <button 
            class="filter-chip ${this.selectedFilter === 'hash' ? 'active' : ''}"
            @click=${() => this.handleFilterChange('hash')}
          >Hash</button>
          <button 
            class="filter-chip ${this.selectedFilter === 'url' ? 'active' : ''}"
            @click=${() => this.handleFilterChange('url')}
          >URL</button>
          <input 
            type="text" 
            class="search-input" 
            placeholder="搜索IOC..."
            .value=${this.searchQuery}
            @input=${this.handleSearch}
          />
        </div>

        <table class="ioc-table">
          <thead>
            <tr>
              <th>类型</th>
              <th>值</th>
              <th>严重程度</th>
              <th>来源</th>
              <th>标签</th>
              <th>置信度</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${this.filteredIOCs.map(ioc => html`
              <tr @click=${() => this.handleIOCClick(ioc)}>
                <td>${ioc.type.toUpperCase()}</td>
                <td class="ioc-value" title="${ioc.value}">${ioc.value}</td>
                <td><span class="severity-badge ${ioc.severity}">${ioc.severity}</span></td>
                <td>${ioc.source}</td>
                <td>
                  ${ioc.tags.slice(0, 2).map(tag => html`<span class="tag">${tag}</span>`)}
                  ${ioc.tags.length > 2 ? html`<span class="tag">+${ioc.tags.length - 2}</span>` : ''}
                </td>
                <td>${ioc.confidence}%</td>
                <td>
                  <sc-button size="sm" variant="secondary" @click=${(e: Event) => { e.stopPropagation(); this.openEditIOCModal(ioc); }}>编辑</sc-button>
                  <sc-button size="sm" variant="danger" @click=${(e: Event) => { e.stopPropagation(); this.handleDeleteIOC(ioc.id); }}>删除</sc-button>
                </td>
              </tr>
              ${this.selectedIOC?.id === ioc.id ? html`
                <tr>
                  <td colspan="7">
                    ${ioc.aiAnalysis ? html`
                      <div class="ai-analysis">
                        <strong>🤖 AI分析:</strong> ${ioc.aiAnalysis}
                      </div>
                    ` : ''}
                    <div style="padding: 8px; font-size: 12px; color: var(--sc-text-secondary);">
                      MITRE战术: ${ioc.mitreTactics.join(', ')} | 
                      MITRE技术: ${ioc.mitreTechniques.join(', ')} |
                      首次发现: ${ioc.firstSeen.toLocaleDateString()} |
                      最近发现: ${ioc.lastSeen.toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ` : ''}
            `)}
          </tbody>
        </table>
      </div>
    `;
  }

  private renderInsights() {
    return html`
      <div class="insights-section">
        <div class="section-header">
          <h3 class="section-title">🤖 AI威胁分析</h3>
        </div>
        ${this.insights.length > 0 ? this.insights.slice(0, 3).map(insight => html`
          <div class="insight-item">
            <span class="insight-icon">${insight.type === 'warning' ? '⚠️' : insight.type === 'recommendation' ? '💡' : 'ℹ️'}</span>
            <div class="insight-content">
              <div class="insight-title">${insight.title}</div>
              <div class="insight-description">${insight.description}</div>
            </div>
          </div>
        `) : html`
          <div class="insight-item">
            <span class="insight-icon">✅</span>
            <div class="insight-content">
              <div class="insight-title">威胁态势正常</div>
              <div class="insight-description">当前没有需要特别关注的威胁</div>
            </div>
          </div>
        `}
        ${this.recommendations.length > 0 ? html`
          <div class="section-header" style="margin-top:16px;">
            <h3 class="section-title">💡 AI建议</h3>
          </div>
          ${this.recommendations.slice(0, 5).map(rec => html`
            <div class="insight-item">
              <span class="insight-icon">${rec.impact === 'high' ? '🔴' : rec.impact === 'medium' ? '🟡' : '🟢'}</span>
              <div class="insight-content">
                <div class="insight-title">${rec.title}</div>
                <div class="insight-description">${rec.description}</div>
              </div>
            </div>
          `)}
        ` : ''}
      </div>
    `;
  }

  private renderThreatActors() {
    if (this.threatActors.length === 0) return html``;
    return html`
      <div class="sources-section">
        <div class="section-header">
          <h3 class="section-title">👤 威胁行为体</h3>
          <span style="font-size:12px;color:var(--sc-text-secondary);">${this.threatActors.length} 个行为体</span>
        </div>
        <div class="sources-grid">
          ${this.threatActors.slice(0, 8).map((actor: any) => html`
            <div class="source-card" @click=${() => this.selectedThreat = this.selectedThreat?.id === actor.id ? null : actor}>
              <div class="source-info">
                <div class="source-name">${actor.name || '未知'}</div>
                <div class="source-meta">
                  ${actor.motivation || '未知动机'} · ${actor.campaignCount || 0} 活动 · 风险评分: ${actor.risk ?? '-'}
                </div>
              </div>
            </div>
          ${this.selectedThreat?.id === actor.id ? html`<div class="ai-analysis" style="margin-top:8px; padding:8px; border-radius:6px; background:#f8fafc; border:1px solid #e2e8f0;">
            <strong>详情</strong>: Aliases: ${actor.aliases?.join(', ') ?? actor.name}；动机: ${actor.motivation ?? '未知'}；能力: ${actor.capabilities?.techniques?.join(', ') ?? 'N/A'}；IOC计数: ${actor.iocs?.length ?? 0}
          </div>` : ''}
          `)}
        </div>
      </div>
    `;
  }

  private renderRolePerspective() {
    const currentRole = roleContext.getState().currentRole || 'security-expert';
    return html`
      <div style="margin-top: var(--sc-spacing-lg, 20px);">
        <sc-role-perspective
          dataType="threats"
          .data=${{
            iocs: this.iocs,
            threatSources: this.threatSources,
            mitreTechniques: this.mitreTechniques
          }}
          .currentRole=${currentRole}
        ></sc-role-perspective>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`
        <div style="text-align: center; padding: 2rem;">
          <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
          <div style="color: var(--sc-text-secondary);">${this.i18n.t('common.loading')}</div>
        </div>
      `;
    }

    return html`
      <sc-smart-recommendation-bar></sc-smart-recommendation-bar>
      <div class="threats-container">
        <div class="main-content">
          <div class="page-header">
            <div class="page-title-section">
              <h1 class="page-title">
                <span>🔍</span>
                ${this.i18n.t('nav.threats') || '威胁情报'}
              </h1>
              <div class="page-description">
                <span>监控外部威胁动态，提前预警潜在攻击</span>
              </div>
            </div>
            <div class="header-actions">
              <sc-button size="sm" variant="secondary">📤 导出报告</sc-button>
              <sc-button size="sm" variant="primary" @click=${this.openAddIOCModal}>+ 添加IOC</sc-button>
            </div>
          </div>

          ${this.renderStats()}
          ${this.renderThreatSources()}
          ${this.renderMITREMatrix()}
          ${this.renderThreatActors()}
          ${this.renderIOCList()}
          ${this.renderInsights()}
          ${this.renderRolePerspective()}
        </div>

        <div class="ai-sidebar">
          <sc-ai-assistant
            pageId="threats"
            pageTitle="威胁情报"
            .pageData=${{
              iocs: this.iocs,
              sources: this.threatSources,
              mitre: this.mitreTechniques
            }}
            userRole="security-expert"
          ></sc-ai-assistant>
        </div>
      </div>

      ${this.renderIOCModal()}
      ${this.renderToast()}
    `;
  }

  private renderIOCModal() {
    if (!this.showIOCModal) return html``;

    return html`
      <div class="modal-overlay" @click=${(e: Event) => e.target === e.currentTarget && this.closeIOCModal()}>
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">
              ${this.editingIOC ? '✏️ 编辑IOC' : '➕ 添加IOC'}
            </h2>
            <button class="modal-close" @click=${this.closeIOCModal}>×</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">类型</label>
                <select class="form-select" .value=${this.iocForm.type} @change=${(e: Event) => this.updateIOCFormField('type', (e.target as HTMLSelectElement).value)}>
                  <option value="ip">IP地址</option>
                  <option value="domain">域名</option>
                  <option value="hash">哈希</option>
                  <option value="url">URL</option>
                  <option value="email">邮箱</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">严重程度</label>
                <select class="form-select" .value=${this.iocForm.severity} @change=${(e: Event) => this.updateIOCFormField('severity', (e.target as HTMLSelectElement).value)}>
                  <option value="critical">严重</option>
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">IOC值 *</label>
              <input type="text" class="form-input" .value=${this.iocForm.value} @input=${(e: Event) => this.updateIOCFormField('value', (e.target as HTMLInputElement).value)} placeholder="输入IOC值，如 192.168.1.1" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">来源</label>
                <input type="text" class="form-input" .value=${this.iocForm.source} @input=${(e: Event) => this.updateIOCFormField('source', (e.target as HTMLInputElement).value)} placeholder="如 VirusTotal" />
              </div>
              <div class="form-group">
                <label class="form-label">标签</label>
                <input type="text" class="form-input" .value=${this.iocForm.tags} @input=${(e: Event) => this.updateIOCFormField('tags', (e.target as HTMLInputElement).value)} placeholder="用逗号分隔" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
<sc-button size="sm" variant="secondary" @click=${this.closeIOCModal}>取消</sc-button>
<sc-button size="sm" variant="primary" @click=${this.handleSaveIOC}>保存</sc-button>
              ${this.editingIOC ? '保存' : '添加'}
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
    'sc-threats-page': ScThreatsPage;
  }
}

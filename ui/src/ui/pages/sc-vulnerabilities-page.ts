/**
 * SecuClaw Vulnerability Management Page - 漏洞管理页面
 * 
 * 漏洞列表、修复跟踪、风险评分、扫描任务管理
 * AI能力: 优先级排序、修复建议
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { aiService, type SmartInsight, type AIRecommendation, type TrendPrediction } from '../ai-service.js';
import { dataService, type VulnerabilityQueryParams, type VulnerabilityStats } from '../data-service.js';
import { gatewayClient } from '../gateway-client.js';
import { roleContext } from '../store/role-context.js';
import '../components/sc-ai-assistant.js';
import '../components/sc-smart-card.js';
import '../components/sc-role-perspective.js';
import '../components/design-system/sc-button.js';
import '../components/design-system/sc-card.js';
import '../components/design-system/sc-badge.js';
import '../components/sc-smart-recommendation-bar.js';

// ============ 类型定义 ============

type VulnerabilitySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type VulnerabilityStatus = 'open' | 'in-progress' | 'fixed' | 'accepted' | 'false-positive';
type AssetType = 'server' | 'workstation' | 'network' | 'application' | 'database' | 'cloud';

interface Vulnerability {
  id: string;
  cve: string;
  title: string;
  description: string;
  severity: VulnerabilitySeverity;
  cvssScore: number;
  epssScore?: number;
  status: VulnerabilityStatus;
  asset: {
    id: string;
    name: string;
    type: AssetType;
    criticality: 'critical' | 'high' | 'medium' | 'low';
  };
  discoveredAt: Date;
  dueDate?: Date;
  assignee?: string;
  fixAvailable: boolean;
  exploitAvailable: boolean;
  tags: string[];
  aiPriority?: number;
  aiRecommendation?: string;
  remediationSteps?: string[];
}

interface ScanTask {
  id: string;
  name: string;
  type: 'network' | 'web' | 'database' | 'container';
  status: 'running' | 'completed' | 'scheduled' | 'failed';
  target: string;
  lastRun?: Date;
  nextRun?: Date;
  findings: number;
}

// ============ 页面组件 ============

@customElement('sc-vulnerabilities-page')
export class ScVulnerabilitiesPage extends LitElement {
  // ============ 状态 ============

  private i18n = new I18nController(this);

  @state()
  private loading = true;

  @state()
  private vulnerabilities: Vulnerability[] = [];

  @state()
  private filteredVulns: Vulnerability[] = [];

  @state()
  private scanTasks: ScanTask[] = [];

  @state()
  private insights: SmartInsight[] = [];

  @state()
  private recommendations: AIRecommendation[] = [];

  @state()
  private predictions: TrendPrediction[] = [];

  @state()
  private severityFilter: VulnerabilitySeverity | 'all' = 'all';

  @state()
  private statusFilter: VulnerabilityStatus | 'all' = 'all';

  @state()
  private searchQuery = '';

  @state()
  private selectedVuln: Vulnerability | null = null;

  @state()
  private sortBy: 'severity' | 'cvss' | 'aiPriority' | 'discoveredAt' = 'aiPriority';

  @state()
  private vulnStats?: VulnerabilityStats;

  @state()
  private toastMessage: string = '';

  @state()
  private toastType: 'success'|'error'|'info' = 'info';

  // ============ 样式 ============

  static styles = css`
    :host {
      display: block;
    }

    .vulns-container {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: var(--sc-spacing-lg, 20px);
      height: 100%;
    }

    @media (max-width: 1200px) {
      .vulns-container {
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

    .btn-secondary {
      background-color: var(--sc-bg-secondary, #f8fafc);
      color: var(--sc-text-primary, #1e293b);
      border: 1px solid var(--sc-border-color, #e2e8f0);
    }

    /* 统计卡片 */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: var(--sc-spacing-md, 16px);
    }

    @media (max-width: 900px) {
      .stats-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 600px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* 扫描任务区域 */
    .scan-section {
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

    .scan-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--sc-spacing-md, 16px);
    }

    .scan-card {
      padding: var(--sc-spacing-md, 16px);
      background-color: var(--sc-bg-secondary, #f8fafc);
      border-radius: var(--sc-radius-md, 8px);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .scan-info {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-xs, 4px);
    }

    .scan-name {
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      color: var(--sc-text-primary, #1e293b);
    }

    .scan-meta {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
    }

    .scan-status {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs, 4px);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .status-dot.running { background-color: var(--sc-primary, #3b82f6); animation: pulse 1.5s infinite; }
    .status-dot.completed { background-color: var(--sc-success, #22c55e); }
    .status-dot.scheduled { background-color: var(--sc-warning, #f59e0b); }
    .status-dot.failed { background-color: var(--sc-danger, #ef4444); }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .status-label {
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 500;
      color: var(--sc-text-secondary, #64748b);
    }

    /* 漏洞列表 */
    .vuln-section {
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
      align-items: center;
    }

    .filter-group {
      display: flex;
      gap: var(--sc-spacing-xs, 4px);
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

    .sort-select {
      padding: var(--sc-spacing-sm, 8px);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-md, 8px);
      font-size: var(--sc-font-size-sm, 14px);
      background-color: var(--sc-bg-secondary, #f8fafc);
    }

    .vuln-table {
      width: 100%;
      border-collapse: collapse;
    }

    .vuln-table th,
    .vuln-table td {
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 16px);
      text-align: left;
      border-bottom: 1px solid var(--sc-border-color, #e2e8f0);
    }

    .vuln-table th {
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 600;
      color: var(--sc-text-secondary, #64748b);
      text-transform: uppercase;
      position: sticky;
      top: 0;
      background-color: var(--sc-bg-card, #ffffff);
    }

    .vuln-table tr:hover {
      background-color: var(--sc-bg-secondary, #f8fafc);
    }

    .vuln-table tr.selected {
      background-color: rgba(59, 130, 246, 0.05);
    }

    .cve-link {
      color: var(--sc-primary, #3b82f6);
      text-decoration: none;
      font-family: monospace;
      font-weight: 500;
    }

    .cve-link:hover {
      text-decoration: underline;
    }

    .severity-badge {
      padding: 2px 6px;
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 500;
      text-transform: uppercase;
    }

    .severity-badge.critical { background-color: rgba(239, 68, 68, 0.1); color: var(--sc-danger, #ef4444); }
    .severity-badge.high { background-color: rgba(245, 158, 11, 0.1); color: var(--sc-warning, #f59e0b); }
    .severity-badge.medium { background-color: rgba(59, 130, 246, 0.1); color: var(--sc-primary, #3b82f6); }
    .severity-badge.low { background-color: rgba(34, 197, 94, 0.1); color: var(--sc-success, #22c55e); }
    .severity-badge.info { background-color: rgba(100, 116, 139, 0.1); color: var(--sc-text-secondary, #64748b); }

    .cvss-score {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 24px;
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 600;
    }

    .cvss-score.critical { background-color: var(--sc-danger, #ef4444); color: white; }
    .cvss-score.high { background-color: var(--sc-warning, #f59e0b); color: white; }
    .cvss-score.medium { background-color: var(--sc-primary, #3b82f6); color: white; }
    .cvss-score.low { background-color: var(--sc-success, #22c55e); color: white; }

    .ai-priority {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs, 4px);
    }

    .priority-bar {
      width: 60px;
      height: 6px;
      background-color: var(--sc-bg-tertiary, #f1f5f9);
      border-radius: var(--sc-radius-full, 999px);
      overflow: hidden;
    }

    .priority-fill {
      height: 100%;
      border-radius: var(--sc-radius-full, 999px);
    }

    .priority-fill.high { background-color: var(--sc-danger, #ef4444); }
    .priority-fill.medium { background-color: var(--sc-warning, #f59e0b); }
    .priority-fill.low { background-color: var(--sc-success, #22c55e); }

    .status-badge {
      padding: 2px 6px;
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-xs, 12px);
    }

    .status-badge.open { background-color: rgba(239, 68, 68, 0.1); color: var(--sc-danger, #ef4444); }
    .status-badge.in-progress { background-color: rgba(59, 130, 246, 0.1); color: var(--sc-primary, #3b82f6); }
    .status-badge.fixed { background-color: rgba(34, 197, 94, 0.1); color: var(--sc-success, #22c55e); }
    .status-badge.accepted { background-color: rgba(245, 158, 11, 0.1); color: var(--sc-warning, #f59e0b); }
    .status-badge.false-positive { background-color: rgba(100, 116, 139, 0.1); color: var(--sc-text-secondary, #64748b); }

    .exploit-indicator {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 2px 6px;
      background-color: rgba(239, 68, 68, 0.1);
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-danger, #ef4444);
    }

    /* 漏洞详情 */
    .vuln-detail {
      margin-top: var(--sc-spacing-lg, 20px);
      padding: var(--sc-spacing-lg, 20px);
      background-color: var(--sc-bg-secondary, #f8fafc);
      border-radius: var(--sc-radius-lg, 12px);
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--sc-spacing-md, 16px);
    }

    .detail-title {
      font-size: var(--sc-font-size-lg, 18px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
    }

    .detail-cve {
      font-family: monospace;
      color: var(--sc-primary, #3b82f6);
    }

    .ai-recommendation {
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

    .remediation-steps {
      margin-top: var(--sc-spacing-sm, 8px);
      padding-left: var(--sc-spacing-md, 16px);
    }

    .remediation-steps li {
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #64748b);
      margin-bottom: var(--sc-spacing-xs, 4px);
    }

    /* AI助手侧边栏 */
    .ai-sidebar {
      position: sticky;
      top: 0;
      height: calc(100vh - var(--sc-spacing-lg, 20px) * 2);
      overflow: hidden;
    }

    /* Toasts */
    .toast {
      position: fixed;
      top: 12px;
      right: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      color: white;
      z-index: 9999;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    }
    .toast.success { background-color: #16a34a; }
    .toast.error { background-color: #ef4444; }
    .toast.info { background-color: #3b82f6; }
  `;

  // ============ 生命周期 ============

  constructor() {
    super();
    this.loadVulnerabilitiesData();
  }

  private async loadVulnerabilitiesData() {
    this.loading = true;
    
    try {
      await this.loadVulnerabilities();
      await this.loadScanTasks();
      await this.loadAIInsights();
      await this.loadVulnerabilityStats();
      await this.loadVulnEnums();
    } catch (error) {
      console.error('Failed to load vulnerabilities data:', error);
    } finally {
      this.loading = false;
    }
  }

  private async loadVulnerabilityStats() {
    try {
      const stats = await dataService.getVulnerabilityStats();
      this.vulnStats = stats;
    } catch (error) {
      console.error('Failed to load vulnerability stats:', error);
    }
  }

  private async loadVulnerabilities() {
    try {
      const params: VulnerabilityQueryParams = {};
      if (this.severityFilter !== 'all') {
        params.severity = this.severityFilter;
      }
      if (this.statusFilter !== 'all') {
        params.status = this.statusFilter;
      }
      if (this.searchQuery) {
        params.cveId = this.searchQuery;
      }

      const realVulns = await dataService.getVulnerabilities(params);
      
      if (realVulns.length > 0) {
        this.vulnerabilities = realVulns.map(v => ({
          id: v.id,
          cve: v.info.cveId,
          title: v.info.title,
          description: v.info.description,
          severity: v.info.cvss.severity as VulnerabilitySeverity,
          cvssScore: v.info.cvss.score,
          epssScore: 0,
          status: v.remediation.status === 'resolved' ? 'fixed' : 
                  v.remediation.status === 'in_progress' ? 'in-progress' :
                  v.remediation.status as VulnerabilityStatus,
          asset: v.affectedAssets[0] ? {
            id: v.affectedAssets[0].assetId,
            name: v.affectedAssets[0].componentName,
            type: 'server' as AssetType,
            criticality: 'high'
          } : { id: '', name: 'Unknown', type: 'server' as AssetType, criticality: 'medium' },
          discoveredAt: new Date(v.createdAt),
          dueDate: v.remediation.dueDate ? new Date(v.remediation.dueDate) : undefined,
          assignee: v.remediation.assignedTo,
          fixAvailable: v.remediation.fixAvailable,
          exploitAvailable: v.info.exploitInWild,
          tags: v.info.cwe,
          aiPriority: v.risk.totalRiskScore,
          aiRecommendation: v.remediation.fixSteps[0] || '',
          remediationSteps: v.remediation.fixSteps,
        }));
        this.filteredVulns = this.vulnerabilities;
        return;
      }
    } catch (error) {
      console.error('Failed to load vulnerabilities from API:', error);
    }
    
    // Fallback to mock data
    this.vulnerabilities = [
      {
        id: 'vuln-1',
        cve: 'CVE-2024-21762',
        title: 'FortiOS SSL-VPN 远程代码执行漏洞',
        description: 'FortiOS SSL-VPN存在越界写入漏洞，允许远程未认证攻击者执行任意代码',
        severity: 'critical',
        cvssScore: 9.8,
        epssScore: 0.97,
        status: 'open',
        asset: { id: 'fw-01', name: 'FW-Primary', type: 'network', criticality: 'critical' },
        discoveredAt: new Date('2024-02-08'),
        dueDate: new Date('2024-02-15'),
        assignee: '李运维',
        fixAvailable: true,
        exploitAvailable: true,
        tags: ['rce', 'vpn', 'fortinet'],
        aiPriority: 98,
        aiRecommendation: '该漏洞存在公开利用代码且影响核心网络设备，建议立即修补',
        remediationSteps: [
          '升级FortiOS至7.4.2或更高版本',
          '如无法立即升级，禁用SSL-VPN功能',
          '检查是否有异常登录行为'
        ]
      },
      {
        id: 'vuln-2',
        cve: 'CVE-2024-1709',
        title: 'ConnectWise ScreenConnect 认证绕过漏洞',
        description: 'ScreenConnect存在认证绕过漏洞，允许攻击者创建管理员账户',
        severity: 'critical',
        cvssScore: 10.0,
        epssScore: 0.95,
        status: 'in-progress',
        asset: { id: 'srv-rdp-01', name: 'Remote Access Server', type: 'server', criticality: 'high' },
        discoveredAt: new Date('2024-02-19'),
        dueDate: new Date('2024-02-22'),
        assignee: '张安全',
        fixAvailable: true,
        exploitAvailable: true,
        tags: ['auth-bypass', 'remote-access'],
        aiPriority: 95,
        aiRecommendation: '已检测到针对此漏洞的攻击活动，修复正在进行中'
      },
      {
        id: 'vuln-3',
        cve: 'CVE-2023-44487',
        title: 'HTTP/2 快速重置攻击',
        description: 'HTTP/2协议存在DoS漏洞，可导致服务器资源耗尽',
        severity: 'high',
        cvssScore: 7.5,
        epssScore: 0.85,
        status: 'fixed',
        asset: { id: 'web-01', name: 'Web Server Primary', type: 'server', criticality: 'high' },
        discoveredAt: new Date('2023-10-10'),
        assignee: '王运维',
        fixAvailable: true,
        exploitAvailable: true,
        tags: ['dos', 'http2'],
        aiPriority: 75
      },
      {
        id: 'vuln-4',
        cve: 'CVE-2023-38545',
        title: 'curl SOCKS5 堆缓冲区溢出',
        description: 'curl库在处理SOCKS5代理时存在堆缓冲区溢出漏洞',
        severity: 'critical',
        cvssScore: 9.8,
        epssScore: 0.72,
        status: 'open',
        asset: { id: 'ws-001', name: 'Workstation-001', type: 'workstation', criticality: 'low' },
        discoveredAt: new Date('2023-10-11'),
        dueDate: new Date('2024-03-15'),
        fixAvailable: true,
        exploitAvailable: false,
        tags: ['curl', 'buffer-overflow'],
        aiPriority: 65,
        aiRecommendation: '虽然CVSS评分高，但该工作站不使用SOCKS5代理，可降低优先级'
      },
      {
        id: 'vuln-5',
        cve: 'CVE-2024-0204',
        title: 'GoAnywhere MFT 管理员账户创建漏洞',
        description: 'GoAnywhere MFT存在未认证管理员账户创建漏洞',
        severity: 'critical',
        cvssScore: 9.8,
        status: 'accepted',
        asset: { id: 'mft-01', name: 'File Transfer Server', type: 'server', criticality: 'medium' },
        discoveredAt: new Date('2024-01-10'),
        assignee: '李运维',
        fixAvailable: true,
        exploitAvailable: true,
        tags: ['auth-bypass', 'file-transfer'],
        aiPriority: 60,
        aiRecommendation: '服务器已隔离在内网，风险可控，计划下月维护窗口修复'
      },
      {
        id: 'vuln-6',
        cve: 'CVE-2023-46604',
        title: 'Apache ActiveMQ RCE',
        description: 'Apache ActiveMQ存在反序列化远程代码执行漏洞',
        severity: 'critical',
        cvssScore: 10.0,
        epssScore: 0.92,
        status: 'fixed',
        asset: { id: 'mq-01', name: 'Message Queue Server', type: 'server', criticality: 'high' },
        discoveredAt: new Date('2023-10-27'),
        assignee: '张安全',
        fixAvailable: true,
        exploitAvailable: true,
        tags: ['rce', 'activemq', 'deserialization'],
        aiPriority: 90
      }
    ];

    this.applyFilters();
  }

  private async loadScanTasks() {
    this.scanTasks = [
      { id: 'scan-1', name: '全网漏洞扫描', type: 'network', status: 'running', target: '10.0.0.0/8', findings: 156, lastRun: new Date() },
      { id: 'scan-2', name: 'Web应用扫描', type: 'web', status: 'completed', target: '*.company.com', findings: 23, lastRun: new Date(Date.now() - 3600000) },
      { id: 'scan-3', name: '数据库安全扫描', type: 'database', status: 'scheduled', target: 'DB-Production', nextRun: new Date(Date.now() + 86400000), findings: 0 },
      { id: 'scan-4', name: '容器镜像扫描', type: 'container', status: 'completed', target: 'registry.company.com', findings: 45, lastRun: new Date(Date.now() - 7200000) }
    ];
  }

  private async loadAIInsights() {
    try {
      this.insights = await aiService.generateInsights({
        pageId: 'vulnerabilities',
        data: { vulnerabilities: this.vulnerabilities },
        userRole: 'analyst',
      });

      this.recommendations = await aiService.generateRecommendations({
        pageId: 'vulnerabilities',
        data: { vulnerabilities: this.vulnerabilities, insights: this.insights },
        userRole: 'analyst',
      });

      const prediction = await aiService.predictTrend({
        metric: 'open-vulns',
        historicalData: this.vulnerabilities.slice(0, 30).map((v, i) => ({
          date: new Date(Date.now() - (30 - i) * 86400000),
          value: v.cvssScore || 0,
        })),
        timeframe: '30d',
      });
      this.predictions = prediction ? [prediction] : [];
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    }
  }

  // ============ 事件处理 ============

  private handleSeverityFilter(severity: VulnerabilitySeverity | 'all') {
    this.severityFilter = severity;
    this.applyFilters();
  }

  private handleStatusFilter(status: VulnerabilityStatus | 'all') {
    this.statusFilter = status;
    this.applyFilters();
  }

  private handleSearch(e: Event) {
    this.searchQuery = (e.target as HTMLInputElement).value;
    this.applyFilters();
  }

  private handleSort(e: Event) {
    this.sortBy = (e.target as HTMLSelectElement).value as typeof this.sortBy;
    this.applyFilters();
  }

  private applyFilters() {
    let filtered = [...this.vulnerabilities];

    if (this.severityFilter !== 'all') {
      filtered = filtered.filter(v => v.severity === this.severityFilter);
    }

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === this.statusFilter);
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.cve.toLowerCase().includes(query) ||
        v.title.toLowerCase().includes(query) ||
        v.asset.name.toLowerCase().includes(query)
      );
    }

    // 排序
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'severity':
          const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        case 'cvss':
          return b.cvssScore - a.cvssScore;
        case 'aiPriority':
          return (b.aiPriority || 0) - (a.aiPriority || 0);
        case 'discoveredAt':
          return b.discoveredAt.getTime() - a.discoveredAt.getTime();
        default:
          return 0;
      }
    });

    this.filteredVulns = filtered;
  }

  private handleVulnClick(vuln: Vulnerability) {
    this.selectedVuln = this.selectedVuln?.id === vuln.id ? null : vuln;
  }

  private getCVSSClass(score: number): string {
    if (score >= 9.0) return 'critical';
    if (score >= 7.0) return 'high';
    if (score >= 4.0) return 'medium';
    return 'low';
  }

  private getPriorityClass(priority: number): string {
    if (priority >= 80) return 'high';
    if (priority >= 50) return 'medium';
    return 'low';
  }

  // ======== State machine actions for vulnerabilities ========
  private getNextStatuses(status: VulnerabilityStatus): VulnerabilityStatus[] {
    switch (status) {
      case 'open':
        return ['in-progress', 'accepted'];
      case 'in-progress':
        return ['fixed', 'open', 'accepted'];
      case 'fixed':
        return ['open', 'accepted'];
      case 'accepted':
        return ['open'];
      default:
        return [];
    }
  }

  private async updateVulnerabilityStatus(id: string, status: string) {
    try {
      await gatewayClient.request('vulnerabilities.updateStatus', { id, status, user: 'current-user' });
      this.showToast('漏洞状态已更新', 'success');
      await this.loadVulnerabilities();
    } catch (e) {
      console.error(e);
      this.showToast('更新状态失败', 'error');
    }
  }

  private async assignVulnerability(id: string, assignedTo: string) {
    try {
      await gatewayClient.request('vulnerabilities.assign', { id, assignedTo, user: 'current-user' });
      this.showToast(`分配给 ${assignedTo} 成功`, 'success');
      await this.loadVulnerabilities();
    } catch (e) {
      console.error(e);
      this.showToast('分配失败', 'error');
    }
  }

  private async createVulnerability() {
    const cve = prompt('CVE编号:');
    if (!cve) return;
    const title = prompt('漏洞标题:') || cve;
    const severity = prompt('严重程度 (critical/high/medium/low):', 'medium') || 'medium';
    try {
      await gatewayClient.request('vulnerabilities.create', { cve, title, severity, cvssScore: 0, description: '' });
      this.showToast('漏洞已创建', 'success');
      await this.loadVulnerabilities();
    } catch (e) { console.error('[vuln] Create failed:', e); this.showToast('创建失败', 'error'); }
  }

  private async deleteVulnerability(vulnId: string) {
    if (!confirm('确定删除此漏洞？')) return;
    try {
      await gatewayClient.request('vulnerabilities.delete', { id: vulnId });
      this.showToast('漏洞已删除', 'success');
      await this.loadVulnerabilities();
    } catch (e) { console.error('[vuln] Delete failed:', e); this.showToast('删除失败', 'error'); }
  }

  private async batchImportVulns() {
    const json = prompt('请输入漏洞JSON数组:');
    if (!json) return;
    try {
      const vulns = JSON.parse(json);
      await gatewayClient.request('vulnerabilities.batchImport', { vulnerabilities: vulns });
      this.showToast('批量导入成功', 'success');
      await this.loadVulnerabilities();
    } catch (e) { console.error('[vuln] BatchImport failed:', e); this.showToast('批量导入失败', 'error'); }
  }

  private async linkAssetToVuln(vulnId: string) {
    const assetId = prompt('关联资产ID:');
    if (!assetId) return;
    try {
      await gatewayClient.request('vulnerabilities.linkAsset', { vulnId, assetId });
      this.showToast('资产已关联', 'success');
      await this.loadVulnerabilities();
    } catch (e) { console.error('[vuln] LinkAsset failed:', e); this.showToast('关联失败', 'error'); }
  }

  private async unlinkAssetFromVuln(vulnId: string, assetId: string) {
    try {
      await gatewayClient.request('vulnerabilities.unlinkAsset', { vulnId, assetId });
      this.showToast('资产已取消关联', 'success');
      await this.loadVulnerabilities();
    } catch (e) { console.error('[vuln] UnlinkAsset failed:', e); this.showToast('取消关联失败', 'error'); }
  }

  private async batchUpdateStatus() {
    const ids = prompt('请输入漏洞ID列表 (逗号分隔):');
    if (!ids) return;
    const status = prompt('目标状态 (open/in-progress/fixed/accepted/false-positive):');
    if (!status) return;
    try {
      await gatewayClient.request('vulnerabilities.batchUpdateStatus', {
        ids: ids.split(',').map(s => s.trim()),
        status,
        user: 'current-user',
      });
      this.showToast('批量更新状态成功', 'success');
      await this.loadVulnerabilities();
    } catch (e) {
      console.error('[vuln] BatchUpdateStatus failed:', e);
      this.showToast('批量更新失败', 'error');
    }
  }

  private async updateVuln(vulnId: string) {
    const title = prompt('新标题:');
    if (!title) return;
    const severity = prompt('严重程度:', 'medium') || 'medium';
    try {
      await gatewayClient.request('vulnerabilities.update', { id: vulnId, title, severity });
      this.showToast('漏洞已更新', 'success');
      await this.loadVulnerabilities();
    } catch (e) { console.error('[vuln] Update failed:', e); this.showToast('更新失败', 'error'); }
  }

  private async loadActiveVulns() {
    try {
      const res = await gatewayClient.request('vulnerabilities.active', {});
      const data = (res as any)?.data ?? res;
      if (Array.isArray(data) && data.length > 0) {
        this.vulnerabilities = data.map((v: any) => ({ ...v, id: v.id, cve: v.cveId ?? v.cve, title: v.title ?? v.name, severity: v.severity ?? 'medium', cvssScore: v.cvssScore ?? v.cvss ?? 0, status: v.status ?? 'open', asset: { id: v.assetId ?? '', name: v.assetName ?? '', type: v.assetType ?? 'server' } }));
      }
    } catch (e) { console.error('[vuln] LoadActive failed:', e); }
  }

  private async loadVulnEnums() {
    try {
      const res = await gatewayClient.request('vulnerabilities.enums', {});
      return (res as any)?.data ?? res;
    } catch { return null; }
  }

  private async findVulnsByAssetId(assetId: string) {
    try {
      const res = await gatewayClient.request('vulnerabilities.findByAssetId', { assetId });
      const data = (res as any)?.data ?? res;
      if (Array.isArray(data)) {
        this.vulnerabilities = [...data as any[]];
        this.applyFilters();
      }
    } catch (e) { console.error('[vuln] FindByAssetId failed:', e); }
  }

  private showToast(message: string, type: 'success'|'error'|'info' = 'info') {
    this.toastMessage = message;
    this.toastType = type;
    window.setTimeout(() => {
      this.toastMessage = '';
      this.requestUpdate();
    }, 3000);
  }

  private formatTypeBreakdown(): string {
    const map: Record<string, number> = {};
    for (const v of this.vulnerabilities) {
      const t = v.asset?.type ?? 'unknown';
      map[t] = (map[t] || 0) + 1;
    }
    return Object.entries(map).map(([k, v]) => `${k}:${v}`).join(', ');
  }

  // ============ 渲染方法 ============

  private renderStats() {
    const critical = this.vulnerabilities.filter(v => v.severity === 'critical' && v.status === 'open').length;
    const high = this.vulnerabilities.filter(v => v.severity === 'high' && v.status === 'open').length;
    const openTotal = this.vulnerabilities.filter(v => v.status === 'open').length;
    const fixed = this.vulnerabilities.filter(v => v.status === 'fixed').length;
    const exploited = this.vulnerabilities.filter(v => v.exploitAvailable && v.status === 'open').length;
    const typeBreakdown = this.formatTypeBreakdown();

    return html`
      <div class="stats-grid">
        <sc-smart-card
          title="严重漏洞"
          value="${this.vulnStats?.bySeverity?.critical ?? critical}"
          icon="🔴"
          status="error"
        ></sc-smart-card>
        <sc-smart-card
          title="高危漏洞"
          value="${this.vulnStats?.bySeverity?.high ?? high}"
          icon="🟠"
          trend="down"
          trendValue="-3"
          status="warning"
        ></sc-smart-card>
        <sc-smart-card
          title="待修复"
          value="${this.vulnStats?.total ?? openTotal}"
          icon="🐛"
          trend="up"
          trendValue="+5"
          status="warning"
          subtitle="${typeBreakdown}"
        ></sc-smart-card>
        <sc-smart-card
          title="已修复"
          value="${fixed}"
          icon="✅"
          trend="up"
          trendValue="+8"
          status="success"
        ></sc-smart-card>
        <sc-smart-card
          title="存在利用"
          value="${exploited}"
          icon="⚠️"
          status="error"
        ></sc-smart-card>
      </div>
    `;
  }

  private renderScanTasks() {
    return html`
      <div class="scan-section">
        <div class="section-header">
          <h3 class="section-title">🔬 扫描任务</h3>
          <sc-button variant="secondary" size="sm">+ 新建扫描</sc-button>
        </div>
        <div class="scan-grid">
          ${this.scanTasks.map(task => html`
            <div class="scan-card">
              <div class="scan-info">
                <div class="scan-name">${task.name}</div>
                <div class="scan-meta">
                  ${task.type.toUpperCase()} · ${task.target}
                  ${task.findings > 0 ? html`· ${task.findings} 发现` : ''}
                </div>
              </div>
              <div class="scan-status">
                <span class="status-dot ${task.status}"></span>
                <span class="status-label">${task.status}</span>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private renderVulnTable() {
    return html`
      <div class="vuln-section">
        <div class="section-header">
          <h3 class="section-title">🐛 漏洞列表</h3>
        </div>

        <div class="filter-bar">
          <div class="filter-group">
            <button 
              class="filter-chip ${this.severityFilter === 'all' ? 'active' : ''}"
              @click=${() => this.handleSeverityFilter('all')}
            >全部</button>
            <button 
              class="filter-chip ${this.severityFilter === 'critical' ? 'active' : ''}"
              @click=${() => this.handleSeverityFilter('critical')}
            >严重</button>
            <button 
              class="filter-chip ${this.severityFilter === 'high' ? 'active' : ''}"
              @click=${() => this.handleSeverityFilter('high')}
            >高危</button>
            <button 
              class="filter-chip ${this.severityFilter === 'medium' ? 'active' : ''}"
              @click=${() => this.handleSeverityFilter('medium')}
            >中危</button>
          </div>

          <div class="filter-group">
            <button 
              class="filter-chip ${this.statusFilter === 'all' ? 'active' : ''}"
              @click=${() => this.handleStatusFilter('all')}
            >全部状态</button>
            <button 
              class="filter-chip ${this.statusFilter === 'open' ? 'active' : ''}"
              @click=${() => this.handleStatusFilter('open')}
            >待修复</button>
            <button 
              class="filter-chip ${this.statusFilter === 'in-progress' ? 'active' : ''}"
              @click=${() => this.handleStatusFilter('in-progress')}
            >进行中</button>
          </div>

          <input 
            type="text" 
            class="search-input" 
            placeholder="搜索CVE、标题或资产..."
            .value=${this.searchQuery}
            @input=${this.handleSearch}
          />

          <select class="sort-select" @change=${this.handleSort}>
            <option value="aiPriority" ?selected=${this.sortBy === 'aiPriority'}>AI优先级</option>
            <option value="severity" ?selected=${this.sortBy === 'severity'}>严重程度</option>
            <option value="cvss" ?selected=${this.sortBy === 'cvss'}>CVSS评分</option>
            <option value="discoveredAt" ?selected=${this.sortBy === 'discoveredAt'}>发现时间</option>
          </select>
        </div>

        <table class="vuln-table">
          <thead>
            <tr>
              <th>CVE</th>
              <th>漏洞</th>
              <th>CVSS</th>
              <th>AI优先级</th>
              <th>资产</th>
              <th>状态</th>
              <th>行动</th>
              <th>分配</th>
              <th>利用</th>
            </tr>
          </thead>
          <tbody>
            ${this.filteredVulns.map(vuln => html`
              <tr 
                class="${this.selectedVuln?.id === vuln.id ? 'selected' : ''}"
                @click=${() => this.handleVulnClick(vuln)}
              >
                <td>
                  <a href="https://nvd.nist.gov/vuln/detail/${vuln.cve}" class="cve-link" target="_blank">
                    ${vuln.cve}
                  </a>
                </td>
                <td>
                  <div style="font-size: 14px; color: var(--sc-text-primary);">${vuln.title}</div>
                  <div style="font-size: 12px; color: var(--sc-text-tertiary);">
                    ${vuln.tags.slice(0, 2).join(', ')}
                  </div>
                </td>
                <td>
                  <span class="cvss-score ${this.getCVSSClass(vuln.cvssScore)}">${vuln.cvssScore.toFixed(1)}</span>
                </td>
                <td>
                  <div class="ai-priority">
                    <span>${vuln.aiPriority || '-'}</span>
                    ${vuln.aiPriority ? html`
                      <div class="priority-bar">
                        <div class="priority-fill ${this.getPriorityClass(vuln.aiPriority)}" style="width: ${vuln.aiPriority}%"></div>
                      </div>
                    ` : ''}
                  </div>
                </td>
                <td>
                  <div style="font-size: 14px;">${vuln.asset.name}</div>
                  <div style="font-size: 12px; color: var(--sc-text-tertiary);">${vuln.asset.type}</div>
                </td>
                <td>
                  <span class="status-badge ${vuln.status}">${vuln.status}</span>
                </td>
                <td>
                  ${this.getNextStatuses(vuln.status).length > 0
                    ? html`${this.getNextStatuses(vuln.status).map(ns => html`<sc-button variant="secondary" size="sm" @click=${() => this.updateVulnerabilityStatus(vuln.id, ns)}>${ns}</sc-button>`)}
                    ` : html`-`
                  }
                </td>
                <td>
                  <select @change=${(e: Event) => this.assignVulnerability(vuln.id, (e.target as HTMLSelectElement).value)}>
                    <option value="">Unassigned</option>
                    <option value="张安全">张安全</option>
                    <option value="李运维">李运维</option>
                    <option value="王运维">王运维</option>
                    <option value="赵网络">赵网络</option>
                  </select>
                </td>
                <td>
                  ${vuln.exploitAvailable ? html`
                    <span class="exploit-indicator">⚡ 已知利用</span>
                  ` : '-'}
                </td>
              </tr>
              `)}
          </tbody>
        </table>

        ${this.selectedVuln ? this.renderVulnDetail() : ''}
      </div>
    `;
  }

  private renderVulnDetail() {
    if (!this.selectedVuln) return html``;

    const vuln = this.selectedVuln;

    return html`
      <div class="vuln-detail">
        <div class="detail-header">
          <div>
            <div class="detail-cve">${vuln.cve}</div>
            <div class="detail-title">${vuln.title}</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <span class="severity-badge ${vuln.severity}">${vuln.severity}</span>
            <span class="cvss-score ${this.getCVSSClass(vuln.cvssScore)}">${vuln.cvssScore.toFixed(1)}</span>
          </div>
        </div>

        <p style="font-size: 14px; color: var(--sc-text-secondary); margin-bottom: 16px;">
          ${vuln.description}
        </p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 14px;">
          <div>
            <strong>资产:</strong> ${vuln.asset.name} (${vuln.asset.type})
          </div>
          <div>
            <strong>发现时间:</strong> ${vuln.discoveredAt.toLocaleDateString()}
          </div>
          <div>
            <strong>负责人:</strong> ${vuln.assignee || '未分配'}
          </div>
          <div>
            <strong>修复截止:</strong> ${vuln.dueDate?.toLocaleDateString() || '未设置'}
          </div>
        </div>

        ${vuln.aiRecommendation ? html`
          <div class="ai-recommendation">
            <div class="ai-title">🤖 AI分析建议</div>
            <p style="font-size: 14px; color: var(--sc-text-secondary);">${vuln.aiRecommendation}</p>
            ${vuln.remediationSteps ? html`
              <ol class="remediation-steps">
                ${vuln.remediationSteps.map(step => html`<li>${step}</li>`)}
              </ol>
            ` : ''}
          </div>
        ` : ''}

        <div style="margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap;">
          <sc-button variant="secondary" size="sm" @click=${() => this.updateVuln(vuln.id)}>✏️ 编辑</sc-button>
          <sc-button variant="secondary" size="sm" @click=${() => this.linkAssetToVuln(vuln.id)}>🔗 关联资产</sc-button>
          <sc-button variant="secondary" size="sm" @click=${() => this.unlinkAssetFromVuln(vuln.id, vuln.asset.id)}>✂️ 取消关联</sc-button>
          <sc-button variant="danger" size="sm" @click=${() => this.deleteVulnerability(vuln.id)}>🗑️ 删除</sc-button>
        </div>
      </div>
    `;
  }

  private renderRolePerspective() {
    const currentRole = roleContext.getState().currentRole || 'security-expert';
    return html`
      <div style="margin-top: var(--sc-spacing-lg, 20px);">
        <sc-role-perspective
          dataType="vulnerabilities"
          .data=${{
            vulnerabilities: this.vulnerabilities,
            scanTasks: this.scanTasks
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
      ${this.toastMessage ? html`<div class="toast ${this.toastType}">${this.toastMessage}</div>` : ''}
      <sc-smart-recommendation-bar></sc-smart-recommendation-bar>
      <div class="vulns-container">
        <div class="main-content">
          ${this.toastMessage ? html`
            <div style="padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:14px;background:${this.toastType === 'success' ? 'var(--sc-success-bg, #d4edda)' : this.toastType === 'error' ? 'var(--sc-error-bg, #f8d7da)' : 'var(--sc-info-bg, #d1ecf1)'};color:${this.toastType === 'success' ? '#155724' : this.toastType === 'error' ? '#721c24' : '#0c5460'};">
              ${this.toastType === 'success' ? '✅' : this.toastType === 'error' ? '❌' : 'ℹ️'} ${this.toastMessage}
            </div>
          ` : ''}

          <div class="page-header">
            <div class="page-title-section">
              <h1 class="page-title">
                <span>🐛</span>
                ${this.i18n.t('nav.vulnerabilities') || '漏洞管理'}
              </h1>
              <div class="page-description">
                <span>发现和跟踪系统漏洞，按优先级修复，降低被攻击风险</span>
              </div>
            </div>
        <div class="header-actions">
          <sc-button size="sm" variant="secondary" @click=${this.batchImportVulns}>📥 批量导入</sc-button>
          <sc-button size="sm" variant="secondary" @click=${this.createVulnerability}>➯ 新建漏洞</sc-button>
          <sc-button size="sm" variant="secondary" @click=${() => this.loadActiveVulns()}>🔴 活跃漏洞</sc-button>
          <sc-button size="sm" variant="secondary" @click=${() => { const aid = prompt('资产ID:'); if (aid) this.findVulnsByAssetId(aid); }}>🔍 按资产搜索</sc-button>
          <sc-button size="sm" variant="secondary" @click=${this.batchUpdateStatus}>🔄 批量更新</sc-button>
          <sc-button size="sm" variant="secondary">📤 导出报告</sc-button>
          <sc-button size="sm" variant="primary" @click=${this.createVulnerability}>+ 开始扫描</sc-button>
            </div>
          </div>

          ${this.renderStats()}
          ${this.renderScanTasks()}
          ${this.renderVulnTable()}
          ${this.renderRolePerspective()}

          ${this.recommendations.length > 0 ? html`
            <div class="scan-section" style="margin-top:20px;">
              <div class="section-header">
                <h3 class="section-title">💡 AI修复建议</h3>
              </div>
              ${this.recommendations.slice(0, 5).map(rec => html`
                <div style="padding:12px;border:1px solid var(--sc-border-color, #e0e0e0);border-radius:8px;margin-bottom:8px;">
                  <div style="font-size:14px;font-weight:600;">${rec.impact === 'high' ? '🔴' : rec.impact === 'medium' ? '🟡' : '🟢'} ${rec.title}</div>
                  <div style="font-size:13px;color:var(--sc-text-secondary);margin-top:4px;">${rec.description}</div>
                </div>
              `)}
            </div>
          ` : ''}

          ${this.predictions.length > 0 ? html`
            <div class="scan-section" style="margin-top:20px;">
              <div class="section-header">
                <h3 class="section-title">📈 趋势预测</h3>
              </div>
              <div style="display:flex;gap:12px;flex-wrap:wrap;">
                ${this.predictions.slice(0, 4).map(pred => html`
                  <div style="padding:12px;border:1px solid var(--sc-border-color, #e0e0e0);border-radius:8px;min-width:160px;">
                    <div style="font-size:12px;color:var(--sc-text-secondary);">${pred.metric || '指标'}</div>
                    <div style="font-size:20px;font-weight:700;margin-top:4px;">${pred.predictedValue ?? '-'}</div>
                    <div style="font-size:12px;margin-top:4px;">${pred.trend === 'increasing' ? '📈' : pred.trend === 'decreasing' ? '📉' : '➡️'} 置信度: ${(pred.confidence ?? 0).toFixed(0)}%</div>
                  </div>
                `)}
              </div>
            </div>
          ` : ''}
        </div>

        <div class="ai-sidebar">
          <sc-ai-assistant
            pageId="vulnerabilities"
            pageTitle="漏洞管理"
            .pageData=${{
              vulnerabilities: this.vulnerabilities,
              selectedVuln: this.selectedVuln,
              scanTasks: this.scanTasks
            }}
            userRole="security-expert"
          ></sc-ai-assistant>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-vulnerabilities-page': ScVulnerabilitiesPage;
  }
}

/**
 * SecuClaw Security Incidents Page - 安全事件页面
 * 
 * 事件看板、事件详情、响应工作流、SLA追踪、证据链
 * AI能力: 事件关联分析、响应建议
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { aiService, type SmartInsight, type AIRecommendation } from '../ai-service.js';
import { dataService, type SecurityIncident, type IncidentQueryParams } from '../data-service.js';
import '../components/sc-ai-assistant.js';
import '../components/sc-smart-card.js';

// ============ 类型定义 ============

type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
type IncidentStatus = 'new' | 'confirmed' | 'containment' | 'eradication' | 'recovery' | 'closed';
type IncidentCategory = 'malware' | 'phishing' | 'intrusion' | 'data-breach' | 'ddos' | 'insider' | 'other';

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  category: IncidentCategory;
  assignee?: string;
  affectedAssets: string[];
  timeline: TimelineEvent[];
  sla: {
    responseDue: Date;
    resolutionDue: Date;
    responseTime?: number;
    resolutionTime?: number;
  };
  evidence: Evidence[];
  relatedIncidents: string[];
  aiCorrelation?: string;
  aiRecommendendActions?: string[];
}

interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'detection' | 'confirmation' | 'action' | 'escalation' | 'resolution' | 'note';
  description: string;
  actor: string;
}

interface Evidence {
  id: string;
  type: 'log' | 'screenshot' | 'file' | 'network-capture' | 'memory-dump';
  name: string;
  size: string;
  collectedAt: Date;
  collectedBy: string;
}

// ============ 页面组件 ============

@customElement('sc-incidents-page')
export class ScIncidentsPage extends LitElement {
  // ============ 状态 ============

  private i18n = new I18nController(this);

  @state()
  private loading = true;

  @state()
  private incidents: Incident[] = [];

  // Real data from API
  @state()
  private realIncidents: SecurityIncident[] = [];

  @state()
  private selectedIncident: Incident | null = null;

  @state()
  private insights: SmartInsight[] = [];

  @state()
  private recommendations: AIRecommendation[] = [];

  @state()
  private filterStatus: IncidentStatus | 'all' = 'all';

  @state()
  private viewMode: 'kanban' | 'list' = 'kanban';

  // Toast notification state
  @state()
  private toastMessage: string | null = null;

  @state()
  private toastType: 'success' | 'error' | 'info' = 'info';

  // ============ 样式 ============

  static styles = css`
    :host {
      display: block;
    }

    .incidents-container {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: var(--sc-spacing-lg, 20px);
      height: 100%;
    }

    @media (max-width: 1200px) {
      .incidents-container {
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

    .btn-icon {
      padding: var(--sc-spacing-sm, 8px);
      background: transparent;
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-md, 8px);
      cursor: pointer;
    }

    .btn-icon.active {
      background-color: var(--sc-primary, #3b82f6);
      color: white;
      border-color: var(--sc-primary, #3b82f6);
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

    /* 看板视图 */
    .kanban-board {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: var(--sc-spacing-md, 16px);
      min-height: 400px;
    }

    @media (max-width: 1400px) {
      .kanban-board {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 900px) {
      .kanban-board {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .kanban-column {
      background-color: var(--sc-bg-secondary, #f8fafc);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-md, 16px);
      display: flex;
      flex-direction: column;
    }

    .kanban-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-md, 16px);
      padding-bottom: var(--sc-spacing-sm, 8px);
      border-bottom: 2px solid var(--sc-border-color, #e2e8f0);
    }

    .kanban-title {
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs, 4px);
    }

    .kanban-count {
      background-color: var(--sc-bg-tertiary, #f1f5f9);
      padding: 2px 8px;
      border-radius: var(--sc-radius-full, 999px);
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
    }

    .kanban-cards {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-sm, 8px);
      overflow-y: auto;
    }

    .incident-card {
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-md, 8px);
      padding: var(--sc-spacing-md, 16px);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .incident-card:hover {
      border-color: var(--sc-primary, #3b82f6);
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
    }

    .incident-card.selected {
      border-color: var(--sc-primary, #3b82f6);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .incident-card.critical { border-left: 4px solid var(--sc-danger, #ef4444); }
    .incident-card.high { border-left: 4px solid var(--sc-warning, #f59e0b); }
    .incident-card.medium { border-left: 4px solid var(--sc-primary, #3b82f6); }
    .incident-card.low { border-left: 4px solid var(--sc-success, #22c55e); }

    .incident-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--sc-spacing-xs, 4px);
    }

    .incident-title {
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      color: var(--sc-text-primary, #1e293b);
      flex: 1;
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

    .incident-meta {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
    }

    .sla-warning {
      color: var(--sc-danger, #ef4444);
      font-weight: 500;
    }

    .incident-assignee {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs, 4px);
      margin-top: var(--sc-spacing-sm, 8px);
    }

    .assignee-avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: var(--sc-primary, #3b82f6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 600;
    }

    /* 事件详情面板 */
    .detail-panel {
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--sc-spacing-lg, 20px);
      padding-bottom: var(--sc-spacing-md, 16px);
      border-bottom: 1px solid var(--sc-border-color, #e2e8f0);
    }

    .detail-title {
      font-size: var(--sc-font-size-lg, 18px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
    }

    .detail-actions {
      display: flex;
      gap: var(--sc-spacing-sm, 8px);
    }

    .section-header {
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
      margin-bottom: var(--sc-spacing-sm, 8px);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs, 4px);
    }

    /* 时间线 */
    .timeline {
      position: relative;
      padding-left: 24px;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 8px;
      top: 0;
      bottom: 0;
      width: 2px;
      background-color: var(--sc-border-color, #e2e8f0);
    }

    .timeline-event {
      position: relative;
      padding-bottom: var(--sc-spacing-md, 16px);
    }

    .timeline-event::before {
      content: '';
      position: absolute;
      left: -20px;
      top: 4px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: var(--sc-primary, #3b82f6);
      border: 2px solid var(--sc-bg-card, #ffffff);
    }

    .timeline-event.detection::before { background-color: var(--sc-warning, #f59e0b); }
    .timeline-event.confirmation::before { background-color: var(--sc-danger, #ef4444); }
    .timeline-event.action::before { background-color: var(--sc-primary, #3b82f6); }
    .timeline-event.resolution::before { background-color: var(--sc-success, #22c55e); }

    .event-time {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-tertiary, #94a3b8);
    }

    .event-description {
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-primary, #1e293b);
    }

    .event-actor {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
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
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #64748b);
    }

    .ai-actions {
      margin-top: var(--sc-spacing-sm, 8px);
    }

    .ai-action-item {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
      padding: var(--sc-spacing-xs, 4px) 0;
    }

    .action-checkbox {
      width: 16px;
      height: 16px;
    }

    /* 证据列表 */
    .evidence-list {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-xs, 4px);
    }

    .evidence-item {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
      padding: var(--sc-spacing-sm, 8px);
      background-color: var(--sc-bg-secondary, #f8fafc);
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-sm, 14px);
    }

    .evidence-icon {
      font-size: 16px;
    }

    .evidence-name {
      flex: 1;
      color: var(--sc-text-primary, #1e293b);
    }

    .evidence-size {
      color: var(--sc-text-tertiary, #94a3b8);
      font-size: var(--sc-font-size-xs, 12px);
    }

    /* AI助手侧边栏 */
    .ai-sidebar {
      position: sticky;
      top: 0;
      height: calc(100vh - var(--sc-spacing-lg, 20px) * 2);
      overflow: hidden;
    }
    /* Toast notifications */
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      z-index: 1000;
      cursor: pointer;
      transition: opacity 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .toast.success { background-color: #22c55e; }
    .toast.error { background-color: #ef4444; }
    .toast.info { background-color: #3b82f6; }
  `;

  // ============ 生命周期 ============

  constructor() {
    super();
    this.loadIncidentsData();
  }

  private async loadIncidentsData() {
    this.loading = true;
    
    try {
      await this.loadIncidents();
      await this.loadAIInsights();
    } catch (error) {
      console.error('Failed to load incidents data:', error);
    } finally {
      this.loading = false;
    }
  }

  private async loadIncidents() {
    // Try to load from API
    try {
      const params: IncidentQueryParams = {};
      if (this.filterStatus !== 'all') {
        params.status = this.filterStatus;
      }
      this.realIncidents = await dataService.getIncidents(params);
      
      // Convert to UI format
      if (this.realIncidents.length > 0) {
        this.incidents = this.realIncidents.map(inc => ({
          id: inc.ticketId,
          title: inc.info.title,
          description: inc.info.description,
          severity: this.mapSeverity(inc.info.severity),
          status: this.mapStatus(inc.workflow.status),
          category: inc.info.category as IncidentCategory,
          assignee: inc.workflow.assignee,
          affectedAssets: inc.impact.affectedAssets,
          timeline: inc.handlers.map((h, i) => ({
            id: `t${i}`,
            timestamp: new Date(h.joinedAt),
            type: 'action' as const,
            description: h.actions.join(', '),
            actor: h.user
          })),
          sla: {
            responseDue: inc.sla.responseDeadline ? new Date(inc.sla.responseDeadline) : new Date(),
            resolutionDue: inc.sla.resolutionDeadline ? new Date(inc.sla.resolutionDeadline) : new Date(),
            // responseTime and resolutionTime are optional in the UI model; omit if API doesn't provide them
          },
          evidence: [],
          relatedIncidents: []
        }));
        return;
      }
    } catch (error) {
      console.error('Failed to load incidents from API:', error);
    }
    
    // Fallback to mock data
    this.incidents = [
      {
        id: 'INC-001',
        title: '可疑登录活动 - APT组织钓鱼攻击',
        description: '检测到来自APT29组织的钓鱼邮件攻击，多个用户点击了恶意链接',
        severity: 'critical',
        status: 'containment',
        category: 'phishing',
        assignee: '张安全',
        affectedAssets: ['WS-001', 'WS-002', 'MAIL-SERVER'],
        timeline: [
          { id: 't1', timestamp: new Date('2024-03-08T09:30:00'), type: 'detection', description: 'SIEM检测到异常登录', actor: '系统' },
          { id: 't2', timestamp: new Date('2024-03-08T09:45:00'), type: 'confirmation', description: '确认为钓鱼攻击', actor: '张安全' },
          { id: 't3', timestamp: new Date('2024-03-08T10:00:00'), type: 'action', description: '隔离受影响工作站', actor: '李运维' },
          { id: 't4', timestamp: new Date('2024-03-08T10:15:00'), type: 'action', description: '重置受影响用户密码', actor: '张安全' }
        ],
        sla: {
          responseDue: new Date('2024-03-08T10:30:00'),
          resolutionDue: new Date('2024-03-09T09:30:00'),
          responseTime: 15
        },
        evidence: [
          { id: 'e1', type: 'log', name: 'auth-logs-20240308.log', size: '2.3MB', collectedAt: new Date(), collectedBy: '张安全' },
          { id: 'e2', type: 'screenshot', name: 'phishing-email.png', size: '156KB', collectedAt: new Date(), collectedBy: '张安全' }
        ],
        relatedIncidents: ['INC-002'],
        aiCorrelation: '该事件与上周的INC-002存在关联，攻击者使用相同的C2服务器IP。建议检查所有与该IP通信的资产。',
        aiRecommendendActions: [
          '扫描所有工作站是否存在相同恶意软件',
          '检查邮件网关是否有其他类似钓鱼邮件',
          '更新钓鱼邮件过滤规则',
          '通知所有用户警惕此类钓鱼攻击'
        ]
      },
      {
        id: 'INC-002',
        title: '勒索软件检测 - LockBit变种',
        description: '检测到LockBit勒索软件变种，已隔离受影响系统',
        severity: 'critical',
        status: 'eradication',
        category: 'malware',
        assignee: '李运维',
        affectedAssets: ['SRV-DB-01', 'SRV-FILE-02'],
        timeline: [
          { id: 't1', timestamp: new Date('2024-03-07T14:00:00'), type: 'detection', description: 'EDR检测到勒索软件行为', actor: '系统' },
          { id: 't2', timestamp: new Date('2024-03-07T14:10:00'), type: 'action', description: '自动隔离受影响服务器', actor: '系统' },
          { id: 't3', timestamp: new Date('2024-03-07T14:30:00'), type: 'confirmation', description: '确认为LockBit 3.0变种', actor: '李运维' }
        ],
        sla: {
          responseDue: new Date('2024-03-07T15:00:00'),
          resolutionDue: new Date('2024-03-08T14:00:00'),
          responseTime: 10
        },
        evidence: [
          { id: 'e1', type: 'file', name: 'malware-sample.exe', size: '1.2MB', collectedAt: new Date(), collectedBy: '李运维' },
          { id: 'e2', type: 'memory-dump', name: 'srv-db-01-mem.dmp', size: '4.5GB', collectedAt: new Date(), collectedBy: '李运维' }
        ],
        relatedIncidents: ['INC-001'],
        aiCorrelation: '勒索软件样本与威胁情报库中的LockBit 3.0匹配度98%。建议从离线备份恢复数据。'
      },
      {
        id: 'INC-003',
        title: '异常数据传输 - 潜在数据泄露',
        description: '检测到大量数据外传，已阻断并调查',
        severity: 'high',
        status: 'confirmed',
        category: 'data-breach',
        assignee: '王合规',
        affectedAssets: ['SRV-APP-01', 'DB-CUSTOMER'],
        timeline: [
          { id: 't1', timestamp: new Date('2024-03-08T02:00:00'), type: 'detection', description: 'DLP系统检测到异常数据传输', actor: '系统' },
          { id: 't2', timestamp: new Date('2024-03-08T08:00:00'), type: 'confirmation', description: '确认为潜在数据泄露', actor: '王合规' }
        ],
        sla: {
          responseDue: new Date('2024-03-08T06:00:00'),
          resolutionDue: new Date('2024-03-10T02:00:00')
        },
        evidence: [
          { id: 'e1', type: 'network-capture', name: 'traffic-capture.pcap', size: '890MB', collectedAt: new Date(), collectedBy: '系统' }
        ],
        relatedIncidents: [],
        aiCorrelation: '数据传输目标IP与已知APT组织C2服务器关联。建议检查是否涉及PII数据。'
      },
      {
        id: 'INC-004',
        title: 'DDoS攻击 - 网站服务中断',
        description: '检测到针对公司网站的DDoS攻击',
        severity: 'medium',
        status: 'recovery',
        category: 'ddos',
        assignee: '赵网络',
        affectedAssets: ['WEB-01', 'CDN'],
        timeline: [
          { id: 't1', timestamp: new Date('2024-03-06T16:00:00'), type: 'detection', description: '检测到流量异常', actor: '系统' },
          { id: 't2', timestamp: new Date('2024-03-06T16:05:00'), type: 'action', description: '启用CDN防护', actor: '赵网络' },
          { id: 't3', timestamp: new Date('2024-03-06T18:00:00'), type: 'resolution', description: '攻击流量已缓解', actor: '赵网络' }
        ],
        sla: {
          responseDue: new Date('2024-03-06T17:00:00'),
          resolutionDue: new Date('2024-03-07T16:00:00'),
          responseTime: 5
        },
        evidence: [],
        relatedIncidents: []
      },
      {
        id: 'INC-005',
        title: '新事件 - 待分析',
        description: '系统检测到可疑活动，等待安全团队确认',
        severity: 'low',
        status: 'new',
        category: 'other',
        affectedAssets: ['WS-003'],
        timeline: [
          { id: 't1', timestamp: new Date('2024-03-08T11:00:00'), type: 'detection', description: '检测到可疑进程', actor: '系统' }
        ],
        sla: {
          responseDue: new Date('2024-03-08T15:00:00'),
          resolutionDue: new Date('2024-03-10T11:00:00')
        },
        evidence: [],
        relatedIncidents: []
      }
    ];
  }

  private async loadAIInsights() {
    try {
      this.insights = await aiService.generateInsights({
        pageId: 'incidents',
        data: { incidents: this.incidents },
        userRole: 'security-expert'
      });

      this.recommendations = await aiService.generateRecommendations({
        pageId: 'incidents',
        data: { incidents: this.incidents, insights: this.insights },
        userRole: 'security-expert'
      });

  
      console.debug('[IncidentsPage] AI recommendations loaded, count:', this.recommendations.length);
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    }
  }

  // ============ 事件处理 ============

  private handleIncidentClick(incident: Incident) {
    this.selectedIncident = this.selectedIncident?.id === incident.id ? null : incident;
  }

  // Get valid next statuses for transitions
  private getValidNextStatuses(currentStatus: IncidentStatus): IncidentStatus[] {
    const transitions: Record<IncidentStatus, IncidentStatus[]> = {
      'new': ['confirmed'],
      'confirmed': ['containment'],
      'containment': ['eradication'],
      'eradication': ['recovery'],
      'recovery': ['closed'],
      'closed': []
    };
    return transitions[currentStatus] || [];
  }

  // Handle status update with optimistic UI update
  private async handleStatusUpdate(incident: Incident, targetStatus: IncidentStatus) {
    if (!targetStatus) return;
    const prevStatus = incident.status;
    // Optimistic update
    incident.status = targetStatus;
    this.incidents = [...this.incidents];
    this.selectedIncident = { ...incident };
    try {
      await dataService.updateIncidentStatus(incident.id, targetStatus);
      this.showToast(`状态已更新为 ${this.getStatusLabel(targetStatus)}`, 'success');
    } catch (error) {
      // Revert on failure
      incident.status = prevStatus;
      this.incidents = [...this.incidents];
      this.selectedIncident = { ...incident };
      this.showToast('状态更新失败', 'error');
    }
  }

  // Handle assignment with a prompt
  private async handleAssign(incident: Incident) {
    const assignee = prompt('请输入负责人姓名');
    if (!assignee) return;
    const prev = incident.assignee;
    // Optimistic update
    incident.assignee = assignee;
    this.incidents = [...this.incidents];
    this.selectedIncident = { ...incident };
    try {
      // Update via workflow to satisfy API contract
      await dataService.updateIncident(incident.id, { workflow: { assignee, status: incident.status } });
      this.showToast(`已分配给 ${assignee}`, 'success');
    } catch (error) {
      // Revert
      incident.assignee = prev;
      this.incidents = [...this.incidents];
      this.selectedIncident = { ...incident };
      this.showToast('分配失败', 'error');
    }
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = null;
    }, 3000);
  }

  private getStatusLabel(status: IncidentStatus): string {
    const labels: Record<IncidentStatus, string> = {
      'new': '新建',
      'confirmed': '已确认',
      'containment': '遏制中',
      'eradication': '根除中',
      'recovery': '恢复中',
      'closed': '已关闭'
    };
    return labels[status];
  }

  private getStatusColor(status: IncidentStatus): string {
    const colors: Record<IncidentStatus, string> = {
      'new': '#64748b',
      'confirmed': '#ef4444',
      'containment': '#f59e0b',
      'eradication': '#3b82f6',
      'recovery': '#22c55e',
      'closed': '#94a3b8'
    };
    return colors[status];
  }

  private calculateSLARemaining(sla: Incident['sla']): string {
    const now = new Date();
    const due = sla.resolutionDue;
    const diff = due.getTime() - now.getTime();
    
    if (diff < 0) return '已超时';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }

  // ============ 渲染方法 ============

  private renderStats() {
    const newCount = this.incidents.filter(i => i.status === 'new').length;
    const activeCount = this.incidents.filter(i => ['confirmed', 'containment', 'eradication'].includes(i.status)).length;
    const criticalCount = this.incidents.filter(i => i.severity === 'critical').length;
    const avgResponseTime = this.incidents
      .filter(i => i.sla.responseTime)
      .reduce((sum, i) => sum + (i.sla.responseTime || 0), 0) / this.incidents.length || 0;

    return html`
      <div class="stats-grid">
        <sc-smart-card
          title="活跃事件"
          value="${activeCount}"
          icon="🚨"
          trend="down"
          trendValue="-2"
          status="warning"
        ></sc-smart-card>
        <sc-smart-card
          title="待处理"
          value="${newCount}"
          icon="📥"
          status="error"
        ></sc-smart-card>
        <sc-smart-card
          title="严重事件"
          value="${criticalCount}"
          icon="🔴"
          trend="stable"
          trendValue="0"
          status="error"
        ></sc-smart-card>
        <sc-smart-card
          title="平均响应"
          value="${avgResponseTime.toFixed(0)}min"
          icon="⏱️"
          subtitle="SLA达标率 92%"
          status="success"
        ></sc-smart-card>
      </div>
    `;
  }

  private renderKanban() {
    const statuses: IncidentStatus[] = ['new', 'confirmed', 'containment', 'eradication', 'recovery', 'closed'];
    
    return html`
      <div class="kanban-board">
        ${statuses.map(status => {
          const statusIncidents = this.incidents.filter(i => i.status === status);
          return html`
            <div class="kanban-column">
              <div class="kanban-header">
                <span class="kanban-title" style="color: ${this.getStatusColor(status)}">
                  ${this.getStatusLabel(status)}
                </span>
                <span class="kanban-count">${statusIncidents.length}</span>
              </div>
              <div class="kanban-cards">
                ${statusIncidents.map(incident => html`
                  <div 
                    class="incident-card ${incident.severity} ${this.selectedIncident?.id === incident.id ? 'selected' : ''}"
                    @click=${() => this.handleIncidentClick(incident)}
                  >
                    <div class="incident-header">
                      <span class="incident-title">${incident.title}</span>
                      <span class="severity-badge ${incident.severity}">${incident.severity}</span>
                    </div>
                    <div class="incident-meta">
                      <div>${incident.id}</div>
                      <div class="${incident.sla.resolutionDue < new Date() ? 'sla-warning' : ''}">
                        SLA: ${this.calculateSLARemaining(incident.sla)}
                      </div>
                    </div>
                    ${incident.assignee ? html`
                      <div class="incident-assignee">
                        <div class="assignee-avatar">${incident.assignee[0]}</div>
                        <span class="incident-meta">${incident.assignee}</span>
                      </div>
                    ` : ''}
                  </div>
                `)}
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }

  private renderDetailPanel() {
    if (!this.selectedIncident) return html``;

    const incident = this.selectedIncident;

    return html`
      <div class="detail-panel">
        <div class="detail-header">
          <div>
            <div class="detail-title">${incident.title}</div>
            <div class="incident-meta">${incident.id} · ${incident.category}</div>
          </div>
           <div class="detail-actions">
             <button class="btn btn-secondary" @click=${() => this.handleAssign(incident)}>分配</button>
             <select class="btn btn-primary" @change=${(e: Event) => this.handleStatusUpdate(incident, (e.target as HTMLSelectElement).value as IncidentStatus)}>
               <option value="" disabled selected>更新状态</option>
               ${this.getValidNextStatuses(incident.status).map(s => html`
                 <option value="${s}">${this.getStatusLabel(s)}</option>
               `)}
             </select>
           </div>
        </div>

        <div class="section-header">📝 描述</div>
        <p style="font-size: 14px; color: var(--sc-text-secondary); margin-bottom: 16px;">
          ${incident.description}
        </p>

        ${incident.aiCorrelation ? html`
          <div class="ai-section">
            <div class="ai-title">🤖 AI关联分析</div>
            <div class="ai-content">${incident.aiCorrelation}</div>
          </div>
        ` : ''}

        ${incident.aiRecommendendActions && incident.aiRecommendendActions.length > 0 ? html`
          <div class="ai-section">
            <div class="ai-title">💡 AI建议行动</div>
            <div class="ai-actions">
              ${incident.aiRecommendendActions.map((action, i) => html`
                <div class="ai-action-item">
                  <input type="checkbox" class="action-checkbox" id="action-${i}" />
                  <label for="action-${i}" style="font-size: 14px; color: var(--sc-text-secondary);">${action}</label>
                </div>
              `)}
            </div>
          </div>
        ` : ''}

        <div class="section-header" style="margin-top: 16px;">📅 时间线</div>
        <div class="timeline">
          ${incident.timeline.map(event => html`
            <div class="timeline-event ${event.type}">
              <div class="event-time">${event.timestamp.toLocaleString('zh-CN')}</div>
              <div class="event-description">${event.description}</div>
              <div class="event-actor">by ${event.actor}</div>
            </div>
          `)}
        </div>

        ${incident.evidence.length > 0 ? html`
          <div class="section-header" style="margin-top: 16px;">🔍 证据</div>
          <div class="evidence-list">
            ${incident.evidence.map(e => html`
              <div class="evidence-item">
                <span class="evidence-icon">${e.type === 'log' ? '📋' : e.type === 'screenshot' ? '🖼️' : e.type === 'file' ? '📁' : '💾'}</span>
                <span class="evidence-name">${e.name}</span>
                <span class="evidence-size">${e.size}</span>
              </div>
            `)}
          </div>
        ` : ''}

        <div class="section-header" style="margin-top: 16px;">🎯 受影响资产</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${incident.affectedAssets.map(asset => html`
            <span style="padding: 4px 8px; background: var(--sc-bg-secondary); border-radius: 4px; font-size: 12px;">${asset}</span>
          `)}
        </div>
      </div>
    `;
  }

  // ============ API Data Mapping ============

  private mapSeverity(sev: string): IncidentSeverity {
    const map: Record<string, IncidentSeverity> = {
      'P0': 'critical', 'P1': 'high', 'P2': 'medium', 'P3': 'low', 'P4': 'low'
    };
    return map[sev] || 'medium';
  }

  private mapStatus(status: string): IncidentStatus {
    const map: Record<string, IncidentStatus> = {
      'detected': 'new', 'reported': 'new', 'acknowledged': 'confirmed',
      'investigating': 'confirmed', 'containing': 'containment',
      'eradicating': 'eradication', 'recovering': 'recovery', 'closed': 'closed'
    };
    return map[status] || 'new';
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
      <div class="incidents-container">
        <div class="main-content">
          <div class="page-header">
            <div class="page-title-section">
              <h1 class="page-title">
                <span>🚨</span>
                ${this.i18n.t('nav.incidents') || '安全事件'}
              </h1>
              <!-- 一句话说明 -->
              <div class="page-description">
                <span>跟踪和管理所有安全事件的处理进度，快速响应减少损失</span>
              </div>
            </div>
            <div class="header-actions">
              <button class="btn-icon ${this.viewMode === 'kanban' ? 'active' : ''}" @click=${() => this.viewMode = 'kanban'}>📊</button>
              <button class="btn-icon ${this.viewMode === 'list' ? 'active' : ''}" @click=${() => this.viewMode = 'list'}>📋</button>
              <button class="btn btn-secondary">📤 导出</button>
              <button class="btn btn-primary">+ 创建事件</button>
            </div>
          </div>

          ${this.renderStats()}
          ${this.renderKanban()}
          ${this.renderDetailPanel()}
          ${this.toastMessage ? html`
            <div class="toast ${this.toastType}" @click=${() => this.toastMessage = null}>
              ${this.toastType === 'error' ? '❌' : this.toastType === 'success' ? '✅' : 'ℹ️'} ${this.toastMessage}
            </div>
          ` : ''}
        </div>

        <div class="ai-sidebar">
          <sc-ai-assistant
            pageId="incidents"
            pageTitle="安全事件"
            .pageData=${{
              incidents: this.incidents,
              selectedIncident: this.selectedIncident
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
    'sc-incidents-page': ScIncidentsPage;
  }
}

/**
 * SecuClaw War Room Page - 作战室页面
 * 
 * 实时安全运营指挥中心、事件协同、资源调度、决策支持
 * AI能力: 实时决策支持、协同建议
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { aiService, type SmartInsight, type AIRecommendation } from '../ai-service.js';
import { gatewayClient } from '../gateway-client.js';
import '../components/sc-ai-assistant.js';
import '../components/sc-smart-card.js';

// ============ 类型定义 ============

type IncidentPriority = 'p1' | 'p2' | 'p3' | 'p4';
type TeamMemberStatus = 'available' | 'busy'|'offline';

interface WarRoomIncident {
  id: string;
  title: string;
  priority: IncidentPriority;
  status: string;
  assignees: string[];
  updatedAt: Date;
  description: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: TeamMemberStatus;
  currentTask?: string;
  avatar: string;
}

interface Activity {
  id: string;
  type: 'comment' | 'action' | 'escalation' | 'resolution';
  user: string;
  message: string;
  timestamp: Date;
  incidentId?: string;
}

// ============ 页面组件 ============

@customElement('sc-war-room-page')
export class ScWarRoomPage extends LitElement {
  private i18n = new I18nController(this);

  @state() private loading = true;
  @state() private activeIncidents: WarRoomIncident[] = [];
  @state() private teamMembers: TeamMember[] = [];
  @state() private activities: Activity[] = [];
  @state() private _insights: SmartInsight[] = [];
  @state() private recommendations: AIRecommendation[] = [];
  @state() private selectedIncident: WarRoomIncident | null = null;
  @state() private _newComment = '';
  @state() private playbooks: any[] = [];
  @state() private playbookExecutions: any[] = [];
  @state() private executingPlaybookId: string | null = null;
  @state() private playbookResult: any = null;
  @state() private toastMessage: string = '';
  @state() private toastType: 'success' | 'error' | 'info' = 'info';

  private readonly fallbackPlaybooks = [
    { id: 'pb-incident-response', name: '安全事件自动响应', description: '自动隔离受影响资产并通知安全团队', status: 'enabled', triggerType: 'alarm' },
    { id: 'pb-ransomware', name: '勒索软件应急处置', description: '检测→隔离→取证→恢复→报告', status: 'enabled', triggerType: 'alarm' },
    { id: 'pb-ddos-mitigation', name: 'DDoS攻击缓解', description: '检测异常流量→自动启动流量清洗→CDN切换→恢复', status: 'enabled', triggerType: 'alarm' },
    { id: 'pb-vuln-auto-patch', name: '高危漏洞自动修补', description: '检测高危漏洞→测试补丁→部署补丁→验证', status: 'disabled', triggerType: 'cron' },
    { id: 'pb-compliance-scan', name: '合规自动检查', description: '定期扫描配置→对比合规框架→生成差距报告', status: 'enabled', triggerType: 'cron' },
  ];

  static get styles() {
    return css`
    :host { display: block; }
    .warroom-container{
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: var(--sc-spacing-lg, 20px);
      height: 100%;
    }
    @media (max-width: 1200px) {
      .warroom-container { grid-template-columns: 1fr; }
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
      align-items: flex-start;
    }
    .page-title-section {
      flex: 1;
    }
    .page-title{
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
      background-color: var(--sc-danger, #ef4444);
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
    /* 主内容区域 */
    .content-grid{
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--sc-spacing-lg, 20px);
    }
    @media (max-width: 1024px) {
      .content-grid { grid-template-columns: 1fr; }
    }
    /* 活跃事件 */
    .incidents-section{
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
    .incident-list{
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-sm, 8px);
    }
    .incident-item{
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
    .incident-item:hover{
      background-color: var(--sc-bg-tertiary, #f1f5f9);
    }
    .incident-item.selected{
      background-color: rgba(239, 68, 68, 0.05);
    }
    .incident-item.p1{ border-left-color: var(--sc-danger, #ef4444); }
    .incident-item.p2{ border-left-color: var(--sc-warning, #f59e0b); }
    .incident-item.p3{ border-left-color: var(--sc-primary, #3b82f6); }
    .incident-item.p4{ border-left-color: var(--sc-success, #22c55e); }
    .priority-badge{
      padding: 4px 8px;
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 700;
      color: white;
    }
    .priority-badge.p1{ background-color: var(--sc-danger, #ef4444); }
    .priority-badge.p2{ background-color: var(--sc-warning, #f59e0b); }
    .priority-badge.p3{ background-color: var(--sc-primary, #3b82f6); }
    .priority-badge.p4{ background-color: var(--sc-success, #22c55e); }
    .incident-info{
      flex: 1;
    }
    .incident-title{
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      color: var(--sc-text-primary, #1e293b);
    }
    .incident-meta{
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
      margin-top: 2px;
    }
    .incident-assignees{
      display: flex;
      gap: 4px;
    }
    .assignee-avatar{
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: var(--sc-primary, #3b82f6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 600;
    }
    /* 团队成员 */
    .team-section{
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }
    .team-list{
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-sm, 8px);
    }
    .team-item{
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
      padding: var(--sc-spacing-sm, 8px);
      border-radius: var(--sc-radius-md, 8px);
    }
    .team-item:hover{
      background-color: var(--sc-bg-secondary, #f8fafc);
    }
    .team-avatar{
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }
    .team-info{
      flex: 1;
    }
    .team-name{
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      color: var(--sc-text-primary, #1e293b);
    }
    .team-role{
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
    }
    .status-indicator{
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .status-indicator.available{ background-color: var(--sc-success, #22c55e); }
    .status-indicator.busy{ background-color: var(--sc-warning, #f59e0b); }
    .status-indicator.offline{ background-color: var(--sc-text-tertiary, #94a3b8); }
    /* 活动日志 */
    .activity-section{
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }
    .activity-list{
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-sm, 8px);
      max-height: 300px;
      overflow-y: auto;
    }
    .activity-item{
      display: flex;
      gap: var(--sc-spacing-sm, 8px);
      padding: var(--sc-spacing-sm, 8px);
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-sm, 14px);
    }
    .activity-item:hover{
      background-color: var(--sc-bg-secondary, #f8fafc);
    }
    .activity-icon{
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      flex-shrink: 0;
    }
    .activity-icon.comment{ background-color: rgba(59, 130, 246, 0.1); }
    .activity-icon.action{ background-color: rgba(34, 197, 94, 0.1); }
    .activity-icon.escalation{ background-color: rgba(239, 68, 68, 0.1); }
    .activity-icon.resolution{ background-color: rgba(34, 197, 94, 0.1); }
    .activity-content{
      flex: 1;
    }
    .activity-message{
      color: var(--sc-text-primary, #1e293b);
    }
    .activity-meta{
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-tertiary, #94a3b8);
      margin-top: 2px;
    }
    /* 快速操作 */
    .quick-actions{
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }
    .action-buttons{
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--sc-spacing-sm, 8px);
    }
    .action-btn{
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--sc-spacing-xs, 4px);
      padding: var(--sc-spacing-md, 16px);
      background-color: var(--sc-bg-secondary, #f8fafc);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-md, 8px);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .action-btn:hover{
      border-color: var(--sc-primary, #3b82f6);
      background-color: rgba(59, 130, 246, 0.05);
    }
    .action-btn-icon{
      font-size: 24px;
    }
    .action-btn-label{
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
    }
    /* AI建议 */
    .ai-suggestions{
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
    .suggestion-list{
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-xs, 4px);
    }
    .suggestion-item{
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
    .playbook-section{
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }
    .playbook-grid{
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--sc-spacing-md, 16px);
    }
    @media (max-width: 768px) {
      .playbook-grid { grid-template-columns: 1fr; }
    }
    .playbook-card{
      background-color: var(--sc-bg-secondary, #f8fafc);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-md, 8px);
      padding: var(--sc-spacing-md, 16px);
      transition: border-color 0.2s ease;
    }
    .playbook-card:hover{
      border-color: var(--sc-primary, #3b82f6);
    }
    .playbook-card-header{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-sm, 8px);
    }
    .playbook-card-name{
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
    }
    .playbook-status{
      padding: 2px 8px;
      border-radius: 10px;
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 500;
    }
    .playbook-status.enabled{ background: rgba(34, 197, 94, 0.15); color: #22c55e; }
    .playbook-status.disabled{ background: rgba(148, 163, 184, 0.15); color: #94a3b8; }
    .playbook-card-desc{
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
      margin-bottom: var(--sc-spacing-sm, 8px);
      line-height: 1.5;
    }
    .playbook-card-footer{
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .playbook-trigger{
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-tertiary, #94a3b8);
    }
    .btn-execute{
      padding: 4px 12px;
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 500;
      cursor: pointer;
      border: none;
      background-color: var(--sc-primary, #3b82f6);
      color: white;
      transition: all 0.2s ease;
    }
    .btn-execute:hover:not(:disabled){
      background-color: var(--sc-primary-dark, #2563eb);
    }
    .btn-execute:disabled{
      opacity: 0.6;
      cursor: not-allowed;
    }
    .playbook-result{
      margin-top: var(--sc-spacing-md, 16px);
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 16px);
      border-radius: var(--sc-radius-md, 8px);
      font-size: var(--sc-font-size-sm, 14px);
    }
    .playbook-result.success{ background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.2); }
    .playbook-result.error{ background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
  `;
  }

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
  }

  private async loadData() {
    this.loading = true;
    try {
  
      try {
        const pbRes = await gatewayClient.request('playbook.list', {});
        const pbData = (pbRes as any)?.data ?? pbRes;
        if (Array.isArray(pbData) && pbData.length > 0) {
          this.playbooks = pbData;
        } else {
          this.playbooks = [...this.fallbackPlaybooks];
        }
      } catch {
        this.playbooks = [...this.fallbackPlaybooks];
      }
      await this.loadIncidents();
      await this.loadTeamMembers();
      await this.loadActivities();
  
      await this.loadAIInsights();
    } finally {
      this.loading = false;
    }
  }

  

  private async loadIncidents() {
    this.activeIncidents = [
      { id: 'inc-1', title: 'APT29钓鱼攻击响应', priority: 'p1', status: 'containment', assignees: ['张安全', '李运维'], updatedAt: new Date(), description: '检测到针对高管的钓鱼攻击，正在遏制' },
      { id: 'inc-2', title: '勒索软件感染处理', priority: 'p1', status: 'eradication', assignees: ['李运维'], updatedAt: new Date(Date.now() - 1800000), description: 'LockBit勒索软件感染，正在根除' },
      { id: 'inc-3', title: '异常数据传输调查', priority: 'p2', status: 'confirmed', assignees: ['王合规', '张安全'], updatedAt: new Date(Date.now() - 3600000), description: '检测到大量数据外传，正在调查' },
      { id: 'inc-4', title: 'DDoS攻击缓解', priority: 'p2', status: 'recovery', assignees: ['赵网络'], updatedAt: new Date(Date.now() - 7200000), description: 'DDoS攻击已缓解，正在恢复服务' },
      { id: 'inc-5', title: '可疑进程分析', priority: 'p3', status: 'new', assignees: [], updatedAt: new Date(Date.now() - 300000), description: '检测到可疑进程，等待分析' }
    ];
  }

  private async loadTeamMembers() {
    this.teamMembers = [
      { id: 'tm-1', name: '张安全', role: '安全专家', status: 'busy', currentTask: 'APT29钓鱼攻击响应', avatar: '👨‍💼' },
      { id: 'tm-2', name: '李运维', role: '安全运营', status: 'busy', currentTask: '勒索软件感染处理', avatar: '👨‍💻' },
      { id: 'tm-3', name: '王合规', role: '合规官', status: 'busy', currentTask: '异常数据传输调查', avatar: '👩‍💼' },
      { id: 'tm-4', name: '赵网络', role: '网络工程师', status: 'available', avatar: '👨‍🔧' },
      { id: 'tm-5', name: '陈分析', role: '威胁分析师', status: 'available', avatar: '👩‍🔬' },
      { id: 'tm-6', name: '刘架构', role: '安全架构师', status: 'offline', avatar: '👨‍🏫' }
    ];
  }

  private async loadActivities() {
    this.activities = [
      { id: 'act-1', type: 'action', user: '张安全', message: '隔离了受影响的工作站', timestamp: new Date(), incidentId: 'inc-1' },
      { id: 'act-2', type: 'comment', user: '李运维', message: '勒索软件样本已提交分析', timestamp: new Date(Date.now() - 600000), incidentId: 'inc-2' },
      { id: 'act-3', type: 'escalation', user: '系统', message: '事件inc-1升级为P1', timestamp: new Date(Date.now() - 1200000), incidentId: 'inc-1' },
      { id: 'act-4', type: 'resolution', user: '赵网络', message: 'DDoS攻击流量已缓解', timestamp: new Date(Date.now() - 1800000), incidentId: 'inc-4' },
      { id: 'act-5', type: 'action', user: '王合规', message: '阻断了可疑数据传输', timestamp: new Date(Date.now() - 2400000), incidentId: 'inc-3' },
    ];
  }

  private async loadAIInsights() {
    try {
      this._insights = await aiService.generateInsights({
        pageId: 'war-room',
        data: { incidents: this.activeIncidents, team: this.teamMembers },
        userRole: 'security-expert'
      });
      this.recommendations = await aiService.generateRecommendations({
        pageId: 'war-room',
        data: { incidents: this.activeIncidents },
        userRole: 'security-expert'
      });
    } catch (error) {
      console.error('Failed to load AI insights:', error);
      // AI insights are non-critical, continue without them
      this._insights = [];
      this.recommendations = [];
    }
  }

  private async loadPlaybooks() {
    try {
      const res = await gatewayClient.request('playbook.list', {});
      const data = (res as any)?.data ?? res;
      if (Array.isArray(data) && data.length > 0) {
        this.playbooks = [...data];
      } else {
        this.playbooks = this.fallbackPlaybooks.map(p => ({ ...p }));
      }
    } catch {
      this.playbooks = this.fallbackPlaybooks.map(p => ({ ...p }));
    }
  }

  private async executePlaybook(playbookId: string) {
    try {
      const res = await gatewayClient.request('playbook.start', { playbookId });
      const execId = (res as any)?.execId ?? (res as any)?.id;
      // Prepend to executions for quick audit
      this.playbookExecutions = [
        { playbookId, execId, startedAt: new Date(), status: 'started', detail: res },
        ...(this.playbookExecutions || [])
      ];
      console.log('[WarRoom] Playbook execution started:', res);
    } catch (e) {
      this.playbookExecutions = [{ playbookId, startedAt: new Date(), status: 'failed', error: e instanceof Error ? e.message : '执行失败' }, ...(this.playbookExecutions || [])];
      console.warn('[WarRoom] Playbook execution failed:', e);
    }
  }

  private async pollPlaybookStatus(playbookId: string, execId: string) {
    try {
      const res = await gatewayClient.request('playbook.getStatus', { playbookId, execId });
      const status = (res as any)?.status;
      if (status === 'running') {
        setTimeout(() => this.pollPlaybookStatus(playbookId, execId), 3000);
      } else {
        this.playbookResult = { success: status !== 'failed', data: res };
        this.executingPlaybookId = null;
        try {
          const exec = await gatewayClient.request('playbook.getExecution', { execId });
          this.playbookResult = { success: status !== 'failed', data: Object.assign({}, res, { execution: exec }) };
        } catch {}
      }
    } catch (e) {
      this.playbookResult = { success: false, error: '状态查询失败' };
      this.executingPlaybookId = null;
    }
  }

  private async cancelPlaybook(playbookId: string) {
    try {
      await gatewayClient.request('playbook.cancel', { playbookId });
      this.playbookResult = { success: true, data: { status: 'cancelled' } };
      this.executingPlaybookId = null;
    } catch (e) {
      console.error('[war-room] Cancel failed:', e);
    }
  }

  private async createNewPlaybook() {
    const name = prompt('剧本名称:');
    if (!name) return;
    const description = prompt('剧本描述:') || '';
    try {
      await gatewayClient.request('playbook.create', { playbook: { name, description, version: '1.0' } });
      this.showToast('剧本创建成功', 'success');
      this.loadPlaybooks();
    } catch { this.showToast('创建失败', 'error'); }
  }

  private async deletePlaybook(id: string) {
    if (!confirm('确定删除此剧本？')) return;
    try {
      await gatewayClient.request('playbook.delete', { id });
      this.showToast('剧本已删除', 'success');
      this.loadPlaybooks();
    } catch { this.showToast('删除失败', 'error'); }
  }

  private async updatePlaybookInfo(pb: Record<string, unknown>) {
    const name = prompt('新名称:', pb.name as string);
    if (!name) return;
    const description = prompt('新描述:', pb.description as string);
    try {
      await gatewayClient.request('playbook.update', { id: pb.id as string, updates: { name, description } });
      this.showToast('剧本已更新', 'success');
      this.loadPlaybooks();
    } catch { this.showToast('更新失败', 'error'); }
  }

  private async loadPlaybookExecutions() {
    try {
      const res = await gatewayClient.request('playbook.listExecutions', {});
      const data = (res as Record<string, unknown>)?.data ?? res;
      if (Array.isArray(data) && data.length > 0) {
        this.showToast(`共 ${data.length} 条执行记录`, 'success');
      } else {
        this.showToast('暂无执行记录', 'info');
      }
    } catch { this.showToast('查询失败', 'error'); }
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => { this.toastMessage = ''; this.toastType = 'info'; }, 3000);
  }

  private async getPlaybookDetail(playbookId: string) {
    try {
      const res = await gatewayClient.request('playbook.get', { playbookId });
      const detail = (res as any)?.data ?? res;
      alert(`Playbook详情:\n${JSON.stringify(detail, null, 2)}`);
    } catch (e) { console.error('[war-room] Get playbook failed:', e); }
  }

  private async createCommanderAction() {
    const action = prompt('指挥官操作 (isolate/block/alert):', 'alert');
    if (!action) return;
    const target = prompt('目标:') || '';
    try {
      await gatewayClient.request('commander.create', { action, target, priority: 'high' });
    } catch (e) { console.error('[war-room] Commander create failed:', e); }
  }

  private async getCommanderStatus() {
    try {
      const res = await gatewayClient.request('commander.get', {});
      const status = (res as any)?.data ?? res;
      if (status) alert(`指挥官状态:\n${JSON.stringify(status, null, 2)}`);
    } catch (e) { console.error('[war-room] Commander get failed:', e); }
  }

  private renderPlaybookPanel() {
    return html`
      <div class="playbook-section">
        <div class="section-header">
          <h3 class="section-title">🤖 Playbook自动化</h3>
          <span style="font-size:12px;color:var(--sc-text-secondary);">${this.playbooks.length} 个剧本</span>
        </div>
        ${this.playbookResult ? html`
          <div class="playbook-result ${this.playbookResult.success ? 'success' : 'error'}" style="padding:12px;border-radius:8px;margin-bottom:16px;font-size:13px;">
            ${this.playbookResult.success
              ? html`✅ 执行成功 — 任务ID: ${(this.playbookResult.data as any)?.execId ?? 'N/A'}`
              : html`❌ ${(this.playbookResult.error as string) ?? '执行失败'}`}
          </div>
        ` : ''}
        <div class="playbook-grid">
          ${this.playbooks.map(pb => html`
            <div class="playbook-card">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <strong style="font-size:14px;color:var(--sc-text-primary);">${pb.name}</strong>
                <span class="playbook-trigger" style="padding:2px 8px;border-radius:10px;font-size:11px;${pb.status === 'enabled' ? 'background:rgba(34,197,94,0.15);color:#22c55e;' : 'background:rgba(148,163,184,0.15);color:#94a3b8;'}">${pb.status === 'enabled' ? '启用' : '停用'}</span>
              </div>
              <div class="playbook-card-desc">${pb.description}</div>
              <div class="playbook-card-footer" style="margin-top:12px;">
                <span class="playbook-trigger">触发: ${pb.triggerType === 'alarm' ? '告警' : pb.triggerType === 'cron' ? '定时' : pb.triggerType}</span>
                <button class="btn-execute" ?disabled=${this.executingPlaybookId !== null} @click=${() => this.executePlaybook(pb.id)}>
                  ${this.executingPlaybookId === pb.id ? '⏳ 执行中...' : '▶ 执行'}
                </button>
                ${this.executingPlaybookId === pb.id ? html`<button class="btn-execute" style="background:var(--sc-danger,#ef4444);margin-left:4px;" @click=${() => this.cancelPlaybook(pb.id)}>✕ 取消</button>` : ''}
                <button class="btn-execute" style="background:var(--sc-bg-secondary);margin-left:4px;" @click=${() => this.getPlaybookDetail(pb.id)}>📋</button>
                <button class="btn-execute" style="background:var(--sc-bg-secondary);margin-left:4px;" @click=${() => this.updatePlaybookInfo(pb as unknown as Record<string, unknown>)}>✏️</button>
                <button class="btn-execute" style="background:rgba(239,68,68,0.1);color:#ef4444;margin-left:4px;" @click=${() => this.deletePlaybook(pb.id)}>🗑️</button>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private handleIncidentClick(incident: WarRoomIncident) {
    this.selectedIncident = this.selectedIncident?.id === incident.id ? null : incident;
  }

  render() {
    if (this.loading) {
      return html`<div style="text-align:center;padding:2rem;"><div style="font-size:48px;margin-bottom:16px;">⏳</div><div style="color:var(--sc-text-secondary);">${this.i18n.t('common.loading')}</div></div>`;
    }

    const p1Count = this.activeIncidents.filter(i => i.priority === 'p1').length;
    const p2Count = this.activeIncidents.filter(i => i.priority === 'p2').length;
    const availableTeam = this.teamMembers.filter(t => t.status === 'available').length;
    const busyTeam = this.teamMembers.filter(t => t.status === 'busy').length;

    return html`
      <div class="warroom-container">
        ${this.toastMessage ? html`<div style="position:fixed;top:16px;right:16px;padding:12px 20px;border-radius:8px;font-size:14px;z-index:9999;${this.toastType === 'success' ? 'background:#d4edda;color:#155724;' : this.toastType === 'error' ? 'background:#f8d7da;color:#721c24;' : 'background:#d1ecf1;color:#0c5460;'}">${this.toastType === 'success' ? '✅' : this.toastType === 'error' ? '❌' : 'ℹ️'} ${this.toastMessage}</div>` : ''}
        <div class="main-content">
          <div class="page-header">
            <div class="page-title-section">
              <h1 class="page-title">
                <span>🎯</span>
                ${this.i18n.t('nav.warRoom') || '作战室'}
              </h1>
              <div class="page-description">
                <span>实时协同指挥，应对正在发生的安全事件</span>
              </div>
            </div>
            <div class="header-actions">
              <button class="btn btn-secondary">📋 运行日志</button>
              <button class="btn btn-primary">🚨 紧急事件</button>
            </div>
          </div>

          <div class="stats-grid">
            <sc-smart-card title="P1事件" value="${p1Count}" icon="🔴" status="error"></sc-smart-card>
            <sc-smart-card title="P2事件" value="${p2Count}" icon="🟠" status="warning"></sc-smart-card>
            <sc-smart-card title="可用人员" value="${availableTeam}" icon="👥" status="success"></sc-smart-card>
            <sc-smart-card title="忙碌人员" value="${busyTeam}" icon="⏰" status="warning"></sc-smart-card>
          </div>

          <div class="content-grid">
            <div class="incidents-section">
              <div class="section-header">
                <h3 class="section-title">🔥 活跃事件</h3>
                <span style="font-size:12px;color:var(--sc-text-secondary);">${this.activeIncidents.length} 个事件</span>
              </div>
              <div class="incident-list">
                ${this.activeIncidents.map(incident => html`
                  <div class="incident-item ${incident.priority} ${this.selectedIncident?.id === incident.id ? 'selected' : ''}" @click=${() => this.handleIncidentClick(incident)}>
                    <span class="priority-badge ${incident.priority}">${incident.priority.toUpperCase()}</span>
                    <div class="incident-info">
                      <div class="incident-title">${incident.title}</div>
                      <div class="incident-meta">
                        ${incident.status} · ${incident.updatedAt.toLocaleTimeString()}
                      </div>
                    </div>
                    <div class="incident-assignees">
                      ${incident.assignees.map(a => html`<div class="assignee-avatar" title="${a}">${a[0]}</div>`)}
                    </div>
                  </div>
                `)}
              </div>
            </div>

            <div class="team-section">
              <div class="section-header">
                <h3 class="section-title">👥 团队状态</h3>
              </div>
              <div class="team-list">
                ${this.teamMembers.map(member => html`
                  <div class="team-item">
                    <div class="team-avatar">${member.avatar}</div>
                    <div class="team-info">
                      <div class="team-name">${member.name}</div>
                      <div class="team-role">${member.role}${member.currentTask? ` · ${member.currentTask}` : ''}</div>
                    </div>
                    <div class="status-indicator ${member.status}" title="${member.status}"></div>
                  </div>
                `)}
              </div>
            </div>
          </div>

          <div class="content-grid">
            <div class="activity-section">
              <div class="section-header">
                <h3 class="section-title">📝 活动日志</h3>
              </div>
              <div class="activity-list">
                ${this.activities.map(activity => html`
                  <div class="activity-item">
                    <div class="activity-icon ${activity.type}">
                      ${activity.type === 'comment'? '💬': activity.type === 'action'? '⚡': activity.type === 'escalation'? '⬆️': '✅'}
                    </div>
                    <div class="activity-content">
                      <div class="activity-message"><strong>${activity.user}:</strong> ${activity.message}</div>
                      <div class="activity-meta">${activity.timestamp.toLocaleString()}</div>
                    </div>
                  </div>
                `)}
              </div>
            </div>

            <div class="quick-actions">
              <div class="section-header">
                <h3 class="section-title">⚡ 快速操作</h3>
              </div>
              <div class="action-buttons">
                <div class="action-btn" @click=${() => this.createNewPlaybook()}>
                  <span class="action-btn-icon">➕</span>
                  <span class="action-btn-label">新建剧本</span>
                </div>
                <div class="action-btn" @click=${() => this.loadPlaybookExecutions()}>
                  <span class="action-btn-icon">📜</span>
                  <span class="action-btn-label">执行历史</span>
                </div>
                <div class="action-btn" @click=${() => this.createCommanderAction()}>
                  <span class="action-btn-icon">🚨</span>
                  <span class="action-btn-label">指挥官操作</span>
                </div>
                <div class="action-btn" @click=${() => this.getCommanderStatus()}>
                  <span class="action-btn-icon">📢</span>
                  <span class="action-btn-label">指挥官状态</span>
                </div>
              </div>
            </div>
          </div>

          ${this.renderPlaybookPanel()}

          ${this.recommendations.length > 0? html`
            <div class="ai-suggestions">
              <div class="ai-title">🤖 AI决策建议</div>
              <div class="suggestion-list">
                ${this.recommendations.slice(0, 3).map(rec => html`
                  <div class="suggestion-item">
                    <span>💡</span>
                    <span>${rec.title}: ${rec.description}</span>
                  </div>
                `)}
              </div>
            </div>
          `: ''}
        </div>

        <div class="ai-sidebar">
          <sc-ai-assistant
            pageId="war-room"
            pageTitle="作战室"
            .pageData=${{ incidents: this.activeIncidents, team: this.teamMembers, activities: this.activities }}
            userRole="security-expert"
          ></sc-ai-assistant>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-war-room-page': ScWarRoomPage;
  }
}

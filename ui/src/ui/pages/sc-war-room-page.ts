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
  @state() private insights: SmartInsight[] = [];
  @state() private recommendations: AIRecommendation[] = [];
  @state() private selectedIncident: WarRoomIncident | null = null;
  @state() private newComment = '';

  staticstyles = css`
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
  `;

  constructor() {
    super();
    this.loadWarRoomData();
  }

  private async loadWarRoomData() {
    this.loading = true;
    try {
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
      this.insights = await aiService.generateInsights('war-room', { incidents: this.activeIncidents, team: this.teamMembers });
      this.recommendations = await aiService.generateRecommendations('war-room', { incidents: this.activeIncidents });
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    }
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
                <div class="action-btn">
                  <span class="action-btn-icon">🚨</span>
                  <span class="action-btn-label">创建事件</span>
                </div>
                <div class="action-btn">
                  <span class="action-btn-icon">📢</span>
                  <span class="action-btn-label">广播通知</span>
                </div>
                <div class="action-btn">
                  <span class="action-btn-icon">👥</span>
                  <span class="action-btn-label">分配任务</span>
                </div>
                <div class="action-btn">
                  <span class="action-btn-icon">📊</span>
                  <span class="action-btn-label">状态报告</span>
                </div>
              </div>
            </div>
          </div>

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

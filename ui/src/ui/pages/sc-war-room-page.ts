import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { Router } from '@vaadin/router';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { gatewayClient } from '../gateway-client.js';
import { roleContext, type RoleId, type RoleProfile } from '../store/role-context.js';
import { raciStore, type RaciTask, type TimelineEvent, type ChatMessage, type WarRoomSession, type TaskStatus } from '../store/raci-store.js';
import { RACI_SCENARIOS, type ScenarioType, type RaciRole } from '../config/raci-matrix.js';
import { ROLE_THEMES } from '../config/role-themes.js';
import '../components/sc-raci-matrix-view.js';
import '../components/sc-role-perspective.js';
import '../components/design-system/sc-button.js';
import '../components/design-system/sc-card.js';
import '../components/design-system/sc-badge.js';
import '../components/sc-smart-recommendation-bar.js';

interface WorkflowSuggestion {
  id: string;
  workflowName: string;
  matchedKeyword: string;
  description: string;
}

@customElement('sc-war-room-page')
export class ScWarRoomPage extends LitElement {
  private i18n = new I18nController(this);
  private storeUnsub: (() => void) | null = null;

  @state() private loading = true;
  @state() private eventId = '';
  @state() private scenarioType: ScenarioType = 'incident-response';
  @state() private currentRole: RoleId | null = null;
  @state() private roleProfile: RoleProfile | null = null;
  @state() private raciAssignment: RaciRole | null = null;
  @state() private tasks: RaciTask[] = [];
  @state() private timeline: TimelineEvent[] = [];
  @state() private chatMessages: ChatMessage[] = [];
  @state() private newMessage = '';
  @state() private workflowSuggestions: WorkflowSuggestion[] = [];
  @state() private activeTimelineFilter: RoleId | 'all' = 'all';
  @state() private activeSession: WarRoomSession | null = null;
  @state() private collaborationStatus: { phase: string; completedRoles: string[] } | null = null;
  @state() private aiTriggering = false;

  @query('#chat-input') private chatInput!: HTMLTextAreaElement;
  @query('#mobile-task-tabs') private mobileTaskTabs!: HTMLElement;

  private readonly WORKFLOW_KEYWORDS = [
    { keyword: '隔离', workflowId: 'ir-ops-2', workflowName: '执行遏制措施' },
    { keyword: '分析', workflowId: 'ir-expert-1', workflowName: '分析攻击手法' },
    { keyword: '补丁', workflowId: 'vm-ops-2', workflowName: '执行补丁部署' },
    { keyword: '取证', workflowId: 'ir-ops-3', workflowName: '收集取证数据' },
    { keyword: '扫描', workflowId: 'vm-expert-1', workflowName: '发现和识别漏洞' },
    { keyword: '评估', workflowId: 'ir-cmd-1', workflowName: '评估事件严重性' },
  ];

  static get styles() {
    return css`
      :host {
        display: block;
        height: 100%;
      }

      .war-room-container {
        display: grid;
        grid-template-rows: auto 1fr auto;
        grid-template-columns: 1fr 360px;
        gap: var(--sc-spacing-lg, 20px);
        height: 100%;
        padding: var(--sc-spacing-md, 16px);
        background-color: var(--sc-bg-primary, #0f172a);
      }

      @media (max-width: 1200px) {
        .war-room-container {
          grid-template-columns: 1fr;
          grid-template-rows: auto 1fr auto auto;
        }
      }

      .raci-overview {
        grid-column: 1 / -1;
      }

      .role-panels {
        grid-column: 1 / 2;
        overflow: auto;
      }

      @media (max-width: 1200px) {
        .role-panels {
          grid-column: 1 / -1;
        }
      }

      .sidebar {
        grid-column: 2 / 3;
        display: flex;
        flex-direction: column;
        gap: var(--sc-spacing-md, 16px);
        overflow: auto;
      }

      @media (max-width: 1200px) {
        .sidebar {
          grid-column: 1 / -1;
        }
      }

      .chat-section {
        grid-column: 1 / 2;
      }

      @media (max-width: 1200px) {
        .chat-section {
          grid-column: 1 / -1;
        }
      }

      .workflow-suggestions {
        grid-column: 2 / 3;
      }

      @media (max-width: 1200px) {
        .workflow-suggestions {
          grid-column: 1 / -1;
        }
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--sc-spacing-md, 16px);
      }

      .page-title {
        font-size: var(--sc-font-size-xl, 20px);
        font-weight: 600;
        color: var(--sc-text-primary, #f8fafc);
        display: flex;
        align-items: center;
        gap: var(--sc-spacing-sm, 8px);
      }

      .event-badge {
        padding: 4px 12px;
        background-color: var(--sc-primary, #3b82f6);
        color: white;
        border-radius: var(--sc-radius-full, 999px);
        font-size: var(--sc-font-size-xs, 12px);
        font-weight: 500;
      }

      .task-panels-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--sc-spacing-md, 16px);
      }

      @media (max-width: 768px) {
        .task-panels-container {
          display: none;
        }
      }

      .mobile-task-tabs {
        display: none;
      }

      @media (max-width: 768px) {
        .mobile-task-tabs {
          display: flex;
          gap: var(--sc-spacing-sm, 8px);
          margin-bottom: var(--sc-spacing-md, 16px);
          overflow-x: auto;
          padding-bottom: var(--sc-spacing-sm, 8px);
        }
      }

      .mobile-task-tab {
        padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 16px);
        background-color: var(--sc-bg-secondary, #1e293b);
        border: 1px solid var(--sc-border-color, #334155);
        border-radius: var(--sc-radius-md, 8px);
        color: var(--sc-text-primary, #f8fafc);
        font-size: var(--sc-font-size-sm, 14px);
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s ease;
      }

      .mobile-task-tab.active {
        background-color: var(--sc-primary, #3b82f6);
        border-color: var(--sc-primary, #3b82f6);
        color: white;
      }

      .task-panel {
        background-color: var(--sc-bg-card, #1e293b);
        border: 1px solid var(--sc-border-color, #334155);
        border-radius: var(--sc-radius-lg, 12px);
        padding: var(--sc-spacing-md, 16px);
        display: flex;
        flex-direction: column;
        gap: var(--sc-spacing-sm, 8px);
      }

      .task-panel-header {
        display: flex;
        align-items: center;
        gap: var(--sc-spacing-sm, 8px);
        padding-bottom: var(--sc-spacing-sm, 8px);
        border-bottom: 1px solid var(--sc-border-color, #334155);
      }

      .task-panel-title {
        font-size: var(--sc-font-size-md, 16px);
        font-weight: 600;
        color: var(--sc-text-primary, #f8fafc);
      }

      .raci-badge {
        padding: 2px 8px;
        border-radius: var(--sc-radius-sm, 4px);
        font-size: var(--sc-font-size-xs, 12px);
        font-weight: 600;
        text-transform: uppercase;
      }

      .raci-badge.R { background-color: rgba(34, 197, 94, 0.2); color: #22c55e; }
      .raci-badge.A { background-color: rgba(59, 130, 246, 0.2); color: #3b82f6; }
      .raci-badge.C { background-color: rgba(245, 158, 11, 0.2); color: #f59e0b; }
      .raci-badge.I { background-color: rgba(100, 116, 139, 0.2); color: #64748b; }

      .task-list {
        display: flex;
        flex-direction: column;
        gap: var(--sc-spacing-xs, 4px);
      }

      .task-item {
        display: flex;
        align-items: center;
        gap: var(--sc-spacing-sm, 8px);
        padding: var(--sc-spacing-sm, 8px);
        background-color: var(--sc-bg-secondary, #0f172a);
        border-radius: var(--sc-radius-sm, 4px);
        transition: all 0.2s ease;
      }

      .task-item:hover {
        background-color: var(--sc-bg-hover, #334155);
      }

      .task-status {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid var(--sc-border-color, #334155);
        background-color: transparent;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .task-status.created { border-color: #64748b; }
      .task-status.assigned { border-color: #3b82f6; }
      .task-status.in_progress { border-color: #f59e0b; background-color: rgba(245, 158, 11, 0.2); }
      .task-status.pending_handoff { border-color: #a855f7; background-color: rgba(168, 85, 247, 0.2); }
      .task-status.completed { border-color: #22c55e; background-color: #22c55e; }
      .task-status.escalated { border-color: #ef4444; background-color: rgba(239, 68, 68, 0.2); }

      .task-text {
        flex: 1;
        font-size: var(--sc-font-size-sm, 14px);
        color: var(--sc-text-primary, #f8fafc);
      }

      .commander-view {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--sc-spacing-md, 16px);
      }

      .role-summary-card {
        background-color: var(--sc-bg-card, #1e293b);
        border: 1px solid var(--sc-border-color, #334155);
        border-radius: var(--sc-radius-md, 8px);
        padding: var(--sc-spacing-md, 16px);
      }

      .role-summary-header {
        display: flex;
        align-items: center;
        gap: var(--sc-spacing-sm, 8px);
        margin-bottom: var(--sc-spacing-sm, 8px);
      }

      .role-summary-emoji {
        font-size: 1.5rem;
      }

      .role-summary-name {
        font-size: var(--sc-font-size-sm, 14px);
        font-weight: 600;
        color: var(--sc-text-primary, #f8fafc);
      }

      .role-summary-stats {
        display: flex;
        gap: var(--sc-spacing-sm, 8px);
        font-size: var(--sc-font-size-xs, 12px);
        color: var(--sc-text-secondary, #cbd5e1);
      }

      .timeline-section {
        background-color: var(--sc-bg-card, #1e293b);
        border: 1px solid var(--sc-border-color, #334155);
        border-radius: var(--sc-radius-lg, 12px);
        padding: var(--sc-spacing-md, 16px);
      }

      .timeline-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--sc-spacing-md, 16px);
        padding-bottom: var(--sc-spacing-sm, 8px);
        border-bottom: 1px solid var(--sc-border-color, #334155);
      }

      .timeline-title {
        font-size: var(--sc-font-size-md, 16px);
        font-weight: 600;
        color: var(--sc-text-primary, #f8fafc);
        display: flex;
        align-items: center;
        gap: var(--sc-spacing-sm, 8px);
      }

      .timeline-filter {
        display: flex;
        gap: var(--sc-spacing-xs, 4px);
      }

      .timeline-filter-btn {
        padding: 4px 8px;
        background-color: var(--sc-bg-secondary, #0f172a);
        border: 1px solid var(--sc-border-color, #334155);
        border-radius: var(--sc-radius-sm, 4px);
        color: var(--sc-text-secondary, #cbd5e1);
        font-size: var(--sc-font-size-xs, 12px);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .timeline-filter-btn:hover {
        border-color: var(--sc-primary, #3b82f6);
      }

      .timeline-filter-btn.active {
        background-color: var(--sc-primary, #3b82f6);
        border-color: var(--sc-primary, #3b82f6);
        color: white;
      }

      .timeline-list {
        display: flex;
        flex-direction: column;
        gap: var(--sc-spacing-sm, 8px);
        max-height: 400px;
        overflow-y: auto;
      }

      .timeline-item {
        display: flex;
        gap: var(--sc-spacing-sm, 8px);
        padding: var(--sc-spacing-sm, 8px);
        background-color: var(--sc-bg-secondary, #0f172a);
        border-radius: var(--sc-radius-sm, 4px);
        font-size: var(--sc-font-size-sm, 14px);
      }

      .timeline-emoji {
        font-size: 1.25rem;
        flex-shrink: 0;
      }

      .timeline-content {
        flex: 1;
      }

      .timeline-action {
        color: var(--sc-text-primary, #f8fafc);
      }

      .timeline-meta {
        font-size: var(--sc-font-size-xs, 12px);
        color: var(--sc-text-tertiary, #64748b);
        margin-top: 2px;
      }

      .chat-section {
        background-color: var(--sc-bg-card, #1e293b);
        border: 1px solid var(--sc-border-color, #334155);
        border-radius: var(--sc-radius-lg, 12px);
        padding: var(--sc-spacing-md, 16px);
        display: flex;
        flex-direction: column;
        gap: var(--sc-spacing-sm, 8px);
        min-height: 300px;
      }

      .chat-header {
        font-size: var(--sc-font-size-md, 16px);
        font-weight: 600;
        color: var(--sc-text-primary, #f8fafc);
        display: flex;
        align-items: center;
        gap: var(--sc-spacing-sm, 8px);
        padding-bottom: var(--sc-spacing-sm, 8px);
        border-bottom: 1px solid var(--sc-border-color, #334155);
      }

      .chat-messages {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--sc-spacing-sm, 8px);
        overflow-y: auto;
        min-height: 200px;
      }

      .chat-message {
        display: flex;
        gap: var(--sc-spacing-sm, 8px);
        padding: var(--sc-spacing-sm, 8px);
        background-color: var(--sc-bg-secondary, #0f172a);
        border-radius: var(--sc-radius-sm, 4px);
      }

      .chat-message-emoji {
        font-size: 1.5rem;
        flex-shrink: 0;
      }

      .chat-message-content {
        flex: 1;
      }

      .chat-message-sender {
        font-size: var(--sc-font-size-sm, 14px);
        font-weight: 600;
        color: var(--sc-primary, #3b82f6);
        margin-bottom: 2px;
      }

      .chat-message-text {
        font-size: var(--sc-font-size-sm, 14px);
        color: var(--sc-text-primary, #f8fafc);
      }

      .chat-message-time {
        font-size: var(--sc-font-size-xs, 12px);
        color: var(--sc-text-tertiary, #64748b);
        margin-top: 2px;
      }

      .chat-input-area {
        display: flex;
        gap: var(--sc-spacing-sm, 8px);
      }

      .chat-input {
        flex: 1;
        padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 16px);
        background-color: var(--sc-bg-secondary, #0f172a);
        border: 1px solid var(--sc-border-color, #334155);
        border-radius: var(--sc-radius-md, 8px);
        color: var(--sc-text-primary, #f8fafc);
        font-size: var(--sc-font-size-sm, 14px);
        resize: none;
        font-family: inherit;
      }

      .chat-input:focus {
        outline: none;
        border-color: var(--sc-primary, #3b82f6);
      }

      .chat-send-btn {
        padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 16px);
        background-color: var(--sc-primary, #3b82f6);
        border: none;
        border-radius: var(--sc-radius-md, 8px);
        color: white;
        font-size: var(--sc-font-size-sm, 14px);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .chat-send-btn:hover {
        background-color: var(--sc-primary-dark, #2563eb);
      }

      .workflow-suggestions {
        background-color: var(--sc-bg-card, #1e293b);
        border: 1px solid var(--sc-border-color, #334155);
        border-radius: var(--sc-radius-lg, 12px);
        padding: var(--sc-spacing-md, 16px);
      }

      .workflow-title {
        font-size: var(--sc-font-size-md, 16px);
        font-weight: 600;
        color: var(--sc-text-primary, #f8fafc);
        display: flex;
        align-items: center;
        gap: var(--sc-spacing-sm, 8px);
        margin-bottom: var(--sc-spacing-md, 16px);
      }

      .workflow-list {
        display: flex;
        flex-direction: column;
        gap: var(--sc-spacing-sm, 8px);
      }

      .workflow-card {
        padding: var(--sc-spacing-md, 16px);
        background-color: var(--sc-bg-secondary, #0f172a);
        border: 1px solid var(--sc-border-color, #334155);
        border-radius: var(--sc-radius-md, 8px);
        transition: all 0.2s ease;
        cursor: pointer;
      }

      .workflow-card:hover {
        border-color: var(--sc-primary, #3b82f6);
        background-color: rgba(59, 130, 246, 0.1);
      }

      .workflow-card-title {
        font-size: var(--sc-font-size-sm, 14px);
        font-weight: 600;
        color: var(--sc-text-primary, #f8fafc);
        margin-bottom: var(--sc-spacing-xs, 4px);
      }

      .workflow-card-desc {
        font-size: var(--sc-font-size-sm, 14px);
        color: var(--sc-text-secondary, #cbd5e1);
      }

      .workflow-card-keyword {
        display: inline-block;
        padding: 2px 6px;
        background-color: rgba(245, 158, 11, 0.2);
        border-radius: var(--sc-radius-sm, 4px);
        color: #f59e0b;
        font-size: var(--sc-font-size-xs, 12px);
        margin-top: var(--sc-spacing-xs, 4px);
      }

      .mobile-task-panel {
        display: none;
      }

      @media (max-width: 768px) {
        .mobile-task-panel.active {
          display: block;
        }
      }

      .collaboration-bar {
        grid-column: 1 / -1;
        background-color: var(--sc-bg-card, #1e293b);
        border: 1px solid var(--sc-border-color, #334155);
        border-radius: var(--sc-radius-lg, 12px);
        padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 16px);
        display: flex;
        align-items: center;
        gap: var(--sc-spacing-md, 16px);
      }

      .collab-phases {
        display: flex;
        gap: 4px;
        flex: 1;
      }

      .collab-phase {
        flex: 1;
        padding: 6px 12px;
        background-color: var(--sc-bg-secondary, #0f172a);
        border-radius: var(--sc-radius-sm, 4px);
        font-size: var(--sc-font-size-xs, 12px);
        color: var(--sc-text-secondary, #cbd5e1);
        text-align: center;
        transition: all 0.3s ease;
      }

      .collab-phase.active {
        background-color: var(--sc-primary, #3b82f6);
        color: white;
      }

      .collab-phase.done {
        background-color: rgba(34, 197, 94, 0.2);
        color: #22c55e;
      }

      .ai-trigger-btn {
        padding: 6px 16px;
        background-color: #8b5cf6;
        border: none;
        border-radius: var(--sc-radius-md, 8px);
        color: white;
        font-size: var(--sc-font-size-sm, 14px);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }

      .ai-trigger-btn:hover { background-color: #7c3aed; }
      .ai-trigger-btn:disabled { opacity: 0.5; cursor: not-allowed; }

      .ai-badge {
        display: inline-block;
        padding: 1px 6px;
        background-color: rgba(139, 92, 246, 0.2);
        border-radius: var(--sc-radius-sm, 4px);
        color: #a78bfa;
        font-size: var(--sc-font-size-xs, 10px);
        font-weight: 600;
        margin-left: 4px;
      }
    `;
  }

  connectedCallback() {
    super.connectedCallback();

    const router = (window as any).__router as Router;
    if (router) {
      const location = router.location;
      if (location && location.params && location.params.eventId) {
        this.eventId = String(location.params.eventId);
      }
    }

    this.storeUnsub = raciStore.subscribe((state) => {
      this.tasks = state.tasks;
      this.timeline = state.timeline;
      this.chatMessages = state.chatMessages;
      this.activeSession = state.activeSession;
      if (state.activeScenario) {
        this.scenarioType = state.activeScenario;
      }
    });

    this.loadData();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.storeUnsub) {
      this.storeUnsub();
      this.storeUnsub = null;
    }
  }

  private async loadData() {
    this.loading = true;

    try {
      this.currentRole = roleContext.getState().currentRole;
      this.roleProfile = roleContext.getState().roleProfile;
      this.raciAssignment = roleContext.getState().currentRaciAssignment;

      if (!this.currentRole) {
        this.loading = false;
        return;
      }

      await this.loadEventData();

      await this.ensureSession();

      if (this.currentRole && this.activeSession) {
        await raciStore.joinSession(this.activeSession.id, this.currentRole);
        this.pollCollaborationStatus();
      }
    } catch (error) {
      console.error('[WarRoom] Failed to load data:', error);
    } finally {
      this.loading = false;
    }
  }

  private async loadEventData() {
    try {
      if (this.eventId) {
        const event = await gatewayClient.request<any>('incidents.getByTicketId', { ticketId: this.eventId });
        if (event) {
          const eventData = (event as any).data || event;
          if (eventData.info?.category) {
            this.scenarioType = this.mapCategoryToScenario(eventData.info.category);
          }
        }
      }
    } catch (error) {
      console.error('[WarRoom] Failed to load event data:', error);
    }
  }

  private mapCategoryToScenario(category: string): ScenarioType {
    const mapping: Record<string, ScenarioType> = {
      'malware': 'incident-response',
      'phishing': 'incident-response',
      'intrusion': 'incident-response',
      'data-breach': 'incident-response',
      'ddos': 'threat-response',
      'vulnerability': 'vulnerability-management',
      'compliance': 'compliance-audit',
      'supply-chain': 'supply-chain-incident',
    };
    return mapping[category] || 'incident-response';
  }

  private async ensureSession() {
    try {
      await raciStore.loadSessions();
      const storeState = raciStore.getState();

      const existing = storeState.sessions.find(s =>
        s.status === 'active' &&
        s.eventId === this.eventId &&
        s.scenario === this.scenarioType
      );

      if (existing) {
        raciStore.setActiveSessionById(existing.id);
      } else {
        const scenario = RACI_SCENARIOS.find(s => s.id === this.scenarioType);
        await raciStore.createSession({
          title: this.eventId
            ? `War Room - ${this.eventId}`
            : `War Room - ${scenario?.name || this.scenarioType}`,
          scenario: this.scenarioType,
          eventId: this.eventId || undefined,
          createdBy: this.currentRole || 'user',
        });
      }
    } catch (error) {
      console.error('[WarRoom] ensureSession failed:', error);
    }
  }

  private async handleTaskStatusToggle(taskId: string) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task || !this.currentRole) return;

    const nextStatusMap: Partial<Record<TaskStatus, TaskStatus>> = {
      'created': 'assigned',
      'assigned': 'in_progress',
      'in_progress': 'completed',
      'pending_handoff': 'in_progress',
      'escalated': 'in_progress',
    };

    const nextStatus = nextStatusMap[task.status] || 'completed';

    try {
      await raciStore.updateTaskStatus(taskId, nextStatus, this.currentRole);
    } catch (error) {
      console.error('[WarRoom] Failed to update task status:', error);
    }
  }

  private async handleSendMessage() {
    const message = this.newMessage.trim();
    if (!message || !this.currentRole || !this.activeSession) return;

    try {
      await raciStore.sendMessage(
        this.activeSession.id,
        message,
        this.roleProfile?.displayName || this.currentRole,
        this.currentRole,
      );
      this.newMessage = '';
      this.checkWorkflowKeywords(message);
    } catch (error) {
      console.error('[WarRoom] Failed to send message:', error);
    }
  }

  private checkWorkflowKeywords(message: string) {
    this.workflowSuggestions = [];

    for (const workflow of this.WORKFLOW_KEYWORDS) {
      if (message.toLowerCase().includes(workflow.keyword.toLowerCase())) {
        this.workflowSuggestions.push({
          id: workflow.workflowId,
          workflowName: workflow.workflowName,
          matchedKeyword: workflow.keyword,
          description: `检测到关键词"${workflow.keyword}"，建议执行相关工作流`,
        });
      }
    }
  }

  private handleWorkflowClick(workflowId: string) {
    console.log('[WarRoom] Workflow clicked:', workflowId);
    alert(`启动工作流: ${workflowId}`);
  }

  private async handleAITrigger() {
    if (!this.activeSession || this.aiTriggering) return;
    this.aiTriggering = true;
    try {
      await gatewayClient.request('ai.collaboration.trigger', {
        sessionId: this.activeSession.id,
        eventType: this.activeSession.eventType || 'incident',
        eventId: this.activeSession.eventId || this.activeSession.id,
        scenario: this.activeSession.scenario,
      });
      this.pollCollaborationStatus();
    } catch (err) {
      console.error('[WarRoom] AI trigger failed:', err);
    } finally {
      this.aiTriggering = false;
    }
  }

  private async pollCollaborationStatus() {
    if (!this.activeSession) return;
    try {
      const status = await gatewayClient.request<{ phase: string; completedRoles: string[] } | null>(
        'ai.collaboration.status',
        { sessionId: this.activeSession.id },
      );
      this.collaborationStatus = status;
      if (status && status.phase !== 'complete' && status.phase !== 'failed' && status.phase !== 'idle') {
        setTimeout(() => this.pollCollaborationStatus(), 2000);
      }
    } catch {
      this.collaborationStatus = null;
    }
  }

  private getFilteredTimeline(): TimelineEvent[] {
    if (this.activeTimelineFilter === 'all') {
      return this.timeline;
    }
    return this.timeline.filter(event => event.actorRole === this.activeTimelineFilter);
  }

  private getRoleTasksForPanel(roleId: RoleId): RaciTask[] {
    return this.tasks.filter(task => task.assignedRole === roleId);
  }

  private isCommander(): boolean {
    return this.currentRole === 'secuclaw-commander';
  }

  private getActiveMobileTab(): RoleId | null {
    return (this.mobileTaskTabs as any)?.activeTab || null;
  }

  private handleMobileTabSelect(roleId: RoleId) {
    if (this.mobileTaskTabs) {
      (this.mobileTaskTabs as any).activeTab = roleId;
    }
  }

  private renderMobileTaskTabs() {
    const scenario = RACI_SCENARIOS.find(s => s.id === this.scenarioType);
    if (!scenario) return '';

    const raAssignments = scenario.assignments.filter(a => a.raci === 'R' || a.raci === 'A');

    return html`
      <div class="mobile-task-tabs" id="mobile-task-tabs">
        ${raAssignments.map(assignment => html`
          <div
            class="mobile-task-tab ${this.getActiveMobileTab() === assignment.role ? 'active' : ''}"
            @click=${() => this.handleMobileTabSelect(assignment.role)}
          >
            ${ROLE_THEMES[assignment.role]?.icon || '🛡️'} ${assignment.role}
          </div>
        `)}
      </div>
    `;
  }

  private renderMobileTaskPanel() {
    const activeTab = this.getActiveMobileTab();
    if (!activeTab) return '';

    const roleTasks = this.getRoleTasksForPanel(activeTab);
    const role = roleContext.getRoleProfile(activeTab);

    if (!role) return '';

    const assignment = RACI_SCENARIOS
      .find(s => s.id === this.scenarioType)
      ?.assignments.find(a => a.role === activeTab);

    return html`
      <div class="task-panel mobile-task-panel active">
        <div class="task-panel-header">
          <span>${role.emoji}</span>
          <span class="task-panel-title">${role.displayName}</span>
          ${assignment ? html`<span class="raci-badge ${assignment.raci}">${assignment.raci}</span>` : ''}
        </div>
        <div class="task-list">
          ${roleTasks.map(task => this.renderTaskItem(task))}
        </div>
      </div>
    `;
  }

  private renderTaskItem(task: RaciTask) {
    return html`
      <div class="task-item">
        <div
          class="task-status ${task.status}"
          @click=${() => this.handleTaskStatusToggle(task.id)}
          title="点击切换状态"
        ></div>
        <span class="task-text">${task.title}</span>
      </div>
    `;
  }

  private renderTaskPanel(roleId: RoleId) {
    const role = roleContext.getRoleProfile(roleId);
    if (!role) return '';

    const roleTasks = this.getRoleTasksForPanel(roleId);
    const scenario = RACI_SCENARIOS.find(s => s.id === this.scenarioType);
    const assignment = scenario?.assignments.find(a => a.role === roleId);

    if (!assignment || (assignment.raci !== 'R' && assignment.raci !== 'A')) {
      return '';
    }

    return html`
      <div class="task-panel">
        <div class="task-panel-header">
          <span>${role.emoji}</span>
          <span class="task-panel-title">${role.displayName}</span>
          <span class="raci-badge ${assignment.raci}">${assignment.raci}</span>
        </div>
        <div class="task-list">
          ${roleTasks.map(task => this.renderTaskItem(task))}
        </div>
      </div>
    `;
  }

  private renderCommanderView() {
    const scenario = RACI_SCENARIOS.find(s => s.id === this.scenarioType);
    if (!scenario) return '';

    return html`
      <div class="commander-view">
        ${scenario.assignments.map(assignment => {
          const role = roleContext.getRoleProfile(assignment.role);
          if (!role) return '';

          const roleTasks = this.getRoleTasksForPanel(assignment.role);
          const completedCount = roleTasks.filter(t => t.status === 'completed').length;
          const totalCount = roleTasks.length;

          return html`
            <div class="role-summary-card">
              <div class="role-summary-header">
                <span class="role-summary-emoji">${role.emoji}</span>
                <span class="role-summary-name">${role.displayName}</span>
              </div>
              <div class="role-summary-stats">
                <span>RACI: <span class="raci-badge ${assignment.raci}">${assignment.raci}</span></span>
                <span>任务: ${completedCount}/${totalCount}</span>
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }

  private renderTimeline() {
    const filteredTimeline = this.getFilteredTimeline();

    return html`
      <div class="timeline-section">
        <div class="timeline-header">
          <div class="timeline-title">📅 事件时间线</div>
          <div class="timeline-filter">
            <button
              class="timeline-filter-btn ${this.activeTimelineFilter === 'all' ? 'active' : ''}"
              @click=${() => this.activeTimelineFilter = 'all'}
            >全部</button>
            ${this.currentRole ? html`
              <button
                class="timeline-filter-btn ${this.activeTimelineFilter === this.currentRole ? 'active' : ''}"
                @click=${() => this.activeTimelineFilter = this.currentRole!}
              >当前角色</button>
            ` : ''}
          </div>
        </div>
        <div class="timeline-list">
          ${filteredTimeline.map(event => {
            const role = event.actorRole ? roleContext.getRoleProfile(event.actorRole) : null;
            return html`
              <div class="timeline-item">
                <span class="timeline-emoji">${role?.emoji || '📋'}</span>
                <div class="timeline-content">
                  <div class="timeline-action">${event.type.replace(/_/g, ' ')} ${event.data ? JSON.stringify(event.data) : ''}</div>
                  <div class="timeline-meta">
                    ${event.actor} · ${new Date(event.timestamp).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>
            `;
          })}
          ${filteredTimeline.length === 0 ? html`
            <div style="text-align: center; color: var(--sc-text-tertiary, #64748b); padding: 2rem;">
              暂无时间线记录
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private renderChat() {
    return html`
      <div class="chat-section">
        <div class="chat-header">💬 协作聊天</div>
        <div class="chat-messages">
          ${this.chatMessages.map(message => {
            const role = roleContext.getRoleProfile(message.senderRole);
            return html`
              <div class="chat-message">
                <span class="chat-message-emoji">${role?.emoji || '👤'}</span>
                <div class="chat-message-content">
                  <div class="chat-message-sender">${message.sender}</div>
                  <div class="chat-message-text">${message.content}</div>
                  <div class="chat-message-time">${new Date(message.timestamp).toLocaleString('zh-CN')}</div>
                </div>
              </div>
            `;
          })}
        </div>
        <div class="chat-input-area">
          <textarea
            id="chat-input"
            class="chat-input"
            .value=${this.newMessage}
            @input=${(e: Event) => this.newMessage = (e.target as HTMLTextAreaElement).value}
            @keypress=${(e: KeyboardEvent) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), this.handleSendMessage())}
            placeholder="输入消息..."
            rows="2"
          ></textarea>
          <button class="chat-send-btn" @click=${this.handleSendMessage}>发送</button>
        </div>
      </div>
    `;
  }

  private renderWorkflowSuggestions() {
    return html`
      <div class="workflow-suggestions">
        <div class="workflow-title">💡 工作流建议</div>
        ${this.workflowSuggestions.length > 0 ? html`
          <div class="workflow-list">
            ${this.workflowSuggestions.map(suggestion => html`
              <div class="workflow-card" @click=${() => this.handleWorkflowClick(suggestion.id)}>
                <div class="workflow-card-title">${suggestion.workflowName}</div>
                <div class="workflow-card-desc">${suggestion.description}</div>
                <span class="workflow-card-keyword">关键词: ${suggestion.matchedKeyword}</span>
              </div>
            `)}
          </div>
        ` : html`
          <div style="text-align: center; color: var(--sc-text-tertiary, #64748b); padding: 1rem;">
            在聊天中输入相关关键词（如"隔离"、"分析"、"补丁"）以获取工作流建议
          </div>
        `}
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`<div style="text-align: center; padding: 2rem;">⏳ 加载中...</div>`;
    }

    return html`
      <sc-smart-recommendation-bar></sc-smart-recommendation-bar>
      <div class="war-room-container">
        <div class="page-header">
          <div class="page-title">
            <span>🎯</span>
            War Room
            ${this.eventId ? html`<span class="event-badge">#${this.eventId}</span>` : ''}
          </div>
        </div>

        <div class="raci-overview">
          <sc-raci-matrix-view
            .scenarioType=${this.scenarioType}
            .currentRole=${this.currentRole}
            .compact=${true}
          ></sc-raci-matrix-view>
        </div>

        ${this.renderMobileTaskTabs()}
        ${this.renderMobileTaskPanel()}

        <div class="collaboration-bar">
          <button
            class="ai-trigger-btn"
            @click=${this.handleAITrigger}
            ?disabled=${this.aiTriggering || !this.activeSession}
          >
            ${this.aiTriggering ? '⏳ 分析中...' : '🤖 触发AI分析'}
          </button>
          <div class="collab-phases">
            ${['analyzing', 'consulting', 'deciding', 'synthesizing', 'notifying'].map((phase, i) => {
              const labels = ['R 分析', 'C 咨询', 'A 决策', '汇总', 'I 通知'];
              const currentPhase = this.collaborationStatus?.phase || 'idle';
              const isDone = this.collaborationStatus && ['analyzing', 'consulting', 'deciding', 'synthesizing', 'notifying', 'complete'].indexOf(currentPhase) > i;
              const isActive = currentPhase === phase;
              return html`<div class="collab-phase ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}">${labels[i]}</div>`;
            })}
          </div>
        </div>

        <div class="role-panels">
          ${this.isCommander() ? this.renderCommanderView() : html`
            <div class="task-panels-container">
              ${this.currentRole ? this.renderTaskPanel(this.currentRole) : ''}
            </div>
          `}
        </div>

        <div class="sidebar">
          ${this.renderTimeline()}
        </div>

        <div class="chat-section">
          ${this.renderChat()}
        </div>

        <div class="workflow-suggestions">
          ${this.renderWorkflowSuggestions()}
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

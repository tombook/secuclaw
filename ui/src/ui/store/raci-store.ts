import { BaseStore } from './base-store.js';
import type { RoleId } from './role-context.js';
import { RACI_SCENARIOS, type ScenarioType, type RaciRole } from '../config/raci-matrix.js';
import { gatewayClient } from '../gateway-client.js';

// ── Backend type mirrors (packages/core/src/raci/types.ts) ──────────────────

export type TaskStatus = 'created' | 'assigned' | 'in_progress' | 'pending_handoff' | 'completed' | 'escalated';
export type RaciAssignment = 'R' | 'A' | 'C' | 'I';

export interface RaciTask {
  id: string;
  sessionId: string;
  title: string;
  description?: string;
  scenario: ScenarioType;
  assignedRole: RoleId;
  assignedBy?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  eventId?: string;
  eventType?: 'incident' | 'vulnerability' | 'threat';
  nextRole?: RoleId;
  escalationLevel?: number;
  parentTaskId?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  metadata?: Record<string, unknown>;
}

export interface WarRoomSession {
  id: string;
  title: string;
  scenario: ScenarioType;
  eventId?: string;
  eventType?: 'incident' | 'vulnerability' | 'threat';
  status: 'active' | 'paused' | 'closed';
  participants: Array<{ roleId: RoleId; joinedAt: number; userId?: string }>;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  closedAt?: number;
}

export interface TimelineEvent {
  id: string;
  sessionId: string;
  type: string;
  actor: string;
  actorRole?: RoleId;
  data?: Record<string, unknown>;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  content: string;
  sender: string;
  senderRole: RoleId;
  timestamp: number;
}

// ── Store state ─────────────────────────────────────────────────────────────

export interface RaciStoreState {
  activeScenario: ScenarioType | null;
  loading: boolean;
  /** Currently active War Room session */
  activeSession: WarRoomSession | null;
  /** All sessions the user is part of */
  sessions: WarRoomSession[];
  /** Tasks for the active session */
  tasks: RaciTask[];
  /** Timeline for the active session */
  timeline: TimelineEvent[];
  /** Chat messages for the active session */
  chatMessages: ChatMessage[];
  /** Whether backend is connected */
  connected: boolean;
}

// ── Unsubscribe handles ─────────────────────────────────────────────────────

type UnsubscribeFn = () => void;

class RaciStore extends BaseStore<RaciStoreState> {
  private unsubs: UnsubscribeFn[] = [];

  constructor() {
    super({
      activeScenario: null,
      loading: false,
      activeSession: null,
      sessions: [],
      tasks: [],
      timeline: [],
      chatMessages: [],
      connected: false,
    });
  }

  protected async initialize(): Promise<void> {
    this.setupSubscriptions();
    this.setState({ loading: false });
  }

  // ── WebSocket subscriptions ────────────────────────────────────────────

  private setupSubscriptions(): void {
    // Clean up old subscriptions
    this.unsubs.forEach(fn => fn());
    this.unsubs = [];

    // Connection tracking
    this.unsubs.push(
      gatewayClient.onConnectionChange((connected) => {
        this.setState({ connected });
        if (connected) {
          this.loadSessions();
        }
      })
    );

    // Real-time task events
    const events = [
      'raci.task.created',
      'raci.task.updated',
      'raci.task.assigned',
      'raci.task.handoff',
      'raci.task.escalated',
      'raci.task.completed',
    ];
    for (const event of events) {
      this.unsubs.push(
        gatewayClient.on(event, () => {
          this.refreshActiveSessionTasks();
        })
      );
    }

    // War room session events
    this.unsubs.push(
      gatewayClient.on('warroom.session.updated', () => {
        this.refreshActiveSession();
      })
    );

    this.unsubs.push(
      gatewayClient.on('warroom.timeline', () => {
        this.refreshTimeline();
      })
    );

    this.unsubs.push(
      gatewayClient.on('warroom.message', () => {
        this.refreshChatMessages();
      })
    );
  }

  destroy(): void {
    this.unsubs.forEach(fn => fn());
    this.unsubs = [];
  }

  // ── Session operations ────────────────────────────────────────────────

  async loadSessions(): Promise<void> {
    try {
      const sessions = await gatewayClient.request<WarRoomSession[]>('warroom.listSessions', {});
      this.setState({ sessions: sessions || [] });
    } catch (err) {
      console.error('[RaciStore] loadSessions failed:', err);
    }
  }

  async createSession(params: {
    title: string;
    scenario: ScenarioType;
    eventId?: string;
    eventType?: 'incident' | 'vulnerability' | 'threat';
    createdBy?: string;
    initialParticipants?: Array<{ roleId: RoleId }>;
  }): Promise<WarRoomSession> {
    const session = await gatewayClient.request<WarRoomSession>('warroom.createSession', params);
    await this.loadSessions();
    this.setState({ activeSession: session, activeScenario: session.scenario });
    // Load tasks and timeline for the new session
    await Promise.all([
      this.refreshActiveSessionTasks(),
      this.refreshTimeline(),
      this.refreshChatMessages(),
    ]);
    return session;
  }

  async joinSession(sessionId: string, roleId: RoleId): Promise<void> {
    await gatewayClient.request('warroom.joinSession', { sessionId, roleId });
    await this.refreshActiveSession();
  }

  async leaveSession(sessionId: string, roleId: RoleId): Promise<void> {
    await gatewayClient.request('warroom.leaveSession', { sessionId, roleId });
    await this.refreshActiveSession();
  }

  async closeSession(sessionId: string): Promise<void> {
    await gatewayClient.request('warroom.closeSession', { sessionId });
    await this.refreshActiveSession();
  }

  setActiveSessionById(sessionId: string): void {
    const session = this.getState().sessions.find(s => s.id === sessionId) || null;
    this.setState({
      activeSession: session,
      activeScenario: session?.scenario || null,
      tasks: [],
      timeline: [],
      chatMessages: [],
    });
    if (session) {
      this.refreshActiveSessionTasks();
      this.refreshTimeline();
      this.refreshChatMessages();
    }
  }

  private async refreshActiveSession(): Promise<void> {
    const session = this.getState().activeSession;
    if (!session) return;
    try {
      const updated = await gatewayClient.request<WarRoomSession>('warroom.getSession', { sessionId: session.id });
      this.setState({ activeSession: updated });
    } catch (err) {
      console.error('[RaciStore] refreshActiveSession failed:', err);
    }
  }

  // ── Task operations ───────────────────────────────────────────────────

  async createTask(params: {
    sessionId: string;
    title: string;
    scenario: ScenarioType;
    assignedRole: RoleId;
    assignedBy?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    eventId?: string;
    eventType?: 'incident' | 'vulnerability' | 'threat';
    description?: string;
  }): Promise<RaciTask> {
    const task = await gatewayClient.request<RaciTask>('raci.task.create', params);
    await this.refreshActiveSessionTasks();
    return task;
  }

  async updateTaskStatus(taskId: string, status: TaskStatus, actor: string): Promise<void> {
    await gatewayClient.request('raci.task.updateStatus', { taskId, status, actor });
    await this.refreshActiveSessionTasks();
  }

  async assignTask(taskId: string, role: RoleId, actor?: string): Promise<void> {
    await gatewayClient.request('raci.task.assign', { taskId, role, actor });
    await this.refreshActiveSessionTasks();
  }

  async handoffTask(taskId: string, nextRole: RoleId, actor: string): Promise<void> {
    await gatewayClient.request('raci.task.handoff', { taskId, nextRole, actor });
    await this.refreshActiveSessionTasks();
  }

  async escalateTask(taskId: string, actor: string): Promise<void> {
    await gatewayClient.request('raci.task.escalate', { taskId, actor });
    await this.refreshActiveSessionTasks();
  }

  async createTasksForEvent(eventType: string, eventId: string): Promise<RaciTask[]> {
    const tasks = await gatewayClient.request<RaciTask[]>('raci.task.createForEvent', { eventType, eventId });
    await this.refreshActiveSessionTasks();
    return tasks;
  }

  private async refreshActiveSessionTasks(): Promise<void> {
    const session = this.getState().activeSession;
    if (!session) return;
    try {
      const tasks = await gatewayClient.request<RaciTask[]>('raci.task.list', { sessionId: session.id });
      this.setState({ tasks: tasks || [] });
    } catch (err) {
      console.error('[RaciStore] refreshActiveSessionTasks failed:', err);
    }
  }

  // ── Timeline ──────────────────────────────────────────────────────────

  async refreshTimeline(): Promise<void> {
    const session = this.getState().activeSession;
    if (!session) return;
    try {
      const timeline = await gatewayClient.request<TimelineEvent[]>('warroom.getTimeline', { sessionId: session.id });
      this.setState({ timeline: timeline || [] });
    } catch (err) {
      console.error('[RaciStore] refreshTimeline failed:', err);
    }
  }

  // ── Chat ──────────────────────────────────────────────────────────────

  async sendMessage(sessionId: string, content: string, sender: string, senderRole: RoleId): Promise<void> {
    await gatewayClient.request('warroom.sendMessage', { sessionId, content, sender, senderRole });
    await this.refreshChatMessages();
  }

  async refreshChatMessages(): Promise<void> {
    const session = this.getState().activeSession;
    if (!session) return;
    // Re-fetch timeline — chat messages are stored as timeline events of type 'message'
    try {
      const timeline = await gatewayClient.request<TimelineEvent[]>('warroom.getTimeline', { sessionId: session.id });
      const messages = (timeline || []).filter(e => e.type === 'message');
      this.setState({ chatMessages: messages.map(m => ({
        id: m.id,
        sessionId: m.sessionId,
        content: (m.data?.content as string) || '',
        sender: m.actor,
        senderRole: m.actorRole || ('security-expert' as RoleId),
        timestamp: m.timestamp,
      }))});
    } catch (err) {
      console.error('[RaciStore] refreshChatMessages failed:', err);
    }
  }

  // ── Static RACI matrix helpers (local config, no API needed) ──────────

  getAssignmentsForRole(roleId: RoleId): Array<{
    scenario: ScenarioType;
    scenarioName: string;
    raci: RaciRole;
    tasks: string[];
  }> {
    const assignments: Array<{
      scenario: ScenarioType;
      scenarioName: string;
      raci: RaciRole;
      tasks: string[];
    }> = [];

    for (const scenario of RACI_SCENARIOS) {
      const assignment = scenario.assignments.find(a => a.role === roleId);
      if (assignment) {
        assignments.push({
          scenario: scenario.id,
          scenarioName: scenario.name,
          raci: assignment.raci,
          tasks: assignment.tasks,
        });
      }
    }

    return assignments;
  }

  getAssignmentsForScenario(scenarioType: ScenarioType): Array<{
    role: RoleId;
    raci: RaciRole;
    tasks: string[];
  }> {
    const scenario = RACI_SCENARIOS.find(s => s.id === scenarioType);
    if (!scenario) {
      return [];
    }

    return scenario.assignments.map(assignment => ({
      role: assignment.role,
      raci: assignment.raci,
      tasks: assignment.tasks,
    }));
  }

  getCurrentRaciType(roleId: RoleId, scenarioType: ScenarioType): RaciRole | null {
    const scenario = RACI_SCENARIOS.find(s => s.id === scenarioType);
    if (!scenario) {
      return null;
    }

    const assignment = scenario.assignments.find(a => a.role === roleId);
    return assignment ? assignment.raci : null;
  }

  setActiveScenario(scenarioType: ScenarioType): void {
    const scenario = RACI_SCENARIOS.find(s => s.id === scenarioType);
    if (!scenario) {
      throw new Error(`Invalid scenario type: ${scenarioType}`);
    }

    this.setState({ activeScenario: scenarioType });
  }

  getActiveScenario(): ScenarioType | null {
    return this.getState().activeScenario;
  }

  getAllScenarios(): Array<{
    id: ScenarioType;
    name: string;
    description: string;
  }> {
    return RACI_SCENARIOS.map(scenario => ({
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
    }));
  }

  getScenario(scenarioType: ScenarioType): {
    id: ScenarioType;
    name: string;
    description: string;
  } | null {
    const scenario = RACI_SCENARIOS.find(s => s.id === scenarioType);
    if (!scenario) {
      return null;
    }

    return {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
    };
  }

  getResponsibleRoles(scenarioType: ScenarioType): RoleId[] {
    const scenario = RACI_SCENARIOS.find(s => s.id === scenarioType);
    if (!scenario) {
      return [];
    }

    return scenario.assignments
      .filter(a => a.raci === 'R')
      .map(a => a.role);
  }

  getAccountableRole(scenarioType: ScenarioType): RoleId | null {
    const scenario = RACI_SCENARIOS.find(s => s.id === scenarioType);
    if (!scenario) {
      return null;
    }

    const assignment = scenario.assignments.find(a => a.raci === 'A');
    return assignment ? assignment.role : null;
  }

  getConsultedRoles(scenarioType: ScenarioType): RoleId[] {
    const scenario = RACI_SCENARIOS.find(s => s.id === scenarioType);
    if (!scenario) {
      return [];
    }

    return scenario.assignments
      .filter(a => a.raci === 'C')
      .map(a => a.role);
  }

  getInformedRoles(scenarioType: ScenarioType): RoleId[] {
    const scenario = RACI_SCENARIOS.find(s => s.id === scenarioType);
    if (!scenario) {
      return [];
    }

    return scenario.assignments
      .filter(a => a.raci === 'I')
      .map(a => a.role);
  }
}

export const raciStore = new RaciStore();

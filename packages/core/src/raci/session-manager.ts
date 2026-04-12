import type { JsonStore } from '../storage/json-store.js';
import type { WarRoomSession, TimelineEvent, RoleId, ScenarioType } from './types.js';

export class SessionManager {
  private store: JsonStore;

  constructor(store: JsonStore) {
    this.store = store;
  }

  async createSession(params: {
    title: string;
    scenario: ScenarioType;
    eventId?: string;
    eventType?: 'incident' | 'vulnerability' | 'threat';
    createdBy: string;
    initialParticipants?: Array<{ roleId: RoleId }>;
  }): Promise<WarRoomSession> {
    const sessions = (await this.store.get<WarRoomSession[]>('warroom-sessions.json')) ?? [];
    const session: WarRoomSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      title: params.title,
      scenario: params.scenario,
      eventId: params.eventId,
      eventType: params.eventType,
      status: 'active',
      participants: (params.initialParticipants || []).map(p => ({ roleId: p.roleId, joinedAt: Date.now() })),
      createdBy: params.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    sessions.push(session);
    await this.store.set('warroom-sessions.json', sessions);

    await this.addTimelineEvent({
      sessionId: session.id,
      type: 'session_created',
      actor: params.createdBy,
      data: { title: params.title, scenario: params.scenario },
    });

    return session;
  }

  async getSession(sessionId: string): Promise<WarRoomSession | null> {
    const sessions = (await this.store.get<WarRoomSession[]>('warroom-sessions.json')) ?? [];
    return sessions.find(s => s.id === sessionId) || null;
  }

  async listSessions(filters?: { status?: string; scenario?: string }): Promise<WarRoomSession[]> {
    let sessions = (await this.store.get<WarRoomSession[]>('warroom-sessions.json')) ?? [];
    if (filters?.status) sessions = sessions.filter(s => s.status === filters.status);
    if (filters?.scenario) sessions = sessions.filter(s => s.scenario === filters.scenario);
    return sessions.sort((a, b) => b.createdAt - a.createdAt);
  }

  async joinSession(sessionId: string, roleId: RoleId): Promise<WarRoomSession> {
    const sessions = (await this.store.get<WarRoomSession[]>('warroom-sessions.json')) ?? [];
    const session = sessions.find(s => s.id === sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    if (!session.participants.some(p => p.roleId === roleId)) {
      session.participants.push({ roleId, joinedAt: Date.now() });
    }
    session.updatedAt = Date.now();
    await this.store.set('warroom-sessions.json', sessions);

    await this.addTimelineEvent({
      sessionId,
      type: 'participant_joined',
      actor: roleId,
      actorRole: roleId,
    });

    return session;
  }

  async leaveSession(sessionId: string, roleId: RoleId): Promise<WarRoomSession> {
    const sessions = (await this.store.get<WarRoomSession[]>('warroom-sessions.json')) ?? [];
    const session = sessions.find(s => s.id === sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    session.participants = session.participants.filter(p => p.roleId !== roleId);
    session.updatedAt = Date.now();
    await this.store.set('warroom-sessions.json', sessions);

    await this.addTimelineEvent({
      sessionId,
      type: 'participant_left',
      actor: roleId,
      actorRole: roleId,
    });

    return session;
  }

  async closeSession(sessionId: string): Promise<WarRoomSession> {
    const sessions = (await this.store.get<WarRoomSession[]>('warroom-sessions.json')) ?? [];
    const session = sessions.find(s => s.id === sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    session.status = 'closed';
    session.closedAt = Date.now();
    session.updatedAt = Date.now();
    await this.store.set('warroom-sessions.json', sessions);

    await this.addTimelineEvent({
      sessionId,
      type: 'session_closed',
      actor: 'system',
    });

    return session;
  }

  async getTimeline(sessionId: string): Promise<TimelineEvent[]> {
    const events = (await this.store.get<TimelineEvent[]>('warroom-timeline.json')) ?? [];
    return events.filter(e => e.sessionId === sessionId).sort((a, b) => a.timestamp - b.timestamp);
  }

  async addTimelineEvent(event: Omit<TimelineEvent, 'id' | 'timestamp'>): Promise<TimelineEvent> {
    const events = (await this.store.get<TimelineEvent[]>('warroom-timeline.json')) ?? [];
    const newEvent: TimelineEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
    };
    events.push(newEvent);
    await this.store.set('warroom-timeline.json', events);
    return newEvent;
  }

  async sendMessage(sessionId: string, content: string, sender: string, senderRole: RoleId): Promise<TimelineEvent> {
    return this.addTimelineEvent({
      sessionId,
      type: 'message',
      actor: sender,
      actorRole: senderRole,
      data: { content },
    });
  }
}

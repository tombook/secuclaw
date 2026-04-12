import type { JsonStore } from '../storage/json-store.js';
import type { WarRoomSession, TimelineEvent, RoleId, ScenarioType } from './types.js';

const SESSIONS_FILE = 'warroom-sessions.json';
const TIMELINE_FILE = 'warroom-timeline.json';

export class SessionRepository {
  constructor(private store: JsonStore) {}

  async getAllSessions(): Promise<WarRoomSession[]> {
    return (await this.store.get<WarRoomSession[]>(SESSIONS_FILE)) ?? [];
  }

  async getSessionById(id: string): Promise<WarRoomSession | null> {
    const sessions = await this.getAllSessions();
    return sessions.find(s => s.id === id) || null;
  }

  async getActiveSessions(): Promise<WarRoomSession[]> {
    const sessions = await this.getAllSessions();
    return sessions.filter(s => s.status === 'active');
  }

  async createSession(session: Omit<WarRoomSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<WarRoomSession> {
    const sessions = await this.getAllSessions();
    const newSession: WarRoomSession = {
      ...session,
      id: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    sessions.push(newSession);
    await this.store.set(SESSIONS_FILE, sessions);
    return newSession;
  }

  async updateSession(id: string, updates: Partial<WarRoomSession>): Promise<WarRoomSession | null> {
    const sessions = await this.getAllSessions();
    const index = sessions.findIndex(s => s.id === id);
    if (index === -1) return null;
    sessions[index] = { ...sessions[index], ...updates, updatedAt: Date.now() };
    await this.store.set(SESSIONS_FILE, sessions);
    return sessions[index];
  }

  async addParticipant(sessionId: string, participant: { roleId: RoleId; joinedAt: number; userId?: string }): Promise<WarRoomSession | null> {
    const sessions = await this.getAllSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return null;
    if (!session.participants.some(p => p.roleId === participant.roleId)) {
      session.participants.push(participant);
    }
    session.updatedAt = Date.now();
    await this.store.set(SESSIONS_FILE, sessions);
    return session;
  }

  async removeParticipant(sessionId: string, roleId: RoleId): Promise<WarRoomSession | null> {
    const sessions = await this.getAllSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return null;
    session.participants = session.participants.filter(p => p.roleId !== roleId);
    session.updatedAt = Date.now();
    await this.store.set(SESSIONS_FILE, sessions);
    return session;
  }

  async getAllTimeline(): Promise<TimelineEvent[]> {
    return (await this.store.get<TimelineEvent[]>(TIMELINE_FILE)) ?? [];
  }

  async getTimeline(sessionId: string): Promise<TimelineEvent[]> {
    const events = await this.getAllTimeline();
    return events.filter(e => e.sessionId === sessionId).sort((a, b) => a.timestamp - b.timestamp);
  }

  async addTimelineEvent(event: Omit<TimelineEvent, 'id' | 'timestamp'>): Promise<TimelineEvent> {
    const events = await this.getAllTimeline();
    const newEvent: TimelineEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
    };
    events.push(newEvent);
    await this.store.set(TIMELINE_FILE, events);
    return newEvent;
  }
}

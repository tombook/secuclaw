import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type ReplayEventType =
  | 'observe'
  | 'think'
  | 'think_prompt'
  | 'think_response'
  | 'act_decision'
  | 'act_execute'
  | 'act_result'
  | 'verify'
  | 'approve'
  | 'reject'
  | 'escalate'
  | 'rollback'
  | 'error'
  | 'info';

export interface ReplayEvent {
  id: string;
  loopId: string;
  type: ReplayEventType;
  timestamp: number;
  actor: 'agent' | 'human' | 'system';
  data: Record<string, unknown>;
  durationMs: number;
  parentEventId: string | null;
  metadata: { autonomyLevel: string; phase: string; sessionId?: string };
}

export interface ReplayTrace {
  id: string;
  loopId: string;
  events: ReplayEvent[];
  startedAt: number;
  completedAt: number | null;
  totalDurationMs: number;
  outcome: 'success' | 'partial' | 'failed' | 'cancelled' | null;
  summary: {
    observeCount: number;
    thinkCount: number;
    actCount: number;
    verifyCount: number;
    approvalCount: number;
    errorCount: number;
  };
}

export interface ReplaySession {
  id: string;
  trace: ReplayTrace;
  replaySpeed: number;
  currentPosition: number;
  status: 'playing' | 'paused' | 'stopped' | 'complete';
  subscribers: Array<{ id: string; callback: (event: ReplayEvent) => void }>;
}

const TRACES_KEY = 'agent-replay/traces.json';
const SESSIONS_KEY = 'agent-replay/sessions.json';

export class AgentReplayLogger {
  private activeTraces: Map<string, ReplayTrace> = new Map();
  private activeSessions: Map<string, ReplaySession> = new Map();
  private replayTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor(private store: JsonStore) {}

  startTrace(
    loopId: string,
    metadata?: Record<string, unknown>,
  ): ReplayTrace {
    const now = Date.now();
    const trace: ReplayTrace = {
      id: this.generateId(),
      loopId,
      events: [],
      startedAt: now,
      completedAt: null,
      totalDurationMs: 0,
      outcome: null,
      summary: {
        observeCount: 0,
        thinkCount: 0,
        actCount: 0,
        verifyCount: 0,
        approvalCount: 0,
        errorCount: 0,
      },
    };

    this.activeTraces.set(loopId, trace);

    if (metadata) {
      this.logEvent(loopId, 'info', metadata, 'system');
    }

    return trace;
  }

  logEvent(
    loopId: string,
    type: ReplayEventType,
    data: Record<string, unknown>,
    actor: ReplayEvent['actor'] = 'agent',
    parentEventId?: string,
  ): ReplayEvent {
    const trace = this.activeTraces.get(loopId);
    if (!trace) {
      throw new Error(`No active trace for loopId: ${loopId}`);
    }

    const now = Date.now();
    const lastEvent = trace.events[trace.events.length - 1];
    const durationMs = lastEvent ? now - lastEvent.timestamp : 0;

    const event: ReplayEvent = {
      id: this.generateId(),
      loopId,
      type,
      timestamp: now,
      actor,
      data,
      durationMs,
      parentEventId: parentEventId ?? null,
      metadata: {
        autonomyLevel: (data.autonomyLevel as string) ?? 'unknown',
        phase: (data.phase as string) ?? type,
        sessionId: data.sessionId as string | undefined,
      },
    };

    trace.events.push(event);
    trace.summary = this.buildSummary(trace.events);

    return event;
  }

  async endTrace(
    loopId: string,
    outcome: ReplayTrace['outcome'],
  ): Promise<ReplayTrace> {
    const trace = this.activeTraces.get(loopId);
    if (!trace) {
      throw new Error(`No active trace for loopId: ${loopId}`);
    }

    const now = Date.now();
    trace.completedAt = now;
    trace.totalDurationMs = now - trace.startedAt;
    trace.outcome = outcome;

    const traces = await this.loadTraces();
    traces.push(trace);
    await this.store.set(TRACES_KEY, traces);

    this.activeTraces.delete(loopId);

    return trace;
  }

  async getTrace(traceId: string): Promise<ReplayTrace | null> {
    for (const trace of this.activeTraces.values()) {
      if (trace.id === traceId) return trace;
    }

    const traces = await this.loadTraces();
    return traces.find((t) => t.id === traceId) ?? null;
  }

  async getTraceByLoopId(loopId: string): Promise<ReplayTrace | null> {
    const active = this.activeTraces.get(loopId);
    if (active) return active;

    const traces = await this.loadTraces();
    return traces.find((t) => t.loopId === loopId) ?? null;
  }

  async listTraces(
    filters?: {
      outcome?: string;
      since?: number;
      limit?: number;
    },
  ): Promise<ReplayTrace[]> {
    const traces = await this.loadTraces();
    let result = [...traces];

    if (filters?.outcome) {
      result = result.filter((t) => t.outcome === filters.outcome);
    }

    if (filters?.since) {
      result = result.filter((t) => t.startedAt >= filters.since!);
    }

    result.sort((a, b) => b.startedAt - a.startedAt);

    if (filters?.limit) {
      result = result.slice(0, filters.limit);
    }

    return result;
  }

  async getTraceSummary(
    traceId: string,
  ): Promise<ReplayTrace['summary'] | null> {
    const trace = await this.getTrace(traceId);
    return trace?.summary ?? null;
  }

  async exportTrace(
    traceId: string,
    format: 'json' | 'markdown' | 'timeline',
  ): Promise<string> {
    const trace = await this.getTrace(traceId);
    if (!trace) {
      throw new Error(`Trace not found: ${traceId}`);
    }

    switch (format) {
      case 'json':
        return JSON.stringify(trace, null, 2);
      case 'markdown':
        return this.formatAsMarkdown(trace);
      case 'timeline':
        return this.formatAsTimeline(trace);
    }
  }

  replay(
    traceId: string,
    options?: { speed?: number; fromEvent?: number },
  ): ReplaySession {
    const traces = Array.from(this.activeTraces.values());
    let trace: ReplayTrace | undefined;

    for (const t of traces) {
      if (t.id === traceId) {
        trace = t;
        break;
      }
    }

    if (!trace) {
      throw new Error(
        `Trace not found for replay: ${traceId}. Load it first via getTrace().`,
      );
    }

    const session: ReplaySession = {
      id: this.generateId(),
      trace: structuredClone(trace),
      replaySpeed: options?.speed ?? 1,
      currentPosition: options?.fromEvent ?? 0,
      status: 'playing',
      subscribers: [],
    };

    this.activeSessions.set(session.id, session);
    this.persistSessions();
    this.runReplay(session.id);

    return session;
  }

  pauseReplay(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.status = 'paused';
    const timer = this.replayTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.replayTimers.delete(sessionId);
    }

    this.persistSessions();
  }

  resumeReplay(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'paused') return;

    session.status = 'playing';
    this.persistSessions();
    this.runReplay(sessionId);
  }

  stopReplay(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.status = 'stopped';
    const timer = this.replayTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.replayTimers.delete(sessionId);
    }

    this.activeSessions.delete(sessionId);
    this.persistSessions();
  }

  subscribeToReplay(
    sessionId: string,
    callback: (event: ReplayEvent) => void,
  ): string {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const subscriberId = this.generateId();
    session.subscribers.push({ id: subscriberId, callback });
    return subscriberId;
  }

  unsubscribeFromReplay(sessionId: string, subscriberId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.subscribers = session.subscribers.filter(
      (s) => s.id !== subscriberId,
    );
  }

  async getAgentAuditStats(): Promise<{
    totalTraces: number;
    byOutcome: Record<string, number>;
    avgDurationMs: number;
    avgEventsPerTrace: number;
    errorRate: number;
  }> {
    const traces = await this.loadTraces();
    const allTraces = [...traces, ...Array.from(this.activeTraces.values())];
    const totalTraces = allTraces.length;

    if (totalTraces === 0) {
      return {
        totalTraces: 0,
        byOutcome: {},
        avgDurationMs: 0,
        avgEventsPerTrace: 0,
        errorRate: 0,
      };
    }

    const byOutcome: Record<string, number> = {};
    let totalDuration = 0;
    let totalEvents = 0;
    let errorTraces = 0;

    for (const trace of allTraces) {
      const outcome = trace.outcome ?? 'unknown';
      byOutcome[outcome] = (byOutcome[outcome] ?? 0) + 1;
      totalDuration += trace.totalDurationMs;
      totalEvents += trace.events.length;
      if (trace.outcome === 'failed') errorTraces++;
    }

    return {
      totalTraces,
      byOutcome,
      avgDurationMs: Math.round(totalDuration / totalTraces),
      avgEventsPerTrace: Math.round(totalEvents / totalTraces),
      errorRate: errorTraces / totalTraces,
    };
  }

  private buildSummary(events: ReplayEvent[]): ReplayTrace['summary'] {
    return {
      observeCount: events.filter((e) => e.type === 'observe').length,
      thinkCount: events.filter(
        (e) =>
          e.type === 'think' ||
          e.type === 'think_prompt' ||
          e.type === 'think_response',
      ).length,
      actCount: events.filter(
        (e) =>
          e.type === 'act_decision' ||
          e.type === 'act_execute' ||
          e.type === 'act_result',
      ).length,
      verifyCount: events.filter((e) => e.type === 'verify').length,
      approvalCount: events.filter(
        (e) => e.type === 'approve' || e.type === 'reject',
      ).length,
      errorCount: events.filter((e) => e.type === 'error').length,
    };
  }

  private formatAsMarkdown(trace: ReplayTrace): string {
    const lines: string[] = [];
    lines.push(`# Agent Replay Trace`);
    lines.push(``);
    lines.push(`**Trace ID:** ${trace.id}`);
    lines.push(`**Loop ID:** ${trace.loopId}`);
    lines.push(`**Outcome:** ${trace.outcome ?? 'in-progress'}`);
    lines.push(
      `**Duration:** ${trace.totalDurationMs}ms (${(trace.totalDurationMs / 1000).toFixed(2)}s)`,
    );
    lines.push(
      `**Started:** ${new Date(trace.startedAt).toISOString()}`,
    );
    if (trace.completedAt) {
      lines.push(
        `**Completed:** ${new Date(trace.completedAt).toISOString()}`,
      );
    }
    lines.push(``);
    lines.push(`## Summary`);
    lines.push(``);
    lines.push(`| Metric | Count |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Observe | ${trace.summary.observeCount} |`);
    lines.push(`| Think | ${trace.summary.thinkCount} |`);
    lines.push(`| Act | ${trace.summary.actCount} |`);
    lines.push(`| Verify | ${trace.summary.verifyCount} |`);
    lines.push(`| Approvals | ${trace.summary.approvalCount} |`);
    lines.push(`| Errors | ${trace.summary.errorCount} |`);
    lines.push(``);
    lines.push(`## Events`);
    lines.push(``);

    for (let i = 0; i < trace.events.length; i++) {
      const e = trace.events[i];
      lines.push(`### ${i + 1}. [${e.type}] ${e.actor}`);
      lines.push(``);
      lines.push(`- **Time:** ${new Date(e.timestamp).toISOString()}`);
      lines.push(`- **Duration:** ${e.durationMs}ms`);
      if (e.parentEventId) {
        lines.push(`- **Parent:** ${e.parentEventId}`);
      }
      lines.push(
        `- **Autonomy:** ${e.metadata.autonomyLevel} | **Phase:** ${e.metadata.phase}`,
      );
      lines.push(``);
      const dataStr = JSON.stringify(e.data, null, 2);
      const truncated =
        dataStr.length > 500 ? dataStr.slice(0, 500) + '...' : dataStr;
      lines.push('```json');
      lines.push(truncated);
      lines.push('```');
      lines.push(``);
    }

    return lines.join('\n');
  }

  private formatAsTimeline(trace: ReplayTrace): string {
    const lines: string[] = [];
    const startTime = trace.startedAt;

    lines.push(`TRACE ${trace.id} [${trace.outcome ?? 'running'}]`);
    lines.push(
      `  Loop: ${trace.loopId} | Duration: ${trace.totalDurationMs}ms`,
    );
    lines.push(``);

    for (let i = 0; i < trace.events.length; i++) {
      const e = trace.events[i];
      const offset = ((e.timestamp - startTime) / 1000).toFixed(3);
      const indent = e.parentEventId ? '    ' : '  ';
      const marker =
        e.type === 'error'
          ? '✕'
          : e.type === 'approve'
            ? '✓'
            : e.type === 'reject'
              ? '✗'
              : '●';

      lines.push(
        `${marker} +${offset}s [${e.type}] <${e.actor}> ${this.truncateData(e.data)}`,
      );

      if (e.durationMs > 100) {
        lines.push(
          `${indent}  └─ ${e.durationMs}ms (${(e.durationMs / 1000).toFixed(2)}s)`,
        );
      }
    }

    lines.push(``);
    lines.push(
      `Events: ${trace.events.length} | Observe: ${trace.summary.observeCount} | Think: ${trace.summary.thinkCount} | Act: ${trace.summary.actCount} | Verify: ${trace.summary.verifyCount} | Errors: ${trace.summary.errorCount}`,
    );

    return lines.join('\n');
  }

  private truncateData(data: Record<string, unknown>): string {
    const str = JSON.stringify(data);
    if (str.length > 120) {
      return str.slice(0, 117) + '...';
    }
    return str;
  }

  private generateId(): string {
    return randomUUID();
  }

  private async loadTraces(): Promise<ReplayTrace[]> {
    const raw = await this.store.get(TRACES_KEY);
    if (!raw) return [];
    return raw as ReplayTrace[];
  }

  private async persistSessions(): Promise<void> {
    const sessions = Array.from(this.activeSessions.values()).map((s) => ({
      id: s.id,
      trace: s.trace,
      replaySpeed: s.replaySpeed,
      currentPosition: s.currentPosition,
      status: s.status,
      subscribers: [],
    }));
    await this.store.set(SESSIONS_KEY, sessions);
  }

  private runReplay(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'playing') return;

    if (session.currentPosition >= session.trace.events.length) {
      session.status = 'complete';
      this.persistSessions();
      return;
    }

    const event = session.trace.events[session.currentPosition];

    for (const subscriber of session.subscribers) {
      try {
        subscriber.callback(event);
      } catch {
        // swallow subscriber errors
      }
    }

    session.currentPosition++;

    if (session.replaySpeed === 0) {
      this.runReplay(sessionId);
      return;
    }

    const nextEvent = session.trace.events[session.currentPosition];
    if (!nextEvent) {
      session.status = 'complete';
      this.persistSessions();
      return;
    }

    const delay = Math.max(
      10,
      (nextEvent.timestamp - event.timestamp) / session.replaySpeed,
    );

    const timer = setTimeout(() => {
      this.replayTimers.delete(sessionId);
      this.runReplay(sessionId);
    }, delay);

    this.replayTimers.set(sessionId, timer);
  }
}

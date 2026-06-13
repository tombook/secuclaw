import type { JsonStore } from '../storage/json-store.js';
import { randomUUID, createHash } from 'crypto';

export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'permission_grant' | 'permission_revoke' | 'data_export' | 'data_access' | 'config_change' | 'system_event' | 'security_event' | 'compliance_violation' | 'admin_action' | 'failure';
export type AuditOutcome = 'success' | 'failure' | 'denied' | 'error' | 'partial';
export type AuditSeverity = 'debug' | 'info' | 'notice' | 'warning' | 'error' | 'critical' | 'alert' | 'emergency';

export interface AuditEntry {
  id: string;
  timestamp: number;
  tenantId: string;
  actorId: string;
  actorType: 'user' | 'service' | 'system' | 'api_key' | 'admin';
  actorIp: string | null;
  actorUserAgent: string | null;
  action: AuditAction;
  resource: string;
  resourceId: string | null;
  outcome: AuditOutcome;
  severity: AuditSeverity;
  description: string;
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  changes: Array<{ field: string; before: any; after: any }>;
  requestId: string | null;
  sessionId: string | null;
  metadata: Record<string, any>;
  tags: string[];
  hash: string;
  prevHash: string | null;
}

export interface AuditStats {
  totalEntries: number;
  bySeverity: Record<AuditSeverity, number>;
  byAction: Record<AuditAction, number>;
  byOutcome: Record<AuditOutcome, number>;
  byActor: Record<string, number>;
  uniqueActors: number;
  totalTamperAttempts: number;
  verifiedChain: boolean;
  oldestEntry: number | null;
  newestEntry: number | null;
  retentionDays: number;
  storageSizeMb: number;
}

const STORE_KEYS = {
  entries: 'audit/entries.json',
  chain: 'audit/chain.json',
};

const HISTORY_LIMIT = 100000;
const SEVERITIES: AuditSeverity[] = ['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'];
const ACTIONS: AuditAction[] = ['create', 'read', 'update', 'delete', 'login', 'logout', 'permission_grant', 'permission_revoke', 'data_export', 'data_access', 'config_change', 'system_event', 'security_event', 'compliance_violation', 'admin_action', 'failure'];
const OUTCOMES: AuditOutcome[] = ['success', 'failure', 'denied', 'error', 'partial'];

function emptySeverityMap(): Record<AuditSeverity, number> {
  return { debug: 0, info: 0, notice: 0, warning: 0, error: 0, critical: 0, alert: 0, emergency: 0 };
}
function emptyActionMap(): Record<AuditAction, number> {
  return { create: 0, read: 0, update: 0, delete: 0, login: 0, logout: 0, permission_grant: 0, permission_revoke: 0, data_export: 0, data_access: 0, config_change: 0, system_event: 0, security_event: 0, compliance_violation: 0, admin_action: 0, failure: 0 };
}
function emptyOutcomeMap(): Record<AuditOutcome, number> {
  return { success: 0, failure: 0, denied: 0, error: 0, partial: 0 };
}

export class AuditLogger {
  private lastHash: string | null = null;

  constructor(private store: JsonStore) {}

  async log(params: { tenantId: string; actorId: string; actorType: AuditEntry['actorType']; actorIp?: string; actorUserAgent?: string; action: AuditAction; resource: string; resourceId?: string; outcome: AuditOutcome; severity: AuditSeverity; description: string; before?: Record<string, any>; after?: Record<string, any>; requestId?: string; sessionId?: string; metadata?: Record<string, any>; tags?: string[] }): Promise<AuditEntry> {
    if (!SEVERITIES.includes(params.severity)) throw new Error('invalid severity');
    if (!ACTIONS.includes(params.action)) throw new Error('invalid action');
    if (!OUTCOMES.includes(params.outcome)) throw new Error('invalid outcome');
    const all = await this.loadEntries();
    if (!this.lastHash) this.lastHash = await this.getLastHash(all);
    const changes = this.computeChanges(params.before, params.after);
    const entry: AuditEntry = {
      id: this.generateId('aud'),
      timestamp: Date.now(),
      tenantId: params.tenantId,
      actorId: params.actorId,
      actorType: params.actorType,
      actorIp: params.actorIp || null,
      actorUserAgent: params.actorUserAgent || null,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId || null,
      outcome: params.outcome,
      severity: params.severity,
      description: params.description,
      before: params.before || null,
      after: params.after || null,
      changes,
      requestId: params.requestId || null,
      sessionId: params.sessionId || null,
      metadata: params.metadata || {},
      tags: params.tags || [],
      hash: '',
      prevHash: this.lastHash,
    };
    entry.hash = this.hashEntry(entry);
    all.push(entry);
    if (all.length > HISTORY_LIMIT) all.splice(0, all.length - HISTORY_LIMIT);
    await this.store.set(STORE_KEYS.entries, all);
    this.lastHash = entry.hash;
    return entry;
  }

  async query(filter: { tenantId?: string; actorId?: string; action?: AuditAction; resource?: string; severity?: AuditSeverity; outcome?: AuditOutcome; since?: number; until?: number; tags?: string[]; limit?: number }): Promise<AuditEntry[]> {
    let entries = await this.loadEntries();
    if (filter.tenantId) entries = entries.filter((e) => e.tenantId === filter.tenantId);
    if (filter.actorId) entries = entries.filter((e) => e.actorId === filter.actorId);
    if (filter.action) entries = entries.filter((e) => e.action === filter.action);
    if (filter.resource) entries = entries.filter((e) => e.resource === filter.resource);
    if (filter.severity) entries = entries.filter((e) => e.severity === filter.severity);
    if (filter.outcome) entries = entries.filter((e) => e.outcome === filter.outcome);
    if (filter.since !== undefined) entries = entries.filter((e) => e.timestamp >= filter.since!);
    if (filter.until !== undefined) entries = entries.filter((e) => e.timestamp <= filter.until!);
    if (filter.tags && filter.tags.length > 0) entries = entries.filter((e) => filter.tags!.some((t) => e.tags.includes(t)));
    entries.sort((a, b) => b.timestamp - a.timestamp);
    if (filter.limit !== undefined) entries = entries.slice(0, filter.limit);
    return entries;
  }

  async verifyChain(tenantId?: string): Promise<{ valid: boolean; brokenAt: number | null; checked: number }> {
    const entries = await this.loadEntries();
    const filtered = tenantId ? entries.filter((e) => e.tenantId === tenantId) : entries;
    let prev: string | null = null;
    let checked = 0;
    for (const e of filtered) {
      if (e.prevHash !== prev) return { valid: false, brokenAt: e.id, checked };
      const { hash: _, ...rest } = e;
      const expected = this.hashEntry(rest);
      if (expected !== e.hash) return { valid: false, brokenAt: e.id, checked };
      prev = e.hash;
      checked++;
    }
    return { valid: true, brokenAt: null, checked };
  }

  async export(tenantId: string, format: 'json' | 'csv' | 'siem' = 'json'): Promise<string> {
    const entries = await this.query({ tenantId, limit: HISTORY_LIMIT });
    if (format === 'json') return JSON.stringify(entries, null, 2);
    if (format === 'csv') {
      const headers = ['id', 'timestamp', 'actorId', 'action', 'resource', 'outcome', 'severity', 'description'];
      const rows = entries.map((e) => [e.id, new Date(e.timestamp).toISOString(), e.actorId, e.action, e.resource, e.outcome, e.severity, e.description.replace(/"/g, '""')]);
      return [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    }
    return entries.map((e) => JSON.stringify({ ...e, siem: 'secuclaw' })).join('\n');
  }

  async getStats(tenantId?: string): Promise<AuditStats> {
    let entries = await this.loadEntries();
    if (tenantId) entries = entries.filter((e) => e.tenantId === tenantId);
    const bySeverity = emptySeverityMap();
    const byAction = emptyActionMap();
    const byOutcome = emptyOutcomeMap();
    const byActor: Record<string, number> = {};
    for (const e of entries) {
      bySeverity[e.severity]++;
      byAction[e.action]++;
      byOutcome[e.outcome]++;
      byActor[e.actorId] = (byActor[e.actorId] || 0) + 1;
    }
    const verification = await this.verifyChain(tenantId);
    return {
      totalEntries: entries.length,
      bySeverity,
      byAction,
      byOutcome,
      byActor,
      uniqueActors: Object.keys(byActor).length,
      totalTamperAttempts: 0,
      verifiedChain: verification.valid,
      oldestEntry: entries.length > 0 ? entries[0].timestamp : null,
      newestEntry: entries.length > 0 ? entries[entries.length - 1].timestamp : null,
      retentionDays: 365,
      storageSizeMb: Math.round((JSON.stringify(entries).length / 1024 / 1024) * 100) / 100,
    };
  }

  private async getLastHash(entries: AuditEntry[]): Promise<string | null> {
    if (entries.length === 0) return null;
    return entries[entries.length - 1].hash;
  }

  private hashEntry(entry: Omit<AuditEntry, 'hash'>): string {
    const payload = JSON.stringify({ id: entry.id, timestamp: entry.timestamp, tenantId: entry.tenantId, actorId: entry.actorId, action: entry.action, resource: entry.resource, resourceId: entry.resourceId, outcome: entry.outcome, severity: entry.severity, description: entry.description, prevHash: entry.prevHash });
    return createHash('sha256').update(payload).digest('hex');
  }

  private computeChanges(before: Record<string, any> | null | undefined, after: Record<string, any> | null | undefined): Array<{ field: string; before: any; after: any }> {
    if (!before || !after) return [];
    const changes: Array<{ field: string; before: any; after: any }> = [];
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const k of keys) {
      if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
        changes.push({ field: k, before: before[k], after: after[k] });
      }
    }
    return changes;
  }

  private async loadEntries(): Promise<AuditEntry[]> {
    return (await this.store.get<AuditEntry[]>(STORE_KEYS.entries)) || [];
  }

  private generateId(prefix: string): string {
    return `${prefix}_${randomUUID()}`;
  }
}

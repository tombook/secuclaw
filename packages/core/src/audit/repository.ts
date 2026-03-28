import type { JsonStore } from '../storage/json-store.js';
import type { AuditLogEntry, AuditLogQuery, AuditResource, AuditLogStats } from './types.js';

const FILE_NAME = 'audit-logs.json';

export class AuditLogRepository {
  constructor(private store: JsonStore) {}

  async getAll(): Promise<AuditLogEntry[]> {
    const data = await this.store.get<AuditLogEntry[]>(FILE_NAME);
    return data || [];
  }

  async add(entry: AuditLogEntry): Promise<void> {
    const entries = await this.getAll();
    entries.push(entry);
    // Keep only last 10000 entries to prevent unbounded growth
    if (entries.length > 10000) {
      entries.splice(0, entries.length - 10000);
    }
    await this.store.set(FILE_NAME, entries);
  }

  async query(params: AuditLogQuery): Promise<AuditLogEntry[]> {
    let entries = await this.getAll();

    if (params.action) {
      entries = entries.filter(e => e.action === params.action);
    }
    if (params.resource) {
      entries = entries.filter(e => e.resource === params.resource);
    }
    if (params.resourceId) {
      entries = entries.filter(e => e.resourceId === params.resourceId);
    }
    if (params.actor) {
      entries = entries.filter(e => e.actor === params.actor);
    }
    if (params.fromTimestamp) {
      entries = entries.filter(e => e.timestamp >= params.fromTimestamp!);
    }
    if (params.toTimestamp) {
      entries = entries.filter(e => e.timestamp <= params.toTimestamp!);
    }

    // Sort by timestamp descending
    entries = entries.sort((a, b) => b.timestamp - a.timestamp);

    // Pagination
    if (params.page !== undefined && params.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      entries = entries.slice(start, start + params.pageSize);
    }

    return entries;
  }

  async getStats(): Promise<AuditLogStats> {
    const entries = await this.getAll();

    const byAction: Record<string, number> = {};
    const byResource: Record<string, number> = {};
    const byActor: Record<string, number> = {};

    for (const e of entries) {
      byAction[e.action] = (byAction[e.action] || 0) + 1;
      byResource[e.resource] = (byResource[e.resource] || 0) + 1;
      byActor[e.actor] = (byActor[e.actor] || 0) + 1;
    }

    const recentActivity = [...entries].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
    return {
      total: entries.length,
      byAction,
      byResource,
      byActor,
      recentActivity,
    };
  }

  async getByResource(resource: AuditResource, resourceId: string): Promise<AuditLogEntry[]> {
    const entries = await this.getAll();
    return entries.filter(e => e.resource === resource && e.resourceId === resourceId);
  }
}

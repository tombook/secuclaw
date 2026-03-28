import { AuditLogRepository } from './repository.js';
import type { AuditLogEntry, AuditAction, AuditResource, AuditLogQuery, AuditLogStats } from './types.js';

export class AuditLogService {
  constructor(private repo: AuditLogRepository) {}

  async log(params: {
    action: AuditAction;
    resource: AuditResource;
    resourceId: string;
    actor: string;
    details?: Record<string, unknown>;
    previousValue?: unknown;
    newValue?: unknown;
  }): Promise<AuditLogEntry> {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      actor: params.actor,
      timestamp: Date.now(),
      details: params.details,
      previousValue: params.previousValue,
      newValue: params.newValue,
    };
    await this.repo.add(entry);
    return entry;
  }

  async query(params: AuditLogQuery): Promise<AuditLogEntry[]> {
    return this.repo.query(params);
  }

  async getStats(): Promise<AuditLogStats> {
    return this.repo.getStats();
  }

  async getByResource(resource: AuditResource, resourceId: string): Promise<AuditLogEntry[]> {
    return this.repo.getByResource(resource, resourceId);
  }

  async getResourceHistory(resource: AuditResource, resourceId: string): Promise<AuditLogEntry[]> {
    const entries = await this.getByResource(resource, resourceId);
    return entries.sort((a, b) => b.timestamp - a.timestamp);
  }
}

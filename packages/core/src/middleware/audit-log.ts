import { AuditLogService } from '../audit/service.js';
import { AuditLogRepository } from '../audit/repository.js';
import type { AuditAction, AuditResource } from '../audit/types.js';
import type { JsonStore } from '../storage/json-store.js';

type Handler = (params: Record<string, unknown>) => Promise<unknown>;

const METHOD_ACTION_MAP: Record<string, AuditAction> = {
  create: 'create',
  update: 'update',
  delete: 'delete',
  updateStatus: 'status_change',
  activateRole: 'configure',
  deactivateRole: 'configure',
  bindLLM: 'configure',
  configure: 'configure',
  save: 'configure',
  add: 'create',
  execute: 'execute',
  approve: 'approval',
  assign: 'assign',
  acknowledge: 'update',
  resolve: 'update',
  send: 'execute',
  list: 'export',
};

const DOMAIN_RESOURCE_MAP: Record<string, AuditResource> = {
  incidents: 'incident',
  vulnerabilities: 'vulnerability',
  threats: 'threat',
  compliance: 'compliance',
  assets: 'asset',
  capabilities: 'capability',
  commander: 'commander',
  channels: 'channel',
  llm: 'llm_provider',
  auth: 'user',
  roles: 'role',
  users: 'user',
  kpi: 'system',
  ai: 'system',
  skills: 'system',
  knowledge: 'system',
  aiExperts: 'system',
};

export class AuditLogMiddleware {
  private auditService: AuditLogService | null = null;
  private enabled = true;

  constructor(private jsonStore: JsonStore) {}

  private getService(): AuditLogService {
    if (!this.auditService) {
      const repo = new AuditLogRepository(this.jsonStore);
      this.auditService = new AuditLogService(repo);
    }
    return this.auditService;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  wrap(method: string, handler: Handler): Handler {
    return async (params: Record<string, unknown>) => {
      const result = await handler(params);

      if (this.enabled) {
        this.recordAudit(method, params, result).catch(() => {});
      }

      return result;
    };
  }

  private async recordAudit(
    method: string,
    params: Record<string, unknown>,
    _result: unknown,
  ): Promise<void> {
    const [domain, action] = method.split('.');
    if (!domain || !action) return;

    const auditAction = METHOD_ACTION_MAP[action];
    const resource = DOMAIN_RESOURCE_MAP[domain];
    if (!auditAction || !resource) return;

    const user = params._user as { userId?: string; username?: string } | undefined;
    const actor = user?.username ?? (params.user as string) ?? 'system';
    const resourceId = (params.id as string) ?? (params.resourceId as string) ?? method;

    try {
      await this.getService().log({
        action: auditAction,
        resource,
        resourceId,
        actor,
        details: { method, params: sanitizeParams(params) },
      });
    } catch {
      // Audit logging must not break the request
    }
  }
}

function sanitizeParams(params: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = new Set(['password', 'apiKey', 'token', 'secret', 'authorization']);

  for (const [key, value] of Object.entries(params)) {
    if (key.startsWith('_')) continue;
    if (sensitiveKeys.has(key.toLowerCase())) {
      sanitized[key] = '***REDACTED***';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

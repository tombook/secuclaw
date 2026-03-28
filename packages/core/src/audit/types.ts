export type AuditAction = 
  | 'create' | 'update' | 'delete' 
  | 'assign' | 'status_change' | 'approval' | 'login' | 'logout'
  | 'execute' | 'configure' | 'export';

export type AuditResource =
  | 'incident' | 'vulnerability' | 'threat' | 'compliance' | 'asset'
  | 'task' | 'approval' | 'capability' | 'commander' | 'channel'
  | 'llm_provider' | 'user' | 'role' | 'system';

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string;
  actor: string;
  timestamp: number;
  details?: Record<string, unknown>;
  previousValue?: unknown;
  newValue?: unknown;
  sessionId?: string;
  ipAddress?: string;
}

export interface AuditLogQuery {
  action?: AuditAction;
  resource?: AuditResource;
  resourceId?: string;
  actor?: string;
  fromTimestamp?: number;
  toTimestamp?: number;
  page?: number;
  pageSize?: number;
}

export interface AuditLogStats {
  total: number;
  byAction: Record<string, number>;
  byResource: Record<string, number>;
  byActor: Record<string, number>;
  recentActivity: AuditLogEntry[];
}

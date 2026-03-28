import { Request, Response, NextFunction } from 'express';

type AuditEvent = {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  userId?: string;
  status?: number;
  durationMs?: number;
  bodySize?: number;
};

export interface AuditOptions {
  logToConsole?: boolean;
  logFn?: (e: AuditEvent) => void;
  enableInMemoryStore?: boolean;
}

// Simple in-memory audit store (for tests/quick lookups)
const inMemoryAudits: AuditEvent[] = [];

function generateId(): string {
  return 'aud-' + Math.random().toString(36).slice(2, 9);
}

export { inMemoryAudits };

export function auditMiddleware(opts?: AuditOptions) {
  const logToConsole = opts?.logToConsole ?? false;
  const logFn = opts?.logFn;
  const enableStore = opts?.enableInMemoryStore ?? true;

  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const userId = (req as any).user?.id;

    let finished = false;
    const onFinish = () => {
      if (finished) return;
      finished = true;
      const durationMs = Date.now() - start;
      const event: AuditEvent = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.originalUrl || req.url,
        userId,
        status: res.statusCode,
        durationMs,
        bodySize: (req as any).headers?.['content-length']
          ? Number((req as any).headers['content-length'])
          : undefined,
      };
      if (enableStore) inMemoryAudits.push(event);
      if (logToConsole) console.log('AUDIT', event);
      if (logFn) logFn(event);
    };

    res.on && res.on('finish', onFinish);
    next();
  };
}

// Helper for tests/debug to inspect audits
export function getInMemoryAudits(): AuditEvent[] {
  return inMemoryAudits;
}

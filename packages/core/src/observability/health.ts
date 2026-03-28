type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface ServiceHealth {
  name: string;
  status: HealthStatus;
  responseTimeMs: number;
  details?: Record<string, unknown>;
}

export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  services: ServiceHealth[];
}

interface HealthCheck {
  name: string;
  check: () => Promise<{ status: HealthStatus; responseTimeMs: number; details?: Record<string, unknown> }>;
}

export class HealthChecker {
  private checks: HealthCheck[] = [];
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  registerCheck(name: string, check: () => Promise<{ status: HealthStatus; responseTimeMs: number; details?: Record<string, unknown> }>): void {
    this.checks.push({ name, check });
  }

  async checkAll(): Promise<HealthCheckResult> {
    const services: ServiceHealth[] = [];

    for (const { name, check } of this.checks) {
      const start = Date.now();
      try {
        const result = await check();
        services.push({ name, ...result });
      } catch (err) {
        services.push({
          name,
          status: 'unhealthy',
          responseTimeMs: Date.now() - start,
          details: { error: err instanceof Error ? err.message : String(err) },
        });
      }
    }

    const overallStatus = services.every(s => s.status === 'healthy')
      ? 'healthy'
      : services.some(s => s.status === 'degraded')
        ? 'degraded'
        : 'unhealthy';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      services,
    };
  }

  async checkOne(name: string): Promise<ServiceHealth | null> {
    const check = this.checks.find(c => c.name === name);
    if (!check) return null;
    const start = Date.now();
    try {
      return { name, ...await check.check() };
    } catch (err) {
      return {
        name,
        status: 'unhealthy' as HealthStatus,
        responseTimeMs: Date.now() - start,
        details: { error: err instanceof Error ? err.message : String(err) },
      };
    }
  }
}

export function createDefaultHealthChecker(
  jsonStore?: { get: (key: string) => Promise<unknown> },
): HealthChecker {
  const checker = new HealthChecker();

  checker.registerCheck('json-store', async () => {
    const start = Date.now();
    try {
      await jsonStore?.get('health-ping.json');
      return { status: 'healthy' as HealthStatus, responseTimeMs: Date.now() - start };
    } catch {
      return { status: 'unhealthy' as HealthStatus, responseTimeMs: Date.now() - start, details: { error: 'connection failed' } };
    }
  });

  checker.registerCheck('memory', async () => {
    const mem = process.memoryUsage();
    const usedMb = mem.heapUsed / 1024 / 1024;
    const status: HealthStatus = usedMb > 500 ? 'degraded' : 'healthy';
    return {
      status,
      responseTimeMs: 0,
      details: { heapUsedMb: Math.round(usedMb * 100) / 100, rssMb: Math.round(mem.rss / 1024 / 1024 * 100) / 100 },
    };
  });

  checker.registerCheck('event-loop', async () => {
    const start = Date.now();
    return { status: 'healthy' as HealthStatus, responseTimeMs: Date.now() - start };
  });

  return checker;
}

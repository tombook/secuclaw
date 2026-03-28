// Local interface to avoid circular dependency on gateway/router
interface EventBusLike {
  emit(event: string, payload: unknown): Promise<void>;
}

export interface SlaConfig {
  critical: number;
  high: number;
  medium: number;
  low: number;
  warningThreshold: number;
}

const DEFAULT_SLA: SlaConfig = {
  critical: 4 * 60 * 60 * 1000,
  high: 24 * 60 * 60 * 1000,
  medium: 72 * 60 * 60 * 1000,
  low: 168 * 60 * 60 * 1000,
  warningThreshold: 0.2,
};

export interface SlaStatus {
  incidentId: string;
  severity: string;
  createdAt: number;
  slaDeadline: number;
  remainingMs: number;
  remainingPercent: number;
  status: 'ok' | 'warning' | 'breached';
}

export class SlaChecker {
  private config: SlaConfig;

  constructor(
    private jsonStore: any,
    private eventBus?: EventBusLike,
    config?: Partial<SlaConfig>,
  ) {
    this.config = { ...DEFAULT_SLA, ...config };
  }

  async checkSlaTimeouts(): Promise<SlaStatus[]> {
    const raw = await this.jsonStore.get('incidents.json');
    const incidents: any[] = Array.isArray(raw) ? raw : [];
    const now = Date.now();
    const results: SlaStatus[] = [];

    for (const incident of incidents) {
      if (!incident.id || incident.status === 'resolved' || incident.status === 'closed') continue;

      const severity = incident.severity ?? 'medium';
      const createdAt = incident.createdAt ?? now;
      const slaMs = this.getSlaForSeverity(severity);
      const slaDeadline = createdAt + slaMs;
      const remainingMs = slaDeadline - now;
      const remainingPercent = slaMs > 0 ? remainingMs / slaMs : 0;

      let status: SlaStatus['status'] = 'ok';
      if (remainingMs <= 0) {
        status = 'breached';
        if (this.eventBus) {
          await this.eventBus.emit('sla.breached' as any, {
            incidentId: incident.id,
            severity,
            overdueMs: Math.abs(remainingMs),
          } as any).catch(() => {});
        }
      } else if (remainingPercent <= this.config.warningThreshold) {
        status = 'warning';
        if (this.eventBus) {
          await this.eventBus.emit('sla.warning' as any, {
            incidentId: incident.id,
            severity,
            remainingMs,
            remainingPercent: Math.round(remainingPercent * 100),
          } as any).catch(() => {});
        }
      }

      results.push({
        incidentId: incident.id,
        severity,
        createdAt,
        slaDeadline,
        remainingMs,
        remainingPercent,
        status,
      });
    }

    return results;
  }

  getSlaForSeverity(severity: string): number {
    switch (severity) {
      case 'critical': return this.config.critical;
      case 'high': return this.config.high;
      case 'medium': return this.config.medium;
      case 'low': return this.config.low;
      default: return this.config.medium;
    }
  }
}

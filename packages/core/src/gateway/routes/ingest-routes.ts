import type { RouterDeps } from '../router.js';

interface IngestedAlert {
  id: string;
  source: string;
  raw: unknown;
  normalized?: {
    title: string;
    severity: string;
    description: string;
    affectedAsset: string;
  };
  timestamp: number;
}

interface IngestStats {
  totalReceived: number;
  bySource: Record<string, number>;
  lastReceived: number;
}

type Handler = (params: Record<string, unknown>, deps?: any) => Promise<unknown>;

const INGESTION_KEY = 'ingestion/logs.json';

let seq = 0;
function gid(): string {
  return 'ing_' + Date.now() + '_' + (++seq);
}

const stats: IngestStats = {
  totalReceived: 0,
  bySource: {},
  lastReceived: 0,
};

async function loadAlerts(deps: RouterDeps): Promise<IngestedAlert[]> {
  const data = await deps.jsonStore.get<IngestedAlert[]>(INGESTION_KEY);
  return Array.isArray(data) ? data : [];
}

async function saveAlerts(deps: RouterDeps, alerts: IngestedAlert[]): Promise<void> {
  await deps.jsonStore.set(INGESTION_KEY, alerts);
}

export function registerIngestRoutes(handlers: Map<string, Handler>, deps: RouterDeps): void {

  handlers.set('ingest.alert', async (params: Record<string, unknown>) => {
    const source = String(params.source ?? 'unknown');
    const alerts = (params.alerts ?? []) as unknown[];
    const stored: IngestedAlert[] = [];
    for (const raw of alerts) {
      const alert: IngestedAlert = {
        id: gid(),
        source,
        raw,
        timestamp: Date.now(),
      };
      stored.push(alert);
      stats.totalReceived++;
      stats.bySource[source] = (stats.bySource[source] ?? 0) + 1;
      stats.lastReceived = alert.timestamp;
    }
    const existing = await loadAlerts(deps);
    existing.push(...stored);
    await saveAlerts(deps, existing);
    for (const alert of stored) {
      (deps as any).eventBus?.emit?.('ingest.received', { id: alert.id, source: alert.source });
    }
    return { received: stored.length, ids: stored.map(a => a.id) };
  });

  handlers.set('ingest.wazuh', async (params: Record<string, unknown>) => {
    const rawAlerts = (params.alerts ?? [params]) as Record<string, unknown>[];
    const incidents: IngestedAlert[] = [];
    for (const raw of rawAlerts) {
      const rule = (raw.rule ?? {}) as Record<string, unknown>;
      const agent = (raw.agent ?? {}) as Record<string, unknown>;
      const incident: IngestedAlert = {
        id: gid(),
        source: 'wazuh',
        raw,
        normalized: {
          title: String(rule.description ?? rule.id ?? 'Wazuh Alert'),
          severity: String(rule.level ?? raw.severity ?? 'medium'),
          description: String(raw.full_log ?? rule.description ?? JSON.stringify(raw)),
          affectedAsset: String(agent.name ?? agent.id ?? ''),
        },
        timestamp: Date.now(),
      };
      incidents.push(incident);
      stats.totalReceived++;
      stats.bySource['wazuh'] = (stats.bySource['wazuh'] ?? 0) + 1;
      stats.lastReceived = incident.timestamp;
    }
    const existing = await loadAlerts(deps);
    existing.push(...incidents);
    await saveAlerts(deps, existing);
    for (const inc of incidents) {
      (deps as any).eventBus?.emit?.('incident.created', { id: inc.id, source: 'wazuh', severity: inc.normalized?.severity, title: inc.normalized?.title });
    }
    return { received: incidents.length, ids: incidents.map(i => i.id) };
  });

  handlers.set('ingest.falco', async (params: Record<string, unknown>) => {
    const rawAlerts = (params.alerts ?? [params]) as Record<string, unknown>[];
    const incidents: IngestedAlert[] = [];
    for (const raw of rawAlerts) {
      const incident: IngestedAlert = {
        id: gid(),
        source: 'falco',
        raw,
        normalized: {
          title: String(raw.rule ?? raw.alert ?? 'Falco Alert'),
          severity: String(raw.priority ?? raw.level ?? 'warning'),
          description: String(raw.output ?? JSON.stringify(raw)),
          affectedAsset: String(raw.hostname ?? ''),
        },
        timestamp: Date.now(),
      };
      incidents.push(incident);
      stats.totalReceived++;
      stats.bySource['falco'] = (stats.bySource['falco'] ?? 0) + 1;
      stats.lastReceived = incident.timestamp;
    }
    const existing = await loadAlerts(deps);
    existing.push(...incidents);
    await saveAlerts(deps, existing);
    for (const inc of incidents) {
      (deps as any).eventBus?.emit?.('incident.created', { id: inc.id, source: 'falco', severity: inc.normalized?.severity, title: inc.normalized?.title });
    }
    return { received: incidents.length, ids: incidents.map(i => i.id) };
  });

  handlers.set('ingest.syslog', async (params: Record<string, unknown>) => {
    const alert: IngestedAlert = {
      id: gid(),
      source: 'syslog',
      raw: params,
      normalized: {
        title: String(params.facility ?? 'syslog') + ': ' + String(params.message ?? '').slice(0, 80),
        severity: String(params.severity ?? 6),
        description: String(params.message ?? ''),
        affectedAsset: String(params.host ?? ''),
      },
      timestamp: params.timestamp ? new Date(params.timestamp as string).getTime() : Date.now(),
    };
    stats.totalReceived++;
    stats.bySource['syslog'] = (stats.bySource['syslog'] ?? 0) + 1;
    stats.lastReceived = alert.timestamp;
    const existing = await loadAlerts(deps);
    existing.push(alert);
    await saveAlerts(deps, existing);
    (deps as any).eventBus?.emit?.('ingest.syslog', { id: alert.id, host: params.host });
    return { id: alert.id };
  });

  handlers.set('ingest.status', async () => {
    return { totalReceived: stats.totalReceived, bySource: { ...stats.bySource }, lastReceived: stats.lastReceived };
  });
}

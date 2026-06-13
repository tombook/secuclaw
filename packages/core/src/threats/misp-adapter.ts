import { exec } from 'child_process';
import { promisify } from 'util';
import type { JsonStore } from '../storage/json-store.js';

const execAsync = promisify(exec);

export interface MispConfig {
  url: string;
  apiKey: string;
  verifyTLS: boolean;
  syncIntervalMs: number;
  tagFilter?: string[];
}

export interface MispAttribute {
  id: string;
  type: string;
  value: string;
  category: string;
  to_ids: boolean;
  comment: string;
}

export interface MispEvent {
  id: string;
  info: string;
  threat_level_id: string;
  analysis: string;
  date: string;
  timestamp: string;
  Attribute: MispAttribute[];
}

export interface SecuClawThreatIntel {
  id: string;
  source: 'misp';
  sourceId: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'new' | 'in_progress' | 'resolved';
  indicators: Array<{
    type: string;
    value: string;
    category: string;
    toIds: boolean;
    comment: string;
  }>;
  detectedAt: number;
  rawEvent: MispEvent;
}

const THREAT_LEVEL_SEVERITY: Record<string, SecuClawThreatIntel['severity']> = {
  '1': 'critical',
  '2': 'high',
  '3': 'medium',
  '4': 'low',
};

const ATTRIBUTE_TYPE_MAP: Record<string, string> = {
  'ip-src': 'ip',
  'ip-dst': 'ip',
  'domain': 'domain',
  'hostname': 'domain',
  'url': 'url',
  'md5': 'hash-md5',
  'sha1': 'hash-sha1',
  'sha256': 'hash-sha256',
  'email': 'email',
  'email-src': 'email',
  'email-dst': 'email',
  'filename': 'filename',
  'filename|md5': 'filename',
  'filename|sha1': 'filename',
  'filename|sha256': 'filename',
  'mutex': 'mutex',
  'regkey': 'registry',
  'regkey|value': 'registry',
  'port': 'port',
  'hostname|port': 'domain',
  'ip-dst|port': 'ip',
  'ip-src|port': 'ip',
  'vulnerability': 'cve',
  'cve': 'cve',
};

export class MispAdapter {
  constructor(private config: MispConfig, private store: JsonStore) {}

  async isAvailable(): Promise<boolean> {
    try {
      const escapedUrl = this.config.url.replace(/'/g, "'\\''");
      const escapedApiKey = this.config.apiKey.replace(/'/g, "'\\''");
      const tlsFlag = this.config.verifyTLS ? '' : ' --insecure';
      const command = `curl -s -I${tlsFlag} -H 'Authorization: ${escapedApiKey}' -H 'Accept: application/json' '${escapedUrl}/servers/getPyMISPVersion'`;
      const { stdout } = await execAsync(command);
      return stdout.includes('200') || stdout.includes('HTTP/');
    } catch {
      return false;
    }
  }

  async fetchRecentEvents(lastTimestampMs?: number): Promise<MispEvent[]> {
    const body: Record<string, unknown> = {
      returnFormat: 'json',
      limit: 100,
      page: 1,
      order: 'desc',
      sort: 'timestamp',
    };

    if (lastTimestampMs) {
      body.from = new Date(lastTimestampMs).toISOString().split('T')[0];
    }

    if (this.config.tagFilter?.length) {
      body.tags = this.config.tagFilter;
    }

    const escapedBody = JSON.stringify(body).replace(/'/g, "'\\''");
    const escapedUrl = this.config.url.replace(/'/g, "'\\''");
    const escapedApiKey = this.config.apiKey.replace(/'/g, "'\\''");
    const tlsFlag = this.config.verifyTLS ? '' : ' --insecure';

    const command = `curl -s${tlsFlag} -X POST '${escapedUrl}/events/restSearch' -H 'Authorization: ${escapedApiKey}' -H 'Accept: application/json' -H 'Content-Type: application/json' -d '${escapedBody}'`;

    const { stdout } = await execAsync(command, { maxBuffer: 50 * 1024 * 1024 });
    if (!stdout) return [];

    const parsed = JSON.parse(stdout);
    const events = parsed?.response ?? parsed ?? [];
    return Array.isArray(events) ? events : [];
  }

  convertToThreatIntel(event: MispEvent): SecuClawThreatIntel {
    const severity = this.threatLevelToSeverity(event.threat_level_id);
    const status = this.analysisToStatus(event.analysis);
    const indicators = (event.Attribute ?? []).map((attr) => ({
      type: this.mapAttributeType(attr.type),
      value: attr.value,
      category: attr.category,
      toIds: attr.to_ids,
      comment: attr.comment,
    }));

    return {
      id: `misp-${event.id}`,
      source: 'misp',
      sourceId: event.id,
      title: event.info,
      severity,
      status,
      indicators,
      detectedAt: parseInt(event.timestamp, 10) * 1000,
      rawEvent: event,
    };
  }

  async syncToStore(threats: SecuClawThreatIntel[]): Promise<void> {
    await this.store.set('threat-intel/misp-events.json', threats);
  }

  async fullSync(): Promise<{ fetched: number; newCount: number }> {
    const existing = await this.store.get<SecuClawThreatIntel[]>('threat-intel/misp-events.json');
    const existingIds = new Set((existing ?? []).map((t) => t.sourceId));

    const rawEvents = await this.fetchRecentEvents();
    const converted: SecuClawThreatIntel[] = [];

    for (const event of rawEvents) {
      const threat = this.convertToThreatIntel(event);
      converted.push(threat);
    }

    const merged = [...(existing ?? []), ...converted.filter((t) => !existingIds.has(t.sourceId))];
    await this.syncToStore(merged);

    const newCount = converted.filter((t) => !existingIds.has(t.sourceId)).length;
    return { fetched: rawEvents.length, newCount };
  }

  async pushIoC(ioc: { type: string; value: string; comment: string }): Promise<boolean> {
    try {
      const body = JSON.stringify({
        request: {
          Attribute: [
            {
              type: ioc.type,
              value: ioc.value,
              comment: ioc.comment,
              to_ids: true,
              category: 'External analysis',
            },
          ],
        },
      });

      const escapedBody = body.replace(/'/g, "'\\''");
      const escapedUrl = this.config.url.replace(/'/g, "'\\''");
      const escapedApiKey = this.config.apiKey.replace(/'/g, "'\\''");
      const tlsFlag = this.config.verifyTLS ? '' : ' --insecure';

      const command = `curl -s${tlsFlag} -X POST '${escapedUrl}/events/add' -H 'Authorization: ${escapedApiKey}' -H 'Accept: application/json' -H 'Content-Type: application/json' -d '${escapedBody}'`;

      const { stdout } = await execAsync(command);
      if (!stdout) return false;

      const parsed = JSON.parse(stdout);
      return !!parsed?.Event?.id;
    } catch {
      return false;
    }
  }

  private threatLevelToSeverity(id: string): SecuClawThreatIntel['severity'] {
    return THREAT_LEVEL_SEVERITY[id] ?? 'info';
  }

  private mapAttributeType(mispType: string): string {
    return ATTRIBUTE_TYPE_MAP[mispType] ?? 'other';
  }

  private analysisToStatus(analysis: string): SecuClawThreatIntel['status'] {
    switch (analysis) {
      case '0': return 'new';
      case '1': return 'in_progress';
      case '2': return 'resolved';
      default: return 'new';
    }
  }
}

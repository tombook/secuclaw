import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type AccessAction = 'read' | 'write' | 'delete' | 'export' | 'share' | 'query' | 'admin' | 'bulk_download' | 'unknown';
export type AccessSubject = 'user' | 'service' | 'role' | 'api_key' | 'application' | 'unknown';
export type AnomalyType = 'unusual_time' | 'unusual_location' | 'unusual_volume' | 'unusual_user' | 'privilege_escalation' | 'data_exfiltration' | 'lateral_access' | 'bulk_download' | 'suspicious_query' | 'after_hours_admin' | 'cross_border';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface DataAccessEvent {
  id: string;
  timestamp: number;
  assetId: string;
  assetName: string;
  action: AccessAction;
  subjectType: AccessSubject;
  subjectId: string;
  sourceIp: string;
  location: string | null;
  country: string | null;
  userAgent: string;
  recordsAccessed: number;
  bytesAccessed: number;
  query: string | null;
  status: 'success' | 'failure' | 'denied' | 'error';
  errorMessage: string | null;
  classification: 'public' | 'internal' | 'confidential' | 'restricted' | 'top_secret';
  approved: boolean;
  approver: string | null;
  metadata: Record<string, unknown>;
}

export interface AccessAnomaly {
  id: string;
  timestamp: number;
  assetId: string;
  subjectId: string;
  anomalyType: AnomalyType;
  severity: Severity;
  description: string;
  evidence: string[];
  events: string[];
  riskScore: number;
  recommendedAction: 'monitor' | 'revoke' | 'restrict' | 'alert' | 'investigate' | 'block';
  resolved: boolean;
  resolvedBy: string | null;
  notes: string;
}

export interface AccessPattern {
  subjectId: string;
  subjectType: AccessSubject;
  typicalHours: number[];
  typicalDays: number[];
  typicalLocations: string[];
  typicalAssets: string[];
  typicalActions: AccessAction[];
  avgRecordsPerAccess: number;
  avgBytesPerAccess: number;
  avgDailyAccess: number;
  maxRecordsSeen: number;
  lastUpdated: number;
  sampleCount: number;
}

export interface AccessStats {
  totalEvents: number;
  totalAnomalies: number;
  byAction: Record<AccessAction, number>;
  bySubject: Record<AccessSubject, number>;
  byStatus: Record<string, number>;
  byClassification: Record<string, number>;
  byAnomalyType: Record<AnomalyType, number>;
  bySeverity: Record<Severity, number>;
  unapprovedAccess: number;
  crossBorderAccess: number;
  topSubjects: Array<{ subjectId: string; events: number; anomalies: number }>;
  topAssets: Array<{ assetId: string; events: number; anomalies: number }>;
}

export class DataAccessAnalyzer {
  constructor(private store: JsonStore) {}

  async recordEvent(event: Omit<DataAccessEvent, 'id'>): Promise<DataAccessEvent> {
    const newEvent: DataAccessEvent = { ...event, id: this.generateId('evt') };
    const events = await this.loadEvents();
    events.push(newEvent);
    if (events.length > 50000) events.splice(0, events.length - 50000);
    await this.store.set(STORE_KEYS.events, events);
    await this.updateAccessPattern(newEvent);
    return newEvent;
  }

  async recordBatch(events: Omit<DataAccessEvent, 'id'>[]): Promise<DataAccessEvent[]> {
    const result: DataAccessEvent[] = [];
    for (const e of events) result.push(await this.recordEvent(e));
    return result;
  }

  async getEvent(eventId: string): Promise<DataAccessEvent | null> {
    const events = await this.loadEvents();
    return events.find((e) => e.id === eventId) || null;
  }

  async listEvents(filters?: { assetId?: string; subjectId?: string; action?: AccessAction; classification?: string; since?: number; status?: string; limit?: number }): Promise<DataAccessEvent[]> {
    let events = await this.loadEvents();
    if (filters?.assetId) events = events.filter((e) => e.assetId === filters.assetId);
    if (filters?.subjectId) events = events.filter((e) => e.subjectId === filters.subjectId);
    if (filters?.action) events = events.filter((e) => e.action === filters.action);
    if (filters?.classification) events = events.filter((e) => e.classification === filters.classification);
    if (filters?.status) events = events.filter((e) => e.status === filters.status);
    if (filters?.since !== undefined) events = events.filter((e) => e.timestamp >= filters.since!);
    events.sort((a, b) => b.timestamp - a.timestamp);
    if (filters?.limit !== undefined) events = events.slice(0, filters.limit);
    return events;
  }

  async detectAnomalies(event: DataAccessEvent): Promise<AccessAnomaly[]> {
    const anomalies: AccessAnomaly[] = [];
    const recent = (await this.loadEvents()).filter((e) => e.subjectId === event.subjectId);
    const pattern = await this.getAccessPattern(event.subjectId);

    const hourAnomaly = this.checkUnusualTime(event, pattern);
    if (hourAnomaly) anomalies.push(hourAnomaly);
    const locationAnomaly = this.checkUnusualLocation(event, pattern);
    if (locationAnomaly) anomalies.push(locationAnomaly);
    const volumeAnomaly = this.checkUnusualVolume(event, recent);
    if (volumeAnomaly) anomalies.push(volumeAnomaly);
    const escalationAnomaly = this.checkPrivilegeEscalation(event, recent);
    if (escalationAnomaly) anomalies.push(escalationAnomaly);
    const exfilAnomaly = this.checkDataExfiltration(event, recent);
    if (exfilAnomaly) anomalies.push(exfilAnomaly);
    const crossBorderAnomaly = this.checkCrossBorder(event, recent);
    if (crossBorderAnomaly) anomalies.push(crossBorderAnomaly);

    if (anomalies.length > 0) {
      const all = await this.loadAnomalies();
      all.push(...anomalies);
      if (all.length > 10000) all.splice(0, all.length - 10000);
      await this.store.set(STORE_KEYS.anomalies, all);
    }
    return anomalies;
  }

  async getAnomalies(filters?: { assetId?: string; subjectId?: string; type?: AnomalyType; severity?: Severity; resolved?: boolean; since?: number; limit?: number }): Promise<AccessAnomaly[]> {
    let anomalies = await this.loadAnomalies();
    if (filters?.assetId) anomalies = anomalies.filter((a) => a.assetId === filters.assetId);
    if (filters?.subjectId) anomalies = anomalies.filter((a) => a.subjectId === filters.subjectId);
    if (filters?.type) anomalies = anomalies.filter((a) => a.anomalyType === filters.type);
    if (filters?.severity) anomalies = anomalies.filter((a) => a.severity === filters.severity);
    if (filters?.resolved !== undefined) anomalies = anomalies.filter((a) => a.resolved === filters.resolved);
    if (filters?.since !== undefined) anomalies = anomalies.filter((a) => a.timestamp >= filters.since!);
    anomalies.sort((a, b) => b.timestamp - a.timestamp);
    if (filters?.limit !== undefined) anomalies = anomalies.slice(0, filters.limit);
    return anomalies;
  }

  async resolveAnomaly(anomalyId: string, resolvedBy: string, notes: string): Promise<boolean> {
    const anomalies = await this.loadAnomalies();
    const idx = anomalies.findIndex((a) => a.id === anomalyId);
    if (idx === -1) return false;
    anomalies[idx].resolved = true;
    anomalies[idx].resolvedBy = resolvedBy;
    anomalies[idx].notes = notes;
    await this.store.set(STORE_KEYS.anomalies, anomalies);
    return true;
  }

  async getAccessPattern(subjectId: string): Promise<AccessPattern | null> {
    const patterns = await this.loadPatterns();
    return patterns.find((p) => p.subjectId === subjectId) || null;
  }

  async listPatterns(): Promise<AccessPattern[]> {
    return this.loadPatterns();
  }

  async getStats(since?: number): Promise<AccessStats> {
    let events = await this.loadEvents();
    if (since !== undefined) events = events.filter((e) => e.timestamp >= since);
    const anomalies = await this.loadAnomalies();
    const byAction: Record<AccessAction, number> = { read: 0, write: 0, delete: 0, export: 0, share: 0, query: 0, admin: 0, bulk_download: 0, unknown: 0 };
    const bySubject: Record<AccessSubject, number> = { user: 0, service: 0, role: 0, api_key: 0, application: 0, unknown: 0 };
    const byStatus: Record<string, number> = { success: 0, failure: 0, denied: 0, error: 0 };
    const byClassification: Record<string, number> = { public: 0, internal: 0, confidential: 0, restricted: 0, top_secret: 0 };
    let unapprovedAccess = 0;
    let crossBorderAccess = 0;
    for (const e of events) {
      byAction[e.action]++;
      bySubject[e.subjectType]++;
      byStatus[e.status]++;
      byClassification[e.classification]++;
      if (!e.approved) unapprovedAccess++;
      if (e.country && ['US', 'CA', 'GB', 'DE', 'FR', 'JP', 'AU'].includes(e.country)) crossBorderAccess++;
    }
    const byAnomalyType: Record<AnomalyType, number> = { unusual_time: 0, unusual_location: 0, unusual_volume: 0, unusual_user: 0, privilege_escalation: 0, data_exfiltration: 0, lateral_access: 0, bulk_download: 0, suspicious_query: 0, after_hours_admin: 0, cross_border: 0 };
    const bySeverity: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const a of anomalies) {
      byAnomalyType[a.anomalyType]++;
      bySeverity[a.severity]++;
    }
    const subjMap = new Map<string, { subjectId: string; events: number; anomalies: number }>();
    for (const e of events) {
      const ex = subjMap.get(e.subjectId) || { subjectId: e.subjectId, events: 0, anomalies: 0 };
      ex.events++;
      subjMap.set(e.subjectId, ex);
    }
    for (const a of anomalies) {
      const ex = subjMap.get(a.subjectId) || { subjectId: a.subjectId, events: 0, anomalies: 0 };
      ex.anomalies++;
      subjMap.set(a.subjectId, ex);
    }
    const assetMap = new Map<string, { assetId: string; events: number; anomalies: number }>();
    for (const e of events) {
      const ex = assetMap.get(e.assetId) || { assetId: e.assetId, events: 0, anomalies: 0 };
      ex.events++;
      assetMap.set(e.assetId, ex);
    }
    for (const a of anomalies) {
      const ex = assetMap.get(a.assetId) || { assetId: a.assetId, events: 0, anomalies: 0 };
      ex.anomalies++;
      assetMap.set(a.assetId, ex);
    }
    return {
      totalEvents: events.length,
      totalAnomalies: anomalies.length,
      byAction,
      bySubject,
      byStatus,
      byClassification,
      byAnomalyType,
      bySeverity,
      unapprovedAccess,
      crossBorderAccess,
      topSubjects: Array.from(subjMap.values()).sort((a, b) => b.events - a.events).slice(0, 10),
      topAssets: Array.from(assetMap.values()).sort((a, b) => b.events - a.events).slice(0, 10),
    };
  }

  private checkUnusualTime(event: DataAccessEvent, pattern: AccessPattern | null): AccessAnomaly | null {
    if (!pattern || pattern.typicalHours.length === 0) return null;
    const hour = new Date(event.timestamp).getHours();
    if (pattern.typicalHours.includes(hour)) return null;
    if (event.action === 'admin' || event.classification === 'restricted' || event.classification === 'top_secret') {
      return {
        id: this.generateId('ano'),
        timestamp: Date.now(),
        assetId: event.assetId,
        subjectId: event.subjectId,
        anomalyType: 'unusual_time',
        severity: event.classification === 'top_secret' ? 'high' : 'medium',
        description: `${event.subjectId} accessed ${event.assetName} at unusual hour ${hour}:00 (typical: ${pattern.typicalHours.join(', ')})`,
        evidence: [`hour=${hour}`, `typicalHours=${JSON.stringify(pattern.typicalHours)}`, `action=${event.action}`],
        events: [event.id],
        riskScore: 60,
        recommendedAction: 'investigate',
        resolved: false,
        resolvedBy: null,
        notes: '',
      };
    }
    return null;
  }

  private checkUnusualLocation(event: DataAccessEvent, pattern: AccessPattern | null): AccessAnomaly | null {
    if (!pattern || pattern.typicalLocations.length === 0 || !event.location) return null;
    if (pattern.typicalLocations.includes(event.location)) return null;
    return {
      id: this.generateId('ano'),
      timestamp: Date.now(),
      assetId: event.assetId,
      subjectId: event.subjectId,
      anomalyType: 'unusual_location',
      severity: 'high',
      description: `${event.subjectId} accessed from unusual location ${event.location} (typical: ${pattern.typicalLocations.join(', ')})`,
      evidence: [`location=${event.location}`, `typicalLocations=${JSON.stringify(pattern.typicalLocations)}`],
      events: [event.id],
      riskScore: 75,
      recommendedAction: 'alert',
      resolved: false,
      resolvedBy: null,
      notes: '',
    };
  }

  private checkUnusualVolume(event: DataAccessEvent, recent: DataAccessEvent[]): AccessAnomaly | null {
    if (recent.length < 5) return null;
    const avgBytes = recent.reduce((sum, e) => sum + e.bytesAccessed, 0) / recent.length;
    if (event.bytesAccessed > avgBytes * 10 && event.bytesAccessed > 10_000_000) {
      return {
        id: this.generateId('ano'),
        timestamp: Date.now(),
        assetId: event.assetId,
        subjectId: event.subjectId,
        anomalyType: 'unusual_volume',
        severity: 'high',
        description: `${event.subjectId} accessed ${event.bytesAccessed} bytes (10x avg ${avgBytes.toFixed(0)})`,
        evidence: [`bytesAccessed=${event.bytesAccessed}`, `avgBytes=${avgBytes.toFixed(0)}`],
        events: [event.id],
        riskScore: 80,
        recommendedAction: 'restrict',
        resolved: false,
        resolvedBy: null,
        notes: '',
      };
    }
    return null;
  }

  private checkPrivilegeEscalation(event: DataAccessEvent, recent: DataAccessEvent[]): AccessAnomaly | null {
    if (event.action !== 'admin') return null;
    const priorAdmin = recent.filter((e) => e.action === 'admin').length;
    if (priorAdmin === 0) {
      return {
        id: this.generateId('ano'),
        timestamp: Date.now(),
        assetId: event.assetId,
        subjectId: event.subjectId,
        anomalyType: 'privilege_escalation',
        severity: 'critical',
        description: `${event.subjectId} performed first admin action on ${event.assetName}`,
        evidence: [`action=admin`, `priorAdminActions=0`],
        events: [event.id],
        riskScore: 90,
        recommendedAction: 'investigate',
        resolved: false,
        resolvedBy: null,
        notes: '',
      };
    }
    return null;
  }

  private checkDataExfiltration(event: DataAccessEvent, recent: DataAccessEvent[]): AccessAnomaly | null {
    if (event.action !== 'export' && event.action !== 'bulk_download') return null;
    const last5Min = recent.filter((e) => Date.now() - e.timestamp < 5 * 60 * 1000 && (e.action === 'export' || e.action === 'read'));
    const totalBytes = last5Min.reduce((sum, e) => sum + e.bytesAccessed, 0) + event.bytesAccessed;
    if (totalBytes > 100_000_000) {
      return {
        id: this.generateId('ano'),
        timestamp: Date.now(),
        assetId: event.assetId,
        subjectId: event.subjectId,
        anomalyType: 'data_exfiltration',
        severity: 'critical',
        description: `${event.subjectId} exported ${(totalBytes / 1_000_000).toFixed(1)}MB in 5min across ${last5Min.length + 1} actions`,
        evidence: [`totalBytes=${totalBytes}`, `actionCount=${last5Min.length + 1}`],
        events: [event.id, ...last5Min.slice(-5).map((e) => e.id)],
        riskScore: 95,
        recommendedAction: 'block',
        resolved: false,
        resolvedBy: null,
        notes: '',
      };
    }
    return null;
  }

  private checkCrossBorder(event: DataAccessEvent, _recent: DataAccessEvent[]): AccessAnomaly | null {
    if (!event.country) return null;
    const crossBorderCountries = ['US', 'CA', 'GB', 'DE', 'FR', 'JP', 'AU', 'SG'];
    if (event.classification === 'restricted' || event.classification === 'top_secret') {
      if (crossBorderCountries.includes(event.country)) {
        return {
          id: this.generateId('ano'),
          timestamp: Date.now(),
          assetId: event.assetId,
          subjectId: event.subjectId,
          anomalyType: 'cross_border',
          severity: 'critical',
          description: `Cross-border access to ${event.classification} data from ${event.country} by ${event.subjectId}`,
          evidence: [`country=${event.country}`, `classification=${event.classification}`],
          events: [event.id],
          riskScore: 88,
          recommendedAction: 'alert',
          resolved: false,
          resolvedBy: null,
          notes: '',
        };
      }
    }
    return null;
  }

  private async updateAccessPattern(event: DataAccessEvent): Promise<void> {
    const patterns = await this.loadPatterns();
    let pattern = patterns.find((p) => p.subjectId === event.subjectId);
    if (!pattern) {
      pattern = {
        subjectId: event.subjectId,
        subjectType: event.subjectType,
        typicalHours: [],
        typicalDays: [],
        typicalLocations: [],
        typicalAssets: [],
        typicalActions: [],
        avgRecordsPerAccess: 0,
        avgBytesPerAccess: 0,
        avgDailyAccess: 0,
        maxRecordsSeen: 0,
        lastUpdated: Date.now(),
        sampleCount: 0,
      };
      patterns.push(pattern);
    }
    const hour = new Date(event.timestamp).getHours();
    const day = new Date(event.timestamp).getDay();
    pattern.typicalHours = this.addToTopList(pattern.typicalHours, hour, 24);
    pattern.typicalDays = this.addToTopList(pattern.typicalDays, day, 7);
    if (event.location) pattern.typicalLocations = this.addToTopList(pattern.typicalLocations, event.location, 10);
    pattern.typicalAssets = this.addToTopList(pattern.typicalAssets, event.assetId, 50);
    if (!pattern.typicalActions.includes(event.action)) pattern.typicalActions.push(event.action);
    const n = pattern.sampleCount + 1;
    pattern.avgRecordsPerAccess = (pattern.avgRecordsPerAccess * pattern.sampleCount + event.recordsAccessed) / n;
    pattern.avgBytesPerAccess = (pattern.avgBytesPerAccess * pattern.sampleCount + event.bytesAccessed) / n;
    pattern.maxRecordsSeen = Math.max(pattern.maxRecordsSeen, event.recordsAccessed);
    pattern.sampleCount = n;
    pattern.lastUpdated = Date.now();
    await this.store.set(STORE_KEYS.patterns, patterns);
  }

  private addToTopList<T>(list: T[], value: T, max: number): T[] {
    if (!list.includes(value)) list.push(value);
    if (list.length > max) list.shift();
    return list;
  }

  private async loadEvents(): Promise<DataAccessEvent[]> {
    return (await this.store.get<DataAccessEvent[]>(STORE_KEYS.events)) || [];
  }

  private async loadAnomalies(): Promise<AccessAnomaly[]> {
    return (await this.store.get<AccessAnomaly[]>(STORE_KEYS.anomalies)) || [];
  }

  private async loadPatterns(): Promise<AccessPattern[]> {
    return (await this.store.get<AccessPattern[]>(STORE_KEYS.patterns)) || [];
  }

  private generateId(prefix: string): string {
    return `${prefix}_${randomUUID()}`;
  }
}

const STORE_KEYS = {
  events: 'dspm/access-events.json',
  anomalies: 'dspm/access-anomalies.json',
  patterns: 'dspm/access-patterns.json',
};

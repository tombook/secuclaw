import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type FlowType = 'etl' | 'replication' | 'sync' | 'api_call' | 'event_stream' | 'batch_upload' | 'cross_region' | 'cross_cloud' | 'backup' | 'export' | 'unknown';
export type FlowStatus = 'active' | 'paused' | 'failed' | 'completed' | 'rate_limited' | 'pending';
export type AnomalyType = 'volume_spike' | 'volume_drop' | 'unexpected_destination' | 'unexpected_classification' | 'failed_transfer' | 'unauthorized_destination' | 'cross_border_unexpected' | 'pii_egress' | 'unusual_timing' | 'new_destination';

export interface DataFlow {
  id: string;
  name: string;
  description: string;
  flowType: FlowType;
  status: FlowStatus;
  sourceAssetId: string;
  sourceAssetName: string;
  sourceRegion: string;
  sourceClassification: string;
  destinationAssetId: string;
  destinationAssetName: string;
  destinationRegion: string;
  destinationCloud: string | null;
  destinationCountry: string | null;
  protocol: string;
  encryption: 'none' | 'tls' | 'mtls' | 'vpn' | 'private_link' | 'customer_managed_key';
  schedule: string;
  recordsPerRun: number | null;
  bytesPerRun: number | null;
  totalRuns: number;
  successCount: number;
  failureCount: number;
  lastRunAt: number | null;
  lastSuccessAt: number | null;
  createdAt: number;
  createdBy: string;
  approved: boolean;
  approver: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface FlowEvent {
  id: string;
  flowId: string;
  timestamp: number;
  status: 'success' | 'failure' | 'partial' | 'warning';
  recordsTransferred: number;
  bytesTransferred: number;
  durationMs: number;
  error: string | null;
  sourceLocation: string;
  destinationLocation: string;
}

export interface FlowAnomaly {
  id: string;
  timestamp: number;
  flowId: string;
  flowName: string;
  anomalyType: AnomalyType;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  evidence: string[];
  relatedEvents: string[];
  expectedValue: string | null;
  actualValue: string | null;
  recommendation: string;
  resolved: boolean;
  notes: string;
}

export interface FlowStats {
  totalFlows: number;
  activeFlows: number;
  failedFlows: number;
  totalEvents: number;
  byFlowType: Record<FlowType, number>;
  byStatus: Record<FlowStatus, number>;
  byEncryption: Record<string, number>;
  byAnomalyType: Record<AnomalyType, number>;
  bySeverity: Record<string, number>;
  crossRegionFlows: number;
  unencryptedFlows: number;
  topDestinations: Array<{ destination: string; flows: number; bytes: number }>;
  totalBytesTransferred: number;
}

export class DataFlowMonitor {
  constructor(private store: JsonStore) {}

  async registerFlow(flow: Omit<DataFlow, 'id' | 'createdAt' | 'totalRuns' | 'successCount' | 'failureCount' | 'lastRunAt' | 'lastSuccessAt'>): Promise<DataFlow> {
    const newFlow: DataFlow = {
      ...flow,
      id: this.generateId('flow'),
      createdAt: Date.now(),
      totalRuns: 0,
      successCount: 0,
      failureCount: 0,
      lastRunAt: null,
      lastSuccessAt: null,
    };
    const flows = await this.loadFlows();
    flows.push(newFlow);
    await this.store.set(STORE_KEYS.flows, flows);
    return newFlow;
  }

  async updateFlow(flowId: string, updates: Partial<DataFlow>): Promise<DataFlow | null> {
    const flows = await this.loadFlows();
    const idx = flows.findIndex((f) => f.id === flowId);
    if (idx === -1) return null;
    flows[idx] = { ...flows[idx], ...updates };
    await this.store.set(STORE_KEYS.flows, flows);
    return flows[idx];
  }

  async getFlow(flowId: string): Promise<DataFlow | null> {
    const flows = await this.loadFlows();
    return flows.find((f) => f.id === flowId) || null;
  }

  async listFlows(filters?: { status?: FlowStatus; flowType?: FlowType; sourceRegion?: string; destinationRegion?: string; approved?: boolean; crossRegionOnly?: boolean; unencryptedOnly?: boolean; limit?: number }): Promise<DataFlow[]> {
    let flows = await this.loadFlows();
    if (filters?.status) flows = flows.filter((f) => f.status === filters.status);
    if (filters?.flowType) flows = flows.filter((f) => f.flowType === filters.flowType);
    if (filters?.sourceRegion) flows = flows.filter((f) => f.sourceRegion === filters.sourceRegion);
    if (filters?.destinationRegion) flows = flows.filter((f) => f.destinationRegion === filters.destinationRegion);
    if (filters?.approved !== undefined) flows = flows.filter((f) => f.approved === filters.approved);
    if (filters?.crossRegionOnly) flows = flows.filter((f) => f.sourceRegion !== f.destinationRegion);
    if (filters?.unencryptedOnly) flows = flows.filter((f) => f.encryption === 'none');
    if (filters?.limit !== undefined) flows = flows.slice(0, filters.limit);
    return flows;
  }

  async deleteFlow(flowId: string): Promise<boolean> {
    const flows = await this.loadFlows();
    const filtered = flows.filter((f) => f.id !== flowId);
    if (filtered.length === flows.length) return false;
    await this.store.set(STORE_KEYS.flows, filtered);
    return true;
  }

  async recordFlowEvent(event: Omit<FlowEvent, 'id'>): Promise<FlowEvent> {
    const newEvent: FlowEvent = { ...event, id: this.generateId('fev') };
    const events = await this.loadEvents();
    events.push(newEvent);
    if (events.length > 20000) events.splice(0, events.length - 20000);
    await this.store.set(STORE_KEYS.events, events);

    const flows = await this.loadFlows();
    const flowIdx = flows.findIndex((f) => f.id === event.flowId);
    if (flowIdx !== -1) {
      flows[flowIdx].totalRuns++;
      if (event.status === 'success') {
        flows[flowIdx].successCount++;
        flows[flowIdx].lastSuccessAt = event.timestamp;
      } else if (event.status === 'failure') flows[flowIdx].failureCount++;
      flows[flowIdx].lastRunAt = event.timestamp;
      if (flows[flowIdx].failureCount > flows[flowIdx].successCount * 0.1) flows[flowIdx].status = 'failed';
      await this.store.set(STORE_KEYS.flows, flows);
    }

    await this.detectFlowAnomalies(newEvent);
    return newEvent;
  }

  async listFlowEvents(filters?: { flowId?: string; status?: string; since?: number; limit?: number }): Promise<FlowEvent[]> {
    let events = await this.loadEvents();
    if (filters?.flowId) events = events.filter((e) => e.flowId === filters.flowId);
    if (filters?.status) events = events.filter((e) => e.status === filters.status);
    if (filters?.since !== undefined) events = events.filter((e) => e.timestamp >= filters.since!);
    events.sort((a, b) => b.timestamp - a.timestamp);
    if (filters?.limit !== undefined) events = events.slice(0, filters.limit);
    return events;
  }

  async listAnomalies(filters?: { flowId?: string; type?: AnomalyType; severity?: string; resolved?: boolean; since?: number; limit?: number }): Promise<FlowAnomaly[]> {
    let anomalies = await this.loadAnomalies();
    if (filters?.flowId) anomalies = anomalies.filter((a) => a.flowId === filters.flowId);
    if (filters?.type) anomalies = anomalies.filter((a) => a.anomalyType === filters.type);
    if (filters?.severity) anomalies = anomalies.filter((a) => a.severity === filters.severity);
    if (filters?.resolved !== undefined) anomalies = anomalies.filter((a) => a.resolved === filters.resolved);
    if (filters?.since !== undefined) anomalies = anomalies.filter((a) => a.timestamp >= filters.since!);
    anomalies.sort((a, b) => b.timestamp - a.timestamp);
    if (filters?.limit !== undefined) anomalies = anomalies.slice(0, filters.limit);
    return anomalies;
  }

  async resolveAnomaly(anomalyId: string, notes: string): Promise<boolean> {
    const anomalies = await this.loadAnomalies();
    const idx = anomalies.findIndex((a) => a.id === anomalyId);
    if (idx === -1) return false;
    anomalies[idx].resolved = true;
    anomalies[idx].notes = notes;
    await this.store.set(STORE_KEYS.anomalies, anomalies);
    return true;
  }

  async getStats(): Promise<FlowStats> {
    const flows = await this.loadFlows();
    const events = await this.loadEvents();
    const anomalies = await this.loadAnomalies();
    const byFlowType = this.emptyFlowTypeMap();
    const byStatus = this.emptyStatusMap();
    const byEncryption: Record<string, number> = { none: 0, tls: 0, mtls: 0, vpn: 0, private_link: 0, customer_managed_key: 0 };
    const byAnomalyType: Record<AnomalyType, number> = { volume_spike: 0, volume_drop: 0, unexpected_destination: 0, unexpected_classification: 0, failed_transfer: 0, unauthorized_destination: 0, cross_border_unexpected: 0, pii_egress: 0, unusual_timing: 0, new_destination: 0 };
    const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    let crossRegionFlows = 0;
    let unencryptedFlows = 0;
    let totalBytesTransferred = 0;
    for (const f of flows) {
      byFlowType[f.flowType]++;
      byStatus[f.status]++;
      byEncryption[f.encryption] = (byEncryption[f.encryption] || 0) + 1;
      if (f.sourceRegion !== f.destinationRegion) crossRegionFlows++;
      if (f.encryption === 'none') unencryptedFlows++;
    }
    for (const e of events) totalBytesTransferred += e.bytesTransferred;
    for (const a of anomalies) {
      byAnomalyType[a.anomalyType]++;
      bySeverity[a.severity]++;
    }
    const destMap = new Map<string, { destination: string; flows: number; bytes: number }>();
    for (const f of flows) {
      const dest = f.destinationCloud ? `${f.destinationCloud}/${f.destinationRegion}` : f.destinationRegion;
      const ex = destMap.get(dest) || { destination: dest, flows: 0, bytes: 0 };
      ex.flows++;
      destMap.set(dest, ex);
    }
    for (const e of events) {
      const flow = flows.find((f) => f.id === e.flowId);
      if (!flow) continue;
      const dest = flow.destinationCloud ? `${flow.destinationCloud}/${flow.destinationRegion}` : flow.destinationRegion;
      const ex = destMap.get(dest);
      if (ex) ex.bytes += e.bytesTransferred;
    }
    return {
      totalFlows: flows.length,
      activeFlows: byStatus.active,
      failedFlows: byStatus.failed,
      totalEvents: events.length,
      byFlowType,
      byStatus,
      byEncryption,
      byAnomalyType,
      bySeverity,
      crossRegionFlows,
      unencryptedFlows,
      topDestinations: Array.from(destMap.values()).sort((a, b) => b.bytes - a.bytes).slice(0, 10),
      totalBytesTransferred,
    };
  }

  private async detectFlowAnomalies(event: FlowEvent): Promise<FlowAnomaly[]> {
    const anomalies: FlowAnomaly[] = [];
    const recent = (await this.loadEvents()).filter((e) => e.flowId === event.flowId && event.timestamp - e.timestamp < 24 * 60 * 60 * 1000);
    if (recent.length < 5) return anomalies;
    const flow = (await this.loadFlows()).find((f) => f.id === event.flowId);

    if (event.status === 'failure') {
      const last5 = recent.slice(-5);
      if (last5.filter((e) => e.status === 'failure').length >= 3) {
        anomalies.push({
          id: this.generateId('ano'),
          timestamp: Date.now(),
          flowId: event.flowId,
          flowName: flow?.name || 'unknown',
          anomalyType: 'failed_transfer',
          severity: 'high',
          description: `Flow ${event.flowId} has 3+ consecutive failures in last 5 events`,
          evidence: last5.map((e) => `ts=${e.timestamp} status=${e.status} error=${e.error}`),
          relatedEvents: last5.map((e) => e.id),
          expectedValue: 'success',
          actualValue: 'failure',
          recommendation: 'Check network connectivity, credentials, and target availability',
          resolved: false,
          notes: '',
        });
      }
    }

    if (flow) {
      const avgBytes = recent.reduce((s, e) => s + e.bytesTransferred, 0) / recent.length;
      if (event.bytesTransferred > avgBytes * 5 && event.bytesTransferred > 50_000_000) {
        anomalies.push({
          id: this.generateId('ano'),
          timestamp: Date.now(),
          flowId: event.flowId,
          flowName: flow.name,
          anomalyType: 'volume_spike',
          severity: 'high',
          description: `Volume spike: ${event.bytesTransferred} bytes (avg ${avgBytes.toFixed(0)})`,
          evidence: [`bytes=${event.bytesTransferred}`, `avg=${avgBytes.toFixed(0)}`],
          relatedEvents: [event.id],
          expectedValue: `${avgBytes.toFixed(0)}`,
          actualValue: `${event.bytesTransferred}`,
          recommendation: 'Verify transfer is expected; consider throttling',
          resolved: false,
          notes: '',
        });
      }
      if (flow.sourceClassification === 'restricted' && (flow.destinationCountry === 'US' || flow.destinationCountry === 'GB')) {
        anomalies.push({
          id: this.generateId('ano'),
          timestamp: Date.now(),
          flowId: event.flowId,
          flowName: flow.name,
          anomalyType: 'cross_border_unexpected',
          severity: 'critical',
          description: `Cross-border flow of restricted data to ${flow.destinationCountry}`,
          evidence: [`source=${flow.sourceRegion}`, `dest=${flow.destinationRegion}/${flow.destinationCountry}`, `classification=${flow.sourceClassification}`],
          relatedEvents: [event.id],
          expectedValue: 'domestic',
          actualValue: `${flow.destinationCountry}`,
          recommendation: 'Review cross-border transfer; ensure valid legal basis (SCC, BCRs)',
          resolved: false,
          notes: '',
        });
      }
    }

    if (anomalies.length > 0) {
      const all = await this.loadAnomalies();
      all.push(...anomalies);
      if (all.length > 10000) all.splice(0, all.length - 10000);
      await this.store.set(STORE_KEYS.anomalies, all);
    }
    return anomalies;
  }

  private emptyFlowTypeMap(): Record<FlowType, number> {
    return { etl: 0, replication: 0, sync: 0, api_call: 0, event_stream: 0, batch_upload: 0, cross_region: 0, cross_cloud: 0, backup: 0, export: 0, unknown: 0 };
  }
  private emptyStatusMap(): Record<FlowStatus, number> {
    return { active: 0, paused: 0, failed: 0, completed: 0, rate_limited: 0, pending: 0 };
  }

  private async loadFlows(): Promise<DataFlow[]> {
    return (await this.store.get<DataFlow[]>(STORE_KEYS.flows)) || [];
  }

  private async loadEvents(): Promise<FlowEvent[]> {
    return (await this.store.get<FlowEvent[]>(STORE_KEYS.events)) || [];
  }

  private async loadAnomalies(): Promise<FlowAnomaly[]> {
    return (await this.store.get<FlowAnomaly[]>(STORE_KEYS.anomalies)) || [];
  }

  private generateId(prefix: string): string {
    return `${prefix}_${randomUUID()}`;
  }
}

const STORE_KEYS = {
  flows: 'dspm/data-flows.json',
  events: 'dspm/flow-events.json',
  anomalies: 'dspm/flow-anomalies.json',
};
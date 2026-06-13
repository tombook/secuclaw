import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type EntityType = 'user' | 'host' | 'service' | 'application' | 'ip';

export type ActivityType =
  | 'login'
  | 'file_access'
  | 'network'
  | 'process'
  | 'database'
  | 'privilege'
  | 'data_transfer'
  | 'api_call';

export interface EntityActivity {
  id: string;
  entityId: string;
  entityType: EntityType;
  activityType: ActivityType;
  timestamp: number;
  hour: number;
  dayOfWeek: number;
  location: string | null;
  sourceIp: string | null;
  resource: string | null;
  bytesTransferred: number;
  status: 'success' | 'failure' | 'denied';
  metadata: Record<string, unknown>;
}

export interface BehaviorPattern {
  entityId: string;
  entityType: EntityType;
  activityType: ActivityType;
  typicalHours: number[];
  typicalDays: number[];
  typicalLocations: string[];
  typicalSourceIps: string[];
  typicalResources: string[];
  avgBytesTransferred: number;
  stdDevBytesTransferred: number;
  successRate: number;
  totalEvents: number;
  timeRange: { start: number; end: number };
  sampleCount: number;
  lastUpdated: number;
}

export interface AnomalyScore {
  entityId: string;
  activity: EntityActivity;
  overallScore: number;
  factors: Array<{ type: string; score: number; description: string }>;
  isAnomalous: boolean;
  confidence: number;
  baselineAge: number;
}

const STORE_KEYS = {
  activities: 'ueba/activities.json',
  baselines: 'ueba/baselines.json',
} as const;

const ANOMALY_THRESHOLD = 60;
const VOLUME_ZSCORE_THRESHOLD = 3;
const TOP_N_HOURS = 6;
const TOP_N_DAYS = 5;
const TOP_N_VALUES = 10;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export class BehaviorBaselineService {
  constructor(private store: JsonStore) {}

  async recordActivity(activity: EntityActivity): Promise<void> {
    const activities = (await this.store.get<EntityActivity[]>(STORE_KEYS.activities)) || [];
    const toStore: EntityActivity = activity.id ? activity : { ...activity, id: this.generateId() };
    activities.push(toStore);
    await this.store.set(STORE_KEYS.activities, activities);
  }

  async recordBatch(activities: EntityActivity[]): Promise<void> {
    if (activities.length === 0) return;
    const existing = (await this.store.get<EntityActivity[]>(STORE_KEYS.activities)) || [];
    const enriched = activities.map((a) => (a.id ? a : { ...a, id: this.generateId() }));
    await this.store.set(STORE_KEYS.activities, [...existing, ...enriched]);
  }

  async buildBaseline(
    entityId: string,
    entityType: EntityType,
    timeRange?: { start: number; end: number }
  ): Promise<BehaviorPattern | null> {
    const all = (await this.store.get<EntityActivity[]>(STORE_KEYS.activities)) || [];
    const filtered = all.filter(
      (a) =>
        a.entityId === entityId &&
        a.entityType === entityType &&
        (!timeRange || (a.timestamp >= timeRange.start && a.timestamp <= timeRange.end))
    );

    if (filtered.length === 0) return null;

    const grouped = this.groupByActivityType(filtered);
    const patterns: BehaviorPattern[] = [];
    for (const [activityType, items] of grouped.entries()) {
      const pattern = this.computePattern(entityId, entityType, activityType, items);
      patterns.push(pattern);
    }

    const existing = (await this.store.get<BehaviorPattern[]>(STORE_KEYS.baselines)) || [];
    const other = existing.filter(
      (p) => !(p.entityId === entityId && p.entityType === entityType)
    );
    await this.store.set(STORE_KEYS.baselines, [...other, ...patterns]);
    return patterns[0] || null;
  }

  async buildAllBaselines(): Promise<BehaviorPattern[]> {
    const all = (await this.store.get<EntityActivity[]>(STORE_KEYS.activities)) || [];
    if (all.length === 0) {
      await this.store.set(STORE_KEYS.baselines, []);
      return [];
    }

    const keys = new Set<string>();
    for (const a of all) keys.add(`${a.entityId}::${a.entityType}`);

    const patterns: BehaviorPattern[] = [];
    for (const key of keys) {
      const [entityId, entityType] = key.split('::') as [string, EntityType];
      await this.buildBaseline(entityId, entityType);
    }

    const stored = (await this.store.get<BehaviorPattern[]>(STORE_KEYS.baselines)) || [];
    for (const key of keys) {
      const [entityId, entityType] = key.split('::') as [string, EntityType];
      for (const p of stored) {
        if (p.entityId === entityId && p.entityType === entityType) patterns.push(p);
      }
    }

    return patterns;
  }

  async getBaseline(entityId: string, activityType: ActivityType): Promise<BehaviorPattern | null> {
    const baselines = (await this.store.get<BehaviorPattern[]>(STORE_KEYS.baselines)) || [];
    return (
      baselines.find((b) => b.entityId === entityId && b.activityType === activityType) || null
    );
  }

  async listBaselines(filters?: {
    entityType?: EntityType;
    minSampleCount?: number;
  }): Promise<BehaviorPattern[]> {
    const baselines = (await this.store.get<BehaviorPattern[]>(STORE_KEYS.baselines)) || [];
    if (!filters) return baselines;
    return baselines.filter(
      (b) =>
        (!filters.entityType || b.entityType === filters.entityType) &&
        (!filters.minSampleCount || b.sampleCount >= filters.minSampleCount)
    );
  }

  async deleteBaseline(entityId: string, activityType: ActivityType): Promise<boolean> {
    const baselines = (await this.store.get<BehaviorPattern[]>(STORE_KEYS.baselines)) || [];
    const next = baselines.filter(
      (b) => !(b.entityId === entityId && b.activityType === activityType)
    );
    if (next.length === baselines.length) return false;
    await this.store.set(STORE_KEYS.baselines, next);
    return true;
  }

  async detectAnomaly(activity: EntityActivity): Promise<AnomalyScore | null> {
    const baseline = await this.getBaseline(activity.entityId, activity.activityType);
    if (!baseline) return null;
    return this.scoreAgainstBaseline(activity, baseline);
  }

  async detectAnomalies(activities: EntityActivity[]): Promise<AnomalyScore[]> {
    const results: AnomalyScore[] = [];
    for (const activity of activities) {
      const score = await this.detectAnomaly(activity);
      if (score && score.isAnomalous) results.push(score);
    }
    return results;
  }

  private computeTypicalHours(activities: EntityActivity[]): number[] {
    const counts = new Array<number>(24).fill(0);
    for (const a of activities) {
      if (a.hour >= 0 && a.hour < 24) counts[a.hour] += 1;
    }
    return this.topNIndices(counts, TOP_N_HOURS);
  }

  private computeTypicalLocations(activities: EntityActivity[]): string[] {
    const counts = new Map<string, number>();
    for (const a of activities) {
      if (a.location) counts.set(a.location, (counts.get(a.location) || 0) + 1);
    }
    return this.topNKeys(counts, TOP_N_VALUES);
  }

  private computeStdDev(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private computeZScore(value: number, mean: number, stdDev: number): number {
    if (stdDev === 0) return value === mean ? 0 : value > mean ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    return (value - mean) / stdDev;
  }

  private isInTimeRange(
    hour: number,
    days: number[],
    typicalHours: number[],
    typicalDays: number[]
  ): number {
    let score = 0;
    if (typicalHours.length > 0 && !typicalHours.includes(hour)) score += 1;
    if (typicalDays.length > 0 && !typicalDays.includes(days[0] ?? 0)) score += 1;
    return score;
  }

  private generateId(): string {
    return randomUUID();
  }

  private groupByActivityType(activities: EntityActivity[]): Map<ActivityType, EntityActivity[]> {
    const map = new Map<ActivityType, EntityActivity[]>();
    for (const a of activities) {
      const list = map.get(a.activityType) || [];
      list.push(a);
      map.set(a.activityType, list);
    }
    return map;
  }

  private computePattern(
    entityId: string,
    entityType: EntityType,
    activityType: ActivityType,
    activities: EntityActivity[]
  ): BehaviorPattern {
    const typicalHours = this.computeTypicalHours(activities);

    const dayCounts = new Array<number>(7).fill(0);
    for (const a of activities) {
      if (a.dayOfWeek >= 0 && a.dayOfWeek < 7) dayCounts[a.dayOfWeek] += 1;
    }
    const typicalDays = this.topNIndices(dayCounts, TOP_N_DAYS);

    const typicalLocations = this.computeTypicalLocations(activities);

    const ipCounts = new Map<string, number>();
    for (const a of activities) {
      if (a.sourceIp) ipCounts.set(a.sourceIp, (ipCounts.get(a.sourceIp) || 0) + 1);
    }
    const typicalSourceIps = this.topNKeys(ipCounts, TOP_N_VALUES);

    const resourceCounts = new Map<string, number>();
    for (const a of activities) {
      if (a.resource) resourceCounts.set(a.resource, (resourceCounts.get(a.resource) || 0) + 1);
    }
    const typicalResources = this.topNKeys(resourceCounts, TOP_N_VALUES);

    const byteValues = activities.map((a) => a.bytesTransferred);
    const avg = byteValues.length > 0 ? byteValues.reduce((s, v) => s + v, 0) / byteValues.length : 0;
    const stdDev = this.computeStdDev(byteValues, avg);

    const successCount = activities.filter((a) => a.status === 'success').length;
    const successRate = activities.length > 0 ? successCount / activities.length : 0;

    const timestamps = activities.map((a) => a.timestamp);
    const start = timestamps.length > 0 ? Math.min(...timestamps) : 0;
    const end = timestamps.length > 0 ? Math.max(...timestamps) : 0;

    return {
      entityId,
      entityType,
      activityType,
      typicalHours,
      typicalDays,
      typicalLocations,
      typicalSourceIps,
      typicalResources,
      avgBytesTransferred: avg,
      stdDevBytesTransferred: stdDev,
      successRate,
      totalEvents: activities.length,
      timeRange: { start, end },
      sampleCount: activities.length,
      lastUpdated: Date.now(),
    };
  }

  private topNIndices(counts: number[], n: number): number[] {
    const indices = counts.map((value, index) => ({ value, index }));
    indices.sort((a, b) => b.value - a.value);
    const result: number[] = [];
    for (let i = 0; i < Math.min(n, indices.length); i++) {
      const item = indices[i];
      if (item && item.value > 0) result.push(item.index);
    }
    return result.sort((a, b) => a - b);
  }

  private topNKeys(counts: Map<string, number>, n: number): string[] {
    const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    return entries.slice(0, n).map(([k]) => k);
  }

  private scoreAgainstBaseline(activity: EntityActivity, baseline: BehaviorPattern): AnomalyScore {
    const factors: Array<{ type: string; score: number; description: string }> = [];
    let score = 0;

    if (baseline.typicalHours.length > 0 && !baseline.typicalHours.includes(activity.hour)) {
      score += 40;
      factors.push({
        type: 'time',
        score: 40,
        description: `Activity hour ${activity.hour} is outside typical hours`,
      });
    }

    if (baseline.typicalDays.length > 0 && !baseline.typicalDays.includes(activity.dayOfWeek)) {
      score += 20;
      factors.push({
        type: 'day',
        score: 20,
        description: `Activity day ${activity.dayOfWeek} is outside typical days`,
      });
    }

    if (
      activity.location &&
      baseline.typicalLocations.length > 0 &&
      !baseline.typicalLocations.includes(activity.location)
    ) {
      score += 30;
      factors.push({
        type: 'location',
        score: 30,
        description: `Location '${activity.location}' is not in typical locations`,
      });
    }

    if (
      activity.sourceIp &&
      baseline.typicalSourceIps.length > 0 &&
      !baseline.typicalSourceIps.includes(activity.sourceIp)
    ) {
      score += 25;
      factors.push({
        type: 'ip',
        score: 25,
        description: `Source IP '${activity.sourceIp}' is not in typical source IPs`,
      });
    }

    const z = this.computeZScore(
      activity.bytesTransferred,
      baseline.avgBytesTransferred,
      baseline.stdDevBytesTransferred
    );
    if (z > VOLUME_ZSCORE_THRESHOLD) {
      score += 35;
      factors.push({
        type: 'volume',
        score: 35,
        description: `Bytes transferred (${activity.bytesTransferred}) exceeds 3 standard deviations from baseline`,
      });
    }

    if (activity.status === 'failure' || activity.status === 'denied') {
      if (baseline.successRate >= 0.8) {
        score += 15;
        factors.push({
          type: 'status',
          score: 15,
          description: `Activity status '${activity.status}' deviates from typical success rate`,
        });
      }
    }

    const isAnomalous = score > ANOMALY_THRESHOLD;
    const confidence = this.computeConfidence(baseline, factors.length);
    const baselineAge = baseline.lastUpdated > 0 ? Math.floor((Date.now() - baseline.lastUpdated) / MS_PER_DAY) : 0;

    return {
      entityId: activity.entityId,
      activity,
      overallScore: Math.min(100, Math.round(score)),
      factors,
      isAnomalous,
      confidence,
      baselineAge,
    };
  }

  private computeConfidence(baseline: BehaviorPattern, factorCount: number): number {
    const sampleConfidence = Math.min(1, baseline.sampleCount / 100);
    const factorConfidence = Math.min(1, factorCount / 3);
    return Math.max(0, Math.min(1, sampleConfidence * 0.7 + factorConfidence * 0.3));
  }
}

import type { JsonStore } from '../storage/json-store.js';
import { createHash } from 'crypto';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type AlertEntityType = 'user' | 'host' | 'ip' | 'process' | 'file' | 'domain';

export interface AlertEntity {
  type: AlertEntityType;
  id: string;
}

export interface RawAlert {
  id: string;
  timestamp: number;
  source: string;
  alertType: string;
  severity: AlertSeverity;
  entity: AlertEntity;
  description: string;
  rawData: Record<string, unknown>;
}

export interface DeduplicationResult {
  fingerprint: string;
  merged: number;
  alertIds: string[];
  firstSeen: number;
  lastSeen: number;
  totalOccurrences: number;
}

export type AssetType = 'production' | 'staging' | 'dev' | 'test' | 'dmz' | 'internal';
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted' | 'top_secret';

export interface AssetCriticality {
  assetId: string;
  assetType: AssetType;
  businessValue: number;
  dataClassification: DataClassification;
  internetExposed: boolean;
  criticalityScore: number;
}

export interface PriorityFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
}

export interface DeduplicationConfig {
  fieldsForFingerprint: string[];
  timeWindowMs: number;
  similarityThreshold: number;
}

export interface PriorityContext {
  alert: RawAlert;
  asset: AssetCriticality | null;
  businessHours: boolean;
  recentIncidentCount: number;
  threatIntelMatch: boolean;
  isHoliday: boolean;
}

export interface PriorityResult {
  score: number;
  severity: AlertSeverity;
  factors: PriorityFactor[];
}

export interface DeduplicationStats {
  total: number;
  unique: number;
  duplicates: number;
  dedupRate: number;
}

const DEFAULT_CONFIG: DeduplicationConfig = {
  fieldsForFingerprint: ['source', 'alertType', 'entity.id'],
  timeWindowMs: 300000,
  similarityThreshold: 0.85,
};

const ASSET_STORE_KEY = 'soar/asset-criticality.json';

const ASSET_TYPE_WEIGHT: Record<AssetType, number> = {
  production: 100,
  staging: 70,
  dmz: 80,
  internal: 60,
  dev: 30,
  test: 20,
};

const DATA_CLASS_WEIGHT: Record<DataClassification, number> = {
  top_secret: 100,
  restricted: 85,
  confidential: 60,
  internal: 30,
  public: 5,
};

const SEVERITY_SCORE: Record<AlertSeverity, number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
  info: 10,
};

function getFieldValue(alert: RawAlert, path: string): string {
  const parts = path.split('.');
  let current: unknown = alert;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') return '';
    current = (current as Record<string, unknown>)[part];
  }
  if (current === null || current === undefined) return '';
  if (typeof current === 'string') return current;
  if (typeof current === 'number' || typeof current === 'boolean') return String(current);
  try {
    return JSON.stringify(current);
  } catch {
    return '';
  }
}

function hashFingerprint(payload: string): string {
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function tokensForSimilarity(alert: RawAlert): Set<string> {
  const tokens = new Set<string>();
  const fields = [
    alert.source,
    alert.alertType,
    alert.severity,
    alert.entity.type,
    alert.entity.id,
    alert.description,
  ];
  for (const f of fields) {
    if (!f) continue;
    for (const token of f.toLowerCase().split(/[^a-z0-9_]+/).filter(Boolean)) {
      tokens.add(token);
    }
  }
  return tokens;
}

export class Deduplicator {
  private config: DeduplicationConfig;
  private groups: Map<string, DeduplicationResult> = new Map();
  private totalProcessed = 0;

  constructor(private store: JsonStore, config?: Partial<DeduplicationConfig>) {
    this.config = {
      fieldsForFingerprint: config?.fieldsForFingerprint ?? DEFAULT_CONFIG.fieldsForFingerprint,
      timeWindowMs: config?.timeWindowMs ?? DEFAULT_CONFIG.timeWindowMs,
      similarityThreshold: config?.similarityThreshold ?? DEFAULT_CONFIG.similarityThreshold,
    };
  }

  computeFingerprint(alert: RawAlert): string {
    const payload = this.config.fieldsForFingerprint
      .map((field) => getFieldValue(alert, field))
      .join('|');
    return hashFingerprint(payload);
  }

  computeSimilarity(alert1: RawAlert, alert2: RawAlert): number {
    const tokens1 = tokensForSimilarity(alert1);
    const tokens2 = tokensForSimilarity(alert2);
    if (tokens1.size === 0 && tokens2.size === 0) return 1;
    if (tokens1.size === 0 || tokens2.size === 0) return 0;

    let intersection = 0;
    for (const t of tokens1) {
      if (tokens2.has(t)) intersection++;
    }
    const union = tokens1.size + tokens2.size - intersection;
    const jaccard = union === 0 ? 0 : intersection / union;

    let fieldScoreSum = 0;
    let fieldCount = 0;
    const compareFields = ['source', 'alertType', 'severity', 'entity.type', 'entity.id'];
    for (const field of compareFields) {
      const a = getFieldValue(alert1, field);
      const b = getFieldValue(alert2, field);
      if (a === '' && b === '') continue;
      fieldCount++;
      if (a === b) fieldScoreSum += 1;
      else if (a && b && (a.includes(b) || b.includes(a))) fieldScoreSum += 0.5;
    }
    const fieldSimilarity = fieldCount === 0 ? 0 : fieldScoreSum / fieldCount;

    return Math.max(0, Math.min(1, jaccard * 0.4 + fieldSimilarity * 0.6));
  }

  deduplicate(alerts: RawAlert[]): Map<string, DeduplicationResult> {
    this.groups.clear();
    const sorted = [...alerts].sort((a, b) => a.timestamp - b.timestamp);
    const representativeByGroup = new Map<string, RawAlert>();

    for (const alert of sorted) {
      this.totalProcessed++;
      const fingerprint = this.computeFingerprint(alert);
      const existing = this.groups.get(fingerprint);

      if (existing) {
        existing.alertIds.push(alert.id);
        existing.merged++;
        existing.totalOccurrences++;
        existing.lastSeen = Math.max(existing.lastSeen, alert.timestamp);
        existing.firstSeen = Math.min(existing.firstSeen, alert.timestamp);
        continue;
      }

      let mergedIntoKey: string | null = null;
      for (const [key, result] of this.groups.entries()) {
        const representative = representativeByGroup.get(key);
        if (!representative) continue;
        if (Math.abs(alert.timestamp - result.lastSeen) > this.config.timeWindowMs) continue;
        const similarity = this.computeSimilarity(alert, representative);
        if (similarity >= this.config.similarityThreshold) {
          mergedIntoKey = key;
          break;
        }
      }

      if (mergedIntoKey) {
        const result = this.groups.get(mergedIntoKey)!;
        result.alertIds.push(alert.id);
        result.merged++;
        result.totalOccurrences++;
        result.lastSeen = Math.max(result.lastSeen, alert.timestamp);
        result.firstSeen = Math.min(result.firstSeen, alert.timestamp);
        continue;
      }

      this.groups.set(fingerprint, {
        fingerprint,
        merged: 0,
        alertIds: [alert.id],
        firstSeen: alert.timestamp,
        lastSeen: alert.timestamp,
        totalOccurrences: 1,
      });
      representativeByGroup.set(fingerprint, alert);
    }

    return new Map(this.groups);
  }

  async getStats(): Promise<DeduplicationStats> {
    let totalOccurrences = 0;
    let unique = 0;
    for (const result of this.groups.values()) {
      totalOccurrences += result.alertIds.length;
      unique++;
    }
    const total = this.totalProcessed;
    const duplicates = Math.max(0, totalOccurrences - unique);
    const dedupRate = total === 0 ? 0 : duplicates / total;
    void this.store;
    return { total, unique, duplicates, dedupRate };
  }
}

export class PriorityCalculator {
  private assets: Map<string, AssetCriticality> = new Map();
  private loaded = false;

  constructor(private store: JsonStore) {}

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    const raw = await this.store.get<AssetCriticality[]>(ASSET_STORE_KEY);
    if (Array.isArray(raw)) {
      for (const asset of raw) {
        if (asset && typeof asset.assetId === 'string') {
          this.assets.set(asset.assetId, asset);
        }
      }
    }
    this.loaded = true;
  }

  async registerAsset(asset: AssetCriticality): Promise<void> {
    await this.ensureLoaded();
    this.assets.set(asset.assetId, asset);
    await this.persist();
  }

  async getAsset(assetId: string): Promise<AssetCriticality | null> {
    await this.ensureLoaded();
    return this.assets.get(assetId) ?? null;
  }

  async listAssets(filters?: { type?: string; minCriticality?: number }): Promise<AssetCriticality[]> {
    await this.ensureLoaded();
    let results = Array.from(this.assets.values());
    if (filters?.type) {
      results = results.filter((a) => a.assetType === filters.type);
    }
    if (typeof filters?.minCriticality === 'number') {
      const min = filters.minCriticality;
      results = results.filter((a) => a.criticalityScore >= min);
    }
    return results.sort((a, b) => b.criticalityScore - a.criticalityScore);
  }

  toSeverity(score: number): AlertSeverity {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'info';
  }

  calculate(context: PriorityContext): PriorityResult {
    const assetFactor = this.scoreAssetFactor(context);
    const intelFactor = this.scoreThreatIntelFactor(context);
    const severityFactor = this.scoreSeverityFactor(context);
    const recentFactor = this.scoreRecentIncidentFactor(context);
    const hoursFactor = this.scoreBusinessHoursFactor(context);

    const factors: PriorityFactor[] = [
      assetFactor,
      intelFactor,
      severityFactor,
      recentFactor,
      hoursFactor,
    ];

    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const weightedSum = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
    const rawScore = totalWeight === 0 ? 0 : weightedSum / totalWeight;

    const score = clampScore(rawScore);
    const severity = this.toSeverity(score);
    return { score, severity, factors };
  }

  explain(context: PriorityContext): string {
    const result = this.calculate(context);
    const lines: string[] = [];
    lines.push(`Priority score: ${result.score} (${result.severity})`);
    for (const factor of result.factors) {
      lines.push(`  - ${factor.name} [weight=${factor.weight}]: ${factor.score} - ${factor.description}`);
    }
    if (context.alert) {
      lines.push(`Alert: ${context.alert.alertType} on ${context.alert.entity.type}:${context.alert.entity.id}`);
    }
    return lines.join('\n');
  }

  private scoreAssetFactor(context: PriorityContext): PriorityFactor {
    if (!context.asset) {
      return {
        name: 'Asset Criticality',
        weight: 30,
        score: 30,
        description: 'No asset context available; defaulting to baseline criticality',
      };
    }
    const asset = context.asset;
    const typeScore = ASSET_TYPE_WEIGHT[asset.assetType] ?? 50;
    const dataScore = DATA_CLASS_WEIGHT[asset.dataClassification] ?? 30;
    const exposureBoost = asset.internetExposed ? 20 : 0;
    const businessScore = Math.max(0, Math.min(100, asset.businessValue));
    const storedScore = Math.max(0, Math.min(100, asset.criticalityScore));

    const blended = (typeScore + dataScore + businessScore + storedScore) / 4 + exposureBoost;
    const score = clampScore(blended);

    return {
      name: 'Asset Criticality',
      weight: 30,
      score,
      description: `Asset ${asset.assetId} (${asset.assetType}, ${asset.dataClassification}${asset.internetExposed ? ', internet-exposed' : ''})`,
    };
  }

  private scoreThreatIntelFactor(context: PriorityContext): PriorityFactor {
    const score = context.threatIntelMatch ? 100 : 20;
    return {
      name: 'Threat Intel Match',
      weight: 25,
      score,
      description: context.threatIntelMatch
        ? 'Indicator matched a known threat intelligence feed'
        : 'No threat intelligence correlation found',
    };
  }

  private scoreSeverityFactor(context: PriorityContext): PriorityFactor {
    const score = SEVERITY_SCORE[context.alert.severity] ?? 50;
    return {
      name: 'Alert Severity',
      weight: 20,
      score,
      description: `Declared alert severity: ${context.alert.severity}`,
    };
  }

  private scoreRecentIncidentFactor(context: PriorityContext): PriorityFactor {
    const count = Math.max(0, context.recentIncidentCount);
    const score = clampScore(Math.min(100, count * 20));
    return {
      name: 'Recent Incident Count',
      weight: 15,
      score,
      description: `${count} incident(s) in the last 24h for this entity`,
    };
  }

  private scoreBusinessHoursFactor(context: PriorityContext): PriorityFactor {
    let score = 50;
    const reasons: string[] = [];
    if (context.businessHours) {
      score += 30;
      reasons.push('business hours');
    } else {
      score -= 10;
      reasons.push('off hours');
    }
    if (context.isHoliday) {
      score -= 10;
      reasons.push('holiday');
    }
    return {
      name: 'Business Hours Flag',
      weight: 10,
      score: clampScore(score),
      description: `Context: ${reasons.join(', ') || 'no temporal signal'}`,
    };
  }

  private async persist(): Promise<void> {
    const list = Array.from(this.assets.values());
    await this.store.set(ASSET_STORE_KEY, list);
  }
}
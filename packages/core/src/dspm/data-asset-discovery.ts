import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type DataAssetType = 'database' | 'table' | 'column' | 'file' | 'object_storage' | 's3_bucket' | 'blob' | 'queue' | 'topic' | 'cache' | 'log' | 'data_lake' | 'bigquery' | 'snowflake' | 'elasticsearch_index' | 'unknown';
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted' | 'top_secret';
export type SensitivityLevel = DataClassification;
export type EncryptionStatus = 'unencrypted' | 'encrypted_at_rest' | 'encrypted_in_transit' | 'fully_encrypted' | 'unknown';
export type AccessControl = 'public' | 'authenticated' | 'rbac' | 'abac' | 'no_access' | 'unknown';

export interface DataAsset {
  id: string;
  name: string;
  type: DataAssetType;
  location: string;
  region: string | null;
  sizeBytes: number;
  rowCount: number | null;
  classification: DataClassification;
  piiTypes: string[];
  phi: boolean;
  pci: boolean;
  source: string;
  tags: string[];
  encryption: EncryptionStatus;
  accessControl: AccessControl;
  retentionDays: number | null;
  residency: string | null;
  discoveredAt: number;
  lastScanned: number;
  businessOwner: string | null;
  dataSteward: string | null;
  riskScore: number;
  riskFactors: string[];
  metadata: Record<string, unknown>;
  monitored: boolean;
}

export interface DataClassificationPattern {
  id: string;
  name: string;
  description: string;
  dataType: 'pii' | 'phi' | 'pci' | 'confidential' | 'credential' | 'business';
  pattern: RegExp;
  sensitivity: SensitivityLevel;
  examples: string[];
  enabled: boolean;
}

export interface DataAssetStats {
  totalAssets: number;
  byType: Record<DataAssetType, number>;
  byClassification: Record<DataClassification, number>;
  byEncryption: Record<EncryptionStatus, number>;
  byAccess: Record<AccessControl, number>;
  unencryptedPii: number;
  publicAccessPii: number;
  highRiskCount: number;
  totalPiiBytes: number;
  byRegion: Record<string, number>;
}

export class DataAssetDiscovery {
  constructor(private store: JsonStore) {}

  async registerAsset(asset: Omit<DataAsset, 'id' | 'discoveredAt' | 'lastScanned' | 'riskScore' | 'riskFactors'>): Promise<DataAsset> {
    const newAsset: DataAsset = {
      ...asset,
      id: this.generateId('da'),
      discoveredAt: Date.now(),
      lastScanned: Date.now(),
      riskScore: 0,
      riskFactors: [],
    };
    newAsset.riskScore = this.computeRiskScore(newAsset);
    newAsset.riskFactors = this.computeRiskFactors(newAsset);
    const assets = await this.loadAssets();
    assets.push(newAsset);
    await this.store.set(STORE_KEYS.assets, assets);
    return newAsset;
  }

  async updateAsset(assetId: string, updates: Partial<DataAsset>): Promise<DataAsset | null> {
    const assets = await this.loadAssets();
    const idx = assets.findIndex((a) => a.id === assetId);
    if (idx === -1) return null;
    assets[idx] = { ...assets[idx], ...updates, lastScanned: Date.now() };
    assets[idx].riskScore = this.computeRiskScore(assets[idx]);
    assets[idx].riskFactors = this.computeRiskFactors(assets[idx]);
    await this.store.set(STORE_KEYS.assets, assets);
    return assets[idx];
  }

  async getAsset(assetId: string): Promise<DataAsset | null> {
    const assets = await this.loadAssets();
    return assets.find((a) => a.id === assetId) || null;
  }

  async listAssets(filters?: { type?: DataAssetType; classification?: DataClassification; encryption?: EncryptionStatus; minRiskScore?: number; region?: string; piiOnly?: boolean; monitored?: boolean; limit?: number }): Promise<DataAsset[]> {
    let assets = await this.loadAssets();
    if (filters?.type) assets = assets.filter((a) => a.type === filters.type);
    if (filters?.classification) assets = assets.filter((a) => a.classification === filters.classification);
    if (filters?.encryption) assets = assets.filter((a) => a.encryption === filters.encryption);
    if (filters?.region) assets = assets.filter((a) => a.region === filters.region);
    if (filters?.monitored !== undefined) assets = assets.filter((a) => a.monitored === filters.monitored);
    if (filters?.piiOnly) assets = assets.filter((a) => a.piiTypes.length > 0 || a.phi || a.pci);
    if (filters?.minRiskScore !== undefined) assets = assets.filter((a) => a.riskScore >= filters.minRiskScore!);
    assets.sort((a, b) => b.riskScore - a.riskScore);
    if (filters?.limit !== undefined) assets = assets.slice(0, filters.limit);
    return assets;
  }

  async deleteAsset(assetId: string): Promise<boolean> {
    const assets = await this.loadAssets();
    const filtered = assets.filter((a) => a.id !== assetId);
    if (filtered.length === assets.length) return false;
    await this.store.set(STORE_KEYS.assets, filtered);
    return true;
  }

  async scanDataSample(sample: string): Promise<{ piiTypes: string[]; phi: boolean; pci: boolean; recommendedClassification: DataClassification }> {
    const piiTypes: string[] = [];
    let phi = false;
    let pci = false;
    const patterns = this.buildBuiltInPatterns();
    for (const pat of patterns) {
      if (!pat.enabled) continue;
      if (pat.pattern.test(sample)) {
        if (pat.dataType === 'pii') piiTypes.push(pat.name);
        if (pat.dataType === 'phi') phi = true;
        if (pat.dataType === 'pci') pci = true;
      }
    }
    let recommendedClassification: DataClassification = 'public';
    if (phi || pci) recommendedClassification = 'restricted';
    else if (piiTypes.length > 0) recommendedClassification = 'confidential';
    return { piiTypes, phi, pci, recommendedClassification };
  }

  async getStats(): Promise<DataAssetStats> {
    const assets = await this.loadAssets();
    const byType = this.emptyTypeMap();
    const byClassification = this.emptyClassificationMap();
    const byEncryption = this.emptyEncryptionMap();
    const byAccess = this.emptyAccessMap();
    const byRegion: Record<string, number> = {};
    let unencryptedPii = 0;
    let publicAccessPii = 0;
    let highRiskCount = 0;
    let totalPiiBytes = 0;
    for (const a of assets) {
      byType[a.type]++;
      byClassification[a.classification]++;
      byEncryption[a.encryption]++;
      byAccess[a.accessControl]++;
      if (a.region) byRegion[a.region] = (byRegion[a.region] || 0) + 1;
      if (a.riskScore >= 70) highRiskCount++;
      const hasPii = a.piiTypes.length > 0 || a.phi || a.pci;
      if (hasPii) {
        if (a.encryption === 'unencrypted' || a.encryption === 'unknown') unencryptedPii++;
        if (a.accessControl === 'public') publicAccessPii++;
        totalPiiBytes += a.sizeBytes;
      }
    }
    return {
      totalAssets: assets.length,
      byType,
      byClassification,
      byEncryption,
      byAccess,
      unencryptedPii,
      publicAccessPii,
      highRiskCount,
      totalPiiBytes,
      byRegion,
    };
  }

  private computeRiskScore(asset: DataAsset): number {
    let score = 0;
    const sensitivityWeight: Record<DataClassification, number> = { public: 0, internal: 5, confidential: 20, restricted: 35, top_secret: 50 };
    score += sensitivityWeight[asset.classification];
    if (asset.phi) score += 20;
    if (asset.pci) score += 20;
    score += Math.min(20, asset.piiTypes.length * 5);
    if (asset.encryption === 'unencrypted') score += 25;
    else if (asset.encryption === 'unknown') score += 10;
    else if (asset.encryption === 'encrypted_in_transit') score += 5;
    if (asset.accessControl === 'public') score += 25;
    else if (asset.accessControl === 'authenticated') score += 10;
    else if (asset.accessControl === 'no_access') score += 15;
    if (asset.sizeBytes > 1_000_000_000) score += 10;
    if (asset.region && !['cn-north-1', 'cn-east-1', 'cn-northwest-1'].includes(asset.region)) score += 5;
    return Math.min(100, score);
  }

  private computeRiskFactors(asset: DataAsset): string[] {
    const factors: string[] = [];
    if (asset.phi) factors.push('contains_phi');
    if (asset.pci) factors.push('contains_pci');
    if (asset.piiTypes.length > 0) factors.push('contains_pii');
    if (asset.encryption === 'unencrypted') factors.push('unencrypted_at_rest');
    if (asset.encryption === 'unknown') factors.push('encryption_unknown');
    if (asset.accessControl === 'public') factors.push('publicly_accessible');
    if (asset.accessControl === 'no_access') factors.push('access_control_misconfigured');
    if (asset.classification === 'top_secret' || asset.classification === 'restricted') factors.push('high_sensitivity');
    if (asset.sizeBytes > 1_000_000_000) factors.push('large_data_volume');
    return factors;
  }

  private buildBuiltInPatterns(): DataClassificationPattern[] {
    return [
      { id: 'pat-email', name: 'Email Address', description: 'Email addresses', dataType: 'pii', pattern: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, sensitivity: 'confidential', examples: ['john@example.com'], enabled: true },
      { id: 'pat-cn-phone', name: 'Chinese Phone', description: 'Chinese mobile phone numbers', dataType: 'pii', pattern: /\b1[3-9]\d{9}\b/g, sensitivity: 'confidential', examples: ['13812345678'], enabled: true },
      { id: 'pat-cn-id', name: 'Chinese ID', description: 'Chinese ID card numbers', dataType: 'pii', pattern: /\b[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/g, sensitivity: 'restricted', examples: ['110101199003078811'], enabled: true },
      { id: 'pat-cc', name: 'Credit Card', description: 'Credit card numbers', dataType: 'pci', pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, sensitivity: 'restricted', examples: ['4111 1111 1111 1111'], enabled: true },
      { id: 'pat-ssn', name: 'US SSN', description: 'US Social Security Numbers', dataType: 'pii', pattern: /\b\d{3}-\d{2}-\d{4}\b/g, sensitivity: 'restricted', examples: ['123-45-6789'], enabled: true },
      { id: 'pat-aws', name: 'AWS Access Key', description: 'AWS access key IDs', dataType: 'credential', pattern: /\bAKIA[0-9A-Z]{16}\b/g, sensitivity: 'restricted', examples: ['AKIAIOSFODNN7EXAMPLE'], enabled: true },
      { id: 'pat-passport', name: 'Passport Number', description: 'Generic passport numbers', dataType: 'pii', pattern: /\b[A-Z]\d{8}\b/g, sensitivity: 'restricted', examples: ['G12345678'], enabled: true },
      { id: 'pat-iban', name: 'IBAN', description: 'International bank account numbers', dataType: 'pci', pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g, sensitivity: 'restricted', examples: ['GB82WEST12345698765432'], enabled: true },
      { id: 'pat-medical', name: 'Medical Record', description: 'Medical/health keywords', dataType: 'phi', pattern: /\b(diagnosis|prescription|symptom|patient_id|medical_record|disease)\b/gi, sensitivity: 'restricted', examples: ['diagnosis: diabetes'], enabled: true },
      { id: 'pat-jwt', name: 'JWT Token', description: 'JSON Web Tokens', dataType: 'credential', pattern: /\beyJ[A-Za-z0-9_=]+\.[A-Za-z0-9_=]+\.?[A-Za-z0-9_.+/=]*\b/g, sensitivity: 'restricted', examples: ['eyJ...'], enabled: true },
    ];
  }

  private emptyTypeMap(): Record<DataAssetType, number> {
    return { database: 0, table: 0, column: 0, file: 0, object_storage: 0, s3_bucket: 0, blob: 0, queue: 0, topic: 0, cache: 0, log: 0, data_lake: 0, bigquery: 0, snowflake: 0, elasticsearch_index: 0, unknown: 0 };
  }
  private emptyClassificationMap(): Record<DataClassification, number> {
    return { public: 0, internal: 0, confidential: 0, restricted: 0, top_secret: 0 };
  }
  private emptyEncryptionMap(): Record<EncryptionStatus, number> {
    return { unencrypted: 0, encrypted_at_rest: 0, encrypted_in_transit: 0, fully_encrypted: 0, unknown: 0 };
  }
  private emptyAccessMap(): Record<AccessControl, number> {
    return { public: 0, authenticated: 0, rbac: 0, abac: 0, no_access: 0, unknown: 0 };
  }

  private async loadAssets(): Promise<DataAsset[]> {
    return (await this.store.get<DataAsset[]>(STORE_KEYS.assets)) || [];
  }

  private generateId(prefix: string): string {
    return `${prefix}_${randomUUID()}`;
  }
}

const STORE_KEYS = {
  assets: 'dspm/data-assets.json',
};

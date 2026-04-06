/**
 * Assets Service
 * 资产管理业务逻辑层
 */

import { AssetsRepository } from './repository.js';
import type {
  SecurityAsset,
  AssetQueryParams,
  CreateAssetRequest,
  UpdateAssetRequest,
  AssetImportResult,
  AssetStats,
  AssetCriticality
} from './types.js';
import { randomUUID } from 'node:crypto';
import type { EventBus as EventBusType } from '../events/event-bus.js';
import { calculateAssetRiskScore } from './risk-score.js';

export class AssetsService {
  private eventBus: EventBusType | null = null;

  constructor(private repo: AssetsRepository) {}

  setEventBus(bus: EventBusType): void {
    this.eventBus = bus;
  }

  private async emitEvent(event: string, payload: unknown): Promise<void> {
    if (this.eventBus) {
      try {
        await this.eventBus.emit(event as any, payload);
      } catch (err) {
        console.error('[AssetsService] EventBus emit failed', err);
      }
    }
  }

  async list(params: AssetQueryParams = {}): Promise<Asset[]> {
    return this.repo.query(params);
  }

  async get(id: string): Promise<Asset | null> {
    return this.repo.getById(id);
  }

  async getStats() {
    return this.repo.getStats();
  }

  
  async create(asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<Asset> {
    const now = Date.now();
    const newAsset: Asset = {
      id: `asset_${randomUUID()}`,
      createdAt: now,
      updatedAt: now,
      vulnerabilities: asset.vulnerabilities ?? [],
      ...asset,
    } as Asset;
    const created = await this.repo.create(newAsset);
    await this.emitEvent('asset.created', {
      assetId: created.id,
      type: created.info?.type ?? created.type,
      criticality: created.info?.criticality ?? created.criticality,
      name: created.info?.name ?? created.name,
    });
    return created;
  }

  
  async update(id: string, updates: Partial<Asset>): Promise<Asset | null> {
    const updatedAt = Date.now();
    const updated = await this.repo.update(id, { ...updates, updatedAt });
    if (updated) {
      await this.emitEvent('asset.updated', {
        assetId: id,
        changes: Object.keys(updates),
      });
    }
    return updated;
  }

  
  async delete(id: string): Promise<boolean> {
    const asset = await this.repo.getById(id);
    const deleted = await this.repo.delete(id);
    if (deleted && asset) {
      await this.emitEvent('asset.deleted', {
        assetId: id,
        type: asset.info?.type ?? asset.type,
      });
    }
    return deleted;
  }

  
  async linkVulnerability(assetId: string, vulnId: string): Promise<Asset | null> {
    const asset = await this.repo.getById(assetId);
    if (!asset) return null;
    const vulnerabilities = new Set<string>(asset.vulnerabilities ?? []);
    vulnerabilities.add(vulnId);
    const updated = await this.repo.update(assetId, { vulnerabilities: Array.from(vulnerabilities), updatedAt: Date.now() });
    if (updated) {
      await this.emitEvent('asset.vulnerabilityLinked', { assetId, vulnId });
    }
    return updated;
  }

  
  async unlinkVulnerability(assetId: string, vulnId: string): Promise<Asset | null> {
    const asset = await this.repo.getById(assetId);
    if (!asset) return null;
    const vulnerabilities = (asset.vulnerabilities ?? []).filter(v => v !== vulnId);
    return this.repo.update(assetId, { vulnerabilities, updatedAt: Date.now() });
  }

  
  async batchImport(assets: Array<Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>>): Promise<{ imported: number; errors: number }> {
    let imported = 0;
    let errors = 0;
    for (const a of assets) {
      try {
        await this.create(a);
        imported++;
      } catch {
        errors++;
      }
    }
    return { imported, errors };
  }

  
  async getRiskProfile(assetId: string): Promise<{
    asset: Asset;
    vulnerabilityCount: number;
    riskScore: number;
    recommendations: string[];
  } | null> {
    const asset = await this.repo.getById(assetId);
    if (!asset) return null;
    const vulnerabilityCount = (asset.vulnerabilities ?? []).length;
  
    const scoreBase = { low: 20, medium: 40, high: 70, critical: 90 }[asset.criticality] ?? 0;
    const riskScore = Math.min(100, scoreBase + vulnerabilityCount * 6);
    const recommendations: string[] = [];
    if (riskScore >= 80) {
      recommendations.push('Mitigate vulnerabilities and strengthen controls for asset');
    } else if (riskScore >= 50) {
      recommendations.push('Review asset security controls and patch exposure');
    } else {
      recommendations.push('Maintain current security posture');
    }
    return { asset, vulnerabilityCount, riskScore, recommendations };
  }
}

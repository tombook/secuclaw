import 'reflect-metadata';
import { Service } from 'typedi';
import { AssetsRepository } from './repository.js';
import type {
  SecurityAsset,
  AssetQueryParams,
  CreateAssetRequest,
} from './types.js';
import { randomUUID } from 'node:crypto';
import type { EventBus as EventBusType } from '../events/event-bus.js';
import { calculateAssetRiskScore } from './risk-score.js';

@Service()
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

  async list(params: AssetQueryParams = {}): Promise<SecurityAsset[]> {
    return this.repo.query(params);
  }

  async get(id: string): Promise<SecurityAsset | null> {
    return this.repo.getById(id);
  }

  async getStats() {
    return this.repo.getStats();
  }

  
  async create(req: CreateAssetRequest): Promise<SecurityAsset> {
    const now = Date.now();
    const newAsset: SecurityAsset = {
      id: `asset_${randomUUID()}`,
      info: {
        name: req.name,
        description: req.description,
        type: req.type,
        criticality: req.criticality,
        environment: req.environment,
        status: req.status ?? 'unknown',
        owner: req.owner,
        department: req.department,
        businessLine: req.businessLine,
        tags: req.tags ?? [],
      },
      config: {
        ipAddresses: req.ipAddresses ?? [],
        macAddresses: req.macAddresses,
        hostnames: req.hostnames,
        ports: req.ports,
        os: req.os,
        osVersion: req.osVersion,
        software: req.software,
      },
      risk: {
        riskScore: 0,
        riskLevel: 'low',
        vulnerabilityCount: 0,
        criticalVulnerabilityCount: 0,
        highVulnerabilityCount: 0,
        mediumVulnerabilityCount: 0,
        lowVulnerabilityCount: 0,
        incidentCount: 0,
        threatCount: 0,
      },
      relations: {
        relatedAssets: [],
        relatedVulnerabilities: [],
        relatedIncidents: [],
        relatedThreats: [],
        relatedComplianceItems: [],
      },
      lifecycle: {
        discoveredAt: now,
        lastSeenAt: now,
      },
      createdAt: now,
      updatedAt: now,
    };
    const created = await this.repo.create(newAsset);
    await this.emitEvent('asset.created', {
      assetId: created.id,
      type: created.info.type,
      criticality: created.info.criticality,
      name: created.info.name,
    });
    return created;
  }

  
  async update(id: string, updates: Partial<SecurityAsset>): Promise<SecurityAsset | null> {
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
        type: asset.info.type,
      });
    }
    return deleted;
  }

  
  async linkVulnerability(assetId: string, vulnId: string): Promise<SecurityAsset | null> {
    const asset = await this.repo.getById(assetId);
    if (!asset) return null;
    const vulns = new Set<string>(asset.relations.relatedVulnerabilities ?? []);
    vulns.add(vulnId);
    const updated = await this.repo.update(assetId, {
      relations: { ...asset.relations, relatedVulnerabilities: Array.from(vulns) },
      updatedAt: Date.now(),
    });
    if (updated) {
      await this.emitEvent('asset.vulnerabilityLinked', { assetId, vulnId });
    }
    return updated;
  }

  
  async unlinkVulnerability(assetId: string, vulnId: string): Promise<SecurityAsset | null> {
    const asset = await this.repo.getById(assetId);
    if (!asset) return null;
    const vulns = asset.relations.relatedVulnerabilities.filter(v => v !== vulnId);
    return this.repo.update(assetId, {
      relations: { ...asset.relations, relatedVulnerabilities: vulns },
      updatedAt: Date.now(),
    });
  }

  
  async batchImport(reqs: CreateAssetRequest[]): Promise<{ imported: number; errors: number }> {
    let imported = 0;
    let errors = 0;
    for (const req of reqs) {
      try {
        await this.create(req);
        imported++;
      } catch {
        errors++;
      }
    }
    return { imported, errors };
  }

  
  async getRiskProfile(assetId: string): Promise<{
    asset: SecurityAsset;
    vulnerabilityCount: number;
    riskScore: number;
    recommendations: string[];
  } | null> {
    const asset = await this.repo.getById(assetId);
    if (!asset) return null;
    const vulnerabilityCount = asset.risk.vulnerabilityCount;
    const riskScore = calculateAssetRiskScore(asset);
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

/**
 * Assets Repository
 * 资产管理数据访问层
 */

import type { JsonStore } from '../storage/json-store.js';
import type { 
  SecurityAsset, 
  AssetQueryParams,
  AssetType,
  AssetCriticality,
  AssetEnvironment,
  AssetStatus,
  AssetRiskLevel
} from './types.js';

const FILE_NAME = 'assets.json';

export class AssetsRepository {
  constructor(private store: JsonStore) {}

  async getAll(): Promise<SecurityAsset[]> {
    const data = this.store.get<SecurityAsset[]>(FILE_NAME);
    return Array.isArray(data) ? data : [] as SecurityAsset[];
  }

  async getById(id: string): Promise<SecurityAsset | null> {
    const assets = await this.getAll();
    return assets.find(a => a.id === id) || null;
  }

  async findByIp(ipAddress: string): Promise<SecurityAsset[]> {
    const assets = await this.getAll();
    return assets.filter(a => a.config.ipAddresses.includes(ipAddress));
  }

  async findByTag(tag: string): Promise<SecurityAsset[]> {
    const assets = await this.getAll();
    return assets.filter(a => a.info.tags.includes(tag));
  }

  async query(params: AssetQueryParams): Promise<SecurityAsset[]> {
    let assets = await this.getAll();

    if (params.type) {
      assets = assets.filter(a => a.info.type === params.type);
    }
    if (params.criticality) {
      assets = assets.filter(a => a.info.criticality === params.criticality);
    }
    if (params.environment) {
      assets = assets.filter(a => a.info.environment === params.environment);
    }
    if (params.status) {
      assets = assets.filter(a => a.info.status === params.status);
    }
    if (params.riskLevel) {
      assets = assets.filter(a => a.risk.riskLevel === params.riskLevel);
    }
    if (params.owner) {
      assets = assets.filter(a => a.info.owner === params.owner);
    }
    if (params.department) {
      assets = assets.filter(a => a.info.department === params.department);
    }
    if (params.businessLine) {
      assets = assets.filter(a => a.info.businessLine === params.businessLine);
    }
    if (params.tag) {
      assets = assets.filter(a => a.info.tags.includes(params.tag!));
    }
    if (params.ip) {
      assets = assets.filter(a => a.config.ipAddresses.some(ip => ip.includes(params.ip!)));
    }
    if (params.fromDate) {
      assets = assets.filter(a => a.lifecycle.lastSeenAt >= params.fromDate!);
    }
    if (params.toDate) {
      assets = assets.filter(a => a.lifecycle.lastSeenAt <= params.toDate!);
    }

    assets.sort((a, b) => {
      if (b.risk.riskScore !== a.risk.riskScore) {
        return b.risk.riskScore - a.risk.riskScore;
      }
      return b.lifecycle.lastSeenAt - a.lifecycle.lastSeenAt;
    });

    if (params.page !== undefined && params.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      assets = assets.slice(start, start + params.pageSize);
    }

    return assets;
  }

  async create(asset: SecurityAsset): Promise<SecurityAsset> {
    const assets = await this.getAll();
    assets.push(asset);
    await this.store.set(FILE_NAME, assets);
    return asset;
  }

  async update(id: string, updates: Partial<SecurityAsset>): Promise<SecurityAsset | null> {
    const assets = await this.getAll();
    const index = assets.findIndex(a => a.id === id);
    if (index === -1) return null;

    assets[index] = { ...assets[index], ...updates, updatedAt: Date.now() };
    await this.store.set(FILE_NAME, assets);
    return assets[index];
  }

  async delete(id: string): Promise<boolean> {
    const assets = await this.getAll();
    const index = assets.findIndex(a => a.id === id);
    if (index === -1) return false;

    assets.splice(index, 1);
    await this.store.set(FILE_NAME, assets);
    return true;
  }

  async count(params: AssetQueryParams = {}): Promise<number> {
    const assets = await this.query({ ...params, page: undefined, pageSize: undefined });
    return assets.length;
  }

  async getStats(): Promise<{
    total: number;
    online: number;
    offline: number;
    byType: Record<AssetType, number>;
    byCriticality: Record<AssetCriticality, number>;
    byEnvironment: Record<AssetEnvironment, number>;
    byStatus: Record<AssetStatus, number>;
    byRiskLevel: Record<AssetRiskLevel, number>;
    totalVulnerabilities: number;
    totalCriticalVulnerabilities: number;
    averageRiskScore: number;
  }> {
    const assets = await this.getAll();
    
    const byType: Record<string, number> = {};
    const byCriticality: Record<string, number> = {};
    const byEnvironment: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byRiskLevel: Record<string, number> = {};
    
    let totalVulnerabilities = 0;
    let totalCriticalVulnerabilities = 0;
    let totalRiskScore = 0;

    for (const asset of assets) {
      const type = asset.info.type;
      const criticality = asset.info.criticality;
      const environment = asset.info.environment;
      const status = asset.info.status;
      const riskLevel = asset.risk.riskLevel;
      
      byType[type] = (byType[type] || 0) + 1;
      byCriticality[criticality] = (byCriticality[criticality] || 0) + 1;
      byEnvironment[environment] = (byEnvironment[environment] || 0) + 1;
      byStatus[status] = (byStatus[status] || 0) + 1;
      byRiskLevel[riskLevel] = (byRiskLevel[riskLevel] || 0) + 1;

      totalVulnerabilities += asset.risk.vulnerabilityCount;
      totalCriticalVulnerabilities += asset.risk.criticalVulnerabilityCount;
      totalRiskScore += asset.risk.riskScore;
    }

    return {
      total: assets.length,
      online: assets.filter(a => a.info.status === 'online').length,
      offline: assets.filter(a => a.info.status === 'offline').length,
      byType: byType as Record<AssetType, number>,
      byCriticality: byCriticality as Record<AssetCriticality, number>,
      byEnvironment: byEnvironment as Record<AssetEnvironment, number>,
      byStatus: byStatus as Record<AssetStatus, number>,
      byRiskLevel: byRiskLevel as Record<AssetRiskLevel, number>,
      totalVulnerabilities,
      totalCriticalVulnerabilities,
      averageRiskScore: assets.length > 0 ? Math.round(totalRiskScore / assets.length * 100) / 100 : 0,
    };
  }

  async batchCreate(assets: SecurityAsset[]): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
    const existingAssets = await this.getAll();
    const errors: string[] = [];
    const successAssets: SecurityAsset[] = [];

    for (const asset of assets) {
      try {
        const duplicate = existingAssets.some(a => 
          a.config.ipAddresses.some(ip => asset.config.ipAddresses.includes(ip))
        );
        if (duplicate) {
          errors.push(`Asset with IP ${asset.config.ipAddresses.join(',')} already exists`);
          continue;
        }
        successAssets.push(asset);
      } catch (e) {
        errors.push(`Failed to process asset ${asset.info.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    if (successAssets.length > 0) {
      await this.store.set(FILE_NAME, [...existingAssets, ...successAssets]);
    }

    return {
      successCount: successAssets.length,
      errorCount: errors.length,
      errors
    };
  }
}

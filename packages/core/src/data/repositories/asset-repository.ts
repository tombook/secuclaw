/**
 * Asset Repository
 * 
 * Manages IT/OT/Cloud assets
 */

import type { JsonStore } from '../../storage/json-store.js';
import type { Asset, AssetType, AssetCriticality } from '../types.js';

const FILE_NAME = 'assets.json';

export interface AssetQueryParams {
  type?: AssetType;
  category?: string;
  environment?: string;
  criticality?: AssetCriticality;
  status?: string;
  owner?: string;
  department?: string;
  ip?: string;
  hostname?: string;
  limit?: number;
  offset?: number;
}

export class AssetRepository extends BaseRepository<Asset> {
  constructor(store: JsonStore) {
    super();
    this.fileName = FILE_NAME;
  }
  
  /**
   * Get assets by query
   */
  async getByQuery(params: AssetQueryParams): Promise<Asset[]> {
    let assets = await this.list();
    
    if (params.type) {
      assets = assets.filter(a => a.type === params.type);
    }
    if (params.category) {
      assets = assets.filter(a => a.category === params.category);
    }
    if (params.environment) {
      assets = assets.filter(a => a.environment === params.environment);
    }
    if (params.criticality) {
      assets = assets.filter(a => a.business.criticality === params.criticality);
    }
    if (params.status) {
      assets = assets.filter(a => a.status === params.status);
    }
    if (params.owner) {
      assets = assets.filter(a => a.business.owner === params.owner);
    }
    if (params.department) {
      assets = assets.filter(a => a.business.department === params.department);
    }
    if (params.ip) {
      assets = assets.filter(a => 
        a.network.ip === params.ip || 
        a.network.ip.includes(params.ip)
      );
    }
    if (params.hostname) {
      assets = assets.filter(a => 
        a.network.hostname === params.hostname ||
        a.network.hostname.includes(params.hostname.toLowerCase())
      );
    }
    
    // Sort by criticality and business impact
    const criticalityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    assets.sort((a, b) => {
      const aCritical = criticalityOrder[a.business.criticality];
      const bCritical = criticalityOrder[b.business.criticality];
      return bCritical - aCritical;
    });
    
    if (params.offset !== undefined && params.limit !== undefined) {
      assets = assets.slice(params.offset, params.offset + params.limit);
    }
    
    return assets;
  }
  
  /**
   * Get assets by criticality
   */
  async getByCriticality(criticality: AssetCriticality): Promise<Asset[]> {
    return this.getByQuery({ criticality });
  }
  
  /**
   * Get assets by type
   */
  async getByType(type: AssetType): Promise<Asset[]> {
    return this.getByQuery({ type });
  }
  
  /**
   * Get assets by owner
   */
  async getByOwner(owner: string): Promise<Asset[]> {
    return this.getByQuery({ owner });
  }
  
  /**
   * Get critical assets count
   */
  async getCriticalAssetsCount(): Promise<number> {
    const assets = await this.getByCriticality('critical');
    return assets.length;
  }
  
  /**
   * Get assets summary
   */
  async getSummary(): Promise<{
    total: number;
    byType: Record<AssetType, number>;
    byCriticality: Record<AssetCriticality, number>;
    byEnvironment: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const assets = await this.list();
    
    const byType: Record<AssetType, number> = {};
    const byCriticality: Record<AssetCriticality, number> = {};
    const byEnvironment: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    
    for (const asset of assets) {
      byType[asset.type] = (byType[asset.type] || 0) + 1;
      byCriticality[asset.business.criticality] = (byCriticality[asset.business.criticality] || 0) + 1;
      byEnvironment[asset.environment] = (byEnvironment[asset.environment] || 0) + 1;
      byStatus[asset.status] = (byStatus[asset.status] || 0) + 1;
    }
    
    return {
      total: assets.length,
      byType,
      byCriticality,
      byEnvironment,
      byStatus,
    };
  }
}

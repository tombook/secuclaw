/**
 * Assets Repository
 * 资产管理数据访问层
 */

import type { JsonStore } from '../storage/json-store.js';

const FILE_NAME = 'assets.json';

export interface Asset {
  id: string;
  name: string;
  type: string;
  category: string;
  environment: string;
  criticality: string;
  status: string;
  owner?: string;
  department?: string;
  ip?: string;
  hostname?: string;
  vulnerabilities?: string[];
  lastScan?: number;
  createdAt: number;
  updatedAt: number;
}

export interface AssetQueryParams {
  type?: string;
  category?: string;
  environment?: string;
  criticality?: string;
  status?: string;
  owner?: string;
  department?: string;
  page?: number;
  pageSize?: number;
}

export class AssetsRepository {
  constructor(private store: JsonStore) {}

  async getAll(): Promise<Asset[]> {
    return this.store.get<Asset[]>(FILE_NAME) || [];
  }

  async getById(id: string): Promise<Asset | null> {
    const assets = await this.getAll();
    return assets.find(a => a.id === id) || null;
  }

  async query(params: AssetQueryParams): Promise<Asset[]> {
    let assets = await this.getAll();

    if (params.type) assets = assets.filter(a => a.type === params.type);
    if (params.category) assets = assets.filter(a => a.category === params.category);
    if (params.environment) assets = assets.filter(a => a.environment === params.environment);
    if (params.criticality) assets = assets.filter(a => a.criticality === params.criticality);
    if (params.status) assets = assets.filter(a => a.status === params.status);
    if (params.owner) assets = assets.filter(a => a.owner === params.owner);
    if (params.department) assets = assets.filter(a => a.department === params.department);

    if (params.page !== undefined && params.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      assets = assets.slice(start, start + params.pageSize);
    }

    return assets;
  }

  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byCriticality: Record<string, number>;
    byEnvironment: Record<string, number>;
  }> {
    const assets = await this.getAll();
    
    const byType: Record<string, number> = {};
    const byCriticality: Record<string, number> = {};
    const byEnvironment: Record<string, number> = {};

    for (const asset of assets) {
      byType[asset.type] = (byType[asset.type] || 0) + 1;
      byCriticality[asset.criticality] = (byCriticality[asset.criticality] || 0) + 1;
      byEnvironment[asset.environment] = (byEnvironment[asset.environment] || 0) + 1;
    }

    return { total: assets.length, byType, byCriticality, byEnvironment };
  }

  async create(asset: Asset): Promise<Asset> {
    const assets = await this.getAll();
    assets.push(asset);
    await this.store.set(FILE_NAME, assets);
    return asset;
  }

  async update(id: string, updates: Partial<Asset>): Promise<Asset | null> {
    const assets = await this.getAll();
    const index = assets.findIndex(a => a.id === id);
    
    if (index === -1) {
      return null;
    }

    assets[index] = { ...assets[index], ...updates };
    await this.store.set(FILE_NAME, assets);
    return assets[index];
  }

  async delete(id: string): Promise<boolean> {
    const assets = await this.getAll();
    const filtered = assets.filter(a => a.id !== id);
    
    if (filtered.length === assets.length) {
      return false;
    }

    await this.store.set(FILE_NAME, filtered);
    return true;
  }
}

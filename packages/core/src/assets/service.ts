/**
 * Assets Service
 * 资产管理业务逻辑层
 */

import { AssetsRepository, type Asset, type AssetQueryParams } from './repository.js';

export class AssetsService {
  constructor(private repo: AssetsRepository) {}

  async list(params: AssetQueryParams = {}): Promise<Asset[]> {
    return this.repo.query(params);
  }

  async get(id: string): Promise<Asset | null> {
    return this.repo.getById(id);
  }

  async getStats() {
    return this.repo.getStats();
  }
}

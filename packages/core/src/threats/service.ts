/**
 * Threats Service
 * 威胁情报业务逻辑层
 */

import { ThreatsRepository, type ThreatActor, type ThreatQueryParams } from './repository.js';

const logger = {
  info: (...args: any[]) => console.log('[ThreatsService]', ...args),
  error: (...args: any[]) => console.error('[ThreatsService]', ...args),
};

export class ThreatsService {
  constructor(private repo: ThreatsRepository) {}

  async list(params: ThreatQueryParams = {}): Promise<ThreatActor[]> {
    return this.repo.query(params);
  }

  async get(id: string): Promise<ThreatActor | null> {
    return this.repo.getById(id);
  }

  async getByName(name: string): Promise<ThreatActor | null> {
    return this.repo.getByName(name);
  }

  async getStats() {
    return this.repo.getStats();
  }

  async searchByTechnique(techniqueId: string): Promise<ThreatActor[]> {
    return this.repo.searchByTechnique(techniqueId);
  }

  async search(keyword: string): Promise<ThreatActor[]> {
    return this.repo.getByName(keyword);
  }
}

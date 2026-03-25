/**
 * Compliance Service
 * 合规审计业务逻辑层
 */

import { ComplianceRepository, type Regulation, type ComplianceQueryParams } from './repository.js';

export class ComplianceService {
  constructor(private repo: ComplianceRepository) {}

  async list(params: ComplianceQueryParams = {}): Promise<Regulation[]> {
    return this.repo.query(params);
  }

  async get(id: string): Promise<Regulation | null> {
    return this.repo.getById(id);
  }

  async getStats() {
    return this.repo.getStats();
  }
}

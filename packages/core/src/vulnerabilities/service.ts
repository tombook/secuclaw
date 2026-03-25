/**
 * Vulnerabilities Service
 * 漏洞管理业务逻辑层
 */

import { VulnerabilitiesRepository, type Vulnerability, type VulnerabilityQueryParams } from './repository.js';

const logger = {
  info: (...args: any[]) => console.log('[VulnerabilitiesService]', ...args),
  error: (...args: any[]) => console.error('[VulnerabilitiesService]', ...args),
};

export class VulnerabilitiesService {
  constructor(private repo: VulnerabilitiesRepository) {}

  async list(params: VulnerabilityQueryParams = {}): Promise<Vulnerability[]> {
    return this.repo.query(params);
  }

  async get(id: string): Promise<Vulnerability | null> {
    return this.repo.getById(id);
  }

  async getByCVE(cveId: string): Promise<Vulnerability | null> {
    return this.repo.getByCVE(cveId);
  }

  async updateRemediation(
    id: string, 
    status: Vulnerability['remediation']['status'],
    assignedTo?: string,
    user?: string
  ): Promise<Vulnerability> {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new Error(`Vulnerability not found: ${id}`);
    }

    const updates: Partial<Vulnerability> = {
      remediation: {
        ...existing.remediation,
        status,
        ...(assignedTo && { assignedTo }),
      },
    };

    const updated = await this.repo.update(id, updates);
    
    // Add history
    await this.repo.addHistory(id, `Status changed to ${status}`, user || 'system');
    
    logger.info(`Vulnerability ${existing.info.cveId} status: ${status}`);
    return updated!;
  }

  async assign(id: string, assignedTo: string, user?: string): Promise<Vulnerability> {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new Error(`Vulnerability not found: ${id}`);
    }

    const updated = await this.repo.update(id, {
      remediation: {
        ...existing.remediation,
        assignedTo,
      },
    });

    await this.repo.addHistory(id, `Assigned to ${assignedTo}`, user || 'system');
    logger.info(`Vulnerability ${existing.info.cveId} assigned to ${assignedTo}`);
    
    return updated!;
  }

  async updateDueDate(id: string, dueDate: number, user?: string): Promise<Vulnerability> {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new Error(`Vulnerability not found: ${id}`);
    }

    const updated = await this.repo.update(id, {
      remediation: {
        ...existing.remediation,
        dueDate,
      },
    });

    await this.repo.addHistory(id, `Due date updated to ${new Date(dueDate).toISOString()}`, user || 'system');
    return updated!;
  }

  async getStats() {
    return this.repo.getStats();
  }

  async getByAsset(assetId: string): Promise<Vulnerability[]> {
    return this.repo.query({ assetId });
  }
}

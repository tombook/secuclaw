import 'reflect-metadata';
import { Service } from 'typedi';
import { VulnerabilitiesRepository, type Vulnerability, type VulnerabilityQueryParams } from './repository.js';
import { VulnStateMachine } from './state-machine.js';
import { hasPermissionWithInheritance, PERMISSIONS } from '../roles/permissions.js';

interface EventBus {
  emit(event: string, payload: unknown): Promise<void>;
}

const logger = {
  info: (...args: any[]) => console.log('[VulnerabilitiesService]', ...args),
  error: (...args: any[]) => console.error('[VulnerabilitiesService]', ...args),
};

@Service()
export class VulnerabilitiesService {
  private eventBus: EventBus | null = null;

  constructor(private repo: VulnerabilitiesRepository) {}

  setEventBus(bus: EventBus): void {
    this.eventBus = bus;
  }

  private async emitEvent(event: string, payload: unknown): Promise<void> {
    if (this.eventBus) {
      try {
        await this.eventBus.emit(event, payload);
      } catch (err) {
        logger.error('EventBus emit failed', err);
      }
    }
  }

  async list(params: VulnerabilityQueryParams = {}, roleId?: string): Promise<Vulnerability[]> {
    const vulnerabilities = await this.repo.query(params);

    if (!roleId || hasPermissionWithInheritance(roleId, PERMISSIONS.VULNS_READ)) {
      return vulnerabilities;
    }

    return [];
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

    // Validate status transition using the state machine
    VulnStateMachine.validateTransition(existing.remediation.status, status);

    const updates: Partial<Vulnerability> = {
      remediation: {
        ...existing.remediation,
        status,
        ...(assignedTo && { assignedTo }),
      },
    };

    const updated = await this.repo.update(id, updates);
    
    await this.emitEvent('vulnerability.statusChanged', {
      vulnId: id,
      fromStatus: existing.remediation.status,
      toStatus: status,
    });
    
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

  /**
   * Get valid next statuses for a vulnerability by id based on the state machine
   */
  async getValidNextStatuses(id: string): Promise<string[]> {
    const vuln = await this.repo.getById(id);
    if (!vuln) {
      throw new Error(`Vulnerability not found: ${id}`);
    }
    return VulnStateMachine.getNextStatuses(vuln.remediation.status).map(s => s as string);
  }

  async batchUpdateStatus(
    ids: string[],
    status: Vulnerability['remediation']['status'],
    _user?: string,
  ): Promise<{ updated: number; errors: string[] }> {
    let updated = 0;
    const errors: string[] = [];

    for (const id of ids) {
      try {
        const existing = await this.repo.getById(id);
        if (!existing) {
          errors.push(`${id}: not found`);
          continue;
        }
        VulnStateMachine.validateTransition(existing.remediation.status, status);
        await this.repo.update(id, {
          remediation: { ...existing.remediation, status },
        });
        await this.emitEvent('vulnerability.statusChanged', {
          vulnId: id,
          fromStatus: existing.remediation.status,
          toStatus: status,
        });
        updated++;
      } catch (err) {
        errors.push(`${id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    logger.info(`Batch update: ${updated}/${ids.length} updated to ${status}`);
    return { updated, errors };
  }
}

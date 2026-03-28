import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VulnerabilitiesService } from '../../src/vulnerabilities/service.js';
import { VulnerabilitiesRepository } from '../../src/vulnerabilities/repository.js';

describe('VulnerabilitiesService', () => {
  let service: VulnerabilitiesService;
  let mockRepo: any;

  const mockVuln = {
    id: 'vuln_test_1',
    info: {
      cveId: 'CVE-2024-0001',
      severity: 'high',
      cvss: 7.5,
      title: 'Test Vulnerability',
      description: 'Test',
    },
    remediation: { status: 'open', assignedTo: undefined },
    affectedAssets: ['asset_1'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    mockRepo = {
      query: vi.fn().mockResolvedValue([]),
      getById: vi.fn(),
      getByCVE: vi.fn(),
      update: vi.fn(),
      addHistory: vi.fn().mockResolvedValue(undefined),
      getStats: vi.fn().mockResolvedValue({ total: 0 }),
    };
    service = new VulnerabilitiesService(mockRepo);
  });

  describe('get', () => {
    it('should return vulnerability by ID', async () => {
      mockRepo.getById.mockResolvedValue(mockVuln);
      const result = await service.get('vuln_test_1');
      expect(result).toEqual(mockVuln);
    });

    it('should return null for missing ID', async () => {
      mockRepo.getById.mockResolvedValue(null);
      const result = await service.get('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getByCVE', () => {
    it('should return vulnerability by CVE ID', async () => {
      mockRepo.getByCVE.mockResolvedValue(mockVuln);
      const result = await service.getByCVE('CVE-2024-0001');
      expect(result).toEqual(mockVuln);
    });
  });

  describe('list', () => {
    it('should query vulnerabilities', async () => {
      mockRepo.query.mockResolvedValue([mockVuln]);
      const results = await service.list({ severity: 'high' });
      expect(results).toHaveLength(1);
    });
  });

  describe('updateRemediation', () => {
    it('should update status from open to in_progress', async () => {
      mockRepo.getById.mockResolvedValue(mockVuln);
      mockRepo.update.mockImplementation(async (_id: string, data: any) => ({ ...mockVuln, ...data }));
      const result = await service.updateRemediation('vuln_test_1', 'in_progress', 'analyst1');
      expect(mockRepo.update).toHaveBeenCalledOnce();
    });

    it('should throw for missing vulnerability', async () => {
      mockRepo.getById.mockResolvedValue(null);
      await expect(service.updateRemediation('missing', 'in_progress')).rejects.toThrow('Vulnerability not found');
    });
  });

  describe('batchUpdateStatus', () => {
    it('should batch update multiple vulnerabilities', async () => {
      mockRepo.getById.mockResolvedValue(mockVuln);
      mockRepo.update.mockImplementation(async (id: string, _data: any) => ({ ...mockVuln, id }));
      const result = await service.batchUpdateStatus(['vuln_1', 'vuln_2'], 'in_progress');
      expect(result.updated).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should report errors for missing vulns', async () => {
      mockRepo.getById.mockResolvedValue(null);
      const result = await service.batchUpdateStatus(['missing_1'], 'in_progress');
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('getValidNextStatuses', () => {
    it('should return valid next statuses', async () => {
      mockRepo.getById.mockResolvedValue(mockVuln);
      const statuses = await service.getValidNextStatuses('vuln_test_1');
      expect(Array.isArray(statuses)).toBe(true);
    });

    it('should throw for missing vulnerability', async () => {
      mockRepo.getById.mockResolvedValue(null);
      await expect(service.getValidNextStatuses('missing')).rejects.toThrow('Vulnerability not found');
    });
  });
});

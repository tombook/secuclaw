import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssetsService } from '../../src/assets/service.js';

describe('AssetsService', () => {
  let service: any;
  let mockRepo: any;
  let mockBus: any;
  const mockAsset = {
    id: 'asset_1',
    domainId: 'domain_1',
    info: {
      name: 'Asset One',
      type: 'server',
      criticality: 'high',
      environment: 'production',
      status: 'online',
      owner: 'owner1',
      department: 'IT',
      businessLine: 'Core',
      tags: ['tag1'],
    },
    config: { ipAddresses: ['10.0.0.1'], macAddresses: [], hostnames: [], ports: [] },
    risk: {
      riskScore: 50,
      riskLevel: 'medium',
      vulnerabilityCount: 0,
      criticalVulnerabilityCount: 0,
      highVulnerabilityCount: 0,
      mediumVulnerabilityCount: 0,
      lowVulnerabilityCount: 0,
      incidentCount: 0,
      threatCount: 0,
    },
    relations: {
      relatedAssets: [], relatedVulnerabilities: [], relatedIncidents: [], relatedThreats: [], relatedComplianceItems: []
    },
    lifecycle: { discoveredAt: Date.now(), lastSeenAt: Date.now() },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    mockBus = {
      emit: vi.fn(),
    };
    mockRepo = {
      query: vi.fn().mockResolvedValue([mockAsset]),
      getById: vi.fn(),
      getAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getStats: vi.fn().mockResolvedValue({ total: 1 }),
    };
    service = new AssetsService(mockRepo);
    service.setEventBus(mockBus);
  });

  describe('list', () => {
    it('should return assets from repo', async () => {
      mockRepo.query.mockResolvedValue([mockAsset]);
      const results = await service.list({});
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(mockAsset);
    });
  });

  describe('get', () => {
    it('should return asset by id', async () => {
      mockRepo.getById.mockResolvedValue(mockAsset);
      const result = await service.get('asset_1');
      expect(result).toEqual(mockAsset);
    });
  });

  describe('create', () => {
    it('should create a new asset and emit event', async () => {
      const input = {
        domainId: 'domain_1',
        name: 'New Asset',
        type: 'server',
        criticality: 'high',
        environment: 'production',
        ipAddresses: ['10.0.0.2'],
        vulnerabilities: [],
      };
      const created = { ...mockAsset, id: 'asset_new', name: 'New Asset', createdAt: Date.now(), updatedAt: Date.now(), config: { ipAddresses: ['10.0.0.2'], macAddresses: [], hostnames: [], ports: [] } };
      mockRepo.create.mockResolvedValue(created);
      // @ts-ignore
      const result = await service.create(input);
      expect(mockRepo.create).toHaveBeenCalled();
      expect(result).toEqual(created);
      expect(mockBus.emit).toHaveBeenCalledWith('asset.created', {
        assetId: created.id,
        type: created.info.type,
        criticality: created.info.criticality,
        name: created.info.name || created.name,
      });
    });
  });

  describe('update', () => {
    it('should update asset and emit event', async () => {
      const updates = { name: 'Updated Asset' };
      const updated = { ...mockAsset, ...updates };
      mockRepo.update.mockResolvedValue(updated);
      const result = await service.update('asset_1', updates);
      expect(mockRepo.update).toHaveBeenCalled();
      expect(result).toEqual(updated);
      expect(mockBus.emit).toHaveBeenCalledWith('asset.updated', {
        assetId: 'asset_1',
        changes: Object.keys(updates),
      });
    });
  });

  describe('delete', () => {
    it('should delete asset and emit event', async () => {
      mockRepo.getById.mockResolvedValue(mockAsset);
      mockRepo.delete.mockResolvedValue(true);
      const result = await service.delete('asset_1');
      expect(mockRepo.delete).toHaveBeenCalled();
      expect(result).toBe(true);
      expect(mockBus.emit).toHaveBeenCalledWith('asset.deleted', {
        assetId: 'asset_1',
        type: mockAsset.info.type,
      });
    });
  });
});

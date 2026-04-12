import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IncidentsService } from '../../src/incidents/service.js';
import { IncidentsRepository } from '../../src/incidents/repository.js';

describe('IncidentsService', () => {
  let service: IncidentsService;
  let mockRepo: any;

  const mockIncident = {
    id: 'incident_test_1',
    ticketId: 'INC-001',
    domainId: 'security',
    info: {
      title: 'Test Incident',
      description: 'Test description',
      category: 'intrusion',
      severity: 'P1',
      priority: 2,
      source: 'manual',
    },
    timeline: { detectedAt: Date.now(), reportedAt: Date.now() },
    sla: { responseDeadline: Date.now() + 3600000, resolutionDeadline: Date.now() + 86400000 },
    workflow: { status: 'detected' },
    impact: { affectedAssets: [], affectedUsers: 0, dataTypes: [], businessImpact: '' },
    handlers: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    mockRepo = {
      query: vi.fn().mockResolvedValue([]),
      getById: vi.fn(),
      getByTicketId: vi.fn(),
      getNextTicketId: vi.fn().mockResolvedValue('INC-002'),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getStats: vi.fn().mockResolvedValue({ total: 0 }),
    };
    service = new IncidentsService(mockRepo);
  });

  describe('create', () => {
    it('should create incident with auto-generated ID', async () => {
      mockRepo.create.mockImplementation(async (data: any) => data);
      const result = await service.create({
        title: 'New Incident',
        description: 'Test',
        category: 'intrusion',
        severity: 'P1',
      }, 'user1');
      expect(result).toBeDefined();
      expect(result.id).toMatch(/^incident_\d+_/);
      expect(mockRepo.create).toHaveBeenCalledOnce();
    });

    it('should create incident with handler when createdBy provided', async () => {
      mockRepo.create.mockImplementation(async (data: any) => data);
      const result = await service.create({
        title: 'With Handler',
        description: 'Test',
        category: 'malware',
        severity: 'P0',
      }, 'analyst1');
      expect(result.handlers.length).toBe(1);
      expect(result.handlers[0].user).toBe('analyst1');
    });
  });

  describe('list', () => {
    it('should return queried incidents', async () => {
      mockRepo.query.mockResolvedValue([mockIncident]);
      const results = await service.list({ status: 'detected' });
      expect(results).toHaveLength(1);
    });
  });

  describe('get', () => {
    it('should return incident by ID', async () => {
      mockRepo.getById.mockResolvedValue(mockIncident);
      const result = await service.get('incident_test_1');
      expect(result).toEqual(mockIncident);
    });

    it('should return null for missing ID', async () => {
      mockRepo.getById.mockResolvedValue(null);
      const result = await service.get('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should transition status from detected to reported', async () => {
      mockRepo.getById.mockResolvedValue(mockIncident);
      mockRepo.update.mockImplementation(async (_id: string, data: any) => data);
      const result = await service.updateStatus('incident_test_1', 'reported');
      expect(mockRepo.update).toHaveBeenCalledOnce();
    });

    it('should reject invalid transition', async () => {
      mockRepo.getById.mockResolvedValue(mockIncident);
      // detected -> investigating is invalid (must go through reported/acknowledged first)
      await expect(service.updateStatus('incident_test_1', 'investigating')).rejects.toThrow('Invalid status transition');
    });

    it('should throw for missing incident', async () => {
      mockRepo.getById.mockResolvedValue(null);
      await expect(service.updateStatus('missing', 'reported')).rejects.toThrow('Incident not found');
    });
  });

  describe('delete', () => {
    it('should delegate to repository', async () => {
      mockRepo.delete.mockResolvedValue(true);
      const result = await service.delete('incident_test_1');
      expect(result).toBe(true);
    });
  });
});

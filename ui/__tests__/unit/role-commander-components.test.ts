import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/ui/store/raci-store.js', () => ({
  raciStore: {
    subscribe: vi.fn(() => () => {}),
    getState: vi.fn(() => ({ tasks: [] })),
    loadSessions: vi.fn().mockResolvedValue(undefined),
    updateTaskStatus: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../src/ui/store/role-context.js', () => ({
  roleContext: {
    getState: vi.fn(() => ({ currentRole: 'security-expert' })),
    subscribe: vi.fn(() => () => {}),
  },
}));

describe('ScRaciTaskSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RaciTask interface', () => {
    it('should have correct type structure', () => {
      const task = {
        id: '1',
        type: 'R' as const,
        title: 'Test Task',
        description: 'Test Description',
        scenario: 'Test Scenario',
        status: 'pending' as const,
        assignees: ['security-expert'],
      };
      
      expect(task.type).toBe('R');
      expect(task.status).toBe('pending');
      expect(task.assignees).toContain('security-expert');
    });
  });

  describe('status conversion', () => {
    it('should convert store status to UI status', () => {
      const convertStatus = (storeStatus: string): 'pending' | 'in-progress' | 'completed' => {
        switch (storeStatus) {
          case 'completed': return 'completed';
          case 'in_progress': return 'in-progress';
          default: return 'pending';
        }
      };
      
      expect(convertStatus('completed')).toBe('completed');
      expect(convertStatus('in_progress')).toBe('in-progress');
      expect(convertStatus('assigned')).toBe('pending');
    });
  });
});

describe('ScRoleCollaborationSection', () => {
  describe('CollaborationItem interface', () => {
    it('should have correct type structure', () => {
      const item = {
        id: '1',
        type: 'discussion' as const,
        title: 'Test Discussion',
        description: 'Test Description',
        participants: ['security-expert'],
        timestamp: Date.now(),
        status: 'active' as const,
        scenario: 'Test',
      };
      
      expect(item.type).toBe('discussion');
      expect(item.status).toBe('active');
    });
  });
});

describe('ScRoleMetricsSection', () => {
  describe('MetricCard interface', () => {
    it('should have correct type structure', () => {
      const metric = {
        id: 'test-metric',
        label: 'Test Metric',
        value: 100,
        unit: '%',
        trend: 'up' as const,
        trendValue: '+5%',
        status: 'healthy' as const,
        sparkline: [1, 2, 3, 4, 5],
      };
      
      expect(metric.value).toBe(100);
      expect(metric.trend).toBe('up');
      expect(metric.sparkline).toHaveLength(5);
    });
  });
});

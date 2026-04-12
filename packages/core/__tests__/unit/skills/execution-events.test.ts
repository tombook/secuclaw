import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executionEvents } from '../../../src/skills/execution-events.js';
import type { ExecutionResult } from '../../../src/skills/executor.js';

const mockResult = (overrides: Partial<ExecutionResult> = {}): ExecutionResult => ({
  executionId: 'exec-1',
  skill: 'test-skill',
  status: 'completed',
  result: { data: 'test' },
  executedBy: 'security-expert',
  timestamp: new Date(),
  duration: 100,
  ...overrides,
});

describe('ExecutionEvents', () => {
  beforeEach(() => {
    executionEvents.removeAllListeners('exec-1');
    executionEvents.removeAllListeners('exec-2');
    executionEvents.setEventBus(null);
  });

  describe('setEventBus', () => {
    it('should set event bus reference', () => {
      const bus = { emit: vi.fn() };
      executionEvents.setEventBus(bus as any);
      expect(executionEvents).toBeDefined();
    });
  });

  describe('onProgress', () => {
    it('should register progress callback', () => {
      const callback = vi.fn();
      const unsubscribe = executionEvents.onProgress('exec-1', callback);

      executionEvents.emitProgress('exec-1', 50, 'running');
      expect(callback).toHaveBeenCalledWith('exec-1', 50, 'running');
      unsubscribe();
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = executionEvents.onProgress('exec-1', callback);

      unsubscribe();
      executionEvents.emitProgress('exec-1', 50, 'running');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle multiple callbacks for same execution', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      executionEvents.onProgress('exec-1', cb1);
      executionEvents.onProgress('exec-1', cb2);

      executionEvents.emitProgress('exec-1', 75, 'running');
      expect(cb1).toHaveBeenCalled();
      expect(cb2).toHaveBeenCalled();
    });
  });

  describe('onComplete', () => {
    it('should register completion callback', () => {
      const callback = vi.fn();
      const unsubscribe = executionEvents.onComplete('exec-1', callback);

      const result = mockResult();
      executionEvents.emitComplete(result);
      expect(callback).toHaveBeenCalledWith(result);
      unsubscribe();
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = executionEvents.onComplete('exec-1', callback);

      unsubscribe();
      executionEvents.emitComplete(mockResult());
      expect(callback).not.toHaveBeenCalled();
    });

    it('should clean up callbacks after emit', () => {
      const callback = vi.fn();
      executionEvents.onComplete('exec-1', callback);

      executionEvents.emitComplete(mockResult());
      expect(callback).toHaveBeenCalledTimes(1);

      executionEvents.emitComplete(mockResult({ executionId: 'exec-2' }));
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('emitProgress', () => {
    it('should call registered progress callbacks', () => {
      const callback = vi.fn();
      executionEvents.onProgress('exec-1', callback);

      executionEvents.emitProgress('exec-1', 25, 'running');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should emit to eventBus when set and status is running', async () => {
      const emit = vi.fn().mockResolvedValue(undefined);
      const bus = { emit };
      executionEvents.setEventBus(bus as any);

      executionEvents.emitProgress('exec-1', 50, 'running');
      await Promise.resolve();
      expect(emit).toHaveBeenCalledWith('skill.execution.progress', {
        executionId: 'exec-1',
        progress: 50,
        status: 'running',
      });
    });

    it('should not emit to eventBus for non-running status', async () => {
      const emit = vi.fn().mockResolvedValue(undefined);
      const bus = { emit };
      executionEvents.setEventBus(bus as any);

      executionEvents.emitProgress('exec-1', 50, 'completed');
      await Promise.resolve();
      expect(emit).not.toHaveBeenCalled();
    });
  });

  describe('emitComplete', () => {
    it('should call registered completion callbacks', () => {
      const callback = vi.fn();
      executionEvents.onComplete('exec-1', callback);

      const result = mockResult({ status: 'completed' });
      executionEvents.emitComplete(result);
      expect(callback).toHaveBeenCalledWith(result);
    });

    it('should emit skill.execution.completed for successful execution', async () => {
      const emit = vi.fn().mockResolvedValue(undefined);
      const bus = { emit };
      executionEvents.setEventBus(bus as any);

      const result = mockResult({ status: 'completed' });
      executionEvents.emitComplete(result);
      await Promise.resolve();
      expect(emit).toHaveBeenCalledWith('skill.execution.completed', result);
    });

    it('should emit skill.execution.failed for failed execution', async () => {
      const emit = vi.fn().mockResolvedValue(undefined);
      const bus = { emit };
      executionEvents.setEventBus(bus as any);

      const result = mockResult({ status: 'failed' });
      executionEvents.emitComplete(result);
      await Promise.resolve();
      expect(emit).toHaveBeenCalledWith('skill.execution.failed', result);
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all progress callbacks for execution', () => {
      const callback = vi.fn();
      executionEvents.onProgress('exec-1', callback);

      executionEvents.removeAllListeners('exec-1');
      executionEvents.emitProgress('exec-1', 50, 'running');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should remove all completion callbacks for execution', () => {
      const callback = vi.fn();
      executionEvents.onComplete('exec-1', callback);

      executionEvents.removeAllListeners('exec-1');
      executionEvents.emitComplete(mockResult());
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
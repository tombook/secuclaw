import { describe, it, expect, vi, beforeEach } from 'vitest';
import { historyStore } from '../../../src/skills/history-store.js';
import type { ExecutionResult } from '../../../src/skills/executor.js';

const mockExecution = (overrides: Partial<ExecutionResult> = {}): ExecutionResult => ({
  executionId: 'exec-1',
  skill: 'test-skill',
  status: 'completed',
  result: { data: 'test' },
  executedBy: 'security-expert',
  timestamp: new Date(),
  duration: 100,
  ...overrides,
});

describe('HistoryStore', () => {
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    mockLocalStorage = {};
    const originalLocalStorage = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (key: string) => mockLocalStorage[key] ?? null,
        setItem: (key: string, value: string) => { mockLocalStorage[key] = value; },
        removeItem: (key: string) => { delete mockLocalStorage[key]; },
      },
      writable: true,
    });
    historyStore.clear();
    return () => {
      Object.defineProperty(globalThis, 'localStorage', { value: originalLocalStorage, writable: true });
    };
  });

  describe('add', () => {
    it('should add execution to history', () => {
      historyStore.add(mockExecution());
      expect(historyStore.getAll()).toHaveLength(1);
    });

    it('should add newest first', () => {
      historyStore.add(mockExecution({ executionId: 'exec-1', timestamp: new Date('2024-01-01') }));
      historyStore.add(mockExecution({ executionId: 'exec-2', timestamp: new Date('2024-01-02') }));
      expect(historyStore.getAll()[0].executionId).toBe('exec-2');
    });

    it('should enforce MAX_HISTORY limit of 100', () => {
      for (let i = 0; i < 150; i++) {
        historyStore.add(mockExecution({ executionId: `exec-${i}` }));
      }
      expect(historyStore.getAll()).toHaveLength(100);
      expect(historyStore.getAll()[0].executionId).toBe('exec-149');
    });

    it('should persist to localStorage', () => {
      historyStore.add(mockExecution());
      expect(mockLocalStorage['secuclaw-skill-execution-history']).toBeDefined();
    });
  });

  describe('getAll', () => {
    it('should return copy of history', () => {
      historyStore.add(mockExecution());
      const history = historyStore.getAll();
      history.push(mockExecution({ executionId: 'modified' }));
      expect(historyStore.getAll()).toHaveLength(1);
    });
  });

  describe('getBySkill', () => {
    it('should filter by skill ID', () => {
      historyStore.add(mockExecution({ skill: 'skill-a' }));
      historyStore.add(mockExecution({ skill: 'skill-b' }));
      historyStore.add(mockExecution({ skill: 'skill-a' }));

      const results = historyStore.getBySkill('skill-a');
      expect(results).toHaveLength(2);
      expect(results.every(e => e.skill === 'skill-a')).toBe(true);
    });

    it('should return empty array for unknown skill', () => {
      historyStore.add(mockExecution({ skill: 'skill-a' }));
      const results = historyStore.getBySkill('unknown');
      expect(results).toEqual([]);
    });
  });

  describe('getByRole', () => {
    it('should filter by role', () => {
      historyStore.add(mockExecution({ executedBy: 'security-expert' }));
      historyStore.add(mockExecution({ executedBy: 'ciso' }));
      historyStore.add(mockExecution({ executedBy: 'security-expert' }));

      const results = historyStore.getByRole('security-expert');
      expect(results).toHaveLength(2);
      expect(results.every(e => e.executedBy === 'security-expert')).toBe(true);
    });

    it('should return empty array for unknown role', () => {
      historyStore.add(mockExecution({ executedBy: 'security-expert' }));
      const results = historyStore.getByRole('unknown-role');
      expect(results).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should remove all history', () => {
      historyStore.add(mockExecution());
      historyStore.add(mockExecution({ executionId: 'exec-2' }));
      historyStore.clear();
      expect(historyStore.getAll()).toEqual([]);
    });

    it('should clear localStorage', () => {
      historyStore.add(mockExecution());
      historyStore.clear();
      expect(mockLocalStorage['secuclaw-skill-execution-history']).toBe('[]');
    });
  });

  describe('cleanupOlderThan', () => {
    it('should remove entries older than specified days', () => {
      const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      historyStore.add(mockExecution({ executionId: 'old', timestamp: oldDate }));
      historyStore.add(mockExecution({ executionId: 'recent', timestamp: new Date() }));

      historyStore.cleanupOlderThan(5);
      expect(historyStore.getAll()).toHaveLength(1);
      expect(historyStore.getAll()[0].executionId).toBe('recent');
    });

    it('should handle no matching entries', () => {
      historyStore.add(mockExecution({ timestamp: new Date() }));
      historyStore.cleanupOlderThan(5);
      expect(historyStore.getAll()).toHaveLength(1);
    });
  });
});
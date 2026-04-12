import { describe, it, expect, vi, beforeEach } from 'vitest';
import { skillExecutor } from '../../../src/skills/executor.js';
import { skillRegistry } from '../../../src/skills/registry.js';
import type { SkillDefinition, RoleId } from '../../../src/skills/registry.js';

describe('SkillExecutor', () => {
  const mockSkill: SkillDefinition = {
    id: 'test-skill',
    name: 'Test Skill',
    description: 'A test skill',
    executor: 'mock-runner',
    params: [
      { name: 'target', type: 'string', required: true, description: 'Target' },
    ],
    resultType: 'json',
    requiredRoles: ['security-expert' as RoleId],
  };

  beforeEach(() => {
    skillRegistry.clear();
    skillRegistry.register(mockSkill);
    skillExecutor.registerExecutor('mock-runner', async (params) => {
      if (params.throwError) throw new Error('Runner error');
      return { success: true, target: params.target };
    });
    skillExecutor.registerExecutor('slow-runner', async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return { done: true };
    });
    skillExecutor.setDefaultTimeout(300000);
  });

  describe('registerExecutor', () => {
    it('should register a runner', async () => {
      const result = await skillExecutor.execute({
        skillId: 'test-skill',
        roleId: 'security-expert',
        params: { target: 'http://example.com' },
      });
      expect(result.status).toMatch(/pending|running|completed/);
    });
  });

  describe('execute', () => {
    it('should return failed result for unknown skill', async () => {
      const result = await skillExecutor.execute({
        skillId: 'nonexistent',
        roleId: 'security-expert',
        params: {},
      });
      expect(result.status).toBe('failed');
      expect(result.error?.message).toContain('Skill not found');
    });

    it('should return failed result when role cannot execute', async () => {
      const result = await skillExecutor.execute({
        skillId: 'test-skill',
        roleId: 'supply-chain-security',
        params: { target: 'test' },
      });
      expect(result.status).toBe('failed');
      expect(result.error?.message).toContain('cannot execute skill');
    });

    it('should return failed result for missing required params', async () => {
      const result = await skillExecutor.execute({
        skillId: 'test-skill',
        roleId: 'security-expert',
        params: {},
      });
      expect(result.status).toBe('failed');
      expect(result.error?.message).toContain('Missing required parameter');
    });

    it('should execute with valid request', async () => {
      const result = await skillExecutor.execute({
        skillId: 'test-skill',
        roleId: 'security-expert',
        params: { target: 'http://test.com' },
      });
      expect(result.executionId).toBeDefined();
      expect(result.skill).toBe('test-skill');
      expect(result.executedBy).toBe('security-expert');
    });

    it('should include timestamp in result', async () => {
      const result = await skillExecutor.execute({
        skillId: 'test-skill',
        roleId: 'security-expert',
        params: { target: 'test' },
      });
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('timeout handling', () => {
    it('should timeout when execution exceeds timeout', async () => {
      const slowSkill = { ...mockSkill, id: 'slow-skill', executor: 'slow-runner' };
      skillRegistry.register(slowSkill);

      const result = await skillExecutor.execute({
        skillId: 'slow-skill',
        roleId: 'security-expert',
        params: { target: 'http://test.com' },
      }, 10);

      await new Promise(r => setTimeout(r, 100));

      const finalResult = skillExecutor.getExecution(result.executionId);
      expect(finalResult?.status).toBe('failed');
      expect(finalResult?.error?.message).toContain('timed out');
    }, 2000);
  });

  describe('getExecution', () => {
    it('should return execution by ID', async () => {
      const result = await skillExecutor.execute({
        skillId: 'test-skill',
        roleId: 'security-expert',
        params: { target: 'test' },
      });
      const found = skillExecutor.getExecution(result.executionId);
      expect(found).toBeDefined();
      expect(found?.executionId).toBe(result.executionId);
    });

    it('should return undefined for unknown execution', () => {
      const found = skillExecutor.getExecution('unknown-id');
      expect(found).toBeUndefined();
    });
  });

  describe('getHistory', () => {
    it('should return all executions when no role filter', async () => {
      await skillExecutor.execute({ skillId: 'test-skill', roleId: 'security-expert', params: { target: 'a' } });
      await skillExecutor.execute({ skillId: 'test-skill', roleId: 'ciso', params: { target: 'b' } });

      const history = skillExecutor.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by role', async () => {
      await skillExecutor.execute({ skillId: 'test-skill', roleId: 'security-expert', params: { target: 'a' } });
      await skillExecutor.execute({ skillId: 'test-skill', roleId: 'ciso', params: { target: 'b' } });

      const history = skillExecutor.getHistory('security-expert');
      expect(history.every(e => e.executedBy === 'security-expert')).toBe(true);
    });

    it('should return executions sorted by timestamp descending', async () => {
      await skillExecutor.execute({ skillId: 'test-skill', roleId: 'security-expert', params: { target: 'a' } });
      await new Promise(r => setTimeout(r, 10));
      await skillExecutor.execute({ skillId: 'test-skill', roleId: 'security-expert', params: { target: 'b' } });

      const history = skillExecutor.getHistory();
      expect(history[0].timestamp.getTime()).toBeGreaterThanOrEqual(history[1].timestamp.getTime());
    });
  });
});
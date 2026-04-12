import { describe, it, expect, beforeEach } from 'vitest';
import { skillRegistry, type SkillDefinition, type RoleId } from '../../../src/skills/registry.js';

describe('SkillRegistry', () => {
  const mockSkill: SkillDefinition = {
    id: 'test-skill',
    name: 'Test Skill',
    description: 'A test skill',
    executor: 'test-executor',
    params: [
      { name: 'target', type: 'string', required: true, description: 'Target URL' },
      { name: 'timeout', type: 'number', required: false, description: 'Timeout', default: 30000 },
    ],
    resultType: 'json',
    requiredRoles: ['security-expert', 'ciso'],
  };

  beforeEach(() => {
    skillRegistry.clear();
  });

  describe('register', () => {
    it('should register a skill', () => {
      skillRegistry.register(mockSkill);
      const skill = skillRegistry.getSkill('test-skill');
      expect(skill).toEqual(mockSkill);
    });

    it('should map skill to required roles', () => {
      skillRegistry.register(mockSkill);
      const expertSkills = skillRegistry.getSkillsForRole('security-expert');
      const cisoSkills = skillRegistry.getSkillsForRole('ciso');

      expect(expertSkills.some(s => s.id === 'test-skill')).toBe(true);
      expect(cisoSkills.some(s => s.id === 'test-skill')).toBe(true);
    });

    it('should allow multiple skills per role', () => {
      const skill2 = { ...mockSkill, id: 'test-skill-2', requiredRoles: ['security-expert'] };
      skillRegistry.register(mockSkill);
      skillRegistry.register(skill2);

      const skills = skillRegistry.getSkillsForRole('security-expert');
      expect(skills).toHaveLength(2);
    });
  });

  describe('getSkill', () => {
    it('should return registered skill', () => {
      skillRegistry.register(mockSkill);
      const skill = skillRegistry.getSkill('test-skill');
      expect(skill).toBeDefined();
      expect(skill?.id).toBe('test-skill');
    });

    it('should return undefined for unknown skill', () => {
      const skill = skillRegistry.getSkill('unknown-skill');
      expect(skill).toBeUndefined();
    });
  });

  describe('getSkillsForRole', () => {
    it('should return skills for role sorted by name', () => {
      const skill1 = { ...mockSkill, id: 'aaa-skill', name: 'Alpha Skill', requiredRoles: ['security-expert'] as RoleId[] };
      const skill2 = { ...mockSkill, id: 'zzz-skill', name: 'Zeta Skill', requiredRoles: ['security-expert'] as RoleId[] };
      skillRegistry.register(skill1);
      skillRegistry.register(skill2);

      const skills = skillRegistry.getSkillsForRole('security-expert');
      expect(skills[0].name).toBe('Alpha Skill');
      expect(skills[1].name).toBe('Zeta Skill');
    });

    it('should return empty array for role with no skills', () => {
      const skills = skillRegistry.getSkillsForRole('supply-chain-security');
      expect(skills).toEqual([]);
    });

    it('should not return skill if role not in requiredRoles', () => {
      skillRegistry.register(mockSkill);
      const skills = skillRegistry.getSkillsForRole('supply-chain-security');
      expect(skills.some(s => s.id === 'test-skill')).toBe(false);
    });
  });

  describe('getExecutorForSkill', () => {
    it('should return executor name', () => {
      skillRegistry.register(mockSkill);
      const executor = skillRegistry.getExecutorForSkill('test-skill');
      expect(executor).toBe('test-executor');
    });

    it('should return null for unknown skill', () => {
      const executor = skillRegistry.getExecutorForSkill('unknown');
      expect(executor).toBeNull();
    });
  });

  describe('canExecute', () => {
    it('should return true when role is allowed', () => {
      skillRegistry.register(mockSkill);
      expect(skillRegistry.canExecute('test-skill', 'security-expert')).toBe(true);
      expect(skillRegistry.canExecute('test-skill', 'ciso')).toBe(true);
    });

    it('should return false when role is not allowed', () => {
      skillRegistry.register(mockSkill);
      expect(skillRegistry.canExecute('test-skill', 'supply-chain-security')).toBe(false);
    });

    it('should return false for unknown skill', () => {
      expect(skillRegistry.canExecute('unknown', 'security-expert')).toBe(false);
    });
  });

  describe('getParamsForSkill', () => {
    it('should return skill params', () => {
      skillRegistry.register(mockSkill);
      const params = skillRegistry.getParamsForSkill('test-skill');
      expect(params).toHaveLength(2);
      expect(params[0].name).toBe('target');
    });

    it('should return empty array for unknown skill', () => {
      const params = skillRegistry.getParamsForSkill('unknown');
      expect(params).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should remove all skills and role mappings', () => {
      skillRegistry.register(mockSkill);
      skillRegistry.clear();

      expect(skillRegistry.getSkill('test-skill')).toBeUndefined();
      expect(skillRegistry.getSkillsForRole('security-expert')).toEqual([]);
    });
  });

  describe('reloadSkill', () => {
    it('should update existing skill', () => {
      skillRegistry.register(mockSkill);
      const updatedSkill = { ...mockSkill, name: 'Updated Skill', params: [] };
      skillRegistry.reloadSkill('test-skill', updatedSkill);

      expect(skillRegistry.getSkill('test-skill')?.name).toBe('Updated Skill');
    });

    it('should add new skill if not exists', () => {
      skillRegistry.reloadSkill('new-skill', mockSkill);
      expect(skillRegistry.getSkill('new-skill')).toBeDefined();
    });
  });

  describe('removeSkill', () => {
    it('should remove skill and clean up role mappings', () => {
      skillRegistry.register(mockSkill);
      skillRegistry.removeSkill('test-skill');

      expect(skillRegistry.getSkill('test-skill')).toBeUndefined();
      expect(skillRegistry.getSkillsForRole('security-expert')).toEqual([]);
      expect(skillRegistry.canExecute('test-skill', 'security-expert')).toBe(false);
    });
  });
});
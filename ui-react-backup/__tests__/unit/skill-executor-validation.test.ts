import { describe, it, expect } from 'vitest';

interface SkillParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: any;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  params: SkillParam[];
}

function validateParams(selectedSkill: Skill | null, params: Record<string, any>): boolean {
  if (!selectedSkill) return false;

  for (const param of selectedSkill.params) {
    if (param.required && !params[param.name]) {
      return false;
    }
  }
  return true;
}

describe('SkillExecutor Parameter Validation', () => {
  const mockSkill: Skill = {
    id: 'test-skill',
    name: 'Test Skill',
    description: 'A test skill',
    params: [
      { name: 'target', type: 'string', required: true, description: 'Target URL' },
      { name: 'depth', type: 'number', required: false, description: 'Scan depth' },
      { name: 'timeout', type: 'number', required: false, description: 'Timeout in seconds', default: 30 },
    ],
  };

  describe('validateParams', () => {
    it('should return false when no skill is selected', () => {
      expect(validateParams(null, {})).toBe(false);
    });

    it('should return true when all required params are provided', () => {
      const params = { target: 'https://example.com' };
      expect(validateParams(mockSkill, params)).toBe(true);
    });

    it('should return false when required param is missing', () => {
      const params = {};
      expect(validateParams(mockSkill, params)).toBe(false);
    });

    it('should return false when required param is empty string', () => {
      const params = { target: '' };
      expect(validateParams(mockSkill, params)).toBe(false);
    });

    it('should return true when only required params are provided', () => {
      const params = { target: 'https://example.com' };
      expect(validateParams(mockSkill, params)).toBe(true);
    });

    it('should return true when optional params are also provided', () => {
      const params = { target: 'https://example.com', depth: 3, timeout: 60 };
      expect(validateParams(mockSkill, params)).toBe(true);
    });

    it('should return true when optional params are omitted', () => {
      const params = { target: 'https://example.com' };
      expect(validateParams(mockSkill, params)).toBe(true);
    });

    it('should return false when required param is undefined', () => {
      const params = { target: undefined };
      expect(validateParams(mockSkill, params)).toBe(false);
    });

    it('should handle skill with no params', () => {
      const skillNoParams: Skill = {
        id: 'no-params',
        name: 'No Params Skill',
        description: 'Has no params',
        params: [],
      };
      expect(validateParams(skillNoParams, {})).toBe(true);
    });

    it('should handle skill with only optional params', () => {
      const skillOptionalOnly: Skill = {
        id: 'optional-only',
        name: 'Optional Only Skill',
        description: 'All params optional',
        params: [
          { name: 'optional1', type: 'string', required: false, description: 'Optional param' },
        ],
      };
      expect(validateParams(skillOptionalOnly, {})).toBe(true);
    });

    it('should handle multiple required params', () => {
      const skillMultiRequired: Skill = {
        id: 'multi-required',
        name: 'Multi Required',
        description: 'Multiple required params',
        params: [
          { name: 'param1', type: 'string', required: true, description: 'Required 1' },
          { name: 'param2', type: 'string', required: true, description: 'Required 2' },
          { name: 'param3', type: 'string', required: false, description: 'Optional' },
        ],
      };

      expect(validateParams(skillMultiRequired, { param1: 'a' })).toBe(false);
      expect(validateParams(skillMultiRequired, { param2: 'b' })).toBe(false);
      expect(validateParams(skillMultiRequired, { param1: 'a', param2: 'b' })).toBe(true);
      expect(validateParams(skillMultiRequired, { param1: 'a', param2: 'b', param3: 'c' })).toBe(true);
    });
  });

  describe('Parameter type handling', () => {
    it('should validate string type params', () => {
      const skill: Skill = {
        id: 'string-skill',
        name: 'String Skill',
        description: '',
        params: [
          { name: 'text', type: 'string', required: true, description: 'Text input' },
        ],
      };

      expect(validateParams(skill, { text: 'hello' })).toBe(true);
      expect(validateParams(skill, { text: '' })).toBe(false);
    });

    it('should validate number type params', () => {
      const skill: Skill = {
        id: 'number-skill',
        name: 'Number Skill',
        description: '',
        params: [
          { name: 'count', type: 'number', required: true, description: 'Count' },
        ],
      };

      expect(validateParams(skill, { count: 0 })).toBe(true);
      expect(validateParams(skill, { count: 42 })).toBe(true);
      expect(validateParams(skill, { count: -1 })).toBe(true);
    });

    it('should validate boolean type params', () => {
      const skill: Skill = {
        id: 'boolean-skill',
        name: 'Boolean Skill',
        description: '',
        params: [
          { name: 'enabled', type: 'boolean', required: true, description: 'Enabled flag' },
        ],
      };

      expect(validateParams(skill, { enabled: true })).toBe(true);
      expect(validateParams(skill, { enabled: false })).toBe(true);
    });
  });
});

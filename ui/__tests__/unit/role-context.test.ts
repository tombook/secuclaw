import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/ui/store/skill-store.js', () => ({
  skillStore: {
    getSkill: vi.fn(),
    loadSkill: vi.fn(),
    getAllSkills: vi.fn(),
    loadSkills: vi.fn(),
  },
}));

vi.mock('../../src/ui/services/permission-service.js', () => ({
  permissionService: {
    can: vi.fn(),
    canAny: vi.fn(),
    canAll: vi.fn(),
  },
}));

describe('RoleContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('can() method', () => {
    it('should return true when role has required permission', () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      roleContext.setRole('security-expert');
      const result = roleContext.can('vulnerabilities.read');
      expect(result).toBe(true);
    });

    it('should return false when role does not have required permission', () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      roleContext.setRole('supply-chain-security');
      const result = roleContext.can('assets.write');
      expect(result).toBe(false);
    });

    it('should return false when no role is selected', () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      roleContext.clearRole();
      const result = roleContext.can('vulnerabilities.read');
      expect(result).toBe(false);
    });

    it('should accept array of permissions and return true if any matches', () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      roleContext.setRole('security-expert');
      const result = roleContext.can(['vulnerabilities.read', 'assets.write']);
      expect(result).toBe(true);
    });
  });

  describe('canRead() method', () => {
    it('should return true for resource.read permission', () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      roleContext.setRole('security-expert');
      expect(roleContext.canRead('vulnerabilities')).toBe(true);
    });

    it('should return false when role lacks read permission', () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      roleContext.setRole('supply-chain-security');
      expect(roleContext.canRead('vulnerabilities')).toBe(false);
    });
  });

  describe('canWrite() method', () => {
    it('should return true for resource.write permission', () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      roleContext.setRole('security-expert');
      expect(roleContext.canWrite('vulnerabilities')).toBe(true);
    });

    it('should return false when role lacks write permission', () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      roleContext.setRole('supply-chain-security');
      expect(roleContext.canWrite('assets')).toBe(false);
    });
  });

  describe('canDelete() method', () => {
    it('should return true for resource.delete permission', () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      roleContext.setRole('secuclaw-commander');
      expect(roleContext.canDelete('assets')).toBe(true);
    });

    it('should return false when role lacks delete permission', () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      roleContext.setRole('security-expert');
      expect(roleContext.canDelete('assets')).toBe(false);
    });
  });

  describe('setRole()', () => {
    it('should update current role and role profile', async () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      const { skillStore } = await import('../../src/ui/store/skill-store.js');
      
      const mockSkill = {
        id: 'security-expert',
        name: '安全专家',
        description: '漏洞管理与安全分析',
        params: [],
        metadata: {
          openclaw: {
            role: 'security-expert',
            emoji: '🔐',
            description: '漏洞管理与安全分析',
            capabilities: { light: [], dark: [], security: [], legal: [], technology: [], business: [] },
            mitre_coverage: [],
            scf_coverage: [],
          },
        },
      };
      
      vi.mocked(skillStore.getSkill).mockReturnValue(mockSkill as any);
      vi.mocked(skillStore.loadSkill).mockResolvedValue(undefined);
      
      await roleContext.setRole('security-expert');
      
      expect(roleContext.getState().currentRole).toBe('security-expert');
      expect(roleContext.getState().roleProfile).not.toBeNull();
    });
  });

  describe('clearRole()', () => {
    it('should clear current role and role profile', () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      roleContext.setRole('security-expert');
      roleContext.clearRole();
      
      const state = roleContext.getState();
      expect(state.currentRole).toBeNull();
      expect(state.roleProfile).toBeNull();
    });
  });

  describe('recentRoles', () => {
    it('should persist last 3 used roles', async () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      const { skillStore } = await import('../../src/ui/store/skill-store.js');
      
      const createMockSkill = (id: string) => ({
        id,
        name: id,
        description: '',
        params: [],
        metadata: {
          openclaw: {
            role: id,
            emoji: '🔐',
            description: '',
            capabilities: { light: [], dark: [], security: [], legal: [], technology: [], business: [] },
            mitre_coverage: [],
            scf_coverage: [],
          },
        },
      });
      
      vi.mocked(skillStore.getSkill).mockImplementation((id: string) => createMockSkill(id) as any);
      vi.mocked(skillStore.loadSkill).mockResolvedValue(undefined);
      
      await roleContext.setRole('security-expert');
      await roleContext.setRole('privacy-officer');
      await roleContext.setRole('security-architect');
      
      const recent = roleContext.getState().recentRoles;
      expect(recent).toHaveLength(3);
      expect(recent[0]).toBe('security-architect');
      expect(recent[1]).toBe('privacy-officer');
      expect(recent[2]).toBe('security-expert');
    });
  });

  describe('getAllRoleIds()', () => {
    it('should return all 8 role IDs', () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      const roleIds = roleContext.getAllRoleIds();
      
      expect(roleIds).toHaveLength(8);
      expect(roleIds).toContain('security-expert');
      expect(roleIds).toContain('privacy-officer');
      expect(roleIds).toContain('security-architect');
      expect(roleIds).toContain('business-security-officer');
      expect(roleIds).toContain('secuclaw-commander');
      expect(roleIds).toContain('ciso');
      expect(roleIds).toContain('security-ops');
      expect(roleIds).toContain('supply-chain-security');
    });
  });
});

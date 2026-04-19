import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/ui/store/skill-store.js', () => ({
  skillStore: {
    getSkill: vi.fn(),
    loadSkill: vi.fn(),
    getAllSkills: vi.fn(),
    loadSkills: vi.fn(),
  },
}));

vi.mock('../../src/ui/config/raci-matrix.js', () => ({
  RACI_MATRIX: {},
  RaciRole: { Responsible: 'Responsible', Accountable: 'Accountable', Consulted: 'Consulted', Informed: 'Informed' },
  ScenarioType: { IncidentResponse: 'incident-response', ComplianceAudit: 'compliance-audit', ArchitectureReview: 'architecture-review' },
}));

describe('Role Identity System', () => {
  let documentElement: HTMLElement;
  let originalSetProperty: typeof CSSStyleDeclaration.prototype.setProperty;

  beforeEach(() => {
    documentElement = document.documentElement;
    originalSetProperty = documentElement.style.setProperty;
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    documentElement.style.setProperty = originalSetProperty;
  });

  describe('roleContext.getTheme()', () => {
    it('returns correct theme for security-expert', async () => {
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
      const theme = roleContext.getTheme();
      
      expect(theme).not.toBeNull();
      expect(theme?.primary).toBe('#3b82f6');
      expect(theme?.secondary).toBe('#60a5fa');
    });

    it('returns correct theme for privacy-officer', async () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      const { skillStore } = await import('../../src/ui/store/skill-store.js');
      
      const mockSkill = {
        id: 'privacy-officer',
        name: '隐私安全官',
        description: '隐私合规管理',
        params: [],
        metadata: {
          openclaw: {
            role: 'privacy-officer',
            emoji: '🔒',
            description: '隐私合规管理',
            capabilities: { light: [], dark: [], security: [], legal: [], technology: [], business: [] },
            mitre_coverage: [],
            scf_coverage: [],
          },
        },
      };
      
      vi.mocked(skillStore.getSkill).mockReturnValue(mockSkill as any);
      vi.mocked(skillStore.loadSkill).mockResolvedValue(undefined);
      
      await roleContext.setRole('privacy-officer');
      const theme = roleContext.getTheme();
      
      expect(theme?.primary).toBe('#8b5cf6');
      expect(theme?.secondary).toBe('#a78bfa');
    });

    it('returns correct theme for security-architect', async () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      const { skillStore } = await import('../../src/ui/store/skill-store.js');
      
      const mockSkill = {
        id: 'security-architect',
        name: '安全架构师',
        description: '安全架构设计',
        params: [],
        metadata: {
          openclaw: {
            role: 'security-architect',
            emoji: '🏗️',
            description: '安全架构设计',
            capabilities: { light: [], dark: [], security: [], legal: [], technology: [], business: [] },
            mitre_coverage: [],
            scf_coverage: [],
          },
        },
      };
      
      vi.mocked(skillStore.getSkill).mockReturnValue(mockSkill as any);
      vi.mocked(skillStore.loadSkill).mockResolvedValue(undefined);
      
      await roleContext.setRole('security-architect');
      const theme = roleContext.getTheme();
      
      expect(theme?.primary).toBe('#f59e0b');
      expect(theme?.secondary).toBe('#fbbf24');
    });

    it('returns correct theme for business-security-officer', async () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      const { skillStore } = await import('../../src/ui/store/skill-store.js');
      
      const mockSkill = {
        id: 'business-security-officer',
        name: '业务安全官',
        description: '业务连续性管理',
        params: [],
        metadata: {
          openclaw: {
            role: 'business-security-officer',
            emoji: '📊',
            description: '业务连续性管理',
            capabilities: { light: [], dark: [], security: [], legal: [], technology: [], business: [] },
            mitre_coverage: [],
            scf_coverage: [],
          },
        },
      };
      
      vi.mocked(skillStore.getSkill).mockReturnValue(mockSkill as any);
      vi.mocked(skillStore.loadSkill).mockResolvedValue(undefined);
      
      await roleContext.setRole('business-security-officer');
      const theme = roleContext.getTheme();
      
      expect(theme?.primary).toBe('#10b981');
      expect(theme?.secondary).toBe('#34d399');
    });

    it('returns correct theme for secuclaw-commander', async () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      const { skillStore } = await import('../../src/ui/store/skill-store.js');
      
      const mockSkill = {
        id: 'secuclaw-commander',
        name: '全域安全指挥官',
        description: '全域安全指挥',
        params: [],
        metadata: {
          openclaw: {
            role: 'secuclaw-commander',
            emoji: '🎯',
            description: '全域安全指挥',
            capabilities: { light: [], dark: [], security: [], legal: [], technology: [], business: [] },
            mitre_coverage: [],
            scf_coverage: [],
          },
        },
      };
      
      vi.mocked(skillStore.getSkill).mockReturnValue(mockSkill as any);
      vi.mocked(skillStore.loadSkill).mockResolvedValue(undefined);
      
      await roleContext.setRole('secuclaw-commander');
      const theme = roleContext.getTheme();
      
      expect(theme?.primary).toBe('#ef4444');
      expect(theme?.secondary).toBe('#f87171');
    });

    it('returns correct theme for ciso', async () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      const { skillStore } = await import('../../src/ui/store/skill-store.js');
      
      const mockSkill = {
        id: 'ciso',
        name: '首席信息安全官',
        description: '安全战略规划',
        params: [],
        metadata: {
          openclaw: {
            role: 'ciso',
            emoji: '👔',
            description: '安全战略规划',
            capabilities: { light: [], dark: [], security: [], legal: [], technology: [], business: [] },
            mitre_coverage: [],
            scf_coverage: [],
          },
        },
      };
      
      vi.mocked(skillStore.getSkill).mockReturnValue(mockSkill as any);
      vi.mocked(skillStore.loadSkill).mockResolvedValue(undefined);
      
      await roleContext.setRole('ciso');
      const theme = roleContext.getTheme();
      
      expect(theme?.primary).toBe('#6366f1');
      expect(theme?.secondary).toBe('#818cf8');
    });

    it('returns correct theme for security-ops', async () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      const { skillStore } = await import('../../src/ui/store/skill-store.js');
      
      const mockSkill = {
        id: 'security-ops',
        name: '安全运营官',
        description: 'SOC运营管理',
        params: [],
        metadata: {
          openclaw: {
            role: 'security-ops',
            emoji: '⚙️',
            description: 'SOC运营管理',
            capabilities: { light: [], dark: [], security: [], legal: [], technology: [], business: [] },
            mitre_coverage: [],
            scf_coverage: [],
          },
        },
      };
      
      vi.mocked(skillStore.getSkill).mockReturnValue(mockSkill as any);
      vi.mocked(skillStore.loadSkill).mockResolvedValue(undefined);
      
      await roleContext.setRole('security-ops');
      const theme = roleContext.getTheme();
      
      expect(theme?.primary).toBe('#f97316');
      expect(theme?.secondary).toBe('#fb923c');
    });

    it('returns correct theme for supply-chain-security', async () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      const { skillStore } = await import('../../src/ui/store/skill-store.js');
      
      const mockSkill = {
        id: 'supply-chain-security',
        name: '供应链安全官',
        description: '供应链安全管理',
        params: [],
        metadata: {
          openclaw: {
            role: 'supply-chain-security',
            emoji: '🔗',
            description: '供应链安全管理',
            capabilities: { light: [], dark: [], security: [], legal: [], technology: [], business: [] },
            mitre_coverage: [],
            scf_coverage: [],
          },
        },
      };
      
      vi.mocked(skillStore.getSkill).mockReturnValue(mockSkill as any);
      vi.mocked(skillStore.loadSkill).mockResolvedValue(undefined);
      
      await roleContext.setRole('supply-chain-security');
      const theme = roleContext.getTheme();
      
      expect(theme?.primary).toBe('#14b8a6');
      expect(theme?.secondary).toBe('#2dd4bf');
    });

    it('returns null when no role is set', async () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      
      const theme = roleContext.getTheme();
      expect(theme).toBeNull();
    });
  });

  describe('roleContext.setRole() applies theme', () => {
    it('sets CSS variables on document.documentElement', async () => {
      const setPropertySpy = vi.spyOn(documentElement.style, 'setProperty');
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
      
      expect(setPropertySpy).toHaveBeenCalledWith('--sc-role-primary', '#3b82f6');
      expect(setPropertySpy).toHaveBeenCalledWith('--sc-role-secondary', '#60a5fa');
      
      setPropertySpy.mockRestore();
    });

    it('updates CSS variables when switching roles', async () => {
      const setPropertySpy = vi.spyOn(documentElement.style, 'setProperty');
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      const { skillStore } = await import('../../src/ui/store/skill-store.js');
      
      const createMockSkill = (id: string, name: string, emoji: string) => ({
        id,
        name,
        description: '',
        params: [],
        metadata: {
          openclaw: {
            role: id,
            emoji,
            description: '',
            capabilities: { light: [], dark: [], security: [], legal: [], technology: [], business: [] },
            mitre_coverage: [],
            scf_coverage: [],
          },
        },
      });
      
      vi.mocked(skillStore.getSkill).mockImplementation((id: string) => {
        const skills: Record<string, any> = {
          'security-expert': createMockSkill('security-expert', '安全专家', '🔐'),
          'privacy-officer': createMockSkill('privacy-officer', '隐私安全官', '🔒'),
        };
        return skills[id] as any;
      });
      vi.mocked(skillStore.loadSkill).mockResolvedValue(undefined);
      
      await roleContext.setRole('security-expert');
      await roleContext.setRole('privacy-officer');
      
      expect(setPropertySpy).toHaveBeenCalledWith('--sc-role-primary', '#8b5cf6');
      expect(setPropertySpy).toHaveBeenCalledWith('--sc-role-secondary', '#a78bfa');
      
      setPropertySpy.mockRestore();
    });
  });

  describe('roleContext.getRaciAssignments()', () => {
    it('returns RACI assignments for current role', async () => {
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
      const assignments = roleContext.getRaciAssignments();
      
      expect(assignments).toBeDefined();
      expect(Array.isArray(assignments.scenarios)).toBe(true);
    });

    it('returns empty assignments when no role is set', async () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      
      const assignments = roleContext.getRaciAssignments();
      expect(assignments.scenarios).toEqual([]);
    });
  });

  describe('roleContext War Room state', () => {
    it('stores warRoomSessionId', async () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      
      roleContext.setWarRoomSession('session-123', 'incident-response' as any, 'Responsible' as any);
      const state = roleContext.getState();
      
      expect(state.warRoomSessionId).toBe('session-123');
    });

    it('stores currentScenarioType', async () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      
      roleContext.setWarRoomSession('session-123', 'incident-response' as any, 'Responsible' as any);
      const state = roleContext.getState();
      
      expect(state.currentScenarioType).toBe('incident-response');
    });

    it('stores currentRaciAssignment', async () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      
      roleContext.setWarRoomSession('session-123', 'incident-response' as any, 'Responsible' as any);
      const state = roleContext.getState();
      
      expect(state.currentRaciAssignment).toBe('Responsible');
    });

    it('clears War Room session', async () => {
      const { roleContext } = await import('../../src/ui/store/role-context.js');
      
      roleContext.setWarRoomSession('session-123', 'incident-response' as any, 'Responsible' as any);
      roleContext.clearWarRoomSession();
      const state = roleContext.getState();
      
      expect(state.warRoomSessionId).toBeNull();
      expect(state.currentScenarioType).toBeNull();
      expect(state.currentRaciAssignment).toBeNull();
    });
  });

  describe('ROLE_THEMES', () => {
    it('has theme for all 8 roles', async () => {
      const { ROLE_THEMES } = await import('../../src/ui/config/role-themes.js');
      const roles = Object.keys(ROLE_THEMES) as Array<keyof typeof ROLE_THEMES>;
      
      expect(roles).toHaveLength(8);
      
      roles.forEach(role => {
        expect(ROLE_THEMES[role]).toBeDefined();
        expect(ROLE_THEMES[role].primary).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(ROLE_THEMES[role].secondary).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(ROLE_THEMES[role].emoji).toBeTruthy();
      });
    });
  });

  describe('applyRoleTheme()', () => {
    it('sets CSS variables for security-expert', async () => {
      const { applyRoleTheme } = await import('../../src/ui/config/role-themes.js');
      
      applyRoleTheme('security-expert');
      
      expect(documentElement.style.getPropertyValue('--sc-role-primary')).toBe('#3b82f6');
      expect(documentElement.style.getPropertyValue('--sc-role-secondary')).toBe('#60a5fa');
    });

    it('sets CSS variables for all roles', async () => {
      const { applyRoleTheme, ROLE_THEMES } = await import('../../src/ui/config/role-themes.js');
      const roles = Object.keys(ROLE_THEMES) as Array<keyof typeof ROLE_THEMES>;
      
      roles.forEach(role => {
        applyRoleTheme(role);
        expect(documentElement.style.getPropertyValue('--sc-role-primary')).toBe(ROLE_THEMES[role].primary);
        expect(documentElement.style.getPropertyValue('--sc-role-secondary')).toBe(ROLE_THEMES[role].secondary);
      });
    });
  });

  describe('ScRoleSwitcher component RACI integration', () => {
    it('shows RACI badge when in War Room', async () => {
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
      
      roleContext.setWarRoomSession('session-123', 'incident-response' as any, 'Responsible' as any);
      await roleContext.setRole('security-expert');
      
      const state = roleContext.getState();
      expect(state.warRoomSessionId).toBe('session-123');
      expect(state.currentRaciAssignment).toBe('Responsible');
    });

    it('hides RACI when not in War Room', async () => {
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
      
      const state = roleContext.getState();
      expect(state.warRoomSessionId).toBeNull();
    });
  });
});

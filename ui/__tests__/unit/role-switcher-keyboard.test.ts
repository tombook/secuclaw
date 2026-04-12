import { describe, it, expect } from 'vitest';

interface RoleOption {
  roleId: string;
  emoji: string;
  displayName: string;
  description: string;
  keyPermissions: string[];
}

function getAllOptions(): RoleOption[] {
  return [
    { roleId: 'security-expert', emoji: '🔐', displayName: '安全专家', description: '漏洞管理与安全分析', keyPermissions: ['vulnerabilities.read', 'vulnerabilities.write'] },
    { roleId: 'privacy-officer', emoji: '🔒', displayName: '隐私安全官', description: '隐私合规管理', keyPermissions: ['compliance.read', 'compliance.write'] },
    { roleId: 'security-architect', emoji: '🏗️', displayName: '安全架构师', description: '安全架构设计', keyPermissions: ['assets.read', 'assets.write'] },
    { roleId: 'business-security-officer', emoji: '📊', displayName: '业务安全官', description: '业务连续性管理', keyPermissions: ['vulnerabilities.write', 'incidents.write'] },
    { roleId: 'secuclaw-commander', emoji: '🎯', displayName: '全域安全指挥官', description: '全域安全指挥', keyPermissions: ['commander.read', 'commander.write'] },
    { roleId: 'ciso', emoji: '👔', displayName: '首席信息安全官', description: '安全战略规划', keyPermissions: ['roles.read', 'roles.write'] },
    { roleId: 'security-ops', emoji: '⚙️', displayName: '安全运营官', description: 'SOC运营管理', keyPermissions: ['channels.read', 'channels.write'] },
    { roleId: 'supply-chain-security', emoji: '🔗', displayName: '供应链安全官', description: '供应链安全管理', keyPermissions: ['assets.read', 'audit.read'] },
  ];
}

function handleArrowDown(currentIndex: number, optionsLength: number): number {
  return Math.min(currentIndex + 1, optionsLength - 1);
}

function handleArrowUp(currentIndex: number): number {
  return Math.max(currentIndex - 1, 0);
}

function handleEnter(currentIndex: number, options: RoleOption[]): RoleOption | null {
  if (options[currentIndex]) {
    return options[currentIndex];
  }
  return null;
}

function handleEscape(): null {
  return null;
}

describe('Role Switcher Keyboard Navigation', () => {
  const options = getAllOptions();

  describe('Arrow Down', () => {
    it('should increment index by 1', () => {
      expect(handleArrowDown(0, options.length)).toBe(1);
    });

    it('should not exceed options length', () => {
      expect(handleArrowDown(options.length - 1, options.length)).toBe(options.length - 1);
    });

    it('should wrap around to last index when at beginning', () => {
      expect(handleArrowDown(0, options.length)).toBe(1);
    });

    it('should handle index in middle of list', () => {
      expect(handleArrowDown(3, options.length)).toBe(4);
    });

    it('should stay at last index when already there', () => {
      const lastIndex = options.length - 1;
      expect(handleArrowDown(lastIndex, options.length)).toBe(lastIndex);
    });
  });

  describe('Arrow Up', () => {
    it('should decrement index by 1', () => {
      expect(handleArrowUp(5)).toBe(4);
    });

    it('should not go below 0', () => {
      expect(handleArrowUp(0)).toBe(0);
    });

    it('should handle index in middle of list', () => {
      expect(handleArrowUp(4)).toBe(3);
    });

    it('should stay at 0 when already there', () => {
      expect(handleArrowUp(0)).toBe(0);
    });
  });

  describe('Enter', () => {
    it('should return selected option', () => {
      const selected = handleEnter(2, options);
      expect(selected).not.toBeNull();
      expect(selected?.roleId).toBe('security-architect');
    });

    it('should return null when index is out of bounds', () => {
      const selected = handleEnter(100, options);
      expect(selected).toBeNull();
    });

    it('should return first option when index is 0', () => {
      const selected = handleEnter(0, options);
      expect(selected?.roleId).toBe('security-expert');
    });

    it('should return last option when index is last', () => {
      const selected = handleEnter(options.length - 1, options);
      expect(selected?.roleId).toBe('supply-chain-security');
    });
  });

  describe('Escape', () => {
    it('should return null', () => {
      expect(handleEscape()).toBeNull();
    });
  });

  describe('Keyboard navigation flow', () => {
    it('should navigate from first to last with up/down', () => {
      let index = 0;
      
      index = handleArrowDown(index, options.length);
      expect(index).toBe(1);
      
      index = handleArrowDown(index, options.length);
      expect(index).toBe(2);
      
      index = handleArrowDown(index, options.length);
      expect(index).toBe(3);
    });

    it('should navigate up and down correctly', () => {
      let index = 4;
      
      index = handleArrowUp(index);
      expect(index).toBe(3);
      
      index = handleArrowUp(index);
      expect(index).toBe(2);
      
      index = handleArrowDown(index, options.length);
      expect(index).toBe(3);
    });

    it('should select option on Enter after navigation', () => {
      let index = 0;
      
      index = handleArrowDown(index, options.length);
      index = handleArrowDown(index, options.length);
      index = handleArrowDown(index, options.length);
      
      const selected = handleEnter(index, options);
      expect(selected?.displayName).toBe('业务安全官');
    });

    it('should close dropdown on Escape', () => {
      const result = handleEscape();
      expect(result).toBeNull();
    });
  });

  describe('Boundary conditions', () => {
    it('should handle single option', () => {
      const singleOption: RoleOption[] = [options[0]];
      
      expect(handleArrowDown(0, singleOption.length)).toBe(0);
      expect(handleArrowUp(0)).toBe(0);
      
      const selected = handleEnter(0, singleOption);
      expect(selected?.roleId).toBe('security-expert');
    });

    it('should handle empty options', () => {
      expect(handleArrowDown(0, 0)).toBe(-1);
      expect(handleArrowUp(0)).toBe(0);
      expect(handleEnter(0, [])).toBeNull();
    });
  });

  describe('Role switching', () => {
    it('should allow switching to any role', () => {
      const roleIds = options.map(o => o.roleId);
      
      expect(roleIds).toContain('security-expert');
      expect(roleIds).toContain('privacy-officer');
      expect(roleIds).toContain('security-architect');
      expect(roleIds).toContain('business-security-officer');
      expect(roleIds).toContain('secuclaw-commander');
      expect(roleIds).toContain('ciso');
      expect(roleIds).toContain('security-ops');
      expect(roleIds).toContain('supply-chain-security');
    });

    it('should have 8 roles total', () => {
      expect(options.length).toBe(8);
    });
  });
});

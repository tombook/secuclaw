import { describe, it, expect } from 'vitest';
import {
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
} from '../../../packages/core/src/roles/permissions.js';

describe('Permission Guard Logic', () => {
  describe('hasAnyPermission', () => {
    it('should return true if user has exact permission', () => {
      const result = hasAnyPermission(['assets.read', 'vulnerabilities.read'], ['assets.read']);
      expect(result).toBe(true);
    });

    it('should return true if user has wildcard', () => {
      const result = hasAnyPermission(['*'], ['assets.write']);
      expect(result).toBe(true);
    });

    it('should return true if user has domain wildcard', () => {
      const result = hasAnyPermission(['assets.*'], ['assets.write']);
      expect(result).toBe(true);
    });

    it('should return false if user lacks permission', () => {
      const result = hasAnyPermission(['assets.read'], ['assets.write']);
      expect(result).toBe(false);
    });

    it('should return true if any required permission matches', () => {
      const result = hasAnyPermission(['assets.read'], ['assets.read', 'vulnerabilities.read']);
      expect(result).toBe(true);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', () => {
      const result = hasAllPermissions(
        ['assets.read', 'vulnerabilities.read', 'incidents.read'],
        ['assets.read', 'vulnerabilities.read']
      );
      expect(result).toBe(true);
    });

    it('should return false if user lacks any permission', () => {
      const result = hasAllPermissions(
        ['assets.read'],
        ['assets.read', 'vulnerabilities.read']
      );
      expect(result).toBe(false);
    });

    it('should return true if user has wildcard', () => {
      const result = hasAllPermissions(['*'], ['assets.write', 'llm.manage']);
      expect(result).toBe(true);
    });

    it('should return true if user has domain wildcard covering all', () => {
      const result = hasAllPermissions(
        ['assets.*'],
        ['assets.read', 'assets.write']
      );
      expect(result).toBe(true);
    });
  });

  describe('PermissionGuard use cases', () => {
    it('security-expert should have vulnerabilities.read', () => {
      const perms = getRolePermissions('security-expert');
      expect(hasAnyPermission(perms, ['vulnerabilities.read'])).toBe(true);
    });

    it('security-expert should NOT have llm.manage', () => {
      const perms = getRolePermissions('security-expert');
      expect(hasAnyPermission(perms, ['llm.manage'])).toBe(false);
    });

    it('ciso should have llm.manage', () => {
      const perms = getRolePermissions('ciso');
      expect(hasAnyPermission(perms, ['llm.manage'])).toBe(true);
    });

    it('supply-chain-security should NOT have assets.write', () => {
      const perms = getRolePermissions('supply-chain-security');
      expect(hasAnyPermission(perms, ['assets.write'])).toBe(false);
    });

    it('secuclaw-commander should have commander permissions', () => {
      const perms = getRolePermissions('secuclaw-commander');
      expect(hasAllPermissions(perms, ['commander.read', 'commander.write'])).toBe(true);
    });
  });

  describe('Single permission check (requires attribute)', () => {
    it('should check single permission correctly', () => {
      const perms = getRolePermissions('security-expert');
      const required = 'vulnerabilities.read';
      expect(hasAnyPermission(perms, [required])).toBe(true);
    });
  });

  describe('Comma-separated permissions (requires-any attribute)', () => {
    it('should check any of comma-separated permissions', () => {
      const perms = getRolePermissions('security-expert');
      const requiredList = ['vulnerabilities.read', 'assets.write'];
      expect(hasAnyPermission(perms, requiredList)).toBe(true);
    });
  });

  describe('Multiple permissions (requires-all attribute)', () => {
    it('should check all comma-separated permissions', () => {
      const perms = getRolePermissions('security-expert');
      const requiredList = ['vulnerabilities.read', 'vulnerabilities.write'];
      expect(hasAllPermissions(perms, requiredList)).toBe(true);
    });

    it('should fail when not all permissions present', () => {
      const perms = getRolePermissions('supply-chain-security');
      const requiredList = ['assets.read', 'assets.write'];
      expect(hasAllPermissions(perms, requiredList)).toBe(false);
    });
  });
});

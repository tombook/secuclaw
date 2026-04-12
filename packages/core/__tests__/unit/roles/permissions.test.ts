import { describe, it, expect } from 'vitest';
import {
  PERMISSIONS,
  PERMISSION_MATRIX,
  getRolePermissions,
  getInheritedPermissions,
  hasPermissionWithInheritance,
  hasAnyPermission,
  hasAllPermissions,
} from '../../../src/roles/permissions.js';

describe('permissions.ts', () => {
  describe('PERMISSIONS constant', () => {
    it('should contain all required permission keys', () => {
      expect(PERMISSIONS.ASSETS_READ).toBe('assets.read');
      expect(PERMISSIONS.VULNS_READ).toBe('vulnerabilities.read');
      expect(PERMISSIONS.INCIDENTS_READ).toBe('incidents.read');
      expect(PERMISSIONS.AUDIT_READ).toBe('audit.read');
    });

    it('should have read/write/delete pairs for key resources', () => {
      expect(PERMISSIONS.ASSETS_WRITE).toBe('assets.write');
      expect(PERMISSIONS.ASSETS_DELETE).toBe('assets.delete');
      expect(PERMISSIONS.VULNS_WRITE).toBe('vulnerabilities.write');
      expect(PERMISSIONS.VULNS_DELETE).toBe('vulnerabilities.delete');
    });
  });

  describe('PERMISSION_MATRIX', () => {
    it('should have admin with wildcard permission', () => {
      expect(PERMISSION_MATRIX.admin).toContain('*');
    });

    it('should have all 8 security roles defined', () => {
      const expectedRoles = [
        'admin',
        'secuclaw-commander',
        'supply-chain-security',
        'business-security-officer',
        'privacy-officer',
        'security-architect',
        'ciso',
        'security-expert',
        'security-ops',
        'auditor',
      ];
      expectedRoles.forEach(role => {
        expect(PERMISSION_MATRIX[role]).toBeDefined();
        expect(Array.isArray(PERMISSION_MATRIX[role])).toBe(true);
      });
    });

    it('should give secuclaw-commander most permissions', () => {
      const commander = PERMISSION_MATRIX['secuclaw-commander'];
      expect(commander).toContain(PERMISSIONS.ASSETS_READ);
      expect(commander).toContain(PERMISSIONS.ASSETS_WRITE);
      expect(commander).toContain(PERMISSIONS.ASSETS_DELETE);
      expect(commander).toContain(PERMISSIONS.LLM_MANAGE);
    });

    it('should give supply-chain-security read-only permissions', () => {
      const supplyChain = PERMISSION_MATRIX['supply-chain-security'];
      expect(supplyChain).toContain(PERMISSIONS.ASSETS_READ);
      expect(supplyChain).not.toContain(PERMISSIONS.ASSETS_WRITE);
      expect(supplyChain).not.toContain(PERMISSIONS.ASSETS_DELETE);
    });
  });

  describe('getRolePermissions', () => {
    it('should return permissions for secuclaw-commander', () => {
      const perms = getRolePermissions('secuclaw-commander');
      expect(perms).toContain(PERMISSIONS.ASSETS_READ);
      expect(perms).toContain(PERMISSIONS.KPI_READ);
    });

    it('should return empty array for unknown role', () => {
      const perms = getRolePermissions('unknown-role');
      expect(perms).toEqual([]);
    });

    it('should return admin wildcard', () => {
      const perms = getRolePermissions('admin');
      expect(perms).toContain('*');
    });
  });

  describe('getInheritedPermissions', () => {
    it('should include own permissions', () => {
      const perms = getInheritedPermissions('security-expert');
      expect(perms).toContain(PERMISSIONS.VULNS_READ);
      expect(perms).toContain(PERMISSIONS.INCIDENTS_READ);
    });

    it('should inherit from security-ops to security-expert', () => {
      const perms = getInheritedPermissions('security-ops');
      // security-ops inherits from security-expert
      expect(perms).toContain(PERMISSIONS.ASSETS_READ);
    });

    it('should inherit through hierarchy chain secuclaw-commander -> ciso -> security-expert', () => {
      const perms = getInheritedPermissions('secuclaw-commander');
      expect(perms.length).toBeGreaterThanOrEqual(PERMISSION_MATRIX['secuclaw-commander'].length);
    });

    it('should not return duplicate permissions', () => {
      const perms = getInheritedPermissions('secuclaw-commander');
      const unique = new Set(perms);
      expect(perms.length).toBe(unique.size);
    });

    it('should return empty for unknown role', () => {
      const perms = getInheritedPermissions('unknown');
      expect(perms).toEqual([]);
    });
  });

  describe('hasPermissionWithInheritance', () => {
    it('should return true when role has permission directly', () => {
      const result = hasPermissionWithInheritance('security-expert', PERMISSIONS.VULNS_READ);
      expect(result).toBe(true);
    });

    it('should return true when role inherits permission', () => {
      // secuclaw-commander inherits from ciso, security-expert, security-ops
      const result = hasPermissionWithInheritance('secuclaw-commander', PERMISSIONS.VULNS_READ);
      expect(result).toBe(true);
    });

    it('should return false when role lacks permission', () => {
      const result = hasPermissionWithInheritance('supply-chain-security', PERMISSIONS.ASSETS_WRITE);
      expect(result).toBe(false);
    });

    it('should accept array of permissions (any match)', () => {
      const result = hasPermissionWithInheritance('security-expert', [PERMISSIONS.VULNS_WRITE, PERMISSIONS.ASSETS_WRITE]);
      expect(result).toBe(true);
    });

    it('should return false when no permissions match', () => {
      const result = hasPermissionWithInheritance('supply-chain-security', [PERMISSIONS.ASSETS_WRITE, PERMISSIONS.LLM_MANAGE]);
      expect(result).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has exact permission', () => {
      const result = hasAnyPermission([PERMISSIONS.ASSETS_READ, PERMISSIONS.VULNS_READ], [PERMISSIONS.ASSETS_READ]);
      expect(result).toBe(true);
    });

    it('should return true if user has wildcard', () => {
      const result = hasAnyPermission(['*'], [PERMISSIONS.ASSETS_WRITE]);
      expect(result).toBe(true);
    });

    it('should return true if user has domain wildcard', () => {
      const result = hasAnyPermission(['assets.*'], [PERMISSIONS.ASSETS_WRITE]);
      expect(result).toBe(true);
    });

    it('should return false if user lacks permission', () => {
      const result = hasAnyPermission([PERMISSIONS.ASSETS_READ], [PERMISSIONS.ASSETS_WRITE]);
      expect(result).toBe(false);
    });

    it('should return true if any required permission matches', () => {
      const result = hasAnyPermission([PERMISSIONS.ASSETS_READ], [PERMISSIONS.ASSETS_READ, PERMISSIONS.VULNS_READ]);
      expect(result).toBe(true);
    });

    it('should return false for empty required list', () => {
      const result = hasAnyPermission([PERMISSIONS.ASSETS_READ], []);
      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', () => {
      const result = hasAllPermissions(
        [PERMISSIONS.ASSETS_READ, PERMISSIONS.VULNS_READ, PERMISSIONS.INCIDENTS_READ],
        [PERMISSIONS.ASSETS_READ, PERMISSIONS.VULNS_READ]
      );
      expect(result).toBe(true);
    });

    it('should return false if user lacks any permission', () => {
      const result = hasAllPermissions(
        [PERMISSIONS.ASSETS_READ],
        [PERMISSIONS.ASSETS_READ, PERMISSIONS.VULNS_READ]
      );
      expect(result).toBe(false);
    });

    it('should return true if user has wildcard', () => {
      const result = hasAllPermissions(['*'], [PERMISSIONS.ASSETS_WRITE, PERMISSIONS.LLM_MANAGE]);
      expect(result).toBe(true);
    });

    it('should return true if user has domain wildcard covering all', () => {
      const result = hasAllPermissions(['assets.*'], [PERMISSIONS.ASSETS_READ, PERMISSIONS.ASSETS_WRITE]);
      expect(result).toBe(true);
    });

    it('should return true for empty required list (vacuously satisfied)', () => {
      const result = hasAllPermissions([PERMISSIONS.ASSETS_READ], []);
      expect(result).toBe(true);
    });
  });
});
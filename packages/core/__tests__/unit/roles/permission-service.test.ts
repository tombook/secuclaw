import { describe, it, expect } from 'vitest';
import { PermissionService } from '../../../src/roles/permission-service.js';
import { PERMISSIONS } from '../../../src/roles/permissions.js';

describe('PermissionService', () => {
  describe('constructor', () => {
    it('should create service with provided context', () => {
      const service = new PermissionService({
        roleId: 'security-expert',
        permissions: [PERMISSIONS.ASSETS_READ, PERMISSIONS.VULNS_READ],
      });
      expect(service).toBeDefined();
    });
  });

  describe('fromRole', () => {
    it('should create service with permissions from role', () => {
      const service = PermissionService.fromRole('security-expert');
      expect(service.can(PERMISSIONS.VULNS_READ)).toBe(true);
      expect(service.can(PERMISSIONS.VULNS_WRITE)).toBe(true);
    });

    it('should create service with empty permissions for unknown role', () => {
      const service = PermissionService.fromRole('unknown-role');
      expect(service.can(PERMISSIONS.ASSETS_READ)).toBe(false);
    });
  });

  describe('can', () => {
    it('should return true when user has permission', () => {
      const service = new PermissionService({
        roleId: 'security-expert',
        permissions: [PERMISSIONS.ASSETS_READ, PERMISSIONS.VULNS_READ],
      });
      expect(service.can(PERMISSIONS.ASSETS_READ)).toBe(true);
    });

    it('should return false when user lacks permission', () => {
      const service = new PermissionService({
        roleId: 'supply-chain-security',
        permissions: [PERMISSIONS.ASSETS_READ],
      });
      expect(service.can(PERMISSIONS.ASSETS_WRITE)).toBe(false);
    });

    it('should accept array and return true if any matches', () => {
      const service = new PermissionService({
        roleId: 'security-expert',
        permissions: [PERMISSIONS.ASSETS_READ],
      });
      expect(service.can([PERMISSIONS.ASSETS_READ, PERMISSIONS.VULNS_READ])).toBe(true);
    });

    it('should accept wildcard permission', () => {
      const service = new PermissionService({
        roleId: 'admin',
        permissions: ['*'],
      });
      expect(service.can(PERMISSIONS.ASSETS_WRITE)).toBe(true);
      expect(service.can(PERMISSIONS.LLM_MANAGE)).toBe(true);
    });
  });

  describe('canAll', () => {
    it('should return true when user has all permissions', () => {
      const service = new PermissionService({
        roleId: 'security-expert',
        permissions: [PERMISSIONS.ASSETS_READ, PERMISSIONS.VULNS_READ, PERMISSIONS.INCIDENTS_READ],
      });
      expect(service.canAll([PERMISSIONS.ASSETS_READ, PERMISSIONS.VULNS_READ])).toBe(true);
    });

    it('should return false when user lacks any permission', () => {
      const service = new PermissionService({
        roleId: 'security-expert',
        permissions: [PERMISSIONS.ASSETS_READ],
      });
      expect(service.canAll([PERMISSIONS.ASSETS_READ, PERMISSIONS.VULNS_READ])).toBe(false);
    });
  });

  describe('canRead', () => {
    it('should return true for assets.read', () => {
      const service = new PermissionService({
        roleId: 'security-expert',
        permissions: [PERMISSIONS.ASSETS_READ],
      });
      expect(service.canRead('assets')).toBe(true);
    });

    it('should return false when lacking read permission', () => {
      const service = new PermissionService({
        roleId: 'supply-chain-security',
        permissions: [],
      });
      expect(service.canRead('assets')).toBe(false);
    });
  });

  describe('canWrite', () => {
    it('should return true for assets.write', () => {
      const service = new PermissionService({
        roleId: 'security-architect',
        permissions: [PERMISSIONS.ASSETS_WRITE],
      });
      expect(service.canWrite('assets')).toBe(true);
    });

    it('should return false when lacking write permission', () => {
      const service = new PermissionService({
        roleId: 'supply-chain-security',
        permissions: [PERMISSIONS.ASSETS_READ],
      });
      expect(service.canWrite('assets')).toBe(false);
    });
  });

  describe('canDelete', () => {
    it('should return true for assets.delete', () => {
      const service = new PermissionService({
        roleId: 'secuclaw-commander',
        permissions: [PERMISSIONS.ASSETS_DELETE],
      });
      expect(service.canDelete('assets')).toBe(true);
    });

    it('should return false when lacking delete permission', () => {
      const service = new PermissionService({
        roleId: 'security-expert',
        permissions: [PERMISSIONS.ASSETS_READ, PERMISSIONS.ASSETS_WRITE],
      });
      expect(service.canDelete('assets')).toBe(false);
    });
  });

  describe('filterData', () => {
    const mockData = [
      { id: '1', name: 'Asset 1' },
      { id: '2', name: 'Asset 2' },
    ];

    it('should return data when user can read', () => {
      const service = new PermissionService({
        roleId: 'security-expert',
        permissions: [PERMISSIONS.ASSETS_READ],
      });
      const result = service.filterData(mockData, 'assets');
      expect(result).toEqual(mockData);
    });

    it('should return empty array when user cannot read', () => {
      const service = new PermissionService({
        roleId: 'supply-chain-security',
        permissions: [],
      });
      const result = service.filterData(mockData, 'assets');
      expect(result).toEqual([]);
    });
  });

  describe('filterFields', () => {
    const mockData = { id: '1', name: 'Asset 1', secret: 'hidden' };

    it('should return data when user can read', () => {
      const service = new PermissionService({
        roleId: 'security-expert',
        permissions: [PERMISSIONS.ASSETS_READ],
      });
      const result = service.filterFields(mockData, 'assets');
      expect(result).toEqual(mockData);
    });

    it('should return empty object when user cannot read', () => {
      const service = new PermissionService({
        roleId: 'supply-chain-security',
        permissions: [],
      });
      const result = service.filterFields(mockData, 'assets');
      expect(result).toEqual({});
    });
  });
});
import { roleContext } from '../store/role-context.js';
import type { RoleId } from '../store/role-context.js';
import { hasAnyPermission, getRolePermissions } from '../../../../packages/core/src/roles/permissions.js';

type Permission = string;

class PermissionService {
  private getPermissions(): string[] {
    const roleId = roleContext.getState().currentRole;
    if (!roleId) return [];
    return getRolePermissions(roleId);
  }

  can(required: Permission | Permission[]): boolean {
    const permissions = this.getPermissions();
    const requiredList = Array.isArray(required) ? required : [required];
    return hasAnyPermission(permissions, requiredList);
  }

  canAny(required: Permission[]): boolean {
    return this.can(required);
  }

  canAll(required: Permission[]): boolean {
    const permissions = this.getPermissions();
    return required.every(req => {
      if (permissions.includes('*')) return true;
      if (permissions.includes(req)) return true;
      const domain = req.split('.')[0];
      return permissions.includes(`${domain}.*`);
    });
  }

  canRead(resource: string): boolean {
    return this.can(`${resource}.read`);
  }

  canWrite(resource: string): boolean {
    return this.can(`${resource}.write`);
  }

  canDelete(resource: string): boolean {
    return this.can(`${resource}.delete`);
  }

  getCurrentRole(): RoleId | null {
    return roleContext.getState().currentRole;
  }
}

export const permissionService = new PermissionService();

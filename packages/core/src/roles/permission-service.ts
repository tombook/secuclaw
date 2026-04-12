import { hasAnyPermission, hasAllPermissions, getRolePermissions } from './permissions.js';

export interface PermissionContext {
  roleId: string;
  permissions: string[];
  userId?: string;
}

export class PermissionService {
  private roleId: string;
  private permissions: string[];

  constructor(context: PermissionContext) {
    this.roleId = context.roleId;
    this.permissions = context.permissions;
  }

  static fromRole(roleId: string): PermissionService {
    const permissions = getRolePermissions(roleId);
    return new PermissionService({ roleId, permissions });
  }

  can(required: string | string[]): boolean {
    const requiredList = Array.isArray(required) ? required : [required];
    return hasAnyPermission(this.permissions, requiredList);
  }

  canAll(required: string[]): boolean {
    return hasAllPermissions(this.permissions, required);
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

  filterData<T extends Record<string, any>>(data: T[], resource: string): T[] {
    if (!this.canRead(resource)) {
      return [];
    }
    return data;
  }

  filterFields<T extends Record<string, any>>(data: T, resource: string): Partial<T> {
    if (!this.canRead(resource)) {
      return {};
    }
    return data;
  }
}

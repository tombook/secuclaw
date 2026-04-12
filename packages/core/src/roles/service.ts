import 'reflect-metadata';
import { Service } from 'typedi';
import { RolesRepository, type Role, type RoleQueryParams, type User, type UserQueryParams } from './repository.js';

@Service()
export class RolesService {
  constructor(private repo: RolesRepository) {}

  // ==================== Role Methods ====================

  async listRoles(params: RoleQueryParams = {}): Promise<Role[]> {
    return this.repo.queryRoles(params);
  }

  async getRole(id: string): Promise<Role | null> {
    return this.repo.getRoleById(id);
  }

  async getRoleByCode(code: string): Promise<Role | null> {
    return this.repo.getRoleByCode(code);
  }

  async createRole(data: Partial<Role>): Promise<Role> {
    const now = Date.now();
    const role: Role = {
      id: `role_${now}_${Math.random().toString(36).substring(2, 11)}`,
      name: data.name || '',
      code: data.code || '',
      description: data.description,
      permissions: data.permissions || [],
      level: data.level || 0,
      isSystem: false,
      createdAt: now,
      updatedAt: now,
    };
    return this.repo.createRole(role);
  }

  async updateRole(id: string, updates: Partial<Role>): Promise<Role | null> {
    return this.repo.updateRole(id, { ...updates, updatedAt: Date.now() });
  }

  async deleteRole(id: string): Promise<boolean> {
    return this.repo.deleteRole(id);
  }

  async initializeRoles(): Promise<void> {
    return this.repo.initializeDefaultRoles();
  }

  // ==================== User Methods ====================

  async listUsers(params: UserQueryParams = {}): Promise<User[]> {
    return this.repo.queryUsers(params);
  }

  async getUser(id: string): Promise<User | null> {
    return this.repo.getUserById(id);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.repo.getUserByUsername(username);
  }

  async createUser(data: Partial<User>): Promise<User> {
    const now = Date.now();
    const user: User = {
      id: `user_${now}_${Math.random().toString(36).substring(2, 11)}`,
      username: data.username || '',
      email: data.email || '',
      displayName: data.displayName,
      department: data.department,
      title: data.title,
      roleIds: data.roleIds || [],
      status: data.status || 'active',
      createdAt: now,
      updatedAt: now,
    };
    return this.repo.createUser(user);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    return this.repo.updateUser(id, { ...updates, updatedAt: Date.now() });
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.repo.deleteUser(id);
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<User | null> {
    const user = await this.repo.getUserById(userId);
    if (!user) return null;

    if (!user.roleIds.includes(roleId)) {
      user.roleIds.push(roleId);
      return this.repo.updateUser(userId, { roleIds: user.roleIds });
    }
    return user;
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<User | null> {
    const user = await this.repo.getUserById(userId);
    if (!user) return null;

    user.roleIds = user.roleIds.filter(id => id !== roleId);
    return this.repo.updateUser(userId, { roleIds: user.roleIds });
  }

  // ==================== Permission Methods ====================

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    return this.repo.hasPermission(userId, permission);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    return this.repo.getUserPermissions(userId);
  }
}

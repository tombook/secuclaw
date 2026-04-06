/**
 * Roles Repository
 * 角色管理数据访问层
 */

import type { JsonStore } from '../storage/json-store.js';

const FILE_NAME = 'roles.json';

export interface Role {
  id: string;
  name: string;
  code: string;           // 角色代码，如 'security-expert', 'ciso'
  description?: string;
  permissions: string[];   // 权限列表
  level: number;          // 角色级别
  isSystem: boolean;       // 是否为系统角色
  createdAt: number;
  updatedAt: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  department?: string;
  title?: string;
  roleIds: string[];      // 关联的角色
  status: 'active' | 'inactive' | 'disabled';
  lastLogin?: number;
  createdAt: number;
  updatedAt: number;
}

export interface RoleQueryParams {
  code?: string;
  level?: number;
  isSystem?: boolean;
  page?: number;
  pageSize?: number;
}

export interface UserQueryParams {
  roleId?: string;
  department?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export class RolesRepository {
  constructor(private store: JsonStore) {}

  // ==================== Role Methods ====================
  
  async getAllRoles(): Promise<Role[]> {
    return this.store.get<Role[]>(FILE_NAME) || [];
  }

  async getRoleById(id: string): Promise<Role | null> {
    const roles = await this.getAllRoles();
    return roles.find(r => r.id === id) || null;
  }

  async getRoleByCode(code: string): Promise<Role | null> {
    const roles = await this.getAllRoles();
    return roles.find(r => r.code === code) || null;
  }

  async queryRoles(params: RoleQueryParams): Promise<Role[]> {
    let roles = await this.getAllRoles();

    if (params.code) roles = roles.filter(r => r.code === params.code);
    if (params.level !== undefined) roles = roles.filter(r => r.level === params.level);
    if (params.isSystem !== undefined) roles = roles.filter(r => r.isSystem === params.isSystem);

    if (params.page !== undefined && params.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      roles = roles.slice(start, start + params.pageSize);
    }

    return roles;
  }

  async createRole(role: Role): Promise<Role> {
    const roles = await this.getAllRoles();
    roles.push(role);
    await this.store.set(FILE_NAME, roles);
    return role;
  }

  async updateRole(id: string, updates: Partial<Role>): Promise<Role | null> {
    const roles = await this.getAllRoles();
    const index = roles.findIndex(r => r.id === id);
    
    if (index === -1) return null;

    roles[index] = { ...roles[index], ...updates };
    await this.store.set(FILE_NAME, roles);
    return roles[index];
  }

  async deleteRole(id: string): Promise<boolean> {
    const roles = await this.getAllRoles();
    const role = roles.find(r => r.id === id);
    
    if (!role) return false;
    if (role.isSystem) return false; // Cannot delete system roles

    const filtered = roles.filter(r => r.id !== id);
    await this.store.set(FILE_NAME, filtered);
    return true;
  }

  // ==================== User Methods ====================

  private getUsersFileName(): string {
    return 'users.json';
  }

  async getAllUsers(): Promise<User[]> {
    const users = this.store.get<User[]>(this.getUsersFileName());
    return users || [];
  }

  async getUserById(id: string): Promise<User | null> {
    const users = await this.getAllUsers();
    return users.find(u => u.id === id) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const users = await this.getAllUsers();
    return users.find(u => u.username === username) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getAllUsers();
    return users.find(u => u.email === email) || null;
  }

  async queryUsers(params: UserQueryParams): Promise<User[]> {
    let users = await this.getAllUsers();

    if (params.roleId) {
      users = users.filter(u => u.roleIds.includes(params.roleId!));
    }
    if (params.department) users = users.filter(u => u.department === params.department);
    if (params.status) users = users.filter(u => u.status === params.status);

    if (params.page !== undefined && params.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      users = users.slice(start, start + params.pageSize);
    }

    return users;
  }

  async createUser(user: User): Promise<User> {
    const users = await this.getAllUsers();
    users.push(user);
    await this.store.set(this.getUsersFileName(), users);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const users = await this.getAllUsers();
    const index = users.findIndex(u => u.id === id);
    
    if (index === -1) return null;

    users[index] = { ...users[index], ...updates };
    await this.store.set(this.getUsersFileName(), users);
    return users[index];
  }

  async deleteUser(id: string): Promise<boolean> {
    const users = await this.getAllUsers();
    const filtered = users.filter(u => u.id !== id);
    
    if (filtered.length === users.length) return false;

    await this.store.set(this.getUsersFileName(), filtered);
    return true;
  }

  // ==================== Permission Methods ====================

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user || user.status !== 'active') return false;

    for (const roleId of user.roleIds) {
      const role = await this.getRoleById(roleId);
      if (role && role.permissions.includes(permission)) {
        return true;
      }
    }
    return false;
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.getUserById(userId);
    if (!user) return [];

    const permissions = new Set<string>();
    for (const roleId of user.roleIds) {
      const role = await this.getRoleById(roleId);
      if (role) {
        role.permissions.forEach(p => permissions.add(p));
      }
    }
    return Array.from(permissions);
  }

  // ==================== Initialization ====================

  async initializeDefaultRoles(): Promise<void> {
    const roles = (await this.getAllRoles()) || [];
    if (roles.length > 0) return;

    const defaultRoles: Role[] = [
      {
        id: 'role_admin',
        name: '系统管理员',
        code: 'admin',
        description: '系统最高权限管理员',
        permissions: ['*'],
        level: 100,
        isSystem: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'role_ciso',
        name: '首席信息安全官',
        code: 'ciso',
        description: '负责企业安全战略和合规管理',
        permissions: [
          'assets.read', 'assets.write',
          'vulnerabilities.read', 'vulnerabilities.write',
          'incidents.read', 'incidents.write',
          'compliance.read', 'compliance.write',
          'roles.read', 'roles.write',
          'users.read', 'users.write',
          'reports.read', 'reports.write',
        ],
        level: 50,
        isSystem: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'role_security_expert',
        name: '安全专家',
        code: 'security-expert',
        description: '安全技术专家',
        permissions: [
          'assets.read',
          'vulnerabilities.read', 'vulnerabilities.write',
          'incidents.read', 'incidents.write',
          'threats.read',
          'compliance.read',
        ],
        level: 30,
        isSystem: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'role_security_ops',
        name: '安全运维',
        code: 'security-ops',
        description: '安全运维人员',
        permissions: [
          'assets.read', 'assets.write',
          'vulnerabilities.read',
          'incidents.read', 'incidents.write',
          'threats.read',
        ],
        level: 20,
        isSystem: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'role_auditor',
        name: '审计员',
        code: 'auditor',
        description: '安全审计人员',
        permissions: [
          'assets.read',
          'vulnerabilities.read',
          'incidents.read',
          'compliance.read',
          'reports.read',
        ],
        level: 10,
        isSystem: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    await this.store.set(FILE_NAME, defaultRoles);
  }
}

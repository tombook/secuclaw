/**
 * Auth Service - 认证与权限服务
 * 
 * 管理用户认证状态和权限检查
 */
import { gatewayClient } from './gateway-client.js';

// ==================== Types ====================

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  roleIds: string[];
  permissions: string[];
  avatar?: string;
  department?: string;
  title?: string;
  lastLoginAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Role {
  id: string;
  name: string;
  nameCn: string;
  description: string;
  permissions: string[];
  type: 'system' | 'custom';
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  nameCn: string;
  description: string;
  category: string;
}

export type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'unauthenticated';

// ==================== Permission Constants ====================

export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'dashboard.view',
  
  // Incidents
  VIEW_INCIDENTS: 'incidents.view',
  CREATE_INCIDENT: 'incidents.create',
  UPDATE_INCIDENT: 'incidents.update',
  DELETE_INCIDENT: 'incidents.delete',
  
  // Vulnerabilities
  VIEW_VULNERABILITIES: 'vulnerabilities.view',
  UPDATE_VULNERABILITY: 'vulnerabilities.update',
  
  // Threats
  VIEW_THREATS: 'threats.view',
  
  // Compliance
  VIEW_COMPLIANCE: 'compliance.view',
  UPDATE_COMPLIANCE: 'compliance.update',
  
  // Assets
  VIEW_ASSETS: 'assets.view',
  UPDATE_ASSET: 'assets.update',
  
  // Dark Side (黑暗面)
  VIEW_DARK_SIDE: 'dark-side.view',
  CREATE_DARK_SIDE_TASK: 'dark-side.task.create',
  APPROVE_DARK_SIDE_TASK: 'dark-side.task.approve',
  EXECUTE_DARK_SIDE_TASK: 'dark-side.task.execute',
  
  // Knowledge Base
  VIEW_KNOWLEDGE: 'knowledge.view',
  
  // AI Experts
  VIEW_AI_EXPERTS: 'ai-experts.view',
  CONFIGURE_AI_EXPERTS: 'ai-experts.configure',
  
  // Settings
  VIEW_SETTINGS: 'settings.view',
  CONFIGURE_SETTINGS: 'settings.configure',
  
  // Capabilities
  VIEW_CAPABILITIES: 'capabilities.view',
  MANAGE_CAPABILITIES: 'capabilities.manage',
  
  // Admin
  ADMIN_ACCESS: 'admin.access',
  MANAGE_USERS: 'admin.users',
  MANAGE_ROLES: 'admin.roles',
};

// ==================== Auth Service ====================

class AuthService {
  private currentUser: User | null = null;
  private userRoles: Role[] = [];
  private authStatus: AuthStatus = 'idle';
  private listeners: Set<(user: User | null) => void> = new Set();

  // ==================== User Management ====================

  async getCurrentUser(): Promise<User | null> {
    if (this.authStatus === 'checking') {
      return null;
    }
    
    this.authStatus = 'checking';
    
    try {
      const user = await gatewayClient.request<User | null>('auth.getCurrentUser', {});
      
      if (user) {
        this.currentUser = user;
        this.authStatus = 'authenticated';
        await this.loadUserRoles();
      } else {
        this.currentUser = null;
        this.authStatus = 'unauthenticated';
      }
      
      this.notifyListeners();
      return this.currentUser;
    } catch (error) {
      console.error('[AuthService] Failed to get current user:', error);
      this.currentUser = null;
      this.authStatus = 'unauthenticated';
      this.notifyListeners();
      return null;
    }
  }

  async login(username: string, password: string): Promise<User> {
    try {
      const result = await gatewayClient.request<{ user: User }>('auth.login', { username, password });
      
      if (!result?.user) {
        throw new Error('Login failed');
      }
      
      this.currentUser = result.user;
      this.authStatus = 'authenticated';
      await this.loadUserRoles();
      this.notifyListeners();
      
      return this.currentUser;
    } catch (error) {
      console.error('[AuthService] Login failed:', error);
      this.authStatus = 'unauthenticated';
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await gatewayClient.request('auth.logout', {});
    } catch (error) {
      console.error('[AuthService] Logout error:', error);
    } finally {
      this.currentUser = null;
      this.userRoles = [];
      this.authStatus = 'unauthenticated';
      this.notifyListeners();
    }
  }

  // ==================== Role Management ====================

  private async loadUserRoles(): Promise<void> {
    if (!this.currentUser) return;
    
    try {
      this.userRoles = await gatewayClient.request<Role[]>('roles.list', { userId: this.currentUser.id });
    } catch (error) {
      console.error('[AuthService] Failed to load user roles:', error);
      this.userRoles = [];
    }
  }

  async getUserRoles(): Promise<Role[]> {
    if (!this.currentUser) return [];
    
    if (this.userRoles.length === 0) {
      await this.loadUserRoles();
    }
    
    return this.userRoles;
  }

  // ==================== Permission Checking ====================

  async hasPermission(permission: string): Promise<boolean> {
    // Check cached user permissions first
    if (this.currentUser?.permissions?.includes(permission)) {
      return true;
    }
    
    // Check via backend
    if (!this.currentUser) return false;
    
    try {
      const result = await gatewayClient.request<{ hasPermission: boolean }>('auth.hasPermission', {
        userId: this.currentUser.id,
        permission,
      });
      return result?.hasPermission ?? false;
    } catch (error) {
      console.error('[AuthService] Permission check failed:', error);
      return false;
    }
  }

  async hasAnyPermission(permissions: string[]): Promise<boolean> {
    for (const perm of permissions) {
      if (await this.hasPermission(perm)) {
        return true;
      }
    }
    return false;
  }

  async hasAllPermissions(permissions: string[]): Promise<boolean> {
    for (const perm of permissions) {
      if (!(await this.hasPermission(perm))) {
        return false;
      }
    }
    return true;
  }

  // ==================== Role-based Access ====================

  async hasRole(roleId: string): Promise<boolean> {
    return this.userRoles.some(r => r.id === roleId);
  }

  async hasAnyRole(roleIds: string[]): Promise<boolean> {
    for (const roleId of roleIds) {
      if (await this.hasRole(roleId)) {
        return true;
      }
    }
    return false;
  }

  // ==================== Dark Side (黑暗面) Specific ====================

  async canViewDarkSide(): Promise<boolean> {
    return this.hasPermission(PERMISSIONS.VIEW_DARK_SIDE);
  }

  async canApproveDarkSideTask(): Promise<boolean> {
    return this.hasPermission(PERMISSIONS.APPROVE_DARK_SIDE_TASK);
  }

  async canExecuteDarkSideTask(): Promise<boolean> {
    return this.hasPermission(PERMISSIONS.EXECUTE_DARK_SIDE_TASK);
  }

  // ==================== Getters ====================

  getUser(): User | null {
    return this.currentUser;
  }

  getAuthStatus(): AuthStatus {
    return this.authStatus;
  }

  isAuthenticated(): boolean {
    return this.authStatus === 'authenticated' && this.currentUser !== null;
  }

  getUserPermissions(): string[] {
    return this.currentUser?.permissions || [];
  }

  // ==================== Event Handling ====================

  subscribe(callback: (user: User | null) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.currentUser));
  }
}

export const authService = new AuthService();

// ==================== Route Guard Helper ====================

export function createRouteGuard(requiredPermissions: string[] = []) {
  return async (): Promise<boolean> => {
    // Check authentication first
    if (!authService.isAuthenticated()) {
      const user = await authService.getCurrentUser();
      if (!user) {
        // Not logged in, redirect to login
        return false;
      }
    }
    
    // Check permissions if required
    if (requiredPermissions.length > 0) {
      const hasPermission = await authService.hasAnyPermission(requiredPermissions);
      if (!hasPermission) {
        // Permission denied
        return false;
      }
    }
    
    return true;
  };
}

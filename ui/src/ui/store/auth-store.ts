import { BaseStore } from './base-store.js';
import { gatewayClient } from '../gateway-client.js';

export type RoleId = 
  | 'security-expert'
  | 'privacy-officer'
  | 'security-architect'
  | 'business-security-officer'
  | 'secuclaw-commander'
  | 'ciso'
  | 'security-ops'
  | 'supply-chain-security';

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleId;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

// Permission definitions
export const PERMISSIONS = {
  // Dashboard
  'dashboard:view': 'View dashboard',
  
  // Threats
  'threats:view': 'View threats',
  'threats:manage': 'Manage threats',
  
  // Incidents
  'incidents:view': 'View incidents',
  'incidents:manage': 'Manage incidents',
  'incidents:approve': 'Approve incidents',
  
  // Vulnerabilities
  'vulnerabilities:view': 'View vulnerabilities',
  'vulnerabilities:manage': 'Manage vulnerabilities',
  
  // Compliance
  'compliance:view': 'View compliance',
  'compliance:manage': 'Manage compliance',
  
  // Reports
  'reports:view': 'View reports',
  'reports:create': 'Create reports',
  
  // Risk
  'risk:view': 'View risk',
  'risk:manage': 'Manage risk',
  
  // War Room
  'war-room:view': 'View war room',
  'war-room:execute': 'Execute commands',
  
  // AI Experts
  'ai-experts:view': 'View AI experts',
  'ai-experts:configure': 'Configure AI experts',
  
  // Knowledge Base
  'knowledge-base:view': 'View knowledge base',
  'knowledge-base:edit': 'Edit knowledge base',
  
  // Skills Market
  'skills-market:view': 'View skills market',
  'skills-market:install': 'Install skills',
  
  // Channels
  'channels:view': 'View channels',
  'channels:manage': 'Manage channels',
  
  // Settings
  'settings:view': 'View settings',
  'settings:manage': 'Manage settings',
  
  // Capabilities
  'capabilities:view': 'View capabilities',
  'capabilities:execute': 'Execute capabilities',
  'capabilities:approve': 'Approve dark operations',
  
  // Tools
  'tools:baseline:execute': 'Execute baseline checks',
  'tools:vuln-scan:execute': 'Execute vulnerability scans',
  'tools:threat-hunt:execute': 'Execute threat hunting',
  'tools:pentest:execute': 'Execute penetration testing',
} as const;

// Role to permissions mapping
const ROLE_PERMISSIONS: Record<RoleId, string[]> = {
  'security-expert': [
    'dashboard:view',
    'threats:view', 'threats:manage',
    'vulnerabilities:view', 'vulnerabilities:manage',
    'compliance:view',
    'reports:view', 'reports:create',
    'risk:view',
    'capabilities:view', 'capabilities:execute',
    'tools:baseline:execute', 'tools:vuln-scan:execute',
  ],
  'privacy-officer': [
    'dashboard:view',
    'compliance:view', 'compliance:manage',
    'reports:view', 'reports:create',
    'knowledge-base:view',
  ],
  'security-architect': [
    'dashboard:view',
    'threats:view',
    'vulnerabilities:view',
    'compliance:view', 'compliance:manage',
    'reports:view', 'reports:create',
    'risk:view', 'risk:manage',
    'capabilities:view',
    'knowledge-base:view', 'knowledge-base:edit',
  ],
  'business-security-officer': [
    'dashboard:view',
    'risk:view', 'risk:manage',
    'reports:view', 'reports:create',
    'compliance:view',
    'capabilities:view',
  ],
  'secuclaw-commander': [
    'dashboard:view',
    'threats:view', 'threats:manage',
    'incidents:view', 'incidents:manage', 'incidents:approve',
    'vulnerabilities:view', 'vulnerabilities:manage',
    'compliance:view', 'compliance:manage',
    'reports:view', 'reports:create',
    'risk:view', 'risk:manage',
    'war-room:view', 'war-room:execute',
    'capabilities:view', 'capabilities:execute', 'capabilities:approve',
    'tools:baseline:execute', 'tools:vuln-scan:execute', 
    'tools:threat-hunt:execute', 'tools:pentest:execute',
    'settings:view', 'settings:manage',
  ],
  'ciso': [
    'dashboard:view',
    'threats:view',
    'incidents:view',
    'vulnerabilities:view',
    'compliance:view', 'compliance:manage',
    'reports:view', 'reports:create',
    'risk:view', 'risk:manage',
    'capabilities:view',
    'knowledge-base:view',
    'settings:view', 'settings:manage',
  ],
  'security-ops': [
    'dashboard:view',
    'threats:view', 'threats:manage',
    'incidents:view', 'incidents:manage',
    'vulnerabilities:view', 'vulnerabilities:manage',
    'compliance:view',
    'reports:view',
    'risk:view',
    'war-room:view', 'war-room:execute',
    'capabilities:view', 'capabilities:execute',
    'tools:baseline:execute', 'tools:vuln-scan:execute',
  ],
  'supply-chain-security': [
    'dashboard:view',
    'threats:view',
    'compliance:view', 'compliance:manage',
    'reports:view', 'reports:create',
    'capabilities:view',
  ],
};

class AuthStore extends BaseStore<AuthState> {
  constructor() {
    super({
      user: null,
      loading: false,
      isAuthenticated: false,
    });
  }

  async initialize(): Promise<void> {
    // Try to get user from backend
    try {
      const user = await gatewayClient.request<User | null>('auth.getUser');
      if (user) {
        this.setState({ user, isAuthenticated: true });
      }
    } catch {
      // Not authenticated, use default
      this.setDefaultUser();
    }
  }

  private setDefaultUser(): void {
    // Default user for demo purposes
    const defaultUser: User = {
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@secuclaw.local',
      role: 'secuclaw-commander',
      permissions: ROLE_PERMISSIONS['secuclaw-commander'],
    };
    this.setState({ user: defaultUser, isAuthenticated: true });
  }

  async login(role: RoleId): Promise<void> {
    this.setState({ loading: true });
    
    const user: User = {
      id: crypto.randomUUID(),
      name: 'User',
      email: 'user@secuclaw.local',
      role,
      permissions: ROLE_PERMISSIONS[role],
    };
    
    this.setState({ user, loading: false, isAuthenticated: true });
  }

  logout(): void {
    this.setState({ user: null, isAuthenticated: false });
  }

  hasPermission(permission: string): boolean {
    if (!this.state.user) return false;
    return this.state.user.permissions.includes(permission);
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  getUserRole(): RoleId | null {
    return this.state.user?.role || null;
  }

  getRolePermissions(role: RoleId): string[] {
    return ROLE_PERMISSIONS[role] || [];
  }
}

export const authStore = new AuthStore();
export type { User };

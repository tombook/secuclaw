/**
 * SecuClaw Auth Store — Zustand
 *
 * Manages authentication state: user, token, permissions.
 * Migrated from Lit BaseStore pattern to Zustand with persist middleware.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// ── Permission definitions ──
export const PERMISSIONS = {
    'dashboard:view': 'View dashboard',
    'threats:view': 'View threats',
    'threats:manage': 'Manage threats',
    'incidents:view': 'View incidents',
    'incidents:manage': 'Manage incidents',
    'incidents:approve': 'Approve incidents',
    'vulnerabilities:view': 'View vulnerabilities',
    'vulnerabilities:manage': 'Manage vulnerabilities',
    'compliance:view': 'View compliance',
    'compliance:manage': 'Manage compliance',
    'reports:view': 'View reports',
    'reports:create': 'Create reports',
    'risk:view': 'View risk',
    'risk:manage': 'Manage risk',
    'war-room:view': 'View war room',
    'war-room:execute': 'Execute commands',
    'ai-experts:view': 'View AI experts',
    'ai-experts:configure': 'Configure AI experts',
    'knowledge-base:view': 'View knowledge base',
    'knowledge-base:edit': 'Edit knowledge base',
    'skills-market:view': 'View skills market',
    'skills-market:install': 'Install skills',
    'channels:view': 'View channels',
    'channels:manage': 'Manage channels',
    'settings:view': 'View settings',
    'settings:manage': 'Manage settings',
    'capabilities:view': 'View capabilities',
    'capabilities:execute': 'Execute capabilities',
    'capabilities:approve': 'Approve dark operations',
    'tools:baseline:execute': 'Execute baseline checks',
    'tools:vuln-scan:execute': 'Execute vulnerability scans',
    'tools:threat-hunt:execute': 'Execute threat hunting',
    'tools:pentest:execute': 'Execute penetration testing',
};
const ROLE_PERMISSIONS = {
    'security-expert': [
        'dashboard:view', 'threats:view', 'threats:manage', 'vulnerabilities:view', 'vulnerabilities:manage',
        'compliance:view', 'reports:view', 'reports:create', 'risk:view', 'capabilities:view', 'capabilities:execute',
        'tools:baseline:execute', 'tools:vuln-scan:execute',
    ],
    'privacy-officer': [
        'dashboard:view', 'compliance:view', 'compliance:manage', 'reports:view', 'reports:create', 'knowledge-base:view',
    ],
    'security-architect': [
        'dashboard:view', 'threats:view', 'vulnerabilities:view', 'compliance:view', 'compliance:manage',
        'reports:view', 'reports:create', 'risk:view', 'risk:manage', 'capabilities:view',
        'knowledge-base:view', 'knowledge-base:edit',
    ],
    'business-security-officer': [
        'dashboard:view', 'risk:view', 'risk:manage', 'reports:view', 'reports:create',
        'compliance:view', 'capabilities:view',
    ],
    'secuclaw-commander': [
        'dashboard:view', 'threats:view', 'threats:manage', 'incidents:view', 'incidents:manage', 'incidents:approve',
        'vulnerabilities:view', 'vulnerabilities:manage', 'compliance:view', 'compliance:manage',
        'reports:view', 'reports:create', 'risk:view', 'risk:manage', 'war-room:view', 'war-room:execute',
        'capabilities:view', 'capabilities:execute', 'capabilities:approve',
        'tools:baseline:execute', 'tools:vuln-scan:execute', 'tools:threat-hunt:execute', 'tools:pentest:execute',
        'settings:view', 'settings:manage',
    ],
    'ciso': [
        'dashboard:view', 'threats:view', 'incidents:view', 'vulnerabilities:view',
        'compliance:view', 'compliance:manage', 'reports:view', 'reports:create',
        'risk:view', 'risk:manage', 'capabilities:view', 'knowledge-base:view',
        'settings:view', 'settings:manage',
    ],
    'security-ops': [
        'dashboard:view', 'threats:view', 'threats:manage', 'incidents:view', 'incidents:manage',
        'vulnerabilities:view', 'vulnerabilities:manage', 'compliance:view', 'reports:view',
        'risk:view', 'war-room:view', 'war-room:execute', 'capabilities:view', 'capabilities:execute',
        'tools:baseline:execute', 'tools:vuln-scan:execute',
    ],
    'supply-chain-security': [
        'dashboard:view', 'threats:view', 'compliance:view', 'compliance:manage',
        'reports:view', 'reports:create', 'capabilities:view',
    ],
};
export const useAuthStore = create()(persist((set, get) => ({
    // State
    user: null,
    loading: false,
    isAuthenticated: false,
    // Actions
    async login(username, password, wsStore) {
        set({ loading: true });
        try {
            const result = await wsStore.request('auth.login', { username, password });
            if (!result?.token || !result?.user) {
                throw new Error('Invalid login response');
            }
            const mappedRole = mapRoleIds(result.user.roleIds);
            const user = {
                id: result.user.id,
                name: result.user.displayName || result.user.username,
                email: `${result.user.username}@secuclaw.local`,
                role: mappedRole,
                permissions: ROLE_PERMISSIONS[mappedRole],
            };
            wsStore.setAuthToken(result.token);
            localStorage.setItem('secuclaw_auth_token', result.token);
            set({ user, loading: false, isAuthenticated: true });
            return user;
        }
        catch (error) {
            set({ loading: false, isAuthenticated: false });
            throw error;
        }
    },
    logout(wsStore) {
        localStorage.removeItem('secuclaw_auth_token');
        wsStore.setAuthToken(null);
        wsStore.disconnect();
        set({ user: null, isAuthenticated: false });
    },
    hasPermission(permission) {
        return get().user?.permissions.includes(permission) ?? false;
    },
    hasAnyPermission(permissions) {
        return permissions.some((p) => get().hasPermission(p));
    },
    hasAllPermissions(permissions) {
        return permissions.every((p) => get().hasPermission(p));
    },
    getUserRole() {
        return get().user?.role ?? null;
    },
    getRolePermissions(role) {
        return ROLE_PERMISSIONS[role] ?? [];
    },
}), {
    name: 'secuclaw-auth',
    partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
    }),
}));
// ── Helpers ──
function mapRoleIds(roleIds) {
    const roleMap = {
        'role-admin': 'secuclaw-commander',
        'role_admin': 'secuclaw-commander',
        'role-auditor': 'security-ops',
        'role_auditor': 'security-ops',
        'role_ciso': 'ciso',
        'role_security_expert': 'security-expert',
        'role_security_ops': 'security-ops',
        'secuclaw-commander': 'secuclaw-commander',
        'security-expert': 'security-expert',
        'privacy-officer': 'privacy-officer',
        'security-architect': 'security-architect',
        'business-security-officer': 'business-security-officer',
        'ciso': 'ciso',
        'security-ops': 'security-ops',
        'supply-chain-security': 'supply-chain-security',
    };
    for (const rid of roleIds) {
        if (roleMap[rid])
            return roleMap[rid];
    }
    return 'security-ops';
}
//# sourceMappingURL=auth-store.js.map
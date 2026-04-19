/**
 * SecuClaw Auth Store — Zustand
 *
 * Manages authentication state: user, token, permissions.
 * Migrated from Lit BaseStore pattern to Zustand with persist middleware.
 */
import type { RoleId } from '@/config/role-themes';
import type { WebSocketStore } from './websocket';
export interface User {
    id: string;
    name: string;
    email: string;
    role: RoleId;
    permissions: string[];
}
export type PermissionKey = string;
export declare const PERMISSIONS: {
    readonly 'dashboard:view': "View dashboard";
    readonly 'threats:view': "View threats";
    readonly 'threats:manage': "Manage threats";
    readonly 'incidents:view': "View incidents";
    readonly 'incidents:manage': "Manage incidents";
    readonly 'incidents:approve': "Approve incidents";
    readonly 'vulnerabilities:view': "View vulnerabilities";
    readonly 'vulnerabilities:manage': "Manage vulnerabilities";
    readonly 'compliance:view': "View compliance";
    readonly 'compliance:manage': "Manage compliance";
    readonly 'reports:view': "View reports";
    readonly 'reports:create': "Create reports";
    readonly 'risk:view': "View risk";
    readonly 'risk:manage': "Manage risk";
    readonly 'war-room:view': "View war room";
    readonly 'war-room:execute': "Execute commands";
    readonly 'ai-experts:view': "View AI experts";
    readonly 'ai-experts:configure': "Configure AI experts";
    readonly 'knowledge-base:view': "View knowledge base";
    readonly 'knowledge-base:edit': "Edit knowledge base";
    readonly 'skills-market:view': "View skills market";
    readonly 'skills-market:install': "Install skills";
    readonly 'channels:view': "View channels";
    readonly 'channels:manage': "Manage channels";
    readonly 'settings:view': "View settings";
    readonly 'settings:manage': "Manage settings";
    readonly 'capabilities:view': "View capabilities";
    readonly 'capabilities:execute': "Execute capabilities";
    readonly 'capabilities:approve': "Approve dark operations";
    readonly 'tools:baseline:execute': "Execute baseline checks";
    readonly 'tools:vuln-scan:execute': "Execute vulnerability scans";
    readonly 'tools:threat-hunt:execute': "Execute threat hunting";
    readonly 'tools:pentest:execute': "Execute penetration testing";
};
interface AuthState {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
}
interface AuthActions {
    login: (username: string, password: string, wsStore: WebSocketStore) => Promise<User>;
    logout: (wsStore: WebSocketStore) => void;
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
    getUserRole: () => RoleId | null;
    getRolePermissions: (role: RoleId) => string[];
}
export type AuthStore = AuthState & AuthActions;
export declare const useAuthStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AuthStore>, "setState" | "persist"> & {
    setState(partial: AuthStore | Partial<AuthStore> | ((state: AuthStore) => AuthStore | Partial<AuthStore>), replace?: false | undefined): unknown;
    setState(state: AuthStore | ((state: AuthStore) => AuthStore), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AuthStore, {
            user: User | null;
            isAuthenticated: boolean;
        }, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AuthStore) => void) => () => void;
        onFinishHydration: (fn: (state: AuthStore) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AuthStore, {
            user: User | null;
            isAuthenticated: boolean;
        }, unknown>>;
    };
}>;
export {};
//# sourceMappingURL=auth-store.d.ts.map
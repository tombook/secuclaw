/**
 * SecuClaw Role Context Store — Zustand
 *
 * Manages the currently selected security role, its profile, and RACI context.
 * Migrated from Lit BaseStore pattern to Zustand.
 */
import type { RoleId } from '@/config/role-themes';
import type { RaciRole, ScenarioType } from '@/config/raci-matrix';
export interface RoleProfile {
    roleId: RoleId;
    displayName: string;
    emoji: string;
    description: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
    };
}
interface RecentExecution {
    skillId: string;
    timestamp: number;
}
interface RoleContextState {
    currentRole: RoleId | null;
    loading: boolean;
    recentExecutions: RecentExecution[];
    recentRoles: RoleId[];
    warRoomSessionId: string | null;
    currentScenarioType: ScenarioType | null;
    currentRaciAssignment: RaciRole | null;
    isCommanderMode: boolean;
    currentScenario: string | null;
}
interface RoleContextActions {
    setRole: (roleId: RoleId) => void;
    clearRole: () => void;
    getRoleProfile: (roleId: RoleId) => RoleProfile | null;
    getAllRoleIds: () => RoleId[];
    addExecutionToHistory: (skillId: string) => void;
    getRaciAssignments: () => Array<{
        scenario: ScenarioType;
        raciRole: RaciRole;
        scenarioName: string;
    }>;
    setWarRoomSession: (sessionId: string, scenarioType: ScenarioType, raciAssignment: RaciRole) => void;
    clearWarRoomSession: () => void;
    setScenario: (scenario: string | null) => void;
    resetToOverview: () => void;
}
export type RoleContextStore = RoleContextState & RoleContextActions;
export declare const useRoleContextStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<RoleContextStore>, "setState" | "persist"> & {
    setState(partial: RoleContextStore | Partial<RoleContextStore> | ((state: RoleContextStore) => RoleContextStore | Partial<RoleContextStore>), replace?: false | undefined): unknown;
    setState(state: RoleContextStore | ((state: RoleContextStore) => RoleContextStore), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<RoleContextStore, {
            currentRole: RoleId | null;
            recentRoles: RoleId[];
        }, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: RoleContextStore) => void) => () => void;
        onFinishHydration: (fn: (state: RoleContextStore) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<RoleContextStore, {
            currentRole: RoleId | null;
            recentRoles: RoleId[];
        }, unknown>>;
    };
}>;
export {};
//# sourceMappingURL=role-context.d.ts.map
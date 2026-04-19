/**
 * SecuClaw Role Context Store — Zustand
 *
 * Manages the currently selected security role, its profile, and RACI context.
 * Migrated from Lit BaseStore pattern to Zustand.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ROLE_THEMES, applyRoleTheme, clearRoleTheme, ALL_ROLE_IDS } from '@/config/role-themes';
import { RACI_SCENARIOS } from '@/config/raci-matrix';
export const useRoleContextStore = create()(persist((set, get) => ({
    // State
    currentRole: null,
    loading: false,
    recentExecutions: [],
    recentRoles: [],
    warRoomSessionId: null,
    currentScenarioType: null,
    currentRaciAssignment: null,
    isCommanderMode: false,
    currentScenario: null,
    // Actions
    setRole(roleId) {
        set({ loading: true });
        // Apply CSS theme immediately
        applyRoleTheme(roleId);
        // Update recent roles
        const recent = get().recentRoles.filter((r) => r !== roleId);
        recent.unshift(roleId);
        const limited = recent.slice(0, 3);
        set({
            currentRole: roleId,
            loading: false,
            recentRoles: limited,
        });
    },
    clearRole() {
        clearRoleTheme();
        set({
            currentRole: null,
            isCommanderMode: false,
            currentScenario: null,
        });
    },
    getRoleProfile(roleId) {
        const theme = ROLE_THEMES[roleId];
        if (!theme)
            return null;
        return {
            roleId: theme.id,
            displayName: theme.name,
            emoji: theme.icon,
            description: theme.description,
            colors: {
                primary: theme.colors.primary,
                secondary: theme.colors.secondary,
                accent: theme.colors.accent,
            },
        };
    },
    getAllRoleIds() {
        return ALL_ROLE_IDS;
    },
    addExecutionToHistory(skillId) {
        const recent = get().recentExecutions;
        recent.unshift({ skillId, timestamp: Date.now() });
        if (recent.length > 10)
            recent.pop();
        set({ recentExecutions: recent });
    },
    getRaciAssignments() {
        const roleId = get().currentRole;
        if (!roleId)
            return [];
        return RACI_SCENARIOS.map((scenario) => {
            const assignment = scenario.assignments.find((a) => a.role === roleId);
            return {
                scenario: scenario.id,
                raciRole: assignment?.raci ?? 'I',
                scenarioName: scenario.name,
            };
        });
    },
    setWarRoomSession(sessionId, scenarioType, raciAssignment) {
        set({
            warRoomSessionId: sessionId,
            currentScenarioType: scenarioType,
            currentRaciAssignment: raciAssignment,
        });
    },
    clearWarRoomSession() {
        set({
            warRoomSessionId: null,
            currentScenarioType: null,
            currentRaciAssignment: null,
        });
    },
    setScenario(scenario) {
        set({
            currentScenario: scenario,
            isCommanderMode: scenario !== null,
        });
    },
    resetToOverview() {
        set({
            currentScenario: null,
            isCommanderMode: false,
        });
    },
}), {
    name: 'secuclaw-role-context',
    partialize: (state) => ({
        currentRole: state.currentRole,
        recentRoles: state.recentRoles,
    }),
}));
//# sourceMappingURL=role-context.js.map
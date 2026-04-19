/**
 * SecuClaw Role Context Store — Zustand
 *
 * Manages the currently selected security role, its profile, and RACI context.
 * Migrated from Lit BaseStore pattern to Zustand.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RoleId } from '@/config/role-themes';
import { ROLE_THEMES, applyRoleTheme, clearRoleTheme, ALL_ROLE_IDS } from '@/config/role-themes';
import type { RaciRole, ScenarioType } from '@/config/raci-matrix';
import { RACI_SCENARIOS } from '@/config/raci-matrix';

// ── Types ──

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
  timestamp: number; // epoch ms
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
  getRaciAssignments: () => Array<{ scenario: ScenarioType; raciRole: RaciRole; scenarioName: string }>;
  setWarRoomSession: (sessionId: string, scenarioType: ScenarioType, raciAssignment: RaciRole) => void;
  clearWarRoomSession: () => void;
  setScenario: (scenario: string | null) => void;
  resetToOverview: () => void;
}

export type RoleContextStore = RoleContextState & RoleContextActions;

export const useRoleContextStore = create<RoleContextStore>()(
  persist(
    (set, get) => ({
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
      setRole(roleId: RoleId) {
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

      getRoleProfile(roleId: RoleId): RoleProfile | null {
        const theme = ROLE_THEMES[roleId];
        if (!theme) return null;
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

      getAllRoleIds(): RoleId[] {
        return ALL_ROLE_IDS;
      },

      addExecutionToHistory(skillId: string) {
        const recent = get().recentExecutions;
        recent.unshift({ skillId, timestamp: Date.now() });
        if (recent.length > 10) recent.pop();
        set({ recentExecutions: recent });
      },

      getRaciAssignments(): Array<{ scenario: ScenarioType; raciRole: RaciRole; scenarioName: string }> {
        const roleId = get().currentRole;
        if (!roleId) return [];
        return RACI_SCENARIOS.map((scenario) => {
          const assignment = scenario.assignments.find((a) => a.role === roleId);
          return {
            scenario: scenario.id,
            raciRole: assignment?.raci ?? ('I' as RaciRole),
            scenarioName: scenario.name,
          };
        });
      },

      setWarRoomSession(sessionId: string, scenarioType: ScenarioType, raciAssignment: RaciRole) {
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

      setScenario(scenario: string | null) {
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
    }),
    {
      name: 'secuclaw-role-context',
      partialize: (state) => ({
        currentRole: state.currentRole,
        recentRoles: state.recentRoles,
      }),
    }
  )
);

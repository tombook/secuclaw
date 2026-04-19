/**
 * SecuClaw 角色状态管理（Zustand Vanilla Store）
 * 管理当前角色、工具集、指标数据
 * 使用 zustand/vanilla — 不依赖 React
 *
 * @see v2.1 文档 第 4.3 节 状态分层
 */

import { createStore } from 'zustand/vanilla';
import type { RoleId, ToolDef } from '../config/role-tool-config';
import { ROLE_TOOL_CONFIGS, ALL_ROLE_IDS } from '../config/role-tool-config';
import { ROLE_THEMES, type RoleTheme } from '../config/role-theme-config';
import { ROLE_LAYOUTS, type RoleLayout } from '../config/role-layout-config';
import { ROLE_DASHBOARDS, evaluateMetric, type MetricDef, type MetricStatus } from '../config/role-dashboard-config';

// ─── Metric State ─────────────────────────────────────────────

export interface MetricState {
  metric: MetricDef;
  value: number | null;
  status: MetricStatus;
  trend: number[];
  lastUpdated: number;
}

// ─── Store State ──────────────────────────────────────────────

export interface RoleState {
  currentRoleId: RoleId;
  previousRoleId: RoleId | null;
  toolBadges: Record<string, number>;
  metrics: Record<string, MetricState>;

  switchRole: (roleId: RoleId) => void;
  updateToolBadge: (toolId: string, count: number) => void;
  updateMetric: (metricId: string, value: number) => void;
  batchUpdateMetrics: (updates: Record<string, number>) => void;
}

// ─── Internal Helper ──────────────────────────────────────────

function findMetricDef(roleId: RoleId, metricId: string): MetricDef | undefined {
  return ROLE_DASHBOARDS[roleId]?.metrics.find((m) => m.id === metricId);
}

// ─── Persist helper (localStorage) ────────────────────────────

const STORAGE_KEY = 'secuclaw-role-store';

function loadPersisted(): Partial<RoleState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { currentRoleId: parsed.currentRoleId ?? 'secuclaw-commander' };
    }
  } catch { /* ignore */ }
  return {};
}

function persist(state: Partial<RoleState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentRoleId: state.currentRoleId }));
  } catch { /* ignore */ }
}

// ─── Store ────────────────────────────────────────────────────

export const roleStore = createStore<RoleState>()((set, get) => ({
  currentRoleId: loadPersisted().currentRoleId ?? 'secuclaw-commander',
  previousRoleId: null,
  toolBadges: {},
  metrics: {},

  switchRole: (roleId: RoleId) => {
    const { currentRoleId } = get();
    if (roleId === currentRoleId) return;
    const newState = { previousRoleId: currentRoleId, currentRoleId: roleId };
    set(newState);
    persist(get());
  },

  updateToolBadge: (toolId: string, count: number) => {
    set((state) => ({
      toolBadges: { ...state.toolBadges, [toolId]: count },
    }));
  },

  updateMetric: (metricId: string, value: number) => {
    set((state) => {
      const existing = state.metrics[metricId];
      const metricDef = findMetricDef(state.currentRoleId, metricId);
      if (!metricDef) return state;

      const newTrend = existing
        ? [...existing.trend.slice(-29), value]
        : [value];

      return {
        metrics: {
          ...state.metrics,
          [metricId]: {
            metric: metricDef,
            value,
            status: evaluateMetric(metricDef, value),
            trend: newTrend,
            lastUpdated: Date.now(),
          },
        },
      };
    });
  },

  batchUpdateMetrics: (updates: Record<string, number>) => {
    set((state) => {
      const newMetrics = { ...state.metrics };

      for (const [metricId, value] of Object.entries(updates)) {
        const metricDef = findMetricDef(state.currentRoleId, metricId);
        if (!metricDef) continue;

        const existing = newMetrics[metricId];
        const newTrend = existing
          ? [...existing.trend.slice(-29), value]
          : [value];

        newMetrics[metricId] = {
          metric: metricDef,
          value,
          status: evaluateMetric(metricDef, value),
          trend: newTrend,
          lastUpdated: Date.now(),
        };
      }

      return { metrics: newMetrics };
    });
  },
}));

// ─── Selectors ────────────────────────────────────────────────

export const selectCurrentRoleId = () => roleStore.getState().currentRoleId;
export const selectCurrentRoleConfig = () => ROLE_TOOL_CONFIGS[roleStore.getState().currentRoleId];
export const selectCoreTools = (): ToolDef[] => ROLE_TOOL_CONFIGS[roleStore.getState().currentRoleId]?.coreTools ?? [];
export const selectSecondaryTools = (): ToolDef[] => ROLE_TOOL_CONFIGS[roleStore.getState().currentRoleId]?.secondaryTools ?? [];
export const selectCurrentTheme = (): RoleTheme => ROLE_THEMES[roleStore.getState().currentRoleId];
export const selectCurrentLayout = (): RoleLayout => ROLE_LAYOUTS[roleStore.getState().currentRoleId];

export const selectAllRoles = () =>
  ALL_ROLE_IDS.map((id) => ({
    id,
    label: ROLE_TOOL_CONFIGS[id].label,
    theme: ROLE_THEMES[id],
  }));

/**
 * SecuClaw Plugin Store — Zustand vanilla + localStorage 持久化
 * 管理所有插件的状态（注册、启用/禁用、执行计数）
 *
 * 持久化策略：
 * - 自定义/第三方插件的完整 manifest → localStorage
 * - 所有插件的 enabled/disabled 状态 → localStorage
 * - 内置插件不保存完整 manifest（代码里已有），只保存 enabled 状态和 meta 覆盖
 */

import { createStore } from 'zustand/vanilla';
import type { ToolPluginManifest, PluginState, PluginStatus, RoleId, StandardToolResult } from './types';

const STORAGE_KEY = 'secuclaw-plugin-store';

// ─── 持久化数据结构 ───
interface PersistedData {
  /** 自定义/第三方插件的完整 manifest */
  customManifests: Record<string, ToolPluginManifest>;
  /** 内置插件的 meta 覆盖（编辑过的字段） */
  builtinMetaOverrides: Record<string, Partial<ToolPluginManifest['meta']>>;
  /** 所有插件的 enabled 状态 */
  enabledStates: Record<string, boolean>;
  /** 已删除的内置插件 ID（阻止自动注册） */
  deletedIds: string[];
}

function loadPersisted(): PersistedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { customManifests: {}, builtinMetaOverrides: {}, enabledStates: {}, deletedIds: [] };
}

function savePersisted(data: PersistedData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded, ignore */ }
}

export interface PluginStoreState {
  /** 所有已注册的插件（manifest.id → state） */
  plugins: Map<string, PluginState>;

  /** 上次执行结果（toolId → result） */
  lastResults: Map<string, StandardToolResult>;

  /** 正在执行的工具 ID 集合 */
  executing: Set<string>;
}

export interface PluginStoreActions {
  /** 注册一个插件 manifest */
  register(manifest: ToolPluginManifest): void;

  /** 批量注册 */
  registerAll(manifests: ToolPluginManifest[]): void;

  /** 获取插件状态 */
  getPlugin(toolId: string): PluginState | undefined;

  /** 获取 manifest */
  getManifest(toolId: string): ToolPluginManifest | undefined;

  /** 获取所有已注册 manifest */
  getAllManifests(): ToolPluginManifest[];

  /** 按角色获取已启用的工具（按 priority 排序） */
  getToolsByRole(roleId: RoleId, group?: 'core' | 'secondary'): ToolPluginManifest[];

  /** 按分类获取 */
  getToolsByCategory(category: string): ToolPluginManifest[];

  /** 启用/禁用 */
  setEnabled(toolId: string, enabled: boolean): void;

  /** 设置状态 */
  setStatus(toolId: string, status: PluginStatus): void;

  /** 更新插件配置 */
  setConfig(toolId: string, config: Record<string, unknown>): void;

  /** 记录执行结果 */
  setResult(toolId: string, result: StandardToolResult): void;

  /** 标记执行中 */
  setExecuting(toolId: string, executing: boolean): void;

  /** 检查是否正在执行 */
  isExecuting(toolId: string): boolean;

  /** 搜索工具（按名称/描述/分类） */
  search(query: string): ToolPluginManifest[];

  /** 注销（删除）一个插件 */
  unregister(toolId: string): void;

  /** 更新插件 manifest（局部更新 meta） */
  updateManifest(toolId: string, patch: Partial<ToolPluginManifest['meta']>): void;
}

export type PluginStore = PluginStoreState & PluginStoreActions;

// ─── 持久化辅助：在每次 plugins map 变更后调用 ───
function persist(plugins: Map<string, PluginState>) {
  const data: PersistedData = {
    customManifests: {},
    builtinMetaOverrides: {},
    enabledStates: {},
    deletedIds: [],
  };
  for (const [id, p] of plugins) {
    // 1. 记录 enabled 状态（所有非内置）
    if (p.manifest.meta.provider !== 'built-in' || !p.enabled) {
      data.enabledStates[id] = p.enabled;
    }
    // 2. 非内置插件保存完整 manifest
    if (p.manifest.meta.provider !== 'built-in') {
      data.customManifests[id] = p.manifest;
    }
  }
  // 从 localStorage 获取已删除列表
  const prev = loadPersisted();
  data.deletedIds = prev.deletedIds;
  savePersisted(data);
}

export const pluginStore = createStore<PluginStore>()((set, get) => ({
  plugins: new Map(),
  lastResults: new Map(),
  executing: new Set(),

  register(manifest) {
    const plugins = new Map(get().plugins);
    plugins.set(manifest.meta.id, {
      manifest,
      status: 'enabled',
      enabled: true,
      executionCount: 0,
    });
    set({ plugins });
    persist(plugins);
  },

  registerAll(manifests) {
    const plugins = new Map(get().plugins);
    const persisted = loadPersisted();
    for (const m of manifests) {
      // 跳过已删除的内置插件
      if (m.meta.provider === 'built-in' && persisted.deletedIds.includes(m.meta.id)) continue;

      const enabledOverride = persisted.enabledStates[m.meta.id];
      const metaOverride = persisted.builtinMetaOverrides[m.meta.id];

      let finalManifest = m;
      if (metaOverride) {
        finalManifest = { ...m, meta: { ...m.meta, ...metaOverride } };
      }

      plugins.set(m.meta.id, {
        manifest: finalManifest,
        status: enabledOverride !== false ? 'enabled' : 'installed',
        enabled: enabledOverride !== false,
        executionCount: 0,
      });
    }
    // 恢复自定义/第三方插件
    for (const [id, manifest] of Object.entries(persisted.customManifests)) {
      if (!plugins.has(id)) {
        const enabled = persisted.enabledStates[id] !== false;
        plugins.set(id, {
          manifest,
          status: enabled ? 'enabled' : 'installed',
          enabled,
          executionCount: 0,
        });
      }
    }
    set({ plugins });
    persist(plugins);
  },

  getPlugin(toolId) {
    return get().plugins.get(toolId);
  },

  getManifest(toolId) {
    return get().plugins.get(toolId)?.manifest;
  },

  getAllManifests() {
    return Array.from(get().plugins.values())
      .filter(p => p.enabled)
      .map(p => p.manifest);
  },

  getToolsByRole(roleId, group) {
    return Array.from(get().plugins.values())
      .filter(p => p.enabled)
      .filter(p => p.manifest.bindings.roles.some(r => r.roleId === roleId))
      .filter(p => group ? p.manifest.bindings.roles.some(r => r.roleId === roleId && r.group === group) : true)
      .sort((a, b) => {
        const aRole = a.manifest.bindings.roles.find(r => r.roleId === roleId)!;
        const bRole = b.manifest.bindings.roles.find(r => r.roleId === roleId)!;
        return aRole.priority - bRole.priority;
      })
      .map(p => p.manifest);
  },

  getToolsByCategory(category) {
    return get().getAllManifests().filter(m => m.meta.category === category);
  },

  setEnabled(toolId, enabled) {
    const plugins = new Map(get().plugins);
    const p = plugins.get(toolId);
    if (p) {
      plugins.set(toolId, { ...p, enabled, status: enabled ? 'enabled' : 'installed' });
      set({ plugins });
      persist(plugins);
    }
  },

  setStatus(toolId, status) {
    const plugins = new Map(get().plugins);
    const p = plugins.get(toolId);
    if (p) {
      plugins.set(toolId, { ...p, status });
      set({ plugins });
    }
  },

  setConfig(toolId, config) {
    const plugins = new Map(get().plugins);
    const p = plugins.get(toolId);
    if (p) {
      plugins.set(toolId, { ...p, config });
      set({ plugins });
    }
  },

  setResult(toolId, result) {
    const lastResults = new Map(get().lastResults);
    lastResults.set(toolId, result);
    const plugins = new Map(get().plugins);
    const p = plugins.get(toolId);
    if (p) {
      plugins.set(toolId, { ...p, lastExecuted: Date.now(), executionCount: p.executionCount + 1 });
    }
    set({ lastResults, plugins });
  },

  setExecuting(toolId, executing) {
    const s = new Set(get().executing);
    if (executing) s.add(toolId); else s.delete(toolId);
    set({ executing: s });
  },

  isExecuting(toolId) {
    return get().executing.has(toolId);
  },

  search(query) {
    const q = query.toLowerCase();
    return get().getAllManifests().filter(m =>
      m.meta.name.toLowerCase().includes(q) ||
      m.meta.description.toLowerCase().includes(q) ||
      m.meta.category.includes(q)
    );
  },

  unregister(toolId) {
    const plugins = new Map(get().plugins);
    const p = plugins.get(toolId);
    if (p) {
      plugins.delete(toolId);
      set({ plugins });
      // 记录删除（内置插件需要阻止重新注册）
      const data = loadPersisted();
      if (p.manifest.meta.provider === 'built-in') {
        if (!data.deletedIds.includes(toolId)) data.deletedIds.push(toolId);
      }
      // 从自定义列表移除
      delete data.customManifests[toolId];
      delete data.enabledStates[toolId];
      savePersisted(data);
    }
  },

  updateManifest(toolId, patch) {
    const plugins = new Map(get().plugins);
    const p = plugins.get(toolId);
    if (p) {
      const updatedManifest = { ...p.manifest, meta: { ...p.manifest.meta, ...patch, updatedAt: Date.now() } };
      plugins.set(toolId, { ...p, manifest: updatedManifest });
      set({ plugins });

      // 持久化
      const data = loadPersisted();
      if (p.manifest.meta.provider === 'built-in') {
        // 内置插件只保存 meta 覆盖
        data.builtinMetaOverrides[toolId] = { ...data.builtinMetaOverrides[toolId], ...patch };
      } else {
        // 非内置插件保存完整 manifest
        data.customManifests[toolId] = updatedManifest;
      }
      savePersisted(data);
    }
  },
}));

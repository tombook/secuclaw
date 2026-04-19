/**
 * SecuClaw Timeline Store — 事件时间轴持久化
 *
 * 功能：
 * - 人工录入事件（名称、时间、优先级、来源工具）
 * - 自动导入（插件通过 TimelineEventProvider 接口上报风险事件）
 * - 修改时间（原时间不可变，修改时间单独存储，显示"变"标记）
 * - localStorage 持久化
 */

import { createStore } from 'zustand/vanilla';

const STORAGE_KEY = 'secuclaw-timeline-store';

// ─── 事件优先级 ───
export type TimelinePriority = 'P1' | 'P2' | 'P3' | 'INFO';

// ─── 事件来源类型 ───
export type TimelineEventSource = 'manual' | 'auto';

// ─── 事件状态 ───
export type TimelineEventStatus = 'open' | 'completed' | 'closed';

// ─── 时间轴事件 ───
export interface TimelineEvent {
  /** 唯一 ID */
  id: string;
  /** 事件名称 */
  label: string;
  /** 事件详细描述 */
  description: string;
  /** 优先级 */
  priority: TimelinePriority;
  /** 原始记录时间 (ISO 8601, 不可修改) */
  originalTime: string;
  /** 修改后的时间 (ISO 8601, 为空表示未修改) */
  modifiedTime: string | null;
  /** 来源: manual=人工录入, auto=插件自动导入 */
  source: TimelineEventSource;
  /** 状态: open=进行中, completed=已完成, closed=已关闭 */
  status: TimelineEventStatus;
  /** 来源工具 ID (如 threat-model, iam-config) */
  toolId: string | null;
  /** 来源工具名称 (如 "威胁建模 STRIDE") */
  toolName: string | null;
  /** 归属角色 */
  roleId: string;
  /** 创建时间戳 */
  createdAt: number;
  /** 最后更新时间戳 */
  updatedAt: number;
}

// ─── 插件自动导入统一接口 ───
export interface TimelineEventProvider {
  /** 工具 ID */
  toolId: string;
  /** 工具名称 */
  toolName: string;
  /** 该 provider 属于哪些角色（不填则所有角色可见） */
  roleIds?: string[];
  /** 获取该工具的待导入事件 */
  getAutoEvents(): TimelineAutoEvent[];
}

// ─── 插件上报的事件格式（简化版，供插件使用） ───
export interface TimelineAutoEvent {
  /** 事件名称 */
  label: string;
  /** 事件描述 */
  description: string;
  /** 优先级 */
  priority: TimelinePriority;
  /** 事件时间 (ISO 8601) */
  time: string;
}

// ─── Store State ───
export interface TimelineStoreState {
  events: TimelineEvent[];
  /** 已导入的事件指纹（防止重复导入） */
  importedFingerprints: Set<string>;
}

// ─── Store Actions ───
export interface TimelineStoreActions {
  /** 添加事件（人工录入） */
  addEvent(event: Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt' | 'source'>): TimelineEvent;

  /** 批量自动导入（从插件） */
  importFromProvider(provider: TimelineEventProvider, roleId: string): number;

  /** 修改时间（不改变 originalTime，只设 modifiedTime） */
  modifyTime(eventId: string, newTime: string): void;

  /** 删除事件 */
  deleteEvent(eventId: string): void;

  /** 编辑事件（名称、描述、优先级） */
  updateEvent(eventId: string, patch: Partial<Pick<TimelineEvent, 'label' | 'description' | 'priority' | 'status'>>): void;

  /** 获取指定角色的事件（按时间排序） */
  getByRole(roleId: string): TimelineEvent[];

  /** 获取自动导入来源列表 */
  getAutoSources(roleId: string): { toolId: string; toolName: string; eventCount: number }[];

  /** 注册自动导入 provider */
  registerProvider(provider: TimelineEventProvider): void;
}

// ─── Providers 注册表 ───
const providers = new Map<string, TimelineEventProvider>();

function generateId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function fingerprint(event: TimelineAutoEvent, toolId: string): string {
  return `${toolId}:${event.label}:${event.time}`;
}

function persist(state: TimelineStoreState) {
  try {
    const serializable = {
      events: state.events,
      importedFingerprints: Array.from(state.importedFingerprints),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch { /* quota */ }
}

function loadPersisted(): TimelineStoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        events: data.events || [],
        importedFingerprints: new Set(data.importedFingerprints || []),
      };
    }
  } catch { /* ignore */ }
  return { events: [], importedFingerprints: new Set() };
}

export type TimelineStore = TimelineStoreState & TimelineStoreActions;

export const timelineStore = createStore<TimelineStore>()((set, get) => {
  const initial = loadPersisted();

  return {
    events: initial.events,
    importedFingerprints: initial.importedFingerprints,

    addEvent(eventInput) {
      const now = Date.now();
      const event: TimelineEvent = {
        ...eventInput,
        id: generateId(),
        source: 'manual',
        status: eventInput.status || 'open',
        createdAt: now,
        updatedAt: now,
      };
      const events = [...get().events, event];
      set({ events });
      persist(get());
      return event;
    },

    importFromProvider(provider, roleId) {
      const autoEvents = provider.getAutoEvents();
      let imported = 0;
      const events = [...get().events];
      const fingerprints = new Set(get().importedFingerprints);

      for (const ae of autoEvents) {
        const fp = fingerprint(ae, provider.toolId);
        if (fingerprints.has(fp)) continue;

        const now = Date.now();
        events.push({
          id: generateId(),
          label: ae.label,
          description: ae.description,
          priority: ae.priority,
          originalTime: ae.time,
          modifiedTime: null,
          source: 'auto',
          status: 'open',
          toolId: provider.toolId,
          toolName: provider.toolName,
          roleId,
          createdAt: now,
          updatedAt: now,
        });
        fingerprints.add(fp);
        imported++;
      }

      set({ events, importedFingerprints: fingerprints });
      persist(get());
      return imported;
    },

    modifyTime(eventId, newTime) {
      const events = get().events.map(e =>
        e.id === eventId ? { ...e, modifiedTime: newTime, updatedAt: Date.now() } : e
      );
      set({ events });
      persist(get());
    },

    deleteEvent(eventId) {
      const events = get().events.filter(e => e.id !== eventId);
      set({ events });
      persist(get());
    },

    updateEvent(eventId, patch) {
      const events = get().events.map(e =>
        e.id === eventId ? { ...e, ...patch, updatedAt: Date.now() } : e
      );
      set({ events });
      persist(get());
    },

    getByRole(roleId) {
      return get().events
        .filter(e => e.roleId === roleId)
        .sort((a, b) => {
          const ta = a.modifiedTime || a.originalTime;
          const tb = b.modifiedTime || b.originalTime;
          return new Date(ta).getTime() - new Date(tb).getTime();
        });
    },

    getAutoSources(roleId) {
      const roleEvents = get().events.filter(e => e.roleId === roleId && e.source === 'auto');
      const map = new Map<string, { toolId: string; toolName: string; eventCount: number }>();
      for (const e of roleEvents) {
        if (!e.toolId) continue;
        const existing = map.get(e.toolId);
        if (existing) {
          existing.eventCount++;
        } else {
          map.set(e.toolId, { toolId: e.toolId, toolName: e.toolName || e.toolId, eventCount: 1 });
        }
      }
      return Array.from(map.values());
    },
  };
});

// ─── Provider 注册 ───
export function registerTimelineProvider(provider: TimelineEventProvider) {
  providers.set(provider.toolId, provider);
}

export function getTimelineProviders(): TimelineEventProvider[] {
  return Array.from(providers.values());
}

export function runAutoImport(roleId: string): number {
  let total = 0;
  for (const provider of providers.values()) {
    // 只导入属于当前角色的 provider（未声明 roleIds 则所有角色可见）
    if (!provider.roleIds || provider.roleIds.includes(roleId)) {
      total += timelineStore.getState().importFromProvider(provider, roleId);
    }
  }
  return total;
}

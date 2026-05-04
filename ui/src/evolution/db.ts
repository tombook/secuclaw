/**
 * SecuClaw Evolution System — IndexedDB 数据库层
 * 
 * 提供 IndexedDB 的初始化、连接管理和通用工具函数
 * 对标 Hermes 的 SQLite (hermes_state.py) 存储层
 */

import type {
  MemoryEntry,
  EvolvedSkill,
  NudgeState,
  EvolutionLogEntry,
} from './types';

// ─── 数据库名称和版本 ─────────────────────────────────────────

const DB_NAME = 'secuclaw-evolution';
const DB_VERSION = 1;

// ─── Object Store 名称 ───────────────────────────────────────

export const STORES = {
  MEMORIES: 'memories',
  SKILLS: 'skills',
  NUDGE_STATE: 'nudge-state',
  EVOLUTION_LOG: 'evolution-log',
} as const;

// ─── 数据库管理器 ─────────────────────────────────────────────

export class EvolutionDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /** 获取或创建数据库连接（单例模式） */
  async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._open();
    try {
      this.db = await this.initPromise;
      return this.db;
    } finally {
      this.initPromise = null;
    }
  }

  private _open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // memories store
        if (!db.objectStoreNames.contains(STORES.MEMORIES)) {
          const store = db.createObjectStore(STORES.MEMORIES, {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('role', 'role', { unique: false });
          store.createIndex('target', 'target', { unique: false });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('lastUsedAt', 'lastUsedAt', { unique: false });
          store.createIndex('role_target', ['role', 'target'], { unique: false });
        }

        // skills store
        if (!db.objectStoreNames.contains(STORES.SKILLS)) {
          const store = db.createObjectStore(STORES.SKILLS, {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('role', 'role', { unique: false });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('source', 'source', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('role_name', ['role', 'name'], { unique: true });
        }

        // nudge-state store (single record)
        if (!db.objectStoreNames.contains(STORES.NUDGE_STATE)) {
          db.createObjectStore(STORES.NUDGE_STATE, { keyPath: 'id' });
        }

        // evolution-log store
        if (!db.objectStoreNames.contains(STORES.EVOLUTION_LOG)) {
          const store = db.createObjectStore(STORES.EVOLUTION_LOG, {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('role', 'role', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type_role', ['type', 'role'], { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onerror = () => {
        this.initPromise = null;
        reject(request.error);
      };
    });
  }

  /** 关闭数据库连接 */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // ─── 通用 CRUD 工具 ────────────────────────────────────────

  /** 添加记录 */
  async put<T>(storeName: string, record: T): Promise<T> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(record);
      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  }

  /** 按 ID 获取 */
  async getById<T>(storeName: string, id: number): Promise<T | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /** 获取所有记录 */
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /** 按索引查询 */
  async getByIndex<T>(storeName: string, indexName: string, value: IDBValidKey): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /** 删除记录 */
  async delete(storeName: string, id: number): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /** 计数 */
  async count(storeName: string, query?: IDBValidKey | IDBKeyRange): Promise<number> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      let request: IDBRequest<number>;
      if (query !== undefined) {
        request = store.count(query);
      } else {
        request = store.count();
      }
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /** 清空 store */
  async clear(storeName: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// ─── 单例 ────────────────────────────────────────────────────

let _instance: EvolutionDB | null = null;

export function getEvolutionDB(): EvolutionDB {
  if (!_instance) {
    _instance = new EvolutionDB();
  }
  return _instance;
}

// ─── 便捷函数 ─────────────────────────────────────────────────

/** 写入记忆条目 */
export async function putMemory(entry: MemoryEntry): Promise<MemoryEntry> {
  const db = getEvolutionDB();
  return db.put(STORES.MEMORIES, { ...entry, updatedAt: Date.now() });
}

/** 获取指定角色的记忆 */
export async function getMemoriesByRole(role: string, target?: string): Promise<MemoryEntry[]> {
  const db = getEvolutionDB();
  if (target) {
    // 使用复合索引 role_target
    return db.getByIndex(STORES.MEMORIES, 'role_target', [role, target]);
  }
  return db.getByIndex(STORES.MEMORIES, 'role', role);
}

/** 写入技能 */
export async function putSkill(skill: EvolvedSkill): Promise<EvolvedSkill> {
  const db = getEvolutionDB();
  return db.put(STORES.SKILLS, { ...skill, updatedAt: Date.now() });
}

/** 获取指定角色的技能 */
export async function getSkillsByRole(role: string): Promise<EvolvedSkill[]> {
  const db = getEvolutionDB();
  return db.getByIndex(STORES.SKILLS, 'role', role);
}

/** 按名称查找技能 */
export async function getSkillByName(role: string, name: string): Promise<EvolvedSkill | undefined> {
  const db = getEvolutionDB();
  const results = await db.getByIndex<EvolvedSkill>(STORES.SKILLS, 'role_name', [role, name]);
  return results[0];
}

/** 读写 Nudge 状态 */
export async function getNudgeState(): Promise<NudgeState> {
  const db = getEvolutionDB();
  const existing = await db.getById<NudgeState>(STORES.NUDGE_STATE, 'current');
  if (existing) return existing;
  const defaults: NudgeState = {
    id: 'current',
    turnsSinceMemory: 0,
    itersSinceSkill: 0,
    turnsSinceContextCheck: 0,
    lastMemoryReview: 0,
    lastSkillReview: 0,
    lastContextCheck: 0,
  };
  await db.put(STORES.NUDGE_STATE, defaults);
  return defaults;
}

export async function saveNudgeState(state: NudgeState): Promise<void> {
  const db = getEvolutionDB();
  await db.put(STORES.NUDGE_STATE, state);
}

/** 写入进化日志 */
export async function logEvolution(entry: EvolutionLogEntry): Promise<void> {
  const db = getEvolutionDB();
  await db.put(STORES.EVOLUTION_LOG, { ...entry, timestamp: Date.now() });
}

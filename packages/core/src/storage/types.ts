/**
 * 统一存储接口（Phase 14：PostgreSQL 迁移）
 * JsonStore / CachedJsonStore / 未来的 PgStorage 都实现此接口，
 * 使上层 Repository 可以透明切换底层存储后端。
 */
export interface IStorage {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  list(prefix: string): Promise<string[]>;
}

import type { JsonStore } from '../storage/json-store.js';
import type Redis from 'ioredis';

const STORE_KEY = 'token-blacklist.json';
// Redis key 前缀（注意：ioredis 的 keyPrefix 配置不会作用于 eval/exists，
// 需要手动加前缀以保证一致性）
const REDIS_PREFIX = 'token-blacklist:';

interface BlacklistEntry {
  jti: string;
  expiresAt: number;
  revokedAt: number;
}

/**
 * Token 黑名单（支持 JSON 和 Redis 双后端）
 *
 * Redis 模式（推荐，集群部署时使用）：
 * - 每个 jti 一个 key，TTL 自动过期，无需手动清理
 * - isRevoked 为 O(1) 的 EXISTS 操作
 * - 所有实例共享同一黑名单
 *
 * JSON 模式（降级，单实例时使用）：
 * - 全量数组存储在 token-blacklist.json
 * - 需要手动 cleanup 过期项
 */
export class TokenBlacklist {
  private redis: Redis | null;

  constructor(
    private store: JsonStore,
    redis?: Redis | null,
  ) {
    this.redis = redis ?? null;
  }

  /** 设置 Redis 后端（延迟注入，main.ts 中 Redis 就绪后调用） */
  setRedisBackend(redis: Redis): void {
    this.redis = redis;
  }

  async add(jti: string, expiresAt: number): Promise<void> {
    if (this.redis) {
      // Redis 模式：SET key value EX ttl，TTL 自动过期
      const ttlSeconds = Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000));
      await this.redis.set(`${REDIS_PREFIX}${jti}`, String(Date.now()), 'EX', ttlSeconds);
    } else {
      // JSON 模式
      const entries = await this.getAll();
      entries.push({ jti, expiresAt, revokedAt: Date.now() });
      await this.cleanup(entries);
      await this.store.set(STORE_KEY, entries);
    }
  }

  async isRevoked(jti: string): Promise<boolean> {
    if (this.redis) {
      // Redis 模式：EXISTS 操作 O(1)
      const result = await this.redis.exists(`${REDIS_PREFIX}${jti}`);
      return result === 1;
    } else {
      // JSON 模式
      const entries = await this.getAll();
      const now = Date.now();
      return entries.some((e) => e.jti === jti && e.expiresAt > now);
    }
  }

  async cleanup(entries?: BlacklistEntry[]): Promise<void> {
    // Redis 模式无需手动清理（TTL 自动过期）
    if (this.redis) return;

    const list = entries ?? (await this.getAll());
    const now = Date.now();
    const pruned = list.filter((e) => e.expiresAt > now);
    if (pruned.length < list.length) {
      await this.store.set(STORE_KEY, pruned);
    }
  }

  private async getAll(): Promise<BlacklistEntry[]> {
    const data = await this.store.get<BlacklistEntry[]>(STORE_KEY);
    return data ?? [];
  }
}

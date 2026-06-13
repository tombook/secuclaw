/**
 * Redis 分布式锁（Phase 14：集群模式）
 *
 * 基于 Redis SET NX EX + Lua 原子释放实现：
 * - 加锁：SET key value NX EX seconds（原子操作）
 * - 释放：Lua 脚本比对 value 后 DEL（防止误释放他人持有的锁）
 *
 * 未启用 Redis 时自动降级为无锁模式（直接执行回调），
 * 适用于单实例部署——此时不存在并发竞争问题。
 */
import type Redis from 'ioredis';

const logger = {
  warn: (...args: any[]) => console.warn('[DistributedLock]', ...args),
};

// Lua 脚本：原子释放锁（仅当 value 匹配时才 DEL）
const UNLOCK_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
`;

// Lua 脚本：原子续期（仅当 value 匹配时才 EXPIRE）
const RENEW_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("EXPIRE", KEYS[1], ARGV[2])
else
  return 0
end
`;

/** 生成唯一锁持有者标识（防止误释放他人的锁） */
function generateLockId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 尝试获取分布式锁
 * @returns 锁 ID（成功）或 null（已被占用）
 */
export async function acquireLock(
  redis: Redis,
  key: string,
  ttlSeconds = 30,
): Promise<string | null> {
  const lockId = generateLockId();
  // SET key value NX EX ttl — 原子加锁
  const result = await redis.set(key, lockId, 'EX', ttlSeconds, 'NX');
  return result === 'OK' ? lockId : null;
}

/**
 * 释放分布式锁（原子操作，仅持有者可释放）
 * @returns 是否成功释放
 */
export async function releaseLock(
  redis: Redis,
  key: string,
  lockId: string,
): Promise<boolean> {
  const result = await redis.eval(UNLOCK_SCRIPT, 1, key, lockId);
  return result === 1;
}

/**
 * 续期锁（延长 TTL，用于长时间运行的任务）
 * @returns 是否成功续期
 */
export async function renewLock(
  redis: Redis,
  key: string,
  lockId: string,
  ttlSeconds = 30,
): Promise<boolean> {
  const result = await redis.eval(RENEW_SCRIPT, 1, key, lockId, String(ttlSeconds));
  return result === 1;
}

/**
 * 在锁保护下执行函数（自动获取和释放锁）
 *
 * 使用场景：
 * - 定时任务调度（防止多实例重复执行）
 * - 数据迁移脚本（防止并发写入冲突）
 * - 缓存刷新（防止缓存击穿）
 *
 * 未获取到锁时：
 * - throwOnFail=false（默认）：静默跳过，返回 undefined
 * - throwOnFail=true：抛出错误
 *
 * @returns 函数返回值，或 undefined（未获取到锁）
 */
export async function withLock<T>(
  redis: Redis,
  key: string,
  fn: () => Promise<T>,
  options?: {
    ttlSeconds?: number;
    throwOnFail?: boolean;
  },
): Promise<T | undefined> {
  const ttl = options?.ttlSeconds ?? 30;
  const throwOnFail = options?.throwOnFail ?? false;

  const lockId = await acquireLock(redis, key, ttl);

  if (!lockId) {
    if (throwOnFail) {
      throw new Error(`分布式锁获取失败: ${key}（已被其他实例持有）`);
    }
    logger.warn(`锁 ${key} 已被占用，跳过执行`);
    return undefined;
  }

  try {
    return await fn();
  } finally {
    await releaseLock(redis, key, lockId);
  }
}

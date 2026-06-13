/**
 * Redis 客户端单例（Phase 14：集群模式）
 *
 * 使用 ioredis 连接 Redis，提供：
 * 1. 主客户端：用于常规操作（分布式锁、token 黑名单、缓存等）
 * 2. 订阅客户端：专用于 pub/sub 订阅（ioredis 限制：subscribe 后不能发其他命令）
 *
 * 未配置 REDIS_URL 时所有方法返回 null/false，应用降级为单机模式
 */
import Redis from 'ioredis';

const logger = {
  info: (...args: any[]) => console.log('[Redis]', ...args),
  error: (...args: any[]) => console.error('[Redis]', ...args),
  warn: (...args: any[]) => console.warn('[Redis]', ...args),
};

// 开发环境挂到全局，避免 Bun --watch 热重载创建多个连接
const globalForRedis = globalThis as unknown as {
  __secuclawRedis?: Redis;
  __secuclawRedisSub?: Redis;
};

let redisInstance: Redis | null = null;
let redisSubscriber: Redis | null = null;

/**
 * 初始化 Redis 客户端（主 + 订阅）
 * 在 main.ts 启动时调用，REDIS_URL 为空时跳过
 * @returns 主客户端实例，或 null 表示未配置
 */
export function initRedis(
  url: string,
  keyPrefix = 'secuclaw:',
): Redis | null {
  if (!url) return null;
  if (redisInstance) return redisInstance;

  // 复用全局实例（热重载安全）
  if (globalForRedis.__secuclawRedis) {
    redisInstance = globalForRedis.__secuclawRedis;
    redisSubscriber = globalForRedis.__secuclawRedisSub ?? null;
    return redisInstance;
  }

  // 创建主客户端：keyPrefix 自动加到所有 SET/GET 等命令的 key 前面
  redisInstance = new Redis(url, {
    keyPrefix,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times) => Math.min(times * 200, 2000),
    lazyConnect: false,
  });

  // 创建订阅客户端：不加 keyPrefix（pub/sub channel 不走前缀）
  redisSubscriber = new Redis(url, {
    maxRetriesPerRequest: null, // 订阅模式不限制重试
    enableReadyCheck: true,
    retryStrategy: (times) => Math.min(times * 200, 2000),
    lazyConnect: false,
  });

  // 错误处理（不 crash 进程）
  redisInstance.on('error', (err) => {
    logger.error('主客户端错误:', err.message);
  });
  redisSubscriber.on('error', (err) => {
    logger.error('订阅客户端错误:', err.message);
  });

  redisInstance.on('connect', () => logger.info('主客户端已连接'));
  redisSubscriber.on('connect', () => logger.info('订阅客户端已连接'));

  if (process.env.NODE_ENV !== 'production') {
    globalForRedis.__secuclawRedis = redisInstance;
    globalForRedis.__secuclawRedisSub = redisSubscriber;
  }

  return redisInstance;
}

/** 获取已初始化的 Redis 主客户端 */
export function getRedis(): Redis | null {
  return redisInstance ?? globalForRedis.__secuclawRedis ?? null;
}

/** 获取已初始化的 Redis 订阅客户端 */
export function getRedisSubscriber(): Redis | null {
  return redisSubscriber ?? globalForRedis.__secuclawRedisSub ?? null;
}

/** Redis 是否已初始化 */
export function isRedisEnabled(): boolean {
  return redisInstance !== null || globalForRedis.__secuclawRedis !== undefined;
}

/** 优雅断开 Redis 连接 */
export async function disconnectRedis(): Promise<void> {
  const tasks: Promise<void>[] = [];
  if (redisInstance) {
    tasks.push(redisInstance.quit().then(() => undefined));
    redisInstance = null;
  }
  if (redisSubscriber) {
    tasks.push(redisSubscriber.quit().then(() => undefined));
    redisSubscriber = null;
  }
  await Promise.all(tasks);

  if (globalForRedis.__secuclawRedis) delete globalForRedis.__secuclawRedis;
  if (globalForRedis.__secuclawRedisSub) delete globalForRedis.__secuclawRedisSub;
}

/** Redis 健康检查 */
export async function checkRedisHealth(): Promise<{
  connected: boolean;
  latencyMs?: number;
}> {
  const redis = getRedis();
  if (!redis) return { connected: false };
  try {
    const start = Date.now();
    await redis.ping();
    return { connected: true, latencyMs: Date.now() - start };
  } catch {
    return { connected: false };
  }
}

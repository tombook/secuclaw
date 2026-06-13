// Phase 14：PostgreSQL 迁移 - Prisma 客户端单例
// 使用 @prisma/adapter-pg driver adapter 连接 PostgreSQL（Prisma 7 架构）
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

// 开发环境下挂到全局，避免 Bun --watch 热重载创建多个连接
const globalForPrisma = globalThis as unknown as {
  __secuclawPrisma?: PrismaClient;
};

let prismaInstance: PrismaClient | null = null;

/**
 * 初始化 Prisma 客户端
 * 在 main.ts 启动时调用，当 DATABASE_URL 为空时跳过（未启用 PG）
 * @returns PrismaClient 实例，或 null 表示未配置数据库
 */
export function initPrisma(connectionString: string, poolMax = 10): PrismaClient | null {
  // 未配置连接字符串时跳过初始化，应用继续用 JSON 文件存储
  if (!connectionString) return null;
  if (prismaInstance) return prismaInstance;
  if (globalForPrisma.__secuclawPrisma) {
    prismaInstance = globalForPrisma.__secuclawPrisma;
    return prismaInstance;
  }

  // PrismaPg 接受 pg.PoolConfig（属性扁平：connectionString + max 等）
  const adapter = new PrismaPg({ connectionString, max: poolMax });
  prismaInstance = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.__secuclawPrisma = prismaInstance;
  }

  return prismaInstance;
}

/** 获取已初始化的 Prisma 客户端，未初始化返回 null */
export function getPrisma(): PrismaClient | null {
  return prismaInstance ?? globalForPrisma.__secuclawPrisma ?? null;
}

/** Prisma 是否已初始化（用于判断是否启用了 PG 模式） */
export function isPrismaEnabled(): boolean {
  return prismaInstance !== null || globalForPrisma.__secuclawPrisma !== undefined;
}

/** 优雅断开数据库连接，在应用关闭时调用 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
    if (globalForPrisma.__secuclawPrisma) {
      delete globalForPrisma.__secuclawPrisma;
    }
  }
}

/** 数据库健康检查（用于 /health 端点扩展） */
export async function checkDatabaseHealth(): Promise<{ connected: boolean; latencyMs?: number }> {
  const prisma = getPrisma();
  if (!prisma) return { connected: false };
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true, latencyMs: Date.now() - start };
  } catch {
    return { connected: false };
  }
}

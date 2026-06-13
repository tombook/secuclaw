/**
 * DualWriteStorage — 双写存储代理（Phase 14：渐进式 PostgreSQL 迁移）
 *
 * 设计原则：
 * 1. 零侵入：包装在 main.ts 的存储初始化处，所有 Repository 无需修改即可获得双写能力
 * 2. 安全优先：写操作先写 primary（JSON），成功后再写 secondary（PG）
 *    PG 写失败只记录日志，不阻塞 JSON 写入，保证主路径可用
 * 3. 读路径可切换：默认从 JSON 读（安全模式），数据校验通过后可运行时切换到 PG 读
 * 4. 兼容降级：secondary 为 null（未启用 PG）时，完全透传到 primary
 */
import type { IStorage } from './types.js';

const logger = {
  info: (...args: any[]) => console.log('[DualWrite]', ...args),
  error: (...args: any[]) => console.error('[DualWrite]', ...args),
  warn: (...args: any[]) => console.warn('[DualWrite]', ...args),
};

/** 读路径来源：决定从哪个存储后端读取数据 */
export type ReadSource = 'primary' | 'secondary';

export interface DualWriteOptions {
  /** 是否启用双写（false 时仅写 primary） */
  enabled: boolean;
  /** 读路径来源，默认 primary（JSON）以确保安全 */
  readSource: ReadSource;
}

export class DualWriteStorage implements IStorage {
  private readSource: ReadSource;
  private dualWriteEnabled: boolean;
  private secondary: IStorage | null;

  // 统计计数器，用于监控双写一致性
  private stats = {
    primaryWrites: 0,
    secondaryWrites: 0,
    secondaryWriteFailures: 0,
    readFromPrimary: 0,
    readFromSecondary: 0,
  };

  constructor(
    private primary: IStorage,
    secondary: IStorage | null,
    options?: Partial<DualWriteOptions>,
  ) {
    this.secondary = secondary;
    this.dualWriteEnabled = options?.enabled ?? true;
    this.readSource = options?.readSource ?? 'primary';

    // 未启用 PG（secondary 为 null）时自动禁用双写
    if (!secondary) {
      this.dualWriteEnabled = false;
      this.readSource = 'primary';
    }

    logger.info(
      `初始化: dualWrite=${this.dualWriteEnabled}, readSource=${this.readSource}, ` +
        `hasSecondary=${secondary !== null}`,
    );
  }

  // ============================================
  // 读操作：根据 readSource 决定来源
  // ============================================

  async get<T = unknown>(key: string): Promise<T | null> {
    if (this.readSource === 'secondary' && this.secondary) {
      this.stats.readFromSecondary++;
      const data = await this.secondary.get<T>(key);
      // PG 未映射的 key 会返回 null，此时回退到 primary
      if (data !== null) return data;
    }
    this.stats.readFromPrimary++;
    return this.primary.get<T>(key);
  }

  async exists(key: string): Promise<boolean> {
    if (this.readSource === 'secondary' && this.secondary) {
      const exists = await this.secondary.exists(key);
      if (exists) return true;
    }
    return this.primary.exists(key);
  }

  async list(prefix: string): Promise<string[]> {
    if (this.readSource === 'secondary' && this.secondary) {
      const keys = await this.secondary.list(prefix);
      if (keys.length > 0) return keys;
    }
    return this.primary.list(prefix);
  }

  // ============================================
  // 写操作：先写 primary，再写 secondary（失败不阻塞）
  // ============================================

  async set<T = unknown>(key: string, value: T): Promise<void> {
    // Step 1: 先写 primary（JSON），确保主路径数据安全
    await this.primary.set(key, value);
    this.stats.primaryWrites++;

    // Step 2: 双写 secondary（PG），失败只记录不抛出
    if (this.dualWriteEnabled && this.secondary) {
      try {
        await this.secondary.set(key, value);
        this.stats.secondaryWrites++;
      } catch (error) {
        this.stats.secondaryWriteFailures++;
        logger.error(
          `双写 PG 失败（JSON 已写入成功）: key=${key}, ` +
            `error=${error instanceof Error ? error.message : String(error)}`,
        );
        // 不抛出：保证 JSON 主路径数据一致性
      }
    }
  }

  async delete(key: string): Promise<boolean> {
    // 先删 primary，再删 secondary
    const primaryResult = await this.primary.delete(key);

    if (this.dualWriteEnabled && this.secondary) {
      try {
        await this.secondary.delete(key);
      } catch (error) {
        logger.error(
          `双写删除 PG 失败: key=${key}, ` +
            `error=${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return primaryResult;
  }

  // ============================================
  // 运行时切换方法（迁移过程中使用）
  // ============================================

  /**
   * 切换读路径来源
   * 使用场景：数据校验通过后，从 'primary' 切到 'secondary' 以读取 PG 数据
   */
  setReadSource(source: ReadSource): void {
    if (source === 'secondary' && !this.secondary) {
      logger.warn('无法切换到 secondary 读路径：PG 存储未启用');
      return;
    }
    logger.info(`读路径切换: ${this.readSource} → ${source}`);
    this.readSource = source;
  }

  /** 获取当前读路径来源 */
  getReadSource(): ReadSource {
    return this.readSource;
  }

  /** 动态启用/禁用双写 */
  setDualWriteEnabled(enabled: boolean): void {
    if (enabled && !this.secondary) {
      logger.warn('无法启用双写：PG 存储未配置');
      return;
    }
    logger.info(`双写开关: ${this.dualWriteEnabled} → ${enabled}`);
    this.dualWriteEnabled = enabled;
  }

  /**
   * 延迟注入 PG 存储后端
   * 使用场景：main.ts constructor 中创建 DualWriteStorage（secondary=null），
   * initialize() 中 Prisma 就绪后注入 PgStorage
   */
  setSecondary(storage: IStorage, options?: Partial<DualWriteOptions>): void {
    this.secondary = storage;
    this.dualWriteEnabled = options?.enabled ?? true;
    this.readSource = options?.readSource ?? this.readSource;
    logger.info(
      `注入 PG 后端: dualWrite=${this.dualWriteEnabled}, readSource=${this.readSource}`,
    );
  }

  /** 双写是否启用 */
  isDualWriteEnabled(): boolean {
    return this.dualWriteEnabled;
  }

  /**
   * 获取双写一致性统计，用于监控和迁移进度评估
   */
  getStats() {
    return { ...this.stats, readSource: this.readSource };
  }

  /**
   * 对比 primary 和 secondary 中的数据一致性
   * 用于迁移验证阶段，检查 JSON 与 PG 数据是否同步
   * @returns 一致则返回 null，不一致则返回差异信息
   */
  async verifyConsistency(key: string): Promise<{
    consistent: boolean;
    primaryCount?: number;
    secondaryCount?: number;
  } | null> {
    if (!this.secondary) return null;

    const primaryData = await this.primary.get<unknown[]>(key);
    const secondaryData = await this.secondary.get<unknown[]>(key);

    const primaryCount = Array.isArray(primaryData) ? primaryData.length : primaryData ? 1 : 0;
    const secondaryCount = Array.isArray(secondaryData)
      ? secondaryData.length
      : secondaryData
        ? 1
        : 0;

    return {
      consistent: primaryCount === secondaryCount,
      primaryCount,
      secondaryCount,
    };
  }
}

/**
 * PgStorage — PostgreSQL 存储后端（Phase 14：性能优化）
 *
 * 实现 IStorage 接口，将 JSON 文件存储的"单文件集合"模式映射到 PostgreSQL 表。
 * 设计依据：所有核心 Repository 均使用 {collection}.json 存储完整数组，
 * 因此 set() 采用 deleteMany + createMany 全量替换，get() 采用 findMany + 提取 data 列。
 *
 * 强类型字段仅用于查询优化和索引，完整文档始终保存在 data Json 列中。
 * 若提取失败则存储 null，不影响数据完整性。
 */
import type { PrismaClient } from '../generated/prisma/client.js';
import type { IStorage } from './types.js';

const logger = {
  info: (...args: any[]) => console.log('[PgStorage]', ...args),
  error: (...args: any[]) => console.error('[PgStorage]', ...args),
  warn: (...args: any[]) => console.warn('[PgStorage]', ...args),
};

// ============================================
// Prisma Model Delegate 最小化类型（避免引入完整 Prisma 类型约束）
// ============================================
interface ModelDelegate {
  findMany(args?: object): Promise<Array<Record<string, unknown>>>;
  deleteMany(args?: object): Promise<{ count: number }>;
  createMany(args: { data: ReadonlyArray<Record<string, unknown>> }): Promise<{ count: number }>;
  count(args?: object): Promise<number>;
}

// ============================================
// epoch ms → DateTime 工具函数
// ============================================
function toDate(epochMs?: number | null): Date | null {
  if (!epochMs || typeof epochMs !== 'number') return null;
  return new Date(epochMs);
}

// ============================================
// 字段提取器：从原始 JSON 文档提取强类型字段
// 约定：提取失败返回 null，data 列始终保存完整文档
// ============================================
type Extractor = (item: Record<string, any>) => Record<string, unknown>;

// 实际数据为扁平结构（name/type/category/environment/status 在顶层），
// criticality 和 owner 在 business 嵌套对象中，exposureLevel 在 security 中
const extractAsset: Extractor = (item) => ({
  id: String(item.id ?? ''),
  name: String(item.name ?? 'unnamed'),
  type: item.type ?? null,
  category: item.category ?? null,
  environment: item.environment ?? null,
  criticality: item.business?.criticality ?? null,
  owner: item.business?.owner ?? null,
  status: item.status ?? null,
  exposureLevel: item.security?.exposureLevel ?? null,
  createdAt: toDate(item.createdAt),
  updatedAt: toDate(item.updatedAt),
  data: item as object,
});

const extractVulnerability: Extractor = (item) => ({
  id: String(item.id ?? ''),
  cveId: item.info?.cveId ?? null,
  title: item.info?.title ?? null,
  severity: item.info?.cvss?.severity ?? null,
  status: item.remediation?.status ?? null,
  priority: item.remediation?.priority ?? null,
  cvssScore: item.info?.cvss?.score ?? null,
  createdAt: toDate(item.createdAt),
  updatedAt: toDate(item.updatedAt),
  data: item as object,
});

const extractIncident: Extractor = (item) => ({
  id: String(item.id ?? ''),
  ticketId: item.ticketId ?? null,
  title: item.info?.title ?? null,
  severity: item.info?.severity ?? null,
  status: item.workflow?.status ?? null,
  category: item.info?.category ?? null,
  assignee: item.workflow?.assignee ?? null,
  createdAt: toDate(item.createdAt),
  updatedAt: toDate(item.updatedAt),
  data: item as object,
});

const extractThreat: Extractor = (item) => ({
  id: String(item.id ?? ''),
  name: String(item.name ?? 'unknown'),
  type: item.type ?? null,
  data: item as object,
});

const extractRole: Extractor = (item) => ({
  id: String(item.id ?? ''),
  name: String(item.name ?? 'unnamed'),
  code: item.code ?? null,
  level: item.level ?? null,
  isSystem: Boolean(item.isSystem),
  data: item as object,
});

const extractUser: Extractor = (item) => ({
  id: String(item.id ?? ''),
  username: String(item.username ?? 'unknown'),
  email: item.email ?? null,
  displayName: item.displayName ?? null,
  department: item.department ?? null,
  status: item.status ?? null,
  createdAt: toDate(item.createdAt),
  updatedAt: toDate(item.updatedAt),
  data: item as object,
});

const extractTask: Extractor = (item) => ({
  id: String(item.id ?? ''),
  name: item.name ?? null,
  status: item.status ?? null,
  priority: item.priority ?? null,
  ownerId: item.ownerId ?? null,
  assigneeId: item.assigneeId ?? null,
  createdAt: toDate(item.createdAt),
  updatedAt: toDate(item.updatedAt),
  data: item as object,
});

// 实际数据为扁平结构：framework/controlId/title/status/category 在顶层
const extractCompliance: Extractor = (item) => ({
  id: String(item.id ?? ''),
  framework: item.framework ?? null,
  controlId: item.controlId ?? null,
  title: item.title ?? null,
  status: item.status ?? null,
  category: item.category ?? null,
  lastAuditDate: toDate(item.lastAuditDate),
  nextAuditDate: toDate(item.nextAuditDate),
  data: item as object,
});

const extractAuditLog: Extractor = (item) => ({
  id: String(item.id ?? ''),
  action: item.action ?? null,
  resource: item.resource ?? null,
  resourceId: item.resourceId ?? null,
  actor: item.actor ?? null,
  timestamp: toDate(item.timestamp),
  data: item as object,
});

// ============================================
// Key → Prisma Model 映射配置表
// ============================================
interface ModelConfig {
  delegate: (p: PrismaClient) => ModelDelegate;
  extract: Extractor;
}

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'assets.json': {
    delegate: (p) => p.asset as unknown as ModelDelegate,
    extract: extractAsset,
  },
  'vulnerabilities.json': {
    delegate: (p) => p.vulnerability as unknown as ModelDelegate,
    extract: extractVulnerability,
  },
  'incidents.json': {
    delegate: (p) => p.incident as unknown as ModelDelegate,
    extract: extractIncident,
  },
  'threats.json': {
    delegate: (p) => p.threat as unknown as ModelDelegate,
    extract: extractThreat,
  },
  'roles.json': {
    delegate: (p) => p.role as unknown as ModelDelegate,
    extract: extractRole,
  },
  'users.json': {
    delegate: (p) => p.user as unknown as ModelDelegate,
    extract: extractUser,
  },
  'tasks.json': {
    delegate: (p) => p.task as unknown as ModelDelegate,
    extract: extractTask,
  },
  'compliance.json': {
    delegate: (p) => p.compliance as unknown as ModelDelegate,
    extract: extractCompliance,
  },
  'audit-logs.json': {
    delegate: (p) => p.auditLog as unknown as ModelDelegate,
    extract: extractAuditLog,
  },
};

// ============================================
// PgStorage 主类
// ============================================
export class PgStorage implements IStorage {
  constructor(private prisma: PrismaClient) {}

  /**
   * 读取集合：返回 data 列组成的数组（与 JSON 文件格式完全兼容）
   * 未映射的 key 返回 null，由 DualWriteStorage 回退到 JSON 存储
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    const config = MODEL_CONFIGS[key];
    if (!config) return null;

    try {
      const rows = await config.delegate(this.prisma).findMany();
      return rows.map((r) => r.data) as T;
    } catch (error) {
      logger.error(`get 失败: ${key}`, error);
      return null;
    }
  }

  /**
   * 全量替换集合：deleteMany + createMany（事务保证原子性）
   * 与 JsonStore 的"整体覆盖写"语义一致
   */
  async set<T = unknown>(key: string, value: T): Promise<void> {
    const config = MODEL_CONFIGS[key];
    if (!config) return; // 未映射的 key 静默跳过（仅写 JSON）

    const items = Array.isArray(value) ? (value as Record<string, any>[]) : [];
    const rows = items.map((item) => config.extract(item));

    try {
      // 使用回调式事务：deleteMany + createMany 在同一事务中执行
      // tx 是 PrismaClient 的 Omit 子集（去除 $connect/$disconnect 等），
      // 但保留了所有 model delegate，可安全转换
      await this.prisma.$transaction(async (tx) => {
        const txDelegate = config.delegate(tx as unknown as PrismaClient);
        await txDelegate.deleteMany();
        if (rows.length > 0) {
          await txDelegate.createMany({ data: rows });
        }
      });
    } catch (error) {
      logger.error(`set 失败: ${key}（${rows.length} 行）`, error);
      throw error; // 向上抛出，让 DualWriteStorage 记录但不阻塞主写路径
    }
  }

  /** 删除整个集合（清空表，不删表结构） */
  async delete(key: string): Promise<boolean> {
    const config = MODEL_CONFIGS[key];
    if (!config) return false;

    try {
      await config.delegate(this.prisma).deleteMany();
      return true;
    } catch (error) {
      logger.error(`delete 失败: ${key}`, error);
      return false;
    }
  }

  /** 检查集合是否有数据 */
  async exists(key: string): Promise<boolean> {
    const config = MODEL_CONFIGS[key];
    if (!config) return false;

    try {
      const count = await config.delegate(this.prisma).count();
      return count > 0;
    } catch (error) {
      logger.error(`exists 检查失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 列出前缀下的所有 key（模拟 JsonStore 的 readdir 语义）
   * 注意：当前所有 Repository 均未使用此方法（list(prefix) 是死代码）
   * 这里返回已映射 key 的列表，供调试/迁移脚本使用
   */
  async list(prefix: string): Promise<string[]> {
    return Object.keys(MODEL_CONFIGS).filter((k) => k.startsWith(prefix));
  }
}

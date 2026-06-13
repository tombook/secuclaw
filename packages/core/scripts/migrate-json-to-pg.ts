/**
 * JSON → PostgreSQL 数据迁移脚本（Phase 14）
 *
 * 用法：
 *   pnpm db:migrate-data
 *   或：npx tsx scripts/migrate-json-to-pg.ts
 *
 * 特性：
 * - 幂等：可安全重复执行（PgStorage.set 使用 deleteMany + createMany 全量替换）
 * - 可选 --dry-run：仅输出预览，不实际写入
 * - 可选 --verify：迁移后对比 JSON 与 PG 记录数
 *
 * 环境变量：
 * - DATABASE_URL：PostgreSQL 连接串（必填）
 * - DATA_PATH：JSON 数据根目录（默认 ./data）
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PgStorage } from '../src/storage/pg-storage.js';

// 迁移目标：9 个核心业务集合
const COLLECTIONS = [
  'assets.json',
  'vulnerabilities.json',
  'incidents.json',
  'threats.json',
  'roles.json',
  'users.json',
  'tasks.json',
  'compliance.json',
  'audit-logs.json',
] as const;

interface MigrationResult {
  collection: string;
  jsonCount: number;
  pgCount: number;
  status: 'success' | 'skipped' | 'error';
  error?: string;
  durationMs: number;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verify = args.includes('--verify');

  const dbUrl = process.env.DATABASE_URL;
  const dataPath = process.env.DATA_PATH ?? './data';
  const storagePath = join(dataPath, 'storage');

  if (!dbUrl) {
    console.error('[MIGRATE] 错误：DATABASE_URL 未设置');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('SecuClaw JSON → PostgreSQL 数据迁移');
  console.log(`存储路径: ${storagePath}`);
  console.log(`数据库: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`模式: ${dryRun ? 'DRY RUN（预览）' : '实际写入'}`);
  console.log(`验证: ${verify ? '启用' : '禁用'}`);
  console.log('='.repeat(60));

  // 初始化 Prisma
  const adapter = new PrismaPg({ connectionString: dbUrl, max: 5 });
  const prisma = new PrismaClient({ adapter });
  const pgStorage = new PgStorage(prisma);

  const results: MigrationResult[] = [];

  for (const collection of COLLECTIONS) {
    const startTime = Date.now();
    const result: MigrationResult = {
      collection,
      jsonCount: 0,
      pgCount: 0,
      status: 'success',
      durationMs: 0,
    };

    try {
      // Step 1: 读取 JSON 文件
      const jsonPath = join(storagePath, collection);
      if (!existsSync(jsonPath)) {
        console.log(`[SKIP] ${collection} — 文件不存在`);
        result.status = 'skipped';
        result.durationMs = Date.now() - startTime;
        results.push(result);
        continue;
      }

      const rawContent = readFileSync(jsonPath, 'utf-8');
      const data = JSON.parse(rawContent);
      const items = Array.isArray(data) ? data : [data];
      result.jsonCount = items.length;

      console.log(
        `[READ] ${collection}: ${items.length} 条记录` +
          (dryRun ? '（DRY RUN，跳过写入）' : ''),
      );

      // Step 2: 写入 PG
      if (!dryRun) {
        await pgStorage.set(collection, items);
        result.pgCount = items.length;
      } else {
        result.pgCount = items.length;
      }

      // Step 3: 可选验证
      if (verify && !dryRun) {
        const pgData = await pgStorage.get<unknown[]>(collection);
        result.pgCount = Array.isArray(pgData) ? pgData.length : 0;

        if (result.pgCount !== result.jsonCount) {
          result.status = 'error';
          result.error = `记录数不一致: JSON=${result.jsonCount}, PG=${result.pgCount}`;
          console.error(`[WARN] ${collection}: ${result.error}`);
        }
      }
    } catch (error) {
      result.status = 'error';
      result.error = error instanceof Error ? error.message : String(error);
      console.error(`[ERROR] ${collection}: ${result.error}`);
    }

    result.durationMs = Date.now() - startTime;
    results.push(result);
  }

  // 汇总报告
  console.log('\n' + '='.repeat(60));
  console.log('迁移结果汇总');
  console.log('='.repeat(60));

  const succeeded = results.filter((r) => r.status === 'success');
  const skipped = results.filter((r) => r.status === 'skipped');
  const failed = results.filter((r) => r.status === 'error');

  for (const r of results) {
    const icon = r.status === 'success' ? '✓' : r.status === 'skipped' ? '○' : '✗';
    const detail =
      r.status === 'skipped'
        ? '文件不存在'
        : `${r.jsonCount} → ${r.pgCount} 条` +
          (r.error ? ` (${r.error})` : '') +
          ` [${r.durationMs}ms]`;
    console.log(`  ${icon} ${r.collection.padEnd(24)} ${detail}`);
  }

  console.log('-'.repeat(60));
  console.log(
    `成功: ${succeeded.length}  跳过: ${skipped.length}  失败: ${failed.length}`,
  );
  const totalRecords = results.reduce((sum, r) => sum + r.jsonCount, 0);
  console.log(`总记录数: ${totalRecords}`);

  await prisma.$disconnect();

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('[MIGRATE] 未捕获错误:', error);
  process.exit(1);
});

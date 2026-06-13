// Prisma 7 配置文件（Phase 14：PostgreSQL 迁移）
// Prisma 7 将连接配置从 schema.prisma 移到此文件
// 项目使用 Bun 运行，Bun 自动加载 .env，故无需显式 import dotenv
import { defineConfig } from "prisma/config";

// validate/generate 不连接数据库，用默认值即可通过；
// migrate/studio 会用真实的 DATABASE_URL 环境变量覆盖
const DEFAULT_URL = "postgresql://secuclaw:secuclaw_dev_pass@localhost:5432/secuclaw";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Migrate / introspect / studio 使用此 URL 连接数据库
  datasource: {
    url: process.env.DATABASE_URL ?? DEFAULT_URL,
  },
});

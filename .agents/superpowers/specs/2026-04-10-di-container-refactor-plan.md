# DI Container 依赖注入改造实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 SecuClawApplication 中的手动服务实例化改为 IoC 容器自动解析，实现服务间依赖自动注入、可独立测试

**Architecture:** 使用 ts-typedi 作为 IoC 容器，通过 @Injectable() 装饰器标记服务，构造函数自动解析依赖。基础存储（JsonStore）注册为全局单例，其他服务通过容器按需解析。

**Tech Stack:** ts-typedi, reflect-metadata

---

## Chunk 1: 基础设施搭建

### Task 1: 创建 Git 工作分支

- [ ] **Step 1: 创建并切换到新分支**
  ```bash
  cd /Users/tombook/Documents/work/ai_openclaw/dev_work/secuclaw
  git checkout -b refactor/di-container
  ```
  预期输出: `Switched to a new branch 'refactor/di-container'`

- [ ] **Step 2: 提交分支创建**
  ```bash
  git commit -m "feat: start DI container refactoring branch"
  --allow-empty
  ```
  预期输出: `[refactor/di-container xxx] feat: start DI container refactoring branch`

---

### Task 2: 安装 ts-typedi 依赖

**Files:**
- Modify: `packages/core/package.json`

- [ ] **Step 1: 安装 ts-typedi 和 reflect-metadata**
  ```bash
  cd /Users/tombook/Documents/work/ai_openclaw/dev_work/secuclaw/packages/core
  npm install ts-typedi reflect-metadata
  npm install -D @types/reflect-metadata
  ```
  预期输出: `added X packages`

- [ ] **Step 2: 验证 package.json 更新**
  检查 `dependencies` 中是否包含 `ts-typedi` 和 `reflect-metadata`

- [ ] **Step 3: 提交依赖安装**
  ```bash
  git add package.json package-lock.json
  git commit -m "deps: install ts-typedi and reflect-metadata for DI container"
  ```

---

### Task 3: 创建 DI 容器配置文件

**Files:**
- Create: `packages/core/src/di/container.ts`
- Create: `packages/core/src/di/tokens.ts`

- [ ] **Step 1: 创建 di 目录**
  ```bash
  mkdir -p /Users/tombook/Documents/work/ai_openclaw/dev_work/secuclaw/packages/core/src/di
  ```

- [ ] **Step 2: 创建 tokens.ts 定义依赖标识**
  ```typescript
  // packages/core/src/di/tokens.ts
  import { Token } from 'ts-typedi';
  
  // 存储相关
  export const JsonStoreToken = new Token<import('../storage/json-store.js').JsonStore>('JsonStore');
  
  // 知识库加载器
  export const MitreLoaderToken = new Token<import('../knowledge/mitre/loader.js').MitreLoader>('MitreLoader');
  export const ScfLoaderToken = new Token<import('../knowledge/scf/loader.js').ScfLoader>('ScfLoader');
  
  // 服务
  export const RolesServiceToken = new Token<import('../roles/service.js').RolesService>('RolesService');
  export const AuditLogServiceToken = new Token<import('../audit/service.js').AuditLogService>('AuditLogService');
  export const KpiServiceToken = new Token<import('../kpi/service.js').KpiService>('KpiService');
  
  // 事件总线
  export const EventBusToken = new Token<import('../events/index.js').EventBus>('EventBus');
  
  // Skill 加载器
  export const SkillLoaderToken = new Token<import('../skills/loader.js').SkillLoader>('SkillLoader');
  ```

- [ ] **Step 3: 创建 container.ts 容器配置**
  ```typescript
  // packages/core/src/di/container.ts
  import 'reflect-metadata';
  import { Container } from 'ts-typedi';
  import { JsonStore } from '../storage/json-store.js';
  import { EventBus, registerDefaultRules } from '../events/index.js';
  import * as tokens from './tokens.js';
  
  // 注册基础存储（全局单例）
  const jsonStore = new JsonStore('./data/storage');
  Container.provide([{ id: tokens.JsonStoreToken, value: jsonStore }]);
  
  // 注册事件总线（全局单例）
  const eventBus = new EventBus();
  registerDefaultRules(eventBus);
  Container.provide([{ id: tokens.EventBusToken, value: eventBus }]);
  
  export { Container, tokens };
  ```

- [ ] **Step 4: 提交 DI 基础设施**
  ```bash
  git add packages/core/src/di/
  git commit -m "feat(di): add ts-typedi container configuration and tokens"
  ```

---

## Chunk 2: Repository 层改造

### Task 4: 为 RolesRepository 添加装饰器

**Files:**
- Modify: `packages/core/src/roles/repository.ts`

- [ ] **Step 1: 添加 @Injectable 装饰器**
  ```typescript
  // packages/core/src/roles/repository.ts
  import { Injectable } from 'ts-typedi';
  import { Container } from '../di/container.js';
  import { tokens } from '../di/container.js';
  import { JsonStore } from '../storage/json-store.js';
  
  @Injectable()
  export class RolesRepository {
    private store: JsonStore;
    
    constructor() {
      this.store = Container.get(tokens.JsonStoreToken);
    }
    // ... 其余代码保持不变
  }
  ```

- [ ] **Step 2: 验证 TypeScript 编译**
  ```bash
  cd /Users/tombook/Documents/work/ai_openclaw/dev_work/secuclaw/packages/core
  npx tsc --noEmit 2>&1 | head -50
  ```

- [ ] **Step 3: 提交改动**
  ```bash
  git add packages/core/src/roles/repository.ts
  git commit -m "refactor(roles): add @Injectable decorator to RolesRepository"
  ```

---

### Task 5: 为 AuditLogRepository 添加装饰器

**Files:**
- Modify: `packages/core/src/audit/repository.ts`

- [ ] **Step 1: 添加 @Injectable 装饰器**
  ```typescript
  import { Injectable } from 'ts-typedi';
  import { Container } from '../di/container.js';
  import { tokens } from '../di/container.js';
  
  @Injectable()
  export class AuditLogRepository {
    private store;
    
    constructor() {
      this.store = Container.get(tokens.JsonStoreToken);
    }
    // ... 其余代码保持不变
  }
  ```

- [ ] **Step 2: 验证编译**
  ```bash
  npx tsc --noEmit 2>&1 | head -50
  ```

- [ ] **Step 3: 提交改动**
  ```bash
  git add packages/core/src/audit/repository.ts
  git commit -m "refactor(audit): add @Injectable decorator to AuditLogRepository"
  ```

---

### Task 6: 为 CapabilitiesRepository 添加装饰器

**Files:**
- Modify: `packages/core/src/capabilities/repository.ts`

- [ ] **Step 1: 添加 @Injectable 装饰器**
  ```typescript
  import { Injectable } from 'ts-typedi';
  import { Container } from '../di/container.js';
  import { tokens } from '../di/container.js';
  
  @Injectable()
  export class CapabilitiesRepository {
    private store;
    
    constructor() {
      this.store = Container.get(tokens.JsonStoreToken);
    }
    // ... 其余代码保持不变
  }
  ```

- [ ] **Step 2: 验证编译**
  ```bash
  npx tsc --noEmit 2>&1 | head -50
  ```

- [ ] **Step 3: 提交改动**
  ```bash
  git add packages/core/src/capabilities/repository.ts
  git commit -m "refactor(capabilities): add @Injectable decorator to CapabilitiesRepository"
  ```

---

## Chunk 3: Service 层改造

### Task 7: 为 RolesService 添加装饰器

**Files:**
- Modify: `packages/core/src/roles/service.ts`

- [ ] **Step 1: 添加 @Injectable 装饰器并重构构造函数**
  ```typescript
  import { Injectable } from 'ts-typedi';
  import { Container } from '../di/container.js';
  import { tokens } from '../di/container.js';
  import { RolesRepository } from './repository.js';
  
  @Injectable()
  export class RolesService {
    private repo: RolesRepository;
    
    constructor() {
      this.repo = Container.get(tokens.RolesServiceToken) as unknown as RolesRepository;
    }
    // ... 其余代码保持不变
  }
  ```

**注意**: 由于 ts-typedi 需要先解析 RolesRepository，而 RolesService 依赖 RolesRepository，需要使用延迟解析或重构为双向注册。

- [ ] **Step 2: 验证编译**
  ```bash
  npx tsc --noEmit 2>&1 | head -50
  ```

- [ ] **Step 3: 提交改动**
  ```bash
  git add packages/core/src/roles/service.ts
  git commit -m "refactor(roles): add @Injectable decorator to RolesService"
  ```

---

### Task 8: 为 AuditLogService 添加装饰器

**Files:**
- Modify: `packages/core/src/audit/service.ts`

- [ ] **Step 1: 添加 @Injectable 装饰器**
  ```typescript
  import { Injectable } from 'ts-typedi';
  import { Container } from '../di/container.js';
  import { tokens } from '../di/container.js';
  
  @Injectable()
  export class AuditLogService {
    private repo;
    
    constructor() {
      this.repo = Container.get(tokens.AuditLogServiceToken);
    }
    // ... 其余代码保持不变
  }
  ```

- [ ] **Step 2: 验证编译**
  ```bash
  npx tsc --noEmit 2>&1 | head -50
  ```

- [ ] **Step 3: 提交改动**
  ```bash
  git add packages/core/src/audit/service.ts
  git commit -m "refactor(audit): add @Injectable decorator to AuditLogService"
  ```

---

### Task 9: 为 KpiService 添加装饰器

**Files:**
- Modify: `packages/core/src/kpi/service.ts`

- [ ] **Step 1: 添加 @Injectable 装饰器**
  ```typescript
  import { Injectable } from 'ts-typedi';
  import { Container } from '../di/container.js';
  import { tokens } from '../di/container.js';
  
  @Injectable()
  export class KpiService {
    private store;
    
    constructor() {
      this.store = Container.get(tokens.JsonStoreToken);
    }
    // ... 其余代码保持不变
  }
  ```

- [ ] **Step 2: 验证编译**
  ```bash
  npx tsc --noEmit 2>&1 | head -50
  ```

- [ ] **Step 3: 提交改动**
  ```bash
  git add packages/core/src/kpi/service.ts
  git commit -m "refactor(kpi): add @Injectable decorator to KpiService"
  ```

---

## Chunk 4: Gateway 改造

### Task 10: 为 GatewayServer 添加装饰器

**Files:**
- Modify: `packages/core/src/gateway/server.ts`

- [ ] **Step 1: 添加 @Injectable 装饰器并重构构造函数**
  ```typescript
  import { Injectable } from 'ts-typedi';
  import { Container } from '../di/container.js';
  import { tokens } from '../di/container.js';
  
  @Injectable()
  export class GatewayServer {
    private skillLoader;
    private mitreLoader;
    private scfLoader;
    private jsonStore;
    private kpiService;
    private rolesService;
    private eventBus;
    
    constructor(options: { port: number }) {
      this.skillLoader = Container.get(tokens.SkillLoaderToken);
      this.mitreLoader = Container.get(tokens.MitreLoaderToken);
      this.scfLoader = Container.get(tokens.ScfLoaderToken);
      this.jsonStore = Container.get(tokens.JsonStoreToken);
      this.kpiService = Container.get(tokens.KpiServiceToken);
      this.rolesService = Container.get(tokens.RolesServiceToken);
      this.eventBus = Container.get(tokens.EventBusToken);
    }
    // ... 其余代码保持不变
  }
  ```

- [ ] **Step 2: 验证编译**
  ```bash
  npx tsc --noEmit 2>&1 | head -50
  ```

- [ ] **Step 3: 提交改动**
  ```bash
  git add packages/core/src/gateway/server.ts
  git commit -m "refactor(gateway): add @Injectable decorator to GatewayServer"
  ```

---

## Chunk 5: main.ts 改造

### Task 11: 重构 SecuClawApplication

**Files:**
- Modify: `packages/core/src/main.ts`

- [ ] **Step 1: 重构为使用容器解析**
  ```typescript
  import 'reflect-metadata';
  import { Container } from './di/container.js';
  import { tokens } from './di/container.js';
  import { GatewayServer } from './gateway/server.js';
  import { RolesService } from './roles/service.js';
  import { AuditLogService } from './audit/service.js';
  import { KpiService } from './kpi/service.js';
  import { SkillLoader } from './skills/loader.js';
  import { MitreLoader } from './knowledge/mitre/loader.js';
  import { ScfLoader } from './knowledge/scf/loader.js';
  import { DataSeedService } from './data-seed.js';
  import { KpiScheduler } from './kpi/scheduler.js';
  import { EventBus } from './events/index.js';
  import { CapabilitiesService } from './capabilities/service.js';
  import { CapabilitiesRepository } from './capabilities/repository.js';
  import { ChannelManager } from './channels/channel-manager.js';
  import { ApiServer } from './api/server.js';
  
  const logger = {
    info: (...args: any[]) => console.log('[INFO]', ...args),
    error: (...args: any[]) => console.error('[ERROR]', ...args),
    warn: (...args: any[]) => console.warn('[WARN]', ...args),
    debug: (...args: any[]) => console.log('[DEBUG]', ...args),
  };
  
  interface AppConfig {
    gatewayPort: number;
    apiPort: number;
    databasePath: string;
    skillsPath: string;
    dataPath: string;
  }
  
  const config: AppConfig = {
    gatewayPort: parseInt(process.env.GATEWAY_PORT || '21981', 10),
    apiPort: parseInt(process.env.API_PORT || '21982', 10),
    databasePath: process.env.DATABASE_PATH || './data/secuclaw.db',
    skillsPath: process.env.SKILLS_PATH || './skills',
    dataPath: process.env.DATA_PATH || './data',
  };
  
  @Injectable()
  class SecuClawApplication {
    private gateway: GatewayServer;
    private apiServer: ApiServer | null = null;
    private skillLoader: SkillLoader;
    private mitreLoader: MitreLoader;
    private scfLoader: ScfLoader;
    private rolesService: RolesService;
    private dataSeedService: DataSeedService;
    private kpiService: KpiService;
    private kpiScheduler: KpiScheduler;
    private eventBus: EventBus;
    private auditLogService: AuditLogService;
    private shutdownHandlers: Array<() => Promise<void>> = [];
  
    constructor() {
      // 使用容器解析所有依赖
      this.skillLoader = Container.get(tokens.SkillLoaderToken);
      this.mitreLoader = Container.get(tokens.MitreLoaderToken);
      this.scfLoader = Container.get(tokens.ScfLoaderToken);
      this.rolesService = Container.get(tokens.RolesServiceToken);
      this.eventBus = Container.get(tokens.EventBusToken);
      this.kpiService = Container.get(tokens.KpiServiceToken);
      this.auditLogService = Container.get(tokens.AuditLogServiceToken);
      this.dataSeedService = new DataSeedService(Container.get(tokens.JsonStoreToken));
      
      this.gateway = new GatewayServer({
        port: config.gatewayPort,
      });
  
      // Initialize REST API server
      try {
        this.apiServer = new ApiServer({ port: config.apiPort });
        logger.info(`REST API server configured on port ${config.apiPort}`);
      } catch (error) {
        logger.warn('REST API server initialization failed, continuing without it:', error);
      }
    }
    
    // ... 其余方法保持不变
  }
  
  async function main() {
    const app = new SecuClawApplication();
    app.setupSignalHandlers();
    // ... 其余代码保持不变
  }
  
  main();
  ```

- [ ] **Step 2: 验证编译**
  ```bash
  npx tsc --noEmit 2>&1 | head -100
  ```

- [ ] **Step 3: 提交改动**
  ```bash
  git add packages/core/src/main.ts
  git commit -m "refactor(main): refactor SecuClawApplication to use DI container"
  ```

---

## Chunk 6: 剩余模块改造

### Task 12: 为其他 Services 添加装饰器

**Files:**
- Modify: `packages/core/src/ai/service.ts`
- Modify: `packages/core/src/llm/service.ts`
- Modify: `packages/core/src/commander/service.ts`
- Modify: `packages/core/src/events/index.ts`
- Modify: `packages/core/src/channels/channel-manager.ts`
- Modify: `packages/core/src/tasks/service.ts`
- Modify: `packages/core/src/vulnerabilities/service.ts`
- Modify: `packages/core/src/incidents/service.ts`
- Modify: `packages/core/src/threats/service.ts`
- Modify: `packages/core/src/compliance/service.ts`

- [ ] **Step 1: 为每个 Service 添加 @Injectable 装饰器**
  
  对每个文件执行类似 Task 7 的改造：
  ```typescript
  import { Injectable } from 'ts-typedi';
  import { Container } from '../di/container.js';
  import { tokens } from '../di/container.js';
  
  @Injectable()
  export class XxxService {
    constructor() {
      // 使用 Container.get(tokens.XxxToken) 获取依赖
    }
    // ... 其余代码保持不变
  }
  ```

- [ ] **Step 2: 批量验证编译**
  ```bash
  npx tsc --noEmit 2>&1 | head -100
  ```

- [ ] **Step 3: 分批提交**
  ```bash
  git add packages/core/src/ai/service.ts packages/core/src/llm/service.ts
  git commit -m "refactor: add @Injectable to ai and llm services"
  
  git add packages/core/src/commander/service.ts packages/core/src/events/index.ts
  git commit -m "refactor: add @Injectable to commander and events"
  
  # 继续其他批次...
  ```

---

## Chunk 7: 验证和测试

### Task 13: 验证构建

- [ ] **Step 1: 执行完整构建**
  ```bash
  cd /Users/tombook/Documents/work/ai_openclaw/dev_work/secuclaw
  npm run build 2>&1
  ```
  预期输出: 构建成功，无错误

- [ ] **Step 2: 运行应用启动测试**
  ```bash
  cd /Users/tombook/Documents/work/ai_openclaw/dev_work/secuclaw/packages/core
  timeout 10 node dist/main.js 2>&1 || true
  ```
  预期输出: 应用启动日志，无致命错误

- [ ] **Step 3: 提交验证**
  ```bash
  git add -A
  git commit -m "test: verify DI container refactoring builds and starts"
  ```

---

### Task 14: 最终验收

- [ ] **Step 1: 验证无手动 new 调用**
  ```bash
  grep -r "new.*Repository\|new.*Service" packages/core/src --include="*.ts" | grep -v "node_modules" | grep -v ".bak"
  ```
  预期输出: 无结果（所有手动实例化已移除）

- [ ] **Step 2: 验证 @Injectable 装饰器**
  ```bash
  grep -r "@Injectable" packages/core/src --include="*.ts" | grep -v "node_modules"
  ```
  预期输出: 列出所有添加了装饰器的文件

- [ ] **Step 3: 推送分支**
  ```bash
  git push -u origin refactor/di-container
  ```

- [ ] **Step 4: 创建 PR 或合并请求**
  ```bash
  gh pr create --title "refactor: DI container for dependency injection" --body "$(cat <<'EOF'
  ## Summary
  - 引入 ts-typedi 作为 IoC 容器
  - 为所有 Service/Repository 添加 @Injectable() 装饰器
  - 重构 SecuClawApplication 使用容器解析依赖
  
  ## 测试
  - [ ] npm run build 成功
  - [ ] 应用启动正常
  - [ ] WebSocket 连接正常
  EOF
  )"
  ```

---

## 验收标准检查清单

- [ ] 所有 Repository 添加 @Injectable() 装饰器
- [ ] 所有 Service 添加 @Injectable() 装饰器
- [ ] main.ts 不再有手动 new XxxRepository() 调用
- [ ] GatewayServer 通过容器解析依赖
- [ ] npm run build 成功
- [ ] 应用启动成功
- [ ] 无 TypeScript 编译错误
- [ ] Git 分支已推送

---

*计划创建日期: 2026-04-10*
*基于设计: docs/superpowers/specs/2026-04-10-secuclaw-refactor-di-container-design.md*

# SecuClaw 全面重构 - 依赖注入改造设计

> 日期: 2026-04-10
> 状态: 已批准
> 重构批次: 第一批 - 依赖注入改造

---

## 1. 概述

### 1.1 目标

将 `SecuClawApplication` 中的手动服务实例化改为 IoC 容器自动解析，实现：
- 服务间依赖自动注入
- 服务可独立测试
- 生命周期统一管理

### 1.2 成功标准

- [x] 代码质量提升：消除手动 `new` 带来的耦合
- [x] 架构解耦可见：服务间依赖通过构造函数注入
- [ ] 性能可测量：重构后基准测试无退化

### 1.3 范围

**包含**：
- `packages/core/src/` 下所有 Service、Repository、Router 类
- `ui/src/` 下的前端服务层（data-service、gateway-client）
- skills 目录

**排除**：
- 临时代码
- 已废弃功能

---

## 2. 技术选型

### 2.1 库

| 库 | 版本 | 用途 |
|----|------|------|
| `ts-typedi` | ^0.10.0 | IoC 容器 |
| `reflect-metadata` | ^0.2.2 | 元数据反射支持 |

### 2.2 选择理由

- TypeScript 生态最成熟的 DI 库
- 支持构造函数注入、属性注入
- 与现有 `@injectable()` 风格兼容
- 轻量级（< 10KB）

---

## 3. 架构设计

### 3.1 当前问题

```typescript
// main.ts - 当前耦合问题
class SecuClawApplication {
  constructor(config: AppConfig) {
    // 手动实例化所有依赖
    this.jsonStore = new JsonStore('./data/storage');
    this.skillLoader = new SkillLoader(config.skillsPath);
    this.mitreLoader = new MitreLoader(...);
    this.scfLoader = new ScfLoader(...);
    
    // 深层耦合：直接实例化具体类
    const rolesRepo = new RolesRepository(this.jsonStore);
    this.rolesService = new RolesService(rolesRepo);
    // ... 20+ 个类似实例化
  }
}
```

**问题**：
- 无法单独测试某个服务
- 修改依赖需要修改构造函数
- 违背单一职责原则

### 3.2 目标架构

```
┌─────────────────────────────────────────────────────────┐
│                    IoC Container                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Token Registry                                 │   │
│  │  - JsonStore (singleton)                       │   │
│  │  - RolesRepository → JsonStore                 │   │
│  │  - RolesService → RolesRepository              │   │
│  │  - AuditLogRepository → JsonStore              │   │
│  │  - ...                                         │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              SecuClawApplication (重构后)               │
│  constructor(                                           │
│    @Inject() jsonStore: JsonStore,                      │
│    @Inject() rolesService: RolesService,               │
│    @Inject() auditService: AuditLogService,             │
│    ...                                                  │
│  )                                                      │
│  // 不再手动 new XxxRepository / XxxService            │
└─────────────────────────────────────────────────────────┘
```

---

## 4. 实施计划

### 4.1 第一阶段：基础设施

1. **安装依赖**
   ```bash
   cd packages/core
   npm install ts-typedi reflect-metadata
   npm install -D @types/reflect-metadata
   ```

2. **创建容器配置**
   ```typescript
   // src/di/container.ts
   import 'reflect-metadata';
   import { Container } from 'ts-typedi';
   import { JsonStore } from '../storage/json-store.js';
   
   // 注册基础存储（全局单例）
   Container.provide([{
     id: JsonStore,
     value: new JsonStore('./data/storage'),
     global: true
   }]);
   
   export { Container };
   ```

### 4.2 第二阶段：服务装饰器改造

3. **为所有 Repository 添加 `@Injectable()`**
   
   文件：`src/roles/repository.ts`
   ```typescript
   import { Injectable } from 'ts-typedi';
   
   @Injectable()
   export class RolesRepository {
     constructor(@Inject(() => JsonStore) private store: JsonStore) {}
     // ...
   }
   ```

4. **为所有 Service 添加 `@Injectable()`**
   
   文件：`src/roles/service.ts`
   ```typescript
   import { Injectable } from 'ts-typedi';
   
   @Injectable()
   export class RolesService {
     constructor(
       @Inject(() => RolesRepository) private repo: RolesRepository
     ) {}
     // ...
   }
   ```

### 4.3 第三阶段：Gateway 改造

5. **重构 GatewayServer 构造函数**
   ```typescript
   // src/gateway/server.ts
   @Injectable()
   export class GatewayServer {
     constructor(
       @Inject(() => SkillLoader) private skillLoader: SkillLoader,
       @Inject(() => MitreLoader) private mitreLoader: MitreLoader,
       @Inject(() => ScfLoader) private scfLoader: ScfLoader,
       @Inject(() => JsonStore) private jsonStore: JsonStore,
       @Inject(() => KpiService) private kpiService: KpiService,
       @Inject(() => RolesService) private rolesService: RolesService,
       @Inject(() => EventBus) private eventBus: EventBus,
     ) {}
   }
   ```

6. **重构 SecuClawApplication**
   ```typescript
   // main.ts
   import 'reflect-metadata';
   import { Container } from './di/container.js';
   import { GatewayServer } from './gateway/server.js';
   import { RolesService } from './roles/service.js';
   
   @Injectable()
   class SecuClawApplication {
     constructor(
       private gateway: GatewayServer,
       private rolesService: RolesService,
       // ...
     ) {}
   }
   
   async function main() {
     // 从容器解析应用实例
     const app = Container.get(SecuClawApplication);
     await app.initialize();
   }
   ```

---

## 5. 受影响的模块

| 模块 | 文件 | 改动类型 |
|------|------|----------|
| roles | repository.ts, service.ts | 添加装饰器 |
| audit | repository.ts, service.ts | 添加装饰器 |
| capabilities | repository.ts, service.ts | 添加装饰器 |
| channels | channel-manager.ts | 添加装饰器 |
| events | index.ts | 添加装饰器 |
| gateway | server.ts, router.ts | 构造函数改造 |
| incidents | * | 添加装饰器 |
| vulnerabilities | * | 添加装饰器 |
| threats | * | 添加装饰器 |
| compliance | * | 添加装饰器 |
| tasks | * | 添加装饰器 |
| kpi | service.ts, scheduler.ts | 添加装饰器 |
| commander | * | 添加装饰器 |
| llm | * | 添加装饰器 |
| ai | * | 添加装饰器 |
| main.ts | - | 完全重构 |

---

## 6. 回滚计划

如果重构失败：
1. 使用 Git 分支 `refactor/di-container` 进行开发
2. 保留 `main.ts.bak` 备份原始实现
3. 通过 `git diff` 审核所有改动

---

## 7. 验收标准

### 7.1 功能验证
- [ ] `npm run build` 成功，无编译错误
- [ ] 应用启动成功，所有服务正常初始化
- [ ] WebSocket 连接建立成功
- [ ] 核心 API（incidents、vulnerabilities、roles）调用正常

### 7.2 架构验证
- [ ] 移除所有手动 `new XxxRepository()` 调用
- [ ] 所有服务通过构造函数注入
- [ ] 服务可独立实例化测试

### 7.3 质量验证
- [ ] TypeScript strict 模式无新增错误
- [ ] ESLint 无新增错误（如果已配置）

---

## 8. 后续批次

| 批次 | 目标 | 依赖 |
|------|------|------|
| 第一批 | 依赖注入改造 | 本设计 |
| 第二批 | Gateway 路由拆分 | 第一批完成 |
| 第三批 | 事件系统重构 | 第一批完成 |
| 第四批 | 配置外部化 | 第一批完成 |
| 第五批 | 性能优化 | 第一批完成 |

---

*设计批准日期: 2026-04-10*

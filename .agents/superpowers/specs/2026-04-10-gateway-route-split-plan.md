# Gateway 路由拆分重构实施计划

> **批次**: 第二批
> **目标**: 将 GatewayServer 和 Router 拆分为模块化架构

---

## 1. 当前问题

```typescript
// router.ts - 当前 Router 类
export class Router {
  private handlers: Map<string, Handler> = new Map();
  private deps: RouterDeps;  // 依赖注入混乱
  
  constructor(deps: RouterDeps) {
    // 20+ 个 registerXxxRoutes 调用
    registerAuthRoutes(this.handlers, this.deps);
    registerKnowledgeRoutes(this.handlers, this.deps);
    registerCommanderRoutes(this.handlers, this.deps);
    // ...
  }
}
```

**问题**:
1. Router 构造函数过长 (70+ 行)
2. 依赖通过 `any` 类型传递，缺乏类型安全
3. 所有路由在启动时注册，无法按需加载
4. handler 方法查找是 O(n) Map 查找，可优化

---

## 2. 重构目标

1. **Router 精简**: Router 只负责方法查找和分发
2. **依赖清晰**: 创建独立的 ServiceFactory 管理服务
3. **路由分组**: 将相关路由分组为 RouteGroup
4. **延迟初始化**: 路由组按需注册

---

## 3. 实施计划

### Task 1: 创建 RouteGroup 基类

**文件**: `gateway/routes/route-group.ts`

```typescript
import type { Handler } from '../router.js';

export abstract class RouteGroup {
  protected handlers: Map<string, Handler> = new Map();
  
  abstract register(): void;
  
  getHandlers(): Map<string, Handler> {
    this.register();  // 延迟注册
    return this.handlers;
  }
  
  protected registerHandler(method: string, handler: Handler): void {
    this.handlers.set(method, handler);
  }
}
```

### Task 2: 创建 ServiceFactory

**文件**: `gateway/services/service-factory.ts`

```typescript
import 'reflect-metadata';
import { Service } from 'typedi';
import type { JsonStore } from '../../storage/json-store.js';
import type { SkillsService } from '../../skills/service.js';
import type { IncidentsService } from '../../incidents/service.js';
// ... 其他服务

@Service()
export class ServiceFactory {
  constructor(
    @Inject(() => JsonStore) private store: JsonStore,
  ) {}
  
  private services: Map<string, any> = new Map();
  
  getIncidentsService(): IncidentsService {
    if (!this.services.has('incidents')) {
      // 延迟创建
    }
    return this.services.get('incidents');
  }
  
  // ... 其他服务
}
```

### Task 3: 拆分 Auth Routes

**文件**: `gateway/routes/auth-route-group.ts`

```typescript
import { RouteGroup } from './route-group.js';
import type { Handler } from '../router.js';
import type { ServiceFactory } from '../services/service-factory.js';

export class AuthRouteGroup extends RouteGroup {
  constructor(private factory: ServiceFactory) {
    super();
  }
  
  register(): void {
    this.registerHandler('auth.login', this.login.bind(this));
    this.registerHandler('auth.logout', this.logout.bind(this));
    this.registerHandler('auth.verify', this.verify.bind(this));
  }
  
  private async login(params: Record<string, unknown>): Promise<unknown> {
    const service = this.factory.getAuthService();
    return service.login(params);
  }
  
  // ... 其他方法
}
```

### Task 4: 更新 Router

**文件**: `gateway/router.ts` (更新后)

```typescript
import 'reflect-metadata';
import { Service } from 'typedi';
import type { Handler } from './types.js';
import type { ServiceFactory } from './services/service-factory.js';

@Service()
export class Router {
  private handlers: Map<string, Handler> = new Map();
  
  constructor(private factory: ServiceFactory) {
    this.registerDefaultRoutes();
  }
  
  private registerDefaultRoutes(): void {
    // 注册默认路由
  }
  
  registerGroup(group: RouteGroup): void {
    const groupHandlers = group.getHandlers();
    groupHandlers.forEach((handler, method) => {
      this.handlers.set(method, handler);
    });
  }
  
  async handleRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
    const handler = this.handlers.get(method);
    if (!handler) {
      throw new Error(`Unknown method: ${method}`);
    }
    return handler(params);
  }
}
```

### Task 5: 更新 GatewayServer

**文件**: `gateway/server.ts` (更新后)

```typescript
import 'reflect-metadata';
import { Service } from 'typedi';
import type { Router } from './router.js';
import type { ServiceFactory } from './services/service-factory.js';

@Service()
export class GatewayServer {
  constructor(
    private router: Router,
    private factory: ServiceFactory,
  ) {}
  
  // WebSocket 处理逻辑保持不变
}
```

---

## 4. 路由分组

| 组名 | 路由前缀 | 文件 |
|------|----------|------|
| Auth | auth.* | auth-route-group.ts |
| Knowledge | knowledge.* | knowledge-route-group.ts |
| Commander | commander.* | commander-route-group.ts |
| LLM | llm.* | llm-route-group.ts |
| AI | ai.* | ai-route-group.ts |
| Assets | assets.* | assets-route-group.ts |
| Incidents | incidents.* | incidents-route-group.ts |
| Vulnerabilities | vulnerabilities.* | vulnerabilities-route-group.ts |
| Tasks | tasks.* | tasks-route-group.ts |
| Threats | threats.* | threats-route-group.ts |
| Compliance | compliance.* | compliance-route-group.ts |
| Roles | roles.* | roles-route-group.ts |
| Channels | channels.* | channels-route-group.ts |
| Audit | audit.* | audit-route-group.ts |
| Skills | skills.* | skills-route-group.ts |
| Tools | tools.* | tools-route-group.ts |
| Risk | risk.* | risk-route-group.ts |
| Reports | reports.* | reports-route-group.ts |
| Playbook | playbook.* | playbook-route-group.ts |
| SIEM | siem.* | siem-route-group.ts |
| Capabilities | capabilities.* | capabilities-route-group.ts |

---

## 5. 验收标准

- [ ] Router 类减少到 50 行以内
- [ ] 每个 RouteGroup 独立可测试
- [ ] ServiceFactory 提供类型安全的依赖获取
- [ ] 应用启动成功
- [ ] WebSocket 方法调用正常

---

## 6. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 循环依赖 (RouteGroup → ServiceFactory → Services) | 使用延迟初始化 |
| 路由注册顺序问题 | RouteGroup 注册顺序可控 |
| 测试复杂度增加 | 每个 RouteGroup 可独立测试 |

---

*计划创建日期: 2026-04-10*

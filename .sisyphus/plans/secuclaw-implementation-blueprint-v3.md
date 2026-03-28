# SecuClaw 功能落地执行蓝图 v3（三模型协同分析版）

> 基于 3 个 LLM 协同分析：GLM-5.1（架构综合）+ ark-code-latest（代码审查）+ MiniMax-M2.7（Sprint规划）
> 创建日期：2026-03-28
> 状态：执行中

---

## 一、Bug 清单（ark-code 发现，15 个）

### P0 阻断上线（7 个）

| ID | 文件 | Bug | 影响 | 修复方案 |
|----|------|-----|------|---------|
| B1 | `ai/service.ts` | `detectAnomalies` 返回硬编码 2 个 Anomaly | AI 检测核心能力完全失效 | 调用 `AnomalyDetectionEngine.detectAnomalies()` |
| B2 | `ai/service.ts` | `predictTrend` 返回硬编码 Prediction | 趋势预测完全失效 | 调用引擎基于历史数据计算 |
| B3 | `ai/service.ts` | `acknowledgeAnomaly`/`resolveAnomaly` 只打日志不更新存储 | 用户操作完全不生效 | 调用 `anomalyRepo.update()` |
| B4 | `capabilities/service.ts` | `executeRun` 用 setTimeout 模拟执行 | 任务不会真实执行 | 实现 TaskExecutor 接口 |
| B5 | `capabilities/service.ts` | `generateHash` 用简单 JS hash（非加密安全） | 安全平台防篡改能力失效 | 用 `crypto.createHash('sha256')` |
| B6 | `incidents/service.ts` | `severityToPriority` 返回 number 但类型定义 priority 为 string | TS 严格模式编译失败 | 统一类型 |
| B7 | 前端 `gateway-client.ts` | WebSocket 连接未携带认证 token | 任何人可接入网关 | 连接时 query 参数带 JWT |

### P1 高优先级（5 个）

| ID | 文件 | Bug | 修复 |
|----|------|-----|------|
| B8 | `capabilities/service.ts` | `createTask` ID 用 Date.now()+random 高并发碰撞 | 改用 `crypto.randomUUID()` |
| B9 | `capabilities/service.ts` | `approveApproval` 过期后先 update 再 throw，catch 拿不到数据 | 抛自定义 ApprovalExpiredError |
| B10 | `incidents/service.ts` | `handlers.push` 在 repo.update 之后未再 update | 合并到一次 update |
| B11 | `incidents/service.ts` | `resolutionBreached` 计算公式可简化 | 直接比较 closedAt > resolutionDeadline |
| B12 | `gateway/router.ts` | `handleLLMChat` 返回 mock 字符串 | 通过 ProviderFactory 调用真实 LLM |

### P2 中优先级（3 个）

| ID | 文件 | Bug | 修复 |
|----|------|-----|------|
| B13 | `capabilities/service.ts` | `calculateDomainSLARate` 分母为全部任务数 | 改为 closedTasks |
| B14 | 前端 `gateway-client.ts` | 无 WebSocket 重连策略 | 指数退避重连 |
| B15 | 前端 `gateway-client.ts` | 无请求超时机制 | 请求 Map + 15s 超时 |

---

## 二、4-Sprint 实施路线图

### Sprint 1（Week 1-2）：核心闭环打通 — 9.5 人天

| 任务ID | 任务 | 文件路径 | 人天 | 验证标准 |
|--------|------|---------|------|---------|
| S1-1 | AIService 门面重构：5 方法透传到真实引擎 | `ai/service.ts` | 2 | `AI_ENGINE_MODE=engine` 返回真实数据 |
| S1-2 | Auth 认证：bcrypt + JWT | `auth/hash.ts`、`auth/jwt.ts`（新建） | 1.5 | Bun.password.hash + Bun.jwt.sign |
| S1-3 | REST + WS 认证中间件 | `api/middleware/auth.ts`（新建）+`gateway/server.ts` | 1 | 无 token 返回 401 / ws.close(4001) |
| S1-4 | 启用前端路由守卫 | `ui/src/ui/app.ts` | 0.5 | 未登录重定向 /login |
| S1-5 | Bug B4: executeRun 替换 setTimeout | `capabilities/service.ts` | 0.5 | TaskExecutor 接口定义 |
| S1-6 | Bug B5: crypto SHA-256 hash | `capabilities/service.ts` | 0.25 | SHA-256 替换简单 hash |
| S1-7 | Bug B6: 类型统一 | `incidents/service.ts` | 0.25 | TS 编译通过 |
| S1-8 | Bug B7+B14+B15: WS 认证+重连+超时 | `ui/src/ui/gateway-client.ts` | 1 | token+指数退避+15s超时 |
| S1-9 | Bug B8: UUID 替换 | `capabilities/service.ts` | 0.25 | crypto.randomUUID() |
| S1-10 | Bug B9: 自定义 ApprovalExpiredError | `capabilities/service.ts` | 0.25 | throw 携带更新后实体 |
| S1-11 | Bug B10+B11: handlers 合并 + SLA 修正 | `incidents/service.ts` | 0.5 | 一次 update 完成 |
| S1-12 | 状态机 validateTransition 启用 | `capabilities/service.ts` | 0.5 | 非法状态转换抛异常 |
| S1-13 | Bug B13: SLA 分母修正 | `capabilities/service.ts` | 0.25 | closedTasks 为分母 |
| S1-14 | JsonStore 加写锁 | `storage/json-store.ts` | 0.5 | 并发写不丢数据 |

**Sprint 1 交付物**：AI 返回真实分析、JWT 认证工作、15 Bug 全修、状态机强制执行

---

### Sprint 2（Week 3-4）：LLM 集成 + 前端核心页 — 9.5 人天

| 任务ID | 任务 | 文件路径 | 人天 | 验证标准 |
|--------|------|---------|------|---------|
| S2-1 | LLM Provider 接口 + 工厂 | `llm/types.ts` + `llm/provider-factory.ts`（新建） | 0.5 | 5 Provider 类型定义 |
| S2-2 | Ollama Provider（本地优先） | `llm/ollama-provider.ts`（新建） | 0.5 | 调用本地模型返回响应 |
| S2-3 | OpenAI Provider | `llm/openai-provider.ts`（新建） | 0.5 | GPT-4o chat completions |
| S2-4 | Anthropic Provider | `llm/anthropic-provider.ts`（新建） | 0.5 | Claude Messages API |
| S2-5 | 数据脱敏 Sanitizer | `llm/sanitizer.ts`（新建） | 0.5 | IP/密码/邮箱 → [REDACTED] |
| S2-6 | handleLLMChat 替换 mock (B12) | `gateway/router.ts` | 1 | ProviderFactory→chat→真实响应 |
| S2-7 | AI 混合模式（规则+LLM） | `ai/service.ts` 扩展 | 1 | 规则置信度<0.7 时调 LLM 增强 |
| S2-8 | 事件管理前端完善 | `ui/src/ui/pages/sc-incidents-page.ts` | 2 | 列表+详情+状态操作+SLA倒计时 |
| S2-9 | Dashboard 数据对接 | `ui/src/ui/pages/sc-dashboard.ts` | 1.5 | 真实 KPI + AI 洞察 |
| S2-10 | 能力中心种子数据 | `packages/core/src/data-seed.ts` | 0.5 | 6 域 + 每域 3-5 能力项 |

**Sprint 2 交付物**：LLM 真实可用、事件管理完整 UI、AI 规则+LLM 混合模式

---

### Sprint 3（Week 5-6）：跨模块联动 + 模块补全 — 9.5 人天

| 任务ID | 任务 | 文件路径 | 人天 | 验证标准 |
|--------|------|---------|------|---------|
| S3-1 | 事件总线 EventBus | `events/event-bus.ts`+`events/types.ts`（新建） | 1.5 | emit→on 链路测试通过 |
| S3-2 | 5 条默认联动规则 | `events/default-rules.ts`（新建） | 1.5 | 事件→关联漏洞→创建任务 |
| S3-3 | Commander 模块独立化 | `commander/types.ts`+`service.ts`+`repository.ts`（新建） | 1.5 | 从 router.ts 抽取 |
| S3-4 | Channels 基础实现 | `channels/types.ts`+`email-provider.ts`+`webhook-provider.ts`（新建） | 1.5 | Email/Webhook 发送成功 |
| S3-5 | 通知触发集成 | 修改 incidents/capabilities Service | 0.5 | P0 事件→Email 通知 |
| S3-6 | Threats Service 增强 | `threats/service.ts`（39→200行） | 0.5 | MITRE 关联+IOC+状态 |
| S3-7 | Compliance Service 增强 | `compliance/service.ts`（22→200行） | 0.5 | SCF 控制项+合规评分 |
| S3-8 | Assets Service 增强 | `assets/service.ts`（22→150行） | 0.5 | CRUD+关联+批量导入 |
| S3-9 | 漏洞状态机验证 | `vulnerabilities/service.ts` | 0.5 | OPEN→FIXED 非法跳转被拒 |
| S3-10 | KPI 定时计算 | `scheduler.ts`（新建） | 0.5 | 每 5 分钟自动重算 |

**Sprint 3 交付物**：跨模块自动化联动、Commander/Channels 独立、5 Service 全部有业务逻辑

---

### Sprint 4（Week 7-8）：数据层重构 + 前端完善 + 安全加固 — 9.5 人天

| 任务ID | 任务 | 文件路径 | 人天 | 验证标准 |
|--------|------|---------|------|---------|
| S4-1 | Prisma SQLite 适配 | `prisma/schema.prisma` 改 datasource | 0.5 | bunx prisma db push 成功 |
| S4-2 | Prisma Repository 实现 | `incidents/prisma-repo.ts`+`vulnerabilities/prisma-repo.ts`（新建） | 1.5 | CRUD 单元测试通过 |
| S4-3 | Repository 工厂注入 | `main.ts` | 0.5 | DB_MODE=prisma 切换存储 |
| S4-4 | JSON→SQLite 迁移脚本 | `storage/migrate.ts`（新建） | 0.5 | 数据量一致验证 |
| S4-5 | 漏洞管理前端 | `sc-vulnerabilities-page.ts` | 1 | 列表+修复建议+批量操作 |
| S4-6 | 能力中心前端 | `sc-capabilities-page.ts` | 1.5 | 域看板+任务看板+审批 |
| S4-7 | 安全加固：RBAC 细化 | `middleware/permission.ts` | 0.5 | 角色-资源-操作矩阵 |
| S4-8 | 审计日志 | `services/audit-log.ts`（新建） | 0.5 | 敏感操作全部记录 |
| S4-9 | E2E 测试 | `__tests__/e2e/`（新建） | 0.5 | 全链路测试通过 |
| S4-10 | C 类页面骨架填充 | 基线/扫描/渗透/狩猎 | 1 | 4 页面基本结构 |

**Sprint 4 交付物**：Prisma 数据库工作、核心前端页面全部可用、安全加固完成、E2E 通过

---

## 三、架构决策（代码级方案）

### 决策 1：AI 门面层重构

```typescript
// packages/core/src/ai/service.ts（重构后）
export class AIService {
  private mode: 'mock' | 'engine' | 'hybrid';
  constructor(
    private anomalyEngine: AnomalyDetectionEngine,
    private insightEngine: InsightEngine,
    private threatEngine: ThreatIntelEngine,
    private vulnFixEngine: VulnerabilityFixEngine,
    private summaryEngine: IncidentSummaryEngine,
    private llmGateway?: LLMGateway,
  ) {
    this.mode = (process.env.AI_ENGINE_MODE as any) || 'engine';
  }
  async detectAnomalies(context: string, data?: any): Promise<Anomaly[]> {
    if (this.mode === 'mock') return this.mockAnomalies();
    return this.anomalyEngine.detectAnomalies(data);
  }
  async predictTrend(metric: string, timeframe: string): Promise<Prediction> {
    if (this.mode === 'mock') return this.mockPrediction(metric);
    return this.anomalyEngine.predictTrend(metric, timeframe);
  }
  // ... 其他方法同理透传
}
```

### 决策 2：事件总线

```typescript
// packages/core/src/events/event-bus.ts（新建）
export class EventBus {
  private handlers = new Map<string, Set<Function>>();
  on<K extends keyof EventMap>(event: K, handler: (p: EventMap[K]) => Promise<void>): void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
  }
  async emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): Promise<void> {
    const handlers = this.handlers.get(event);
    if (!handlers) return;
    await Promise.allSettled([...handlers].map(h => h(payload)));
  }
}
```

### 决策 3：LLM Provider

```typescript
// packages/core/src/llm/types.ts（新建）
export interface LLMProvider {
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
}
// packages/core/src/llm/provider-factory.ts（新建）
export class ProviderFactory {
  static create(config: LLMProviderConfig): LLMProvider { ... }
}
// packages/core/src/llm/sanitizer.ts（新建）
export class Sanitizer {
  static sanitize(messages: ChatMessage[]): ChatMessage[] { ... }
}
```

### 决策 4：认证系统

```typescript
// packages/core/src/auth/hash.ts（新建）
export const hashPassword = (p: string) => Bun.password.hash(p, { algorithm: 'bcrypt' });
export const verifyPassword = (p: string, h: string) => Bun.password.verify(p, h, 'bcrypt');
// packages/core/src/auth/jwt.ts（新建）
export const signToken = (payload: JWTPayload) => Bun.jwt.sign(payload, JWT_SECRET);
export const verifyToken = (token: string) => Bun.jwt.verify(token, JWT_SECRET);
```

---

## 四、风险矩阵

| Sprint | 风险值 | 主要风险 | 缓解 |
|--------|--------|---------|------|
| S1 | 30 | AI引擎响应慢、JWT漏洞 | 异步+超时、安全审计 |
| S2 | 24 | LLM API限流、流式响应兼容 | 本地缓存+降级、多浏览器 |
| S3 | 41 | 跨模块关联性能、Channels送达率 | 预计算+增量更新、多通道冗余 |
| S4 | 42 | Prisma迁移数据丢失 | 双写验证+回滚脚本 |

---

## 五、MVP 定义

8 周后用户体验：登录→Dashboard评分→事件列表→AI分析→创建任务→SLA预警→通知→周报

---

## 六、总览

| 维度 | 数值 |
|------|------|
| Bug 总数 | 15（7P0+5P1+3P2） |
| 实施步骤 | 48 |
| 新建文件 | ~20 |
| 修改文件 | ~15 |
| 总工时 | 38 人天 |
| 团队 | 2-3 人 |
| 周期 | 8 周（4 Sprint） |

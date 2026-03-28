# SecuClaw 功能落地执行蓝图 v4（三模型深度分析版）

> 基于 3 个 LLM 协同深度分析：GLM-5.1（代码实施+架构综合）+ ark-code-latest（架构审计+模块完成度）+ MiniMax-M2.7（集成分析+细粒度步骤）
> 创建日期：2026-03-28
> 前序：Sprint 1-4 已全部完成，0 TypeScript 错误
> 状态：**待执行**

---

## 零、项目现状总览

### 代码规模
| 区域 | 文件数 | 总行数 | 核心文件 |
|------|--------|--------|---------|
| 后端 `packages/core/src/` | 78 | 16,309 | router.ts(1224行), ai/service.ts(416行), data-seed.ts(721行) |
| 前端 `ui/src/ui/` | 78 | 33,612 | sc-vulnerabilities-page(1270行), sc-secops-center(1148行), ai-service.ts(614行) |
| **合计** | **156** | **~50,000** | |

### 模块完成度（三模型综合评估）

```
┌──────────────────────────────────────────────────────────────────────┐
│  AI服务        ████████████████████░░  88%  门面+7子模块+混合LLM     │
│  事件管理      ███████████████████░░░  85%  CRUD+10状态+EventBus     │
│  角色管理      ███████████████████░░░  85%  8角色+RBAC+种子数据      │
│  漏洞管理      ████████████████████░░  82%  CRUD+5状态机+AI优先级    │
│  认证          ████████████████████░░  80%  bcrypt+JWT+WS认证        │
│  合规审计      ███████████████████░░░  78%  多框架+控制项+AI差距     │
│  威胁情报      █████████████████░░░░░  75%  IOC+MITRE+AI分析        │
│  资产管理      █████████████████░░░░░  75%  CRUD+漏洞关联+风险画像   │
│  指挥官        █████████████████░░░░░  72%  角色绑定+LLM绑定         │
│  KPI           █████████████████░░░░░  72%  指标计算+定时调度         │
│  知识库        █████████████████░░░░░  72%  MITRE ATT&CK+SCF         │
│  能力中心      ██████████████░░░░░░░░  70%  8域+任务+审批+执行       │
│  审计日志      █████████████░░░░░░░░░  68%  记录+查询+统计           │
│  通知渠道      ████████████░░░░░░░░░░  65%  Email+Webhook+渠道管理   │
│  事件总线      ███████████░░░░░░░░░░░  62%  15事件+5规则             │
│  LLM集成       ███████████████████░░░  75%  3提供商+工厂+清洗器      │
│  网关          ██████████████░░░░░░░░  70%  WebSocket+REST+认证      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 一、10大跨模块集成断裂点（MiniMax + ark-code 联合发现）

| # | 断裂点 | 严重度 | 现状 | 影响 |
|---|--------|--------|------|------|
| G1 | vulnerabilities ↔ EventBus | P0 | 漏洞状态变更无事件触发 | 下游告警/通知/审计全部断裂 |
| G2 | threats ↔ EventBus | P0 | 威胁检测无事件触发 | 无法自动创建事件/触发响应 |
| G3 | assets ↔ EventBus | P1 | 资产变更无事件触发 | 关联漏洞无法自动更新风险 |
| G4 | compliance ↔ EventBus | P1 | 合规违规无事件触发 | 无法自动创建整改任务 |
| G5 | AuditLogService ↔ router | P1 | 审计日志模块无API路由 | 前端无法查询审计记录 |
| G6 | AI ↔ 业务工单 | P1 | AI分析结果仅展示不写回 | AI无法驱动业务自动化 |
| G7 | Commander ↔ Capabilities | P2 | 剧本无法调用安全能力 | 指挥官形同虚设 |
| G8 | Channels ↔ EventBus | P2 | notification.send事件未被消费 | 通知规则形同虚设 |
| G9 | KPI ↔ Dashboard前端 | P2 | KPI计算结果无推送 | 前端无法展示实时指标 |
| G10 | Knowledge ↔ Incidents | P2 | MITRE战术未自动匹配事件 | 知识库利用率低 |

---

## 二、Sprint 5-8 实施路线图

### Sprint 5（Week 9-10）：安全加固 + 路由拆分 + EventBus补全

| ID | 任务 | 文件路径 | 方法/函数 | 行数 | 验收标准 |
|----|------|---------|----------|------|---------|
| **S5-1** | **路由拆分** | | | | |
| S5-1a | 认证路由 | `gateway/routes/auth-routes.ts` (新建) | `registerAuthRoutes(router: Router): void` | ~120 | 登录/注册/刷新Token路由独立 |
| S5-1b | 事件路由 | `gateway/routes/incident-routes.ts` (新建) | `registerIncidentRoutes(router: Router): void` | ~150 | 事件CRUD+状态变更路由独立 |
| S5-1c | 漏洞路由 | `gateway/routes/vuln-routes.ts` (新建) | `registerVulnRoutes(router: Router): void` | ~120 | 漏洞CRUD+状态机路由独立 |
| S5-1d | 威胁路由 | `gateway/routes/threat-routes.ts` (新建) | `registerThreatRoutes(router: Router): void` | ~100 | IOC+MITRE+威胁源路由独立 |
| S5-1e | 合规路由 | `gateway/routes/compliance-routes.ts` (新建) | `registerComplianceRoutes(router: Router): void` | ~100 | 框架+控制项+审计任务路由 |
| S5-1f | 资产路由 | `gateway/routes/asset-routes.ts` (新建) | `registerAssetRoutes(router: Router): void` | ~100 | 资产CRUD+关联路由独立 |
| S5-1g | 能力路由 | `gateway/routes/capability-routes.ts` (新建) | `registerCapabilityRoutes(router: Router): void` | ~180 | 8域+任务+审批+执行路由 |
| S5-1h | 系统路由 | `gateway/routes/system-routes.ts` (新建) | `registerSystemRoutes(router: Router): void` | ~80 | KPI+LLM+Commander+Channel |
| S5-1i | 路由注册入口 | `gateway/router.ts` (重写) | `constructor(deps) { registerAllRoutes() }` | ~100 | 总入口≤100行，委托给子路由 |
| **S5-2** | **JWT刷新/吊销** | | | | |
| S5-2a | 刷新令牌 | `auth/jwt.ts` (修改) | `generateRefreshToken(userId: string): Promise<string>` | +40 | AccessToken过期可换发 |
| S5-2b | 令牌吊销 | `auth/jwt.ts` (修改) | `revokeToken(token: string, expireAt: number): Promise<void>` | +30 | 吊销后Token访问返回401 |
| S5-2c | 黑名单存储 | `auth/token-blacklist.ts` (新建) | `isRevoked(jti: string): Promise<boolean>` | +50 | 重启后黑名单不丢失 |
| **S5-3** | **RBAC接口级权限** | | | | |
| S5-3a | 权限中间件 | `middleware/rbac.ts` (新建) | `rbacGuard(requiredPermissions: string[]): Handler` | +80 | 无权限返回403 |
| S5-3b | 权限矩阵 | `roles/permissions.ts` (新建) | `PERMISSION_MATRIX: Record<Role, string[]>` | +60 | 每角色精确到接口操作 |
| **S5-4** | **EventBus扩展** | | | | |
| S5-4a | 漏洞事件 | `vulnerabilities/service.ts` (修改) | `private emitStatusChanged(old, new): Promise<void>` | +25 | 状态变更自动emit |
| S5-4b | 威胁事件 | `threats/service.ts` (修改) | `private emitThreatDetected(threat): Promise<void>` | +25 | 威胁检测自动emit |
| S5-4c | 资产事件 | `assets/service.ts` (修改) | `private emitAssetChanged(type, asset): Promise<void>` | +25 | 资产变更自动emit |
| S5-4d | 合规事件 | `compliance/service.ts` (修改) | `private emitViolation(control): Promise<void>` | +25 | 合规违规自动emit |
| S5-4e | 新事件类型 | `events/types.ts` (修改) | 新增10种事件类型定义 | +40 | TS类型完整覆盖 |
| **S5-5** | **审计日志全埋点+API** | | | | |
| S5-5a | 审计中间件 | `middleware/audit-log.ts` (新建) | `auditLogMiddleware(req, res, next): void` | +60 | POST/PUT/DELETE自动记录 |
| S5-5b | 审计API路由 | `gateway/routes/audit-routes.ts` (新建) | `registerAuditRoutes(router: Router): void` | +80 | 查询/统计/按资源查 |

**Sprint 5 交付物**：路由≤100行/文件、JWT刷新吊销、接口级RBAC、4模块EventBus连通、审计日志全链路

---

### Sprint 6（Week 11-12）：业务模块深化

| ID | 任务 | 文件路径 | 方法/函数 | 行数 | 验收标准 |
|----|------|---------|----------|------|---------|
| **S6-1** | **事件关联分析** | | | | |
| S6-1a | 关联存储 | `incidents/link-store.ts` (新建) | `linkResource(incidentId, type, resourceId): Promise<void>` | +60 | 多类型资源关联 |
| S6-1b | 关联查询 | `incidents/service.ts` (修改) | `getLinkedResources(incidentId): Promise<LinkedResources>` | +40 | 返回关联的漏洞/资产/威胁 |
| S6-1c | 自动关联规则 | `incidents/auto-link.ts` (新建) | `autoLinkOnCreate(incident): Promise<void>` | +50 | 创建事件自动匹配关联 |
| **S6-2** | **SLA自动跟踪** | | | | |
| S6-2a | SLA检查器 | `scheduler/sla-checker.ts` (新建) | `checkSlaTimeouts(): Promise<void>` | +80 | 剩余20%发预警 |
| S6-2b | 自动升级 | `incidents/service.ts` (修改) | `escalateIncident(incidentId, level): Promise<void>` | +40 | 超时自动升级负责人 |
| S6-2c | SLA告警事件 | `events/types.ts` (修改) | 新增 `sla.warning` / `sla.breached` | +15 | SLA事件触发通知 |
| **S6-3** | **漏洞批量管理** | | | | |
| S6-3a | 批量状态更新 | `vulnerabilities/service.ts` (修改) | `batchUpdateStatus(ids[], status): Promise<BatchResult>` | +35 | 支持1000条批量操作 |
| S6-3b | 环境因子CVSS | `vulnerabilities/env-cvss.ts` (新建) | `calculateEnvCvss(base, envFactors): number` | +60 | 环境因子修改自动重算 |
| S6-3c | 修复计划 | `vulnerabilities/repair-plan.ts` (新建) | `createRepairPlan(plan): Promise<RepairPlan>` | +80 | 计划关联漏洞+跟踪进度 |
| **S6-4** | **资产发现框架** | | | | |
| S6-4a | 扫描适配器接口 | `scanner/scanner-adapter.ts` (新建) | `interface ScannerAdapter { scan(targets): Promise<ScanResult> }` | +30 | 统一扫描接口 |
| S6-4b | 端口扫描适配器 | `scanner/port-scanner.ts` (新建) | `scan(targets): Promise<PortScanResult>` | +80 | 结果自动更新资产端口 |
| S6-4c | 资产风险评分 | `assets/risk-score.ts` (新建) | `calculateRiskScore(assetId): Promise<number>` | +50 | 根据漏洞/端口/重要性计算 |
| **S6-5** | **合规自动映射** | | | | |
| S6-5a | 等保2.0框架 | `compliance/frameworks/dj2.ts` (新建) | `loadDJ2Framework(): Promise<ComplianceFramework>` | +100 | 等保2.0控制项完整导入 |
| S6-5b | PCI-DSS框架 | `compliance/frameworks/pci-dss.ts` (新建) | `loadPCIDSSFramework(): Promise<ComplianceFramework>` | +80 | PCI-DSS控制项完整导入 |
| S6-5c | 自动检查执行 | `compliance/auto-check.ts` (新建) | `runComplianceCheck(frameworkCode): Promise<ComplianceReport>` | +120 | 不合规项自动关联漏洞 |

**Sprint 6 交付物**：事件关联分析、SLA自动跟踪、漏洞批量管理+环境CVSS、资产发现框架、合规自动映射

---

### Sprint 7（Week 13-14）：自动化增强

| ID | 任务 | 文件路径 | 方法/函数 | 行数 | 验收标准 |
|----|------|---------|----------|------|---------|
| **S7-1** | **Commander剧本编排** | | | | |
| S7-1a | 剧本数据模型 | `commander/playbook-types.ts` (新建) | `interface Playbook { steps, triggers, conditions }` | +50 | 支持串行/并行/条件分支 |
| S7-1b | 剧本存储 | `commander/playbook-repository.ts` (新建) | `CRUD + search + versioning` | +80 | 剧本版本管理 |
| S7-1c | 剧本执行引擎 | `commander/playbook-engine.ts` (新建) | `executePlaybook(id, payload): Promise<ExecutionResult>` | +150 | 支持分支/循环/暂停 |
| S7-1d | 能力调用桥接 | `commander/capability-bridge.ts` (新建) | `invokeCapability(capId, params): Promise<RunResult>` | +60 | 剧本直接调用安全能力 |
| **S7-2** | **AI输出校验+关联** | | | | |
| S7-2a | 幻觉检测器 | `ai/llm-output-validator.ts` (新建) | `detectHallucination(output, refData): Promise<{isH, conf}>` | +80 | 准确率≥85% |
| S7-2b | 结果关联写入 | `ai/result-linker.ts` (新建) | `linkToTicket(output, ticketId): Promise<void>` | +50 | AI分析自动关联工单 |
| **S7-3** | **通知渠道路由** | | | | |
| S7-3a | 事件-渠道路由 | `notification/channel-router.ts` (新建) | `routeNotification(event): Promise<NotificationResult>` | +80 | 高危→企微+短信，低危→邮件 |
| S7-3b | 消息模板 | `notification/templates.ts` (新建) | `getTemplate(eventType, channel): Promise<string>` | +60 | 可配置模板系统 |
| S7-3c | EventBus消费 | `notification/event-consumer.ts` (新建) | `consumeNotificationSend(event): Promise<void>` | +50 | 消费notification.send事件 |
| **S7-4** | **知识库自动映射** | | | | |
| S7-4a | MITRE匹配器 | `knowledge/mitre-mapper.ts` (新建) | `matchTactics(incident): Promise<MitreTactic[]>` | +60 | 事件创建自动匹配战术 |
| S7-4b | 技术关联 | `knowledge/mitre-mapper.ts` (修改) | `matchTechniques(indicators): Promise<MitreTechnique[]>` | +40 | IOC自动匹配技术 |
| **S7-5** | **KPI自定义** | | | | |
| S7-5a | KPI定义引擎 | `kpi/definition-engine.ts` (新建) | `createCustomKpi(def): Promise<KpiDefinition>` | +60 | 支持自定义计算规则 |
| S7-5b | 阈值告警 | `kpi/threshold-alert.ts` (新建) | `checkThreshold(kpi, value): Promise<Alert\|null>` | +40 | 超阈值自动告警 |
| S7-5c | 前端KPI配置 | `pages/settings/sc-kpi-config.ts` (新建) | KPI配置表单+阈值设置 | +120 | 可视化KPI配置 |

**Sprint 7 交付物**：剧本编排+执行引擎、AI幻觉检测、通知渠道路由、MITRE自动映射、KPI自定义

---

### Sprint 8（Week 15-16）：生产就绪

| ID | 任务 | 文件路径 | 方法/函数 | 行数 | 验收标准 |
|----|------|---------|----------|------|---------|
| **S8-1** | **可观测性** | | | | |
| S8-1a | 结构化日志 | `observability/logger.ts` (新建) | `structuredLog(level, msg, ctx): void` | +60 | JSON格式，统一输出 |
| S8-1b | Prometheus指标 | `observability/metrics.ts` (新建) | `registerMetrics(app): void` | +80 | /metrics端点暴露指标 |
| S8-1c | 健康检查增强 | `observability/health.ts` (新建) | `checkAll(): Promise<HealthResult>` | +50 | /health返回所有服务状态 |
| **S8-2** | **前端性能优化** | | | | |
| S8-2a | 路由懒加载 | `router.ts` (修改) | `lazyImport(path): () => Promise<LitElement>` | +30 | 首屏≤2s |
| S8-2b | 虚拟滚动 | `components/sc-virtual-scroll.ts` (新建) | `render(items, height): TemplateResult` | +100 | 1000行无卡顿 |
| S8-2c | 离线缓存 | `service-worker.ts` (新建) | Service Worker注册+缓存策略 | +80 | 离线可访问已加载页 |
| **S8-3** | **配置中心** | | | | |
| S8-3a | 多环境配置 | `config/config-service.ts` (新建) | `loadConfig(env): Promise<Config>` | +60 | dev/test/prod配置分离 |
| S8-3b | 敏感配置加密 | `config/encrypt.ts` (新建) | `encrypt(val)/decrypt(val): string` | +40 | 密钥不明文存储 |
| **S8-4** | **测试覆盖** | | | | |
| S8-4a | 核心模块单元测试 | `__tests__/unit/` (新建) | incidents/vuln/assets/service.test.ts | +300 | 核心模块覆盖率≥60% |
| S8-4b | API集成测试 | `__tests__/integration/` (新建) | router/auth/events.test.ts | +200 | 关键API端到端通过 |
| **S8-5** | **部署方案** | | | | |
| S8-5a | Dockerfile | `Dockerfile` (新建) | 多阶段构建 | +40 | docker build成功 |
| S8-5b | docker-compose | `docker-compose.yml` (新建) | app + redis(可选) | +30 | docker-compose up 一键启动 |
| S8-5c | 环境变量模板 | `.env.example` (新建) | 所有配置项说明 | +40 | 新人可直接复制使用 |

**Sprint 8 交付物**：结构化日志+Prometheus指标、前端≤2s首屏、配置加密、60%+测试覆盖、Docker一键部署

---

## 三、安全性加固清单（ark-code 审计发现）

| # | 风险 | 当前状态 | 修复方案 | Sprint |
|---|------|---------|---------|--------|
| SEC-1 | JWT无吊销机制 | 登出后Token仍可用 | 黑名单+Redis(或JsonStore) | S5 |
| SEC-2 | 无MFA | 密码即可登录 | TOTP二次验证(可选) | S5 |
| SEC-3 | 粗粒度RBAC | 仅角色级控制 | 接口+数据级权限 | S5 |
| SEC-4 | 敏感数据明文存储 | LLM密钥明文 | AES-256加密存储 | S8 |
| SEC-5 | 无暴力破解防护 | 无限次登录尝试 | 5次锁定15分钟 | S5 |
| SEC-6 | 审计日志无防篡改 | 可被恶意删除 | 哈希链校验 | S5 |
| SEC-7 | 统一参数校验缺失 | 依赖前端校验 | Zod schema校验 | S5 |
| SEC-8 | WS无消息大小限制 | 可被洪水攻击 | 1MB消息限制 | S5 |

---

## 四、代码架构技术债务（三模型共识）

| # | 债务 | 影响 | 修复方案 | Sprint |
|---|------|------|---------|--------|
| TD-1 | router.ts 1224行过于臃肿 | 维护成本高 | 按业务域拆分为8个路由文件 | S5 |
| TD-2 | 前后端类型不共享 | 类型重复/不一致 | 创建 `packages/shared/types/` | S6 |
| TD-3 | 无统一Repository抽象 | 换存储需重构 | Repository<T>泛型接口 | S7 |
| TD-4 | data-seed.ts 721行未拆分 | 维护困难 | 按模块拆分seed文件 | S6 |
| TD-5 | AI子服务重复LLM调用代码 | 代码冗余 | 抽离BaseAIService | S7 |
| TD-6 | 多个状态机重复实现 | 不可复用 | 通用StateMachine<T>类 | S7 |
| TD-7 | 测试覆盖率<10% | 回归风险高 | 核心模块单元测试 | S8 |
| TD-8 | 无接口文档 | 新人上手难 | Swagger/OpenAPI生成 | S8 |

---

## 五、总览

| 维度 | Sprint 1-4 (已完成) | Sprint 5-8 (本计划) | 合计 |
|------|---------------------|---------------------|------|
| 任务数 | 48 | 52 | 100 |
| 新建文件 | ~20 | ~35 | ~55 |
| 修改文件 | ~15 | ~25 | ~40 |
| 工时(人天) | 38 | 42 | 80 |
| 周期 | 8周 | 8周 | 16周 |

### 每Sprint验收门槛

| Sprint | 核心验收标准 |
|--------|-------------|
| S5 | 路由拆分≤100行/文件、JWT刷新吊销、4模块EventBus连通、审计日志API可用 |
| S6 | 事件关联分析可用、SLA自动预警、漏洞批量操作、合规自动检查 |
| S7 | 剧本可编排执行、AI幻觉检测≥85%、通知渠道路由、KPI可自定义 |
| S8 | 结构化日志+Prometheus、首屏≤2s、测试覆盖≥60%、Docker一键部署 |

---

## 六、三模型协同分工

| 模型 | 角色 | 负责内容 |
|------|------|---------|
| GLM-5.1 | 架构师+实施者 | 代码实施、LSP验证、类型安全、模式匹配 |
| ark-code-latest | 代码审查员 | 模块完成度评估、安全审计、架构债务发现、实现步骤细化 |
| MiniMax-M2.7 | 集成分析师 | 跨模块断裂点分析、集成修复方案、函数签名设计、验收标准 |

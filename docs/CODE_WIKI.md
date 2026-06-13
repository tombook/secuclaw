# SecuClaw Code Wiki

> AI 安全决策辅助平台 · 架构与代码参考文档
>
> 版本：1.0.0 · 最后更新：2026-06-14

---

## 目录

1. [项目概述](#1-项目概述)
2. [项目架构](#2-项目架构)
3. [目录结构](#3-目录结构)
4. [核心模块详解](#4-核心模块详解)
5. [关键类与函数索引](#5-关键类与函数索引)
6. [依赖关系](#6-依赖关系)
7. [数据存储架构](#7-数据存储架构)
8. [项目运行方式](#8-项目运行方式)
9. [API 与通信协议](#9-api-与通信协议)

---

## 1. 项目概述

### 1.1 定位

SecuClaw 是 **AI 安全决策辅助平台**，而非传统 SIEM/SOAR 的替代品。核心理念：

- **以角色为中心**：内置 8 个安全角色（安全专家、隐私官、安全架构师、业务安全官、SecuClaw 指挥官、CISO、安全运维、供应链安全），每个角色拥有独立的指挥台仪表盘。
- **RACI 协同矩阵**：通过 R/A/C/I 四种角色分配，实现跨角色任务流转和作战室（War Room）协同。
- **30+ AI 能力**：基于 LLM 的异常检测、洞察生成、智能推荐，覆盖 6 大能力域（光明面/黑暗面/安全/法律/技术/业务）。
- **知识驱动**：内置 MITRE ATT&CK 和 SCF（Secure Controls Framework）知识库，能力项与攻防技术和合规控制双向映射。

### 1.2 核心能力

| 能力域 | 说明 |
|--------|------|
| 8 角色指挥台 | 每个角色有独立工具集、仪表盘、KPI 指标 |
| 30+ AI 能力 | 异常检测、洞察引擎、智能推荐、LLM 分析 |
| RACI 矩阵 | 跨角色任务编排、作战室、事件升级 |
| 统一指挥台 | 多角色统一入口，支持角色切换和协作 |
| 安全扩展 | CSPM/DSPM/EASM/ITDR/RASP/UEBA/SOAR/Sigma 等 10+ 扩展模块 |
| 合规管理 | GDPR/SOC 2/ISO 27001/个保法 多框架合规跟踪 |
| 知识库 | MITRE ATT&CK 战术技术 + SCF 控制项 |

### 1.3 技术栈

| 层 | 技术 |
|----|------|
| **后端运行时** | Bun 1.1.38（TypeScript 原生执行 + 热重载） |
| **后端框架** | 原生 `http` + `ws`（WebSocket），非 Express 主路径 |
| **ORM** | Prisma 7.8.0 + @prisma/adapter-pg（PostgreSQL 驱动适配器） |
| **关系数据库** | PostgreSQL 16 |
| **缓存/集群** | Redis 7.4（ioredis 客户端） |
| **文件存储** | JSON 文件集合（`data/storage/*.json`，默认模式） |
| **依赖注入** | TypeDI 0.10 |
| **认证** | JWT（自实现）+ bcrypt 密码 + Token 黑名单 |
| **前端框架** | Lit 3.3（Web Components）+ Vite 8 |
| **前端状态** | Zustand 5（vanilla 模式，非 React 绑定） |
| **前端可视化** | 自研 SVG 组件（14 种图表，无第三方图表库） |
| **容器化** | Docker + Docker Compose（6 服务编排） |
| **监控** | Prometheus + Grafana |

---

## 2. 项目架构

### 2.1 Monorepo 结构

```
secuclaw/                          # pnpm monorepo 根
├── package.json                   # concurrently 并发启动脚本
├── pnpm-workspace.yaml            # workspace: ui + packages/*
├── docker-compose.yml             # 6 服务编排
├── Dockerfile                     # Bun 多阶段构建
├── .env.example                   # 环境变量模板
│
├── ui/                            # 前端（Lit 3 + Vite）
│   ├── src/
│   │   ├── bootstrap.ts           # 应用入口：注册所有 Web Components
│   │   ├── pages/                 # 页面级组件
│   │   ├── components/            # 功能组件（100+）
│   │   ├── config/                # 角色/主题/仪表盘配置
│   │   ├── stores/                # Zustand 状态管理
│   │   ├── services/              # API 调用 + 键盘快捷键
│   │   ├── plugins/               # 插件系统（适配器 + 引擎 + 渲染器）
│   │   ├── evolution/             # 技能进化系统
│   │   └── styles/                # 全局样式 + 8 套角色主题
│   └── vite.config.ts
│
└── packages/
    └── core/                      # 后端（Bun + TypeScript）
        ├── src/
        │   ├── main.ts            # 应用入口：SecuClawApplication
        │   ├── gateway/           # WebSocket 网关 + HTTP 服务
        │   ├── storage/           # 存储抽象层（IStorage 接口）
        │   ├── config/            # 配置服务
        │   ├── auth/              # 认证授权
        │   ├── db/                # Prisma + Redis 客户端
        │   ├── events/            # 事件总线
        │   ├── capabilities/      # 能力中心（6 域 + 任务编排）
        │   ├── ai/                # AI 服务（异常检测 + 洞察引擎）
        │   ├── roles/             # 角色与用户管理
        │   ├── ... (40+ 模块)
        │   └── gateway/routes/    # 54 个路由注册文件
        ├── prisma/
        │   └── schema.prisma      # 9 表 Prisma schema
        ├── prisma.config.ts       # Prisma 7 配置
        ├── data/                  # JSON 文件存储 + 知识库数据
        └── scripts/               # 迁移脚本
```

### 2.2 后端分层架构

```
┌──────────────────────────────────────────────────────┐
│                    客户端（UI）                        │
│              WebSocket / REST API                     │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│              GatewayServer（端口 21981）                │
│  ┌────────────┐  ┌─────────────┐  ┌────────────────┐ │
│  │ HTTP Server │  │ WebSocket   │  │ Health Check   │ │
│  │ /api/v1/*   │  │ /ws         │  │ /health        │ │
│  └──────┬─────┘  └──────┬──────┘  └────────────────┘ │
│         │               │                             │
│  ┌──────▼───────────────▼─────────────────────────┐  │
│  │              Router                             │  │
│  │  handlers: Map<method, Handler>  (60+ 方法)     │  │
│  │  deps: { jsonStore, services, loaders, ... }    │  │
│  └──────────────────────┬──────────────────────────┘  │
└─────────────────────────┼────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────┐
│              Service 层（业务逻辑）                     │
│  RolesService · AssetsService · AIService            │
│  CapabilitiesService · KpiService · CommanderService │
│  ChannelManager · EventSystem · ...                  │
└─────────────────────────┬────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────┐
│            Repository 层（数据访问）                    │
│  RolesRepository · AssetsRepository                  │
│  CapabilitiesRepository · AuditLogRepository · ...   │
└─────────────────────────┬────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────┐
│            Storage 层（存储抽象）                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │         DualWriteStorage（双写代理）              │ │
│  │  ┌──────────────┐  ┌──────────────────────────┐ │ │
│  │  │ CachedJson   │  │ PgStorage (Prisma)       │ │ │
│  │  │ Store (主)    │  │ (从，Phase 14 可选)      │ │ │
│  │  └──────────────┘  └──────────────────────────┘ │ │
│  └─────────────────────────────────────────────────┘ │
│         IStorage 接口：get/set/delete/exists/list     │
└──────────────────────────────────────────────────────┘
```

### 2.3 前端组件层次

```
ScAppShell（应用壳：侧边栏 + 顶部栏 + 主内容区）
├── ScOverview（安全总览仪表盘）
├── ScRoleCommander（角色指挥台）
│   ├── ScRoleToolbar（角色工具栏）
│   ├── ScRaciPanel（RACI 任务面板）
│   ├── ScMetricsGrid（指标网格）
│   └── ScCollabHub（协作中心）
├── 角色仪表盘（8 套）
│   ├── ScDashboardCommander（指挥官）
│   ├── ScDashboardCiso（CISO）
│   ├── ScDashboardSecurityExpert（安全专家）
│   ├── ScDashboardPrivacy（隐私官）
│   ├── ScDashboardArchitect（安全架构师）
│   ├── ScDashboardBusiness（业务安全官）
│   ├── ScDashboardSecops（安全运维）
│   └── ScDashboardSupplyChain（供应链安全）
├── 安全扩展仪表盘（10+）
│   ├── ScItdrDashboard / ScDspmDashboard / ScRaspDashboard
│   ├── ScAiScmDashboard / ScEasmDashboard / ScUebaDashboard
│   ├── ScSigmaDashboard / ScSoarDashboard / ScSaasDashboard
│   └── ...
├── 可视化组件（14 种）
│   ├── ScBarChart / ScDonutChart / ScLineChart / ScRadarChart
│   ├── ScHeatmap / ScSankeyChart / ScTreemap
│   ├── ScRiskMatrix / ScGaugeChart / ScComplianceGauge
│   └── ...
├── 功能组件（30+）
│   ├── ScAssetInventory / ScIncidentTimeline
│   ├── ScVulnLifecyclePanel / ScThreatIntelPanel
│   ├── ScComplianceDashboard / ScKpiMetricsDashboard
│   └── ...
└── 系统
    ├── ScCommandPalette（命令面板 ⌘K）
    ├── ScSettingsPanel（设置面板）
    ├── ScNotificationCenter（通知中心）
    └── EvolutionDashboard（进化仪表盘）
```

### 2.4 数据流图

```
                ┌─────────┐
                │  用户操作  │
                └────┬────┘
                     │ WebSocket req
┌────────────────────▼───────────────────────┐
│              GatewayServer                   │
│  req → Router.handleRequest(method, params) │
│        → handler(params, deps) → result     │
│  res ← { type:'res', seq, result/error }    │
└────────┬───────────────────────┬───────────┘
         │ Service 调用            │ EventBus.emit
         ▼                        ▼
┌────────────────┐    ┌───────────────────────┐
│ Service 层      │    │     EventBus           │
│ (业务逻辑)      │───►│  24 种事件类型          │
│                │    │  ┌───────────────────┐ │
└────────┬───────┘    │  │ EventSystem        │ │
         │            │  │ + 默认规则引擎      │ │
         ▼            │  │ + RACI 事件桥接     │ │
┌────────────────┐    │  └───────────────────┘ │
│ Repository 层   │    └───────────┬───────────┘
│ (CRUD)         │                │ event 广播
└────────┬───────┘                ▼
         │            ┌───────────────────────┐
         ▼            │  GatewayServer         │
┌────────────────┐    │  .broadcastToAll()    │
│  Storage 层     │    │  → WebSocket event    │
│ (JSON/PG/双写)  │    │  → Redis pub/sub      │
└────────────────┘    │    （跨实例）           │
                      └───────────┬───────────┘
                                  ▼
                     ┌────────────────────────┐
                     │  所有订阅客户端          │
                     │  { type:'event', ...}  │
                     └────────────────────────┘
```

---

## 3. 目录结构

### 3.1 后端模块树（`packages/core/src/`）

后端共 48 个模块目录，按职责分组：

#### 基础设施层

| 模块 | 说明 |
|------|------|
| `config/` | 配置服务（环境变量驱动，含 DatabaseConfig、RedisConfig） |
| `storage/` | 存储抽象层（IStorage 接口 + JSON/PG/双写实现） |
| `db/` | 数据库客户端（Prisma 单例 + Redis 单例 + 分布式锁） |
| `auth/` | 认证授权（JWT 签发/验证 + Token 黑名单 + bcrypt 密码） |
| `di/` | TypeDI 依赖注入容器配置 |
| `events/` | 事件总线（EventBus + EventSystem + 24 种事件类型 + 规则引擎） |
| `middleware/` | 中间件（RBAC 权限检查 + 审计日志） |
| `scheduler/` | 定时任务调度器（KPI 定时计算） |
| `utils/` | 通用工具函数 |

#### 网关层

| 模块 | 说明 |
|------|------|
| `gateway/` | WebSocket 网关 + HTTP 服务（核心入口） |
| `gateway/routes/` | 54 个路由注册文件 |
| `gateway/services/` | 网关服务工厂 |
| `api/` | REST API 辅助 |

#### 核心业务模块

| 模块 | 说明 |
|------|------|
| `assets/` | 资产库管理（服务器、数据库、网络设备等） |
| `incidents/` | 安全事件管理（创建、分派、状态流转、SLA） |
| `vulnerabilities/` | 漏洞管理（CVE 跟踪、CVSS 评分、修复状态） |
| `threats/` | 威胁情报（APT、勒索软件、IOCs） |
| `compliance/` | 合规管理（GDPR、SOC 2、ISO 27001 等框架） |
| `roles/` | 角色与用户管理（8 角色 + 自定义角色 + 权限） |
| `tasks/` | 任务管理 |
| `audit/` | 审计日志（所有操作记录） |
| `remediation/` | 整改跟踪 |

#### AI 能力层

| 模块 | 说明 |
|------|------|
| `ai/` | AI 服务（异常检测引擎 + 洞察引擎 + LLM 网关） |
| `llm/` | LLM 网关（5 个 Provider：OpenAI/Anthropic/Ollama/BigModel/MiniMax） |
| `ai-scm/` | AI 供应链安全管理 |
| `ai-spm/` | AI 安全态势管理 |

#### 安全扩展模块

| 模块 | 说明 |
|------|------|
| `cspm/` | 云安全态势管理 |
| `dspm/` | 数据安全态势管理 |
| `easm/` | 外部攻击面管理 |
| `itdr/` | 身份威胁检测与响应 |
| `rasp/` | 运行时应用自我保护 |
| `detection/` | 检测引擎（Sigma 规则 + SOAR 编排） |
| `scanner/` | 安全扫描器 |
| `soar/` | 安全编排自动化与响应 |
| `ueba/` | 用户和实体行为分析 |
| `supply-chain/` | 供应链安全管理 |
| `privacy/` | 隐私保护增强技术 |

#### 平台能力层

| 模块 | 说明 |
|------|------|
| `capabilities/` | 能力中心（6 域 + 任务编排 + 审批流 + 状态机） |
| `commander/` | 指挥官配置（个人/团队指挥官 + LLM 绑定） |
| `channels/` | 通知渠道管理（12 种渠道：Email/Webhook/飞书/Telegram 等） |
| `knowledge/` | 知识库（MITRE ATT&CK 加载器 + SCF 加载器） |
| `kpi/` | KPI 指标计算（安全评分、风险评分、SLA 达成率） |
| `skills/` | Skill 加载器（SKILL.md frontmatter 解析） |
| `evolution/` | 技能进化引擎 |
| `raci/` | RACI 协同（任务引擎 + 作战室 + 事件路由） |
| `notification/` | 通知服务 |
| `observability/` | 可观测性 |
| `billing/` | 计费管理 |
| `deployment/` | 部署管理 |
| `multi-tenant/` | 多租户 |
| `data/` | 数据层辅助 |

### 3.2 前端组件树（`ui/src/`）

| 目录 | 说明 | 文件数 |
|------|------|--------|
| `pages/` | 页面组件（App Shell、Landing、Auth、Billing、Overview） | 5 |
| `components/dashboards/` | 8 套角色仪表盘 | 8 |
| `components/visualizations/` | 14 种可视化组件 | 14 |
| `components/role-commander/` | 角色指挥台组件 | 5 |
| `components/ai-results/` | AI 结果展示组件 | 7 |
| `components/` (功能) | 功能组件（资产、事件、漏洞、合规等） | 30+ |
| `config/` | 角色配置（工具、主题、仪表盘、AI 能力） | 5 |
| `stores/` | Zustand 状态管理 | 5 |
| `services/` | API 服务、键盘快捷键、数据导出 | 5 |
| `plugins/` | 插件系统（适配器、引擎、渲染器、数据服务） | 25+ |
| `evolution/` | 技能进化系统（上下文、记忆、洞察、技能扫描） | 18 |
| `styles/` | 全局样式 + 8 套角色主题 | 10+ |

---

## 4. 核心模块详解

### 4.1 基础设施层

#### 4.1.1 存储抽象（`storage/`）

**设计理念**：统一 IStorage 接口，使上层 Repository 可以透明切换 JSON 文件 / PostgreSQL / 双写模式。

```
IStorage 接口
├── JsonStore            — JSON 文件存储（基础实现，无缓存）
├── CachedJsonStore      — 带内存缓存的 JSON 存储（默认使用）
├── PgStorage            — PostgreSQL 存储（Prisma 驱动，9 表映射）
└── DualWriteStorage     — 双写代理（JSON 先写 + PG 后写，运行时读路径切换）
```

**IStorage 接口**（[storage/types.ts](../packages/core/src/storage/types.ts)）：

```typescript
export interface IStorage {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  list(prefix: string): Promise<string[]>;
}
```

**DualWriteStorage 双写策略**（Phase 14）：

- **写路径**：JSON 先写（保证主路径可用）→ PG 后写（失败只记录日志，不阻塞）
- **读路径**：默认从 JSON 读，数据校验后调用 `setReadSource('secondary')` 切换到 PG
- **零侵入**：DualWriteStorage 实现 IStorage，包装在 main.ts，所有 60+ Repository 无需修改

#### 4.1.2 配置服务（`config/`）

**ConfigService**（[config/config-service.ts](../packages/core/src/config/config-service.ts)）：

- 环境变量驱动的配置管理
- 支持 `development` / `test` / `production` 三种环境
- 配置结构：AppConfig（env + server + gateway + auth + storage + database + redis + llm）

关键配置接口：

```typescript
interface DatabaseConfig {
  url: string;              // PostgreSQL 连接串，空则未启用
  poolMax: number;          // 连接池大小
  migrateOnBoot: boolean;   // 启动时自动迁移
  dualWriteEnabled: boolean; // 双写开关
}

interface RedisConfig {
  url: string;              // Redis 连接串，空则单机模式
  keyPrefix: string;        // key 前缀（默认 secuclaw:）
}
```

#### 4.1.3 认证授权（`auth/`）

| 文件 | 说明 |
|------|------|
| [jwt.ts](../packages/core/src/auth/jwt.ts) | JWT 签发与验证（自实现 base64url，非 jsonwebtoken 库） |
| [token-blacklist.ts](../packages/core/src/auth/token-blacklist.ts) | Token 黑名单（Redis/JSON 双后端，Redis 模式 O(1) + 自动过期） |
| [password.ts](../packages/core/src/auth/password.ts) | bcrypt 密码哈希 |

**Token 黑名单双后端**：

- Redis 模式：集群共享、O(1) 查询、自动过期（TTL = JWT 过期时间）
- JSON 模式：单机降级方案，定时清理过期记录

#### 4.1.4 数据库客户端（`db/`）

| 文件 | 说明 |
|------|------|
| [prisma.ts](../packages/core/src/db/prisma.ts) | Prisma 客户端单例（@prisma/adapter-pg 驱动） |
| [redis.ts](../packages/core/src/db/redis.ts) | Redis 客户端单例（主 + 订阅双连接，热重载安全） |
| [distributed-lock.ts](../packages/core/src/db/distributed-lock.ts) | 分布式锁（SET NX EX + Lua 脚本释放） |

**Prisma 客户端**（Phase 14）：

- 使用 `@prisma/adapter-pg` driver adapter（Prisma 7 架构）
- 全局单例挂载到 `globalThis.__secuclawPrisma`，避免 Bun --watch 热重载创建多个连接
- `initPrisma(connectionString, poolMax)` 在 main.ts 启动时调用

**Redis 客户端**（Phase 14）：

- 双连接模式：主客户端（常规操作）+ 订阅客户端（pub/sub 专用，ioredis 限制）
- 全局单例挂载到 `globalThis.__secuclawRedis`
- `keyPrefix` 自动加到所有 key 前面

#### 4.1.5 事件总线（`events/`）

**EventBus**（[events/event-bus.ts](../packages/core/src/events/event-bus.ts)）：

- 发布/订阅模式，类型安全的事件映射
- 支持 `on` / `once` / `off` / `emit`
- `emit` 使用 `Promise.allSettled` 确保一个 handler 失败不影响其他

**24 种事件类型**（[events/types.ts](../packages/core/src/events/types.ts)）：

```
incident.created / statusChanged / resolved
vulnerability.created / statusChanged / critical
threat.detected / confidenceUpdated
compliance.violation / scoreChanged
asset.created / updated / deleted / vulnerabilityLinked
task.created / completed / approval.expired
anomaly.detected / kpi.calculated / notification.send / system.alert
sla.warning / sla.breached
```

**EventSystem** + 默认规则引擎：

- 注册规则类（`defaultRuleClasses`），监听事件并触发自动化动作
- RACI 事件桥接（`initRaciEventBridge`）：安全事件自动创建 RACI 任务

### 4.2 网关层

#### 4.2.1 GatewayServer

**文件**：[gateway/server.ts](../packages/core/src/gateway/server.ts)

统一网关服务器，HTTP 和 WebSocket 共享端口 21981：

| 端点 | 协议 | 说明 |
|------|------|------|
| `/ws` | WebSocket | 主通信通道（req/res/event/batch 消息） |
| `/health` | HTTP GET | 健康检查（含 PG/Redis 连接状态和延迟） |
| `/api/v1/:routeId` | HTTP POST | REST API（routeId 对应 handler 方法名） |

**核心方法**：

| 方法 | 说明 |
|------|------|
| `start()` | 启动服务器（HTTP listen + WebSocket handler + 心跳 + EventBus 桥接） |
| `stop()` | 优雅关闭（清理心跳 + 关闭客户端 + 关闭服务器） |
| `broadcast(event, data)` | 广播事件（本地 + Redis pub/sub） |
| `broadcastToAll(event, data)` | 广播给所有客户端（本地 + Redis） |
| `localBroadcast(event, data)` | 仅推送给本机订阅客户端（Redis 回调用） |
| `setRedisAdapter(adapter)` | 注入 Redis 广播适配器 |

**客户端管理**：

- 心跳检测：每 30 秒 ping，未响应则 terminate
- 消息批处理：16ms 窗口聚合 `pendingMessages`，减少 WebSocket 发送次数
- 认证：URL token / sec-websocket-protocol header / demo 模式（无 token）

#### 4.2.2 Router

**文件**：[gateway/router.ts](../packages/core/src/router.ts)

方法路由器，`handlers: Map<method, Handler>` 存储 60+ 个处理函数：

```typescript
type Handler = (
  params: Record<string, unknown>,
  deps?: any,
  clientContext?: Record<string, unknown>
) => Promise<unknown>;
```

**请求处理流程**：

1. 客户端发送 `{ type: 'req', seq, method, params }`
2. `Router.handleRequest(method, params, clientContext)` 查找 handler
3. 执行 `handler(params, deps, clientContext)` 返回 result
4. 响应 `{ type: 'res', seq, result/error }`

#### 4.2.3 路由注册

54 个路由注册文件（[gateway/routes/](../packages/core/src/gateway/routes/)），每个文件导出 `register*Routes(handlersMap, deps)` 函数：

| 路由文件 | 模块 |
|----------|------|
| `auth-routes.ts` | 认证（登录、刷新、登出） |
| `assets-routes.ts` | 资产 CRUD |
| `incidents-crud-routes.ts` | 事件 CRUD |
| `vulnerabilities-crud-routes.ts` | 漏洞 CRUD |
| `ai-routes.ts` | AI 分析 |
| `llm-routes.ts` | LLM 对话 |
| `capabilities-routes.ts` | 能力中心 |
| `commander-routes.ts` | 指挥官配置 |
| `knowledge-routes.ts` | 知识库查询 |
| `raci-task-routes.ts` | RACI 任务 |
| `warroom-routes.ts` | 作战室 |
| `cspm-routes.ts` | 云安全态势 |
| `ai-scm-routes.ts` | AI 供应链安全 |
| `easm-routes.ts` | 外部攻击面 |
| `soar-engine-routes.ts` | SOAR 引擎 |
| `sigma-routes.ts` | Sigma 检测规则 |
| ... | （共 54 个） |

### 4.3 业务模块层

每个业务模块遵循 `Repository + Service + Types` 三层结构：

```
模块/
├── types.ts        — 类型定义
├── repository.ts   — 数据访问（依赖 IStorage）
├── service.ts      — 业务逻辑（依赖 Repository）
└── index.ts        — barrel 导出
```

#### RolesService（[roles/service.ts](../packages/core/src/roles/service.ts)）

| 方法 | 说明 |
|------|------|
| `listRoles(params)` | 查询角色列表 |
| `getRole(id)` | 获取角色详情 |
| `createRole(data)` | 创建角色 |
| `initializeRoles()` | 初始化 8 个默认角色 |
| `listUsers(params)` | 查询用户列表 |
| `assignRoles(userId, roleIds)` | 给用户分配角色 |

#### AssetsService（[assets/service.ts](../packages/core/src/assets/service.ts)）

资产库管理：服务器、数据库、网络设备、应用等。支持按类型、环境、关键性、状态查询。

#### CapabilitiesService（[capabilities/service.ts](../packages/core/src/capabilities/service.ts)）

能力中心核心服务，管理 6 大能力域：

| 能力域 | 说明 |
|--------|------|
| `light` | 光明面能力（防御性） |
| `dark` | 黑暗面能力（攻击性，强制审批） |
| `security` | 安全能力 |
| `legal` | 法律合规能力 |
| `technology` | 技术能力 |
| `business` | 业务能力 |

关键功能：

- 能力项 CRUD + 状态机（`validateTaskTransition` / `validateRunTransition`）
- 任务编排 + 审批流（`ApprovalExpiredError`）
- 执行证据包（EvidencePack）
- MITRE 覆盖 + SCF 覆盖映射

### 4.4 AI 能力层

#### AIService（[ai/service.ts](../packages/core/src/ai/service.ts)）

| 组件 | 说明 |
|------|------|
| `AnomalyDetectionEngine` | 异常检测引擎（基于统计模型） |
| `InsightEngine` | 洞察生成引擎（从数据中提取安全洞察） |
| `LLMGateway` | 可选 LLM 网关注入（混合分析模式） |

**双模式**：

- `engine` 模式（默认）：使用内置引擎
- `mock` 模式：返回模拟数据（通过 `AI_ENGINE_MODE=mock` 切换）

#### LLMService（[llm/llm-service.ts](../packages/core/src/ai/llm-service.ts)）

多 Provider LLM 网关，支持 5 个 Provider：

| Provider | 类 | 说明 |
|----------|-----|------|
| `openai` | OpenAIProvider | OpenAI GPT 系列 |
| `anthropic` | AnthropicProvider | Claude 系列 |
| `ollama` | OllamaProvider | 本地模型（Ollama） |
| `bigmodel` / `zhipu` | BigModelProvider | 智谱 GLM |
| `minimax` | MiniMaxProvider | MiniMax |

### 4.5 RACI 协同（`raci/`）

**RACI 矩阵**：8 个角色 × 5 种场景 × R/A/C/I 四种分配

| 概念 | 说明 |
|------|------|
| **R**（Responsible） | 执行者 — 实际完成任务 |
| **A**（Accountable） | 问责者 — 最终负责，唯一 |
| **C**（Consulted） | 咨询者 — 提供意见 |
| **I**（Informed） | 知情者 — 需要通知 |

核心组件：

| 文件 | 说明 |
|------|------|
| `task-engine.ts` | RACI 任务引擎（创建、分派、流转、升级） |
| `session-manager.ts` | 作战室会话管理 |
| `event-router.ts` | 事件路由（安全事件 → RACI 任务） |
| `warroom-forensic.ts` | 作战室取证 |

**场景类型**：

- `incident-response`（事件响应）
- `vulnerability-management`（漏洞管理）
- `threat-hunting`（威胁狩猎）
- `compliance-audit`（合规审计）
- `security-assessment`（安全评估）

### 4.6 知识库（`knowledge/`）

| 加载器 | 数据源 | 说明 |
|--------|--------|------|
| `MitreLoader` | `data/mitre/attack-stix-data/` | MITRE ATT&CK STIX 数据（战术、技术、程序） |
| `ScfLoader` | `data/scf/` | SCF（Secure Controls Framework）控制项 |

加载器在 main.ts 启动时调用 `loadAll()` / `load()`，将数据加载到内存。

### 4.7 通知渠道（`channels/`）

**ChannelManager**（[channels/channel-manager.ts](../packages/core/src/channels/channel-manager.ts)）：

支持 12 种通知渠道：

```
email, webhook, feishu, telegram, slack, discord, teams,
nostr, google-chat, whatsapp, signal, imessage
```

- 内置 Provider：EmailProvider、WebhookProvider
- 可扩展：`registerProvider(provider)` 注册自定义渠道
- 配置持久化：每个渠道配置存储在 `channels/{channelId}.json`

### 4.8 KPI 指标（`kpi/`）

**KpiService**（[kpi/service.ts](../packages/core/src/kpi/service.ts)）：

计算综合安全指标：

| 指标类 | 包含 |
|--------|------|
| 总体评分 | overallScore, riskScore, securityScore |
| 事件指标 | total, open, critical, avgResponseTime, avgResolutionTime |
| 漏洞指标 | total, open, critical, high, medium, avgCvss |
| 威胁指标 | total, apt, ransomware, highConfidence |
| 合规指标 | overall, gdpr, soc2, iso27001, pipi |
| 资产指标 | total, critical, atRisk |
| SLA 指标 | responseCompliance, resolutionCompliance |

**KpiScheduler**：定时计算 KPI 指标并广播 `kpi.calculated` 事件。

---

## 5. 关键类与函数索引

### 5.1 后端核心类

| 类名 | 文件 | 职责 |
|------|------|------|
| `SecuClawApplication` | [main.ts](../packages/core/src/main.ts) | 应用入口，编排所有服务初始化 |
| `GatewayServer` | [gateway/server.ts](../packages/core/src/gateway/server.ts) | WebSocket + HTTP 统一网关 |
| `Router` | [gateway/router.ts](../packages/core/src/gateway/router.ts) | 方法路由（60+ handler） |
| `EventBus` | [events/event-bus.ts](../packages/core/src/events/event-bus.ts) | 事件发布/订阅 |
| `EventSystem` | [events/event-system.ts](../packages/core/src/events/event-system.ts) | 事件系统 + 规则引擎 |
| `ConfigService` | [config/config-service.ts](../packages/core/src/config/config-service.ts) | 配置管理 |
| `DualWriteStorage` | [storage/dual-write-storage.ts](../packages/core/src/storage/dual-write-storage.ts) | 双写存储代理 |
| `CachedJsonStore` | [storage/cached-json-store.ts](../packages/core/src/storage/cached-json-store.ts) | 带缓存的 JSON 存储 |
| `PgStorage` | [storage/pg-storage.ts](../packages/core/src/storage/pg-storage.ts) | PostgreSQL 存储 |
| `CapabilitiesService` | [capabilities/service.ts](../packages/core/src/capabilities/service.ts) | 能力中心服务 |
| `AIService` | [ai/service.ts](../packages/core/src/ai/service.ts) | AI 分析服务 |
| `LLMService` | [ai/llm-service.ts](../packages/core/src/ai/llm-service.ts) | LLM 多 Provider 网关 |
| `RolesService` | [roles/service.ts](../packages/core/src/roles/service.ts) | 角色与用户管理 |
| `AssetsService` | [assets/service.ts](../packages/core/src/assets/service.ts) | 资产管理 |
| `KpiService` | [kpi/service.ts](../packages/core/src/kpi/service.ts) | KPI 指标计算 |
| `CommanderService` | [commander/service.ts](../packages/core/src/commander/service.ts) | 指挥官配置 |
| `ChannelManager` | [channels/channel-manager.ts](../packages/core/src/channels/channel-manager.ts) | 通知渠道管理 |
| `AuditLogService` | [audit/service.ts](../packages/core/src/audit/service.ts) | 审计日志 |
| `DataSeedService` | [data-seed.ts](../packages/core/src/data-seed.ts) | 初始数据播种 |
| `SkillLoader` | [skills/loader.ts](../packages/core/src/skills/loader.ts) | Skill 加载器 |
| `MitreLoader` | [knowledge/mitre/loader.ts](../packages/core/src/knowledge/mitre/loader.ts) | MITRE ATT&CK 加载器 |
| `ScfLoader` | [knowledge/scf/loader.ts](../packages/core/src/knowledge/scf/loader.ts) | SCF 控制项加载器 |
| `RedisBroadcastAdapter` | [gateway/redis-broadcast-adapter.ts](../packages/core/src/gateway/redis-broadcast-adapter.ts) | WebSocket 跨实例广播 |
| `TokenBlacklist` | [auth/token-blacklist.ts](../packages/core/src/auth/token-blacklist.ts) | Token 黑名单 |
| `DistributedLock` | [db/distributed-lock.ts](../packages/core/src/db/distributed-lock.ts) | 分布式锁 |

### 5.2 前端核心组件

| 组件 | 文件 | 说明 |
|------|------|------|
| `ScAppShell` | [pages/sc-app-shell.ts](../ui/src/pages/sc-app-shell.ts) | 应用壳（侧边栏 + 顶部栏 + 主区域） |
| `ScRoleCommander` | [components/role-commander/sc-role-commander.ts](../ui/src/components/role-commander/sc-role-commander.ts) | 角色指挥台 |
| `ScOverview` | [pages/sc-overview.ts](../ui/src/pages/sc-overview.ts) | 安全总览 |
| `ScDashboardCommander` | [components/dashboards/sc-dashboard-commander.ts](../ui/src/components/dashboards/sc-dashboard-commander.ts) | 指挥官仪表盘 |
| `ScDashboardCiso` | [components/dashboards/sc-dashboard-ciso.ts](../ui/src/components/dashboards/sc-dashboard-ciso.ts) | CISO 仪表盘 |
| `ScCommandPalette` | [components/sc-command-palette.ts](../ui/src/components/sc-command-palette.ts) | 命令面板 (⌘K) |
| `ScSettingsPanel` | [components/sc-settings-panel.ts](../ui/src/components/sc-settings-panel.ts) | 设置面板 |
| `ScNotificationCenter` | [components/notification/sc-notification-center.ts](../ui/src/components/notification/sc-notification-center.ts) | 通知中心 |

### 5.3 关键函数

| 函数 | 文件 | 说明 |
|------|------|------|
| `initPrisma(url, poolMax)` | [db/prisma.ts](../packages/core/src/db/prisma.ts) | 初始化 Prisma 客户端 |
| `initRedis(url, prefix)` | [db/redis.ts](../packages/core/src/db/redis.ts) | 初始化 Redis 客户端 |
| `verifyToken(token)` | [auth/jwt.ts](../packages/core/src/auth/jwt.ts) | 验证 JWT |
| `setTokenBlacklistRedis(store, redis)` | [auth/jwt.ts](../packages/core/src/auth/jwt.ts) | 激活 Redis token 黑名单 |
| `initRaciEventBridge(bus, store)` | [events/raci-bridge.ts](../packages/core/src/events/raci-bridge.ts) | RACI 事件桥接 |
| `validateTaskTransition(from, to)` | [capabilities/state-machine.ts](../packages/core/src/capabilities/state-machine.ts) | 任务状态机校验 |

---

## 6. 依赖关系

### 6.1 后端 npm 依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `ws` | ^8.16.0 | WebSocket 服务器 |
| `typedi` | ^0.10.0 | 依赖注入容器 |
| `reflect-metadata` | ^0.2.2 | TypeDI 装饰器元数据 |
| `@prisma/client` | ^7.8.0 | Prisma ORM 客户端 |
| `@prisma/adapter-pg` | ^7.8.0 | PostgreSQL 驱动适配器 |
| `pg` | ^8.21.0 | PostgreSQL 驱动（adapter-pg 底层依赖） |
| `ioredis` | ^5.11.1 | Redis 客户端 |
| `gray-matter` | ^4.0.3 | SKILL.md frontmatter 解析 |
| `yaml` | ^2.3.4 | YAML 配置解析 |
| `express` | ^5.2.1 | HTTP 框架（部分模块使用） |
| `helmet` | ^8.1.0 | HTTP 安全头 |
| `cors` | ^2.8.6 | CORS 中间件 |
| `compression` | ^1.8.1 | HTTP 响应压缩 |
| `morgan` | ^1.10.1 | HTTP 请求日志 |

### 6.2 前端 npm 依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `lit` | ^3.3.2 | Web Components 框架 |
| `zustand` | ^5.0.12 | 状态管理（vanilla 模式） |
| `js-yaml` | ^4.1.1 | YAML 解析 |
| `vite` | ^8.0.0 | 构建工具 + 开发服务器 |

### 6.3 模块间调用链

**典型请求流程**（以"创建事件"为例）：

```
客户端 WebSocket
  → GatewayServer.handleMessage()
    → Router.handleRequest('incident.create', params)
      → handler (from incidents-crud-routes.ts)
        → IncidentsService.create(data)
          → IncidentsRepository.create(record)
            → DualWriteStorage.set('incidents/xxx.json', record)
              → CachedJsonStore.set()  [JSON 先写]
              → PgStorage.set()        [PG 后写]
          → EventBus.emit('incident.created', payload)
            → EventSystem 规则触发
            → RACI 事件桥接 → 创建 RACI 任务
            → GatewayServer.broadcastToAll('incident.created', payload)
              → WebSocket 推送给所有订阅客户端
              → Redis pub/sub → 其他实例推送
```

**依赖方向**（单向，无循环）：

```
main.ts
  → GatewayServer
    → Router
      → Route Handlers
        → Services (RolesService, AIService, ...)
          → Repositories
            → IStorage (DualWriteStorage)
              → CachedJsonStore + PgStorage
          → EventBus
            → EventSystem + Rules
```

---

## 7. 数据存储架构

### 7.1 三种存储模式

#### 模式 1：JSON 文件存储（默认）

```
data/storage/
├── assets.json           — 资产集合（数组）
├── incidents.json        — 事件集合
├── vulnerabilities.json  — 漏洞集合
├── threats.json          — 威胁集合
├── roles.json            — 角色集合
├── users.json            — 用户集合
├── compliance.json       — 合规控制项
├── audit-logs.json       — 审计日志
└── ...                   — 其他模块数据
```

- 每个文件是一个 JSON 数组，包含该模块的所有记录
- `CachedJsonStore` 提供内存缓存 + 写时失效
- 写操作使用 Promise 链式锁（`writeLock`）避免并发写冲突

#### 模式 2：PostgreSQL（Phase 14）

**Prisma Schema**（[prisma/schema.prisma](../packages/core/prisma/schema.prisma)）：

9 张表，采用**混合模式**（强类型查询字段 + Jsonb 全文档）：

| 表 | 强类型字段 | 说明 |
|----|-----------|------|
| `Asset` | id, name, type, category, environment, criticality, status, exposureLevel | 资产 |
| `Vulnerability` | id, cveId, severity, status, cvss | 漏洞 |
| `Incident` | id, ticketId, severity, status | 事件 |
| `Threat` | id, type, confidence | 威胁 |
| `Role` | id, name, code, level | 角色 |
| `User` | id, username, email, status | 用户 |
| `Task` | id, title, status, priority | 任务 |
| `Compliance` | id, framework, controlId, title, status | 合规 |
| `AuditLog` | id, action, resource, actor, timestamp | 审计日志 |

每张表都有 `data Json` 字段存储完整文档，强类型字段从文档中提取用于高效查询。

#### 模式 3：双写过渡（Phase 14）

```
DualWriteStorage
├── primary: CachedJsonStore    ← 默认读源
└── secondary: PgStorage        ← 数据校验后可切换为读源

写路径：JSON先写 → PG后写（失败不阻塞）
读路径：primary（默认）→ 可运行时切换到 secondary
```

**迁移步骤**：

1. 启动 PG + Redis 容器
2. `prisma db push` 创建表结构
3. `bun scripts/migrate-json-to-pg.ts --verify` 迁移数据
4. 启用双写：`DUAL_WRITE_ENABLED=true`
5. 校验通过后切换读路径到 PG
6. 最终废弃 JSON 存储

### 7.2 Redis 用途（集群模式）

| 用途 | Key 模式 | 说明 |
|------|----------|------|
| WebSocket 广播 | `secuclaw:ws:*` | pub/sub 跨实例消息 |
| Token 黑名单 | `secuclaw:bl:{jti}` | TTL = JWT 过期时间 |
| 分布式锁 | `secuclaw:lock:{name}` | SET NX EX + Lua 释放 |
| 缓存（扩展） | `secuclaw:cache:*` | 通用缓存 |

---

## 8. 项目运行方式

### 8.1 环境要求

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Bun >= 1.1.38（后端运行时）
- Docker + Docker Compose（容器化部署）

### 8.2 开发模式

```bash
# 安装依赖
pnpm install

# 同时启动前端 + 后端（并发）
pnpm dev

# 或分别启动
pnpm dev:ui      # 前端：Vite 开发服务器 http://localhost:3200
pnpm dev:core    # 后端：Bun --watch 热重载 ws://localhost:21981
```

### 8.3 生产构建

```bash
# 构建前端 + 后端
pnpm build

# 单独构建
pnpm build:ui    # Vite 构建 → dist/secuclaw.js
pnpm build:core  # Bun 构建 → dist/main.js
```

### 8.4 Docker 部署

```bash
# 启动全部 6 个服务
docker compose up -d

# 服务清单：
# - core:      后端（端口 21981）
# - nginx:     反向代理（端口 80/443）
# - redis:     缓存/集群（端口 6379）
# - postgres:  数据库（端口 5432）
# - prometheus: 监控采集（端口 9090）
# - grafana:   监控面板（端口 3000）
```

### 8.5 数据库命令

```bash
cd packages/core

# 生成 Prisma Client
pnpm db:generate

# 推送 schema 到数据库（创建/更新表）
pnpm db:push

# 创建迁移
pnpm db:migrate

# 打开 Prisma Studio（数据库 GUI）
pnpm db:studio

# JSON → PG 数据迁移（幂等可重放）
pnpm db:migrate-data

# Dry-run（预览不写入）
pnpm db:migrate-data:dry-run

# 迁移 + 验证（校验记录数一致性）
pnpm db:migrate-data:verify
```

### 8.6 环境变量

参考 [.env.example](../.env.example)：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 21981 | 网关端口 |
| `STORAGE_PATH` | ./data/storage | JSON 存储路径 |
| `JWT_SECRET` | （随机生成） | JWT 签名密钥 |
| `DATABASE_URL` | （空） | PostgreSQL 连接串 |
| `DB_POOL_MAX` | 10 | 连接池大小 |
| `DUAL_WRITE_ENABLED` | false | 双写开关 |
| `REDIS_URL` | （空） | Redis 连接串 |
| `REDIS_KEY_PREFIX` | secuclaw: | Redis key 前缀 |
| `LLM_PROVIDER` | openai | 默认 LLM Provider |
| `LLM_API_KEY` | （空） | LLM API 密钥 |
| `AI_ENGINE_MODE` | engine | AI 引擎模式（engine/mock） |

---

## 9. API 与通信协议

### 9.1 WebSocket 消息格式

**统一端口**：`ws://localhost:21981/ws`

**认证**：连接时通过 URL 参数 `?token=<JWT>` 或 `sec-websocket-protocol` header 传递。

#### 请求消息（客户端 → 服务端）

```json
{
  "type": "req",
  "seq": 1,
  "method": "incident.list",
  "params": { "status": "open", "limit": 20 }
}
```

#### 响应消息（服务端 → 客户端）

```json
{
  "type": "res",
  "seq": 1,
  "result": { "items": [...], "total": 42 }
}
```

或错误响应：

```json
{
  "type": "res",
  "seq": 1,
  "error": { "code": "INTERNAL_ERROR", "message": "..." }
}
```

#### 事件订阅

```json
{
  "type": "subscribe",
  "events": ["incident.created", "vulnerability.critical"]
}
```

#### 事件推送（服务端 → 客户端）

```json
{
  "type": "event",
  "event": "incident.created",
  "data": { "incidentId": "INC-001", "severity": "critical", ... }
}
```

#### 批量消息

服务端使用 16ms 窗口聚合响应和事件，减少 WebSocket 帧数：

```json
{
  "type": "batch",
  "messages": [
    { "type": "res", "seq": 1, "result": {...} },
    { "type": "event", "event": "kpi.calculated", "data": {...} }
  ]
}
```

### 9.2 REST API

**基础 URL**：`http://localhost:21981/api/v1/`

每个路由注册文件的 handler 都可以通过 REST 调用：

```bash
# 示例：调用 incident.list 方法
curl -X POST http://localhost:21981/api/v1/incident.list \
  -H "Content-Type: application/json" \
  -d '{"status": "open", "limit": 20}'
```

### 9.3 健康检查

```bash
curl http://localhost:21981/health
```

响应：

```json
{
  "status": "ok",
  "timestamp": 1718352000000,
  "services": {
    "database": { "connected": true, "latency": 2 },
    "redis": { "connected": true, "latency": 1 }
  },
  "clients": 5
}
```

### 9.4 事件桥接

EventBus 的 24 种事件自动桥接到 WebSocket 广播：

```
EventBus.emit('incident.created', payload)
  → GatewayServer.broadcastToAll('incident.created', payload)
    → 本机：所有客户端收到 event 消息
    → Redis pub/sub → 其他实例的客户端也收到
```

---

> **文档维护说明**：本文档基于代码库实际结构编写。当新增模块或修改架构时，请同步更新对应章节。

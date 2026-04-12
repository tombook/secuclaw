## Context

### 当前状态

SecuClaw UI 采用传统功能分类菜单，8 个安全角色被降级为 `/ai-experts` 页面中的 8 个独立聊天窗口。每个角色仅有 Skills 列表和 Chat 功能，没有：

- 角色间的职责分工（谁执行、谁负责、谁咨询、谁知晓）
- 多角色协同处置安全事件的机制
- 基于角色职责的自动化工作流
- 同一数据的多角色分析视角

### 核心约束

- 前端技术栈：Lit Web Components (`sc-*` 前缀)、TypeScript、Vite
- 状态管理：Lit reactive properties + custom stores (`role-context.ts`, `skill-store.ts`)
- 通信：WebSocket Gateway (`gateway-client.ts`)
- 后端：Node.js + TypeScript + Prisma (`packages/core`)
- 角色权限矩阵已定义：`packages/core/src/roles/permissions.ts`
- 角色继承体系已建立：commander > security-expert, security-ops, ciso

### 利益相关者

- 产品创始人：20年+安全专家，定义产品核心价值
- 最终用户：企业安全团队，需要多角色协作处置安全事件

## Goals / Non-Goals

**Goals:**

- 以 RACI 矩阵为底层逻辑，实现 8 个安全角色的职责分工体系
- 以 War Room 为核心界面，实现多角色并行处置安全事件
- 每个角色基于 RACI 职责拥有自动化工作流（预设模板 + AI 触发）
- 同一安全数据支持多角色视角切换
- 全局角色身份系统（角色切换器 + 角色适配仪表盘）

**Non-Goals:**

- Phase 1 不改变后端 API 或数据模型（前端驱动，数据模型在前端定义）
- Phase 1 不实现 AI 多角色自主决策（为 Phase 3）
- 不改变现有权限体系和 Skill/Capability 执行核心逻辑
- 不移除任何现有功能页面

## Decisions

### Decision 1: RACI 矩阵作为协作底层逻辑

**选择**: RACI（Responsible/Accountable/Consulted/Informed）矩阵

**理由**:
- RACI 是项目管理中明确的职责分工工具，避免推诿或重复工作
- 与安全事件处置流程天然契合：每个安全场景需要明确的 R/A/C/I 分工
- 比简单的"角色标签"更精确：同一角色在不同场景中可能是不同 RACI 类型
- 为 War Room 的任务分配提供明确依据

**实现方式**:
```typescript
// ui/src/ui/config/raci-matrix.ts

type RaciRole = 'R' | 'A' | 'C' | 'I';
type RoleId = 'security-expert' | 'privacy-officer' | ... ;
type ScenarioType = 'incident-response' | 'vulnerability-management' | ... ;

interface RaciAssignment {
  role: RoleId;
  raci: RaciRole;
  tasks: string[];  // 该角色在此场景下的具体任务
}

interface RaciScenario {
  id: ScenarioType;
  name: string;
  description: string;
  assignments: RaciAssignment[];
}
```

**替代方案考虑**:
- 简单标签式（每个角色固定标签）→ 不够灵活，同一角色在不同场景职责不同
- 自由协作（无结构化分工）→ 缺乏明确职责边界，容易推诿

### Decision 2: War Room 架构设计

**选择**: 事件驱动的多角色面板布局

**理由**:
- War Room 以安全事件为核心，所有角色围绕同一事件协作
- 每个角色在 War Room 中看到自己的 RACI 职责和相关任务
- Commander 角色拥有调度视图，可以查看所有角色的任务状态

**UI 架构**:
```
┌─────────────────────────────────────────────────────────────┐
│ War Room: 事件 #INC-2026-0042                               │
├─────────────────────────────────────────────────────────────┤
│ ┌─ RACI 概览面板 ─────────────────────────────────────────┐ │
│ │ 🛡️ R  │ ⚙️ R  │ 👔 A  │ 🎯 A(协调) │ 🔐 C │ 📊 I │ │
│ │ 执行  │ 执行  │ 负责  │ 协调      │ 咨询 │ 通知 │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ 角色任务面板（多列并行）──────────────────────────────┐  │
│ │  🛡️ SecExpert    │ ⚙️ SecOps      │ 👔 CISO        │  │
│ │  [R] 分析攻击向量 │ [R] 隔离系统    │ [A] 审批决策    │  │
│ │  [R] 评估影响范围 │ [R] 采集证据    │ [C] 评估合规    │  │
│ │  □ 完成 □ 进行中  │ □ 完成 □ 进行中 │ □ 等待         │  │
│ └──────────────────┴───────────────┴───────────────┘  │
│                                                             │
│ ┌─ 事件时间线 + 角色视角切换 ───────────────────────────┐  │
│ │ [🛡️技术视角] [⚙️运营视角] [👔战略视角] [🎯全局视角]  │  │
│ │ 10:30 ⚙️ 隔离主机 web-prod-03                        │  │
│ │ 10:35 🛡️ 确认攻击向量: Log4Shell exploitation        │  │
│ │ 10:40 👔 评估: 无需监管披露                           │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ 协作聊天 + 工作流建议 ──────────────────────────────┐  │
│ │ 🎯 Commander: 启动应急响应，按 RACI 分配任务          │  │
│ │ 🛡️ SecExpert: 分析完成，发现影响3个系统               │  │
│ │ ⚙️ SecOps: 已隔离，建议执行工作流 [漏洞修复SOP]       │  │
│ └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**替代方案考虑**:
- 单一时间线视图 → 无法并行展示多角色任务
- 纯聊天室 → 缺乏结构化任务管理
- Kanban 看板 → 不适合安全事件的时间敏感性

### Decision 3: 角色工作流引擎设计

**选择**: 基于角色 + 场景的预设模板 + AI 建议触发

**理由**:
- 预设模板确保标准化（基于 20 年安全专家经验）
- AI 建议触发提供灵活性（根据实际事件情况调整）
- 工作流与 RACI 绑定，自动分配给对应角色

**工作流模板结构**:
```typescript
interface RoleWorkflow {
  roleId: RoleId;
  scenarioType: ScenarioType;
  raciRole: RaciRole;  // 该工作流基于什么 RACI 职责
  steps: WorkflowStep[];
  triggerCondition?: string;  // AI 自动触发条件
}

interface WorkflowStep {
  id: string;
  name: string;
  type: 'auto' | 'manual' | 'ai-suggest';
  skillId?: string;  // 关联的 Skill
  dependsOn?: string[];  // 依赖的前置步骤
  notifyRoles?: RoleId[];  // 完成后通知的角色
}
```

### Decision 4: 角色视角视图设计

**选择**: 标签切换式多视角组件

**理由**:
- 同一事件/威胁/漏洞数据，不同角色关注不同维度
- 标签切换成本低，对比直观
- 与 War Room 的时间线视图自然集成

**视角映射**:
| 角色 | 事件视角焦点 | 威胁视角焦点 | 漏洞视角焦点 |
|------|------------|------------|------------|
| 🛡️ SecExpert | 攻击技术分析 | TTP 映射 | 修复方案 |
| ⚙️ SecOps | 响应动作状态 | IOC 指标 | 影响系统 |
| 👔 CISO | 业务影响评估 | 战略风险 | 预算影响 |
| 🎯 Commander | 全局协调状态 | 资源分配 | 优先级排序 |
| 🔐 Privacy | 数据泄露范围 | 隐私风险 | 合规影响 |
| 🏗️ Architect | 架构弱点 | 攻击路径 | 设计缺陷 |
| 📊 BizSec | 业务连续性 | 运营影响 | 恢复时间 |
| 🔗 SupplyChain | 供应链影响 | 第三方风险 | 依赖风险 |

### Decision 5: 全局角色身份系统

**选择**: Header 固定角色指示器 + Context 注入

**理由**:
- 全局位置确保用户始终知道当前身份
- 通过 roleContext 注入，所有组件自适应
- 与 War Room 的角色切换自然衔接

**文件结构**:
```
ui/src/ui/
├── config/
│   ├── raci-matrix.ts          ← RACI 矩阵定义
│   ├── role-workflow-config.ts ← 工作流模板
│   └── role-dashboard-config.ts ← 已存在，需扩展
├── store/
│   ├── raci-store.ts           ← RACI 状态管理 (新增)
│   └── role-context.ts         ← 已存在，需扩展
├── components/
│   ├── sc-raci-matrix-view.ts  ← RACI 矩阵可视化 (新增)
│   ├── sc-role-switcher.ts     ← 已存在，需增强
│   ├── sc-role-perspective.ts  ← 角色视角切换 (新增)
│   └── sc-workflow-panel.ts    ← 工作流面板 (新增)
├── pages/
│   ├── sc-war-room-page.ts     ← War Room 页面 (新增)
│   ├── sc-dashboard.ts         ← 已存在，需重构
│   └── sc-ai-experts-page.ts   ← 已存在，需升级
└── layout/
    ├── sc-header.ts            ← 已存在，需增强
    └── sc-layout.ts            ← 已存在，需调整
```

### Decision 6: 分层实施策略

**选择**: 3 Phase 渐进式

**Phase 1 (前端驱动 — 本 Change 的范围)**:
- RACI 矩阵作为前端数据模型 (`raci-matrix.ts`)
- War Room 为纯前端协作界面
- 工作流为预设模板，通过现有 Gateway 通信
- 角色视角切换为前端组件

**Phase 2 (后端增强 — 后续 Change)**:
- RACI 矩阵持久化到后端数据模型
- War Room 编排引擎（`packages/core/src/commander/`）
- 工作流自动触发机制
- 任务状态实时同步

**Phase 3 (AI 增强 — 后续 Change)**:
- 多角色 AI 协作决策
- AI 自动建议 RACI 分工
- 智能工作流推荐

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| RACI 矩阵定义工作量大（场景 × 角色） | 先定义 Top 5 高频安全场景，逐步扩展 |
| Phase 1 前端驱动，数据不持久化 | sessionStorage + localStorage 缓存，Phase 2 迁移后端 |
| War Room 组件复杂度高 | 分拆为独立子组件（RACI面板、任务面板、时间线、聊天） |
| 多角色并行 UI 布局挑战 | 响应式设计，桌面端多列，移动端折叠为标签 |
| 角色切换影响全局状态 | 通过 roleContext 统一管理，组件订阅响应式更新 |

## Migration Plan

### Phase 1 实施顺序

1. **RACI 数据层** — 创建 `raci-matrix.ts` + `raci-store.ts` + `role-workflow-config.ts`
2. **全局角色身份** — 增强 `sc-role-switcher.ts` + 扩展 `role-context.ts`
3. **角色视角组件** — 创建 `sc-role-perspective.ts`
4. **War Room 核心** — 创建 `sc-war-room-page.ts`（RACI 面板 + 任务面板 + 时间线）
5. **工作流面板** — 创建 `sc-workflow-panel.ts`，集成到 War Room
6. **仪表盘重构** — 重构 `sc-dashboard.ts` 为 RACI 感知型
7. **AI Experts 升级** — 升级 `sc-ai-experts-page.ts` 添加 RACI 概览

### Rollback

- 所有新组件独立创建，不修改现有组件核心逻辑
- 通过 Feature Flag 控制 War Room 入口
- 出现问题可隐藏新入口，回退到现有 UI

## Open Questions

1. **RACI 矩阵的初始场景范围** — Phase 1 先覆盖哪些安全场景？（建议：事件响应、漏洞管理、威胁处置、合规审计、供应链事件）
2. **War Room 的角色上限** — 一个 War Room 最多同时激活几个角色？（建议：全部 8 个，但 UI 折叠低活跃角色）
3. **工作流模板的 AI 触发时机** — Phase 1 的 AI 建议是基于关键词匹配还是调用 LLM？（建议：先用关键词匹配，降低复杂度）
4. **角色视角的数据源** — Phase 1 的多视角是前端 Mock 数据还是对接现有 API？（建议：对接现有 incidents/threats/vulnerabilities API）

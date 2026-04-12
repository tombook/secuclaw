## Why

SecuClaw 当前将 8 个安全角色降级为独立聊天窗口（`/ai-experts` 页面），每个"专家"本质上是一个带不同 system prompt 的 ChatBot，角色之间没有协作、没有职责分工、数据不流通。这无法体现"20年+顶级安全专家协作"的产品核心价值。

真实安全场景中，一个安全事件需要多个专家各司其职协同处置——这正是 RACI 矩阵（Responsible 执行 / Accountable 负责 / Consulted 咨询 / Informed 通知）的核心价值。将 RACI 矩阵融入 8 个安全角色的协作体系，使每个角色清楚识别自己在每个场景中的 RACI 职责，才能实现真正的多角色协同。

## What Changes

1. **RACI 矩阵数据模型** — 为每个安全场景类型定义 8 个角色的 RACI 职责分工矩阵
2. **War Room 协作界面** — 多角色并行处置安全事件的核心协作空间，基于 RACI 矩阵自动分配任务
3. **角色自动化工作流** — 每个角色基于其 RACI 职责拥有预设工作流模板 + AI 自动触发机制
4. **角色视角切换** — 同一安全数据在不同角色视角下呈现不同分析维度（辅助功能）
5. **全局角色身份系统** — 顶部角色切换器 + 角色适配型仪表盘（辅助功能）

## Capabilities

### New Capabilities

- `raci-matrix`: RACI 矩阵数据模型，定义 8 个安全角色在每个安全场景类型中的职责分工（R/A/C/I）
- `war-room-collaboration`: War Room 多角色协作界面，基于 RACI 矩阵实现任务分配、并行处置、状态同步
- `role-workflow-engine`: 角色自动化工作流引擎，基于 RACI 职责生成预设模板和触发条件
- `role-perspective-view`: 角色视角视图组件，同一安全数据不同角色的分析维度展示
- `role-expertise-showcase`: 角色专业能力展示页（含 RACI 职责概览、技能雷达图、覆盖范围可视化）
- `role-identity-system`: 全局角色身份系统（角色切换器、角色适配仪表盘、角色主题）

### Modified Capabilities

- `role-context`: 扩展角色上下文，增加当前 RACI 职责状态和 War Room 会话信息
- `role-dashboard`: 重构仪表盘为 RACI 感知型，根据当前角色展示其 R/A/C/I 相关任务
- `skill-executor`: 扩展 Skill 执行器，支持 RACI 工作流模板触发

## Non-goals

- **不改变后端数据模型或 API**（Phase 1 前端驱动，Phase 2 再增强后端）
- **不实现 AI 多角色自主决策**（Phase 3 范畴，Phase 1/2 为人工+模板驱动）
- **不改变现有权限体系**（`packages/core/src/roles/permissions.ts` 保持不变）
- **不移除任何现有功能页面**（旧版菜单和 AI Experts 页保留）
- **不改变 Skill/Capability 定义和执行机制的核心逻辑**

## Impact

### 前端 (ui/)
- `ui/src/ui/pages/sc-war-room-page.ts` — War Room 新页面
- `ui/src/ui/pages/sc-dashboard.ts` — 仪表盘重构为 RACI 感知型
- `ui/src/ui/pages/sc-ai-experts-page.ts` — 升级为角色专业能力展示 + RACI 概览
- `ui/src/ui/components/` — 新增 RACI 矩阵组件、角色视角切换组件、工作流面板
- `ui/src/ui/config/raci-matrix.ts` — RACI 矩阵配置数据
- `ui/src/ui/config/role-workflow-config.ts` — 角色工作流模板配置
- `ui/src/ui/store/raci-store.ts` — RACI 状态管理
- `ui/src/ui/store/role-context.ts` — 扩展角色上下文
- `ui/src/ui/layout/` — 全局角色身份栏

### 后端 (packages/core/) — Phase 2
- `packages/core/src/commander/` — War Room 编排引擎
- `packages/core/src/roles/` — RACI 角色定义
- `packages/core/src/tasks/` — RACI 任务分配
- `packages/core/src/skills/` — 工作流模板绑定

### 数据
- RACI 矩阵定义（按安全场景类型 × 8 角色的职责矩阵）
- 角色工作流模板（每个角色的预设自动化动作序列）
- War Room 会话数据（多角色协作状态）

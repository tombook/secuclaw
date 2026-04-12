## Why

Phase 1 将 RACI 多角色协作平台的前端已完成（War Room 页面、角色视角、技能雷达等），但所有 RACI 任务分配、工作流状态管理和角色协作逻辑都在前端本地管理。这意味着：
- 工作流状态无法持久化（刷新即丢失）
- 多用户无法实时协作（各自独立状态）
- AI 无法根据 RACI 矩阵自动触发任务分配和角色交接
- 事件驱动的安全响应流程无法跨角色编排

Phase 2 需要将 RACI 协作引擎移到后端，使 War Room 成为真正的多角色协同中心。

## What Changes

- **新增 RACI 任务编排引擎**：基于 RACI 矩阵的服务端任务分配、状态机、角色交接
- **新增 War Room 会话管理**：持久化的 War Room 会话，支持多用户加入、实时事件同步
- **新增 RACI 事件总线**：服务端事件驱动架构，根据 RACI 矩阵自动触发角色通知和任务创建
- **新增 WebSocket 协作通道**：实时推送任务分配、状态变更、角色交接、AI 建议等事件
- **修改 War Room 前端**：从本地状态管理切换为后端 API 驱动
- **修改工作流引擎**：从前端模板驱动升级为后端状态机驱动

## Capabilities

### New Capabilities
- `raci-task-engine`: RACI 任务编排引擎 — 基于矩阵自动分配任务、状态机管理、角色交接逻辑
- `war-room-session`: War Room 会话管理 — 持久化会话创建/加入/离开、参与者管理、事件时间线
- `raci-event-bus`: RACI 事件总线 — 基于 EventBus 的服务端事件系统，根据 RACI 矩阵自动路由事件到对应角色
- `collaboration-websocket`: 协作 WebSocket 通道 — 实时推送 War Room 事件、任务变更、角色交接通知

### Modified Capabilities
- `war-room-collaboration`: 从前端本地状态管理升级为后端 API 驱动，消费新的 WebSocket 协作通道
- `role-workflow-engine`: 从前端模板驱动升级为后端状态机驱动，支持持久化和多用户

## Impact

- **Backend**: `packages/core/src/` 新增 raci/ 模块（任务引擎、会话管理、事件总线）
- **Backend Gateway**: 新增 WebSocket 协作通道路由（warroom.* 命名空间）
- **Backend Services**: 集成 incidents/vulnerabilities/threats 服务，实现事件驱动的任务创建
- **Frontend**: War Room 页面重构，从 `raci-store` 本地状态切换为后端 API
- **Frontend Store**: `raci-store.ts` 从本地 store 改为 WebSocket 订阅驱动
- **Dependencies**: 无新外部依赖，复用现有 EventBus + WebSocket 基础设施
- **Data Storage**: 新增 `warroom-sessions.json`, `raci-tasks.json` 数据文件

## Non-goals

- 不实现 AI 多角色自主决策（Phase 3）
- 不实现用户认证多租户隔离（使用现有单用户模式）
- 不实现历史版本回滚（仅保留事件时间线记录）
- 不重构现有 WebSocket 协议（仅新增 warroom.* 命名空间）

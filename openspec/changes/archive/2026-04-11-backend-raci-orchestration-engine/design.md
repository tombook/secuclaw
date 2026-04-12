## Context

Phase 1 完成了前端 RACI 多角色协作平台的所有 UI 组件：`sc-war-room-page.ts`（War Room 主页面）、`raci-store.ts`（前端 RACI 状态）、`role-workflow-config.ts`（工作流模板）、`raci-matrix.ts`（矩阵数据）。当前所有 RACI 逻辑在前端本地管理，工作流状态仅存于组件属性和 localStorage。

后端已有的基础设施：
- `packages/core/src/events/` — EventBus + EventRule 系统（事件驱动架构已就绪）
- `packages/core/src/gateway/` — 统一网关（WebSocket + REST API，端口 21981）
- `packages/core/src/incidents/`、`vulnerabilities/`、`threats/` — 安全服务模块
- `packages/core/src/roles/permissions.ts` — 8 角色权限矩阵
- `packages/core/src/storage/json-store.ts` — JSON 文件持久化

前端已有的基础设施：
- `ui/src/ui/gateway-client.ts` — WebSocket 客户端（支持 on/off/emit 事件订阅）
- `ui/src/ui/store/raci-store.ts` — RACI 状态 store（需改为后端驱动）
- `ui/src/ui/pages/sc-war-room-page.ts` — War Room 页面（需重构为后端消费）

## Goals / Non-Goals

**Goals:**
- 将 RACI 任务编排从前端移到后端，实现状态持久化
- 实现基于 RACI 矩阵的自动任务分配和角色交接
- 建立 War Room 会话管理，支持事件时间线
- 实时 WebSocket 推送协作事件
- 前端 War Room 从本地状态切换为后端 API 消费

**Non-Goals:**
- AI 多角色自主决策（Phase 3）
- 多租户用户隔离
- 历史版本回滚
- 重构现有 WebSocket 协议

## Decisions

### Decision 1: RACI 任务引擎 — 状态机模式

**选择**: 基于 RACI 矩阵的状态机（finite state machine），每个任务有明确的 status 流转。

**替代方案**: 
- 纯事件驱动（无状态机）→ 无法追踪任务生命周期，难以实现角色交接
- 工作流引擎（BPMN）→ 过于复杂，当前不需要可视化流程编辑

**方案**: 
```
任务状态: created → assigned → in_progress → pending_handoff → completed
                                                  ↓
                                            escalated → in_progress
```

每个状态变更触发 RACI 事件，自动通知下一个 Responsible 角色。状态机逻辑在 `packages/core/src/raci/task-engine.ts`。

### Decision 2: 数据持久化 — JsonStore（复用现有）

**选择**: 使用现有 `JsonStore` 存储 `raci-tasks.json` 和 `warroom-sessions.json`。

**替代方案**:
- SQLite → 当前阶段过重，项目其他模块也用 JsonStore
- 内存存储 → 刷新丢失，不满足持久化需求

**方案**: 复用 `packages/core/src/storage/json-store.ts`，新增两个数据文件。Task 和 Session 有完整的 CRUD 接口。

### Decision 3: WebSocket 协作通道 — warroom.* 命名空间

**选择**: 在现有 Gateway Router 上注册 `warroom.*` 命名空间的方法，复用现有 WebSocket 连接。

**替代方案**:
- 独立 WebSocket 服务器 → 需要新端口，违反统一网关架构
- SSE（Server-Sent Events）→ 单向，不适合协作场景

**方案**: 
```
WebSocket methods (warroom.*):
- warroom.createSession
- warroom.joinSession
- warroom.leaveSession  
- warroom.listSessions
- warroom.getSession
- warroom.assignTask
- warroom.updateTask
- warroom.completeTask
- warroom.getTimeline
- warroom.sendMessage
- warroom.subscribe (事件订阅)
```

前端通过 `gatewayClient.on('warroom.*')` 订阅实时事件。

### Decision 4: 事件路由 — RACI 矩阵驱动

**选择**: 根据 RACI 矩阵的 R/A/C/I 定义，自动路由事件到对应角色。

**方案**:
- **R (Responsible)**: 必须接收任务通知，可更新任务状态
- **A (Accountable)**: 接收关键决策通知（状态变更、完成、升级）
- **C (Consulted)**: 接收信息通知，可提供建议
- **I (Informed)**: 接收进度更新通知

每个安全事件（incident/vulnerability/threat）创建时，自动根据事件类型匹配 RACI 场景，创建对应的 War Room 会话并分配任务。

### Decision 5: 前端重构策略 — 渐进式迁移

**选择**: 前端 War Room 页面保持现有结构，将 `raci-store.ts` 从本地 store 改为 WebSocket 订阅驱动。

**方案**:
- `raci-store.ts` 改为订阅 `warroom.*` WebSocket 事件
- `sc-war-room-page.ts` 调用后端 API 获取会话/任务数据
- 保留前端缓存和乐观更新
- 现有配置文件（`raci-matrix.ts`、`role-workflow-config.ts`）保持不变，仅数据源切换

## Risks / Trade-offs

- **[JsonStore 并发]** → 当前单用户场景风险低，多用户时需加文件锁 → Mitigation: 使用内存缓存 + 定时刷盘
- **[WebSocket 断连]** → 实时事件可能丢失 → Mitigation: 前端重连后调用 `warroom.getSession` 同步最新状态
- **[前端重构范围]** → War Room 页面较大（1100+ 行）→ Mitigation: 保持组件结构不变，仅替换数据源
- **[RACI 矩阵硬编码]** → 当前 5 个场景固定 → Mitigation: 设计可扩展的 scenario 配置接口，Phase 3 可 AI 动态生成

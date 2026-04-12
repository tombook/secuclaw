## ADDED Requirements

### Requirement: War Room WebSocket 方法注册
系统 SHALL 在 Gateway Router 上注册 `warroom.*` 和 `raci.*` 命名空间的所有 WebSocket 方法。

#### Scenario: WebSocket 方法可用
- **WHEN** 后端启动完成
- **THEN** 以下 WebSocket 方法 SHALL 可用：`warroom.createSession`、`warroom.joinSession`、`warroom.leaveSession`、`warroom.listSessions`、`warroom.getSession`、`warroom.getTimeline`、`warroom.sendMessage`、`warroom.subscribe`、`raci.task.create`、`raci.task.list`、`raci.task.updateStatus`、`raci.task.assign`

### Requirement: 实时事件推送
系统 SHALL 通过 WebSocket 实时推送 War Room 协作事件给订阅的客户端。

#### Scenario: 任务分配推送
- **WHEN** 系统为角色 R 创建新任务
- **THEN** 所有订阅了该角色的客户端收到 `warroom.task.assigned` 事件，包含任务详情

#### Scenario: 会话状态变更推送
- **WHEN** 会话状态变更（新参与者、任务完成、角色交接）
- **THEN** 所有订阅该会话的客户端收到对应事件

#### Scenario: 断连恢复
- **WHEN** 前端 WebSocket 断连后重连
- **THEN** 前端调用 `warroom.getSession` 同步最新会话状态，无需重新创建会话

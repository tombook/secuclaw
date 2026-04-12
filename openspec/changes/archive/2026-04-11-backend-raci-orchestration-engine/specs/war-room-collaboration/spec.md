## MODIFIED Requirements

### Requirement: War Room 数据源从本地切换为后端 API
War Room 页面 SHALL 通过 WebSocket API 消费后端 RACI 数据，而非前端本地 raci-store 管理。

#### Scenario: 加载 War Room 数据
- **WHEN** 用户打开 War Room 页面
- **THEN** 页面调用 `warroom.getSession` 获取会话数据，调用 `raci.task.list` 获取任务列表，调用 `warroom.getTimeline` 获取时间线

#### Scenario: 实时更新
- **WHEN** 其他用户在同一个 War Room 会话中操作（分配任务、发送消息、状态变更）
- **THEN** 当前用户的页面通过 WebSocket 事件实时更新，无需手动刷新

### Requirement: raci-store 改为 WebSocket 订阅驱动
`raci-store.ts` SHALL 改为通过 `gatewayClient.on('warroom.*')` 订阅后端事件来更新状态。

#### Scenario: 订阅 War Room 事件
- **WHEN** raci-store 初始化
- **THEN** store 订阅 `warroom.task.*`、`warroom.message`、`warroom.participant.*` 事件，收到事件后更新 store 状态

#### Scenario: 取消订阅
- **WHEN** 用户离开 War Room 页面
- **THEN** raci-store 取消所有 WebSocket 事件订阅

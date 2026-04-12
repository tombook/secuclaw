## ADDED Requirements

### Requirement: RACI 事件路由
系统 SHALL 根据事件类型和 RACI 矩阵自动路由事件到对应角色（R/A/C/I）。

#### Scenario: 安全事件触发 RACI 通知
- **WHEN** 系统收到 `incident.created`、`vulnerability.created` 或 `threat.detected` 事件
- **THEN** 系统匹配 RACI 场景，为 R 角色发送任务通知，为 A 角色发送决策通知，为 C/I 角色发送信息通知

#### Scenario: 角色交接事件路由
- **WHEN** 任务状态变为 `pending_handoff` 并指定 nextRole
- **THEN** 系统路由 `raci.task.handoff` 事件到 nextRole 的 R 通道，同时通知原角色的 A 通道

### Requirement: 事件订阅与分发
系统 SHALL 支持按角色订阅事件，实时分发到 WebSocket 客户端。

#### Scenario: 角色订阅
- **WHEN** 前端通过 `warroom.subscribe` 提交角色ID 和关注的事件类型
- **THEN** 系统注册订阅，后续该角色相关的事件实时推送

#### Scenario: 事件过滤
- **WHEN** 系统产生一个 RACI 事件
- **THEN** 系统根据事件类型和订阅信息，仅推送给订阅了该事件类型的角色客户端

## ADDED Requirements

### Requirement: RACI 任务创建与分配
系统 SHALL 根据安全事件类型自动匹配 RACI 场景，为 Responsible 角色创建任务。任务数据 SHALL 持久化到 `raci-tasks.json`。

#### Scenario: 安全事件自动创建 RACI 任务
- **WHEN** 一个新的安全事件（incident/vulnerability/threat）被创建
- **THEN** 系统根据事件类型匹配 RACI 场景，为 R（Responsible）角色自动创建任务，任务状态为 `assigned`

#### Scenario: 手动创建任务
- **WHEN** 用户通过 `raci.task.create` 方法提交任务（指定 scenario、title、assignedRole）
- **THEN** 系统创建任务并持久化，任务状态为 `created`，触发 `raci.task.created` 事件

### Requirement: 任务状态机管理
系统 SHALL 实现任务状态机：`created → assigned → in_progress → pending_handoff → completed`，以及 `escalated` 分支。每次状态变更 SHALL 触发对应的 RACI 事件。

#### Scenario: 任务状态流转
- **WHEN** Responsible 角色用户通过 `raci.task.updateStatus` 将任务从 `assigned` 更新为 `in_progress`
- **THEN** 系统更新任务状态、记录时间线事件、通知 Accountable 角色

#### Scenario: 任务角色交接
- **WHEN** 任务状态变更为 `pending_handoff` 且指定 nextRole
- **THEN** 系统为 nextRole 创建新任务（状态 `assigned`），原任务标记为 `completed`，触发 `raci.task.handoff` 事件

#### Scenario: 任务升级
- **WHEN** 任务状态变更为 `escalated` 且指定 escalationLevel
- **THEN** 系统根据角色层级（secuclaw-commander > ciso > security-expert）向上级角色通知

### Requirement: 任务查询与过滤
系统 SHALL 支持按角色、场景、状态、会话ID 过滤任务列表。

#### Scenario: 按角色查询任务
- **WHEN** 用户通过 `raci.task.list` 请求指定角色的任务
- **THEN** 系统返回该角色为 R/A 的所有任务，按创建时间倒序

#### Scenario: 按会话查询任务
- **WHEN** 用户通过 `raci.task.list` 请求指定 sessionId 的任务
- **THEN** 系统返回该会话关联的所有任务

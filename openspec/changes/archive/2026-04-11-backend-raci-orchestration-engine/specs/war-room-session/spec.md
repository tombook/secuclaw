## ADDED Requirements

### Requirement: War Room 会话创建
系统 SHALL 支持创建 War Room 会话，关联安全事件和 RACI 场景。会话数据 SHALL 持久化到 `warroom-sessions.json`。

#### Scenario: 从安全事件创建会话
- **WHEN** 用户通过 `warroom.createSession` 提交事件ID、事件类型、RACI 场景类型
- **THEN** 系统创建会话、设置初始参与者（基于 RACI 矩阵的 R/A 角色）、返回会话详情

#### Scenario: 手动创建空会话
- **WHEN** 用户通过 `warroom.createSession` 仅提交 title 和 scenarioType
- **THEN** 系统创建无关联事件的会话，用户后续可手动添加事件

### Requirement: 会话参与管理
系统 SHALL 支持用户加入/离开 War Room 会话，记录参与者列表和角色。

#### Scenario: 加入会话
- **WHEN** 用户通过 `warroom.joinSession` 提交 sessionId 和当前角色
- **THEN** 系统将用户添加到参与者列表，广播 `warroom.participant.joined` 事件

#### Scenario: 离开会话
- **WHEN** 用户通过 `warroom.leaveSession` 提交 sessionId
- **THEN** 系统从参与者列表移除用户，广播 `warroom.participant.left` 事件

### Requirement: 会话事件时间线
系统 SHALL 记录会话内所有事件（任务变更、角色交接、消息、状态更新）为时间线条目。

#### Scenario: 获取时间线
- **WHEN** 用户通过 `warroom.getTimeline` 请求指定 sessionId 的时间线
- **THEN** 系统返回按时间排序的事件列表，每条包含 timestamp、eventType、actor、details

#### Scenario: 发送协作消息
- **WHEN** 用户通过 `warroom.sendMessage` 发送消息到会话
- **THEN** 系统记录消息到时间线、广播 `warroom.message` 事件给所有参与者

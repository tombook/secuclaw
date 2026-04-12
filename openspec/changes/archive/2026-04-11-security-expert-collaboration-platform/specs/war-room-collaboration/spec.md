## ADDED Requirements

### Requirement: War Room 页面创建
系统 SHALL 提供 War Room 页面（`/war-room/:eventId`），作为多角色协作处置安全事件的核心界面。

#### Scenario: 从事件列表进入 War Room
- **WHEN** 用户在事件列表页面点击某个安全事件的"启动 War Room"按钮
- **THEN** 系统 SHALL 导航到 War Room 页面，加载该事件详情和 RACI 矩阵

#### Scenario: War Room 页面布局
- **WHEN** War Room 页面渲染完成
- **THEN** 页面 SHALL 包含以下区域：RACI 概览面板、角色任务面板、事件时间线、协作聊天区、工作流建议区

### Requirement: War Room 角色任务面板
系统 SHALL 在 War Room 中为每个参与角色展示独立的任务面板，显示该角色基于 RACI 职责的具体任务。

#### Scenario: 多角色并行任务展示
- **WHEN** War Room 加载完成
- **THEN** 任务面板 SHALL 以多列布局展示所有 RACI 职责为 R（执行）或 A（负责）的角色任务列

#### Scenario: 任务状态更新
- **WHEN** 用户标记某个任务为"已完成"
- **THEN** 系统 SHALL 更新任务状态，并通过事件时间线通知其他角色

#### Scenario: Commander 调度视图
- **WHEN** 当前角色为 secuclaw-commander
- **THEN** 任务面板 SHALL 展示所有角色的任务状态总览，而非仅单个角色任务

### Requirement: War Room 事件时间线
系统 SHALL 在 War Room 中展示事件处置时间线，记录所有角色的操作动作和决策。

#### Scenario: 时间线记录角色操作
- **WHEN** 任何角色完成一个任务或执行一个操作
- **THEN** 时间线 SHALL 记录该操作，包含角色标识、时间戳、操作描述

#### Scenario: 时间线角色视角过滤
- **WHEN** 用户切换角色视角
- **THEN** 时间线 SHALL 过滤展示该角色视角相关的事件记录

### Requirement: War Room 协作聊天
系统 SHALL 在 War Room 中提供多角色协作聊天区域。

#### Scenario: 角色身份聊天
- **WHEN** 用户在 War Room 聊天区发送消息
- **THEN** 消息 SHALL 携带当前角色标识（emoji + 角色名称），其他协作者可识别消息来源角色

#### Scenario: 工作流建议触发
- **WHEN** 聊天中出现与 RACI 工作流关键词匹配的内容
- **THEN** 系统 SHALL 在聊天区下方展示相关的工作流建议卡片

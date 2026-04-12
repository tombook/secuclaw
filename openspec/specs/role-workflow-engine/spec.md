## ADDED Requirements

### Requirement: 角色工作流模板定义
系统 SHALL 为每个安全角色在每个安全场景中定义预设工作流模板，基于该角色的 RACI 职责。

#### Scenario: 工作流模板加载
- **WHEN** War Room 初始化时
- **THEN** 系统 SHALL 根据当前事件场景类型，为每个角色加载对应的工作流模板

#### Scenario: 工作流步骤结构
- **WHEN** 展示某个角色的工作流
- **THEN** 每个工作流步骤 SHALL 包含：步骤名称、类型（auto/manual/ai-suggest）、关联的 Skill ID、前置依赖步骤、完成后通知的角色列表

### Requirement: 工作流步骤执行
系统 SHALL 支持用户逐步执行工作流中的步骤。

#### Scenario: 手动步骤执行
- **WHEN** 用户点击工作流中的"manual"类型步骤
- **THEN** 系统 SHALL 标记该步骤为"进行中"，等待用户完成操作后手动标记完成

#### Scenario: 自动步骤执行
- **WHEN** 工作流中的"auto"类型步骤的前置依赖全部完成
- **THEN** 系统 SHALL 自动执行该步骤（通过调用关联的 Skill），并更新步骤状态

#### Scenario: AI 建议步骤展示
- **WHEN** 工作流中的"ai-suggest"类型步骤到达
- **THEN** 系统 SHALL 展示 AI 建议面板，列出可选操作供用户确认执行

### Requirement: 工作流状态持久化
系统 SHALL 将工作流执行状态保存到 sessionStorage。

#### Scenario: 页面刷新后恢复
- **WHEN** 用户刷新 War Room 页面
- **THEN** 系统 SHALL 从 sessionStorage 恢复所有工作流的执行状态

#### Scenario: 工作流完成后清理
- **WHEN** 所有工作流步骤完成
- **THEN** 系统 SHALL 生成完成报告，并在事件时间线中记录工作流完成事件

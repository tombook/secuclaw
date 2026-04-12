## ADDED Requirements

### Requirement: Role Automation Workflows
系统 SHALL 为每个安全角色提供基于 RACI.md 设计的预设自动化工作流模板。

#### Scenario: Workflow template selection
- **WHEN** 用户在 War Room 中选择安全角色
- **THEN** 系统显示该角色对应的预设自动化工作流模板（基于 RACI.md）

#### Scenario: Workflow execution
- **WHEN** 用户选择并启动自动化工作流模板
- **THEN** 系统按预设步骤执行工作流，包括：
  - 调用对应角色的技能
  - 生成分析报告
  - 记录执行过程

#### Scenario: Workflow customization
- **WHEN** 用户需要调整预设工作流
- **THEN** 系统允许用户自定义工作流步骤、参数和触发条件

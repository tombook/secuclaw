## MODIFIED Requirements

### Requirement: 工作流从模板驱动升级为状态机驱动
工作流引擎 SHALL 从前端静态模板（`role-workflow-config.ts`）升级为后端状态机驱动，支持持久化和多用户。

#### Scenario: 后端工作流步骤执行
- **WHEN** 用户在 War Room 中执行工作流步骤
- **THEN** 步骤状态通过 `raci.task.updateStatus` 提交到后端，后端更新状态机并持久化

#### Scenario: 工作流步骤自动分配
- **WHEN** 当前工作流步骤完成且存在下一步骤
- **THEN** 后端根据 RACI 矩阵自动为下一步骤的 Responsible 角色创建任务

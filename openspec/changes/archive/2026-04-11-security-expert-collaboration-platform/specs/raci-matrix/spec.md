## ADDED Requirements

### Requirement: RACI 矩阵数据模型定义
系统 SHALL 定义 RACI 矩阵数据模型，为每个安全场景类型明确 8 个安全角色的 RACI（Responsible/Accountable/Consulted/Informed）职责分工。

#### Scenario: 定义安全场景的 RACI 矩阵
- **WHEN** 系统初始化时加载 RACI 矩阵配置
- **THEN** 每个安全场景类型（incident-response, vulnerability-management, threat-response, compliance-audit, supply-chain-incident）SHALL 包含所有 8 个安全角色的 RACI 职责分配

#### Scenario: RACI 角色类型定义
- **WHEN** 查询某个角色在特定场景中的职责
- **THEN** 系统 SHALL 返回以下之一：R（执行）、A（负责）、C（咨询）、I（通知），以及该职责下的具体任务描述

### Requirement: RACI 矩阵角色查询
系统 SHALL 支持按角色和按场景两种维度查询 RACI 矩阵。

#### Scenario: 按角色查询所有场景职责
- **WHEN** 用户选择一个安全角色（如 security-expert）
- **THEN** 系统 SHALL 返回该角色在所有安全场景中的 RACI 职责列表

#### Scenario: 按场景查询所有角色分工
- **WHEN** 用户进入一个安全场景（如 incident-response）
- **THEN** 系统 SHALL 返回所有 8 个安全角色在该场景中的 RACI 职责分配

### Requirement: RACI 矩阵可视化组件
系统 SHALL 提供 RACI 矩阵可视化组件，以矩阵表格形式展示角色 × 场景的职责分工。

#### Scenario: 在 War Room 中展示 RACI 概览
- **WHEN** 用户进入 War Room 页面
- **THEN** 页面顶部 SHALL 展示 RACI 概览面板，以紧凑形式显示当前事件场景下所有角色的 R/A/C/I 分工

#### Scenario: 角色高亮当前职责
- **WHEN** 用户在 War Room 中以某个角色身份操作
- **THEN** RACI 面板中该角色的 RACI 职责 SHALL 高亮显示，其他角色职责淡化

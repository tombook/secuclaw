## ADDED Requirements

### Requirement: 角色专业能力展示页
系统 SHALL 升级 AI Experts 页面为角色专业能力展示中心，展示每个角色的技能雷达图、MITRE/SCF 覆盖范围和 RACI 职责概览。

#### Scenario: 角色能力总览
- **WHEN** 用户进入角色专业能力展示页
- **THEN** 系统 SHALL 以卡片网格形式展示所有 8 个安全角色，每个卡片包含：角色 emoji、角色名称、核心能力摘要

#### Scenario: 角色详情展开
- **WHEN** 用户点击某个角色卡片
- **THEN** 系统 SHALL 展示该角色的详细能力页面，包含：6 维技能雷达图、MITRE ATT&CK 覆盖标签、SCF 控制覆盖标签、RACI 职责概览

### Requirement: 技能雷达图组件
系统 SHALL 提供 SVG 技能雷达图组件，展示角色的 6 维技能分布。

#### Scenario: 雷达图渲染
- **WHEN** 角色详情页加载
- **THEN** 系统 SHALL 渲染 6 维（Light/Dark/Security/Legal/Technology/Business）雷达图，各维度数值基于技能列表长度计算

#### Scenario: 角色间雷达图对比
- **WHEN** 用户选择"对比模式"
- **THEN** 系统 SHALL 在同一雷达图上叠加多个角色的技能分布，用不同颜色区分

### Requirement: RACI 职责概览展示
系统 SHALL 在角色专业能力展示页中展示该角色在所有安全场景中的 RACI 职责概览。

#### Scenario: 角色跨场景 RACI 概览
- **WHEN** 用户查看某个角色的详情
- **THEN** 系统 SHALL 展示该角色在所有已定义安全场景中的 RACI 职责类型（以标签形式：执行/负责/咨询/通知）

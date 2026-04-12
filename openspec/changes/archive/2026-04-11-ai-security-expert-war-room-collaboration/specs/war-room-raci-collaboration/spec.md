## ADDED Requirements

### Requirement: War Room RACI Collaboration
系统 SHALL 提供基于 RACI 矩阵的多角色协作中心，支持 8 个安全角色协同处置安全事件。

#### Scenario: Security incident triggers War Room
- **WHEN** 系统检测到安全事件（如入侵、漏洞、威胁）
- **THEN** 系统自动创建 War Room 会话，并根据事件类型自动分配 RACI 角色

#### Scenario: Role identifies RACI position
- **WHEN** 用户进入 War Room 并选择安全角色
- **THEN** 系统显示该角色在当前事件 RACI 矩阵中的位置（R/A/C/I）

#### Scenario: RACI role collaboration phases
- **WHEN** War Room 会话进行中
- **THEN** 系统按顺序执行以下协作阶段：
  1. **分析阶段 (R-role)**: 负责人角色分析事件
  2. **咨询阶段 (C-role)**: 咨询角色补充意见（并行）
  3. **决策阶段 (A-role)**: 负责角色做出最终决策
  4. **汇总阶段 (Commander)**: 安全指挥官生成综合方案
  5. **通知阶段 (I-role)**: 通知角色接收结果

#### Scenario: Real-time chat and timeline
- **WHEN** War Room 会话活跃
- **THEN** 系统提供实时聊天功能和协作时间线，记录各角色的操作和发言

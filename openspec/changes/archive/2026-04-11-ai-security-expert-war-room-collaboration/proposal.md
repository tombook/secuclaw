## Why

当前 SecuClaw UI 的业务功能分布与规划不合理，未能体现 8 个安全角色的创新性产品价值。产品设计不应简单呈现为 8 个独立的智能体 Agents，而应基于 20 年以上顶级安全专家的综合经验，构建以角色为中心、以 RACI 矩阵为协作框架的 AI 安全工程系统。

## What Changes

- 重新规划产品设计（非基于现有 security-role-centered-ui-redesign 迭代）
- 优先实现「多角色协作 War Room」（而非角色视角切换）
- 基于 RACI.md 设计各角色的自动化工作流预设模板
- 基于 RACI.md 实现 AI 自动触发机制
- 各角色需识别自身在 RACI 矩阵中的位置，并使用对应角色的 RACI 矩阵 Skills
- 重新设计 UI 以体现 8 个安全角色的专业身份与协作价值

## Capabilities

### New Capabilities
- `war-room-raci-collaboration`: 基于 RACI 矩阵的多角色协作中心
- `role-automation-workflows`: 各安全角色的预设自动化工作流（基于 RACI.md）
- `ai-trigger-engine`: AI 自动触发机制（基于 RACI.md）
- `raci-matrix-skills`: 8 个角色的 RACI 矩阵技能库
- `role-identity-immersive`: 8 个安全角色的沉浸式身份体验

### Modified Capabilities
（无现有能力的需求变更，此为重规划项目）

## Non-goals

- 不简单实现 8 个独立的聊天智能体
- 不在现有 security-role-centered-ui-redesign 基础上迭代
- 不优先实现角色视角切换功能
- 不简化 RACI 矩阵的角色责任定义

## Impact

- **Frontend UI**: 全面重新设计，以 War Room 和角色协作为核心
- **Backend AI/Skills**: 集成 RACI 矩阵，增强技能执行与自动化工作流
- **RACI Integration**: 深入整合 RACI.md 定义的角色责任与协作流程
- **Existing Changes**: 废弃现有 security-role-centered-ui-redesign 的 43 个未完成任务

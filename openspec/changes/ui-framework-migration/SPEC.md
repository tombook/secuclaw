# UI Framework Migration Specification

## Purpose
将 SecuClaw 前端从 Lit (Web Components) 迁移到 React + shadcn/ui + Tailwind CSS，实现角色指挥台 UI 重设计和整体视觉升级。

## Background
- 当前前端基于 LitElement + TypeScript + Vite，组件 35+，页面 30+
- 产品核心是 8 个安全角色的 skills，UI 必须围绕角色体验设计
- Lit 生态较小，shadcn/ui + React 生态更成熟，安全产品 UI 参考更多
- 已有角色主题系统、RACI 工作流、角色指挥台设计方案

## Requirements

### Requirement: UI SHALL migrate from Lit to React + shadcn/ui + Tailwind CSS
系统 SHALL 将前端框架从 Lit (Web Components) 迁移到 React + shadcn/ui + Tailwind CSS + Vite。

#### Scenario: 新 UI 技术栈
- **WHEN** 项目启动 UI 改造
- **THEN** 前端 SHALL 使用以下技术栈：
  - React 18+ (组件框架)
  - shadcn/ui (UI 组件库，基于 Radix UI)
  - Tailwind CSS v4 (样式系统)
  - Vite (构建工具，保持不变)
  - TypeScript (类型系统，保持不变)
  - Recharts / Chart.js (数据可视化)
  - React Router (路由)
  - Zustand (状态管理，替代 Lit custom stores)

#### Scenario: 保留后端通信协议
- **WHEN** 新 UI 与后端通信
- **THEN** SHALL 继续使用 WebSocket Gateway (21981) 和 REST API (21982)
- **AND** WebSocket 消息协议保持不变 (77 个方法)

### Requirement: 8 角色差异化视觉系统
系统 SHALL 为 8 个安全角色实现完全差异化的视觉体验。

#### Scenario: 角色主题切换
- **WHEN** 用户切换角色
- **THEN** 整个 UI SHALL 变化：配色、布局结构、动画效果、背景纹理
- **AND** 切换过程 SHALL 有平滑过渡动画

#### Scenario: 角色指挥台布局
- **WHEN** 用户进入角色指挥台
- **THEN** 每个角色 SHALL 有独特的布局模式：
  - security-expert: 网格仪表盘
  - privacy-officer: 卡片流
  - security-architect: 三栏布局
  - business-security-officer: 时间线
  - secuclaw-commander: 战情室
  - ciso: 高管仪表盘
  - security-ops: 告警队列
  - supply-chain-security: 关系图

### Requirement: 角色指挥台三合一融合
每个角色指挥台 SHALL 融合三个核心区域：RACI 任务区、专业指标区、协作指挥区。

#### Scenario: RACI 任务区
- **WHEN** 角色指挥台渲染
- **THEN** SHALL 显示该角色的 R/A/C/I 四类任务卡片
- **AND** 点击卡片展开任务列表

#### Scenario: 专业指标区
- **WHEN** 角色指挥台渲染
- **THEN** SHALL 显示 4-6 个该角色专属 KPI 指标卡片
- **AND** 每个指标含趋势迷你图和状态标签

#### Scenario: 协作指挥区
- **WHEN** 角色指挥台渲染
- **THEN** SHALL 显示跨角色讨论、协作请求、任务协作面板

### Requirement: 智能推荐条
系统 SHALL 在页面顶部提供 AI 驱动的角色和场景推荐。

#### Scenario: 基于态势推荐角色
- **WHEN** 检测到高危漏洞
- **THEN** 推荐条 SHALL 推荐 security-expert 角色
- **WHEN** 检测到大规模安全事件
- **THEN** 推荐条 SHALL 推荐 secuclaw-commander 角色

### Requirement: 清理旧 Lit 组件
迁移完成后 SHALL 删除所有 Lit 相关依赖和组件代码。

#### Scenario: 依赖清理
- **WHEN** 新 React UI 可以完全替代旧 UI
- **THEN** SHALL 从 package.json 移除 lit, lit-element, lit-html, @lit/* 依赖
- **AND** 删除所有 sc-*.ts Lit 组件文件

## Non-Goals
- 不改变后端架构和 API 协议
- 不改变 8 个角色的 SKILL.md 定义
- 不改变 MITRE/SCF 知识库数据
- 不引入 SSR (保持 SPA 模式)
- 不引入 Next.js (保持 Vite 构建)

## Affected Roles
所有 8 个安全角色均受影响。

## Migration Strategy
分阶段迁移：
1. Phase 1: 基础设施（React 脚手架 + shadcn/ui + Tailwind + 路由）
2. Phase 2: 核心布局（Header + Sidebar + Layout + 角色切换器）
3. Phase 3: 角色指挥台（三合一组件）
4. Phase 4: 业务页面迁移（Dashboard, Incidents, Vulns, Threats 等）
5. Phase 5: 清理旧代码

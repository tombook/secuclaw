# Implementation Tasks - Security Expert Collaboration Platform

## 1. RACI 矩阵数据层

- [x] 1.1 创建 `ui/src/ui/config/raci-matrix.ts`，定义 RaciAssignment、RaciScenario 类型接口和 5 个核心安全场景（incident-response, vulnerability-management, threat-response, compliance-audit, supply-chain-incident）的 RACI 矩阵数据，每个场景包含 8 个角色的 R/A/C/I 分工和具体任务描述
- [x] 1.2 创建 `ui/src/ui/store/raci-store.ts`，实现 RACI 状态管理 store，支持按角色查询所有场景职责、按场景查询所有角色分工、获取当前角色在当前场景的 RACI 类型
- [x] 1.3 创建 `ui/src/ui/config/role-workflow-config.ts`，为每个角色在每个场景中定义预设工作流模板（WorkflowStep 数组），包含步骤类型（auto/manual/ai-suggest）、关联 Skill、前置依赖、通知角色
- [x] 1.4 编写 RACI 数据层单元测试，验证矩阵查询、工作流加载、状态管理逻辑

**验证**: 所有测试通过，RACI 矩阵可按角色/场景双向查询，工作流模板正确加载

## 2. 全局角色身份系统

- [x] 2.1 扩展 `ui/src/ui/store/role-context.ts`，新增 warRoomSessionId、currentScenarioType、currentRaciAssignment 状态字段，新增 getRaciAssignments()、getTheme() 方法，角色切换时触发 RACI 状态更新
- [x] 2.2 增强 `ui/src/ui/components/sc-role-switcher.ts`，升级为全局角色切换器（含角色主题色、RACI 职责摘要），支持键盘导航和 sessionStorage 持久化
- [x] 2.3 集成角色切换器到 `ui/src/ui/layout/sc-header.ts`，替换原有简单用户标识为角色指示器 + 下拉面板
- [x] 2.4 定义 8 个角色的 CSS 主题变量系统（`--sc-role-primary`, `--sc-role-secondary`），在角色切换时动态更新 `document.documentElement` 样式
- [x] 2.5 编写角色身份系统测试，验证角色切换、状态持久化、主题变量更新

**验证**: 角色切换器在 Header 中正常展示，切换角色后所有订阅组件响应式更新，主题色变化

## 3. RACI 矩阵可视化组件

- [x] 3.1 创建 `ui/src/ui/components/sc-raci-matrix-view.ts`，实现 RACI 矩阵可视化组件（矩阵表格：行=角色，列=RACI 类型），当前角色行高亮，其他行淡化
- [x] 3.2 实现 RACI 矩阵的紧凑模式（War Room 顶部横条）和展开模式（完整矩阵表格）
- [x] 3.3 添加 RACI 角色点击交互，点击某个角色展开该角色的具体任务列表

**验证**: RACI 矩阵组件可独立渲染，展示正确的 R/A/C/I 分工，交互响应正常

## 4. 角色视角视图组件

- [x] 4.1 创建 `ui/src/ui/components/sc-role-perspective.ts`，实现角色视角切换标签组件，展示 8 个角色的视角标签（带 emoji 和简短描述）
- [x] 4.2 定义 `ROLE_PERSPECTIVE_CONFIG` 配置，映射每个角色在事件/威胁/漏洞数据上的关注维度（参考 design.md Decision 4 视角映射表）
- [x] 4.3 实现视角切换逻辑：根据选中角色过滤和排序数据字段，高亮该角色关注的维度
- [x] 4.4 实现双视角对比模式，左右分栏展示两个角色的分析结果

**验证**: 在事件详情中切换角色视角，展示内容正确变化；双视角对比正常显示

## 5. War Room 页面核心

- [x] 5.1 创建 `ui/src/ui/pages/sc-war-room-page.ts` 基础页面框架，包含：RACI 概览区、角色任务面板区、事件时间线区、协作聊天区、工作流建议区
- [x] 5.2 实现 War Room 路由注册：在 `ui/src/ui/app.ts` 中添加 `/war-room` 和 `/war-room/:eventId` 路由
- [x] 5.3 实现 RACI 概览面板区域，集成 `sc-raci-matrix-view` 的紧凑模式，根据事件场景类型加载对应 RACI 矩阵
- [x] 5.4 实现角色任务面板区域，为每个 R/A 角色渲染独立任务列，展示该角色基于 RACI 职责的任务列表，支持任务状态切换（待执行/进行中/已完成）
- [x] 5.5 实现 Commander 调度视图：当当前角色为 secuclaw-commander 时，展示所有角色的任务状态总览（而非单个角色列）
- [x] 5.6 实现事件时间线组件，记录所有角色的操作（角色 emoji + 时间戳 + 操作描述），支持按角色视角过滤
- [x] 5.7 实现协作聊天区域，消息携带角色标识（emoji + 名称），支持工作流关键词匹配并展示工作流建议卡片

**验证**: War Room 页面可正常渲染，RACI 面板展示正确，任务面板支持多列并行，时间线记录操作

## 6. 工作流面板

- [x] 6.1 创建 `ui/src/ui/components/sc-workflow-panel.ts`，展示当前角色在当前场景的工作流步骤列表
- [x] 6.2 实现 manual 类型步骤：用户点击执行，手动标记完成
- [x] 6.3 实现 auto 类型步骤：前置依赖完成后自动触发（调用 sc-skill-executor），更新步骤状态
- [x] 6.4 实现 ai-suggest 类型步骤：展示 AI 建议面板，用户确认后执行
- [x] 6.5 实现工作流状态持久化到 sessionStorage，页面刷新后恢复
- [x] 6.6 实现工作流完成报告生成，记录到事件时间线

**验证**: 工作流面板在 War Room 中正确展示，步骤可按序执行，状态持久化正常

## 7. 仪表盘 RACI 增强

- [x] 7.1 扩展 `ui/src/ui/config/role-dashboard-config.ts`，为每个角色新增 RACI 任务摘要配置
- [x] 7.2 重构 `ui/src/ui/pages/sc-dashboard.ts`，新增 RACI 任务摘要区域，展示当前角色的待执行 R 任务、待审批 A 任务、未读 I 通知
- [x] 7.3 确保 Dashboard 角色切换时 RACI 摘要响应式更新

**验证**: 仪表盘在不同角色下展示对应的 RACI 任务摘要，切换角色后立即更新

## 8. AI Experts 页面升级

- [x] 8.1 升级 `ui/src/ui/pages/sc-ai-experts-page.ts`，新增角色 RACI 职责概览标签页（展示该角色在所有场景中的 R/A/C/I 分布）
- [x] 8.2 创建 `ui/src/ui/components/sc-expertise-radar.ts` SVG 技能雷达图组件，6 维技能可视化
- [x] 8.3 在 AI Experts 页面集成雷达图和 RACI 概览，替代当前的简单技能列表
- [x] 8.4 实现角色间雷达图对比模式（同一雷达图叠加多个角色）

**验证**: AI Experts 页面展示雷达图 + RACI 概览，角色对比模式正常

## 9. 集成与测试

- [x] 9.1 集成 War Room 入口：在事件列表页（`sc-incidents-page.ts`）添加"启动 War Room"按钮，导航到 `/war-room/:eventId`
- [x] 9.2 集成角色视角：在事件详情/威胁详情/漏洞详情页添加角色视角切换组件
- [x] 9.3 更新侧边栏导航：在 `sc-sidebar.ts` 中添加 War Room 入口，根据角色权限显示
- [x] 9.4 端到端测试：验证完整工作流——事件触发 → War Room 启动 → RACI 分配 → 角色执行任务 → 时间线记录 → 工作流完成
- [x] 9.5 验证 8 个角色分别切换后的 UI 一致性和功能正确性
- [x] 9.6 验证响应式布局：桌面端多列任务面板，移动端折叠为标签切换

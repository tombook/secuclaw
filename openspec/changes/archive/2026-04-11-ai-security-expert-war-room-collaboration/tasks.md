## 1. 归档现有 Change

- [x] 1.1 将 `openspec/changes/security-role-centered-ui-redesign/` 移动到 `openspec/changes/archive/`
- [x] 1.2 记录归档原因和决策过程

## 2. 后端 RACI 矩阵增强

- [x] 2.1 完善 RACI.md 文件，定义各角色在不同场景下的责任矩阵和工作流模板
- [x] 2.2 扩展 `packages/core/src/raci/types.ts`，增加 RACI 工作流模板类型定义
- [x] 2.3 更新 `packages/core/src/ai/ai-collaboration-engine.ts`，增强 RACI 阶段执行逻辑
- [x] 2.4 验证 AI 协作引擎的 RACI 阶段流转功能

## 3. 后端技能执行增强

- [x] 3.1 更新 `packages/core/src/skills/executor.ts`，增加 RACI 权限验证逻辑
- [x] 3.2 创建 `packages/core/src/skills/raci-skill-registry.ts`，注册 8 个角色的 RACI 矩阵技能
- [x] 3.3 通过 API 调用成熟执行器（如漏洞扫描、日志分析），secuclaw 应用市场负责集成
- [x] 3.4 验证技能执行的 RACI 权限检查功能

## 4. 后端 AI 触发引擎

- [x] 4.1 创建 `packages/core/src/events/ai-trigger-bridge.ts`，连接 EventBus 和 AI 触发逻辑
- [x] 4.2 实现基于 RACI.md 的触发条件判断和工作流路由
- [x] 4.3 增加 AI 触发的日志记录和审计功能
- [x] 4.4 验证 AI 触发机制的事件响应和工作流启动功能

## 5. 前端 War Room 重构

- [x] 5.1 扩展 `ui/src/ui/store/raci-store.ts`，增加 RACI 协作阶段、工作流执行状态管理
- [x] 5.2 重构 `ui/src/ui/pages/sc-war-room-page.ts`，实现 RACI 矩阵视图和协作阶段显示
- [x] 5.3 创建 `ui/src/ui/components/sc-raci-workflow-panel.ts`，显示和执行角色自动化工作流
- [x] 5.4 创建 `ui/src/ui/components/sc-raci-matrix-view.ts`，可视化显示角色在 RACI 矩阵中的位置
- [x] 5.5 验证 War Room 的多角色协作和工作流执行功能

## 6. 前端角色沉浸式体验

- [x] 6.1 创建 `ui/src/ui/config/role-themes.ts`，定义 8 个角色的专属配色和视觉元素
- [x] 6.2 更新 `ui/src/ui/layout/sc-layout.ts`，支持角色主题切换
- [x] 6.3 创建 `ui/src/ui/components/sc-role-identity.ts`，显示角色专属身份元素
- [x] 6.4 实现角色切换的沉浸式过渡效果
- [x] 6.5 验证角色沉浸式体验的视觉和交互效果

## 7. 集成与测试

- [x] 7.1 前后端集成测试，验证 War Room 协作、工作流执行、AI 触发功能
- [x] 7.2 编写 Vitest 单元测试，覆盖核心功能模块
- [x] 7.3 执行端到端测试，验证完整用户流程
- [x] 7.4 修复测试中发现的问题

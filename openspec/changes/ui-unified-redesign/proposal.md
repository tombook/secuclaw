## Why

当前 SecuClaw UI 存在严重的架构问题：新设计系统组件（design-system/）和角色指挥台组件（sc-role-commander, sc-smart-recommendation-bar 等）已经创建，但**几乎所有页面都未使用它们**，继续使用各自的旧设计。这导致：
- 代码重复和样式不一致
- 无法享受统一设计系统的好处
- 用户体验割裂

现在需要统一重构：将所有旧UI页面替换为基于新设计系统的统一界面。

## What Changes

### 删除的文件（废弃旧UI）
- `sc-incidents-page.ts` - 旧设计，重写为新设计
- `sc-vulnerabilities-page.ts` - 旧设计，重写为新设计
- `sc-threats-page.ts` - 旧设计，重写为新设计
- `sc-compliance-page.ts` - 旧设计，重写为新设计
- `sc-reports-page.ts` + `sc-reports-pro.ts` - 合并重写
- `sc-skills-market.ts` - 旧设计，重写为新设计
- `sc-knowledge-base.ts` - 旧设计，重写为新设计
- `sc-channels-page.ts` - 旧设计，重写为新设计
- `sc-baseline-page.ts` - 旧设计，合并到 secops-center
- `sc-vulnscan-page.ts` - 旧设计，合并到 secops-center
- `sc-pentest-page.ts` - 旧设计，合并到 secops-center
- `sc-threathunt-page.ts` - 旧设计，合并到 secops-center
- `sc-datacenter-page.ts` + `sc-data-center.ts` - 合并重写
- `sc-tasks-page.ts` - 旧设计，重写为新设计
- `sc-audit-page.ts` - 旧设计，重写为新设计
- `sc-approval-page.ts` - 旧设计，重写为新设计
- `sc-assets-page.ts` - 旧设计，重写为新设计
- `sc-risk-page.ts` - 保留，适配新设计

### 修改的文件
- `sc-dashboard.ts` - 已是新设计，优化完善
- `sc-secops-center.ts` - 扩展为统一安全运营中心
- `sc-war-room-page.ts` - 适配新设计系统
- `sc-login-page.ts` - 适配新设计系统

### 新设计系统采用
所有新页面必须使用：
- `design-system/sc-button` - 按钮组件
- `design-system/sc-card` - 卡片组件
- `design-system/sc-badge` - 徽章组件
- `design-system/sc-empty-state` - 空状态组件
- `design-system/sc-skeleton` - 加载骨架屏
- `design-system/sc-error-boundary` - 错误边界
- `sc-smart-recommendation-bar` - 智能推荐条
- `sc-role-switcher` - 角色切换器
- `sc-permission-guard` - 权限守卫

## Capabilities

### New Capabilities
- `unified-page-template`: 统一页面模板，所有新页面基于此构建
- `role-centric-navigation`: 以角色为中心的导航系统
- `design-system-adoption`: 设计系统在所有页面的采用

### Modified Capabilities
- `dashboard`: 优化为新设计系统入口
- `war-room`: AI 协作功能保留，UI 适配新设计
- `secops-center`: 扩展为统一安全运营中心

## Impact

### 受影响代码
- `ui/src/ui/pages/*` - 所有页面文件重构
- `ui/src/ui/components/design-system/*` - 激活使用设计系统组件
- `ui/src/ui/layout/` - 适配新设计

### 非目标
- 不改变后端 API
- 不改变业务逻辑
- 不改变角色权限系统

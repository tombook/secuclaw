## Why

SecuClaw 是一款 AI 安全工程产品，凝聚了 20 年以上顶级安全专家的职业经验，体现在 8 个安全角色的专业技能组合中。这不是简单的"8 个 AI 智能体"，而是能够应对多种行业、多种业务安全场景的综合性安全智能系统。

当前的 UI 将 8 个安全角色降级为普通功能页面（`/ai-experts`），菜单按通用类别（运营、作战、治理等）组织，导致产品核心价值无法凸显。用户无法直观感受到"与不同安全专家协作"的创新体验。

## What Changes

1. **角色中心化导航** - 将 8 个安全角色作为产品主导航范式，取代当前的"运营/作战/治理"分类
2. **角色适配型仪表盘** - 仪表盘内容根据当前角色动态调整，展示该角色的核心 KPI 和关注重点
3. **统一威胁视图** - 同一安全数据，呈现不同角色视角的分析结果
4. **角色专业展示页** - 每个角色的技能雷达图、MITRE ATT&CK 覆盖、SCF 控制覆盖
5. **快捷角色切换** - 顶部角色切换器，一键在不同安全专家身份间切换
6. **场景化任务编排** - 基于角色专业技能的自动化任务建议

## Capabilities

### New Capabilities

- `role-centric-navigation`: 角色中心化导航系统，将菜单重构为以安全角色为核心的组织结构
- `adaptive-dashboard`: 角色适配型仪表盘，根据当前角色动态展示相关 KPI 和洞察
- `role-expertise-showcase`: 角色专业能力展示组件，包含技能雷达图、覆盖范围可视化
- `role-perspective-view`: 角色视角视图，同一数据不同角色的分析视角展示
- `quick-role-switcher`: 快捷角色切换组件，一键切换当前安全专家身份

### Modified Capabilities

- `dashboard`: 现有仪表盘需重构为角色适配型，支持多角色视角
- `ai-experts`: 现有 AI Experts 页面需升级为角色专业能力展示中心

## Impact

### 影响的代码
- `ui/src/ui/app.ts` - 路由和布局调整
- `ui/src/ui/config/menu-config.ts` - 菜单配置重构
- `ui/src/ui/pages/sc-dashboard.ts` - 仪表盘重构
- `ui/src/ui/pages/sc-ai-experts-page.ts` - AI Experts 页升级
- `ui/src/ui/components/sc-role-switcher.ts` - 角色切换器组件

### 新增组件
- `RoleCentricLayout` - 角色中心化布局组件
- `RolePerspectiveView` - 角色视角展示组件
- `ExpertiseRadarChart` - 专业能力雷达图组件

### 设计系统
- 8 个角色的视觉标识系统（图标、颜色、动画）
- 角色主题 CSS 变量系统

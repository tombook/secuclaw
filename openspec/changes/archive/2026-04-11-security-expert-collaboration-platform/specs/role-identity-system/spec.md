## ADDED Requirements

### Requirement: 全局角色切换器
系统 SHALL 在页面顶部 Header 中提供全局角色切换器组件，允许用户一键切换当前安全专家身份。

#### Scenario: 角色切换器展示
- **WHEN** 页面 Header 渲染完成
- **THEN** Header 左侧 SHALL 展示当前角色指示器（emoji + 角色名称 + 下拉箭头）

#### Scenario: 角色切换下拉面板
- **WHEN** 用户点击角色指示器
- **THEN** 系统 SHALL 展示下拉面板，包含所有 8 个安全角色卡片（emoji、名称、一句话描述），当前角色标记为"当前"

#### Scenario: 角色切换全局生效
- **WHEN** 用户在下拉面板中选择新角色
- **THEN** 系统 SHALL 更新 roleContext，所有订阅组件 SHALL 响应式更新：仪表盘内容、菜单高亮、视角切换、RACI 面板

### Requirement: 角色适配型仪表盘
系统 SHALL 根据当前角色身份动态调整仪表盘内容。

#### Scenario: 仪表盘 KPI 适配
- **WHEN** 用户切换到新角色
- **THEN** 仪表盘 SHALL 展示该角色关注的核心 KPI 指标（由 ROLE_DASHBOARD_CONFIG 定义）

#### Scenario: 仪表盘 RACI 任务摘要
- **WHEN** 用户以某角色身份查看仪表盘
- **THEN** 仪表盘 SHALL 展示该角色在当前活跃安全事件中的 RACI 任务摘要（待执行的 R 任务、待审批的 A 任务）

### Requirement: 角色主题视觉系统
系统 SHALL 为每个安全角色定义视觉主题（主色、辅助色）。

#### Scenario: 角色切换时主题变化
- **WHEN** 用户切换角色
- **THEN** Header 中的角色指示器 SHALL 更新为该角色的主题色和 emoji

#### Scenario: 角色主题 CSS 变量
- **WHEN** 角色身份确定后
- **THEN** 系统 SHALL 设置 `--sc-role-primary` 和 `--sc-role-secondary` CSS 变量，供所有组件使用

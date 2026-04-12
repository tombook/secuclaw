## ADDED Requirements

### Requirement: Role Identity Immersive Experience
系统 SHALL 为 8 个安全角色提供沉浸式身份体验，让用户有"成为那个专家"的感觉。

#### Scenario: Role switch immersive transition
- **WHEN** 用户切换安全角色
- **THEN** 系统提供沉浸式过渡效果，包括：
  - 角色专属配色方案
  - 角色专属图标和视觉元素
  - 角色专属欢迎语和身份提示

#### Scenario: Role-specific UI layout
- **WHEN** 用户选择安全角色
- **THEN** 系统调整 UI 布局，优先显示该角色最相关的功能和数据

#### Scenario: Role persona in interactions
- **WHEN** 用户在 War Room 中以特定角色发言或执行操作
- **THEN** 系统显示该角色的人设元素（如头像、专业标签、沟通风格）

## Why

当前8种安全角色的技能仅用于AI专家页面的展示,未与项目其他功能模块联动。用户切换角色时,仅改变AI聊天助手的角色设定,不影响仪表盘、告警、任务等其他功能。需要让角色真正"驱动"系统各模块的展示和行为。

## What Changes

### 角色上下文系统
- 创建`RoleContext`全局状态管理当前选中角色
- 角色选择影响所有页面的数据过滤和展示逻辑
- 角色上下文在用户登录后可切换,持久化到本地存储

### 角色驱动的仪表盘
- 不同角色看到不同的KPI指标和图表
- Security Expert: 漏洞管理仪表盘
- Privacy Officer: 合规状态仪表盘
- Security Architect: 架构风险仪表盘
- Business Security Officer: 业务连续性仪表盘
- SecuClaw Commander: 全域态势仪表盘
- CISO: 安全战略仪表盘
- Security Ops: SOC运营仪表盘
- Supply Chain Security: 供应链风险仪表盘

### 角色驱动的数据过滤
- 告警列表根据角色技能过滤
- 任务列表根据角色能力优先级排序
- 推荐建议根据角色类型定制

### 角色驱动的导航
- 根据角色显示不同的导航菜单项
- 角色特定的快捷入口

### 技能矩阵到UI的映射
- SKILL.md中的capabilities映射为UI过滤器
- MITRE覆盖映射为威胁类型筛选
- SCF覆盖映射为合规领域视图

## Capabilities

### New Capabilities
- `role-context`: 全局角色上下文管理
- `role-driven-dashboard`: 角色驱动的仪表盘
- `role-driven-filtering`: 角色驱动的数据过滤
- `role-driven-navigation`: 角色驱动的导航

### Modified Capabilities
- `ai-security-experts`: 扩展支持角色上下文

## Impact

- `ui/src/ui/store/role-context.ts` - 新增角色上下文Store
- `ui/src/ui/pages/sc-dashboard.ts` - 根据角色显示不同仪表盘
- `ui/src/ui/pages/sc-ai-experts-page.ts` - 支持角色上下文
- `ui/src/ui/layout/sc-sidebar.ts` - 根据角色显示导航
- `ui/src/ui/services/role-filter-service.ts` - 角色数据过滤服务
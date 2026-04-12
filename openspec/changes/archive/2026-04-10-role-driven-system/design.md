## Context

当前系统现状:
- 8种安全角色定义在SKILL.md中,仅用于AI专家页面
- 仪表盘、数据表格、告警等模块与角色无关
- 用户切换角色仅改变AI聊天角色设定

目标:
- 用户选择一个安全角色后,整个系统的视图、数据、推荐都围绕该角色展开
- 角色不再是"AI助手设定",而是"用户视角切换"

## Goals / Non-Goals

**Goals:**
- 实现角色上下文,全局可访问当前选中角色
- 仪表盘根据角色显示不同视图和数据
- 数据列表根据角色技能过滤
- 导航菜单根据角色显示不同入口

**Non-Goals:**
- 不修改后端数据访问权限(那是角色权限系统)
- 不实现角色间的数据隔离(那是数据权限)
- 不实现角色切换的完整认证流程

## Decisions

### 1. 角色上下文存储位置

**决策**: 使用UI Store管理,本地存储持久化

```typescript
interface RoleContext {
  currentRole: RoleId;
  roleProfile: SkillDefinition;
}
```

**理由**:
- 轻量级,无需后端改造
- 用户可快速切换视角
- 支持游客体验不同角色

### 2. 角色上下文影响范围

| 模块 | 影响方式 |
|------|----------|
| 仪表盘 | 切换KPI卡片和图表类型 |
| 告警列表 | 过滤特定类型的告警 |
| 任务列表 | 优先级和展示顺序调整 |
| 推荐建议 | 根据角色技能定制 |
| 导航 | 显示角色特定菜单 |

### 3. 仪表盘角色映射

```typescript
const ROLE_DASHBOARD_CONFIG = {
  'security-expert': {
    primaryKpi: ['漏洞数', '补丁覆盖率', 'CVSS分布'],
    chartType: '漏洞趋势图',
    alertFilter: ['漏洞', '配置'],
  },
  'privacy-officer': {
    primaryKpi: ['合规率', '数据泄露事件', '主体请求'],
    chartType: '合规仪表盘',
    alertFilter: ['隐私', '数据保护'],
  },
  // ... 其他角色
};
```

### 4. 数据过滤策略

**基于能力的过滤**:
- 根据角色的capabilities.light/dark/security等决定可见数据
- 例如: Security Expert看到所有技术安全数据
- Privacy Officer只看到隐私相关数据

**基于覆盖的过滤**:
- MITRE覆盖决定威胁类型可见性
- SCF覆盖决定合规领域可见性

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 前后端数据不一致 | UI过滤后数据在表格中为空 | 提供"显示全部"选项 |
| 角色切换频繁 | 每次切换重新请求数据 | 添加切换防抖(500ms) |
| 技能到UI映射复杂 | 8个角色×6个维度组合多 | 预设角色配置表 |

## Migration Plan

1. 创建RoleContext Store
2. 在Layout中注入角色切换器
3. 改造Dashboard支持角色配置
4. 数据服务添加角色过滤参数
5. 导航菜单根据角色显示

## Open Questions

1. 角色切换是否需要后端记录审计日志?
2. 多角色同时激活的支持?
3. 角色视角与用户权限冲突时优先谁?
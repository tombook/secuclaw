## Why

技能市场是 SecuClaw 角色系统的核心体验入口 — 用户应能浏览 8 种安全角色技能、安装到自己的指挥官、激活/停用。当前后端只有 `skills.list/get` 两个只读方法，前端路由 `/skills-market` 映射到 `baseline` 工具，整个技能安装/激活/卸载流程完全缺失。`skill-store.ts` 只能读取技能定义，无法执行安装操作。

## What Changes

- **后端**: 新增 `skills.install`、`skills.uninstall`、`skills.activate`、`skills.deactivate` 四个 WebSocket API 方法
- **后端**: `skills-routes.ts` 扩展注册技能操作 handler
- **后端**: 技能安装状态关联到 Commander 实体的 `skillStates` 字段
- **前端**: 新建 `sc-skills-market-page.ts` 独立页面，包含技能卡片网格、安装/激活按钮、已安装筛选
- **前端**: `skill-store.ts` 扩展，新增 `installSkill`、`uninstallSkill`、`activateSkill`、`deactivateSkill`
- **前端**: `app.ts` 路由更新，`/skills-market` 指向新组件
- **前端**: i18n 三语言新增技能市场相关翻译键

## Capabilities

### New Capabilities
- `skills-lifecycle`: 技能安装/卸载/激活/停用生命周期管理

### Modified Capabilities
- `skill-registry`: 扩展 skill-registry spec，增加安装状态管理需求

## Impact

- **后端 API**: `packages/core/src/gateway/routes/skills-routes.ts` 新增 4 个 handler
- **后端数据**: Commander 实体的 `skillStates` 字段需被正确读写
- **前端页面**: 新建 `ui/src/ui/pages/sc-skills-market-page.ts`
- **前端路由**: `ui/src/ui/app.ts` 修改 `/skills-market` 路由指向
- **前端 Store**: `ui/src/ui/store/skill-store.ts` 扩展
- **前端 i18n**: 三语言文件新增翻译键
- **角色影响**: 所有 8 种安全角色

## Non-goals

- 不实现技能插件的热加载/代码注入
- 不实现自定义技能创建/编辑
- 不实现技能版本管理和自动更新

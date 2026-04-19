## Why

能力中心是 SecuClaw 的核心业务域，任务(task) CRUD 完整，但能力域(domains)和能力项(items)只有 `list` 只读方法。用户无法自定义能力域和能力项，只能使用硬编码的初始数据。前端 `sc-capabilities-page.ts` 和子组件已完整，但 domains/items 管理功能缺失。

## What Changes

- **后端**: 新增 `capabilities.domains.create/update/delete` 三个 WebSocket API 方法
- **后端**: 新增 `capabilities.items.create/update/delete` 三个 WebSocket API 方法
- **后端**: `capabilities-routes.ts` 扩展注册新 handler
- **前端**: `sc-capabilities-page.ts` 或子组件 `sc-domain-board.ts` 增加「新建域」「编辑域」「新建能力项」「编辑能力项」操作入口
- **前端**: `capabilities-client.ts` 新增 domains/items 的 CRUD 方法
- **前端**: i18n 三语言新增能力域/项管理翻译键

## Capabilities

### New Capabilities
- `capabilities-domains-crud`: 能力域 CRUD 管理
- `capabilities-items-crud`: 能力项 CRUD 管理

### Modified Capabilities
<!-- 无需修改现有 spec -->

## Impact

- **后端 API**: `packages/core/src/gateway/routes/capabilities-routes.ts` 新增 6 个 handler
- **后端服务**: `capabilities/service.ts` 可能需要新增方法
- **前端组件**: `ui/src/ui/pages/capabilities/sc-domain-board.ts` 增加管理操作
- **前端客户端**: `ui/src/ui/capabilities-client.ts` 新增 6 个方法
- **前端 i18n**: 三语言文件新增翻译键
- **角色影响**: 所有角色（能力中心是全局功能）

## Non-goals

- 不实现能力域/项的权限控制（仅管理员可管理）
- 不实现能力域模板/复制
- 不修改现有 task/evidence/approval 的功能

## Why

频道管理后端有基础功能（`channels.status/configure/send`），但缺少 `enable/disable` 切换，用户无法临时关闭某个通知频道。前端路由 `/channels` 映射到 `baseline` 工具，没有独立的频道管理 UI。频道配置后无法启用/禁用是实际运营中的痛点。

## What Changes

- **后端**: 新增 `channels.enable`、`channels.disable` 两个 WebSocket API 方法
- **后端**: `channels-routes.ts` 扩展注册 enable/disable handler
- **前端**: 新建 `sc-channels-page.ts` 独立页面，包含频道列表、配置表单、启用/禁用开关、发送测试消息
- **前端**: `data-service.ts` 新增 `enableChannel`、`disableChannel` 方法
- **前端**: `app.ts` 路由更新，`/channels` 指向新组件
- **前端**: i18n 三语言新增频道管理相关翻译键

## Capabilities

### New Capabilities
- `channels-toggle`: 频道启用/禁用状态切换

### Modified Capabilities
<!-- 无需修改现有 spec -->

## Impact

- **后端 API**: `packages/core/src/gateway/routes/channels-routes.ts` 新增 2 个 handler
- **前端页面**: 新建 `ui/src/ui/pages/sc-channels-page.ts`
- **前端路由**: `ui/src/ui/app.ts` 修改 `/channels` 路由指向
- **前端数据**: `ui/src/ui/data-service.ts` 新增 2 个方法
- **前端 i18n**: 三语言文件新增翻译键
- **角色影响**: security-ops、secuclaw-commander

## Non-goals

- 不实现频道消息历史记录和搜索
- 不实现频道消息模板
- 不实现新频道类型（仅管理已支持的 10 种频道）

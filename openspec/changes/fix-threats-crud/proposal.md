## Why

威胁情报是安全运营的核心数据源，但当前系统只有只读 API（`threats.list/get/stats/search`），用户无法通过 UI 创建、编辑或删除威胁条目。威胁数据完全依赖 mock，无法形成「发现威胁 → 录入系统 → 分析关联 → 处置响应」的业务闭环。前端路由 `/threats` 映射到通用 `sc-secops-center` 组件的 `threathunt` 工具，没有独立的威胁管理 UI。

## What Changes

- **后端**: 新增 `threats.create`、`threats.update`、`threats.delete`、`threats.updateStatus` 四个 WebSocket API 方法
- **后端**: 扩展 `security-routes.ts` 注册新的写操作 handler
- **后端**: 为 Threat 实体增加状态机 (active → investigating → mitigated → false-positive → closed)
- **前端**: 新建 `sc-threats-page.ts` 独立页面组件，包含威胁列表、创建表单、编辑表单、状态流转
- **前端**: `data-service.ts` 新增 `createThreat`、`updateThreat`、`deleteThreat`、`updateThreatStatus` 方法
- **前端**: `app.ts` 路由更新，`/threats` 指向新的 `sc-threats-page` 组件
- **前端**: i18n 三语言新增威胁管理相关翻译键

## Capabilities

### New Capabilities
- `threats-crud`: 威胁情报完整 CRUD + 状态机生命周期管理

### Modified Capabilities
<!-- 无现有 spec 需要修改 -->

## Impact

- **后端 API**: `packages/core/src/gateway/routes/security-routes.ts` 新增 4 个 handler
- **后端数据**: `threats.json` 存储结构需支持状态字段
- **前端页面**: 新建 `ui/src/ui/pages/sc-threats-page.ts`
- **前端路由**: `ui/src/ui/app.ts` 修改 `/threats` 路由指向
- **前端数据**: `ui/src/ui/data-service.ts` 新增写方法
- **前端 i18n**: `ui/src/i18n/locales/` 三语言文件新增翻译键
- **角色影响**: 所有具有「威胁分析」能力的角色（security-expert, security-ops, secuclaw-commander 等）

## Non-goals

- 不实现威胁情报的自动采集/对接第三方情报源
- 不实现 IOC 自动关联分析引擎
- 不实现威胁情报的审批流程（由 dark-side approval 覆盖）

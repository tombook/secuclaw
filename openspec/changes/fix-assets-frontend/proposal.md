## Why

资产管理后端已完整实现 CRUD（`assets.create/update/delete/list/get/stats/batchImport/linkVulnerability/unlinkVulnerability` 共 9 个方法），但前端 `data-service.ts` 只调用 `getAssets/getAsset/getAssetStats`，前端权限已定义 `assets.update` 权限码但无对应 UI。路由 `/assets` 映射到 `baseline` 工具。形成了「后端就绪、前端未接」的断裂 — 唯一需要的是前端集成。

## What Changes

- **前端**: 新建 `sc-assets-page.ts` 独立页面，包含资产列表、创建/编辑表单、批量导入、资产-漏洞关联
- **前端**: `data-service.ts` 新增 `createAsset`、`updateAsset`、`deleteAsset`、`batchImportAssets`、`linkVulnerability`、`unlinkVulnerability` 方法
- **前端**: `app.ts` 路由更新，`/assets` 指向新组件
- **前端**: 接通已有的 `assets.update` / `UPDATE_ASSET` 权限码
- **前端**: i18n 三语言新增资产管理相关翻译键

## Capabilities

### New Capabilities
- `assets-frontend`: 资产管理前端 UI 集成（后端已就绪）

### Modified Capabilities
<!-- 无需修改现有 spec -->

## Impact

- **前端页面**: 新建 `ui/src/ui/pages/sc-assets-page.ts`
- **前端路由**: `ui/src/ui/app.ts` 修改 `/assets` 路由指向
- **前端数据**: `ui/src/ui/data-service.ts` 新增 6 个方法
- **前端权限**: `auth-service.ts` 的 `UPDATE_ASSET` 接入实际逻辑
- **前端 i18n**: 三语言文件新增翻译键
- **无后端变更**: 后端 API 已完整，零后端改动

## Non-goals

- 不修改后端 API（已完整）
- 不实现资产自动发现/扫描
- 不实现 CMDB 集成

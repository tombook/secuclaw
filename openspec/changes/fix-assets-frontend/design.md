## Context

资产管理后端已完整实现 9 个 API（`assets.create/update/delete/list/get/stats/batchImport/linkVulnerability/unlinkVulnerability`），前端仅调用 `getAssets/getAsset/getAssetStats`。前端权限已定义 `UPDATE_ASSET`（`auth-service.ts:73`）但无 UI 入口。这是唯一纯前端工作量的变更。

## Goals / Non-Goals

**Goals:**
- 新建 `sc-assets-page.ts` 独立页面，集成后端已有 CRUD
- `data-service.ts` 补充 6 个写方法
- 接通 `UPDATE_ASSET` 权限
- 零后端改动

**Non-Goals:**
- 修改后端 API
- 实现资产自动发现
- 实现 CMDB 集成

## Decisions

### D1: 纯前端工作

**选择**: 不修改任何后端代码。
**原因**: 后端 `assets-routes.ts` 的 9 个 API 已完整实现并可用，只需前端接入。

### D2: 页面架构

**选择**: 新建 `sc-assets-page.ts`，采用列表+筛选+创建/编辑弹窗模式。
**参考**: `incidents-crud-routes.ts` + `sc-risk-page.ts` 的列表+表单模式。

### D3: 资产-漏洞关联 UI

**选择**: 在资产详情中集成漏洞关联操作（link/unlink）。
**原因**: 后端已有 `linkVulnerability/unlinkVulnerability`，直接调用。

## Risks / Trade-offs

- **后端 API 未测试** → 需验证 `assets.create/update` 在实际 WebSocket 调用中的行为
- **批量导入 UI 复杂度** → 第一版可简化为 JSON 粘贴导入，后续再做文件上传

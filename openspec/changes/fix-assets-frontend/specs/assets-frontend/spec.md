# Assets Frontend Spec

## Overview
资产管理前端 UI 集成。后端已完整，仅需前端接入。

## Requirements

### REQ-1: Data Service Extension
- `data-service.ts` 新增:
  - `createAsset(data)` → `gatewayClient.request('assets.create', data)`
  - `updateAsset(id, data)` → `gatewayClient.request('assets.update', { id, ...data })`
  - `deleteAsset(id)` → `gatewayClient.request('assets.delete', { id })`
  - `batchImportAssets(assets)` → `gatewayClient.request('assets.batchImport', { assets })`
  - `linkVulnerability(assetId, vulnId)` → `gatewayClient.request('assets.linkVulnerability', { assetId, vulnId })`
  - `unlinkVulnerability(assetId, vulnId)` → `gatewayClient.request('assets.unlinkVulnerability', { assetId, vulnId })`

### REQ-2: Frontend Page
- 新建 `sc-assets-page.ts`
- 资产列表（带筛选：type, criticality, environment, status, riskLevel）
- 创建资产表单（弹窗或侧面板）
- 编辑资产表单
- 删除确认
- 批量导入入口（JSON 粘贴）
- 资产-漏洞关联操作

### REQ-3: Route Update
- `app.ts`: `/assets` 指向 `sc-assets-page`
- 移除 `sc-secops-center` 中 `/assets` 的 urlToolMap 映射

### REQ-4: Permission Integration
- 接通 `auth-service.ts` 的 `UPDATE_ASSET` 权限
- 创建/编辑/删除操作需要 `assets.update` 权限

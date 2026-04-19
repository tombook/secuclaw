## 1. 前端 - Data Service（纯前端，无后端改动）

- [x] 1.1 `data-service.ts` 新增 `createAsset(data)` → `assets.create`
- [x] 1.2 新增 `updateAsset(id, data)` → `assets.update`
- [x] 1.3 新增 `deleteAsset(id)` → `assets.delete`
- [x] 1.4 新增 `batchImportAssets(assets)` → `assets.batchImport`
- [x] 1.5 新增 `linkVulnerability(assetId, vulnId)` → `assets.linkVulnerability`
- [x] 1.6 新增 `unlinkVulnerability(assetId, vulnId)` → `assets.unlinkVulnerability`

## 2. 前端 - 资产管理页面

- [x] 2.1 新建 `sc-assets-page.ts` — 资产列表（含筛选：type/criticality/environment/status/riskLevel）
- [x] 2.2 实现创建资产弹窗表单（含所有字段：name/type/criticality/ip/tags/等）
- [x] 2.3 实现编辑资产弹窗
- [x] 2.4 实现删除确认
- [x] 2.5 实现批量导入入口（JSON 粘贴）
- [x] 2.6 实现资产-漏洞关联操作（link/unlink）

## 3. 前端 - 路由与权限

- [x] 3.1 `app.ts` 修改 `/assets` 指向 `sc-assets-page`
- [x] 3.2 `sc-secops-center.ts` 移除 `/assets` 映射
- [x] 3.3 接通 `auth-service.ts` 的 `UPDATE_ASSET` 权限（创建/编辑/删除需此权限）
- [x] 3.4 i18n 三语言新增翻译键

## 4. 验证

- [x] 4.1 验证 `assets.create/update/delete` 通过前端 UI 正确调用后端 API
- [x] 4.2 验证资产-漏洞关联操作正确执行
- [x] 4.3 验证权限控制：无 `assets.update` 权限用户无法编辑

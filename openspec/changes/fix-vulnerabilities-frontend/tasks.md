## 1. data-service 补全
- [x] 1.1 新增 `createVulnerability(data)` 方法
- [x] 1.2 新增 `updateVulnerability(id, data)` 方法
- [x] 1.3 新增 `deleteVulnerability(id)` 方法
- [x] 1.4 新增 `getVulnerabilityEnums()` 方法

## 2. 前端页面
- [x] 2.1 新增 `sc-vulnerabilities-page.ts`（列表/筛选/创建/编辑/删除/状态/分配/批量导入）
- [x] 2.2 `app.ts` 路由 `/vulnerabilities` → `sc-vulnerabilities-page`
- [x] 2.3 `sc-secops-center.ts` urlToolMap 移除 `/vulnerabilities`

## 3. i18n
- [x] 3.1 三语 vulnerabilities section 补全

## 4. 验证
- [x] 4.1 LSP diagnostics 验证

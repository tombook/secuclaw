## 1. data-service 补全
- [x] 1.1 新增 `deleteIncident(id)` 方法
- [x] 1.2 新增 `escalateIncident(id, data)` 方法
- [x] 1.3 新增 `getIncidentEnums()` 方法

## 2. 前端页面
- [x] 2.1 新增 `sc-incidents-page.ts`（列表/筛选/创建/编辑/删除/状态流转/升级）
- [x] 2.2 `app.ts` 路由 `/incidents` → `sc-incidents-page`
- [x] 2.3 `sc-secops-center.ts` urlToolMap 移除 `/incidents`

## 3. i18n
- [x] 3.1 三语 incidents section 补全

## 4. 验证
- [x] 4.1 LSP diagnostics 验证

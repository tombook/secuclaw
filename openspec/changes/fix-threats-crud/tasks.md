## 1. 后端 - Threats CRUD API

- [x] 1.1 在 `packages/core/src/gateway/routes/security-routes.ts` 中新增 `threats.create` handler — 接收 name/type/severity/confidence/source/ioc/mitreTechniques，自动生成 id/status='active'/detectedAt
- [x] 1.2 新增 `threats.update` handler — 按 id 查找并更新可修改字段
- [x] 1.3 新增 `threats.delete` handler — 按 id 从 threats 数组中移除
- [x] 1.4 新增 `threats.updateStatus` handler — 状态机校验(active→investigating→mitigated→false-positive→closed)
- [x] 1.5 为现有 threats.json 数据补充 `status: 'active'` 字段（数据迁移）

## 2. 前端 - Data Service

- [x] 2.1 `data-service.ts` 新增 `createThreat(data)` 方法
- [x] 2.2 新增 `updateThreat(id, data)` 方法
- [x] 2.3 新增 `deleteThreat(id)` 方法
- [x] 2.4 新增 `updateThreatStatus(id, status, comment?)` 方法

## 3. 前端 - 威胁管理页面

- [x] 3.1 新建 `ui/src/ui/pages/sc-threats-page.ts` — 威胁列表组件（含筛选：severity/status/type）
- [x] 3.2 实现创建威胁弹窗表单
- [x] 3.3 实现编辑威胁弹窗表单
- [x] 3.4 实现状态流转下拉菜单
- [x] 3.5 实现删除确认对话框

## 4. 前端 - 路由与菜单

- [x] 4.1 `app.ts` 修改 `/threats` 路由指向 `sc-threats-page`
- [x] 4.2 `sc-secops-center.ts` 的 `urlToolMap` 移除 `/threats` 映射
- [x] 4.3 i18n 三语言文件新增威胁管理翻译键（zh-CN, en, zh-TW）

## 5. 验证

- [x] 5.1 后端验证：通过 WebSocket 调用 threats.create/update/delete/updateStatus 确认返回正确
- [x] 5.2 前端验证：创建/编辑/删除/状态流转操作在 UI 上完整可用
- [x] 5.3 数据验证：threats.json 正确持久化所有写操作

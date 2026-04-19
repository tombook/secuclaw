## 1. 后端 - Domains CRUD

- [x] 1.1 `capabilities-routes.ts` 新增 `capabilities.domains.create` handler
- [x] 1.2 新增 `capabilities.domains.update` handler
- [x] 1.3 新增 `capabilities.domains.delete` handler — 校验域下无 items
- [x] 1.4 `capabilities/service.ts` 新增对应 service 方法

## 2. 后端 - Items CRUD

- [x] 2.1 新增 `capabilities.items.create` handler
- [x] 2.2 新增 `capabilities.items.update` handler
- [x] 2.3 新增 `capabilities.items.delete` handler — 校验项下无 tasks

## 3. 前端 - UI 集成

- [x] 3.1 `capabilities-client.ts` 新增 6 个 CRUD 方法
- [x] 3.2 `sc-domain-board.ts` 域标题区增加「编辑」「删除」按钮
- [x] 3.3 增加「新建域」按钮和表单弹窗
- [x] 3.4 每个域面板底部增加「新建能力项」按钮
- [x] 3.5 能力项列表增加编辑/删除操作
- [x] 3.6 i18n 新增翻译键

## 4. 验证

- [x] 4.1 验证 domains create/update/delete 通过 WebSocket 测试
- [x] 4.2 验证 items create/update/delete 通过 WebSocket 测试
- [x] 4.3 验证删除保护（有子项时不允许删除）

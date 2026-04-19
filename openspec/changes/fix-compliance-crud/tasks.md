## 1. 后端 - Compliance CRUD API

- [x] 1.1 在 `security-routes.ts` 中新增 `compliance.create` handler — 含 framework 枚举和 status 枚举
- [x] 1.2 新增 `compliance.update` handler — 含权限检查 `compliance.update`
- [x] 1.3 新增 `compliance.delete` handler
- [x] 1.4 增强 `compliance.stats` — 按 framework 分组返回统计数据
- [x] 1.5 数据迁移：现有 compliance.json 条目补充 `framework: 'custom'`、`status: 'not-assessed'`

## 2. 前端 - Data Service

- [x] 2.1 `data-service.ts` 新增 `createCompliance(data)` 方法
- [x] 2.2 新增 `updateCompliance(id, data)` 方法
- [x] 2.3 新增 `deleteCompliance(id)` 方法

## 3. 前端 - 合规管理页面

- [x] 3.1 新建 `sc-compliance-page.ts` — 框架筛选标签栏 + 合规率仪表盘 + 条目列表
- [x] 3.2 实现创建合规项弹窗表单（含 framework 选择、status 选择）
- [x] 3.3 实现编辑合规项弹窗
- [x] 3.4 实现删除确认
- [x] 3.5 接通 `auth-service.ts` 的 `UPDATE_COMPLIANCE` 权限检查

## 4. 前端 - 路由

- [x] 4.1 `app.ts` 修改 `/compliance` 指向 `sc-compliance-page`
- [x] 4.2 `sc-secops-center.ts` 的 `urlToolMap` 移除 `/compliance` 映射
- [x] 4.3 i18n 三语言文件新增合规管理翻译键

## 5. 验证

- [x] 5.1 后端验证：compliance.create/update/delete/stats 通过 WebSocket 测试
- [x] 5.2 前端验证：框架筛选、创建/编辑/删除操作完整
- [x] 5.3 权限验证：无 `compliance.update` 权限的用户无法编辑

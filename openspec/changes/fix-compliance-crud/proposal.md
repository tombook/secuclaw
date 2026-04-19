## Why

合规管理是 CISO 和隐私安全官的核心职责，但当前系统只有只读 API（`compliance.list/get/stats`），用户无法管理合规检查项。更严重的是，前端权限系统已定义 `compliance.update` 权限码（`auth-service.ts:69`, `sc-roles-page.ts:68`），但后端无对应实现，形成了权限空壳。前端路由 `/compliance` 映射到 `baseline` 工具，完全不是合规管理界面。

## What Changes

- **后端**: 新增 `compliance.create`、`compliance.update`、`compliance.delete` 三个 WebSocket API 方法
- **后端**: 扩展 `security-routes.ts` 注册合规写操作 handler
- **后端**: 为 Compliance 实体增加状态字段和框架分类（GDPR/ISO27001/PIPL/等保2.0）
- **前端**: 新建 `sc-compliance-page.ts` 独立页面组件，包含合规列表、创建表单、编辑、合规率统计
- **前端**: `data-service.ts` 新增 `createCompliance`、`updateCompliance`、`deleteCompliance` 方法
- **前端**: `app.ts` 路由更新，`/compliance` 指向新组件
- **前端**: 接通已有的 `compliance.update` 权限码

## Capabilities

### New Capabilities
- `compliance-crud`: 合规管理完整 CRUD + 多框架分类 + 合规率统计

### Modified Capabilities
<!-- 无现有 spec 需要修改 -->

## Impact

- **后端 API**: `packages/core/src/gateway/routes/security-routes.ts` 新增 3 个 handler
- **后端数据**: `compliance.json` 存储结构需支持框架/状态字段
- **前端页面**: 新建 `ui/src/ui/pages/sc-compliance-page.ts`
- **前端路由**: `ui/src/ui/app.ts` 修改 `/compliance` 路由指向
- **前端数据**: `ui/src/ui/data-service.ts` 新增写方法
- **前端权限**: `auth-service.ts` 的 `UPDATE_COMPLIANCE` 权限码接入实际逻辑
- **前端 i18n**: 三语言文件新增翻译键
- **角色影响**: CISO、隐私安全官、安全架构师

## Non-goals

- 不实现合规报告自动生成（由 reports 模块覆盖）
- 不实现合规差距自动分析引擎
- 不实现合规框架的交叉映射（如 ISO27001 → NIST）

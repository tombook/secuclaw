# 能力域管理 CRUD

## 问题
后端已有 `capabilities.domains.create/update/delete` 和 `capabilities.items.create/update/delete` 完整CRUD路由，`capabilities-client.ts` 已有对应方法，但前端无任何创建/编辑UI。用户只能查看域和能力项，无法管理。

## 影响角色
- 🎯 SecuClaw Commander — 无法构建能力体系
- 🏗️ Security Architect — 无法定义安全架构能力
- 🛡️ Security Expert — 无法配置技术能力

## 目标
1. 域管理：新增/编辑域对话框（名称、描述、类型light/dark/security/legal/technology/business）
2. 能力项管理：新增/编辑能力项对话框（名称、描述、所属域、ownerRoles）
3. 域/项删除功能（带确认）
4. 复用已有 `capabilities-client.ts` 中的 `createDomain/updateDomain/deleteDomain/createItem/updateItem/deleteItem`

## 范围
- `ui/src/ui/pages/capabilities/sc-domain-board.ts`
- `ui/src/ui/pages/capabilities/sc-capabilities-page.ts`

## Context

能力中心任务 CRUD 完整，但 `capabilities.domains.list` 和 `capabilities.items.list` 只有只读。前端 `sc-capabilities-page.ts` 和子组件（`sc-domain-board.ts` 等）已完整实现 UI 框架，但缺少域/项的管理操作入口。

## Goals / Non-Goals

**Goals:**
- 新增 `capabilities.domains.create/update/delete`
- 新增 `capabilities.items.create/update/delete`
- 前端 `sc-domain-board.ts` 增加管理操作

**Non-Goals:**
- 域/项权限控制
- 域模板/复制
- 修改 task/evidence/approval

## Decisions

### D1: 后端扩展

**选择**: 在 `capabilities-routes.ts` 中新增 6 个 handler，调用 `capabilities/service.ts` 的新方法。
**原因**: 与现有 tasks/approvals/runs 的路由注册模式一致。

### D2: 前端集成点

**选择**: 在 `sc-domain-board.ts` 的域标题区域增加「编辑」「删除」按钮，在域面板底部增加「新建能力项」按钮。
**原因**: 最小侵入修改，不新建额外组件。

## Risks / Trade-offs

- **域删除级联** → 删除域时需处理其下所有 items 和 tasks（软删除 or 阻止删除）
- **初始数据** → 现有 6 个域是硬编码的，需要确保 CRUD 不破坏初始数据

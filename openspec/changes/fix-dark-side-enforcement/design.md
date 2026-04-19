## Context

黑暗面审批的 UI（`sc-approval-dialog.ts`）和后端 API（`approval.create/approve/reject/canExecute`）已完整。前端权限定义了 `dark-side.view/create/approve/execute` 四级。但执行链路未强制串联 — `canExecute` 检查不是必须的前置条件。

## Goals / Non-Goals

**Goals:**
- 后端：黑暗面操作执行前强制 `canExecute` 检查
- 前端：确保所有黑暗面入口都经过审批拦截
- 路由守卫增加 `dark-side.task.execute` 检查

**Non-Goals:**
- 修改审批流程本身
- 自动审批策略
- 自定义审批工作流

## Decisions

### D1: 后端中间件方案

**选择**: 在黑暗面相关的 route handler 中增加前置检查，调用 `approval.canExecute` 逻辑。
**原因**: 最小侵入，不修改路由架构。在 `capabilities-routes.ts` 的 execute 和 dark-side 相关 handler 增加守卫。

### D2: 前端拦截方案

**选择**: 在 `sc-secops-center.ts` 的黑暗面工具执行入口和 `sc-domain-board.ts` 的黑暗面任务执行处增加审批检查。
**原因**: 这两个是黑暗面操作的唯二入口，集中拦截即可。

## Risks / Trade-offs

- **审批绕过风险** → 仅靠前端拦截不够，必须有后端强制检查
- **性能影响** → 每次黑暗面执行多一次 `canExecute` 查询，可接受
- **用户体验** → 增加审批步骤可能降低操作效率，但这是安全产品必须的

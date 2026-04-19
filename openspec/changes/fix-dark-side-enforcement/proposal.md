## Why

黑暗面审批的 UI 组件（`sc-approval-dialog.ts`）和后端 API（`approval.create/approve/reject/canExecute`）均已实现，前端权限系统也定义了 `dark-side.view/create/approve/execute` 四级权限。但黑暗面技能执行时**未强制调用 `approval.canExecute`** 检查 — 攻击性操作（渗透测试、红队演练等）可能绕过审批直接执行，这是安全策略执行缺口。

## What Changes

- **后端**: 在技能执行/黑暗面任务执行路径上增加 `canExecute` 中间件检查
- **后端**: `approval-routes.ts` 的 `canExecute` 方法与任务执行链路强制串联
- **前端**: 确保所有黑暗面操作入口（渗透测试、红队演练等）执行前弹出审批检查
- **前端**: `sc-secops-center.ts` 中黑暗面工具执行前增加审批拦截
- **前端**: 前端路由守卫增加 `dark-side.task.execute` 权限检查

## Capabilities

### New Capabilities
- `dark-side-guard`: 黑暗面操作强制审批守卫

### Modified Capabilities
- `permission-guard`: 扩展权限守卫，支持黑暗面操作拦截
- `permission-middleware`: 后端中间件增加黑暗面执行检查

## Impact

- **后端中间件**: `packages/core/src/middleware/` 新增/修改黑暗面检查逻辑
- **后端路由**: 相关黑暗面执行路由增加 `canExecute` 前置检查
- **前端组件**: `sc-secops-center.ts` 黑暗面工具增加审批拦截
- **前端权限**: `auth-service.ts` 的 `EXECUTE_DARK_SIDE_TASK` 接入强制检查
- **安全影响**: 确保所有攻击性操作必须经过审批 — 这是产品核心安全策略

## Non-goals

- 不修改审批流程本身（create/approve/reject 已完整）
- 不实现审批的自动化策略（如基于风险等级的自动审批）
- 不实现审批工作流的自定义配置

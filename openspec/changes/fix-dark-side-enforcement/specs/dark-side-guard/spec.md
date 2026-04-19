# Dark Side Guard Spec

## Overview
黑暗面操作强制审批守卫。

## Requirements

### REQ-1: Backend Enforcement
- 黑暗面相关 handler（渗透测试执行、红队演练、APT 模拟等）执行前调用 `canExecute` 逻辑
- 未通过审批的请求返回 `403 Forbidden` + 错误信息
- 审批过期同样拒绝执行

### REQ-2: Frontend Interception
- `sc-secops-center.ts` 黑暗面工具执行按钮点击时，先检查 `approval.canExecute`
- 未审批 → 弹出审批创建对话框
- 已审批 → 执行操作
- 审批被拒 → 显示拒绝原因，禁止执行

### REQ-3: Permission Guard Extension
- `auth-service.ts` 路由守卫增加 `dark-side.task.execute` 检查
- 无权限用户看不到黑暗面入口

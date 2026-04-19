## Why

审批系统存在双路径问题：独立审批页面（`/approval`）调用 `approval.list/delete`，能力中心内嵌审批调用 `capabilities.approvals.*`，但独立页面无法执行审批动作（approve/reject/canExecute），用户必须切换到能力中心才能审批。SIEM 配置页面只调用 `save` 和 `sync`，缺少 `configs.get`（无法加载已有配置）和 `test`（无法测试连接），每次进入页面都是空白状态。KPI 模块后端有 `kpi.summary` 聚合接口但前端未调用，Dashboard 的 KPI 展示依赖多次单独请求而非一次聚合。

## What Changes

- 独立审批页面增加 approve/reject 动作按钮，调用 `approval.approve/reject`
- 暗域执行前强制调用 `approval.canExecute` 检查，未审批时拦截
- SIEM 配置页面初始化时调用 `siem.configs.get` 加载已保存配置，增加"测试连接"按钮调用 `siem.test`
- Dashboard 或 SecOps Center 调用 `kpi.summary` 替代多次单独 KPI 请求

## Capabilities

### New Capabilities

- `approval-full-lifecycle`: 独立审批页面完整生命周期 — 查看、审批、拒绝、删除、执行前检查
- `siem-config-load-test`: SIEM 配置加载 + 连接测试闭环

### Modified Capabilities

## Impact

- 前端文件: `ui/src/ui/pages/sc-approval-list-page.ts`, `ui/src/ui/pages/settings/sc-siem-config.ts`, `ui/src/ui/pages/sc-dashboard.ts` 或 `sc-secops-center.ts`, `ui/src/ui/data-service.ts`
- 后端: 无变更
- 安全: 暗域操作增加审批拦截，属安全策略强化

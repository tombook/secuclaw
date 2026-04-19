## Why

KPI、证据、审批、指挥官等模块存在小缺口：`kpi.summary` 前端未调用；`evidence` 无 update/delete；`approval` 无 delete；`commander` 无 delete。这些缺口不影响核心业务流，但影响数据管理和清理的完整性。

## What Changes

- **后端**: 新增 `evidence.update`、`evidence.delete` 方法
- **后端**: 新增 `approval.delete` 方法
- **后端**: 新增 `commander.delete` 方法
- **前端**: `sc-dashboard.ts` 增加 `kpi.summary` 调用，KPI 数据自动刷新
- **前端**: 能力中心证据面板 `sc-evidence-panel.ts` 增加编辑/删除操作
- **前端**: `data-service.ts` / `capabilities-client.ts` 新增对应方法

## Capabilities

### New Capabilities
- `evidence-management`: 证据更新和删除
- `approval-cleanup`: 审批记录删除清理
- `commander-cleanup`: 指挥官账户注销

### Modified Capabilities
<!-- 无需修改现有 spec -->

## Impact

- **后端 API**: 多个路由文件新增少量 handler
- **前端组件**: `sc-evidence-panel.ts` 增加编辑/删除
- **前端数据**: data-service/capabilities-client 新增方法
- **前端 i18n**: 少量翻译键新增

## Non-goals

- 不重新设计 KPI 计算逻辑
- 不实现数据批量清理/归档功能
- 不实现指挥官数据迁移

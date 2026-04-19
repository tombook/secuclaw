# 审计资源关联查询 — 设计

## UI 变更
审计页新增"资源关联"查询区域：
1. 资源ID输入框 + 查询按钮 → `getAuditByResource(resourceId)`
2. 资源类型+ID组合查询 → `getResourceHistory(type, id)`
3. 结果展示为变更时间线

## 约束
- 不修改 data-service.ts（方法已存在）
- 不修改后端

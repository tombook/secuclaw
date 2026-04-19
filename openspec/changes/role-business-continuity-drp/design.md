# 业务连续性/灾难恢复管理 — 设计

## 架构
新增BCM模块，以业务流程为核心，关联资产、人员和恢复步骤。

## 数据模型
```
BusinessProcess { id, name, criticality, owner, rto, rpo, dependencies[], linkedAssets[] }
BCPPlan { id, processId, version, status, sections[], approver, approvedAt }
DRPPlan { id, name, scope, steps[{order, action, responsible, resources}], testDate }
BCMDrill { id, planId, type(tabletop/full), status, participants[], findings[], score }
RecoveryStatus { id, incidentId, processId, status, progress, estimatedRecovery }
```

## 数据流
1. `bcm.processes.list/create/update` → 业务流程CRUD
2. `bcm.bcp.create/list/approve` → BCP计划管理
3. `bcm.drp.create/list/update` → DRP计划管理
4. `bcm.drills.schedule/execute/evaluate` → 演练管理
5. `bcm.recovery.status` → 恢复状态追踪

## 文件变更
- 新增 bcm-service.ts, bcm-routes.ts
- 新增 sc-bcm-page.ts(标签: 流程/BCP/DRP/演练/恢复)
- data-service.ts 增加 8个bcm方法
- permissions.ts 增加 bcm.read/write

## 约束
- RTO/RPO以小时为单位
- BIA自动计算: criticality × dependencyCount × assetValue
- 演练评分: 0-100，低于60需改进计划

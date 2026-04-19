# SOAR自动化编排 — 设计

## 架构
新增Alert和SOAR模块。Alert统一聚合各类安全事件告警，SOAR提供可编排的自动响应链。

## 数据模型
```
Alert { id, source, severity(P0-P3), category, status(new/assigned/investigating/resolved/closed), assignee, relatedIncidents[], relatedIOCs[] }
PlaybookTemplate { id, name, triggers[], steps[{action, params, condition}], version }
SOARExecution { id, playbookId, alertId, status, currentStep, results[], startedAt }
```

## 数据流
1. `alerts.list/stats` → 告警列表+统计
2. `alerts.classify` → 告警分级+分配
3. `alerts.escalate` → 升级到事件
4. `soar.templates.list` → 可用playbook模板
5. `soar.execute` → 执行自动化流程
6. `soar.executions.list` → 执行历史
7. `soc.kpi` → MTTD/MTTR等运营指标

## 文件变更
- 新增 alert-service.ts, soar-service.ts, alert-routes.ts, soar-routes.ts
- 新增 sc-alert-center.ts(告警列表+分级+升级)
- secops-center.ts 增加SOAR面板和KPI仪表盘
- data-service.ts 增加 10个alert/soar方法

## 约束
- 告警源模拟: 从incidents/vulnerabilities/threats聚合生成
- Playbook步骤类型: notify/notify/notify/notify(4种基本动作)
- MTTD = 平均检测时间, MTTR = 平均响应时间

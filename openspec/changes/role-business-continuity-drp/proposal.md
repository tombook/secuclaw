# 业务安全官 — 业务连续性/灾难恢复管理

## 问题
SecuClaw 缺失业务连续性管理(BCM)和灾难恢复(DRP)功能。业务安全官(SEC+BIZ)无法进行业务影响分析(BIA)、制定BCP/DRP计划、或追踪恢复时间目标(RTO/RPO)。

## 影响角色
- 📊 Business Security Officer — 核心职责无产品支撑
- 🎯 SecuClaw Commander — 缺少危机场景下的业务恢复决策工具
- 👔 CISO — 无法向董事会展示业务连续性准备度
- ⚙️ Security Ops — 缺少灾难恢复演练和执行工具

## 目标
1. 业务影响分析(BIA)：关键业务流程 → 影响评估 → RTO/RPO设定
2. BCP计划管理：创建/编辑/审批业务连续性计划
3. DRP灾难恢复计划：恢复步骤、责任人、资源清单
4. 演练管理：计划演练 → 执行记录 → 结果评估 → 改进措施
5. 恢复状态看板：灾难事件 → 恢复进度追踪 → 业务恢复确认

## 范围
- 新增 `packages/core/src/services/bcm-service.ts`
- 新增 `packages/core/src/gateway/routes/bcm-routes.ts`
- 新增 `ui/src/ui/pages/sc-bcm-page.ts`
- 扩展 `ui/src/ui/data-service.ts`
- 扩展 `packages/core/src/roles/permissions.ts` 增加 BCM 权限

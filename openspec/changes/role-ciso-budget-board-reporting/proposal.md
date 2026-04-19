# CISO/指挥官 — 安全预算与高管报告

## 问题
SecuClaw 缺乏安全预算管理和高管报告功能。CISO无法追踪安全投资分布、无法计算ROI、无法生成董事会级别的安全态势报告。指挥官无法量化跨角色协调的运营成本。

## 影响角色
- 👔 CISO — 无法管理安全预算和向董事会汇报
- 🎯 SecuClaw Commander — 缺少资源分配和成本追踪
- 📊 Business Security Officer — 无法评估安全投资回报
- 🔗 Supply Chain Security — 缺少供应商安全支出追踪

## 目标
1. 安全预算管理：预算分类、分配、消耗追踪、剩余预测
2. 投资回报(ROI)分析：安全投入 vs 风险降低、事件成本对比
3. 董事会报告生成：安全态势摘要、KPI趋势、风险热力图、合规状态
4. 高管仪表盘：一键生成PDF报告、季度对比、行业对标
5. 资源分配看板：人员/工具/培训投入分布

## 范围
- 新增 `packages/core/src/services/budget-service.ts`
- 新增 `packages/core/src/services/report-gen-service.ts`
- 新增 `packages/core/src/gateway/routes/budget-routes.ts`
- 新增 `ui/src/ui/pages/sc-budget-page.ts`
- 新增 `ui/src/ui/pages/sc-board-report-page.ts`
- 扩展 `ui/src/ui/data-service.ts`

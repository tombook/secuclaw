# 安全预算与高管报告 — 设计

## 架构
新增Budget和ReportGen模块。Budget管理安全投资，ReportGen生成结构化报告。

## 数据模型
```
BudgetItem { id, category, amount, spent, remaining, period, owner, status }
Investment { id, name, cost, riskReduction, roiScore, status, category }
BoardReport { id, type(quarterly/monthly/adhoc), sections{}, generatedAt, author }
```

## 数据流
1. `budget.items.list/create/update` → 预算项CRUD
2. `budget.summary` → 预算概览(总额/已用/剩余/预测)
3. `budget.roi.calculate` → ROI计算
4. `reports.board.generate` → 生成董事会报告
5. `reports.board.list` → 历史报告列表
6. `reports.board.export` → 导出报告(JSON/HTML)

## 文件变更
- 新增 budget-service.ts, report-gen-service.ts
- 新增 budget-routes.ts
- 新增 sc-budget-page.ts(预算表+ROI+分配图)
- 新增 sc-board-report-page.ts(报告生成+预览+导出)
- data-service.ts 增加 8个budget/report方法

## 约束
- 预算周期: 月/季/年
- ROI = (风险降低价值 - 投资成本) / 投资成本 × 100
- 报告模板: 执行摘要/风险态势/合规状态/KPI/预算/建议

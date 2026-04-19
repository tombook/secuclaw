# 风险预测前端接入 — 设计

## 数据流
- `dataService.predictRisk(params)` → 调用 `risk.predict`
- `dataService.listRiskPredictions()` → 调用 `risk.listPredictions`
- `dataService.simulateRiskPrediction(params)` → 调用 `risk.simulatePrediction`

## UI 变更
风险页新增"预测"标签页（与因子、评估并列），包含：
1. 预测趋势图表
2. 参数调整面板 + "模拟"按钮
3. 预测历史列表

## 约束
- 需要在 data-service.ts 新增4个方法
- 不修改后端

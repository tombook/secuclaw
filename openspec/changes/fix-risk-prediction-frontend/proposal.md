# 风险预测前端接入

## 问题
后端 `risk-routes.ts` 已有4个预测方法（`risk.predict/listPredictions/getPrediction/simulatePrediction`），但前端零对接。风险页仅有因子CRUD和评估功能，无预测和模拟能力。

## 影响角色
- 👔 CISO — 无法进行风险预测决策
- 📊 Business Security Officer — 无法量化风险影响
- 🎯 SecuClaw Commander — 缺少战略规划数据

## 目标
1. dataService 新增4个预测API方法
2. 风险页新增"预测"标签页，展示趋势图表
3. 新增"模拟"功能：调整参数→调用simulatePrediction→展示结果
4. 预测历史列表展示

## 范围
- `ui/src/ui/pages/sc-risk-page.ts`
- `ui/src/ui/data-service.ts`

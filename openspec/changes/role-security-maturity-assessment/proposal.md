# CISO/架构师 — 安全成熟度评估

## 问题
SecuClaw 缺乏安全成熟度评估工具。CISO和架构师无法量化组织安全能力水平、无法对标行业框架(NIST CSF/ISO 27001/CMMC)、无法追踪改进进度、无法生成董事会级安全态势报告。

## 影响角色
- 👔 CISO — 无法向董事会展示安全成熟度进展
- 🏗️ Security Architect — 缺少架构成熟度评估工具
- 🎯 SecuClaw Commander — 缺少全局安全能力差距分析
- 📊 Business Security Officer — 无法量化安全ROI

## 目标
1. 成熟度框架：NIST CSF五大功能20个类别、ISO 27001控制域、自定义框架
2. 评估工作流：自评估 → 证据收集 → 评审 → 评分 → 改进计划
3. 成熟度雷达图：按框架维度可视化当前水平 vs 目标水平
4. 差距分析：识别优先改进领域、关联已有控制措施
5. 趋势追踪：历史评分对比、改进速度、目标达成预测

## 范围
- 新增 `packages/core/src/services/maturity-service.ts`
- 新增 `packages/core/src/gateway/routes/maturity-routes.ts`
- 新增 `ui/src/ui/pages/sc-maturity-page.ts`
- 扩展 `ui/src/ui/pages/sc-dashboard.ts` 增加成熟度概览卡片
- 扩展 `ui/src/ui/data-service.ts`

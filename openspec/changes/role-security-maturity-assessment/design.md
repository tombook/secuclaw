# 安全成熟度评估 — 设计

## 架构
新增Maturity模块，基于NIST CSF框架提供结构化评估。评估结果生成雷达图和差距分析。

## 数据模型
```
MaturityFramework { id, name, categories[{id, name, questions[], levels[]}] }
Assessment { id, frameworkId, status, scores{}, evidence{}, assessor, date }
ImprovementPlan { id, assessmentId, gaps[], actions[], priority, deadline, owner }
```

## 数据流
1. `maturity.frameworks.list` → 可用评估框架
2. `maturity.assessments.create/list/get` → 评估CRUD
3. `maturity.assessments.submit` → 提交评分
4. `maturity.gaps.list` → 差距分析结果
5. `maturity.trends` → 历史趋势
6. `maturity.improvements.list/create` → 改进计划

## 文件变更
- 新增 maturity-service.ts, maturity-routes.ts
- 新增 sc-maturity-page.ts(框架选择/评估表/雷达图/差距/趋势)
- dashboard.ts 增加成熟度概览卡片
- data-service.ts 增加 7个maturity方法

## 约束
- NIST CSF 5大功能: Identify/Protect/Detect/Respond/Recover
- 评分等级: 1-5 (Initial/Developed/Defined/Managed/Optimized)
- 雷达图使用Canvas或SVG渲染(不引入新依赖)

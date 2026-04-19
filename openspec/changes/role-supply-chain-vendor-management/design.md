# 供应商/第三方管理 — 设计

## 架构
新增Vendor实体和供应链管理模块，复用现有CRUD工厂模式(`crud-factory.ts`)。

## 数据模型
```
Vendor {
  id, name, code, category, tier(critical/important/general),
  riskScore, complianceStatus, contractExpiry,
  contactEmail, securityCertifications[],
  assessmentHistory[], linkedAssets[]
}
```

## 数据流
1. `vendors.list` → 供应商列表(分页/筛选/排序)
2. `vendors.create/update/delete` → CRUD
3. `vendors.assess` → 触发安全评估(问卷 → 评分)
4. `vendors.riskMatrix` → 风险热力图数据
5. `vendors.dependencies` → 依赖关系图

## 文件变更
- 新增 vendor-service.ts, vendor-routes.ts
- 新增 sc-vendors-page.ts(列表+详情+评估)
- 新增 sc-supply-chain-page.ts(依赖图谱+热力图)
- data-service.ts 增加 6个vendor方法
- permissions.ts 增加 `vendors.read/write/delete`

## 约束
- 复用 crud-factory.ts 减少样板代码
- 风险评分算法：certifications×0.3 + assessmentScore×0.4 + incidentHistory×0.3
- 使用 --sc-* CSS 变量设计系统

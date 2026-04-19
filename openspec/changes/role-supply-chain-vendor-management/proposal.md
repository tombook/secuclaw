# 供应链安全官 — 供应商/第三方管理

## 问题
SecuClaw 完全缺失供应商管理、第三方风险评估、供应链可视化功能。供应链安全官（SEC+LEG+BIZ）角色无任何专属页面或功能支持。当前资产管理和合规页面未覆盖供应商实体。

## 影响角色
- 🔗 Supply Chain Security — 核心职责无产品支撑
- 📊 Business Security Officer — 无法评估供应链风险对业务的影响
- 👔 CISO — 无法获取第三方风险报告
- 🎯 SecuClaw Commander — 无法统筹供应链事件响应

## 目标
1. 新增供应商实体（CRUD + 风险评分 + 合规状态）
2. 供应商安全评估工作流（问卷 → 评分 → 审计 → 批准）
3. 供应链可视化：依赖关系图谱、风险热力图
4. 合同安全条款管理和到期提醒
5. 供应商事件关联：漏洞/事件 → 影响供应商评估

## 范围
- 新增 `packages/core/src/services/vendor-service.ts`
- 新增 `packages/core/src/gateway/routes/vendor-routes.ts`
- 新增 `ui/src/ui/pages/sc-vendors-page.ts`
- 新增 `ui/src/ui/pages/sc-supply-chain-page.ts`
- 扩展 `ui/src/ui/data-service.ts`
- 扩展 `packages/core/src/roles/permissions.ts`

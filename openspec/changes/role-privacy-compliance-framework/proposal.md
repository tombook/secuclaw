# 隐私安全官 — 隐私合规框架管理

## 问题
SecuClaw 合规页面仅展示合规项列表，缺乏隐私专项功能：无GDPR/PIPL/CCPA框架映射、无隐私影响评估(PIA)、无数据分类分级、无同意管理、无数据主体权利响应流程。

## 影响角色
- 🔐 Privacy Officer — 核心职责无产品支撑，无法执行PIA和数据分类
- 👔 CISO — 无法查看隐私合规整体状态
- 🔗 Supply Chain Security — 无法评估供应商隐私合规
- 🏗️ Security Architect — 缺少隐私架构设计(Privacy by Design)工具

## 目标
1. 合规框架映射：GDPR/PIPL/CCPA条款 → 控制措施 → 证据关联
2. 隐私影响评估(PIA)工作流：新建评估 → 风险识别 → 缓解措施 → 审批
3. 数据分类分级管理：数据类型 → 敏感级别 → 保护措施
4. 数据主体权利请求管理：访问/删除/携带请求追踪
5. 同意管理仪表盘：同意类型 → 覆盖率 → 过期提醒

## 范围
- 新增 `packages/core/src/services/privacy-service.ts`
- 新增 `packages/core/src/gateway/routes/privacy-routes.ts`
- 新增 `ui/src/ui/pages/sc-privacy-page.ts`
- 扩展 `ui/src/ui/pages/sc-compliance-page.ts` 增加隐私标签
- 扩展 `ui/src/ui/data-service.ts`

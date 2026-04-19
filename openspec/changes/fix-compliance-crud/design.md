## Context

当前合规模块仅有 3 个只读 API（`compliance.list/get/stats`），实现在 `packages/core/src/gateway/routes/security-routes.ts`。前端路由 `/compliance` 指向 `sc-secops-center` 映射到 `baseline` 工具。权限系统已定义 `compliance.update`（`auth-service.ts:69`）但后端无对应实现。

## Goals / Non-Goals

**Goals:**
- 实现合规实体 CRUD（create/update/delete）
- 增加合规框架分类字段（GDPR/ISO27001/PIPL/等保2.0/SOC2）
- 增加 status 字段（compliant/non-compliant/partially-compliant/not-assessed）
- 新建独立前端页面 `sc-compliance-page.ts`
- 接通已有的 `compliance.update` 权限码

**Non-Goals:**
- 合规报告自动生成
- 合规差距自动分析
- 框架交叉映射

## Decisions

### D1: 与 threats 共用 security-routes.ts

**选择**: 在 `security-routes.ts` 中扩展 compliance handler。
**原因**: threats 和 compliance 已在同一文件中，保持一致。

### D2: 合规框架分类

**选择**: 使用 `framework` 枚举字段分类，支持: `gdpr`, `iso27001`, `pipl`, `dengbao`, `soc2`, `pci-dss`, `custom`。
**原因**: 覆盖设计文档中提到的主要合规框架，`custom` 留扩展空间。

### D3: 前端页面

**选择**: 新建 `sc-compliance-page.ts`，包含框架筛选、合规率仪表盘、条目管理。
**原因**: 合规管理需要框架维度的筛选和统计，通用组件无法满足。

## Risks / Trade-offs

- **权限空壳修复** → 需确保 `auth-service.ts` 的 `UPDATE_COMPLIANCE` 与后端新方法一致
- **现有 compliance 数据无 framework 字段** → 迁移脚本补充默认值
- **合规统计 `stats` 方法需更新** → 需按 framework 维度统计

## Context

当前威胁情报模块仅有 4 个只读 API（`threats.list/get/stats/search`），实现在 `packages/core/src/gateway/routes/security-routes.ts`。前端路由 `/threats` 指向通用 `sc-secops-center` 组件，映射到 `threathunt` 工具。`data-service.ts` 仅有 `getThreats/getThreat/getThreatStats/searchThreats`。

## Goals / Non-Goals

**Goals:**
- 实现威胁实体完整 CRUD（create/update/delete/updateStatus）
- 为 Threat 增加状态机生命周期（active → investigating → mitigated → false-positive → closed）
- 新建独立前端页面 `sc-threats-page.ts`
- 前端 data-service 补充写方法
- 路由指向新页面

**Non-Goals:**
- 第三方情报源自动对接
- IOC 自动关联引擎
- 威胁情报审批流程

## Decisions

### D1: 后端实现方式 — 直接在 security-routes.ts 扩展

**选择**: 在现有 `security-routes.ts` 中新增 handler，而非新建独立路由文件。
**原因**: threats 和 compliance 当前共享此文件，保持一致性。后续如果 threats 逻辑变复杂再拆分。
**替代方案**: 新建 `threats-crud-routes.ts`（类似 `incidents-crud-routes.ts` 模式）— 可以考虑但当前复杂度不需要。

### D2: 状态机设计

**选择**: 5 状态流转：`active → investigating → mitigated → false-positive → closed`
**原因**: 与行业标准和设计文档 `FEATURES-DESIGN.md` 中 Threat 实体定义一致。

### D3: 前端页面架构

**选择**: 新建独立 `sc-threats-page.ts`，采用与 `sc-risk-page.ts` 类似的列表+表单模式。
**原因**: 威胁管理需要独立的筛选、搜索、创建/编辑表单，通用 `sc-secops-center` 无法承载。

### D4: 数据存储

**选择**: 继续使用 JSON 文件存储，扩展 `threats.json` 结构增加 status 字段。
**原因**: 与现有架构一致，无需数据库迁移。

## Risks / Trade-offs

- **现有 threats 数据无 status 字段** → 需要数据迁移脚本为现有条目补充 `status: 'active'`
- **security-routes.ts 文件增长** → 可接受，当前仅 61 行，增加后约 150 行
- **通用组件路由清理** → 需同步更新 `sc-secops-center.ts` 的 `urlToolMap` 移除 `/threats`

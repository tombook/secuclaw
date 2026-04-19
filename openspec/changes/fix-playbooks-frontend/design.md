## Context

剧本管理后端已完整实现 10 个 API（`playbook.list/get/create/update/delete/start/getStatus/getExecution/listExecutions/cancel`），前端零接入。这是后端最完整但前端完全缺失的业务域。

## Goals / Non-Goals

**Goals:**
- 新建 `sc-playbooks-page.ts` 独立页面
- `data-service.ts` 新增 9 个 playbook 方法
- 新增 `/playbooks` 路由和侧边栏菜单入口
- 零后端改动

**Non-Goals:**
- 修改后端 API
- 剧本可视化编排
- 剧本模板市场

## Decisions

### D1: 纯前端工作

**选择**: 不修改任何后端代码，后端 10 个 API 已完全就绪。

### D2: 页面架构

**选择**: 新建 `sc-playbooks-page.ts`，采用列表+详情+执行面板三栏布局。
**功能**: 剧本 CRUD 列表、执行按钮（start/cancel）、执行状态展示、执行历史查看。

### D3: 菜单入口

**选择**: 在 `menu-config.ts` 和 `role-centric-menu-config.ts` 新增 `/playbooks` 入口。
**图标**: 📜 剧本管理
**角色**: security-ops、secuclaw-commander、security-expert

## Risks / Trade-offs

- **剧本执行是异步的** → start 后需轮询 `getStatus` 或 WebSocket 事件推送
- **执行历史可能数据量大** → 需要 `listExecutions` 支持分页

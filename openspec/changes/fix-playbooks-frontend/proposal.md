## Why

剧本管理后端已完整实现 CRUD + 执行管理（`playbook.list/get/create/update/delete/start/getStatus/getExecution/listExecutions/cancel` 共 10 个方法），但前端无任何 playbook 页面、路由或调用。整个剧本功能对用户不可见。这是唯一一个后端完全就绪但前端零接入的业务域。

## What Changes

- **前端**: 新建 `sc-playbooks-page.ts` 独立页面，包含剧本列表、创建/编辑表单、启动/取消执行、执行历史查看
- **前端**: `data-service.ts` 新增 `listPlaybooks`、`getPlaybook`、`createPlaybook`、`updatePlaybook`、`deletePlaybook`、`startPlaybook`、`cancelPlaybook`、`getPlaybookStatus`、`listPlaybookExecutions` 方法
- **前端**: `app.ts` 新增 `/playbooks` 路由
- **前端**: 侧边栏菜单配置新增剧本管理入口
- **前端**: i18n 三语言新增剧本管理相关翻译键

## Capabilities

### New Capabilities
- `playbooks-frontend`: 剧本管理前端 UI（后端 10 个 API 完全就绪）

### Modified Capabilities
<!-- 无需修改现有 spec -->

## Impact

- **前端页面**: 新建 `ui/src/ui/pages/sc-playbooks-page.ts`
- **前端路由**: `ui/src/ui/app.ts` 新增 `/playbooks` 路由
- **前端数据**: `ui/src/ui/data-service.ts` 新增 9 个方法
- **前端菜单**: `menu-config.ts` / `role-centric-menu-config.ts` 新增入口
- **前端 i18n**: 三语言文件新增翻译键
- **无后端变更**: 后端 API 已完整，零后端改动

## Non-goals

- 不修改后端 API（已完整）
- 不实现剧本可视化编排（拖拽式工作流）
- 不实现剧本模板市场

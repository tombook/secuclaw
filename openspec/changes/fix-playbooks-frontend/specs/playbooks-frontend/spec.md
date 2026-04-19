# Playbooks Frontend Spec

## Overview
剧本管理前端 UI。后端 10 个 API 完全就绪，仅需前端接入。

## Requirements

### REQ-1: Data Service Extension
- `data-service.ts` 新增:
  - `listPlaybooks()` → `playbook.list`
  - `getPlaybook(id)` → `playbook.get`
  - `createPlaybook(data)` → `playbook.create`
  - `updatePlaybook(id, data)` → `playbook.update`
  - `deletePlaybook(id)` → `playbook.delete`
  - `startPlaybook(id, params?)` → `playbook.start`
  - `cancelPlaybook(id)` → `playbook.cancel`
  - `getPlaybookStatus(id)` → `playbook.getStatus`
  - `listPlaybookExecutions(playbookId)` → `playbook.listExecutions`

### REQ-2: Frontend Page
- 新建 `sc-playbooks-page.ts`
- 剧本列表（名称、描述、步骤数、最后执行时间、状态）
- 创建/编辑剧本表单
- 启动执行按钮 → 弹出参数配置 → 开始执行
- 取消执行按钮
- 执行状态实时展示（轮询 getStatus）
- 执行历史列表

### REQ-3: Route & Menu
- `app.ts` 新增 `{ path: '/playbooks', component: 'sc-playbooks-page', action: guardRoute }`
- `menu-config.ts` 新增: `{ path: '/playbooks', icon: '📜', labelKey: 'nav.playbooks' }`
- `role-centric-menu-config.ts` 相关角色新增入口

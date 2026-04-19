## 1. 前端 - Data Service（纯前端，无后端改动）

- [x] 1.1 `data-service.ts` 新增 `listPlaybooks()` → `playbook.list`
- [x] 1.2 新增 `getPlaybook(id)` → `playbook.get`
- [x] 1.3 新增 `createPlaybook(data)` → `playbook.create`
- [x] 1.4 新增 `updatePlaybook(id, data)` → `playbook.update`
- [x] 1.5 新增 `deletePlaybook(id)` → `playbook.delete`
- [x] 1.6 新增 `startPlaybook(id, params?)` → `playbook.start`
- [x] 1.7 新增 `cancelPlaybook(id)` → `playbook.cancel`
- [x] 1.8 新增 `getPlaybookStatus(id)` → `playbook.getStatus`
- [x] 1.9 新增 `listPlaybookExecutions(playbookId)` → `playbook.listExecutions`

## 2. 前端 - 剧本管理页面

- [x] 2.1 新建 `sc-playbooks-page.ts` — 剧本列表（名称/描述/步骤数/最后执行/状态）
- [x] 2.2 实现创建/编辑剧本表单
- [x] 2.3 实现启动执行按钮 + 参数配置弹窗
- [x] 2.4 实现取消执行按钮
- [x] 2.5 实现执行状态实时展示（轮询 getStatus）
- [x] 2.6 实现执行历史列表
- [x] 2.7 实现删除确认

## 3. 前端 - 路由与菜单

- [x] 3.1 `app.ts` 新增 `{ path: '/playbooks', component: 'sc-playbooks-page', action: guardRoute }`
- [x] 3.2 `menu-config.ts` 新增 `{ path: '/playbooks', icon: '📜', labelKey: 'nav.playbooks' }`
- [x] 3.3 `role-centric-menu-config.ts` 为 security-ops/secuclaw-commander/security-expert 新增入口
- [x] 3.4 i18n 三语言新增剧本管理翻译键

## 4. 验证

- [x] 4.1 验证剧本 CRUD 通过前端 UI 正确调用后端 API
- [x] 4.2 验证启动/取消执行功能
- [x] 4.3 验证执行状态正确展示

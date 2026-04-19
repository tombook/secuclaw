## 1. 后端 - Skills Lifecycle API

- [x] 1.1 `skills-routes.ts` 新增 `skills.install` handler — Commander.skillStates 写入
- [x] 1.2 新增 `skills.uninstall` handler — 移除 skillStates 条目（需先 deactivate）
- [x] 1.3 新增 `skills.activate` handler — 设置 activated=true + activatedAt
- [x] 1.4 新增 `skills.deactivate` handler — 设置 activated=false

## 2. 前端 - Skill Store Extension

- [x] 2.1 `skill-store.ts` 新增 `installSkill(commanderId, roleId)` action
- [x] 2.2 新增 `uninstallSkill(commanderId, roleId)` action
- [x] 2.3 新增 `activateSkill(commanderId, roleId)` action
- [x] 2.4 新增 `deactivateSkill(commanderId, roleId)` action

## 3. 前端 - 技能市场页面

- [x] 3.1 新建 `sc-skills-market-page.ts` — 8 种角色技能卡片网格
- [x] 3.2 每张卡片显示：emoji + 角色名 + 能力摘要 + MITRE/SCF 覆盖数
- [x] 3.3 实现 Install/Uninstall 按钮 + Activate/Deactivate 按钮
- [x] 3.4 实现已安装/已激活筛选标签

## 4. 前端 - 路由

- [x] 4.1 `app.ts` 修改 `/skills-market` 指向新页面
- [x] 4.2 `sc-secops-center.ts` 移除 `/skills-market` 映射
- [x] 4.3 i18n 三语言新增翻译键

## 5. 验证

- [x] 5.1 后端验证：install/uninstall/activate/deactivate 通过 WebSocket 测试
- [x] 5.2 前端验证：安装/激活状态正确反映在卡片上
- [x] 5.3 数据验证：Commander.skillStates 正确持久化

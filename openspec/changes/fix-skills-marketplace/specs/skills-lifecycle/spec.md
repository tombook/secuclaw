# Skills Lifecycle Spec

## Overview
技能安装/卸载/激活/停用生命周期管理。

## Requirements

### REQ-1: Install Skill
- **方法**: `skills.install`
- **参数**: `{ commanderId, roleId }`
- **行为**: 在 Commander.skillStates 中添加条目 `{ installed: true, activated: false, installedAt, version }`
- **校验**: roleId 必须是 8 种角色之一；不能重复安装

### REQ-2: Uninstall Skill
- **方法**: `skills.uninstall`
- **参数**: `{ commanderId, roleId }`
- **行为**: 从 Commander.skillStates 中移除条目
- **校验**: 必须已安装；已激活的需先 deactivate

### REQ-3: Activate Skill
- **方法**: `skills.activate`
- **参数**: `{ commanderId, roleId }`
- **行为**: 设置 `skillStates[roleId].activated = true`、`activatedAt = Date.now()`
- **校验**: 必须已安装

### REQ-4: Deactivate Skill
- **方法**: `skills.deactivate`
- **参数**: `{ commanderId, roleId }`
- **行为**: 设置 `skillStates[roleId].activated = false`

### REQ-5: Frontend Page
- 新建 `sc-skills-market-page.ts`
- 8 种角色技能卡片网格
- 每张卡片显示：角色名、emoji、能力摘要、MITRE/SCF 覆盖数
- 操作按钮：安装/卸载、激活/停用
- 已安装/已激活筛选
- 安装状态持久化到 Commander

### REQ-6: Skill Store Extension
- `skill-store.ts` 新增 `installSkill`、`uninstallSkill`、`activateSkill`、`deactivateSkill` action
- 状态包含安装/激活状态

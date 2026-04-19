# 频道配置与剧本执行完整性

## 问题
1. 频道页 Configure 按钮点击后输出 "coming soon"，未接入 `configureChannel()` 方法
2. 剧本页缺少执行历史查看（`listPlaybookExecutions` 未调用）和取消执行功能（`cancelPlaybook` 未调用）
3. 剧本详情查看未接入 `getPlaybook(id)`

## 影响角色
- ⚙️ Security Ops — 无法配置通知频道、无法管理剧本执行
- 📊 Business Security Officer — 无法追踪业务连续性剧本

## 目标
1. 频道页：Configure 按钮接入 `configureChannel()`，弹出配置表单
2. 剧本页：新增执行历史标签→调用 `listPlaybookExecutions()`
3. 剧本页：执行中任务增加"取消"按钮→调用 `cancelPlaybook()`
4. 剧本页：点击剧本卡片查看详情→调用 `getPlaybook(id)`

## 范围
- `ui/src/ui/pages/sc-channels-page.ts`
- `ui/src/ui/pages/sc-playbooks-page.ts`

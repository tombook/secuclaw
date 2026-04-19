# 频道配置与剧本执行完整性 — 设计

## 频道页变更
Configure 按钮：移除 "coming soon" → 弹出配置表单 → 调用 `dataService.configureChannel(channelId, config)`

## 剧本页变更
1. 新增"执行历史"标签页 → `dataService.listPlaybookExecutions(playbookId)`
2. 执行中状态增加"取消"按钮 → `dataService.cancelPlaybook(execId)`
3. 剧本卡片点击 → 展开详情 → `dataService.getPlaybook(id)`

## 约束
- 不修改 data-service.ts（方法已存在）
- 不修改后端

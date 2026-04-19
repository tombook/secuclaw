# 审计资源关联查询

## 问题
`getAuditByResource()` 和 `getResourceHistory()` 在 dataService 中定义但从未被审计页调用。审计日志只能按关键词搜索，无法按资源ID或资源类型查看变更历史。

## 影响角色
- 👔 CISO — 无法追踪特定资源的合规变更
- 🔐 Privacy Officer — 无法追踪个人数据处理记录
- 🔗 Supply Chain Security — 无法追踪第三方供应商变更
- Auditor — 审计功能不完整

## 目标
1. 审计页新增"资源关联"查询：输入资源ID→调用 `getAuditByResource()`
2. 新增资源变更历史时间线→调用 `getResourceHistory()`
3. 从事件/漏洞/资产详情页可跳转到关联审计记录

## 范围
- `ui/src/ui/pages/sc-audit-page.ts`

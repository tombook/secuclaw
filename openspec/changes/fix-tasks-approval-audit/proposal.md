## 提案：修复任务/审批/审计独立页面

**优先级**: P1  
**类型**: 纯前端修复

后端已有完整 handlers：tasks（8个）、approval（8个）、audit（5个）。前端路由 `/tasks`、`/approval`、`/audit` 均指向 `sc-secops-center`（fallback 到 baseline 工具视图），无独立业务页面。

### 变更范围
- **前端**: 新增 `sc-tasks-page.ts`（任务列表/CRUD/状态流转/统计）
- **前端**: 新增 `sc-approval-list-page.ts`（审批列表/筛选/查看详情）
- **前端**: 新增 `sc-audit-page.ts`（审计日志查询/筛选/资源历史）
- **前端**: `app.ts` 路由迁移，`sc-secops-center.ts` urlToolMap 更新
- **前端**: i18n 三语补全

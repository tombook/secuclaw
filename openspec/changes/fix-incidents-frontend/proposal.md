## 提案：修复事件管理前端闭环

**优先级**: P0  
**类型**: 纯前端修复

后端已有 11 个完整 handler（`incidents.list/get/create/update/delete/stats/enums/getByTicketId/updateStatus/escalate/linkedResources`），前端路由 `/incidents` 指向通用组件 `sc-secops-center`（fallback 到 baseline 工具视图），无独立事件管理页面。

### 变更范围
- **前端**: 新增 `sc-incidents-page.ts`（列表/筛选/CRUD/status流转/escalate）
- **前端**: `data-service.ts` 补全 `deleteIncident`、`escalateIncident`、`getIncidentEnums`
- **前端**: `app.ts` 路由 `/incidents` → 新页面
- **前端**: `sc-secops-center.ts` urlToolMap 移除 `/incidents`
- **前端**: i18n 三语补全

## 提案：修复报表管理前端闭环

**优先级**: P1  
**类型**: 纯前端修复

后端已有 5 个 handler（`reports.listTemplates/generate/get/list/delete`），前端路由 `/reports` 指向 `sc-secops-center`（fallback 到 reports 工具视图），无独立报表管理页面。

### 变更范围
- **前端**: 新增 `sc-reports-page.ts`（模板列表/生成报表/查看/下载/删除）
- **前端**: `data-service.ts` 补全报表相关方法
- **前端**: 路由迁移 + urlToolMap 更新
- **前端**: i18n 三语补全

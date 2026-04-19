## 提案：修复漏洞管理前端闭环

**优先级**: P0  
**类型**: 纯前端修复

后端已有 16 个完整 handler（CRUD + status + assign + batchImport + linkAsset + stats + enums），前端路由 `/vulnerabilities` 指向通用组件 `sc-secops-center`（fallback 到 vulnscan 工具视图），无独立漏洞管理页面。

### 变更范围
- **前端**: 新增 `sc-vulnerabilities-page.ts`（列表/筛选/CRUD/status/assign/batchImport）
- **前端**: `data-service.ts` 补全 `createVulnerability`、`updateVulnerability`、`deleteVulnerability`、`getVulnerabilityEnums`
- **前端**: `app.ts` 路由 `/vulnerabilities` → 新页面
- **前端**: `sc-secops-center.ts` urlToolMap 移除 `/vulnerabilities`
- **前端**: i18n 三语补全

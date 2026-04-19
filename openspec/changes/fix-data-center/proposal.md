## 提案：修复数据中心闭环

**优先级**: P2  
**类型**: 全栈

数据中心当前为空壳：后端无专属 handler，前端路由 `/data-center` 指向 `sc-secops-center`（fallback 到 datacenter 工具视图）。需要先定义后端 API，再构建前端 UI。

### 变更范围
- **后端**: 新增 `data-center.stats` handler（聚合统计各域数据量）
- **后端**: 新增 `data-center.export` handler（全量数据导出）
- **后端**: 新增 `data-center.cleanup` handler（过期数据清理）
- **前端**: 新增 `sc-data-center-page.ts`（数据总览/导出/清理）
- **前端**: 路由迁移 + i18n

## 提案：修复知识库独立页面

**优先级**: P1  
**类型**: 纯前端修复

后端已有 9 个 handler（MITRE: stats/tactics/techniques/search，SCF: stats/domains/controls/search），前端路由 `/knowledge-base` 指向 `sc-secops-center`（fallback 到 baseline），无独立知识库浏览页面。

### 变更范围
- **前端**: 新增 `sc-knowledge-base-page.ts`（MITRE ATT&CK 战术/技术浏览 + SCF 控制/域浏览 + 搜索）
- **前端**: 路由迁移 + urlToolMap 更新
- **前端**: i18n 三语补全

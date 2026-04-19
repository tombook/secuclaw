## Context

漏洞管理和安全工具是 security-expert 和 security-ops 两个角色的核心工作域。当前前端漏洞页面有基础 CRUD，但后端已实现的 6 个辅助 API 未接入；SecOps Center 只展示工具列表，不管理工具执行任务。

**当前状态**:
- `sc-vulnerabilities-page.ts` — 有 list/create/update/delete，缺 asset 关联和批量操作
- `sc-secops-center.ts` — 仅调 `tools.list`，无任务管理
- `data-service.ts` — 漏洞方法缺 6 个，工具方法缺 5 个

## Goals / Non-Goals

**Goals:**
- 前端接入 `vulnerabilities.active/batchUpdateStatus/findByAssetId/getByVulnId/linkAsset/unlinkAsset`
- 前端接入 `tools.createTask/getTask/listTasks/getFindings/cancelTask`
- 保持现有 UI 风格（CSS Custom Properties, sc-* 组件）和 i18n 模式

**Non-Goals:**
- 后端 API 变更（全部已就绪）
- 新增权限码（复用 `vulnerabilities.update` 和暗域执行权限）
- 重构现有漏洞/工具页面组件结构

## Decisions

### D1: 漏洞-资产关联 UI 形式

**选择**: 漏洞详情行内展开关联面板，非独立弹窗
**原因**: 漏洞列表已使用表格布局，行内展开符合安全运营人员快速操作习惯，避免弹窗层级过深
**备选**: 独立关联 tab — 增加导航复杂度，不选

### D2: 批量状态更新触发方式

**选择**: 表格多选 checkbox + 批量操作 toolbar
**原因**: 已在 vulnerabilities 页面的筛选栏旁预留 toolbar 位置，多选+toolbar 是安全产品标准模式

### D3: 工具任务管理嵌入位置

**选择**: 在 SecOps Center 的工具卡片区域增加"执行"按钮和任务进度条
**原因**: 不新增页面，在现有工具展示区域直接增加操作入口，保持 SecOps 中心一站式体验

### D4: API 调用层

**选择**: 统一通过 `data-service.ts` 新增方法，不直接在页面组件中调用 `gatewayClient`
**原因**: 项目已有 data-service 中间层模式，保持一致性

## Risks / Trade-offs

- [漏洞页面复杂度增加] → 控制新增 UI 为渐进式展示（展开面板），不默认显示所有功能
- [工具任务可能长时间运行] → 前端轮询任务状态（复用 playbook 的 pollTimer 模式），3s 间隔
- [批量操作误操作] → 增加确认弹窗，显示影响数量

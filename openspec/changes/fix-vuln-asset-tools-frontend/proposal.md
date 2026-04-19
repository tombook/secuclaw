## Why

漏洞管理后端已实现 6 个前端未调用的辅助接口（`vulnerabilities.active/batchUpdateStatus/findByAssetId/getByVulnId/linkAsset/unlinkAsset`），导致资产-漏洞关联查询、批量状态更新、活跃漏洞筛选等功能对用户不可见。安全工具后端有完整的任务生命周期管理（`tools.createTask/getTask/listTasks/getFindings/cancelTask`），但 SecOps Center 仅调用 `tools.list` 展示工具列表，工具执行、结果查看、任务取消等核心操作无法在前端完成。这两个缺口使得安全运营的核心工作流（发现漏洞→关联资产→批量处置→工具验证）在第2-3步断裂。

## What Changes

- 前端漏洞页面增加资产关联操作：单个漏洞关联/解绑资产，按资产 ID 查询关联漏洞
- 前端漏洞页面增加批量状态更新（`batchUpdateStatus`）和活跃漏洞筛选（`active`）
- 前端 `data-service.ts` 补齐 6 个漏洞 API 调用方法
- SecOps Center 增加工具执行任务管理：创建扫描任务、查看任务进度、查看发现结果、取消任务
- 前端增加工具任务 API 调用方法

## Capabilities

### New Capabilities

- `vuln-asset-correlation`: 漏洞-资产双向关联管理，支持按资产查漏洞、按漏洞关联资产、活跃漏洞筛选、批量状态流转
- `tool-task-management`: 安全工具任务生命周期管理，支持创建→监控→查看结果→取消

### Modified Capabilities

## Impact

- 前端文件: `ui/src/ui/pages/sc-vulnerabilities-page.ts`, `ui/src/ui/pages/sc-secops-center.ts`, `ui/src/ui/data-service.ts`
- 后端: 无变更，仅接入已有 API
- i18n: 新增翻译键
- 权限: 复用已有 `vulnerabilities.update` 和 `tools.execute` 权限码

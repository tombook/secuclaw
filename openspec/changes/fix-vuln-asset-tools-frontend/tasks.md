## 1. data-service.ts 补齐漏洞 API

- [x] 1.1 新增 `getActiveVulnerabilities()` 调用 `vulnerabilities.active`
- [x] 1.2 新增 `batchUpdateVulnStatus(ids, status)` 调用 `vulnerabilities.batchUpdateStatus`
- [x] 1.3 新增 `findVulnsByAssetId(assetId)` 调用 `vulnerabilities.findByAssetId`
- [x] 1.4 新增 `getVulnByVulnId(vulnId)` 调用 `vulnerabilities.getByVulnId`
- [x] 1.5 新增 `linkAssetToVuln(vulnId, assetId)` 调用 `vulnerabilities.linkAsset`
- [x] 1.6 新增 `unlinkAssetFromVuln(vulnId, assetId)` 调用 `vulnerabilities.unlinkAsset`

## 2. data-service.ts 补齐工具任务 API

- [x] 2.1 新增 `createToolTask(params)` 调用 `tools.createTask`
- [x] 2.2 新增 `getToolTask(taskId)` 调用 `tools.getTask`
- [x] 2.3 新增 `listToolTasks(params?)` 调用 `tools.listTasks`
- [x] 2.4 新增 `getToolFindings(taskId)` 调用 `tools.getFindings`
- [x] 2.5 新增 `cancelToolTask(taskId)` 调用 `tools.cancelTask`

## 3. 漏洞页面 UI 集成

- [x] 3.1 `sc-vulnerabilities-page.ts` 增加"活跃漏洞"筛选按钮，调用 `getActiveVulnerabilities()`
- [x] 3.2 表格增加多选 checkbox，选中后显示批量操作 toolbar
- [x] 3.3 批量操作 toolbar 增加"批量更新状态"下拉，调用 `batchUpdateVulnStatus()`
- [x] 3.4 漏洞行增加"关联资产"展开面板，显示已关联资产列表
- [x] 3.5 展开面板增加"关联新资产"和"解绑"操作按钮
- [x] 3.6 搜索栏增加"按 CVE 查找"入口，调用 `getVulnByVulnId()`
- [x] 3.7 i18n 新增翻译键

## 4. SecOps Center 工具任务 UI

- [x] 4.1 `sc-secops-center.ts` 工具卡片增加"执行"按钮
- [x] 4.2 点击执行弹出参数表单，提交调用 `createToolTask()`
- [x] 4.3 新增任务列表区域，调用 `listToolTasks()` 展示运行中任务
- [x] 4.4 任务行显示进度条，running 状态每 3s 轮询 `getToolTask()`
- [x] 4.5 已完成任务显示"查看结果"按钮，调用 `getToolFindings()`
- [x] 4.6 running 任务显示"取消"按钮，调用 `cancelToolTask()`
- [x] 4.7 i18n 新增翻译键

## 5. 验证

- [x] 5.1 漏洞页面活跃筛选、批量状态、资产关联操作通过 WebSocket 测试
- [x] 5.2 SecOps Center 工具任务创建、轮询、取消通过 WebSocket 测试
- [x] 5.3 LSP 诊断无新增错误

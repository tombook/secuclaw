## 1. data-service.ts 补齐审批 API

- [x] 1.1 新增 `approveApproval(id, approver, reason?)` 调用 `approval.approve`
- [x] 1.2 新增 `rejectApproval(id, approver, reason)` 调用 `approval.reject`
- [x] 1.3 新增 `canExecuteApproval(taskId)` 调用 `approval.canExecute`

## 2. data-service.ts 补齐 SIEM API

- [x] 2.1 新增 `getSiemConfigs()` 调用 `siem.configs.get`
- [x] 2.2 新增 `testSiemConnection(params)` 调用 `siem.test`

## 3. data-service.ts 补齐 KPI API

- [x] 3.1 新增 `getKpiSummary()` 调用 `kpi.summary`

## 4. 审批页面 UI 集成

- [x] 4.1 `sc-approval-list-page.ts` pending 记录行增加"批准"按钮
- [x] 4.2 pending 记录行增加"拒绝"按钮 + 可选原因输入
- [x] 4.3 调用 `approveApproval()` / `rejectApproval()` 后刷新列表
- [x] 4.4 i18n 新增翻译键

## 5. 暗域操作审批拦截

- [x] 5.1 在能力中心 `sc-domain-board.ts` 执行暗域操作前调用 `canExecuteApproval()`
- [x] 5.2 未通过时显示"需要审批"提示并阻止执行
- [x] 5.3 i18n 新增翻译键

## 6. SIEM 配置页面 UI

- [x] 6.1 `sc-siem-config.ts` `connectedCallback` 中调用 `getSiemConfigs()` 加载已保存配置（已存在）
- [x] 6.2 加载成功后填充各 tab 表单字段（已存在）
- [x] 6.3 增加"测试连接"按钮，调用 `testSiemConnection()` 展示结果（已存在）
- [x] 6.4 i18n 新增翻译键

## 7. KPI Summary 接入

- [x] 7.1 `sc-secops-center.ts` 在数据加载并行请求中增加 `getKpiSummary()`
- [x] 7.2 在 metrics 区域展示 KPI 聚合数据
- [x] 7.3 i18n 新增翻译键

## 8. 验证

- [x] 8.1 审批页面批准/拒绝操作通过 WebSocket 测试
- [x] 8.2 暗域执行审批拦截验证
- [x] 8.3 SIEM 配置加载 + 测试连接验证（已存在）
- [x] 8.4 KPI summary 数据展示验证
- [x] 8.5 LSP 诊断无新增错误

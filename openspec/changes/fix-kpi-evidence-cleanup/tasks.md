## 1. 后端 - 小缺口修复

- [x] 1.1 新增 `evidence.update` handler（在 capabilities-routes.ts 或独立文件）
- [x] 1.2 新增 `evidence.delete` handler
- [x] 1.3 新增 `approval.delete` handler（在 approval-routes.ts）
- [x] 1.4 新增 `commander.delete` handler（在 commander-routes.ts）
- [x] 1.5 `approval.delete` 校验：仅 status=approved/rejected 可删
- [x] 1.6 `commander.delete` 校验：无激活角色、无 LLM 绑定时允许

## 2. 前端 - KPI Summary

- [x] 2.1 `sc-dashboard.ts` 增加 `kpi.summary` 调用
- [x] 2.2 KPI 数据定时刷新（可选）

## 3. 前端 - 证据面板

- [x] 3.1 `sc-evidence-panel.ts` 增加编辑按钮和编辑表单
- [x] 3.2 增加删除按钮和确认对话框
- [x] 3.3 `capabilities-client.ts` 新增 `updateEvidence`、`deleteEvidence`

## 4. 前端 - 审批列表

- [x] 4.1 审批列表（如已有）增加删除按钮（仅已完成状态显示）

## 5. 前端 - 设置页

- [x] 5.1 Commander 设置增加注销入口和二次确认

## 6. 验证

- [x] 6.1 验证 evidence update/delete 正确执行
- [x] 6.2 验证 approval delete 仅允许已完成状态
- [x] 6.3 验证 commander delete 条件校验
- [x] 6.4 验证 KPI summary 数据正确展示

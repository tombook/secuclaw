## Context

审批是暗域操作（渗透测试、红队演练）的安全策略执行机制。当前独立审批页面只能查看和删除审批记录，无法执行审批动作。SIEM 配置无法加载已有配置。KPI 聚合数据未被利用。

**当前状态**:
- `sc-approval-list-page.ts` — 调用 `approval.list` + `approval.delete`，无 approve/reject
- `sc-siem-config.ts` — 仅 save/sync，无 configs.get/test
- Dashboard — 未调用 `kpi.summary`

## Goals / Non-Goals

**Goals:**
- 独立审批页面支持 approve/reject/canExecute
- SIEM 配置页面支持加载已有配置 + 测试连接
- Dashboard 或 SecOps Center 接入 `kpi.summary`

**Non-Goals:**
- 统一审批双路径（approval.* vs capabilities.approvals.*）— 属架构重构
- 后端变更
- 新增页面或路由

## Decisions

### D1: 审批操作 UI

**选择**: 审批列表行内"批准/拒绝"按钮 + 可选原因输入
**原因**: 审批动作需要快速完成，行内按钮比弹窗高效；原因字段为可选，不强制填写

### D2: canExecute 检查时机

**选择**: 能力中心执行暗域操作前（`capabilities.runs.execute`）调用 `approval.canExecute`
**原因**: 这是安全策略执行点，在此处拦截最直接。不修改已有的 approval.create 流程

### D3: SIEM 配置加载

**选择**: `connectedCallback` 中调用 `siem.configs.get`，填充表单
**原因**: 进入配置页时自动加载，用户看到已保存的配置而非空白

### D4: KPI Summary 调用位置

**选择**: SecOps Center 的 metrics 区域调用 `kpi.summary`
**原因**: SecOps Center 已有 7 个并行数据请求，增加一个 kpi.summary 聚合请求最自然

## Risks / Trade-offs

- [canExecute 拦截可能影响现有执行流] → 仅在暗域操作（dark side）执行前检查，light side 不受影响
- [SIEM 配置加载失败] → 表单保持空白，用户可重新填写，与当前行为一致

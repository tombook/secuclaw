## Capability: approval-full-lifecycle

独立审批页面的完整生命周期管理。

### Requirements

- **REQ-1**: 审批列表展示所有审批记录，含状态（pending/approved/rejected/expired）
- **REQ-2**: pending 状态的审批可执行 approve 操作（调用 `approval.approve`）
- **REQ-3**: pending 状态的审批可执行 reject 操作（调用 `approval.reject`），可填写拒绝原因
- **REQ-4**: 已审批/已拒绝的记录可删除（已有 `approval.delete`）
- **REQ-5**: 暗域操作执行前强制调用 `approval.canExecute`，未通过时拦截并提示需要审批

### Affected Roles
- ciso: 审批暗域操作的主要负责人
- secuclaw-commander: 审批和协调跨角色操作
- security-expert: 提交审批请求、查看审批状态

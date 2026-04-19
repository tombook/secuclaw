## Capability: tool-task-management

安全工具执行任务的全生命周期管理。

### Requirements

- **REQ-1**: 用户可在 SecOps Center 对工具发起执行任务（调用 `tools.createTask`）
- **REQ-2**: 用户可查看所有工具任务的列表及状态（调用 `tools.listTasks`）
- **REQ-3**: 用户可查看单个任务的详情和进度（调用 `tools.getTask`）
- **REQ-4**: 用户可查看任务产生的安全发现结果（调用 `tools.getFindings`）
- **REQ-5**: 用户可取消运行中的任务（调用 `tools.cancelTask`）
- **REQ-6**: 长时间运行的任务（status=running）前端每 3 秒轮询状态
- **REQ-7**: 暗域工具执行前需通过 `approval.canExecute` 检查

### Affected Roles
- security-expert: 发起漏洞扫描、渗透测试任务
- security-ops: 监控任务执行、查看发现结果
- secuclaw-commander: 全局任务状态监控

## Context

KPI、证据、审批、指挥官模块存在小缺口：`kpi.summary` 前端未调用、`evidence` 无 update/delete、`approval` 无 delete、`commander` 无 delete。这些都是低优先级但影响完整性的缺口。

## Goals / Non-Goals

**Goals:**
- 补齐 evidence.update/delete、approval.delete、commander.delete
- 前端集成 kpi.summary 调用
- 前端证据面板增加编辑/删除操作

**Non-Goals:**
- 重新设计 KPI 计算逻辑
- 批量清理/归档
- 指挥官数据迁移

## Decisions

### D1: 批量修复策略

**选择**: 一次性补齐所有小缺口，避免多次小变更。
**原因**: 每个缺口工作量极小（后端 1 个 handler + 前端 1 个调用），合并更高效。

### D2: 删除操作保护

**选择**: 删除操作需二次确认，关键实体（commander）需验证无关联数据。
**原因**: 防止误删。

## Risks / Trade-offs

- **低优先级** → 不阻塞主业务，可与其他高优先级变更并行
- **测试覆盖** → 每个新增 handler 需基本测试

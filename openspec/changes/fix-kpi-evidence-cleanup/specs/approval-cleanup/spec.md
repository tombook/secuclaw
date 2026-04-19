# Approval Cleanup Spec

## Overview
审批记录删除清理。

## Requirements

### REQ-1: Delete Approval
- **方法**: 新增 `approval.delete`
- **参数**: `{ id }`
- **校验**: 仅 status=approved/rejected 的记录可删除（pending 状态不可删）

### REQ-2: Frontend
- 审批列表增加删除按钮（仅已完成状态显示）

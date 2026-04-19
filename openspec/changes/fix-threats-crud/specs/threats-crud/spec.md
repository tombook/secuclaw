# Threats CRUD Spec

## Overview
威胁情报完整 CRUD + 状态机生命周期管理。

## Requirements

### REQ-1: Create Threat
- **方法**: `threats.create`
- **参数**: `{ name, type, severity, confidence, source, ioc, mitreTechniques?, description? }`
- **行为**: 创建新威胁条目，自动生成 `id`、`status: 'active'`、`detectedAt`
- **校验**: `name` 和 `type` 必填

### REQ-2: Update Threat
- **方法**: `threats.update`
- **参数**: `{ id, ...updates }`
- **行为**: 更新威胁条目的可修改字段（name, description, severity, confidence, ioc, mitreTechniques）
- **校验**: `id` 必填

### REQ-3: Delete Threat
- **方法**: `threats.delete`
- **参数**: `{ id }`
- **行为**: 从 threats.json 中移除该条目
- **校验**: `id` 必填

### REQ-4: Update Threat Status
- **方法**: `threats.updateStatus`
- **参数**: `{ id, status, comment? }`
- **行为**: 按状态机流转：`active → investigating → mitigated → false-positive → closed`
- **校验**: 状态只能向前流转或保持不变

### REQ-5: Frontend Page
- 新建 `sc-threats-page.ts`
- 威胁列表（带筛选：severity, status, type）
- 创建威胁表单（弹窗）
- 编辑威胁表单（弹窗）
- 状态流转操作（下拉菜单）
- 删除确认

### REQ-6: Data Migration
- 为现有 threats.json 中无 status 字段的条目补充 `status: 'active'`

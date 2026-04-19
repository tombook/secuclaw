# Capabilities Items CRUD Spec

## Overview
能力项 CRUD 管理。

## Requirements

### REQ-1: Create Item
- **方法**: `capabilities.items.create`
- **参数**: `{ domainId, name, description, roleRequirements?, enabled? }`

### REQ-2: Update Item
- **方法**: `capabilities.items.update`
- **参数**: `{ id, ...updates }`

### REQ-3: Delete Item
- **方法**: `capabilities.items.delete`
- **参数**: `{ id }`
- **校验**: 项下无 tasks 时才允许删除

### REQ-4: Frontend Integration
- `sc-domain-board.ts` 每个域面板底部增加「新建能力项」按钮
- 能力项列表增加编辑/删除操作

# Capabilities Domains CRUD Spec

## Overview
能力域 CRUD 管理。

## Requirements

### REQ-1: Create Domain
- **方法**: `capabilities.domains.create`
- **参数**: `{ name, description, color? }`
- **行为**: 创建新能力域

### REQ-2: Update Domain
- **方法**: `capabilities.domains.update`
- **参数**: `{ id, ...updates }`

### REQ-3: Delete Domain
- **方法**: `capabilities.domains.delete`
- **参数**: `{ id }`
- **校验**: 域下无 items 时才允许删除，否则返回错误

### REQ-4: Frontend Integration
- `sc-domain-board.ts` 域标题区增加「编辑」「删除」按钮
- 增加全局「新建域」按钮
- 编辑/新建使用弹窗表单

# Evidence Management Spec

## Overview
证据更新和删除。

## Requirements

### REQ-1: Update Evidence
- **方法**: 新增后端 handler
- **参数**: `{ id, title?, description?, tags?, files? }`

### REQ-2: Delete Evidence
- **方法**: 新增后端 handler
- **参数**: `{ id }`

### REQ-3: Frontend
- `sc-evidence-panel.ts` 增加编辑和删除按钮

# Compliance CRUD Spec

## Overview
合规管理完整 CRUD + 多框架分类 + 合规率统计。

## Requirements

### REQ-1: Create Compliance
- **方法**: `compliance.create`
- **参数**: `{ title, framework, description?, control?, status?, dueDate?, owner? }`
- **框架枚举**: `gdpr | iso27001 | pipl | dengbao | soc2 | pci-dss | custom`
- **状态枚举**: `compliant | non-compliant | partially-compliant | not-assessed`
- **默认值**: `status: 'not-assessed'`

### REQ-2: Update Compliance
- **方法**: `compliance.update`
- **参数**: `{ id, ...updates }`
- **权限**: 需要 `compliance.update` 权限

### REQ-3: Delete Compliance
- **方法**: `compliance.delete`
- **参数**: `{ id }`

### REQ-4: Enhanced Stats
- **方法**: `compliance.stats`（已有，需增强）
- **返回**: 按 framework 分组统计，含 total/compliant/nonCompliant/partiallyCompliant/notAssessed

### REQ-5: Frontend Page
- 新建 `sc-compliance-page.ts`
- 框架筛选标签栏
- 合规率仪表盘
- 条目列表 + 创建/编辑表单
- 接通 `UPDATE_COMPLIANCE` 权限

### REQ-6: Data Migration
- 现有 compliance.json 条目补充 `framework: 'custom'`、`status: 'not-assessed'`

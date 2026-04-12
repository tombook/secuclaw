## Why

当前系统缺少基于角色的访问控制(RBAC)。8种安全角色仅用于UI展示,任何用户都可访问所有数据和功能。需要实现基于角色的权限系统,确保用户只能访问其角色授权范围内的数据和操作。

## What Changes

### 权限模型定义
- 定义8种安全角色各自的权限范围
- 基于SCF控制框架映射权限
- 支持权限继承和组合

### 权限检查机制
- 前端: 组件级别的权限控制
- 后端: API级别的权限验证
- 数据: 响应级别的字段过滤

### 角色权限配置
```yaml
security-expert:
  data:
    - vulnerabilities: read/write
    - incidents: read
    - assets: read
  actions:
    - vulnerability.scan: allow
    - incident.respond: allow
    - report.generate: allow

privacy-officer:
  data:
    - compliance: read/write
    - incidents: read (privacy-related only)
    - data-subject-requests: read/write
  actions:
    - compliance.audit: allow
    - data-classification: allow
```

### 权限与技能联动
- 角色技能(capabilities)映射到可执行操作
- MITRE覆盖映射到可见威胁类型
- SCF覆盖映射到合规领域权限

## Capabilities

### New Capabilities
- `role-permission`: 基于角色的权限控制
- `permission-check`: 权限检查中间件
- `data-filtering`: 基于权限的数据过滤

### Modified Capabilities
- `role-context`: 扩展支持权限信息

## Impact

- `packages/core/src/middleware/permission-middleware.ts` - 权限检查中间件
- `packages/core/src/roles/permissions.ts` - 权限配置定义
- `ui/src/ui/services/permission-service.ts` - 前端权限服务
- `ui/src/ui/components/sc-permission-guard.ts` - 权限守卫组件
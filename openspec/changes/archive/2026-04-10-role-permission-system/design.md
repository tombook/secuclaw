## Context

当前系统现状:
- 无角色权限控制,所有用户可访问所有功能
- 8种角色仅用于UI展示(角色驱动系统)
- 用户认证基于JWT,但无角色授权

目标:
- 实现基于8种安全角色的RBAC权限系统
- 后端API实现权限验证
- 前端实现组件级别的权限控制
- 数据访问受角色技能范围限制

## Goals / Non-Goals

**Goals:**
- 定义8种角色的权限配置
- 实现后端权限中间件
- 实现前端权限守卫
- 实现基于角色的数据过滤

**Non-Goals:**
- 不实现完整的用户管理(那是另一个系统)
- 不实现OAuth2/AD集成(可扩展)
- 不实现动态权限配置(配置文件驱动)

## Decisions

### 1. 权限配置结构

```typescript
interface RolePermission {
  data: {
    [resource: string]: {
      create?: boolean;
      read?: boolean;
      update?: boolean;
      delete?: boolean;
      fields?: string[]; // 字段级别控制
    };
  };
  actions: {
    [action: string]: boolean;
  };
  scope: {
    // 数据范围限制
    own?: boolean;      // 仅自己的数据
    team?: boolean;     // 团队数据
    all?: boolean;      // 所有数据
  };
}
```

### 2. 权限检查层级

| 层级 | 位置 | 检查内容 |
|------|------|----------|
| API Middleware | 后端 | 请求级别的权限验证 |
| Service | 后端 | 业务逻辑级别的数据过滤 |
| Repository | 后端 | 数据访问级别的字段过滤 |
| Component | 前端 | UI组件的显示/隐藏 |
| Action | 前端 | 按钮/操作的启用/禁用 |

### 3. 权限与技能映射

基于SKILL.md中的capabilities映射权限:

```typescript
const ROLE_ACTION_MAPPING = {
  'security-expert': {
    'vulnerability.scan': true,
    'vulnerability.assess': true,
    'incident.respond': true,
    'report.security': true,
  },
  'privacy-officer': {
    'compliance.audit': true,
    'data.classify': true,
    'privacy.request.handle': true,
    'compliance.report': true,
  },
  // ...
};
```

### 4. 权限检查流程

```
请求 → JWT验证 → 提取用户角色 → 权限中间件 → 
  → 检查资源权限 → 检查动作权限 → 
  → Service层数据过滤 → Repository层字段过滤 → 响应
```

### 5. 前端权限守卫

```typescript
// 组件级别
<sc-permission-guard requires="vulnerability.scan">
  <vulnerability-scan-button />
</sc-permission-guard>

// 服务级别
if (permissionService.can('incident.respond')) {
  showResponseButton();
}
```

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 权限配置复杂 | 8角色×多资源×多操作 | 提供角色模板 |
| 性能开销 | 每次API调用权限检查 | 权限结果缓存 |
| 前端权限绕过 | 恶意用户绕过UI控制 | 后端必须校验 |

## Migration Plan

1. 定义权限配置文件
2. 实现PermissionService
3. 实现后端权限中间件
4. 实现前端权限守卫组件
5. 在现有API上添加权限检查

## Open Questions

1. 权限冲突时优先allow还是deny?
2. 是否需要权限审计日志?
3. 临时权限提升的支持?
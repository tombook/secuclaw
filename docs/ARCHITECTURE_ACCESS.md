# SecuClaw 访问控制架构（四层混合模式）

> **核心问题**：功能的开放应该根据"原型开关"还是"数据信号"驱动？
>
> **SecuClaw 答案**：**两者结合 · 四层混合** —— 各层职责清晰、互不冲突。

## 1. 架构总览

```
┌────────────────────────────────────────────────────────────────┐
│                   统一访问决策 checkAccess(ctx, req)            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Layer 1: 套餐驱动（Plan-Driven）              【商业边界】     │
│  ─────────────────────────────────                             │
│  Free / Starter / Professional / Enterprise / MSSP            │
│  决定：能"购买"哪些模块和能力的可见性                           │
│  拒绝时建议：upgradedPlan + hint                              │
│                          ↓                                     │
│  Layer 4: 原型/灰度（Module/Flag）              【Beta 灰度】    │
│  ─────────────────────────────────                             │
│  Feature Flag：租户/用户/套餐/比例多维度                      │
│  决定：是否处于灰度开放期 + kill switch                       │
│                          ↓                                     │
│  Layer 2: 角色驱动（Role-Driven）              【操作权限】    │
│  ─────────────────────────────────                             │
│  8 指挥台角色 + 3 系统角色                                     │
│  决定：write / read / deny 动作权限                            │
│                          ↓                                     │
│  Layer 3: 数据驱动（Data-Driven）              【能力激活】    │
│  ─────────────────────────────────                             │
│  监听数据信号（资产/日志/PII/SSO）                              │
│  决定：能力是否被"自动激活"                                     │
│                                                                │
│  输出：{ allowed, reason, layer, hint, upgradedPlan }         │
└────────────────────────────────────────────────────────────────┘
```

## 2. 四层职责矩阵

| 层级 | 解决什么问题 | 输入 | 输出 | 拒绝时给什么 |
|------|-------------|------|------|-------------|
| **L1 套餐** | 用户能买什么 | `plan` | 模块/能力可见性 | 升级建议 |
| **L2 角色** | 用户能做什么 | `roleIds, module, action` | 写/读/拒绝 | 角色切换提示 |
| **L3 数据** | 何时能用什么 | `dataSignals` | 能力激活状态 | 接入数据提示 |
| **L4 灰度** | 何时可见 | `userId, tenantId, plan` | 启/停 | 灰度中提示 |

## 3. 文件结构

```
packages/core/src/
├── access/                                ← 核心
│   ├── types.ts                           ← 类型定义
│   ├── plan-registry.ts                   ← Layer 1 套餐配置
│   ├── role-registry.ts                   ← Layer 2 角色权限
│   ├── capability-activator.ts            ← Layer 3 数据驱动
│   ├── feature-flag-service.ts            ← Layer 4 灰度
│   ├── access-control.ts                  ← 统一决策（核心）
│   └── index.ts                           ← 导出
└── gateway/routes/
    └── access-routes.ts                   ← 8 个 API handler
```

## 4. 核心 API

### 4.1 统一访问决策

```typescript
import { checkAccess } from './access/access-control.js';

const ctx: AccessContext = {
  userId: 'u-001',
  tenantId: 'tenant-acme',
  roleIds: ['commander', 'admin'],
  plan: 'professional',
  planStatus: 'active',
  trialEndsAt: null,
  dataSignals: { /* ... */ },
  userCreatedAt: Date.now(),
};

const decision = checkAccess(ctx, {
  module: 'commander',
  capability: 'soar',          // 可选
  action: 'execute',          // read | create | update | delete | execute | admin
});

// 返回示例（允许）
// { allowed: true, reason: 'all layers passed', layer: 2, effectiveAction: 'admin' }

// 返回示例（拒绝 - 套餐不匹配）
// {
//   allowed: false,
//   reason: 'plan free does not include module commander',
//   layer: 1,
//   upgradedPlan: 'starter',
//   hint: '升级到 starter 解锁 commander',
//   effectiveAction: null
// }
```

### 4.2 HTTP API（已上线）

所有 API 通过 `POST /api/v1/access.<method>` 调用：

| Method | 用途 | Body |
|--------|------|------|
| `access.menu.get` | 获取可见菜单 | `{ plan, roles, userId, ... }` |
| `access.check` | 单点决策 | `{ module, capability?, action, plan, roles }` |
| `access.capabilities.list` | 12 能力激活状态 | `{ plan, roles, dataSignals }` |
| `access.signals.sync` | 同步数据信号 | `{ tenantId, dataSignals }` |
| `access.activations.list` | 激活历史 | `{ tenantId }` |
| `access.flags.list` | 列出 Flags | `{}` |
| `access.flags.create` | 创建 Flag | `{ flagKey, enabled, allowedTenants?, allowedPlans?, percentage?, ... }` |
| `access.flags.toggle` | 启/停 Flag | `{ flagKey, enabled }` |

### 4.3 真实环境验证

```bash
# 1. 列出 12 能力激活状态（默认 dev 上下文）
curl -X POST http://127.0.0.1:21981/api/v1/access.capabilities.list \
  -H "Content-Type: application/json" -d '{}'

# 2. 单点决策：管理员读 commander
curl -X POST http://127.0.0.1:21981/api/v1/access.check \
  -H "Content-Type: application/json" \
  -d '{"module":"commander","action":"read"}'
# → { allowed: true, layer: 2, effectiveAction: 'admin' }

# 3. 拒绝场景：Free 套餐访问 commander
curl -X POST http://127.0.0.1:21981/api/v1/access.check \
  -H "Content-Type: application/json" \
  -d '{"module":"commander","action":"read","plan":"free"}'
# → { allowed: false, layer: 1, upgradedPlan: 'starter', hint: '...' }

# 4. 同步数据信号触发能力激活评估
curl -X POST http://127.0.0.1:21981/api/v1/access.signals.sync \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"acme","dataSignals":{"cloudAssets":50,"k8sAssets":3}}'
# → { ok: true, activated: 8, suspended: 1, activatedCapabilities: [...] }
```

## 5. 关键设计原则

### 5.1 套餐分层（商业模型清晰）

```typescript
const PLAN_REGISTRY = {
  free:         { modules: 3, capabilities: 0,  users: 3   },
  starter:      { modules: 9, capabilities: 2,  users: 10  },
  professional: { modules: '*', capabilities: 7, users: 50 },
  enterprise:   { modules: '*', capabilities: '*', users: 500, multiTenant: true, sso: true },
  mssp:         { modules: '*', capabilities: '*', users: -1 /* 无限 */ },
};
```

**关键**：套餐决定的是**可见性**，不直接控制操作（操作由 Layer 2 角色控制）。

### 5.2 角色 8 + 3

```typescript
const ROLE_REGISTRY = {
  // 8 业务角色
  commander: { home: 'commander', writeAccess: ['commander', 'warroom', 'tasks', 'raci'], readAccess: ['*'] },
  ciso:      { home: 'ciso',      writeAccess: ['ciso', 'compliance', 'billing'],      readAccess: ['*'] },
  expert:    { home: 'expert',    writeAccess: ['expert', 'vulnerabilities', 'threats'], readAccess: [...] },
  // ... 5 more
  // 3 系统角色
  admin:     { writeAccess: ['*'], readAccess: ['*'] },
  auditor:   { writeAccess: [],    readAccess: ['*'] },
  developer: { writeAccess: ['market', 'evolution', 'tasks'], readAccess: [...] },
};
```

**关键**：
- 跨角色可"只读"友好（CISO 可看 SOAR 但不能执行）
- `commander` 全局可读 → 战情室协调需要
- `admin` 全局可写 → 租户管理员
- `auditor` 全只读 → 合规审计

### 5.3 数据驱动激活（智能卖点）

```typescript
const CAPABILITY_REQUIREMENTS = {
  cspm:    { conditions: [{ signal: 'cloudAssets', operator: '>=', value: 1 }] },
  rasp:    { conditions: [{ signal: 'k8sAssets',    operator: '>=', value: 1 },
                          { signal: 'endpoints',   operator: '>=', value: 5 }] },
  ueba:    { conditions: [{ signal: 'behaviorLogVolume', operator: '>=', value: 10000 }], matchAll: true },
  privacy: { conditions: [{ signal: 'piiFields', operator: '>=', value: 1 }] },
  // ... 8 more
};
```

**激活流程**：
1. 业务模块（资产接入、日志聚合）触发 `access.signals.sync`
2. 重新评估 12 能力
3. 增量同步到 `CapabilityActivationStore`
4. 触发事件 `capability.activated` / `capability.suspended`
5. UI 实时高亮 / 灰化能力卡片

### 5.4 Feature Flag（多维度灰度）

```typescript
// 基于 userId + flagKey 的稳定哈希分桶
computeUserBucket('u-001', 'new-soar-v2') // → 17 (落在 17% 桶)

// 多维度组合
{
  flagKey: 'new-soar-v2',
  enabled: true,
  allowedTenants: ['acme-corp', 'beta-inc'],   // 租户白名单
  allowedPlans: ['enterprise', 'mssp'],         // 套餐白名单
  percentage: 25,                                // 25% 灰度
}
```

## 6. UI 集成建议

### 6.1 启动时拉取菜单

```typescript
// sc-app-shell.ts 启动时
const { menu } = await invokeAPI('access.menu.get', { /* ctx */ });
// 根据 menu 渲染侧栏（自动隐藏无权访问的项）
```

### 6.2 路由守卫

```typescript
// 路由切换前
const decision = await invokeAPI('access.check', {
  module: targetModule,
  action: 'read'
});
if (!decision.allowed) {
  // 显示 toast: decision.hint
  // 升级提示: decision.upgradedPlan ? '升级到 ${plan} 解锁' : null
  return redirect('/overview');
}
```

### 6.3 能力卡片

```typescript
const { capabilities } = await invokeAPI('access.capabilities.list', {});
// capabilities[i].active = true → 高亮 + 可点击
// capabilities[i].active = false → 灰化 + 显示 reason（提示数据条件）
```

## 7. 与原型的对应关系

| 原型 | 涉及层 |
|------|--------|
| [phase1-portal.html](./prototypes/phase1-portal.html) | L1 套餐 · 顶栏门户切换 |
| [phase1-signup.html](./prototypes/phase1-signup.html) | L1 套餐 · 角色预选 |
| [phase3-sso-billing.html](./prototypes/phase3-sso-billing.html) | L1 套餐升级流程 |
| [role-commander.html](./prototypes/role-commander.html) | L2 角色 · 8 角色 |
| [aux-command-team.html](./prototypes/aux-command-team.html) | L2 角色 · ⌘K 切换 |
| [cap-cspm-dspm-easm.html](./prototypes/cap-cspm-dspm-easm.html) | L3 数据 · 12 能力 |
| [aux-evolution-market.html](./prototypes/aux-evolution-market.html) | L3 数据 + L4 灰度 |

## 8. 扩展点

### 8.1 添加新能力（仅需改一处）

```typescript
// capability-activator.ts
const CAPABILITY_REQUIREMENTS = {
  // ...
  'new-ability': {
    capability: 'new-ability',
    description: '触发条件描述',
    matchAll: false,
    conditions: [
      { signal: 'xxx', operator: '>=', value: 10 }
    ]
  }
};
```

### 8.2 添加新角色（仅需改一处）

```typescript
// role-registry.ts
const ROLE_REGISTRY_LIST = [
  // ...
  {
    id: 'new-role',
    name: '新角色',
    emoji: '🆕',
    description: '...',
    home: 'new-module',
    writeAccess: [...],
    readAccess: [...],
    capabilities: [...]
  }
];
```

### 8.3 灰度发布新功能（仅需 1 次 API 调用）

```typescript
await invokeAPI('access.flags.create', {
  flagKey: 'feature-x',
  enabled: true,
  allowedTenants: ['acme-corp'],
  percentage: 10
});
```

## 9. 与原型开放 vs 数据开放的对比

| 决策 | 原型开放模式 | 数据开放模式 | **SecuClaw 混合模式** |
|------|------------|-------------|-------------------|
| 套餐商业边界 | ✅ 套餐全包 | ❌ 无套餐概念 | ✅ Layer 1 清晰 |
| 角色操作隔离 | ✅ 显式配置 | ⚠️ 通常弱化 | ✅ Layer 2 强 |
| 自动化激活 | ❌ 需用户手动 | ✅ 智能 | ✅ Layer 3 智能 |
| Beta 灰度 | ✅ 简单开关 | ⚠️ 难以实现 | ✅ Layer 4 灵活 |
| 拒绝时给建议 | ⚠️ 弱 | ⚠️ 弱 | ✅ 升级提示 + 数据提示 |
| 套餐/数据不一致 | ❌ 套餐过 | ⚠️ 数据缺 | ✅ 套餐兜底 + 数据驱动 |

**结论**：**混合模式**既保持商业清晰度（套餐），又给用户智能感（数据激活），同时支持灵活的工程实践（Feature Flag）。这是 SaaS 成熟期的最佳实践。

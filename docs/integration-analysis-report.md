# SecuClaw 前后端集成状态分析报告

**分析日期**: 2025-03-25
**分析范围**: 
- 前端: `/secuclaw/ui/src/`
- 后端: `/secuclaw/packages/core/src/api/routes/` + `/secuclaw/packages/core/src/gateway/router.ts`

---

## 一、WebSocket 连接配置

### 前端配置
| 配置项 | 值 |
|--------|-----|
| WebSocket URL | `ws://127.0.0.1:21981/ws` |
| 连接状态 | `disconnected` / `connecting` / `connected` / `error` |
| 重连机制 | 指数退避，最多10次重连 |
| 请求超时 | 30秒 |
| 心跳/缓存 | 1分钟TTL缓存 |

### 后端配置
| 配置项 | 值 |
|--------|-----|
| WebSocket端口 | `21981` (config.gatewayPort) |
| 协议 | JSON-RPC over WebSocket |
| 路径 | `/ws` |

### ✅ WebSocket 配置匹配

---

## 二、API 端点匹配分析

### 2.1 已对接的端点 (Backend Handler 存在)

| 前端方法 | Backend Handler | 状态 |
|----------|-----------------|------|
| `incidents.list` | `incidents.list` | ✅ |
| `incidents.get` | `incidents.get` | ✅ |
| `incidents.stats` | `incidents.stats` | ✅ |
| `incidents.updateStatus` | `incidents.updateStatus` | ✅ |
| `vulnerabilities.list` | `vulnerabilities.list` | ✅ |
| `vulnerabilities.get` | `vulnerabilities.get` | ✅ |
| `vulnerabilities.stats` | `vulnerabilities.stats` | ✅ |
| `vulnerabilities.updateStatus` | `vulnerabilities.updateStatus` | ✅ |
| `vulnerabilities.assign` | `vulnerabilities.assign` | ✅ |
| `threats.list` | `threats.list` | ✅ |
| `threats.get` | `threats.get` | ✅ |
| `threats.stats` | `threats.stats` | ✅ |
| `threats.search` | `threats.search` | ✅ |
| `compliance.list` | `compliance.list` | ✅ |
| `compliance.get` | `compliance.get` | ✅ |
| `compliance.stats` | `compliance.stats` | ✅ |
| `assets.list` | `assets.list` | ✅ |
| `assets.get` | `assets.get` | ✅ |
| `assets.stats` | `assets.stats` | ✅ |
| `ai.insights` | `ai.insights` | ✅ |
| `ai.anomalies` | `ai.anomalies` | ✅ |
| `ai.trend` | `ai.trend` | ✅ |
| `ai.recommendations` | `ai.recommendations` | ✅ |
| `ai.anomaly.acknowledge` | `ai.anomaly.acknowledge` | ✅ |
| `ai.anomaly.resolve` | `ai.anomaly.resolve` | ✅ |

### 2.2 未对接的端点 (Backend Handler 缺失)

| 前端方法 | 问题描述 | 优先级 |
|----------|----------|--------|
| `ai.chat` | 后端 router.ts 中无 `ai.chat` handler | 🔴 高 |
| `ai.action.execute` | 后端 router.ts 中无 `ai.action.execute` handler | 🔴 高 |
| `incidents.create` | 后端 router.ts 中无 `incidents.create` handler | 🟡 中 |
| `incidents.update` | 后端 router.ts 中无 `incidents.update` handler | 🟡 中 |
| `incidents.delete` | 后端 router.ts 中无 `incidents.delete` handler | 🟡 中 |

---

## 三、详细分析

### 3.1 Incidents 模块

**前端调用 (ai-service.ts / data-service.ts):**
```typescript
// data-service.ts
dataService.getIncidents(params)           // → incidents.list
dataService.getIncident(id)                 // → incidents.get
dataService.createIncident(data)            // → incidents.create ❌
dataService.updateIncident(id, data)        // → incidents.update ❌
dataService.updateIncidentStatus(id, ...)   // → incidents.updateStatus
dataService.getIncidentStats()              // → incidents.stats
```

**Backend Handler (router.ts):**
- ✅ `incidents.list` - 已实现
- ✅ `incidents.get` - 已实现
- ❌ `incidents.create` - **缺失** (但 REST API `/api/v1/incidents` POST 存在)
- ❌ `incidents.update` - **缺失** (但 REST API `/api/v1/incidents/:id` PATCH 存在)
- ✅ `incidents.updateStatus` - 已实现
- ❌ `incidents.delete` - **缺失** (但 REST API DELETE 存在)
- ✅ `incidents.stats` - 已实现

**说明**: 后端同时存在 REST API 和 Gateway RPC 两种接口，但 Gateway 缺少 create/update/delete 操作。

### 3.2 AI Chat 功能

**前端调用 (ai-service.ts):**
```typescript
async chat(context: ChatContext, message: string): Promise<ChatMessage> {
  const response = await gatewayClient.request('ai.chat', {
    context,
    message,
  });
  // ...
}
```

**Backend Handler**: 
- ❌ `ai.chat` - **完全缺失**

**影响**: AI 对话功能完全不可用，前端会降级到本地模拟数据。

### 3.3 AI Action Execute

**前端调用 (ai-service.ts):**
```typescript
async executeAction(actionId: string): Promise<void> {
  await gatewayClient.request('ai.action.execute', {
    actionId,
  });
}
```

**Backend Handler**: 
- ❌ `ai.action.execute` - **完全缺失**

**影响**: 无法通过 AI 建议执行操作。

---

## 四、REST API vs Gateway RPC

### 后端路由文件
| 模块 | REST API 路由文件 |
|------|------------------|
| Incidents | `/api/routes/incidents.ts` |
| Vulnerabilities | `/api/routes/vulnerabilities.ts` |
| Assets | `/api/routes/assets.ts` |
| Roles | `/api/routes/roles.ts` |

### 架构问题

前端同时使用两种通信方式：
1. **Gateway RPC** (WebSocket) - 通过 `gatewayClient.request()` 调用
2. **REST API** (HTTP) - 直接调用后端 Express 路由

当前问题：Gateway RPC 缺少部分 CRUD 操作。

---

## 五、对接优先级建议

### 🔴 P0 - 必须实现 (阻塞核心功能)

| 缺失项 | 原因 | 实现建议 |
|--------|------|----------|
| `ai.chat` | AI 对话功能完全不可用 | 实现 LLM 集成 handler |
| `incidents.create` | 无法创建事件工单 | 映射到 REST API POST /api/v1/incidents |
| `incidents.update` | 无法更新事件详情 | 映射到 REST API PATCH /api/v1/incidents/:id |

### 🟡 P1 - 重要 (影响完整性)

| 缺失项 | 原因 | 实现建议 |
|--------|------|----------|
| `ai.action.execute` | 无法执行 AI 建议的操作 | 实现 action execution handler |
| `incidents.delete` | 无法删除事件 | 映射到 REST API DELETE |

### 🟢 P2 - 优化 (可降级处理)

| 缺失项 | 当前降级处理 |
|--------|-------------|
| `ai.*` 相关缺失 | 前端有 mock 数据，可正常运行 |

---

## 六、修复建议

### 6.1 添加缺失的 Gateway Handlers

在 `/packages/core/src/gateway/router.ts` 中添加:

```typescript
// AI Chat handler
private async handleAIChat(params: Record<string, unknown>) {
  const { context, message } = params;
  if (!message) throw new Error('Missing required parameter: message');
  // TODO: 实现 LLM 集成
  return {
    id: `msg_${Date.now()}`,
    role: 'assistant',
    content: 'LLM integration not implemented',
    timestamp: Date.now(),
  };
}

// Action execute handler
private async handleAIActionExecute(params: Record<string, unknown>) {
  const { actionId } = params;
  if (!actionId) throw new Error('Missing required parameter: actionId');
  // TODO: 实现 action 执行逻辑
  return { success: false, message: 'Action execution not implemented' };
}

// Incidents create handler
private async handleIncidentsCreateGateway(params: Record<string, unknown>) {
  return this.getIncidentsService().create({...});
}
```

### 6.2 注册新 Handlers

在 `registerHandlers()` 方法中添加:
```typescript
this.handlers.set('ai.chat', this.handleAIChat.bind(this));
this.handlers.set('ai.action.execute', this.handleAIActionExecute.bind(this));
this.handlers.set('incidents.create', this.handleIncidentsCreateGateway.bind(this));
this.handlers.set('incidents.update', this.handleIncidentsUpdateGateway.bind(this));
```

---

## 七、总结

| 类别 | 数量 | 状态 |
|------|------|------|
| 总前端调用 | 29 | |
| 已对接 | 24 | ✅ 82.8% |
| 未对接 | 5 | ❌ 17.2% |

**关键发现**:
1. WebSocket 连接配置匹配 ✅
2. 核心数据模块 (Incidents/Vulnerabilities/Assets/Threats) 已基本对接
3. AI Chat 和 Action 功能完全缺失
4. 事件创建/更新需要从 REST API 迁移到 Gateway RPC

**建议优先修复**:
1. 添加 `ai.chat` handler (P0)
2. 添加 `incidents.create` / `incidents.update` handlers (P0)
3. 添加 `ai.action.execute` handler (P1)

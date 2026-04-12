## Context

后端 WebSocket 网关 (`packages/core/src/gateway/server.ts`) 使用批量消息发送响应：

```typescript
// server.ts line 244
const batched = JSON.stringify({ type: 'batch', messages: [message] });
```

前端 gateway-client (`ui/src/ui/gateway-client.ts`) 只能处理单个消息格式 `{ type: 'res' }`。

此外，gateway-client 直接连接 `ws://127.0.0.1:21981/ws` 绕过了 Vite 代理，在开发环境中无法正确路由。

## Goals / Non-Goals

**Goals:**
- 前端正确解析后端批量消息格式
- WebSocket 连接通过 Vite 代理正确路由
- 消息队列在重连后能正确处理

**Non-Goals:**
- 不修改后端消息格式（保持向后兼容）
- 不修改网关路由逻辑

## Decisions

### 1. 修改前端处理批量消息

**选择**: 在 gateway-client 添加 `handleSingleMessage` 私有方法

```typescript
private handleMessage(data: string): void {
  const parsed = JSON.parse(data);
  if (parsed.type === 'batch' && Array.isArray(parsed.messages)) {
    for (const msg of parsed.messages) {
      this.handleSingleMessage(msg);
    }
  } else {
    this.handleSingleMessage(parsed);
  }
}
```

**替代方案**:
- 修改后端移除批量模式 - 不选，因为需要改后端且影响其他客户端
- 在 handleMessage 中直接处理 - 不选，因为代码重复

### 2. WebSocket 连接地址改为相对路径

**选择**: 使用 `/ws` 相对路径

```typescript
constructor(url: string = '/ws') {
  this.url = url;
}
```

**替代方案**:
- 修改 Vite 代理配置 - 不选，因为 Vite 代理已正确配置
- 使用环境变量 - 不选，因为增加复杂性

## Risks / Trade-offs

无显著风险 - 这是纯粹的 bug 修复，不改变任何架构或 API 契约。

## Migration Plan

1. 部署修复后的前端
2. 验证 WebSocket 连接正常
3. 验证登录和数据加载功能

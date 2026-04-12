## Why

用户在登录时出现 WebSocket 消息超时问题。后端网关发送的消息格式为批量模式 `{ type: 'batch', messages: [...] }`，但前端 gateway-client 无法正确解析处理，导致所有请求失败。

## What Changes

- 修复前端 gateway-client 正确解析后端批量消息格式
- 修复 gateway-client 使用相对路径 `/ws` 通过 Vite 代理连接后端
- 优化消息队列重连逻辑，避免离线消息堆积导致超时

## Capabilities

### New Capabilities

- `ws-message-batch`: 支持解析后端批量消息格式

### Modified Capabilities

- `gateway-client`: 修改 WebSocket 连接地址和消息处理逻辑

## Impact

- 修改文件: `ui/src/ui/gateway-client.ts`
- 配置文件: `ui/vite.config.ts` (已配置 `/ws` 代理)

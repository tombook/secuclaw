## Why

The SecuClaw backend currently runs two separate servers on ports 21981 (WebSocket Gateway) and 21982 (REST API), which adds complexity for deployment, configuration, and frontend connectivity. Simplifying to a single port reduces operational overhead and improves the developer experience.

## What Changes

1. **Merge WebSocket Gateway and REST API into a single HTTP server** running on port 21981
2. **Remove the separate REST API server** on port 21982
3. **Update config-service.ts** to use a single port configuration
4. **Update UI frontend** to connect to single endpoint
5. **Update all API calls** to use the unified gateway

## Capabilities

### New Capabilities
- `unified-gateway`: Single server handling both WebSocket (ws://) and HTTP REST API (http://) on the same port

### Modified Capabilities
- (none - this is an infrastructure simplification, not a capability change)

## Impact

**Backend Changes:**
- `packages/core/src/config/config-service.ts` - Remove `api.port` config, use only `gateway.port`
- `packages/core/src/gateway/server.ts` - Add HTTP REST API handler to WebSocket gateway server
- `packages/core/src/main.ts` - Remove separate API server initialization

**Frontend Changes:**
- `ui/src/ui/gateway-client.ts` - No changes needed (already uses WebSocket)
- Any direct REST API calls should be migrated to gateway RPC calls

**Configuration:**
- Environment variables `GATEWAY_PORT` still works
- Environment variable `API_PORT` no longer needed (ignored)

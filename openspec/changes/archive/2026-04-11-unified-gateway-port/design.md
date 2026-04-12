## Context

**Current State:**
- WebSocket Gateway runs on port 21981 (`packages/core/src/gateway/server.ts`)
- REST API Server runs on port 21982 (`packages/core/src/api/server.ts`)
- Frontend connects to both ports for different purposes

**Constraints:**
- WebSocket must remain on a dedicated port for real-time communication
- REST API routes are already implemented in Express
- Need to maintain backward compatibility where possible

## Goals / Non-Goals

**Goals:**
- Single port (21981) for all backend communication
- WebSocket upgrade handling on the same HTTP server
- REST API routes accessible via HTTP on the same port
- Simplified deployment and configuration

**Non-Goals:**
- Not converting REST API to WebSocket RPC (that would be a separate change)
- Not removing Express-based REST API infrastructure
- Not changing existing REST API route handlers

## Decisions

### Decision 1: Use HTTP server as base for WebSocket

**Choice:** Modify `gateway/server.ts` to create an HTTP server that handles both WebSocket upgrades and HTTP REST API routes.

**Rationale:**
- WebSocketServer can attach to an existing HTTP server
- Express app can be mounted as middleware on the HTTP server
- Minimal changes to existing code structure

**Alternatives Considered:**
- Separate process/container for WebSocket vs REST API → rejected (adds deployment complexity)
- Convert REST API to WebSocket RPC → rejected (out of scope, significant change)

### Decision 2: Mount Express app on Gateway HTTP server

**Choice:** Create Express app in `gateway/server.ts` and mount REST API routes on it.

**Implementation:**
```typescript
// gateway/server.ts
const httpServer = createServer(this.handleHttpRequest.bind(this));
const wss = new WebSocketServer({ server: httpServer });
// WebSocket handling...
httpServer.listen(port);
```

Where `handleHttpRequest` delegates to Express router for `/api/*` paths.

### Decision 3: Keep REST API routes in existing files

**Choice:** REST API route files remain in `packages/core/src/api/routes/` but are registered on the unified server.

**Rationale:** Minimizes code changes. Routes stay the same, only how they're mounted changes.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| WebSocket upgrade conflicts with REST API paths | WebSocket only on `/ws` path, REST API on `/api/*` |
| Increased complexity in gateway server | Keep HTTP and WS handling clearly separated |
| REST API features (compression, CORS) may not apply to WebSocket | These are HTTP-level, not needed for WebSocket |

## Migration Plan

1. **Phase 1**: Modify `gateway/server.ts` to create unified HTTP server
2. **Phase 2**: Move/create Express app in gateway server
3. **Phase 3**: Register REST API routes on unified server
4. **Phase 4**: Remove `api/server.ts` separate initialization from `main.ts`
5. **Phase 5**: Remove `api.port` config from `config-service.ts`
6. **Phase 6**: Verify all endpoints work on single port

**Rollback:** Revert to previous code (git checkout) - two-server architecture can be restored.

## Open Questions

1. Should REST API health check move from `/api/v1/health` to `/health` or `/api/health`?
2. Should we keep `/api/v1/` prefix for REST routes or simplify to `/api/`?

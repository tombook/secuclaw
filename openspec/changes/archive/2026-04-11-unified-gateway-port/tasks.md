## 1. Gateway Server Modification

- [x] 1.1 Modify `gateway/server.ts` to create HTTP server using `createServer()`
- [x] 1.2 Attach WebSocketServer to the HTTP server (instead of separate ws)
- [x] 1.3 Add Express app for HTTP REST API handling

## 2. Express Integration

- [x] 2.1 Import/move Express setup from `api/server.ts` to `gateway/server.ts`
- [x] 2.2 Mount REST API routes on Express app
- [x] 2.3 Handle HTTP requests using Express middleware chain

## 3. Route Registration

- [x] 3.1 Register existing REST API routes on unified server
- [x] 3.2 Keep WebSocket handling at `/ws` path
- [x] 3.3 Route `/api/*` paths to REST API handler

## 4. Main.ts Cleanup

- [x] 4.1 Remove `ApiServer` import and initialization from `main.ts`
- [x] 4.2 Remove separate API server start call
- [x] 4.3 Update startup logs to reflect single server

## 5. Configuration Cleanup

- [x] 5.1 Update `config-service.ts` to mark `api.port` as deprecated
- [x] 5.2 Keep `api.port` in config for backward compatibility (ignored)
- [x] 5.3 Update defaults to remove `api.port` setting

## 6. Verification

- [x] 6.1 Build succeeds with no errors
- [x] 6.2 Backend starts on single port 21981
- [x] 6.3 WebSocket connection works at `ws://127.0.0.1:21981/ws`
- [x] 6.4 REST API works at `http://127.0.0.1:21981/api/v1/*`
- [x] 6.5 Health check returns OK

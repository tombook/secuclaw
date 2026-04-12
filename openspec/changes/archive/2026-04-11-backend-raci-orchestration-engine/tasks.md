## 1. Backend Data Layer

- [x] 1.1 Create `packages/core/src/raci/` module directory with types and interfaces (RaciTask, WarRoomSession, TimelineEvent, TaskStatus enum)
- [x] 1.2 Implement `packages/core/src/raci/task-repository.ts` — CRUD operations for raci-tasks.json using JsonStore
- [x] 1.3 Implement `packages/core/src/raci/session-repository.ts` — CRUD operations for warroom-sessions.json using JsonStore
- [x] 1.4 Create initial data files `packages/core/data/storage/raci-tasks.json` and `warroom-sessions.json` with empty arrays

## 2. RACI Task Engine

- [x] 2.1 Implement `packages/core/src/raci/task-engine.ts` — task state machine (created→assigned→in_progress→pending_handoff→completed, escalated branch)
- [x] 2.2 Implement auto-task-creation from security events — match event type to RACI scenario, create tasks for R roles
- [x] 2.3 Implement role handoff logic — when task reaches pending_handoff, create new task for nextRole, mark original completed
- [x] 2.4 Implement task escalation — escalate up role hierarchy (security-expert → security-ops → ciso → secuclaw-commander)

## 3. War Room Session Management

- [x] 3.1 Implement `packages/core/src/raci/session-manager.ts` — session CRUD, participant management, event timeline
- [x] 3.2 Implement session-event integration — link session to incidents/vulnerabilities/threats by eventId
- [x] 3.3 Implement timeline recording — all task changes, messages, participant events recorded as timeline entries
- [x] 3.4 Implement collaboration messages — store and broadcast messages within session

## 4. RACI Event Bus

- [x] 4.1 Implement `packages/core/src/raci/event-router.ts` — route events based on RACI matrix (R/A/C/I role mapping)
- [x] 4.2 Implement event subscription manager — track which WebSocket clients subscribe to which role/events
- [x] 4.3 Implement security-event-to-RACI bridge — listen to existing EventBus events (incident.created, vulnerability.created, threat.detected) and trigger RACI task creation
- [x] 4.4 Implement notification delivery — push events to subscribed WebSocket clients with role-based filtering

## 5. WebSocket Gateway Routes

- [x] 5.1 Create `packages/core/src/gateway/routes/warroom-routes.ts` — register all warroom.* WebSocket methods
- [x] 5.2 Implement `warroom.createSession`, `warroom.listSessions`, `warroom.getSession` methods
- [x] 5.3 Implement `warroom.joinSession`, `warroom.leaveSession` methods with participant tracking
- [x] 5.4 Implement `warroom.getTimeline`, `warroom.sendMessage` methods
- [x] 5.5 Create `packages/core/src/gateway/routes/raci-routes.ts` — register all raci.* WebSocket methods
- [x] 5.6 Implement `raci.task.create`, `raci.task.list`, `raci.task.updateStatus`, `raci.task.assign` methods
- [x] 5.7 Register both route modules in `main.ts` and export from `routes/index.ts`

## 6. Frontend RACI Store Refactor

- [x] 6.1 Refactor `ui/src/ui/store/raci-store.ts` — from local state management to WebSocket subscription driven
- [x] 6.2 Add WebSocket event listeners for warroom.task.assigned, warroom.task.updated, warroom.message, warroom.participant.* events
- [x] 6.3 Add API call methods to raci-store for createSession, joinSession, getTasks, getTimeline, sendMessage
- [x] 6.4 Implement disconnect/reconnect logic — on reconnect, call getSession to sync latest state

## 7. Frontend War Room Page Update

- [x] 7.1 Update `ui/src/ui/pages/sc-war-room-page.ts` — replace local data loading with raci-store API calls
- [x] 7.2 Update task panel to consume backend task list instead of local workflow config
- [x] 7.3 Update timeline to display events from backend getTimeline API
- [x] 7.4 Update chat to send messages via warroom.sendMessage instead of local state
- [x] 7.5 Update RACI matrix view to show real-time task assignments from backend
- [x] 7.6 Add War Room session creation flow — allow creating session from incidents/threats/vulnerabilities pages

## 8. Integration & Verification

- [x] 8.1 Integrate RACI event bridge with existing incident.created, vulnerability.created, threat.detected events
- [x] 8.2 Verify end-to-end flow: create incident → RACI task auto-created → War Room session created → WebSocket notifications sent
- [x] 8.3 Verify task handoff flow: security-expert completes task → auto-assign to security-ops → notification delivered
- [x] 8.4 Build verification — both packages/core and ui pass tsc --noEmit with 0 errors

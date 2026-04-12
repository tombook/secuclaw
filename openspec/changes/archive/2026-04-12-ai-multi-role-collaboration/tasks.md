## 1. AI Collaboration Engine

- [ ] 1.1 Create `packages/core/src/ai/ai-collaboration-engine.ts` — main orchestrator with trigger(), stop(), getStatus() methods
- [ ] 1.2 Implement Phase 1 (R-role analysis) — call LLM with role persona + event data, write result as War Room message
- [ ] 1.3 Implement Phase 2 (C-role consultation) — parallel LLM calls for all C roles, max 3 concurrent, collect results as War Room messages
- [ ] 1.4 Implement Phase 3 (A-role decision) — call LLM with R+C analysis combined, write decision as War Room message
- [ ] 1.5 Implement Phase 4 (Commander synthesis) — aggregate all role inputs, generate actionable response plan
- [ ] 1.6 Implement Phase 5 (I-role notification) — send summary messages for I roles
- [ ] 1.7 Implement error handling — single role failure skips and logs, overall timeout enforcement at 60s

## 2. AI Model Router

- [ ] 2.1 Create `packages/core/src/ai/ai-model-router.ts` — map RACI types to provider+model configs
- [ ] 2.2 Create default model routing config with the 3 API providers (火山引擎, MiniMax, 智谱)
- [ ] 2.3 Implement config persistence via JsonStore (ai-collaboration/config.json)
- [ ] 2.4 Implement runtime config update method

## 3. AI Collaboration Routes

- [ ] 3.1 Create `packages/core/src/gateway/routes/ai-collaboration-routes.ts`
- [ ] 3.2 Implement `ai.collaboration.trigger` — accepts sessionId, eventType, eventId; triggers engine
- [ ] 3.3 Implement `ai.collaboration.status` — returns current collaboration state for a session
- [ ] 3.4 Implement `ai.collaboration.configure` — get/set model routing config
- [ ] 3.5 Implement `ai.collaboration.stop` — abort running collaboration
- [ ] 3.6 Register routes in main.ts

## 4. RACI Bridge Extension

- [ ] 4.1 Update `packages/core/src/events/raci-bridge.ts` — after session + task creation, call AICollaborationEngine.trigger()
- [ ] 4.2 Pass event data (incident/vuln/threat details) to collaboration engine for LLM context

## 5. Enhanced Role Personas

- [ ] 5.1 Update `packages/core/src/ai/role-persona.ts` — add buildRaciCollaborationPrompt() method with RACI-phase-specific system prompts
- [ ] 5.2 Add Chinese language output instruction to all prompts
- [ ] 5.3 Add collaboration context injection (previous phase results as context for next phase)

## 6. Frontend War Room AI Integration

- [ ] 6.1 Update `ui/src/ui/pages/sc-war-room-page.ts` — add AI collaboration progress bar (R→C→A→汇总 phases)
- [ ] 6.2 Add AI message styling — distinguish AI role messages from human messages with role badge and thinking indicator
- [ ] 6.3 Add "触发AI分析" button in War Room toolbar
- [ ] 6.4 Add collaboration status display (running/complete/failed)

## 7. Verification

- [ ] 7.1 Seed AI collaboration default config in data storage
- [ ] 7.2 Build verification — both packages/core and ui pass tsc --noEmit with 0 errors
- [ ] 7.3 Verify end-to-end: create incident → War Room created → AI collaboration triggered → messages appear

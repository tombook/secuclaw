# Design Decisions

## Decision 1: Sequential RACI Phases, Parallel C-Roles

**Context**: AI roles need to collaborate in a structured way that mirrors real security team workflows.

**Decision**: Execute RACI phases sequentially (R → C → A → Commander → I), but within the C phase, run multiple C-role LLM calls in parallel (max 3 concurrent).

**Rationale**: R must analyze first to establish context. C roles can work independently with R's analysis. A needs all input before deciding. Parallel C-role calls reduce latency from O(n) to O(1) for the consultation phase.

## Decision 2: Model Routing by RACI Assignment

**Context**: Different RACI assignments have different quality requirements. R and A roles need the best reasoning; I roles just need summaries.

**Decision**: Map RACI types to model tiers via configurable routing table. R/A → GLM-5-Turbo (智谱), C → doubao-seed-2.0-pro (火山引擎), I → doubao-seed-2.0-lite (火山引擎).

**Rationale**: Cost optimization without sacrificing quality where it matters. Configuration stored in ai-collaboration/config.json for runtime modification.

## Decision 3: Reuse Existing LLM Infrastructure

**Context**: We have two LLM provider systems (packages/core/src/ai/providers/ and packages/core/src/llm/). Both implement OpenAI-compatible /chat/completions.

**Decision**: Use the `ai/providers/` system (LLMService + provider classes) as it already supports all 5 provider types including bigmodel and minimax. The llm-routes.ts system uses the separate llm/ module with its own provider factory.

**Rationale**: ai/providers/ has the BigModelProvider with correct 智谱 base URL already configured. Avoid duplication.

## Decision 4: Collaboration Output as War Room Messages

**Context**: Each AI role's analysis needs to be visible in the War Room timeline.

**Decision**: Each phase writes output via SessionManager.sendMessage() which creates timeline events. Frontend receives these via existing warroom.message WebSocket subscription.

**Rationale**: Reuses existing real-time infrastructure. No new WebSocket event types needed. Messages appear naturally in the War Room chat alongside human messages.

## Decision 5: Event-Driven Trigger via RACI Bridge Extension

**Context**: AI collaboration should start automatically when security events create War Room sessions.

**Decision**: Extend raci-bridge.ts to call AICollaborationEngine.trigger() after session + task creation. Also expose manual trigger via ai.collaboration.trigger route.

**Rationale**: Automatic analysis is the core value proposition. Manual trigger gives users control for re-analysis.

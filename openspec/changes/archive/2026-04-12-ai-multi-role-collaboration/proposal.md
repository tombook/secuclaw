# AI Multi-Role Collaboration Engine

## Summary

Transform the 8 security AI assistants from independent chat bots into a RACI-matrix-driven collaborative team that automatically analyzes security events in War Room sessions.

## Problem

Currently each AI role acts independently. When an incident occurs, there is no structured multi-role analysis — each role's AI persona is only accessible via manual one-on-one chat. Security events require coordinated expertise across multiple roles.

## Proposed Capabilities

### 1. AI Collaboration Engine (NEW)
Orchestrate multi-role LLM discussions following RACI matrix phases:
- Phase 1: R (Responsible) role analyzes the event
- Phase 2: C (Consulted) roles provide parallel expert opinions
- Phase 3: A (Accountable) role makes decisions based on all input
- Phase 4: Commander synthesizes into actionable response plan
- Phase 5: I (Informed) roles receive summary notifications

Each phase output is written as War Room messages via SessionManager.

### 2. AI Model Router (NEW)
Route LLM calls to appropriate models based on RACI assignment:
- R/A roles → strongest model (GLM-5-Turbo)
- C roles → mid-tier model (doubao-seed-2.0-pro)
- I roles → lightweight model (doubao-seed-2.0-lite)
- Configuration persisted in ai-collaboration/config.json

### 3. AI Collaboration Routes (NEW)
WebSocket methods for frontend control:
- `ai.collaboration.trigger` — start a collaboration session
- `ai.collaboration.status` — query running collaboration progress
- `ai.collaboration.configure` — update model routing config
- `ai.collaboration.stop` — abort running collaboration

### 4. Enhanced RACI Bridge (MODIFY)
Extend existing `raci-bridge.ts` to trigger AI collaboration after creating War Room session + RACI tasks.

### 5. War Room AI UI (MODIFY)
Add collaboration progress indicator and AI message styling to War Room page.

## API Providers

| Provider | Type | Base URL | Models |
|----------|------|----------|--------|
| 火山引擎 | openai | `ark.cn-beijing.volces.com/api/coding/v3` | doubao-seed-2.0-pro, doubao-seed-2.0-lite, deepseek-v3.2, kimi-k2.5 |
| MiniMax | minimax | `api.minimaxi.com/v1` | MiniMax-M2.7, MiniMax-M2.5 |
| 智谱 | bigmodel | `open.bigmodel.cn/api/coding/paas/v4` | GLM-5-Turbo, glm-5.1 |

## Constraints

- Single LLM call timeout: 15 seconds
- Max parallel C-role calls: 3
- Full collaboration timeout: 60 seconds
- Single role failure does not block overall flow
- All collaboration output persisted as War Room timeline messages

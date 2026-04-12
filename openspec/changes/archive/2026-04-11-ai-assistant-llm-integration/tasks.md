## 1. LLM Service Infrastructure

- [x] 1.1 Create `packages/core/src/ai/llm-service.ts` with LLM provider abstraction
- [x] 1.2 Implement OpenAI provider in `packages/core/src/ai/providers/openai.ts`
- [x] 1.3 Implement Anthropic Claude provider in `packages/core/src/ai/providers/anthropic.ts`
- [x] 1.4 Implement Ollama provider in `packages/core/src/ai/providers/ollama.ts`
- [x] 1.5 Add LLM configuration types in `packages/core/src/ai/llm-types.ts`
- [x] 1.6 Create `LLMError` class with error codes (PROVIDER_ERROR, TIMEOUT, INVALID_CONFIG)

## 2. Role Persona Manager

- [x] 2.1 Create `packages/core/src/ai/role-persona.ts` with role-to-persona mapping
- [x] 2.2 Add persona prompts for all 8 security roles (ciso, security-expert, secuclaw-commander, privacy-officer, security-architect, business-security-officer, security-ops, auditor)
- [x] 2.3 Implement fallback generic persona for unknown roles
- [x] 2.4 Include capability categories in role prompts

## 3. Chat Context Aggregation

- [x] 3.1 Create `packages/core/src/ai/chat-context.ts` with context aggregator
- [x] 3.2 Implement dashboard context (vuln counts, incident counts, risk score)
- [x] 3.3 Implement vulnerabilities page context (top critical/high vulns, SLA breaches)
- [x] 3.4 Implement incidents page context (open count by severity, avg response time)
- [x] 3.5 Add caching with configurable TTL (default 60s)

## 4. AI Routes Update

- [x] 4.1 Update `packages/core/src/gateway/routes/ai-routes.ts` - replace mock `ai.chat` with LLMService calls
- [x] 4.2 Inject role persona into system prompt
- [x] 4.3 Inject aggregated context into messages
- [x] 4.4 Implement timeout handling with graceful error response
- [x] 4.5 Add LLM configuration to `aiExperts.config.get/save` (provider, model, apiKey, baseUrl)

## 5. Main.ts Integration

- [x] 5.1 Initialize LLMService in `packages/core/src/main.ts`
- [x] 5.2 Pass LLMService to ai-routes
- [x] 5.3 Add default LLM config (OpenAI gpt-4, timeout 10s)

## 6. Testing & Verification

- [x] 6.1 Test `ai.chat` with OpenAI provider (requires API key)
- [x] 6.2 Test role-context: CISO should get executive summary style
- [x] 6.3 Test role-context: Security Expert should get technical details
- [x] 6.4 Test timeout handling
- [x] 6.5 Test fallback persona for unknown role
- [x] 6.6 Verify no mock responses in UI

## 7. UI Update (Optional Enhancement)

- [x] 7.1 Add streaming support indicator in `ui/src/ui/components/sc-ai-chat.ts`
- [x] 7.2 Add loading state during AI requests

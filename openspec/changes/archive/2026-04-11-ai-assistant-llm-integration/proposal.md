## Why

The AI Assistant (AI助手) in SecuClaw currently returns mock responses (`[Mock AI Response] Received message: "11" in context: "[object Object]"`) instead of actual LLM-powered responses. The system has 8 security roles (security-expert, ciso, secuclaw-commander, privacy-officer, security-architect, business-security-officer, security-ops, auditor) with defined capabilities that should provide role-aware AI responses for 洞察 (insights), 建议 (recommendations), and 对话 (chat). Without real LLM integration, the AI Assistant cannot actually help users with security operations.

## What Changes

1. **LLM Provider Integration**: Add configurable LLM provider support (OpenAI GPT-4, Anthropic Claude, or local models via Ollama)
2. **Role-Aware Prompt Engineering**: AI responses shall adapt based on the user's selected security role context
3. **Conversation History**: Implement chat session management with conversation history
4. **Context Injection**: Include relevant security data (vulnerabilities, incidents, assets) in AI context
5. **Streaming Responses**: Support streaming responses for better UX (optional enhancement)

## Capabilities

### New Capabilities

- `ai-chat-llm`: Core LLM integration for the `ai.chat` method. Handles provider abstraction, prompt construction with role context, conversation history, and streaming responses.
- `ai-context-aggregation`: Aggregates security data (vulnerabilities, incidents, threats, compliance status) into context for AI prompts based on current page/session.
- `ai-role-persona`: Manages role-specific AI personas (CISO gets executive summaries, Security Expert gets technical deep-dives, etc.)

### Modified Capabilities

- `role-context` (existing): Add AI persona and capabilities exposure for LLM prompt construction

## Impact

**Backend Changes:**
- `packages/core/src/gateway/routes/ai-routes.ts` - Replace mock `ai.chat` with real LLM integration
- New `packages/core/src/ai/llm-service.ts` - LLM provider abstraction
- New `packages/core/src/ai/chat-context.ts` - Context aggregation for AI prompts
- `packages/core/src/main.ts` - Initialize LLM service

**Frontend Changes:**
- `ui/src/ui/ai-service.ts` - Add streaming support (optional)
- `ui/src/ui/components/sc-ai-chat.ts` - Handle streaming responses

**Configuration:**
- `ai-experts/config.json` - LLM provider settings (provider, model, apiKey, baseUrl)

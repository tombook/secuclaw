## Context

The SecuClaw platform has an AI Assistant feature with three main functions:
- **洞察 (Insights)**: Context-aware security observations
- **建议 (Recommendations)**: Actionable security recommendations  
- **对话 (Chat)**: Natural language interaction with AI

Currently, only `ai.insights` and `ai.recommendations` return meaningful mock data. The `ai.chat` method returns a literal mock string: `[Mock AI Response] Received message: "11" in context: "[object Object]"`.

The system has 8 security roles with defined capabilities:
- `security-expert`: Technical security operations
- `ciso`: Executive security governance
- `secuclaw-commander`: Full-spectrum security command
- `privacy-officer`: Privacy compliance
- `security-architect`: Security architecture
- `business-security-officer`: Business security alignment
- `security-ops`: Security operations
- `auditor`: Security auditing

Each role has different `light`, `dark`, `security`, `legal`, `technology`, and `business` capabilities that should inform AI responses.

**External Dependencies Needed:**
- LLM Provider (OpenAI GPT-4, Anthropic Claude, or Ollama for local models)

## Goals / Non-Goals

**Goals:**
- Implement real LLM integration for `ai.chat` with actual provider API calls
- Support multiple LLM providers (OpenAI, Anthropic, Ollama) via configuration
- Inject role context into prompts so AI responses match the user's security role
- Include current page context (vulnerabilities, incidents, etc.) in AI prompts
- Maintain backward compatibility with existing `ai.insights` and `ai.recommendations`

**Non-Goals:**
- Streaming responses (defer to future enhancement)
- Replacing existing mock insights/recommendations with AI-generated ones
- Multi-modal AI capabilities (vision, etc.)
- Fine-tuning or training custom models

## Decisions

### Decision 1: LLM Provider Abstraction Layer

**Choice:** Create an `LLMService` interface with provider implementations (OpenAI, Anthropic, Ollama).

**Rationale:** Users may have different LLM providers available. OpenAI is common but Anthropic Claude often provides better reasoning for security analysis. Ollama enables local/offline deployment. Abstraction allows easy swapping.

**Alternative Considered:** Hard-code OpenAI only. Rejected because enterprise users may require local models or different providers.

### Decision 2: Context Injection Strategy

**Choice:** Aggregate current page data (vulnerability counts, incident summaries, risk scores) and inject into system prompt as structured context.

**Rationale:** The `ChatContext` already provides `pageId`, `pageTitle`, and `currentData`. We extend this by fetching live security data and including it in the prompt.

**Alternative Considered:** Let the AI query data itself. Rejected due to complexity and latency.

### Decision 3: Role Persona in System Prompt

**Choice:** Include role-specific capability summary in system prompt to shape AI responses.

**Rationale:** A CISO asking about vulnerabilities should get executive summary with business impact. A Security Expert should get technical details with CVEs and CVSS scores. Role capabilities in `DEFAULT_SKILLS` provide this mapping.

**Alternative Considered:** Train separate prompts per role. Rejected - maintenance burden.

## Risks / Trade-offs

[Risk] LLM API Key Exposure → [Mitigation] Store API keys in config, never in code. Use environment variables or secrets manager.

[Risk] LLM API Latency → [Mitigation] Implement timeout (10s default), show loading state in UI, cache frequent queries.

[Risk] Hallucinated Security Advice → [Mitigation] Include factual context from SecuClaw data, set conservative temperature (0.3), prompt engineering to emphasize data-grounded responses.

[Risk] API Cost → [Mitigation] Implement per-user rate limiting, track token usage, allow disable/enable per deployment.

## Migration Plan

1. **Phase 1 (This Change):** Add LLM service with OpenAI as default provider
2. **Phase 2:** Add streaming support in UI
3. **Phase 3:** Enhance insights/recommendations with AI generation

**Rollback:** Disable LLM by setting provider to "mock" - returns to current mock behavior.

## Open Questions

1. Should we cache AI responses? (Cost vs freshness tradeoff)
2. Should we support function calling / tools for AI? (e.g., AI can query vulnerabilities)
3. What's the rate limit per user?

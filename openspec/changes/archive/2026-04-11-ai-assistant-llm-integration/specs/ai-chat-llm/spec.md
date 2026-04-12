## ADDED Requirements

### Requirement: LLM Service SHALL provide provider abstraction

LLMService SHALL abstract OpenAI, Anthropic Claude, and Ollama providers behind a common interface.

#### Scenario: Send chat request to OpenAI
- **WHEN** `llmService.chat({ provider: 'openai', model: 'gpt-4', messages })` is called
- **THEN** it SHALL call OpenAI Chat Completions API
- **AND** return the response content

#### Scenario: Send chat request to Claude
- **WHEN** `llmService.chat({ provider: 'anthropic', model: 'claude-3-opus', messages })` is called
- **THEN** it SHALL call Anthropic Messages API
- **AND** return the response content

#### Scenario: Send chat request to Ollama
- **WHEN** `llmService.chat({ provider: 'ollama', model: 'llama2', messages })` is called
- **THEN** it SHALL call Ollama Generate API
- **AND** return the response content

#### Scenario: Handle provider error
- **WHEN** LLM provider returns an error
- **THEN** LLMService SHALL throw `LLMError` with code `PROVIDER_ERROR`
- **AND** error message SHALL include provider response

### Requirement: AI Chat SHALL use role-context for persona

When `ai.chat` is called, the system SHALL inject the current role's persona and capabilities into the system prompt.

#### Scenario: CISO gets executive summary style
- **WHEN** user with `ciso` role sends "what vulnerabilities do we have?"
- **THEN** system prompt SHALL include "You are a CISO advisor. Provide concise executive summaries with business impact."
- **AND** AI response SHALL focus on high-level risk and budget implications

#### Scenario: Security Expert gets technical details
- **WHEN** user with `security-expert` role sends "what vulnerabilities do we have?"
- **THEN** system prompt SHALL include "You are a security expert. Provide detailed technical analysis with CVEs and CVSS scores."
- **AND** AI response SHALL include specific vulnerability details and remediation steps

#### Scenario: Security Ops gets actionable items
- **WHEN** user with `security-ops` role sends "what should I work on?"
- **THEN** system prompt SHALL include "You are a security ops analyst. Focus on immediate actions, alerts, and runbooks."
- **AND** AI response SHALL prioritize actionable tasks with SLA status

### Requirement: AI Chat SHALL timeout after configurable duration

If LLM provider does not respond within the timeout period, the request SHALL fail gracefully.

#### Scenario: Request timeout
- **WHEN** LLM provider takes longer than configured timeout (default 10 seconds)
- **THEN** LLMService SHALL abort the request
- **AND** return error with code `TIMEOUT`
- **AND** UI SHALL show "AI request timed out. Please try again."

### Requirement: AI Chat SHALL support configurable API endpoint

LLMService SHALL support custom base URL for enterprise deployments using proxy or local models.

#### Scenario: Use custom OpenAI endpoint
- **WHEN** config has `openai.baseUrl: "https://enterprise-ai.internal.com/v1"`
- **THEN** OpenAI requests SHALL be sent to the custom URL

## ADDED Requirements

### Requirement: Role Persona Manager SHALL provide role-specific system prompts

RolePersonaManager SHALL map security roles to AI system prompt fragments that shape AI responses appropriately.

#### Scenario: Get CISO persona
- **WHEN** `personaManager.getPersona('ciso')` is called
- **THEN** it SHALL return system prompt fragment: "You are a Chief Information Security Officer (CISO) advisor. Focus on strategic risk, compliance, budget impact, and board-level communication. Provide concise executive summaries."

#### Scenario: Get Security Expert persona
- **WHEN** `personaManager.getPersona('security-expert')` is called
- **THEN** it SHALL return system prompt fragment: "You are a security expert analyst. Focus on technical details, CVE/CVSS analysis, exploitation scenarios, and remediation technicalities. Use precise security terminology."

#### Scenario: Get Security Ops persona
- **WHEN** `personaManager.getPersona('security-ops')` is called
- **THEN** it SHALL return system prompt fragment: "You are a security operations analyst. Focus on immediate actions, alert triage, runbook steps, and SLA compliance. Prioritize tasks by urgency."

### Requirement: Role Persona SHALL include capability context

System prompt SHALL include the role's capability categories to guide AI response depth.

#### Scenario: Security Expert includes technical capabilities
- **WHEN** building persona for `security-expert`
- **THEN** system prompt SHALL include their light capabilities: ["漏洞扫描", "补丁管理", "安全监控", ...]
- **AND** their dark capabilities: ["渗透测试", "红队演练", ...]

#### Scenario: Privacy Officer includes legal capabilities
- **WHEN** building persona for `privacy-officer`
- **THEN** system prompt SHALL include their legal capabilities: ["GDPR合规", "CCPA合规", "PIPL合规", ...]

### Requirement: Role Persona SHALL support fallback

If role is unknown, persona manager SHALL return a generic security advisor persona.

#### Scenario: Unknown role fallback
- **WHEN** `personaManager.getPersona('unknown-role')` is called
- **THEN** it SHALL return generic persona: "You are a security advisor. Provide balanced technical and business-focused security guidance."
- **AND** log warning about unknown role

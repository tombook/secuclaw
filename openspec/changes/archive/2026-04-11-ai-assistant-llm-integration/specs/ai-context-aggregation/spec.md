## ADDED Requirements

### Requirement: Chat Context Aggregator SHALL fetch security data

When building context for AI prompts, ChatContextAggregator SHALL fetch relevant security data based on pageId.

#### Scenario: Dashboard context
- **WHEN** pageId is "dashboard"
- **THEN** aggregator SHALL fetch vulnerability counts (critical, high, medium, low)
- **AND** fetch open incident count
- **AND** fetch current risk score
- **AND** include in context as `currentData: { vulnCounts, openIncidents, riskScore }`

#### Scenario: Vulnerabilities page context
- **WHEN** pageId is "vulnerabilities"
- **THEN** aggregator SHALL fetch top 5 critical/high vulnerabilities
- **AND** fetch SLA breach count
- **AND** include in context as `currentData: { topVulnerabilities, slaBreaches }`

#### Scenario: Incidents page context
- **WHEN** pageId is "incidents"
- **THEN** aggregator SHALL fetch open incident count by severity
- **AND** fetch average response time
- **AND** include in context

### Requirement: Chat Context SHALL include recent activity summary

Context SHALL include a brief summary of recent security events to provide AI with situational awareness.

#### Scenario: Include recent incidents
- **WHEN** building context
- **THEN** aggregator SHALL fetch incidents from last 7 days
- **AND** summarize count by category (malware, phishing, unauthorized-access, etc.)

#### Scenario: Include threat indicators
- **WHEN** building context
- **THEN** aggregator SHALL fetch recent threat intel updates
- **AND** include notable IoCs (IP addresses, domains, file hashes)

### Requirement: Chat Context SHALL be cacheable

Context data SHALL be cached to reduce load on data services.

#### Scenario: Use cached context
- **WHEN** context for same pageId is requested within 60 seconds
- **THEN** aggregator SHALL return cached data if available
- **AND** cache TTL SHALL be configurable (default 60s)

#### Scenario: Force refresh context
- **WHEN** `forceRefresh: true` is passed
- **THEN** aggregator SHALL bypass cache
- **AND** fetch fresh data

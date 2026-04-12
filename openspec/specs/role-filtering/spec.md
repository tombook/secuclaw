# role-filtering Specification

## Purpose
TBD - created by archiving change role-driven-system. Update Purpose after archive.
## Requirements
### Requirement: Data lists SHALL filter based on role capabilities

When displaying lists (incidents, vulnerabilities, tasks), the data SHALL be filtered based on the current role's capabilities.

#### Scenario: Vulnerability list for Security Expert
- **WHEN** current role is 'security-expert'
- **THEN** vulnerability list SHALL show all technical security vulnerabilities
- **AND** SHALL highlight vulnerabilities matching role's MITRE coverage

#### Scenario: Incident list for Security Ops
- **WHEN** current role is 'security-ops'
- **THEN** incident list SHALL prioritize: SOC incidents, alerts, security events
- **AND** deprioritize: compliance incidents, business continuity incidents

### Requirement: Sorting SHALL be influenced by role priorities

List item ordering SHALL reflect the current role's priorities.

#### Scenario: Task sorting for Privacy Officer
- **WHEN** current role is 'privacy-officer'
- **THEN** tasks SHALL be sorted by: data protection tasks first, compliance deadlines, then others

#### Scenario: Task sorting for Business Security Officer
- **WHEN** current role is 'business-security-officer'
- **THEN** tasks SHALL be sorted by: business continuity tasks, SLA deadlines, then others

### Requirement: Recommendations SHALL be role-tailored

AI recommendations SHALL be filtered and prioritized based on the current role's domain.

#### Scenario: Recommendations for Security Architect
- **WHEN** current role is 'security-architect'
- **THEN** recommendations SHALL focus on: architecture improvements, design reviews, threat modeling

#### Scenario: Recommendations for CISO
- **WHEN** current role is 'ciso'
- **THEN** recommendations SHALL focus on: budget justifications, strategic initiatives, governance updates

### Requirement: Filter state SHALL persist per role

When user switches roles, their filter state for each role SHALL be remembered.

#### Scenario: Persist filter per role
- **WHEN** user filters vulnerability list by 'critical' severity while in 'security-expert' role
- **AND** user switches to 'ciso' role
- **AND** user switches back to 'security-expert' role
- **THEN** the 'critical' filter SHALL still be active


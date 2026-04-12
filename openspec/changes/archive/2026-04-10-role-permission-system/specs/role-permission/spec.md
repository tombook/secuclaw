## ADDED Requirements

### Requirement: PermissionService SHALL provide role-based permission checks

PermissionService SHALL expose methods to check if a role has permission for data access or actions.

#### Scenario: Check data read permission
- **WHEN** code calls `permissionService.canRead(role, 'vulnerabilities')`
- **THEN** it SHALL return true only if role has read permission on vulnerabilities

#### Scenario: Check action permission
- **WHEN** code calls `permissionService.can(role, 'incident.respond')`
- **THEN** it SHALL return true only if role has action permission

#### Scenario: Check field-level permission
- **WHEN** code calls `permissionService.getAllowedFields(role, 'incidents')`
- **THEN** it SHALL return array of field names the role can access

### Requirement: Each of 8 roles SHALL have defined permissions

Role permissions SHALL be configured based on their SKILL.md capabilities.

#### Scenario: Security Expert permissions
- **WHEN** role is 'security-expert'
- **THEN** data permissions SHALL include: vulnerabilities (full), incidents (read), assets (read)
- **AND** action permissions SHALL include: vulnerability.scan, vulnerability.assess, incident.respond

#### Scenario: Privacy Officer permissions
- **WHEN** role is 'privacy-officer'
- **THEN** data permissions SHALL include: compliance (full), privacy-requests (full), incidents (read, privacy-related only)
- **AND** action permissions SHALL include: compliance.audit, data.classify, privacy.request.handle

#### Scenario: CISO permissions
- **WHEN** role is 'ciso'
- **THEN** data permissions SHALL include: all data (read), compliance (read), security-metrics (read)
- **AND** action permissions SHALL include: report.generate, policy.approve, budget.allocate

#### Scenario: Security Ops permissions
- **WHEN** role is 'security-ops'
- **THEN** data permissions SHALL include: alerts (full), incidents (read/write, SOC-related), logs (read)
- **AND** action permissions SHALL include: alert.acknowledge, incident.escalate, forensic.collect

#### Scenario: Supply Chain Security permissions
- **WHEN** role is 'supply-chain-security'
- **THEN** data permissions SHALL include: vendors (full), third-party-risks (full), dependencies (read)
- **AND** action permissions SHALL include: vendor.assess, risk.accept, dependency.update

### Requirement: PermissionService SHALL support permission inheritance

Roles SHALL inherit permissions from more general roles unless explicitly overridden.

#### Scenario: Commander inherits from others
- **WHEN** role is 'secuclaw-commander'
- **THEN** permissions SHALL be union of all 8 roles' permissions

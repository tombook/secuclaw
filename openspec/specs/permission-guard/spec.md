# permission-guard Specification

## Purpose
TBD - created by archiving change role-permission-system. Update Purpose after archive.
## Requirements
### Requirement: Frontend SHALL control component visibility via permission-guard

Components SHALL be conditionally rendered based on user permissions using sc-permission-guard.

#### Scenario: Show component when permitted
- **WHEN** user has 'vulnerability.scan' permission
- **AND** template contains `<sc-permission-guard requires="vulnerability.scan">`
- **THEN** the guard SHALL render its children

#### Scenario: Hide component when not permitted
- **WHEN** user does NOT have 'vulnerability.scan' permission
- **AND** template contains `<sc-permission-guard requires="vulnerability.scan">`
- **THEN** the guard SHALL NOT render children
- **AND** the guard SHALL render nothing (empty)

### Requirement: Frontend SHALL disable actions based on permissions

Action buttons SHALL be disabled when user lacks required permissions.

#### Scenario: Disable button when not permitted
- **WHEN** user does NOT have 'incident.respond' permission
- **AND** page contains `<button @click=${this.respondToIncident}>`
- **THEN** the button SHALL have disabled attribute
- **AND** the button SHALL show tooltip 'Permission required'

### Requirement: Permission checks SHALL support OR/AND logic

Permission guards SHALL support multiple permission requirements.

#### Scenario: OR permission check
- **WHEN** guard has `requires-any="vulnerability.scan, vulnerability.assess"`
- **THEN** the guard SHALL render children if user has ANY of the permissions

#### Scenario: AND permission check
- **WHEN** guard has `requires-all="vulnerability.scan, incident.read"`
- **THEN** the guard SHALL render children only if user has ALL of the permissions


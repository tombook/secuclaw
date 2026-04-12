# role-context Specification

## Purpose
TBD - created by archiving change role-driven-system. Update Purpose after archive.
## Requirements
### Requirement: RoleContext SHALL be a global singleton store

RoleContext SHALL be accessible from any component and SHALL persist's selected role to localStorage. Additionally, RoleContext SHALL track's current RACI assignment and War Room session context.

#### Scenario: Initialize with default role
- **WHEN** application loads
- **THEN** RoleContext SHALL initialize with 'security-expert' as default role

#### Scenario: Persist role selection
- **WHEN** user selects a role
- **THEN** RoleContext SHALL persist selection to localStorage under key 'secuclaw-role'

#### Scenario: Restore role on reload
- **WHEN** application reloads
- **THEN** RoleContext SHALL restore previously selected role from localStorage

#### Scenario: Track active War Room session
- **WHEN** user enters a War Room
- **THEN** RoleContext SHALL store current War Room session ID and event ID

#### Scenario: Track current RACI assignment
- **WHEN** user is in a War Room with an active security scenario
- **THEN** RoleContext SHALL expose current role's RACI type (R/A/C/I) for that scenario

### Requirement: RoleContext SHALL provide current role profile

RoleContext SHALL expose the full SkillDefinition of currently selected role, including RACI responsibilities.

#### Scenario: Get current role profile
- **WHEN** component requests `roleContext.getProfile()`
- **THEN** it SHALL return the SkillDefinition for current role
- **AND** the profile SHALL include capabilities, mitre_coverage, scf_coverage

#### Scenario: Get current RACI responsibilities
- **WHEN** component requests `roleContext.getRaciAssignments()`
- **THEN** it SHALL return the current role's RACI assignments across all active scenarios

### Requirement: Role selection SHALL trigger reactive updates

When the role changes, all subscribed components SHALL re-render with the new role context, including RACI and War Room state.

#### Scenario: Role change notification
- **WHEN** user calls `roleContext.setRole('privacy-officer')`
- **THEN** all registered listeners SHALL be notified
- **AND** components SHALL re-render with privacy-officer context
- **AND** War Room RACI panel SHALL update to reflect new role's RACI type

### Requirement: RoleContext SHALL support role theme
RoleContext SHALL expose current role's visual theme (primary color, secondary color).

#### Scenario: Get role theme
- **WHEN** component requests `roleContext.getTheme()`
- **THEN** it SHALL return `{ primary: string, secondary: string }` for current role

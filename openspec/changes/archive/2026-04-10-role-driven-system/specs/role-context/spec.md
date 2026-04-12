## ADDED Requirements

### Requirement: RoleContext SHALL be a global singleton store

RoleContext SHALL be accessible from any component and SHALL persist the selected role to localStorage.

#### Scenario: Initialize with default role
- **WHEN** application loads
- **THEN** RoleContext SHALL initialize with 'security-expert' as default role

#### Scenario: Persist role selection
- **WHEN** user selects a role
- **THEN** RoleContext SHALL persist selection to localStorage under key 'secuclaw-role'

#### Scenario: Restore role on reload
- **WHEN** application reloads
- **THEN** RoleContext SHALL restore previously selected role from localStorage

### Requirement: RoleContext SHALL provide current role profile

RoleContext SHALL expose the full SkillDefinition of the currently selected role.

#### Scenario: Get current role profile
- **WHEN** component requests `roleContext.getProfile()`
- **THEN** it SHALL return the SkillDefinition for the current role
- **AND** the profile SHALL include capabilities, mitre_coverage, scf_coverage

### Requirement: Role selection SHALL trigger reactive updates

When the role changes, all subscribed components SHALL re-render with the new role context.

#### Scenario: Role change notification
- **WHEN** user calls `roleContext.setRole('privacy-officer')`
- **THEN** all registered listeners SHALL be notified
- **AND** components SHALL re-render with privacy-officer context

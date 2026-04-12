# role-switcher Specification

## ADDED Requirements

### Requirement: Role switcher SHALL allow users to switch between 8 security roles

The role switcher SHALL display all 8 available roles and allow instant switching.

#### Scenario: Display role options
- **WHEN** user clicks the role switcher
- **THEN** dropdown SHALL display all 8 roles: security-expert, privacy-officer, security-architect, business-security-officer, secuclaw-commander, ciso, security-ops, supply-chain-security
- **AND** each role SHALL show its icon (🔐, 🔒, 🏗️, 📊, 🎯, 👔, ⚙️, 🔗)
- **AND** each role SHALL show its display name in Chinese

#### Scenario: Switch to different role
- **WHEN** user selects a different role from the dropdown
- **THEN** RoleContext SHALL update to the selected role
- **AND** localStorage SHALL persist the selection
- **AND** all subscribed components SHALL re-render with new role context

#### Scenario: Display current role
- **WHEN** role switcher is not expanded
- **THEN** it SHALL display the current role icon and name
- **AND** it SHALL show a dropdown indicator (▼)

### Requirement: Role switcher SHALL show role profile card on hover

Hovering over a role option SHALL show a profile card with key information.

#### Scenario: Hover profile card
- **WHEN** user hovers over a role option
- **THEN** a card SHALL appear showing:
  - Role name
  - Role description
  - Key permissions (first 3)
  - Primary dashboard KPIs
- **AND** the card SHALL not block other options

### Requirement: Role switcher SHALL show last used role

The switcher SHALL remember and highlight recently used roles.

#### Scenario: Show recent roles
- **WHEN** dropdown opens
- **THEN** the last 3 used roles SHALL be shown at the top with a "Recent" label
- **AND** all other roles SHALL be listed alphabetically below

### Requirement: Role switcher SHALL be accessible

The role switcher SHALL meet WCAG 2.1 accessibility requirements.

#### Scenario: Keyboard navigation
- **WHEN** user tabs to role switcher
- **THEN** it SHALL be focusable
- **AND** Enter/Space SHALL open the dropdown
- **AND** Arrow keys SHALL navigate options
- **AND** Escape SHALL close the dropdown

#### Scenario: Screen reader support
- **WHEN** screen reader reads the role switcher
- **THEN** it SHALL announce "Role switcher, currently [role name]"
- **AND** expanded state SHALL be announced

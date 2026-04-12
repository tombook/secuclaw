# Quick Role Switcher Specification

## ADDED Requirements

### Requirement: Persistent role indicator
The system SHALL display a persistent role indicator in the top navigation bar showing the current security expert identity.

#### Scenario: Display current role in header
- **WHEN** user is authenticated
- **THEN** header SHALL display: `[emoji] Role Name ▼` format in the top-left area

#### Scenario: Role indicator styling
- **WHEN** role indicator is displayed
- **THEN** it SHALL use the role's designated color theme for visual identification

### Requirement: Role switcher dropdown panel
Clicking the role indicator SHALL open a dropdown panel showing all 8 security roles with selection state.

#### Scenario: Open role switcher
- **WHEN** user clicks role indicator
- **THEN** system SHALL display dropdown panel with:
  - Header: "选择你的安全专家身份"
  - 8 role cards in a scrollable list
  - Current role marked with "[当前]" badge
  - Hover state showing role description

#### Scenario: Role card display
- **WHEN** role switcher panel is open
- **THEN** each role card SHALL show:
  - Large emoji icon
  - Role name (localized)
  - Brief description (1 line)
  - Active indicator if current role

### Requirement: Role switching behavior
Selecting a different role SHALL update the current role context and refresh the UI.

#### Scenario: Switch to different role
- **WHEN** user clicks on a different role card
- **THEN** system SHALL:
  1. Update `roleContext` with new role ID
  2. Close dropdown panel
  3. Refresh dashboard with new role's KPIs
  4. Update navigation visibility
  5. Persist selection to session storage

#### Scenario: Role switch persisted during session
- **WHEN** user switches roles
- **THEN** new role SHALL be persisted to sessionStorage and restored on page refresh

### Requirement: Role switch confirmation
For roles with significantly different permission levels, system SHALL provide a brief confirmation of what will change.

#### Scenario: Switch from Admin to Security Expert
- **WHEN** user switches from `admin` to `security-expert`
- **AND** target role has fewer permissions
- **THEN** system SHALL show confirmation: "切换到 Security Expert 将隐藏部分管理功能"

### Requirement: Keyboard navigation
The role switcher SHALL support keyboard navigation for accessibility.

#### Scenario: Navigate roles with keyboard
- **WHEN** role switcher is open
- **THEN** user SHALL be able to:
  - Use `↑`/`↓` arrows to navigate role list
  - Press `Enter` to select highlighted role
  - Press `Escape` to close without changing

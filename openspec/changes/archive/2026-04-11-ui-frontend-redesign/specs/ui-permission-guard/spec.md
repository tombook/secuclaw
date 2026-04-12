# ui-permission-guard Specification

## ADDED Requirements

### Requirement: Permission guard SHALL conditionally render content based on permissions

The `<sc-permission-guard>` component SHALL control visibility of its slotted content based on the current role's permissions.

#### Scenario: Show content when permitted
- **WHEN** current role HAS the required permission
- **THEN** the slot content SHALL be rendered in the light DOM
- **AND** the component SHALL NOT render its own wrapper element

#### Scenario: Hide content when not permitted
- **WHEN** current role LACKS the required permission
- **THEN** the slot content SHALL NOT be rendered
- **AND** no placeholder SHALL be shown
- **AND** no network request SHALL be made for restricted data

### Requirement: Permission guard SHALL support multiple permissions

The permission guard SHALL support AND and OR logic for multiple permissions.

#### Scenario: Multiple permissions with AND logic
- **WHEN** permission attribute is "vulnerabilities.read,vulnerabilities.write"
- **THEN** content SHALL only show when user has BOTH permissions

#### Scenario: Multiple permissions with OR logic
- **WHEN** permissions attribute contains array syntax or alternative syntax
- **THEN** content SHALL show when user has ANY of the permissions

### Requirement: Permission guard SHALL support fallback content

The guard SHALL optionally display fallback content when access is denied.

#### Scenario: Fallback content
- **WHEN** user lacks required permission
- **AND** guard has a `fallback` slot
- **THEN** fallback content SHALL be rendered instead
- **AND** fallback SHOULD indicate limited access

### Requirement: Permission guard SHALL integrate with RoleContext

The guard SHALL automatically subscribe to RoleContext changes.

#### Scenario: Reactive permission check
- **WHEN** user switches role
- **THEN** all permission guards SHALL automatically update visibility
- **AND** no page reload SHALL be required

### Requirement: Permission guard SHALL support disable state

The guard SHALL support disabling actions rather than hiding them.

#### Scenario: Disable button when not permitted
- **WHEN** `mode="disable"` attribute is set
- **AND** user lacks required permission
- **THEN** the slotted element SHALL be rendered but disabled
- **AND** a tooltip SHALL explain why it is disabled

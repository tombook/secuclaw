# Role-Centric Navigation

## ADDED Requirements

### Requirement: Role-based menu visibility
Navigation menu SHALL display only pages accessible to the current user's role based on permission guard settings.

#### Scenario: Admin user sees all pages
- **WHEN** user with admin role is logged in
- **THEN** menu displays all available pages

#### Scenario: Limited role user sees subset
- **WHEN** user with security-expert role is logged in
- **THEN** menu displays only pages permitted for security-expert role

### Requirement: Role switcher in header
Header SHALL include role switcher component allowing quick role context change.

#### Scenario: Role switcher display
- **WHEN** user hovers over role switcher
- **THEN** it SHALL show dropdown with all available roles and recent roles

#### Scenario: Role switch execution
- **WHEN** user selects a different role from switcher
- **THEN** application SHALL update role context and refresh page content for new role

### Requirement: Smart recommendation bar
Top navigation area SHALL include smart recommendation bar that shows context-aware suggestions.

#### Scenario: High priority alert recommendation
- **WHEN** critical security event is active
- **THEN** recommendation bar SHALL show actionable recommendation to address it

### Requirement: Breadcrumb navigation
Pages SHALL display breadcrumbs showing current location within application hierarchy.

#### Scenario: Nested page navigation
- **WHEN** user is on a detail page accessed from a list
- **THEN** breadcrumb shows: Home > Parent Page > Current Page

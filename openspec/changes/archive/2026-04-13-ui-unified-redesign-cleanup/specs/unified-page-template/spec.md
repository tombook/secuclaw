# Unified Page Template

## ADDED Requirements

### Requirement: Page structure uniformity
All new pages SHALL use the unified page template component that provides consistent layout structure across the application.

#### Scenario: Page with main content and sidebar
- **WHEN** user navigates to a page that has both data list and detail panel
- **THEN** the page renders with a two-column layout: main content (70%) and sidebar (30%)

#### Scenario: Page with only main content
- **WHEN** user navigates to a page with no sidebar
- **THEN** the page renders with full-width main content

### Requirement: Design system component usage
All pages SHALL use design-system components (sc-button, sc-card, sc-badge, etc.) instead of custom styled elements.

#### Scenario: Button rendering
- **WHEN** a page needs to render a button
- **THEN** it SHALL use `<sc-button>` component with appropriate variant

#### Scenario: Card rendering
- **WHEN** a page needs to render a card container
- **THEN** it SHALL use `<sc-card>` component

### Requirement: Role-aware content
Pages SHALL adapt content display based on current role context from role-context store.

#### Scenario: Role-specific KPIs
- **WHEN** a role-specific page loads
- **THEN** it SHALL display metrics relevant to the current role

### Requirement: Loading and error states
Pages SHALL show appropriate loading skeletons and error boundaries during data fetch.

#### Scenario: Initial load
- **WHEN** page is loading data
- **THEN** it SHALL display skeleton placeholders matching the expected content structure

#### Scenario: Error state
- **WHEN** data fetch fails
- **THEN** it SHALL display error boundary with retry action

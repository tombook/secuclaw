## ADDED Requirements

### Requirement: Backend API SHALL validate permissions via middleware

All API endpoints that require permission checks SHALL be protected by permission middleware.

#### Scenario: Authorized request passes
- **WHEN** user with 'security-expert' role requests GET /api/v1/vulnerabilities
- **THEN** middleware SHALL pass the request to the handler

#### Scenario: Unauthorized request blocked
- **WHEN** user with 'privacy-officer' role requests DELETE /api/v1/vulnerabilities/{id}
- **THEN** middleware SHALL return 403 Forbidden with message 'Permission denied'

### Requirement: Middleware SHALL extract role from JWT

The permission middleware SHALL extract the user role from the JWT token in the Authorization header.

#### Scenario: Extract role from JWT
- **WHEN** request has valid JWT with role claim
- **THEN** middleware SHALL extract role and apply permission checks

#### Scenario: Invalid JWT
- **WHEN** request has invalid or expired JWT
- **THEN** middleware SHALL return 401 Unauthorized

### Requirement: Service layer SHALL filter data based on permissions

Service methods SHALL filter returned data based on the user's role permissions.

#### Scenario: Filter sensitive fields
- **WHEN** 'security-ops' role queries incidents
- **THEN** incident data SHALL NOT include 'executive-summary' field
- **AND** incident data SHALL NOT include 'legal-notes' field

#### Scenario: Filter by data scope
- **WHEN** role has scope 'team'
- **THEN** returned data SHALL only include incidents assigned to user's team

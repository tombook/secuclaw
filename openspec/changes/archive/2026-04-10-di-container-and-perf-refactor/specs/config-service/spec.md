## ADDED Requirements

### Requirement: ConfigService SHALL provide unified configuration access

ConfigService SHALL be a singleton that provides typed access to all configuration values including gateway, api, storage, auth, and llm settings.

#### Scenario: Get gateway config
- **WHEN** code calls `configService.get('gateway')`
- **THEN** the response SHALL include `{ port: number }` with the configured gateway port

#### Scenario: Get storage config
- **WHEN** code calls `configService.get('storage')`
- **THEN** the response SHALL include `{ basePath, databasePath, skillsPath }` with configured paths

### Requirement: ConfigService SHALL support environment variable overrides

Environment variables SHALL take precedence over default configuration values.

#### Scenario: Gateway port from environment
- **WHEN** environment variable `GATEWAY_PORT=21980` is set
- **AND** `configService.get('gateway')` is called
- **THEN** the port SHALL be 21980

#### Scenario: Storage path from environment
- **WHEN** environment variable `DATA_PATH=/custom/data` is set
- **AND** `configService.get('storage')` is called
- **THEN** the basePath SHALL be `/custom/data`

### Requirement: ConfigService SHALL support multiple environments

ConfigService SHALL detect `NODE_ENV` and apply environment-specific defaults for development, test, and production.

#### Scenario: Development environment defaults
- **WHEN** `NODE_ENV=development` or not set
- **AND** `GATEWAY_PORT` is not set
- **THEN** gateway port SHALL default to 21981

#### Scenario: Production environment defaults
- **WHEN** `NODE_ENV=production`
- **AND** `GATEWAY_PORT` is not set
- **THEN** gateway port SHALL default to 21981

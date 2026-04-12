## ADDED Requirements

### Requirement: Unified Gateway HTTP Server
The gateway server SHALL support both WebSocket and HTTP requests on the same port.

#### Scenario: WebSocket connection
- **WHEN** client connects to `ws://host:21981/ws`
- **THEN** WebSocket connection is established

#### Scenario: HTTP REST API request
- **WHEN** client sends HTTP POST to `http://host:21981/api/v1/*`
- **THEN** request is routed to REST API handler

### Requirement: Single Port Configuration
The system SHALL use only `gateway.port` configuration and ignore `api.port`.

#### Scenario: Gateway starts on configured port
- **WHEN** system starts with `GATEWAY_PORT=21981`
- **THEN** single server starts on port 21981

### Requirement: Backward Compatibility
The system SHALL maintain existing REST API routes at `/api/v1/*`.

#### Scenario: Existing API route accessible
- **WHEN** client sends GET to `/api/v1/vulnerabilities`
- **THEN** returns vulnerabilities list as before

#### Scenario: Existing WebSocket route accessible
- **WHEN** client connects to `/ws`
- **THEN** WebSocket connection works as before

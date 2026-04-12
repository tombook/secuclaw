# AI Collaboration Routes

## ADDED Requirements

### Requirement: Collaboration Trigger Endpoint
The system SHALL provide a WebSocket method `ai.collaboration.trigger` to start a collaboration session.

#### Scenario: Trigger collaboration
- **WHEN** frontend calls ai.collaboration.trigger with event details
- **THEN** the system SHALL start the collaboration and return session ID

### Requirement: Collaboration Status Endpoint
The system SHALL provide a WebSocket method `ai.collaboration.status` to query running collaboration progress.

#### Scenario: Query status
- **WHEN** frontend calls ai.collaboration.status with session ID
- **THEN** the system SHALL return current phase and progress

### Requirement: Collaboration Configure Endpoint
The system SHALL provide a WebSocket method `ai.collaboration.configure` to update model routing config.

#### Scenario: Update configuration
- **WHEN** frontend calls ai.collaboration.configure with new config
- **THEN** the system SHALL update config and persist to file

### Requirement: Collaboration Stop Endpoint
The system SHALL provide a WebSocket method `ai.collaboration.stop` to abort running collaboration.

#### Scenario: Stop collaboration
- **WHEN** frontend calls ai.collaboration.stop with session ID
- **THEN** the system SHALL abort the collaboration and log partial results

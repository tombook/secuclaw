# War Room AI UI

## ADDED Requirements

### Requirement: Collaboration Progress Indicator
The system SHALL display collaboration progress indicator on War Room page showing current phase.

#### Scenario: Display progress
- **WHEN** collaboration is in progress
- **THEN** the system SHALL show current phase (R→C→A→Commander→I)

### Requirement: AI Message Styling
The system SHALL style AI-generated messages with role-specific indicators.

#### Scenario: AI message display
- **WHEN** a message is from an AI role
- **THEN** the system SHALL display role badge and styling

### Requirement: Frontend Integration
The system SHALL connect to WebSocket endpoints for collaboration control.

#### Scenario: Trigger from UI
- **WHEN** user clicks trigger button
- **THEN** the system SHALL call ai.collaboration.trigger

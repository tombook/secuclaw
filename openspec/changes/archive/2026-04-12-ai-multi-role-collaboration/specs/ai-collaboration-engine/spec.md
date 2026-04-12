# AI Collaboration Engine

## ADDED Requirements

### Requirement: RACI Phase Orchestration
The system SHALL orchestrate multi-role LLM discussions following RACI matrix phases: Responsible analysis, Consulted parallel opinions, Accountable decisions, Commander synthesis, and Informed notifications.

#### Scenario: Successful collaboration flow
- **WHEN** a security event triggers a collaboration session
- **THEN** the system SHALL execute phases in order: R→C→A→Commander→I

#### Scenario: Single role failure handling
- **WHEN** any single role's LLM call fails
- **THEN** the system SHALL log the failure and continue with remaining roles

### Requirement: War Room Message Persistence
The system SHALL write each phase's output as War Room messages via SessionManager.

#### Scenario: Phase output persistence
- **WHEN** a phase completes its analysis
- **THEN** the system SHALL persist the output as a timeline message in the War Room session

### Requirement: Collaboration Timeout
The system SHALL enforce a 60-second timeout for full collaboration completion.

#### Scenario: Timeout handling
- **WHEN** collaboration exceeds 60 seconds
- **THEN** the system SHALL abort and log partial results

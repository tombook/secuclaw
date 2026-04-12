# AI Model Router

## ADDED Requirements

### Requirement: RACI-based Model Routing
The system SHALL route LLM calls to appropriate models based on RACI assignment:
- R/A roles SHALL use the strongest model (GLM-5-Turbo)
- C roles SHALL use mid-tier model (doubao-seed-2.0-pro)
- I roles SHALL use lightweight model (doubao-seed-2.0-lite)

#### Scenario: Model selection by role type
- **WHEN** a role with R or A assignment requests an LLM call
- **THEN** the system SHALL route to GLM-5-Turbo

#### Scenario: C role model selection
- **WHEN** a role with C assignment requests an LLM call
- **THEN** the system SHALL route to doubao-seed-2.0-pro

### Requirement: Configuration Persistence
The system SHALL persist model routing configuration in ai-collaboration/config.json.

#### Scenario: Config save
- **WHEN** routing configuration is updated
- **THEN** the system SHALL persist to config.json

### Requirement: Parallel C-role Limiting
The system SHALL limit parallel C-role calls to a maximum of 3.

#### Scenario: C-role parallel limit
- **WHEN** more than 3 C-role calls are requested simultaneously
- **THEN** the system SHALL queue additional calls

# Role Perspective View Specification

## ADDED Requirements

### Requirement: Multi-role threat analysis view
The system SHALL provide a unified threat view that shows how different security roles analyze the same threat data.

#### Scenario: Threat analyzed from multiple role perspectives
- **WHEN** user views a specific threat/indicator
- **THEN** system SHALL display perspective tabs for each relevant role showing:
  - Security Expert: Technical details, exploitability, affected systems
  - Security Architect: Attack path, potential impact on architecture, mitigation design
  - CISO: Business risk, compliance implications, resource requirements

### Requirement: Role-specific data highlighting
The system SHALL highlight data elements most relevant to the current role's expertise.

#### Scenario: Highlight data for Security Ops role
- **WHEN** current role is `security-ops`
- **AND** user views incident details
- **THEN** system SHALL highlight: alert severity, SIEM correlations, EDR detections, response playbooks

#### Scenario: Highlight data for Privacy Officer role
- **WHEN** current role is `privacy-officer`
- **AND** user views incident details
- **THEN** system SHALL highlight: data types affected, personal information exposure, GDPR/PIPL implications

### Requirement: Role-filtered data display
The system SHALL filter and prioritize displayed data based on current role's focus areas.

#### Scenario: Filter vulnerabilities for Security Expert
- **WHEN** current role is `security-expert`
- **AND** user views vulnerability list
- **THEN** system SHALL prioritize排序: Critical → High CVEs, focusing on exploitable vulnerabilities

#### Scenario: Filter vulnerabilities for CISO
- **WHEN** current role is `ciso`
- **AND** user views vulnerability list
- **THEN** system SHALL prioritize: Business critical assets, remediation cost, compliance impact

### Requirement: Perspective comparison mode
The system SHALL provide a mode to compare how 2-3 different roles view the same security entity.

#### Scenario: Compare perspectives on a vulnerability
- **WHEN** user selects "Compare Perspectives" on a CVE
- **THEN** system SHALL display a side-by-side view showing:
  - Security Expert column: Technical severity, exploit details
  - Security Architect column: Architecture impact, compensating controls
  - CISO column: Risk score, remediation priority, budget implications

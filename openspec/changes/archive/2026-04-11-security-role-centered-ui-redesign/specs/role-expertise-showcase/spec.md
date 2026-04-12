# Role Expertise Showcase Specification

## ADDED Requirements

### Requirement: Role expertise radar chart
The system SHALL provide a radar chart visualization displaying the 6-dimension skill profile for each security role.

#### Scenario: Display radar chart for security expert
- **WHEN** user views expertise showcase for `security-expert`
- **THEN** radar chart SHALL display scores for: Light Side (8 skills), Dark Side (8 skills), Security (8 skills), Legal (0), Technology (7 skills), Business (0)

#### Scenario: Display radar chart for privacy officer
- **WHEN** user views expertise showcase for `privacy-officer`
- **THEN** radar chart SHALL display scores for: Light Side (8 skills), Dark Side (6 skills), Security (5 skills), Legal (8 skills), Technology (6 skills), Business (4 skills)

### Requirement: MITRE ATT&CK coverage display
The system SHALL display MITRE ATT&CK tactic coverage as a tag cloud for each role.

#### Scenario: Display MITRE coverage for secuclaw-commander
- **WHEN** user views expertise showcase for `secuclaw-commander`
- **THEN** system SHALL display tags for all 14 MITRE tactics: TA0001-Initial Access, TA0002-Execution, TA0003-Persistence, TA0004-Privilege Escalation, TA0005-Defense Evasion, TA0006-Credential Access, TA0007-Discovery, TA0008-Lateral Movement, TA0009-Collection, TA0010-Exfiltration, TA0011-Command and Control, TA0040-Impact, TA0041-Exfiltration, TA0042-Impact

#### Scenario: Display MITRE coverage for privacy officer
- **WHEN** user views expertise showcase for `privacy-officer`
- **THEN** system SHALL display only relevant tags: TA0006-Credential Access, TA0009-Collection, TA0010-Exfiltration, TA0011-Command and Control

### Requirement: SCF Control coverage display
The system SHALL display SCF (Security Control Framework) control coverage as categorized tags.

#### Scenario: Display SCF coverage with categories
- **WHEN** user views SCF coverage
- **THEN** controls SHALL be grouped by category: Access Control (AC), Audit (AU), Configuration Management (CM), Incident Response (IR), etc.

### Requirement: Skill category breakdown
The system SHALL display detailed skill lists grouped by 6 categories with item counts.

#### Scenario: Display skill categories
- **WHEN** user expands a skill category
- **THEN** system SHALL show all skills in that category as a scrollable list with bullet points

### Requirement: Expertise showcase page
The system SHALL provide a dedicated page (`/expertise`) that showcases all 8 roles with their full skill profiles.

#### Scenario: Expertise page shows all roles
- **WHEN** user navigates to `/expertise`
- **THEN** system SHALL display a grid of 8 role cards, each showing: emoji icon, role name, brief description, skill category summary counts

#### Scenario: Role card selection shows full profile
- **WHEN** user clicks on a role card
- **THEN** system SHALL expand to show full expertise details including radar chart, skill lists, MITRE coverage, SCF coverage

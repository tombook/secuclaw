# Role-Centric Navigation Specification

## ADDED Requirements

### Requirement: Role-centric navigation structure
The system SHALL provide a navigation system that organizes features by security role expertise domains instead of generic categories.

#### Scenario: Navigation displays role-centric menu
- **WHEN** user is authenticated
- **THEN** navigation menu SHALL display role-centric menu items organized by expertise areas (Threat Analysis, Incident Response, Vulnerability Management, Compliance Governance, Supply Chain Security)

#### Scenario: Menu items reflect current role permissions
- **WHEN** user switches to a different security role
- **THEN** navigation menu SHALL update to show/hide items based on that role's permissions as defined in PERMISSION_MATRIX

### Requirement: Role domain grouping
The navigation SHALL group features under role-relevant domain headers:
- Threat Analysis (威胁分析)
- Incident Response (事件响应)
- Vulnerability Management (漏洞管理)
- Compliance Governance (合规治理)
- Supply Chain Security (供应链安全)
- Risk Management (风险管理)
- Security Tools (安全工具)
- Knowledge Base (知识库)
- Capabilities Center (能力中心)

#### Scenario: Domain groups visible based on role permissions
- **WHEN** user has `THREATS_READ` permission
- **THEN** "Threat Analysis" domain group SHALL be visible in navigation

### Requirement: Legacy menu mode
The system SHALL provide a legacy menu mode option for users familiar with the old structure.

#### Scenario: User enables legacy menu
- **WHEN** user toggles "Legacy Menu" option in settings
- **THEN** navigation SHALL display the old generic category structure (Operations, Command, Governance, AI, Capabilities, Collaboration, Admin)

#### Scenario: Legacy mode persisted
- **WHEN** user enables legacy menu mode
- **THEN** preference SHALL be persisted in localStorage and restored on next login

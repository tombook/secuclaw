# Adaptive Dashboard Specification

## ADDED Requirements

### Requirement: Role-adaptive KPI display
The dashboard SHALL display different primary KPIs based on the current security role context.

#### Scenario: Security Expert sees vulnerability-focused KPIs
- **WHEN** current role is `security-expert`
- **AND** user views dashboard
- **THEN** primary KPIs SHALL include: Open Vulnerabilities, Critical CVEs, Patch Status, Threat Detections

#### Scenario: CISO sees governance-focused KPIs
- **WHEN** current role is `ciso`
- **AND** user views dashboard
- **THEN** primary KPIs SHALL include: Compliance Score, Risk Exposure, Security Budget Status, Audit Findings

#### Scenario: Privacy Officer sees privacy-focused KPIs
- **WHEN** current role is `privacy-officer`
- **AND** user views dashboard
- **THEN** primary KPIs SHALL include: Data Breach Incidents, Privacy Compliance Score, DPIA Requests, Consent Rate

### Requirement: Role-specific dashboard sections
The dashboard SHALL show/hide specific sections based on role expertise.

#### Scenario: Security Architect sees architecture sections
- **WHEN** current role is `security-architect`
- **THEN** dashboard SHALL display sections for: Architecture Review Items, Zero Trust Progress, Security Control Implementation

#### Scenario: Security Ops sees operational sections
- **WHEN** current role is `security-ops`
- **THEN** dashboard SHALL display sections for: Active Alerts, SOC Metrics, Incident Response SLA, Threat Hunt Findings

### Requirement: Role context propagation
The dashboard SHALL read role context from `roleContext.getState().currentRole` and automatically refresh content when role changes.

#### Scenario: Dashboard updates on role switch
- **WHEN** user switches role from `security-expert` to `ciso`
- **THEN** dashboard SHALL automatically reload with CISO-relevant KPIs and sections

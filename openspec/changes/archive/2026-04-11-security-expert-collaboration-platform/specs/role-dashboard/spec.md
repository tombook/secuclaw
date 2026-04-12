## MODIFIED Requirements

### Requirement: Dashboard SHALL display role-specific KPI cards

When a role is selected, the dashboard SHALL show KPI cards relevant to that role's focus area. Additionally, the dashboard SHALL display RACI task summary for the current role.

#### Scenario: Security Expert dashboard
- **WHEN** current role is 'security-expert'
- **THEN** dashboard SHALL display: '漏洞总数', '严重漏洞数', '补丁覆盖率', '平均响应时间'

#### Scenario: Privacy Officer dashboard
- **WHEN** current role is 'privacy-officer'
- **THEN** dashboard SHALL display: '合规率', '数据泄露事件', '主体请求待处理', '跨境传输合规'

#### Scenario: CISO dashboard
- **WHEN** current role is 'ciso'
- **THEN** dashboard SHALL display: '安全预算', '风险趋势', '团队绩效', '战略目标进度'

#### Scenario: RACI task summary on dashboard
- **WHEN** current role has active RACI tasks in any War Room
- **THEN** dashboard SHALL display a RACI task summary section showing: pending R-tasks (执行), pending A-tasks (负责), unread I-notifications (通知)

### Requirement: Dashboard SHALL display role-specific charts

Each role SHALL have a preferred chart visualization type.

#### Scenario: Role-specific chart type
- **WHEN** current role is 'security-expert'
- **THEN** primary chart SHALL be '漏洞趋势图' (line chart with CVSS distribution)

- **WHEN** current role is 'privacy-officer'
- **THEN** primary chart SHALL be '合规雷达图' (compliance status radar)

- **WHEN** current role is 'security-architect'
- **THEN** primary chart SHALL be '架构风险热力图' (risk heatmap)

### Requirement: Dashboard SHALL show role-specific alerts

Alert panel SHALL filter to show alerts relevant to the current role's domain.

#### Scenario: Filter alerts by role
- **WHEN** current role is 'security-ops'
- **THEN** alert panel SHALL show only: SIEM alerts, SOC events, incident tickets
- **AND** hide: compliance alerts, architecture reviews

- **WHEN** current role is 'supply-chain-security'
- **THEN** alert panel SHALL show only: vendor risk alerts, dependency vulnerabilities, third-party incidents

### Requirement: Dashboard SHALL update when role changes

When the global role context changes, the dashboard SHALL immediately reflect the new role's configuration.

#### Scenario: Reactive dashboard update
- **WHEN** user switches from 'security-expert' to 'ciso'
- **THEN** dashboard SHALL immediately update KPI cards and charts
- **AND** RACI task summary SHALL update to reflect new role's tasks
- **AND** no page reload SHALL be required

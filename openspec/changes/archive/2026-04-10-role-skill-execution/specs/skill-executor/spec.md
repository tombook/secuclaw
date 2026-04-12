## ADDED Requirements

### Requirement: SkillExecutor SHALL execute skills from the registry

SkillExecutor SHALL provide an interface to execute registered skills with validated parameters.

#### Scenario: Execute vulnerability scan skill
- **WHEN** user with 'security-expert' role executes '漏洞扫描' skill with params `{target: 'https://example.com'}`
- **THEN** executor SHALL validate params against skill schema
- **AND** executor SHALL check role has permission to execute
- **AND** executor SHALL select appropriate ActionRunner
- **AND** executor SHALL execute and return ExecutionResult

#### Scenario: Execute requires valid params
- **WHEN** user executes skill with missing required params
- **THEN** executor SHALL return error with missing param names
- **AND** executor SHALL NOT attempt execution

#### Scenario: Execute with invalid role
- **WHEN** user with insufficient role tries to execute skill
- **THEN** executor SHALL return PermissionError
- **AND** executor SHALL NOT execute

### Requirement: SkillExecutor SHALL track execution state

Execution SHALL support state transitions: pending → running → completed | failed.

#### Scenario: Execution state transitions
- **WHEN** execution starts
- **THEN** state SHALL be 'pending'
- **AND** after validation passes, state SHALL be 'running'
- **AND** on success, state SHALL be 'completed'
- **AND** on failure, state SHALL be 'failed'

#### Scenario: Execution timeout handling
- **WHEN** execution exceeds configured timeout
- **THEN** executor SHALL abort execution
- **AND** state SHALL be set to 'failed'
- **AND** error SHALL indicate timeout

### Requirement: SkillExecutor SHALL support async execution

Long-running skills SHALL execute asynchronously with progress tracking.

#### Scenario: Async execution with progress
- **WHEN** user initiates skill execution
- **THEN** executor SHALL return immediately with executionId
- **AND** executor SHALL update progress via WebSocket
- **AND** user SHALL be able to poll status using executionId

#### Scenario: Cancel running execution
- **WHEN** user cancels execution with executionId
- **THEN** executor SHALL abort running ActionRunner
- **AND** state SHALL be set to 'failed' with cancellation reason
- **AND** partial artifacts SHALL be cleaned up

### Requirement: ActionRunner SHALL execute skill-specific actions

ActionRunner implementations SHALL handle actual tool execution.

#### Scenario: Nuclei scanner runner
- **WHEN** executing '漏洞扫描' skill
- **THEN** nuclei ActionRunner SHALL be selected
- **AND** it SHALL run: `nuclei -u {target} -json -silent`
- **AND** it SHALL parse JSON output into standardized result format

#### Scenario: Semgrep code audit runner
- **WHEN** executing '代码审计' skill
- **THEN** semgrep ActionRunner SHALL be selected
- **AND** it SHALL run: `semgrep --json --config=auto {repository}`
- **AND** it SHALL parse findings into vulnerability artifacts

#### Scenario: Unknown executor handling
- **WHEN** skill references non-existent executor
- **THEN** executor SHALL return error with executor name
- **AND** state SHALL be 'failed'

### Requirement: ExecutionResult SHALL contain complete execution artifacts

The ExecutionResult interface SHALL include all necessary fields to fully describe an execution.

#### Scenario: Successful execution result
- **WHEN** execution completes successfully
- **THEN** result SHALL include: executionId, skill, status, result, artifacts[], executedBy, timestamp, duration

#### Scenario: Failed execution result
- **WHEN** execution fails
- **THEN** result SHALL include: executionId, skill, status='failed', error.message, error.stack, executedBy, timestamp

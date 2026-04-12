## ADDED Requirements

### Requirement: SkillRegistry SHALL maintain skill definitions from SKILL.md

SkillRegistry SHALL parse SKILL.md files and expose skill definitions for execution.

#### Scenario: Load skill definitions
- **WHEN** system initializes
- **THEN** registry SHALL scan skills/{role-id}/SKILL.md files
- **AND** registry SHALL parse capabilities into SkillDefinition objects
- **AND** skills SHALL be indexed by id for lookup

#### Scenario: Skill definition structure
- **WHEN** skill is registered
- **THEN** it SHALL contain: id, name, executor, params[], resultType, requiredRoles[]
- **AND** params SHALL each have: name, type, required, description

### Requirement: SkillRegistry SHALL support skill lookup by role

The registry SHALL provide methods to query skills by role and other attributes.

#### Scenario: Get skills for role
- **WHEN** code calls `registry.getSkillsForRole('security-expert')`
- **THEN** it SHALL return all skills where requiredRoles includes 'security-expert'
- **AND** returned skills SHALL be sorted by name

#### Scenario: Get skill by id
- **WHEN** code calls `registry.getSkill('漏洞扫描')`
- **THEN** it SHALL return the skill definition if found
- **AND** it SHALL return null if not found

#### Scenario: Check executor availability
- **WHEN** code calls `registry.getExecutorForSkill(skillId)`
- **THEN** it SHALL return the executor name
- **AND** it SHALL return null if executor not defined

### Requirement: SkillRegistry SHALL validate skill definitions

The registry SHALL validate skill definitions before registering them.

#### Scenario: Invalid skill definition
- **WHEN** SKILL.md contains skill with missing required fields
- **THEN** registry SHALL log warning
- **AND** registry SHALL skip invalid skill
- **AND** valid skills SHALL still be registered

#### Scenario: Duplicate skill id
- **WHEN** two SKILL.md files define same skill id
- **THEN** registry SHALL use first registered definition
- **AND** registry SHALL log duplicate warning

### Requirement: SkillRegistry SHALL support skill execution mapping

Skill definitions SHALL map to executable actions via executor name.

#### Scenario: Get required params for skill
- **WHEN** code calls `registry.getParamsForSkill(skillId)`
- **THEN** it SHALL return array of ParamSchema
- **AND** params SHALL be ordered as defined in SKILL.md

#### Scenario: Validate execution permission
- **WHEN** code calls `registry.canExecute(skillId, roleId)`
- **THEN** it SHALL return true if roleId is in requiredRoles
- **AND** it SHALL return false otherwise

### Requirement: Registry SHALL sync with SKILL.md changes

The registry SHALL monitor SKILL.md files and update definitions when they change.

#### Scenario: Hot reload SKILL.md
- **WHEN** SKILL.md file changes
- **THEN** registry SHALL detect change within 60 seconds
- **AND** registry SHALL re-parse affected skill
- **AND** running executions SHALL not be affected

#### Scenario: Remove skill on SKILL.md delete
- **WHEN** SKILL.md file is deleted
- **THEN** registry SHALL remove associated skill definitions
- **AND** in-progress executions SHALL complete with existing definition
- **AND** new executions SHALL fail with skill not found

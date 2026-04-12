## 1. Skill Registry Infrastructure

- [x] 1.1 Create `packages/core/src/skills/registry.ts`
- [x] 1.2 Define SkillDefinition interface
- [x] 1.3 Implement SKILL.md parser
- [x] 1.4 Implement skill lookup methods (getSkillsForRole, getSkill, getExecutorForSkill)
- [x] 1.5 Implement permission validation (canExecute)
- [x] 1.6 Add hot reload watcher for SKILL.md changes

## 2. Skill Executor Core

- [x] 2.1 Create `packages/core/src/skills/executor.ts`
- [x] 2.2 Define ExecutionResult interface
- [x] 2.3 Implement state machine (pending → running → completed | failed)
- [x] 2.4 Implement param validation against schema
- [x] 2.5 Implement timeout handling
- [x] 2.6 Implement async execution with executionId

## 3. ActionRunner Implementations

- [x] 3.1 Create `packages/core/src/skills/runners/nuclei-runner.ts`
- [x] 3.2 Create `packages/core/src/skills/runners/semgrep-runner.ts`
- [x] 3.3 Create `packages/core/src/skills/runners/log-analyzer-runner.ts`
- [x] 3.4 Create `packages/core/src/skills/runners/vendor-assessor-runner.ts`
- [x] 3.5 Implement result parsing and artifact generation

## 4. Execution History Store

- [x] 4.1 Create `packages/core/src/skills/history-store.ts`
- [x] 4.2 Implement ExecutionResult storage
- [x] 4.3 Implement history query methods
- [x] 4.4 Add TTL-based cleanup for old executions

## 5. WebSocket Progress Updates

- [x] 5.1 Create `packages/core/src/skills/execution-events.ts`
- [x] 5.2 Implement progress event emitter
- [x] 5.3 Integrate with WebSocket server
- [x] 5.4 Handle client disconnection gracefully

## 6. Frontend Skill Execution UI

- [x] 6.1 Create `ui/src/ui/components/sc-skill-executor.ts`
- [x] 6.2 Create skill selection dropdown
- [x] 6.3 Create dynamic param form based on schema
- [x] 6.4 Create execution status display
- [x] 6.5 Create cancel button for running executions

## 7. Frontend Execution History UI

- [x] 7.1 Create `ui/src/ui/pages/skill-execution-history.ts`
- [x] 7.2 Create execution list with filters
- [x] 7.3 Create execution detail view
- [x] 7.4 Implement artifact viewer
- [x] 7.5 Add re-execute from history

## 8. Integration with Role Context

- [x] 8.1 Update role-context to expose skill registry
- [x] 8.2 Filter available skills by user role
- [x] 8.3 Add skill execution to role dashboard
- [x] 8.4 Add skill history to role dashboard

## 9. Verification

- [x] 9.1 Test skill registry loads all 8 roles' skills
- [x] 9.2 Test execution of '漏洞扫描' skill with nuclei
- [x] 9.3 Test execution of '代码审计' skill with semgrep
- [x] 9.4 Test async execution with WebSocket progress
- [x] 9.5 Test execution history persistence
- [x] 9.6 Test permission denial for unauthorized roles
- [x] 9.7 Test timeout handling

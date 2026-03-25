# SPEC-15: Capabilities Center (6-Domain Execution System)

> Version: 1.0  
> Created: 2026-03-09  
> Status: AI-Implementation-Ready

---

## 1. Goal

Build a **Capabilities Center** based on 8 security role skills, turning role knowledge into executable workflows across 6 domains:

1. Light Side (`light`)
2. Dark Side (`dark`)
3. Security Technology (`security`)
4. Legal Compliance (`legal`)
5. Technology Architecture (`technology`)
6. Business Operations (`business`)

The system must support: **tasking, execution, approval, evidence, and audit traceability**.

---

## 2. Current Implemented Baseline (Updated 2026-03-09)

This spec must integrate with already implemented modules instead of duplicating them.

### 2.1 Settings Module (Already Implemented)

1. Main settings page exists at `/settings` with theme and locale switching via `uiStore`.
2. Theme/locale persist in browser localStorage (`secuclaw-theme`, `secuclaw-locale`).
3. LLM provider config page exists at `/settings/llm-config`:
   - provider CRUD (`llm.providers.list/add/update/delete`)
   - enable/disable toggle
   - provider connection test
   - legacy localStorage migration
4. Backend LLM provider data already persists in `packages/core/data/storage/llm-providers.json`.
5. Router already exposes `llm.providers.*` methods.

### 2.2 AI Experts Module (Already Implemented)

1. AI Experts page exists at `/ai-experts` with 8 role cards.
2. Page supports `skills` tab and `chat` tab.
3. Skills display supports 6-category capability matrix and MITRE/SCF coverage.
4. Chat loads providers from `llm.providers.list` and calls provider APIs directly.
5. Role system prompt is generated from role capabilities; local fallback response exists when LLM is unavailable.
6. AI Experts Config page exists at `/settings/ai-experts-config` with role on/off + provider/model selection UI.

### 2.3 Known Integration Gap (Must Be Addressed)

1. Current AI Experts Config selections are not persisted to backend as authoritative role bindings.
2. Current AI Experts chat uses first enabled provider instead of role-specific binding priority.
3. Capabilities Center must reuse and extend these modules, not create parallel settings/chat systems.

### 2.4 Detailed Implementation: Settings (As-Is)

#### 2.4.1 Implemented Pages and Files

1. Main settings page: `ui/src/ui/pages/settings/sc-settings-page.ts`
2. LLM service config page: `ui/src/ui/pages/settings/sc-llm-service-config.ts`
3. AI experts config page: `ui/src/ui/pages/settings/sc-ai-experts-config.ts`
4. Settings routes are wired in `ui/src/ui/app.ts`:
   - `/settings`
   - `/settings/llm-config`
   - `/settings/ai-experts-config`

#### 2.4.2 Implemented Data and State

1. UI setting state source: `ui/src/ui/store/ui-store.ts`
2. Persisted keys:
   - `secuclaw-theme`
   - `secuclaw-locale`
   - `secuclaw-sidebar-collapsed`
3. LLM provider persistence: backend JSON store file `packages/core/data/storage/llm-providers.json`
4. LLM provider migration support:
   - from legacy localStorage key `secuclaw-llm-providers`
   - migration marker `secuclaw-llm-providers-migrated`

#### 2.4.3 Implemented Gateway Methods Used by Settings

1. `llm.providers.list`
2. `llm.providers.add`
3. `llm.providers.update`
4. `llm.providers.delete`
5. `commander.bindLLM` exists but is not yet used as persistent sink in current AI Experts Config page.

#### 2.4.4 Implemented Behavior (LLM Service Config)

1. Provider CRUD with immediate reload.
2. Provider enable/disable toggle.
3. Connection test with endpoint probing:
   - Ollama/local-style: `/api/tags`
   - OpenAI-compatible: `/models`, `/v1/models`
4. Provider payload normalization on backend read/write (missing fields repaired).
5. Backward-compatible fallback load from `~/.secuclaw/config/llm-providers.json` when store is empty.

### 2.5 Detailed Implementation: AI Experts (As-Is)

#### 2.5.1 Implemented Pages and Files

1. AI experts main page: `ui/src/ui/pages/sc-ai-experts-page.ts`
2. Skills data store: `ui/src/ui/store/skill-store.ts`
3. Commander data store: `ui/src/ui/store/commander-store.ts`
4. Role binding config page: `ui/src/ui/pages/settings/sc-ai-experts-config.ts`

#### 2.5.2 Implemented Functional Modules

1. 8 role cards with role switching.
2. Two-tab interaction:
   - `skills`: 6 capability categories + MITRE + SCF coverage
   - `chat`: role-specific prompt and LLM conversation
3. Skills source strategy:
   - primary: `skillStore` loaded from `skills.list` / `skills.get`
   - fallback: built-in default capability matrix in page file

#### 2.5.3 Implemented Chat Flow

1. User input enters chat panel.
2. Frontend loads providers via `llm.providers.list`.
3. Provider selection (current behavior):
   - choose first enabled provider
   - fallback to first provider in list
4. Endpoint strategy:
   - local/localhost/127.0.0.1 -> `${baseUrl}/api/chat` (Ollama style)
   - otherwise -> `${baseUrl}/chat/completions` (OpenAI compatible)
5. If provider call fails, return local role-based fallback response.

#### 2.5.4 Implemented AI Experts Config Behavior

1. Supports per-role:
   - enable/disable toggle
   - provider select
   - model select
2. Current page keeps role configuration in component state only.
3. Persisted backend binding for role/provider/model is not yet completed.
4. This binding persistence is mandatory in Sprint 0 of this spec.

---

## 3. Scope

### In Scope

1. New Capabilities Center UI and routes
2. WebSocket methods: `capabilities.*`
3. JSON storage data model for capabilities, tasks, runs, approvals, evidence
4. Dark-side mandatory approval guardrail
5. KPI overview metrics per domain

### Out of Scope

1. Real external pentest engine implementation (can use mocked execution adapter first)
2. Full RBAC system overhaul (keep current role-based checks in gateway layer)
3. Migration to SQL (JSON store first, SQL migration later)

---

## 4. Role-to-Domain Mapping

| Domain | Primary Roles | Supporting Roles |
|---|---|---|
| Light | `security-expert`, `security-ops`, `security-architect` | `ciso` |
| Dark | `security-expert`, `security-ops`, `security-architect`, `supply-chain-security` | `secuclaw-commander` |
| Security | `security-ops` | `security-expert`, `security-architect` |
| Legal | `privacy-officer`, `ciso`, `supply-chain-security` | `secuclaw-commander` |
| Technology | `security-architect` | `ciso`, `secuclaw-commander` |
| Business | `business-security-officer` | `ciso`, `secuclaw-commander` |

---

## 5. Capability Blueprint (What to show + what to execute)

| Domain | UI Presentation | Executable Capabilities |
|---|---|---|
| Light | Baseline score, vulnerability closure trend, incident SLA, control health | Baseline scan, vulnerability orchestration, config drift check |
| Dark | Attack path map, exercise timeline, detection coverage gap | Authorized penetration run, attack path verification, red-team simulation |
| Security | SOC dashboard, log/alert heatmap, MITRE coverage | SIEM/EDR linkage, threat hunting playbook, runbook automation |
| Legal | Regulation matrix, gap tracker, evidence catalog | DPIA/PIA flow, policy gap scan, compliance evidence export |
| Technology | Architecture risk map, trust-boundary status, zero-trust score | Architecture review, control validation, resilience verification |
| Business | Quantified risk panel, business impact heatmap, supplier ranking | BIA analysis, risk monetization, supplier tier governance |

---

## 6. Integration Requirements with Existing Settings and AI Experts

### 6.1 Settings Reuse Requirements

1. Use existing `llm.providers.*` as the single provider source of truth.
2. Do not create `capabilities.providers.*`.
3. Reuse existing provider test semantics (Ollama/OpenAI-compatible endpoint probing).

### 6.2 AI Experts Reuse Requirements

1. AI Experts Config must persist role-level binding via backend (`commander.bindLLM` or equivalent role-binding API).
2. AI Experts Page chat provider selection order:
   - role-bound provider/model
   - fallback to first enabled provider
3. Capabilities tasks can be created from AI Experts recommendations, with trace field:
   - `source: 'ai-experts'`
   - `sourceRoleId`

### 6.3 Commander Integration

1. Reuse `commander.get/update/bindLLM` data model as orchestration root.
2. Capabilities Center reads active roles from commander state for role-scoped views.

### 6.4 Mandatory Reuse Contract (Detailed)

| Existing Module | Current Implementation | Capabilities Center Reuse Rule |
|---|---|---|
| LLM Providers | `llm.providers.*` + `llm-providers.json` | Use directly; no duplicate provider APIs/files |
| UI Theme/Locale | `uiStore` + localStorage | Keep unchanged; capabilities pages must inherit |
| Skills Source | `skills.list/get` + `skillStore` + default fallback | Use same role capability taxonomy and keys |
| Commander Binding | `commander.bindLLM` API exists | Make it authoritative for role-provider-model binding |
| AI Experts Chat | role prompt + provider direct call + local fallback | Preserve fallback; only change provider selection priority |

---

## 7. Backend Design

### 7.1 New Source Folder

`packages/core/src/capabilities/`

1. `types.ts`
2. `repository.ts`
3. `service.ts`

### 7.2 Core Type Definitions

```ts
type DomainId = 'light' | 'dark' | 'security' | 'legal' | 'technology' | 'business';
type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3';
type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'closed';
type RunStatus = 'queued' | 'running' | 'success' | 'failed' | 'canceled';

interface CapabilityDomain {
  id: DomainId;
  name: string;
  description: string;
  kpi: { riskScore: number; closureRate: number; slaRate: number; trend: number };
}

interface CapabilityItem {
  id: string;
  domainId: DomainId;
  name: string;
  description: string;
  ownerRoles: string[];
  partnerRoles: string[];
  tools: string[];
  playbookId?: string;
  enabled: boolean;
}

interface SecurityTask {
  id: string;
  domainId: DomainId;
  capabilityId: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeRole: string;
  dueAt?: number;
  slaMinutes?: number;
  createdAt: number;
  updatedAt: number;
}

interface ExecutionRun {
  id: string;
  taskId: string;
  toolId: string;
  params: Record<string, unknown>;
  status: RunStatus;
  startedAt?: number;
  endedAt?: number;
  summary?: string;
  artifacts: string[];
}

interface Approval {
  id: string;
  taskId: string;
  type: 'dark-operation';
  requester: string;
  approver?: string;
  scope: string;
  ticketNo: string;
  expiresAt: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
}

interface EvidencePack {
  id: string;
  domainId: DomainId;
  taskId?: string;
  runId?: string;
  title: string;
  files: string[];
  hash: string;
  createdAt: number;
  tags: string[];
}
```

### 7.3 Storage Files

Under `packages/core/data/storage/`:

1. `capability-domains.json`
2. `capability-items.json`
3. `capability-tasks.json`
4. `execution-runs.json`
5. `approvals.json`
6. `evidence-packs.json`

### 7.4 Gateway Methods

Add methods in `packages/core/src/gateway/router.ts`:

1. `capabilities.domains.list`
2. `capabilities.items.list`
3. `capabilities.tasks.list`
4. `capabilities.tasks.create`
5. `capabilities.tasks.updateStatus`
6. `capabilities.runs.execute`
7. `capabilities.runs.listByTask`
8. `capabilities.approvals.create`
9. `capabilities.approvals.approve`
10. `capabilities.evidence.create`
11. `capabilities.evidence.list`
12. `capabilities.overview.metrics`

### 7.5 Guardrail Rule (Dark Side)

`capabilities.runs.execute` must enforce:

1. Resolve task by `taskId`
2. If `task.domainId === 'dark'`, require a non-expired `approved` approval
3. If missing, return error code: `APPROVAL_REQUIRED`

---

## 8. Frontend Design

### 8.1 New UI Components

Under `ui/src/ui/pages/capabilities/`:

1. `sc-capabilities-page.ts` (entry page + 6 tabs)
2. `sc-domain-board.ts` (common domain layout)
3. `sc-task-panel.ts` (task board)
4. `sc-run-log-panel.ts` (execution runs)
5. `sc-evidence-panel.ts` (evidence list)
6. `sc-approval-dialog.ts` (dark-side approval dialog)

### 8.2 Route

In `ui/src/ui/app.ts`:

1. import `./pages/capabilities/sc-capabilities-page.js`
2. add route: `{ path: '/capabilities', component: 'sc-capabilities-page' }`

### 8.3 Page Layout Contract

Each domain tab must contain:

1. KPI bar (risk, closure, SLA, trend)
2. capability list (owner role + quick actions)
3. task board
4. run log stream
5. evidence panel

---

## 9. API Payload Contract

### 9.1 List Capability Items

```json
{ "domainId": "light", "roleId": "security-ops", "enabledOnly": true }
```

### 9.2 Create Task

```json
{
  "domainId": "dark",
  "capabilityId": "dark-pt-001",
  "title": "External pentest validation",
  "priority": "P1",
  "assigneeRole": "security-expert",
  "slaMinutes": 240
}
```

### 9.3 Execute Run

```json
{
  "taskId": "task_xxx",
  "toolId": "pentest.runner",
  "params": { "target": "10.0.0.0/24" },
  "source": "ai-experts",
  "sourceRoleId": "security-expert"
}
```

### 9.4 Create Approval

```json
{
  "taskId": "task_xxx",
  "requester": "security-expert",
  "scope": "10.0.0.0/24",
  "ticketNo": "CHG-2026-001",
  "expiresAt": 1774000000000
}
```

---

## 10. Phased Delivery Plan

### Sprint 0 (Alignment with Existing Implementations)

1. Persist AI Experts Config role bindings to backend (not UI-only state).
2. Update AI Experts chat to use role-bound provider/model first.
3. Confirm Settings page remains single entry for LLM + AI expert binding.

### Sprint 1

1. Data model + repository + seed data
2. `capabilities.domains/items/tasks` list + create

### Sprint 2

1. Run execution pipeline
2. Evidence creation and listing
3. Frontend domain board + task panel

### Sprint 3

1. Dark-side approval workflow
2. Approval dialog + pre-execution check
3. Error code and UX handling (`APPROVAL_REQUIRED`)

### Sprint 4

1. KPI aggregation
2. Report/export hooks
3. Role-focused view optimization

---

## 11. Acceptance Criteria

1. All 6 domains are visible and queryable.
2. Tasks can be created and status-updated end-to-end.
3. Dark-side execution is blocked without approval.
4. Every run has persisted run log and can attach evidence.
5. Domain KPI cards render from `capabilities.overview.metrics`.
6. AI Experts Config role binding persists and is reflected after refresh.
7. AI Experts chat honors role-bound provider/model when available.
8. No duplicate provider configuration path outside `/settings/llm-config`.

---

## 12. Risks and Mitigations

1. Risk: Connector capability mismatch  
   Mitigation: introduce mock adapters and `toolId` capability registry first.
2. Risk: Approval bypass by direct method call  
   Mitigation: enforce approval in backend service layer, not UI only.
3. Risk: Data inconsistency in JSON writes  
   Mitigation: keep atomic write pattern in `JsonStore.set`.
4. Risk: Role binding drift between AI Experts UI and commander state  
   Mitigation: use commander APIs as single persisted binding source.

---

## 13. Next Action for AI Coding

Start implementation in this order:

1. Sprint 0 alignment changes (AI Experts Config persistence + chat binding priority)
2. `types.ts` + `repository.ts`
3. `service.ts`
4. `router.ts` method wiring
5. `sc-capabilities-page.ts` + `sc-domain-board.ts`
6. task/run/evidence panels
7. approval dialog and dark-side guardrail UX

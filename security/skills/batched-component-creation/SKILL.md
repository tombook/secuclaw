---
name: batched-component-creation
description: A systematic workflow for efficiently adding large sets of related components by batching creation (2-4 per iteration) and deferring index/routing updates until the end.
---

# Batched Component Creation Workflow

Use this workflow when adding multiple related components to an existing codebase (e.g., feature modules, security rules, API endpoints, UI components).

## Core Pattern

1. **Explore first** — Understand existing structure before creating
2. **Batch creation** — Create 2-4 components per iteration
3. **Incrementally verify** — Check each batch works before proceeding
4. **Update exports last** — Handle index files, routing, and barrel exports after all components exist

## Step-by-Step Instructions

### Phase 1: Exploration

```bash
# List directory structure to understand patterns
list_dir /path/to/project/src/features

# Read existing component files to understand conventions
read_file /path/to/project/src/features/base-component.ts
```

Identify:
- File naming conventions
- Code structure patterns
- Export/index file patterns

### Phase 2: Batch Creation

Create components in batches of 2-4. For each batch:

1. Create the files following established patterns
2. Run a quick verification (type check, lint, or simple smoke test)
3. Verify batch succeeded before proceeding

Example batch:
```
# Batch 1: Create threat-hunting, anomaly-detection
- src/features/threat-hunting/index.ts
- src/features/threat-hunting/types.ts
- src/features/anomaly-detection/index.ts
- src/features/anomaly-detection/types.ts

# Verify: tsc --noEmit && echo "Batch 1 OK"

# Batch 2: Create kpi-monitor, audit-logger
...
```

### Phase 3: Export & Routing Update

After all components exist, update the integration points:

```typescript
// index.ts or barrel file
export { ThreatHunting } from './threat-hunting';
export { AnomalyDetection } from './anomaly-detection';
// ... all remaining exports
```

Update routing/config files after ensuring all imports resolve.

## Verification Commands

Run these between batches:
```bash
# TypeScript check
npx tsc --noEmit

# ESLint
npx eslint src/features/

# Simple smoke test
npx vitest run --reporter=basic
```

## When to Use This

- Adding 5+ related components
- Components follow consistent patterns
- Integration is deferred (not immediately consumed)

## When NOT to Use

- Only 1-2 components needed (just create directly)
- Components have wildly different structures
- Immediate integration testing required per component

## Example

Adding 12 new security rules to a SecuClaw platform:

```bash
# Phase 1: Explore structure
list_dir ./rules
read_file ./rules/base-rule.ts

# Phase 2: Batch creation (4 per batch = 3 iterations)
# Batch 1: Create rules 1-4
# Batch 2: Create rules 5-8  
# Batch 3: Create rules 9-12

# Phase 3: Update exports
# Update rules/index.ts with all new exports
# Update rules/routes.ts with new paths
```
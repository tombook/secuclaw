---
name: discovery-first-verification
description: Explore existing codebase structure before building features to avoid redundant work on already-implemented components.
---

# Discovery-First Verification Workflow

When tasked with evolving or adding features to a large, established codebase, follow this three-phase workflow to avoid redundant work.

## When to Use

- Codebase has 50+ components or modules
- Task involves "continue evolving", "extend", "add features to"
- Platform already appears feature-rich from initial assessment
- Previous work may have already covered requirements

## Phase 1: Discovery

Explore the directory structure to understand existing coverage.

```bash
# Count total components/features
find . -type f -name "*.ts" -o -name "*.tsx" | wc -l

# List top-level feature directories
ls -la src/features/ src/components/ src/modules/ 2>/dev/null || ls -la src/

# Understand architecture patterns
find . -type f -name "index.ts" -o -name "index.tsx" | head -20

# Check for existing implementations of target feature
grep -r --include="*.ts" "keyword" src/ | head -20
```

Create a mental map:
- Total component count
- Feature directory organization
- Naming conventions used
- Architecture patterns (hooks, services, components)

## Phase 2: Verification

Map existing implementations against requirements.

1. **List requirement features** you need to implement
2. **Cross-reference** with discovered structure
3. **Mark as covered** any features that already exist
4. **Identify gaps** that need actual work

```markdown
## Feature Coverage Checklist
- [ ] User authentication → Found: auth/ (5 components)
- [ ] API integration → Found: services/api.ts
- [ ] Dashboard UI → Found: components/Dashboard.tsx
- [ ] Export functionality → NOT FOUND → Build needed
- [ ] Theme system → Partial: Found base, missing dark mode
```

## Phase 3: Construction

Only build missing items identified in verification phase.

```
Focus areas:
1. Missing feature: Export functionality (src/features/export/)
2. Partial feature: Theme dark mode (src/theme/dark-mode.ts)
```

## Why This Works

| Approach | Large Codebase (100+ components) |
|----------|----------------------------------|
| Build-first | Wasted effort on duplicates, conflicts with existing code |
| Discovery-first | 172 components found, only 3 needed → 90%+ time saved |

## Quick Decision Tree

```
START: Task involves existing codebase?
  → NO: Standard approach
  → YES: Codebase large (>50 components)?
       → NO: Standard approach
       → YES: Execute Discovery-First Workflow
```

## Output Template

After discovery, document findings:

```markdown
# Codebase Analysis Summary

**Total Components:** X
**Feature Directories:** Y
**Architecture Pattern:** [type]

## Coverage vs Requirements

| Requirement | Status | Location |
|-------------|--------|----------|
| Feature A   | ✓ Found | components/feature-a/ |
| Feature B   | ✗ Missing | N/A |
| Feature C   | ~ Partial | components/feature-c/ (missing X) |

## Build Plan
1. [Only items that are actually missing]
```
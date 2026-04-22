---
name: verify-then-build
description: When tasked with building or improving code, first catalog existing implementations to avoid duplication, but then actually modify code when the task requires enhancements rather than stopping at documentation.
---

# Verify-Then-Build Pattern

When given a task to build, improve, or enhance code features, follow this two-phase approach.

## Phase 1: Verify Existing Implementations

Before writing new code, search for existing implementations:

1. Search the codebase for relevant modules, patterns, or partial solutions
2. Catalog what exists and assess relevance to the task
3. This prevents duplicate work and reveals reusable components

## Phase 2: Decide and Act

After verification, determine which scenario applies:

| Scenario | Agent Response |
|----------|----------------|
| Feature fully exists and task is to verify | Document findings and stop — task complete |
| Feature partially exists and needs enhancement | **Modify the existing code** — add features, fix gaps, improve implementation |
| Feature doesn't exist | Build new implementation |

### Critical Distinction

**Cataloging is NOT building.** A "continue evolving" task requires **actual code modifications**:

```python
# ❌ WRONG: Cataloging behavior
iterations 1-13:
  "Found 21 security modules, 15 validation patterns..."
  "Documented 8 existing approaches..."
  # Task remains incomplete

# ✅ CORRECT: Build-then-catalog behavior  
  "Found module X that handles part of this..."
  "Enhanced module X to add missing capability..."
  "New feature works and is integrated..."
```

## Decision Checklist

Before each iteration, ask:

1. **Did I find existing code?** → Document briefly, move on
2. **Does the task require new capabilities?** → Modify or extend code, don't catalog
3. **Is the task complete?** → Stop iterating

## When to Stop vs Continue

| Task Type | Stop After |
|-----------|------------|
| "Verify existing X" | Documentation complete |
| "Build X" | Code written and tested |
| "Continue evolving X" | Code **enhanced**, not just documented |
| "Improve X" | Actual improvements in place |

## Anti-Pattern Warning

If your iterations look like this:
- "Found module A..."
- "Cataloged pattern B..."
- "Documented approach C..."
- "Listed existing solutions..."

**You are cataloging, not building.** Stop and ask: *What code needs to change?*

---
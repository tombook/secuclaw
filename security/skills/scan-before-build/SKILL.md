---
name: scan-before-build
description: Verify existing project structure before creating new modules to avoid redundant work and save iteration budget.
---

# Scan Before Build

A lightweight reconnaissance workflow that checks existing project structure before creating new files or modules. This pattern prevents redundant work by revealing complete or near-complete implementations in large, feature-rich projects.

## When to Use

- Tasks involving multiple sub-features or modules
- Working in unfamiliar or large codebases
- Projects with complex directory structures
- Any task that might involve creating many files

## The Pattern

1. **Scan first** — Use `list_dir` to inspect the existing file structure
2. **Map coverage** — Compare existing files against the requirements
3. **Skip existing** — Do not recreate files/modules that already exist
4. **Focus effort** — Target only genuinely missing components

## Workflow

### Step 1: Initial Scan

Before taking any action, list the relevant directory:

```
list_dir /path/to/project
```

### Step 2: Identify Existing Coverage

Cross-reference the directory contents against your task requirements. Look for:
- Complete module implementations
- Partial implementations (may need completion, not recreation)
- Configuration files already in place
- Test files or documentation present

### Step 3: Plan Based on Reality

Create a targeted plan that:
- Skips fully implemented features
- Addresses only gaps in existing code
- Notes partial implementations for potential reuse

## Example

**Task:** Implement 19 security modules for a platform.

**Without scan-before-build:**
- Attempt to create all 19 modules → wasted effort on existing ones
- Iteration budget consumed on redundant work

**With scan-before-build:**
1. `list_dir /path/to/platform`
2. Discover 19 modules already exist
3. Verify coverage against requirements
4. Conclude task is complete → significant time saved

## Key Principle

> In complex projects, assumption of emptiness is often wrong. A 30-second scan can reveal that work is already done.

## When to Skip

- Greenfield projects with guaranteed empty directories
- Tasks explicitly requiring complete recreation
- Time-critical tasks where scanning overhead exceeds build time
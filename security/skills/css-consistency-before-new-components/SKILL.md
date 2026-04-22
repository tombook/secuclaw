---
name: css-consistency-before-new-components
description: Before creating new dashboard components, read existing ones to learn CSS variable conventions and established patterns for consistency.
---

# CSS Consistency Before Creating New Components

When building new UI components in an established codebase, always examine existing components first. This prevents styling inconsistencies and debugging time.

## Workflow

### Step 1: Identify Reference Components

Find existing components in the same feature area or with similar functionality:

```
sc-security-dashboard.ts
sc-cloud-security-posture.ts
```

### Step 2: Examine Patterns

Read these files to identify:

- **CSS variable naming conventions** (e.g., `--color-primary`, `--spacing-md`)
- **Component structure patterns** (file layout, imports, export style)
- **Class naming schemes** (BEM, utility classes, etc.)
- **State management patterns** (useState, hooks, props)

### Step 3: Document Conventions

Extract the conventions into a mental checklist:

```
✓ Colors: --color-*
✓ Spacing: --space-* or --spacing-*
✓ Typography: --text-*
✓ Border radius: --radius-*
✓ Shadows: --shadow-*
```

### Step 4: Apply to New Component

When writing the new component:

1. Use the same CSS variable prefixes
2. Match the import structure
3. Follow the same state management pattern
4. Use consistent class naming

## Example

**Before creating `sc-threat-trend-chart.ts`:**

```bash
# Read reference component
cat src/components/sc-security-dashboard.ts
cat src/components/sc-cloud-security-posture.ts
```

**Extract CSS patterns:**
```css
/* From existing component */
--color-bg-primary: #1a1a2e;
--color-text-secondary: #a0a0b0;
--spacing-md: 16px;
```

**Apply to new component:**
```css
.sc-threat-trend-chart {
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  padding: var(--spacing-md);
}
```

## When to Apply

- Creating new UI components in a dashboard
- Adding features to an established design system
- Extending existing page functionality
- Any time you see `sc-` prefixed component files

## Key Principle

**Read first, write second.** Understanding existing patterns is faster than refactoring inconsistencies later.
---
name: vite-ts-build-fix
description: Systematic workflow to diagnose and fix common Vite/TypeScript build errors by locating problematic syntax patterns and correcting them.
---

# Vite/TypeScript Build Error Fix Workflow

This skill provides a systematic approach to diagnosing and fixing build failures in Vite + TypeScript projects. Use this when `npm run build` or `vite build` fails with syntax-related errors.

## Workflow Overview

```
1. Run build to capture errors
2. Identify error types and file locations
3. Search for common problematic patterns
4. Fix issues with targeted edits
5. Re-run build to verify
```

## Step 1: Capture Build Errors

Run the build command and capture output:

```bash
npm run build 2>&1 | tee build.log
# or for Vite directly:
npx vite build 2>&1 | tee build.log
```

## Step 2: Identify Problem Patterns

Common patterns that cause build failures:

| Pattern | Description | Search Command |
|---------|-------------|----------------|
| Unicode escapes | Invalid `\u` sequences in strings | `grep -rn '\\u[0-9a-fA-F]{0,3}[^0-9a-fA-F]' --include="*.ts" --include="*.tsx"` |
| Duplicate exports | Same name exported multiple times | `grep -rn '^export.*const.*name' --include="*.ts"` |
| Trailing commas | Invalid comma placement | `grep -rn ',}' --include="*.ts" --include="*.tsx"` |
| Mismatched braces | Unclosed brackets | `grep -rn '{\|[}\|]}\|(\|)\|' --include="*.ts"` |

## Step 3: Locate Issues with grep

Use `grep -n` for line-numbered search to pinpoint exact locations:

```bash
# Search for Unicode escape issues (most common in complex strings)
grep -rn '\\u[0-9a-fA-F]\{0,4\}' src/ --include="*.ts" --include="*.tsx"

# Search for duplicate const exports (causes "duplicate identifier" errors)
grep -rn 'export const ' src/ | sort | uniq -d

# Find files with potential syntax issues
grep -rn '[^\\]\\u[0-9a-fA-F]' src/ --include="*.ts" --include="*.tsx" -l
```

## Step 4: Fix Issues

### Fix A: Remove Invalid Unicode Escapes

```bash
# Using sed to replace escaped sequences (example patterns)
sed -i 's/\\u00A0/ /g' file.ts      # Replace nbsp with space
sed -i 's/\\u2019/'"'"'/g' file.ts  # Replace right single quote

# For complex cases, rewrite the line:
sed -i 'LINE_NUMs/OLD_TEXT/NEW_TEXT/' file.ts
```

### Fix B: Remove Duplicate Exports

```bash
# Find duplicates first
dupes=$(grep -rn 'export const DUPLICATE_NAME' src/ --include="*.ts")
echo "$dupes"

# Remove the duplicate (keep first occurrence)
# Edit file manually or use sed with line numbers
```

### Fix C: Direct File Rewriting

For complex fixes, use a shell agent:

```bash
# Read the problematic file
cat -n file.ts | head -100

# Rewrite with corrections
echo 'fixed content' > file.ts
```

## Step 5: Verify Fixes

Re-run the build to confirm:

```bash
npm run build 2>&1 | tail -20
```

## Common Error -> Fix Mapping

| Error Message | Likely Cause | Fix Action |
|---------------|--------------|------------|
| `Invalid escape sequence` | Unicode escape in string | Find with grep, replace with literal char |
| `Duplicate identifier` | Same const/function exported twice | Remove duplicate export |
| `Unexpected token` | Syntax error in TSX/JSX | Check brace matching with grep |
| `Cannot find module` | Import path issue | Verify file exists and path is correct |

## Automation Script Template

```bash
#!/bin/bash
# fix-build-errors.sh - Run after build failures

PROJECT_ROOT="${1:-.}"

echo "=== Searching for common build error patterns ==="

echo "[1/4] Checking for invalid Unicode escapes..."
grep -rn '\\u[0-9a-fA-F]\{0,4\}[^0-9a-fA-F"]' "$PROJECT_ROOT/src" --include="*.ts" --include="*.tsx" || true

echo "[2/4] Checking for duplicate exports..."
grep -rn 'export const ' "$PROJECT_ROOT/src" --include="*.ts" | awk -F: '{print $3}' | sort | uniq -d || true

echo "[3/4] Checking for trailing comma issues..."
grep -rn ',}' "$PROJECT_ROOT/src" --include="*.ts" --include="*.tsx" || true

echo "[4/4] Build complete. Review output above."
```

## When to Use This Skill

- `npm run build` fails with syntax errors
- TypeScript compiler reports "Invalid escape sequence"
- Vite build fails on specific component files
- After merging code that introduced encoding issues

## Limitations

This skill handles syntax-level issues. For type errors or module resolution failures, additional investigation may be needed.

---
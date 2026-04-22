---
name: iterative-file-verification
description: Use directory listing commands after each component batch to track creation progress and verify completeness against targets.
---

# Iterative File Verification

Use directory listing commands to verify component creation after each batch, enabling real-time progress tracking and gap identification.

## When to Use

- Creating multiple files/components across iterations
- Need to confirm batch completion before proceeding
- Tracking progress against a target count
- Validating file organization and naming patterns

## Core Pattern

### 1. Count specific file types after batch creation

```bash
# Count TypeScript components created
ls *.ts | wc -l

# Count components in a directory
ls src/components/ | wc -l

# Count files matching a pattern
ls -la | grep -E '\.ts$' | wc -l
```

### 2. Verify against expected targets

```bash
# Compare current count to target
current=$(ls *.ts | wc -l)
target=50
echo "Progress: $current / $target"
if [ "$current" -ge "$target" ]; then
  echo "Batch complete"
fi
```

### 3. Identify gaps with pattern matching

```bash
# Find missing numbered components
for i in $(seq 1 50); do
  if [ ! -f "component-$i.ts" ]; then
    echo "Missing: component-$i.ts"
  fi
done

# List files sorted to spot gaps
ls -1 component-*.ts | sort -V
```

## Workflow Integration

```
Iteration 1: Create batch → ls *.ts | wc -l → Verify count
Iteration 2: Create batch → ls *.ts | wc -l → Verify cumulative count
...
Iteration N: Continue until target reached
```

## Example: Track Component Creation

```bash
# Before starting batch
echo "Starting batch. Current count: $(ls *.ts 2>/dev/null | wc -l)"

# After creating components
ls -1 *.ts | wc -l

# Example output comparison
# Batch 1: 15 files created
# Batch 2: 15 files created → Running total: 30
# Batch 3: 15 files created → Running total: 45
# Target: 50 → Gap identified: 5 remaining
```

## Verification Commands Reference

| Command | Purpose |
|---------|---------|
| `ls *.ts \| wc -l` | Count all .ts files |
| `ls -1 \| wc -l` | Count all files in current dir |
| `find . -name "*.ts" \| wc -l` | Recursive count |
| `ls -1 dir/ \| wc -l` | Count files in specific directory |

## Decision Framework

After each verification:
- **Count meets target** → Proceed to next batch
- **Count below target** → Identify gaps, create missing files
- **Unexpected count** → Investigate naming issues or duplicate creation
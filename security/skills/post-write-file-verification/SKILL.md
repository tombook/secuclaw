---
name: post-write-file-verification
description: Use run_shell with wc -l and head -n to reliably verify file content after write operations, avoiding stale read_file results during concurrent operations.
---

# Post-Write File Verification Skill

When writing files, especially during concurrent operations or after long write processes, relying on `read_file` immediately may return stale, empty, or incomplete results. This skill provides a reliable verification method.

## When to Use

- After creating or modifying files
- When concurrent writes may be occurring
- To confirm file was written correctly with expected size
- When `read_file` shows unexpected empty state

## Verification Method

Use `run_shell` commands to verify file content:

1. Check file exists and has content:
```bash
wc -l <filepath>
```

2. Preview file beginning to confirm content structure:
```bash
head -n <count> <filepath>
```

3. Verify specific patterns or sections:
```bash
grep "<pattern>" <filepath>
```

## Examples

### Verify a newly created file
```bash
# Check line count - should be positive, not 0
wc -l /path/to/file
# Expected: e.g., "42 /path/to/file"

# Preview content to confirm actual data
head -n 5 /path/to/file
# Expected: first 5 lines of actual content
```

### Verify after batch writes (like generating a large report)
```bash
# Confirm file has expected line count
wc -l /path/to/report.md
# Should return expected line count, not 0 or empty

# Preview beginning to verify structure
head -n 10 /path/to/report.md
# Should show actual report content, not empty state
```

### Verify large files or dashboards
```bash
# Get total line count
wc -l /path/to/dashboard.html
# e.g., "672 /path/to/dashboard.html"

# Verify specific section exists
head -n 50 /path/to/dashboard.html
# Should show dashboard header and initial structure
```

## Key Principle

**Do not trust `read_file` immediately after write operations.** Always use `run_shell` with `wc -l` and `head -n` to confirm actual file state before proceeding.

## Verification Checklist

After any file write operation:
1. Run `wc -l <filepath>` — confirm line count > 0
2. Run `head -n <N> <filepath>` — confirm content matches expectations
3. Only then use `read_file` for detailed inspection if needed

This pattern ensures reliable verification even during concurrent writes or when file handles may not be fully flushed.
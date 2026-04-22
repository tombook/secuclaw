---
name: shell-error-fallback
description: Use write_file directly when shell_agent fails with unknown errors during file creation operations.
---

# Shell Error Fallback for File Writing

## Problem
When using `shell_agent` to create files via shell commands (e.g., `echo "content" > file`), the agent may fail with an "unknown error" status. This can happen even when the command syntax is correct.

## Solution
Bypass the shell delegation and use `write_file` directly for file creation. The write_file tool creates files without shell interpretation, avoiding the unknown error failure mode.

## When to Apply
- `shell_agent` returns "unknown error" during file operations
- Multiple consecutive file write attempts fail via shell
- Shell-based file creation is unreliable in the current environment
- After 1-2 failed shell attempts, switch immediately

## Procedure

### Step 1: Detect the Failure Pattern
- If `shell_agent` returns "unknown error" or repeated failures
- After 2 failed attempts with shell delegation, stop retrying shell

### Step 2: Switch to Direct File Creation
Use `write_file` with the exact file path and content:

```json
{
  "path": "path/to/file.ext",
  "content": "file content here"
}
```

### Step 3: Batch Remaining Files
Apply the same direct approach to all subsequent file creation operations. The pattern typically succeeds consistently once shell is bypassed.

### Step 4: Verify Success
- Check that each file was written correctly
- Proceed with remaining tasks using write_file

## Example

**Failed approach:**
```
shell_agent: Create src/config.json with {"setting": "value"}
# Result: "unknown error"
```

**Successful fallback:**
```
write_file: {"path": "src/config.json", "content": "{\"setting\": \"value\"}"}
# Result: File created successfully
```

## Key Principle
When a tool fails consistently, identify a direct alternative tool that accomplishes the same goal without the intermediary layer causing the failure. Direct tools bypass shell interpretation and environment issues.

## Summary
| Approach | Tool | Use When |
|----------|------|----------|
| Primary | shell_agent | Normal operations, commands beyond file creation |
| Fallback | write_file | Shell fails with unknown error on file ops |
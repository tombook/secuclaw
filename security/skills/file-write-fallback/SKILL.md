---
name: file-write-fallback
description: Use heredoc via run_shell when write_file fails with unknown errors, especially on large existing codebases.
---

# File Write Fallback Pattern

When `write_file` fails with an "unknown error" on certain file paths—particularly in large existing codebases—use `run_shell` with heredoc syntax as a reliable alternative.

## When to Use This Pattern

- `write_file` returns an "unknown error" or times out
- Target paths involve large existing files or complex directory structures
- Previous write attempts on the same path have succeeded with heredoc

## Heredoc Write Command

Use the following `run_shell` command format:

```bash
cat > /path/to/file << 'ENDOFFILE'
file content goes here
ENDOFFILE
```

### Key Syntax Points

1. **Quote the delimiter** (`'ENDOFFILE'`) to prevent variable expansion in the content
2. **No spaces** after the delimiter on the opening line (`<< 'ENDOFFILE'`)
3. **Content follows immediately** on the next line
4. **Closing delimiter** on its own line with no preceding spaces

## Example Usage

### Single file write:

```bash
cat > /workspace/project/src/main.js << 'ENDOFFILE'
const express = require('express');
const app = express();
// ... rest of content
ENDOFFILE
```

### Multi-line content:

```bash
cat > /workspace/config/settings.json << 'ENDOFFILE'
{
  "name": "my-project",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0"
  }
}
ENDOFFILE
```

### Overwriting existing files:

```bash
cat > /workspace/existing/file.py << 'ENDOFFILE'
# This will overwrite the existing file
def main():
    print("Updated content")
ENDOFFILE
```

## Verification After Write

Always verify the file was written correctly:

```bash
cat /path/to/file
# or
wc -l /path/to/file
```

## Summary

| Tool | Use When |
|------|----------|
| `write_file` | Normal operations, new files, small content |
| `run_shell` with heredoc | `write_file` fails, large files, existing codebases |
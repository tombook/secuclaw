---
name: write-file-fallback-on-error
description: When write_file tool fails with unknown errors, fall back to shell-based file creation using heredoc syntax or echo/printf redirection.
---

# Fallback File Writing Strategy

## Problem

The `write_file` tool may fail with "unknown error" in certain contexts (permission issues, path constraints, or environment quirks). When this happens, use shell-based alternatives for file creation.

## When to Apply

1. `write_file` returns an unknown/unclear error
2. File creation appears to succeed but the file is missing
3. After multiple retries of `write_file` have failed

## Fallback Methods

### Method 1: Heredoc with `cat`

```bash
cat > /path/to/file << 'EOF'
content line 1
content line 2
content line 3
EOF
```

Use single quotes around `EOF` to prevent variable expansion, or double quotes to allow it.

### Method 2: `echo` with redirection

```bash
echo -e "line1\nline2\nline3" > /path/to/file
```

### Method 3: `printf` with redirection

```bash
printf '%s\n' "line1" "line2" "line3" > /path/to/file
```

### Method 4: Multi-line strings with printf

```bash
printf '%s\n' \
  "#!/bin/bash" \
  "echo hello" \
  "exit 0" \
  > /path/to/file
```

## Step-by-Step Procedure

1. **Detect failure**: Note when `write_file` fails with unclear error
2. **Extract content**: Get the exact content that was supposed to be written
3. **Choose method**: Prefer heredoc for multi-line content, echo/printf for single lines
4. **Execute shell command**: Use `run_shell` with appropriate syntax
5. **Verify**: Read the file back to confirm content was written correctly

## Example Recovery

```bash
# Original write_file call failed with: unknown error
# Fallback using heredoc:
cat > /path/to/module.py << 'EOF'
def main():
    print("Hello World")
    return 0

if __name__ == "__main__":
    main()
EOF
```

## Best Practices

- For executable scripts, ensure proper shebang: `#!/bin/bash` or `#!/usr/bin/env python3`
- Use `chmod +x /path/to/file` after creation if needed
- For binary content, base64-encode first: `echo "$content" | base64 -d > /path/to/file`
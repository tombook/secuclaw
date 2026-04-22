---
name: fallback-file-write-heredoc
description: Use run_shell heredoc syntax as a fallback when write_file fails with unknown errors
---

# Fallback File Write with Heredoc

When `write_file` fails with an 'unknown error', use `run_shell` with heredoc syntax as a reliable fallback method.

## When to Use

- `write_file` returns 'unknown error' or fails silently
- File creation is critical for task completion
- Other methods have been attempted without success

## Method

Use `run_shell` with cat and heredoc syntax:

```bash
run_shell --command "cat > /path/to/file << 'ENDOFFILE'
file content here
ENDOFFILE"
```

### Key Elements

1. `cat > /path/to/file` - redirects output to the target file
2. `<< 'ENDOFFILE'` - heredoc delimiter (quotes prevent variable expansion)
3. `ENDOFFILE` - marks where content ends

## Example

Writing a configuration file:

```bash
run_shell --command "cat > /tmp/config.yaml << 'ENDOFFILE'
name: example
version: 1.0
settings:
  enabled: true
ENDOFFILE"
```

Writing a script:

```bash
run_shell --command "cat > /usr/local/bin/myscript.sh << 'ENDOFSCRIPT'
#!/bin/bash
echo \"Hello from script\"
ENDOFSCRIPT"
```

## Verification

After writing, verify the file exists and contains expected content:

```bash
run_shell --command "cat /path/to/file"
```

## Notes

- The quoted heredoc delimiter (`'ENDOFFILE'`) prevents unintended variable expansion in the content
- Choose any delimiter name that doesn't appear in the file content
- This method works reliably across most shell environments
- Ensure proper quoting of special characters in the content
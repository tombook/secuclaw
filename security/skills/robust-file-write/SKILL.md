---
name: robust-file-write
description: A systematic debugging workflow for handling write_file failures with progressive fallback strategies
---

# Robust File Write Debugging Workflow

When `write_file` operations fail with unknown or unclear errors, follow this systematic debugging workflow before escalating or abandoning the operation.

## The Problem

Repeatedly retrying the same failed approach wastes iterations. When writes fail, debug methodically using these progressive strategies.

## Debugging Steps (in order)

### Step 1: Validate File Path

Check that the path is well-formed and parent directories exist:

```python
import os

def validate_path(file_path):
    # Check parent directories exist
    parent = os.path.dirname(file_path)
    if parent and not os.path.exists(parent):
        return False, f"Parent directory does not exist: {parent}"
    
    # Check for invalid characters (platform-specific)
    invalid_chars = ['<', '>', '|', '\0']
    for char in invalid_chars:
        if char in file_path:
            return False, f"Invalid character in path: {char}"
    
    return True, "Path is valid"
```

### Step 2: Verify Directory Permissions

Check write permissions on the target directory:

```bash
# Check if directory exists and is writable
ls -la /path/to/directory
test -w /path/to/directory && echo "writable" || echo "not writable"

# Check disk space
df -h /path/to/directory
```

### Step 3: Split Writes into Smaller Chunks

Large file writes can fail due to memory or timeout constraints. Split into manageable pieces:

```python
def write_file_chunked(file_path, content, chunk_size=10000):
    """Write content in chunks to handle large files."""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, 'w') as f:
        for i in range(0, len(content), chunk_size):
            chunk = content[i:i + chunk_size]
            f.write(chunk)
            f.flush()  # Ensure each chunk is written
```

### Step 4: Use run_shell as Fallback

If `write_file` fails persistently, use shell commands directly:

```bash
# Create directory structure
mkdir -p /path/to/directory

# Write using cat/heredoc
cat << 'EOF' > /path/to/file.txt
file content here
EOF

# Or use echo/printf for smaller content
echo "content" > /path/to/file.txt
printf '%s' "content" > /path/to/file.txt

# Copy from temp file
echo "$CONTENT" > /tmp/temp_file.txt
mv /tmp/temp_file.txt /path/to/file.txt
```

## Decision Flowchart

```
write_file fails
    │
    ├─► Path valid? ──No──► Create parent dirs, validate path
    │                        │
    │                        ▼
    │                    Try write_file again
    │
    ├─► Permissions OK? ──No──► Fix permissions with chmod/chown
    │                            │
    │                            ▼
    │                        Try write_file again
    │
    ├─► File too large? ──Yes──► Split into chunks
    │                            │
    │                            ▼
    │                        Write chunked
    │
    └─► Still failing? ──Yes──► Use run_shell fallback
                                     │
                                     ▼
                               Verify with read_file
```

## Example: Full Debugging Sequence

```python
# Attempt 1: Direct write
try:
    write_file(path="/project/src/theme.ts", content=theme_content)
except Exception as e:
    print(f"Initial write failed: {e}")
    
    # Debug step 1: Check path
    parent = os.path.dirname("/project/src/theme.ts")
    if not os.path.exists(parent):
        run_shell("mkdir -p /project/src")
    
    # Debug step 2: Permissions
    result = run_shell("test -w /project/src && echo 'ok' || echo 'perm_error'")
    if "perm_error" in result:
        run_shell("chmod 755 /project/src")
    
    # Debug step 3: Try chunked if content is large (>50KB)
    if len(theme_content) > 50000:
        write_file_chunked("/project/src/theme.ts", theme_content)
    else:
        # Debug step 4: Fallback to shell
        run_shell(f"cat << 'SCRIPT_EOF' > /project/src/theme.ts\n{theme_content}\nSCRIPT_EOF")
    
    # Verify success
    verify = read_file("/project/src/theme.ts")
    if verify and len(verify) > 0:
        print("Write verified successfully")
```

## Key Rules

1. **Never repeat the same failed approach** — diagnose before retrying
2. **Progress through strategies** — don't skip to shell if simpler fixes might work
3. **Always verify** — after any fix, confirm the file was written correctly
4. **Log debugging steps** — helps diagnose recurring issues
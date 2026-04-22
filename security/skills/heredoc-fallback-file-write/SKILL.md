---
name: heredoc-fallback-file-write
description: When write_file repeatedly fails, switch to run_shell with heredoc syntax for reliable multi-component file creation.
---

# Heredoc Fallback for File Writing

## Pattern Overview

When `write_file` encounters 2+ consecutive errors during multi-component creation, fall back to `run_shell` with heredoc syntax (`cat > file << 'ENDOFFILE'`) for reliable file creation.

## When to Trigger the Fallback

- `write_file` fails 2 or more times in a row
- File contains complex syntax (brackets, quotes, special characters)
- Creating multiple related files in sequence
- Output indicates "file not found" or "permission denied" errors

## Heredoc Syntax

```bash
cat > target/file.ext << 'ENDOFFILE'
content line 1
content line 2
ENDOFFILE
```

### Key elements:
| Element | Purpose |
|---------|---------|
| `cat > file` | Redirect output to file |
| `<< 'ENDOFFILE'` | Single-quoted heredoc marker - prevents variable expansion |
| `ENDOFFILE` | Closing marker - must match opening exactly |

## Step-by-Step Procedure

1. **Detect failure**: `write_file` returns error or unexpected output after 2+ attempts
2. **Switch tool**: Use `run_shell` instead of `write_file`
3. **Use heredoc**: Format command with `cat >` and `<< 'ENDOFFILE'`
4. **Verify**: Check file was created (`ls -la` or `cat file`)
5. **Continue**: Resume with `run_shell` for remaining files

## Examples

### TypeScript Component
```bash
run_shell - command: "cat > src/components/Button.tsx << 'ENDOFFILE'
import React from 'react';

interface Props {
  label: string;
  onClick: () => void;
}

export function Button({ label, onClick }: Props) {
  return <button onClick={onClick}>{label}</button>;
}
ENDOFFILE
"
```

### JSON Configuration
```bash
run_shell - command: "cat > config/app.json << 'ENDOFFILE'
{
  \"name\": \"my-app\",
  \"version\": \"1.0.0\",
  \"dependencies\": {
    \"react\": \"^18.2.0\"
  }
}
ENDOFFILE
"
```

### Shell Script
```bash
run_shell - command: "cat > scripts/deploy.sh << 'ENDOFFILE'
#!/bin/bash
set -e
npm run build
npm run test
echo \"Deploy complete\"
ENDOFFILE
"
run_shell - command: "chmod +x scripts/deploy.sh"
```

## Multi-File Creation Pattern

For creating multiple files, chain heredoc commands:

```bash
run_shell - command: "cat > src/index.ts << 'ENDOFFILE'
export { Button } from './components/Button';
export { LoginForm } from './components/LoginForm';
ENDOFFILE

cat > src/components/Button.tsx << 'ENDOFFILE'
import React from 'react';
export function Button({ label }: { label: string }) {
  return <button>{label}</button>;
}
ENDOFFILE

cat > src/components/LoginForm.tsx << 'ENDOFFILE'
import React from 'react';
export function LoginForm() {
  return <form><input placeholder=\"Email\" /></form>;
}
ENDOFFILE
"
```

## Why This Works

- `write_file` may fail on complex multi-line content with special characters
- `run_shell` heredoc treats content as raw text until closing marker
- No escaping required for quotes, brackets, or newlines
- Shell redirection is more robust for code files with complex syntax

## Rules

- Always use single quotes around heredoc marker (`<< 'ENDOFFILE'`) to prevent shell variable expansion
- Ensure closing `ENDOFFILE` is on its own line with no trailing spaces
- For binary or non-text files, do not use this pattern

<EVO
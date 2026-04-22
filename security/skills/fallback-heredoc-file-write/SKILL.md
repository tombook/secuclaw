---
name: fallback-heredoc-file-write
description: Use run_shell with heredoc syntax as a reliable fallback when write_file operations fail for multi-line text files
---

# Fallback File Writing with Heredoc

When `write_file` operations fail with 'unknown error', use `run_shell` with heredoc syntax as a dependable fallback for writing text files, especially TypeScript and CSS.

## When to Use

- `write_file` returns 'unknown error' or fails silently
- Writing multi-line files: `.ts`, `.tsx`, `.css`, `.js`, `.json`
- Need to preserve exact indentation and formatting
- Files contain special characters or complex syntax

## Procedure

1. **First attempt**: Use `write_file` normally

2. **On failure**: Switch to `run_shell` with heredoc syntax:
   ```bash
   cat > /path/to/file.ts << 'ENDOFFILE'
   // Your content here
   export const example = () => "test";
   ENDOFFILE
   ```

3. **Verify**: Check the file was created correctly:
   ```bash
   cat /path/to/file.ts
   ```

## Key Rules

- Use single quotes around the delimiter (`'ENDOFFILE'`) to prevent shell variable expansion
- The closing delimiter must appear alone on its own line with no preceding spaces
- Heredoc preserves leading whitespace — indent content appropriately
- Use descriptive delimiter names (e.g., `ENDOFFILE`, `EOF`, `END`)
- Keep delimiter consistent across the session

## Examples

### TypeScript Component
```bash
cat > src/components/Dashboard.tsx << 'ENDOFFILE'
import React from 'react';

interface DashboardProps {
  title: string;
  theme: 'dark' | 'light';
}

export const Dashboard: React.FC<DashboardProps> = ({ title, theme }) => {
  const styles = {
    background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
    color: theme === 'dark' ? '#ffffff' : '#000000'
  };

  return (
    <div style={styles} className="dashboard">
      <h1>{title}</h1>
    </div>
  );
};
ENDOFFILE
```

### CSS File
```bash
cat > styles/global.css << 'ENDOFFILE'
:root {
  --primary-color: #2563eb;
  --background-dark: #0f172a;
  --text-light: #f8fafc;
}

body {
  margin: 0;
  padding: 0;
  background: var(--background-dark);
  color: var(--text-light);
  font-family: system-ui, sans-serif;
}

.dashboard {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
ENDOFFILE
```

### JSON Config
```bash
cat > config/app.json << 'ENDOFFILE'
{
  "name": "my-app",
  "version": "1.0.0",
  "settings": {
    "theme": "dark",
    "debug": false
  }
}
ENDOFFILE
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Content appears with extra indentation | Start content on line immediately after heredoc command |
| Variable expansion in content | Use single quotes around delimiter: `'ENDOFFILE'` |
| Permission denied | Check directory exists and has write permissions |
| File empty | Ensure delimiter appears on its own line at end |

## Advantages Over write_file

- More reliable for complex file contents
- Preserves exact whitespace and formatting
- Avoids encoding issues
- Works consistently across file types
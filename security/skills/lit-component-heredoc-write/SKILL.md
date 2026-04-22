---
name: lit-component-heredoc-write
description: Use heredoc syntax via run_shell to write TypeScript files containing Lit Element template literals and complex CSS/HTML strings without escaping issues.
---

# Writing Lit Element Components with Template Literals

When creating Lit Elements components, the template and CSS strings contain backticks, `${...}` expressions, and HTML markup. These characters can cause issues with direct file writing tools due to template literal syntax conflicts.

## The Pattern

Use `run_shell` with heredoc syntax instead of direct file writing:

```bash
cat > src/components/my-component.ts << 'ENDOFFILE'
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('my-component')
export class MyComponent extends LitElement {
  static styles = css`
    :host { display: block; }
    .title { font-weight: bold; }
  `;

  @property({ type: String }) 
  title = 'Default';

  render() {
    return html`
      <div class="title">${this.title}</div>
    `;
  }
}
ENDOFFILE
```

## Key Syntax Requirements

1. **Quote the EOF marker** (`'ENDOFFILE'` or `"ENDOFFILE"`) — prevents shell variable expansion of `${...}` in the content
2. **Use single quotes** (`'ENDOFFILE'`) — most reliable for TypeScript/JavaScript content
3. **No trailing whitespace** after the closing EOF marker on its own line

## When to Use This Method

- TypeScript/JavaScript files with template literals (backticks)
- Lit Element components with `html` or `css` tagged template literals
- Files containing `${...}` expressions
- Multi-line CSS-in-JS patterns
- Any content with HTML tags that might be misinterpreted

## When Direct Writing May Suffice

- Simple TypeScript without template literals
- JSON configuration files
- Plain CSS files without template string interpolation
- Documentation files (`.md`)

## Quick Reference

| Content Type | Use Heredoc? |
|--------------|--------------|
| Lit Element components | ✅ Always |
| Template literal strings | ✅ Always |
| Simple TS interfaces | ❌ Optional |
| JSON configs | ❌ Not needed |
| CSS files (plain) | ❌ Not needed |

## Troubleshooting

- **"bad substitution" error**: Ensure EOF marker is quoted: `<< 'ENDOFFILE'`
- **Content truncated**: Check for accidental EOF marker within the content
- **Indentation lost**: Heredoc preserves exact whitespace; structure your code accordingly
---
name: lit-component-incremental-patch
description: Patch large Lit web component files (500+ lines) incrementally using Python regex targeting specific insertion points, avoiding sed fragility and write_file size limits.
---

# Lit Component Incremental Patch Skill

Use this skill when you need to modify a large Lit component file (typically 500+ lines) without rewriting the entire file. The technique uses targeted Python regex patches against known insertion points.

## When to Use

- Component file exceeds 1000 lines
- You need to add state, methods, lifecycle hooks, or CSS to an existing component
- Sed or string replacement proves fragile on TypeScript/JSX-like syntax
- You want to preserve existing code and formatting

## The 6-Step Patch Sequence

Patch the file in this order to maintain structural integrity:

| Step | Target | Regex Pattern | Insert Position |
|------|--------|---------------|-----------------|
| 1 | Import block | `^import \{` | After last import |
| 2 | State block | `@state\(\)` | After existing state declarations |
| 3 | Lifecycle methods | `connectedCallback\|disconnectedCallback` | Before first lifecycle method |
| 4 | Custom methods | `^\s{2}(?!static|async|$)[a-zA-Z]+\(` | After last custom method |
| 5 | Render method | `render\(\)` | Before first expression in render |
| 6 | CSS block | `static styles` | After closing backtick |

## Implementation Template

```python
import re
import os

def patch_lit_component(file_path, patches):
    """
    Args:
        file_path: Path to the .ts Lit component file
        patches: Dict with keys: imports, state, lifecycle, methods, render, css
    """
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Step 1: Add imports
    if patches.get('imports'):
        content = add_after_pattern(content, r'import \{[^}]+\} from', 
                                     patches['imports'], after_last=True)
    
    # Step 2: Add state decorators
    if patches.get('state'):
        content = add_after_pattern(content, r'@state\(\)', 
                                     patches['state'], after_last=True)
    
    # Step 3: Add lifecycle methods
    if patches.get('lifecycle'):
        # Find the class opening brace and insert after decorators
        content = add_after_pattern(content, r'^@property', 
                                     patches['lifecycle'], after_last=True)
    
    # Step 4: Add custom methods
    if patches.get('methods'):
        # Find last closing brace before render or styles
        content = add_before_pattern(content, r'render\(\)', 
                                     patches['methods'])
    
    # Step 5: Add to render method
    if patches.get('render'):
        content = add_in_render(content, patches['render'])
    
    # Step 6: Add CSS
    if patches.get('css'):
        content = add_to_styles(content, patches['css'])
    
    with open(file_path, 'w') as f:
        f.write(content)

def add_after_pattern(content, pattern, insertion, after_last=False):
    """Insert text after the last match of pattern."""
    matches = list(re.finditer(pattern, content, re.MULTILINE))
    if matches:
        pos = matches[-1].end()
        return content[:pos] + '\n' + insertion + content[pos:]
    return content

def add_before_pattern(content, pattern, insertion):
    """Insert text before the first match of pattern."""
    match = re.search(pattern, content)
    if match:
        pos = match.start()
        return content[:pos] + insertion + '\n' + content[pos:]
    return content

def add_in_render(content, insertion):
    """Insert inside render() method, before closing return."""
    render_match = re.search(r'return html`', content)
    if render_match:
        pos = render_match.start()
        return content[:pos] + insertion + '\n' + content[pos:]
    return content

def add_to_styles(content, css):
    """Append CSS to existing static styles."""
    styles_pattern = r'(static styles = html`)(.*?)(`;)'
    match = re.search(styles_pattern, content, re.DOTALL)
    if match:
        # Append before the closing backtick
        return content.replace(match.group(0), 
                               match.group(1) + match.group(2) + css + match.group(3))
    return content
```

## Practical Example

Given an existing Lit shell (`my-component.ts`):

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('my-component')
export class MyComponent extends LitElement {
  @property() title = 'Default';
  
  render() {
    return html`<div>${this.title}</div>`;
  }
  
  static styles = css`
    div { color: blue; }
  `;
}
```

Patch to add new state and method:

```python
patches = {
    'state': """@state() private _isLoading = false;""",
    'methods': """
  private _handleClick() {
    this._isLoading = true;
  }
""",
    'css': `
    button { background: green; }`
}

patch_lit_component('my-component.ts', patches)
```

Result:

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('my-component')
export class MyComponent extends LitElement {
  @property() title = 'Default';
  @state() private _isLoading = false;
  
  private _handleClick() {
    this._isLoading = true;
  }
  
  render() {
    return html`<div>${this.title}</div>`;
  }
  
  static styles = css`
    div { color: blue; }
    button { background: green; }
  `;
}
```

## Key Principles

1. **Always read the file first** to identify existing structure
2. **Use regex anchors** (`^`, `$`) to target specific line positions
3. **Patch in order**: imports first (prerequisites), then state, then methods, then render, then CSS
4. **Preserve existing content** — only insert, never replace wholesale
5. **Test regex patterns** against the actual file before applying
6. **Handle missing patterns gracefully** — use `after_last=True` only when the pattern definitely exists

## Anti-Patterns to Avoid

- ❌ Using sed for TypeScript with backticks and template literals
- ❌ Full file rewrite for changes affecting < 50 lines
- ❌ Assuming a specific line number (file may change between reads)
- ❌ Inserting CSS before verifying `static styles` exists
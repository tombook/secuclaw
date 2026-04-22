---
name: template-driven-component-generation
description: Use templates and code generation to batch create multiple similar LitElement web components consistently, avoiding empty file issues.
---

# Template-Driven Component Generation

## Problem

When building multiple LitElement web components with similar structure (shared features like dark mode, accessibility, shared styling patterns), creating them file-by-file often results in:

- Empty or incomplete component files
- Inconsistent implementations across components
- Missed features in some components but not others
- Wasted time on repetitive boilerplate code
- Task failures leaving directories empty

## Solution

Use a **template-driven approach** with a code generator script to create multiple components at once from a consistent template.

## Workflow

### Step 1: Define a Component Template

Create a reusable template file that establishes the baseline structure:

```javascript
// templates/component-template.js
import { LitElement, html, css } from 'lit';

export const componentTemplate = `import { LitElement, html, css } from 'lit';

export class {{className}} extends LitElement {
  static styles = css\`
    :host {
      display: block;
      /* Dark mode support via CSS custom properties */
      color: var(--text-color, #e0e0e0);
      background: var(--bg-color, #1e1e1e);
    }
    
    :host([disabled]) {
      opacity: 0.5;
      pointer-events: none;
    }
    
    /* Accessibility: focus styles */
    :host(:focus-visible) {
      outline: 2px solid var(--accent-color, #007acc);
      outline-offset: 2px;
    }
  \`;

  static properties = {
    disabled: { type: Boolean, reflect: true },
    // Add component-specific properties below
{{properties}}
  };

  constructor() {
    super();
    this.disabled = false;
    // Initialize component-specific state below
{{init}}
  }

  render() {
    return html\`
      <div part="container">
        <slot></slot>
      </div>
    \`;
  }
}

customElements.define('{{elementName}}', {{className}});
\`;
```

### Step 2: Create a Generator Script

Build a script to generate components from the template:

```javascript
// scripts/generate-components.mjs
import fs from 'fs-extra';
import path from 'path';

const componentTemplate = `import { LitElement, html, css } from 'lit';

export class {{className}} extends LitElement {
  static styles = css\`
    :host {
      display: block;
      color: var(--text-color, #e0e0e0);
      background: var(--bg-color, #1e1e1e);
    }
    :host([disabled]) {
      opacity: 0.5;
      pointer-events: none;
    }
  \`;

  static properties = {
    disabled: { type: Boolean, reflect: true },
{{properties}}  };

  constructor() {
    super();
    this.disabled = false;
{{init}}  }

  render() {
    return html\`
      <div part="container">
        <slot></slot>
      </div>
    \`;
  }
}

customElements.define('{{elementName}}', {{className}});
`;

/**
 * Component definitions - modify this array to add/remove components
 * Each entry: { name, properties: [], init: [] }
 */
const COMPONENTS = [
  { name: 'security-panel', properties: [], init: [] },
  { name: 'vulnerability-card', properties: ['severity: { type: String }'], init: [] },
  { name: 'threat-hunting-view', properties: [], init: [] },
  { name: 'compliance-monitor', properties: ['status: { type: String }'], init: [] },
];

function toClassName(name) {
  return name.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('') + 'Component';
}

function toElementName(name) {
  return name;
}

function generateComponent(component) {
  const className = toClassName(component.name);
  const elementName = toElementName(component.name);
  
  const propertiesBlock = component.properties.length > 0
    ? '    ' + component.properties.join('\n    ') + '\n'
    : '';
  
  const initBlock = component.init.length > 0
    ? '    ' + component.init.join('\n    ') + '\n'
    : '';

  return componentTemplate
    .replace(/\{\{className\}\}/g, className)
    .replace(/\{\{elementName\}\}/g, elementName)
    .replace('{{properties}}', propertiesBlock)
    .replace('{{init}}', initBlock);
}

async function main() {
  const outputDir = path.join(process.cwd(), 'src', 'components');
  await fs.ensureDir(outputDir);

  for (const component of COMPONENTS) {
    const code = generateComponent(component);
    const filename = `${component.name}.js`;
    const filepath = path.join(outputDir, filename);
    
    await fs.writeFile(filepath, code);
    console.log(`✓ Generated: ${filename}`);
  }

  console.log(`\nGenerated ${COMPONENTS.length} components in ${outputDir}`);
}

main().catch(console.error);
```

### Step 3: Run the Generator

Execute the generator to create all components at once:

```bash
# Add to package.json scripts:
# "generate:components": "node scripts/generate-components.mjs"

npm run generate:components
```

### Step 4: Verify Generation

After generation, verify the files are complete:

```bash
# Check all files exist and have content
ls -la src/components/*.js | awk '{print $5, $9}'

# Verify no empty files
find src/components -name "*.js" -empty
```

### Step 5: Customize After Generation

Once files are created, add component-specific logic to each file:

1. Add properties to `static properties`
2. Add initialization in `constructor()`
3. Add methods and event handlers
4. Update `render()` with component-specific markup
5. Add component-specific styles

## Key Principles

1. **Generate all components at once** - Never create components one-by-one
2. **Template first** - The template ensures consistent features (dark mode, accessibility)
3. **Declarative definitions** - Component definitions are data, not code
4. **Verify output** - Always check generated files are non-empty before continuing
5. **Customize after** - Add component-specific logic only after successful generation

## When to Use This Pattern

- Building multiple components with shared features
- Components that share styling patterns (dark mode, theming)
- UI library creation
- Dashboard or panel systems with consistent structure
- Any scenario requiring 3+ similar components
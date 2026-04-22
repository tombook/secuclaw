---
name: web-component-panel-integration
description: How to properly integrate newly created panel Web Components into a Lit-based system by updating both bootstrap and registry files.
---

# Web Component Panel Integration

When creating new Web Component panel files in a Lit-based project, the files must be registered in two places for the panels to be functional. This two-step integration is required and should be performed immediately after file creation.

## Integration Steps

After creating panel files, perform the following updates in sequence:

### Step 1: Update bootstrap.ts with imports

Add import statements to `bootstrap.ts`:

```typescript
// Add this line for each new panel component
import './path/to/your/new-panel.component';
```

### Step 2: Update tool-panel-registry.ts with definitions

Add panel definitions to `tool-panel-registry.ts`:

```typescript
// Add panel registration for each new component
export const myPanel = new PanelDefinition({
  id: 'my-panel',
  title: 'My Panel',
  component: 'my-panel-component',
  // additional config...
});
```

## Complete Workflow

When creating multiple panel files, use this complete workflow:

```bash
# 1. Create the panel component files
cat > src/panels/my-panel.component.ts << 'EOF'
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('my-panel-component')
export class MyPanelComponent extends LitElement {
  // component implementation
}
EOF

# 2. Update bootstrap.ts - append import to existing file
# 3. Update tool-panel-registry.ts - append panel definition
```

## Key Principle

**Never create panel files in isolation.** The file creation and the two registry updates must be treated as a single atomic workflow. Check the project structure to find:
- `bootstrap.ts` - typically in `src/` or project root
- `tool-panel-registry.ts` - typically in `src/registry/` or similar

## Verification

After integration, verify both files contain the new entries:
- Check that import appears in `bootstrap.ts`
- Check that panel definition appears in `tool-panel-registry.ts`

This ensures panels are properly registered and will function when the application runs.
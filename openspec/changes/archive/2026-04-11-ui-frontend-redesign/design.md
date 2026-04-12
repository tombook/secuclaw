## Context

The SecuClaw UI frontend (`ui/`) is built with Lit web components but lacks a cohesive design system. After implementing three backend systems (role-driven, role-permission, role-skill-execution), the UI needs redesign to properly integrate these capabilities.

**Current State:**
- UI components use inconsistent styling
- Role context exists but not properly integrated into all pages
- Permission checks are not enforced on frontend
- No unified design language

**Stakeholders:**
- Security professionals (8 different roles)
- DevOps/SRE teams using SOC operations
- CISO and management viewing strategic dashboards

## Goals / Non-Goals

**Goals:**
- Create unified design system with dark theme suitable for security operations
- Implement proper role-based routing and navigation
- Add permission-aware UI components (hide/disable based on user role)
- Build role-specific dashboard layouts
- Create skill execution UI with real-time progress

**Non-Goals:**
- Do NOT redesign backend APIs (already stable)
- Do NOT add new business logic (only UI integration)
- Do NOT migrate to different frontend framework
- Do NOT add authentication (handled externally)

## Decisions

### Decision 1: Design System Architecture

**Choice:** CSS custom properties + BEM-style class naming

**Rationale:** Lit components benefit from native CSS encapsulation. Using CSS custom properties for theming allows runtime theme switching. BEM naming prevents style conflicts between components.

**Alternatives:**
- Tailwind CSS: Too much build complexity for this project size
- CSS Modules: Not well supported in Lit's shadow DOM

### Decision 2: Component Structure

**Choice:** Feature-based folder structure under `ui/src/ui/components/`

```
ui/src/ui/
├── components/
│   ├── design-system/     # atoms, molecules (Button, Input, Card)
│   ├── role-aware/         # RoleSwitcher, RoleProfile, PermissionGuard
│   ├── dashboard/         # Dashboard cards, charts
│   └── skill-executor/     # SkillRunner, ExecutionHistory
├── pages/
│   ├── sc-dashboard.ts
│   ├── sc-skill-execution.ts
│   └── ...
└── store/
    └── role-context.ts
```

**Rationale:** Mirrors backend package structure, makes it easy to find related components.

### Decision 3: Role Switcher Design

**Choice:** Dropdown with visual role cards showing role icon, name, and key permission summary

**Rationale:** Security professionals often need to quickly switch contexts. Visual cards help identify the correct role at a glance.

### Decision 4: Permission Guard Implementation

**Choice:** `<sc-permission-guard>` web component with `permission` attribute

```html
<sc-permission-guard permission="vulnerabilities.write">
  <button slot="allowed">Create Ticket</button>
</sc-permission-guard>
```

**Rationale:** Declarative approach integrates naturally with Lit templates. Slot-based content keeps unauthorized actions completely out of DOM.

## Risks / Trade-offs

**[Risk]** Theme customization may not match all enterprise branding requirements
→ **Mitigation:** CSS custom properties are easily overridable via external stylesheet

**[Risk]** Too many role-specific views could lead to code duplication
→ **Mitigation:** Share common layouts via base classes, use composition over inheritance

**[Risk]** Frontend permission checks are for UX only (backend still required)
→ **Mitigation:** Document clearly that backend permission middleware is the source of truth

## Migration Plan

**Phase 1:** Design System Foundation (Week 1)
1. Create CSS custom properties for colors, typography, spacing
2. Build atomic components (Button, Card, Badge)
3. Set up Storybook-style documentation

**Phase 2:** Role Integration (Week 2)
1. Refactor RoleContext to expose permission service
2. Implement `<sc-permission-guard>` component
3. Add role switcher with visual cards

**Phase 3:** Page Refactoring (Week 3)
1. Refactor dashboard page with new design system
2. Add role-specific KPI configurations
3. Implement skill execution UI

**Rollback:** Git revert each phase independently. Design system changes are backward compatible if atomic components maintain API.

## Open Questions

1. Should we support multiple simultaneous roles (e.g., CISO who also does security-ops)?
2. What is the timeout behavior for skill execution UI?
3. Should we persist last 5 role switches for quick access?

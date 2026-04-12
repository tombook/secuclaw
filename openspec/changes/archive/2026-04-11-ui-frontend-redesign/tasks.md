# Implementation Tasks - UI Frontend Redesign

## 1. Design System Foundation

- [x] 1.1 Create CSS custom properties for colors (--color-primary, --color-secondary, --color-success, --color-warning, --color-error, --color-bg, --color-text)
- [x] 1.2 Create CSS custom properties for typography (--font-family, --font-size-sm, --font-size-base, --font-size-lg, --font-size-xl)
- [x] 1.3 Create CSS custom properties for spacing (4px, 8px, 16px, 24px, 32px, 48px)
- [x] 1.4 Implement `<sc-button>` component with variants (primary, secondary, danger, ghost) and sizes (sm, md, lg)
- [x] 1.5 Implement `<sc-card>` component with header, body, footer slots
- [x] 1.6 Implement `<sc-badge>` component with variants (success, warning, error, info)
- [x] 1.7 Apply dark theme styling to application root

## 2. Role Context Integration

- [x] 2.1 Update RoleContext to expose permission service
- [x] 2.2 Add `can(permission: string)` method to RoleContext
- [x] 2.3 Add `canRead(resource: string)` and `canWrite(resource: string)` convenience methods
- [x] 2.4 Update RoleContext to persist recent role switches (last 3)
- [x] 2.5 Create TypeScript types for role profile metadata

## 3. Role Switcher Component

- [x] 3.1 Create `<sc-role-switcher>` component with dropdown
- [x] 3.2 Display all 8 roles with icons (🔐🔒🏗️📊🎯👔⚙️🔗) and Chinese names
- [x] 3.3 Implement role profile card on hover
- [x] 3.4 Add keyboard navigation (Tab, Enter, Arrow keys, Escape)
- [x] 3.5 Add ARIA labels for screen reader support
- [x] 3.6 Show recent roles at top of dropdown
- [x] 3.7 Persist and highlight last 3 used roles

## 4. Permission Guard Component

- [x] 4.1 Create `<sc-permission-guard>` component
- [x] 4.2 Implement permission attribute parsing (single and comma-separated)
- [x] 4.3 Implement slot-based content rendering
- [x] 4.4 Add fallback slot for denied content
- [x] 4.5 Support `mode="disable"` for disabling instead of hiding
- [x] 4.6 Add tooltip explaining why element is disabled
- [x] 4.7 Integrate with RoleContext for reactive updates

## 5. Skill Executor UI

- [x] 5.1 Create `<sc-skill-executor>` main panel component
- [x] 5.2 Display available skills list from skill registry
- [x] 5.3 Implement skill selection and parameter form generation
- [x] 5.4 Add parameter validation (required vs optional)
- [x] 5.5 Implement execute button with loading state
- [x] 6.1 Create `<sc-skill-progress>` component with progress bar
- [x] 6.2 Connect to WebSocket for real-time progress events
- [x] 6.3 Display result on completion
- [x] 6.4 Display error message on failure
- [x] 6.5 Implement cancel button functionality

## 7. Execution History

- [x] 7.1 Create `<sc-execution-history>` component
- [x] 7.2 Connect to historyStore for persistence
- [x] 7.3 Display last 100 executions with skill name, status, timestamp
- [x] 7.4 Add filter by status (all, completed, failed, running)
- [x] 7.5 Implement cleanup of entries older than 30 days

## 8. Dashboard Integration

- [x] 8.1 Refactor dashboard to use new design system components
- [x] 8.2 Implement role-specific KPI cards per role-dashboard spec
- [x] 8.3 Add role-specific chart types (line, radar, heatmap)
- [x] 8.4 Implement reactive dashboard updates on role change
- [x] 8.5 Update alerts panel to filter by current role

## 9. Testing

- [x] 9.1 Write unit tests for RoleContext methods
- [x] 9.2 Write unit tests for PermissionGuard visibility logic
- [x] 9.3 Write unit tests for SkillExecutor parameter validation
- [x] 9.4 Test role switcher keyboard navigation
- [x] 9.5 Test permission guard reactive updates

## 10. Polish

- [x] 10.1 Add loading skeletons for async content
- [x] 10.2 Add transition animations for role switching
- [x] 10.3 Add empty states for no-data scenarios
- [x] 10.4 Add error boundaries for graceful failure handling
- [x] 10.5 Verify accessibility with keyboard-only navigation

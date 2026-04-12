# Implementation Tasks - Security Role-Centered UI Redesign

## 1. Quick Role Switcher Component

- [ ] 1.1 Create `sc-role-switcher.ts` component with dropdown panel UI
- [ ] 1.2 Implement role selection logic with `roleContext.update()`
- [ ] 1.3 Add keyboard navigation support (↑/↓/Enter/Escape)
- [ ] 1.4 Style role cards with emoji, name, description, current badge
- [ ] 1.5 Persist role selection to sessionStorage
- [ ] 1.6 Integrate role switcher into header layout (`sc-layout.ts`)

## 2. Role-Centric Navigation Menu

- [ ] 2.1 Create `role-centric-menu-config.ts` with new menu structure by expertise domains
- [ ] 2.2 Implement `RoleCentricNav` component rendering domain groups
- [ ] 2.3 Add permission-based visibility using `hasPermissionWithInheritance()`
- [ ] 2.4 Create legacy menu mode toggle in settings
- [ ] 2.5 Persist menu mode preference to localStorage
- [ ] 2.6 Update `sc-layout.ts` to use new navigation component

## 3. Role-Adaptive Dashboard

- [ ] 3.1 Create `ROLE_DASHBOARD_CONFIG` mapping each role to primary KPIs
- [ ] 3.2 Update `sc-dashboard.ts` to read role context
- [ ] 3.3 Implement dynamic KPI rendering based on role config
- [ ] 3.4 Add/remove dashboard sections based on role expertise
- [ ] 3.5 Subscribe to roleContext changes for automatic refresh
- [ ] 3.6 Style role-adaptive sections with role theme colors

## 4. Role Expertise Showcase Page

- [ ] 4.1 Create `ExpertiseRadarChart` component using SVG for 6-dimension radar
- [ ] 4.2 Implement `RoleExpertiseCard` component for role summary display
- [ ] 4.3 Create `CoverageTags` component for MITRE/SCF tags
- [ ] 4.4 Build `/expertise` page with role grid and expandable details
- [ ] 4.5 Integrate skill data from `DEFAULT_SKILLS`, `DEFAULT_MITRE`, `DEFAULT_SCF`
- [ ] 4.6 Add route for `/expertise` in `sc-app.ts`

## 5. Role Perspective View

- [ ] 5.1 Create `RolePerspectiveTabs` component for multi-role view
- [ ] 5.2 Implement data highlighting based on role relevance
- [ ] 5.3 Add role-filtered sorting to vulnerability/incident lists
- [ ] 5.4 Create perspective comparison mode with side-by-side view
- [ ] 5.5 Integrate with existing threat/incident detail pages

## 6. Design System Updates

- [ ] 6.1 Define CSS custom properties for 8 role color themes
- [ ] 6.2 Update role emoji mapping in i18n files
- [ ] 6.3 Add role-specific iconography and visual language
- [ ] 6.4 Create role theme context for component styling

## 7. Integration & Testing

- [ ] 7.1 Integrate role switcher with existing authentication flow
- [ ] 7.2 Add role permission guards to new routes
- [ ] 7.3 Test role switching with all 8 roles
- [ ] 7.4 Verify dashboard adapts correctly per role
- [ ] 7.5 Test legacy menu mode toggle
- [ ] 7.6 Verify mobile responsive behavior

## 8. Polish & Documentation

- [ ] 8.1 Add tooltip help text for role switching
- [ ] 8.2 Create onboarding flow explaining role concept
- [ ] 8.3 Update i18n translations for new UI elements
- [ ] 8.4 Document role-based behavior for future developers

## 1. RoleContext Store

- [x] 1.1 Create `role-context.ts` store with BaseStore
- [x] 1.2 Implement `currentRole` state management
- [x] 1.3 Implement `roleProfile` derived state
- [x] 1.4 Add localStorage persistence
- [x] 1.5 Implement `setRole()` method with notification
- [x] 1.6 Implement `getRoleProfile()` method

## 2. Role Dashboard Configuration

- [x] 2.1 Create `ROLE_DASHBOARD_CONFIG` mapping
- [x] 2.2 Define KPI cards for each of 8 roles
- [x] 2.3 Define chart types for each role
- [x] 2.4 Define alert filters for each role

## 3. Dashboard Integration

- [x] 3.1 Update sc-dashboard.ts to consume RoleContext
- [x] 3.2 Implement role-specific KPI card rendering
- [x] 3.3 Implement role-specific chart selection
- [x] 3.4 Implement role-specific alert filtering

## 4. Data Filter Service

- [x] 4.1 Create `role-filter-service.ts`
- [x] 4.2 Implement capability-based filtering
- [x] 4.3 Implement MITRE-based filtering
- [x] 4.4 Implement SCF-based filtering
- [x] 4.5 Implement filter state per role

## 5. Navigation Integration

- [x] 5.1 Update sc-sidebar.ts to show role-specific menu items
- [x] 5.2 Add role quick-switcher in header
- [x] 5.3 Persist navigation state per role

## 6. Verification

- [x] 6.1 Verify role context persists on reload
- [x] 6.2 Verify dashboard updates on role change
- [x] 6.3 Verify data filtering per role
- [x] 6.4 Verify all 8 roles work correctly
## 1. Permission Configuration

- [x] 1.1 Create `packages/core/src/roles/permissions.ts`
- [x] 1.2 Define RolePermission interface
- [x] 1.3 Define permissions for all 8 roles based on capabilities
- [x] 1.4 Implement permission inheritance logic

## 2. Backend Permission Service

- [x] 2.1 Create `packages/core/src/roles/permission-service.ts`
- [x] 2.2 Implement `can(role, action)` method
- [x] 2.3 Implement `canRead(role, resource)` method
- [x] 2.4 Implement `getAllowedFields(role, resource)` method
- [x] 2.5 Implement `filterData(data, role)` method

## 3. Backend Permission Middleware

- [x] 3.1 Create `packages/core/src/middleware/permission-middleware.ts`
- [x] 3.2 Extract role from JWT
- [x] 3.3 Validate permissions for protected routes
- [x] 3.4 Return 403 for unauthorized access

## 4. Service Layer Integration

- [x] 4.1 Update VulnerabilitiesService to filter by permissions
- [x] 4.2 Update IncidentsService to filter by permissions
- [x] 4.3 Update ComplianceService to filter by permissions
- [x] 4.4 Add field-level filtering

## 5. Frontend Permission Service

- [x] 5.1 Create `ui/src/ui/services/permission-service.ts`
- [x] 5.2 Implement client-side permission checks
- [x] 5.3 Sync permissions from backend on login

## 6. Frontend Permission Guard Component

- [x] 6.1 Create `ui/src/ui/components/sc-permission-guard.ts`
- [x] 6.2 Implement `requires` attribute
- [x] 6.3 Implement `requires-any` attribute
- [x] 6.4 Implement `requires-all` attribute
- [x] 6.5 Integrate with role-context

## 7. Integration with Existing Components

- [x] 7.1 Add guards to vulnerability scan button
- [x] 7.2 Add guards to incident response button
- [x] 7.3 Add guards to compliance audit button
- [x] 7.4 Add guards to admin-only components

## 8. Verification

- [x] 8.1 Test unauthorized API access returns 403
- [x] 8.2 Test frontend components hidden for unauthorized roles
- [x] 8.3 Test field-level data filtering
- [x] 8.4 Verify all 8 roles have correct permissions
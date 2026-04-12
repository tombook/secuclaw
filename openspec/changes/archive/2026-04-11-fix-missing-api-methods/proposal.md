## Why

The SecuClaw UI is experiencing multiple "Unknown method" errors and silent failures because several gateway API methods are either:
1. Called by the UI but not registered in the backend
2. Routed to handlers that depend on uninitialized services (assetsService, incidentsService, vulnerabilitiesService)

This breaks business闭环 for vulnerabilities management, risk management, and asset management features.

## What Changes

1. **Register missing API methods**: Add `vulnerabilities.assign`, `vulnerabilities.batchUpdateStatus`, and `risk.list` methods to their respective route handlers
2. **Initialize missing services**: Ensure `assetsService` is properly instantiated and injected into RouterDeps so asset routes work correctly
3. **Remove conflicting route handlers**: The old incidents-routes.ts and vulnerabilities-routes.ts files that depend on uninitialized services should not be registered (already removed from main.ts registration)

## Capabilities

### New Capabilities
None - this is a bug fix / missing implementation

### Modified Capabilities
None - existing capabilities remain unchanged

## Impact

**Affected Backend Routes:**
- `vulnerabilities-crud-routes.ts` - needs new methods added
- `risk-routes.ts` - needs risk.list method added
- `main.ts` - needs assetsService initialization

**Affected Frontend Pages:**
- sc-vulnerabilities-page.ts (calls `vulnerabilities.assign`, `vulnerabilities.batchUpdateStatus`)
- sc-risk-page.ts (calls `risk.list`)
- sc-secops-center.ts (calls `risk.list`)
- sc-settings-page.ts (calls `assets.list`, `assets.create`, etc.)

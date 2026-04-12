## Context

The SecuClaw backend has 173 registered gateway methods, but the UI calls methods that either:
1. Don't exist (vulnerabilities.assign, vulnerabilities.batchUpdateStatus, risk.list)
2. Depend on services that aren't initialized (assetsService)

The current CRUD routes (incidents-crud-routes.ts, vulnerabilities-crud-routes.ts) use a local getStore() approach that works, but some UI features require methods that weren't added.

## Goals / Non-Goals

**Goals:**
- Register missing API methods to enable full UI functionality
- Initialize assetsService so asset routes work correctly
- Maintain consistency with existing route patterns

**Non-Goals:**
- Not implementing new business logic - only adding missing method registrations
- Not changing existing working routes
- Not modifying frontend code

## Decisions

### 1. Add missing vulnerability methods to vulnerabilities-crud-routes.ts

**Decision**: Add `vulnerabilities.assign` and `vulnerabilities.batchUpdateStatus` to the existing vulnerabilities-crud-routes.ts file.

**Rationale**: This follows the existing pattern where CRUD routes use local getStore() helpers. Adding to the same file maintains consistency.

### 2. Add missing risk.list method to risk-routes.ts

**Decision**: Add a `risk.list` method that returns risk factors as a list.

**Rationale**: UI expects `risk.list` but only `risk.listFactors` exists. Adding an alias makes the API more intuitive.

### 3. Initialize assetsService in main.ts

**Decision**: Instantiate AssetsService with the jsonStore and set it in RouterDeps.

**Rationale**: The assets-routes.ts uses `deps.assetsService!` which is undefined. Need to initialize it like we did for capabilitiesService and channelManager.

## Risks / Trade-offs

- **Risk**: Adding methods that don't fully implement the expected behavior
  - **Mitigation**: Ensure methods return appropriate data structures matching UI expectations

- **Risk**: Service initialization order issues
  - **Mitigation**: Follow the same pattern used for other services in main.ts

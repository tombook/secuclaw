## 1. Add Missing Vulnerability Methods

- [x] 1.1 Add `vulnerabilities.assign` method to vulnerabilities-crud-routes.ts
- [x] 1.2 Add `vulnerabilities.batchUpdateStatus` method to vulnerabilities-crud-routes.ts

## 2. Add Missing Risk Method

- [x] 2.1 Add `risk.list` method as alias to `risk.listFactors` in risk-routes.ts

## 3. Initialize Assets Service

- [x] 3.1 Import AssetsService in main.ts
- [x] 3.2 Create AssetsService instance with jsonStore
- [x] 3.3 Set assetsService in RouterDeps

## 4. Verification

- [x] 4.1 Rebuild backend
- [x] 4.2 Restart backend server
- [x] 4.3 Test all missing methods via WebSocket client
- [x] 4.4 Verify UI loads without "Unknown method" errors

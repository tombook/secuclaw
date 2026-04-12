# Bug Fix - No New Specifications

This change is a bug fix to register missing API methods. No new capabilities or specification changes are being introduced.

The following methods need to be added:
- `vulnerabilities.assign`
- `vulnerabilities.batchUpdateStatus`
- `risk.list`

And the following service needs to be initialized:
- `assetsService` in RouterDeps

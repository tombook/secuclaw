## 1. DI Container Setup

- [x] 1.1 Install typedi and reflect-metadata dependencies
- [x] 1.2 Add @Service() decorator to EventBus class
- [x] 1.3 Add @Service() decorator to Repository classes (audit, capabilities, roles)
- [x] 1.4 Add @Service() decorator to Service classes (ai, assets, audit, capabilities, commander, compliance, incidents, kpi, roles, tasks, threats, vulnerabilities)
- [x] 1.5 Add @Service() decorator to GatewayServer and Router
- [x] 1.6 Create DI container template at packages/core/src/di/container.ts
- [x] 1.7 Integrate DI container in SecuClawApplication

## 2. Gateway Routing Split

- [x] 2.1 Create gateway/types.ts with Handler and HandlerResponse types
- [x] 2.2 Create gateway/groups/route-group.ts with RouteGroup base class
- [x] 2.3 Create gateway/groups/auth-route-group.ts as example implementation
- [x] 2.4 Create gateway/services/service-factory.ts for type-safe service access
- [x] 2.5 Simplify Router to use registerHandler() method
- [x] 2.6 Add backward compatibility methods (setCapabilitiesService, setChannelManager)

## 3. Event System Refactoring

- [x] 3.1 Add @Service() decorator to EventBus
- [x] 3.2 Create gateway/events/rule.ts with EventRule abstract class and EventMiddleware
- [x] 3.3 Create gateway/events/event-system.ts with EventSystem service
- [x] 3.4 Create 5 EventRule subclasses (CriticalIncident, CriticalVulnerability, ComplianceViolation, ApprovalExpired, AnomalyDetected)
- [x] 3.5 Migrate default-rules.ts to use EventRule pattern
- [x] 3.6 Integrate EventSystem into main.ts

## 4. Configuration Externalization

- [x] 4.1 Add @Service() decorator to ConfigService
- [x] 4.2 Add GatewayConfig and ApiConfig interfaces to ConfigService
- [x] 4.3 Add databasePath and skillsPath to StorageConfig
- [x] 4.4 Update main.ts to use ConfigService instead of inline config

## 5. Performance Optimizations

- [x] 5.1 Add 30-second KPI metrics cache to KpiService
- [x] 5.2 Parallelize MITRE loader (enterprise/mobile/ics-attack.json)
- [x] 5.3 Parallelize SCF loader (domains and controls)
- [x] 5.4 Remove redundant dynamic imports in JsonStore

## 6. API and WebSocket Optimizations

- [x] 6.1 Add compression middleware to ApiServer (gzip/deflate, 1kb threshold)
- [x] 6.2 Add WebSocket message batching (16ms micro-batch window)
- [x] 6.3 Add scheduleFlush and flushClient methods
- [x] 6.4 Handle client disconnect to flush pending messages

## 7. Verification

- [x] 7.1 Build succeeds (bun run build)
- [x] 7.2 Application starts successfully
- [x] 7.3 All commits created on refactor/di-container branch

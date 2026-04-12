## ADDED Requirements

### Requirement: Service classes SHALL be decorated with @Service()

All Service and Repository classes MUST be decorated with typedi's `@Service()` decorator to enable dependency injection. The decorator MUST be applied at class level before the class declaration.

#### Scenario: Service with constructor dependencies
- **WHEN** a Service class declares constructor parameters with types
- **THEN** typedi SHALL automatically resolve and inject dependencies when the service is requested from the container

#### Scenario: Repository instantiated by Service
- **WHEN** a Service constructor requires a Repository instance
- **THEN** the Repository SHALL be instantiated with required dependencies before being passed to the Service

### Requirement: JsonStore SHALL be registered as a singleton

The JsonStore class MUST be registered in the DI container as a singleton, ensuring all services share the same storage instance.

#### Scenario: Multiple services access JsonStore
- **WHEN** two or more services request JsonStore from the container
- **THEN** all services SHALL receive the same JsonStore instance

### Requirement: DI container SHALL resolve services in dependency order

The container SHALL topologically sort services by their dependencies and initialize them in the correct order to avoid initialization errors.

#### Scenario: Service depends on another Service
- **WHEN** Service A depends on Service B
- **THEN** Service B SHALL be initialized before Service A

### Requirement: @Service() decorated classes SHALL export from barrel files

All @Service() decorated classes MUST be exported from their module's index.ts barrel file to enable proper container registration.

#### Scenario: Importing decorated service
- **WHEN** another module imports a decorated Service
- **THEN** the import SHALL succeed and the Service SHALL be available in the container

## ADDED Requirements

### Requirement: EventBus SHALL support publish/subscribe pattern

The EventBus class SHALL provide `on()`, `off()`, `once()`, and `emit()` methods for event handling. All event handlers SHALL receive the event payload asynchronously.

#### Scenario: Subscribe to event
- **WHEN** a component calls `eventBus.on('event.name', handler)`
- **THEN** the handler SHALL be called when `emit('event.name', payload)` is invoked

#### Scenario: Unsubscribe from event
- **WHEN** a component calls the unsubscribe function returned by `on()`
- **THEN** the handler SHALL no longer be called on subsequent emits

### Requirement: EventSystem SHALL bridge EventBus and EventRules

The EventSystem class SHALL subscribe to EventBus events and route them to registered EventRule instances. Each rule SHALL only execute for its specified events.

#### Scenario: Rule executes for matching event
- **WHEN** EventSystem has a rule registered for 'incident.created'
- **AND** EventBus emits 'incident.created'
- **THEN** the rule's `execute()` method SHALL be called with the event payload

#### Scenario: Rule skips non-matching events
- **WHEN** EventSystem has a rule registered for 'incident.created'
- **AND** EventBus emits 'vulnerability.critical'
- **THEN** the rule SHALL NOT execute

### Requirement: EventRule classes SHALL be decorated with @Service()

All EventRule implementations MUST be decorated with `@Service()` to enable automatic registration in EventSystem.

#### Scenario: Rule auto-registration
- **WHEN** an EventRule subclass is decorated with `@Service()`
- **THEN** the rule SHALL be instantiated by typedi and registered in EventSystem

### Requirement: EventSystem SHALL support middleware chain

The middleware chain SHALL execute in priority order (higher priority first) before passing control to EventRules.

#### Scenario: Middleware processes before rules
- **WHEN** middleware A (priority 100) and rule B are both registered
- **AND** EventBus emits an event
- **THEN** middleware A SHALL process the event before rule B executes

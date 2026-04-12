## ADDED Requirements

### Requirement: WebSocket messages SHALL be batched with 16ms window

The GatewayServer SHALL collect outgoing messages in a per-client buffer and flush them every 16 milliseconds to reduce network overhead.

#### Scenario: Multiple messages batched
- **WHEN** server sends message A at t=0, message B at t=5ms, message C at t=10ms
- **THEN** all three messages SHALL be sent together at t=16ms

#### Scenario: Single message flushed immediately after window
- **WHEN** server sends message A at t=0
- **THEN** message A SHALL be sent at t=16ms if no other messages arrive

### Requirement: Client disconnect SHALL flush pending messages

When a WebSocket client disconnects, the server SHALL immediately flush any pending messages in that client's buffer.

#### Scenario: Pending messages on disconnect
- **WHEN** a client has 3 pending messages in buffer
- **AND** the client disconnects
- **THEN** all 3 pending messages SHALL be sent before the connection is closed

### Requirement: Batched messages SHALL use batch protocol format

Batched messages SHALL be sent as a JSON object with `type: 'batch'` and `messages: []` array instead of individual message objects.

#### Scenario: Batch format structure
- **WHEN** server batches messages A and B
- **THEN** the payload SHALL be `{ "type": "batch", "messages": [messageA, messageB] }`

### Requirement: Individual messages SHALL still be valid

Non-batched messages (if any) SHALL maintain the original format for backward compatibility.

#### Scenario: Single event message format
- **WHEN** server sends a single event message
- **THEN** the format SHALL be `{ "type": "event", "event": "...", "data": ... }`

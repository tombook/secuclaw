# WebSocket Message Batch Handling

## ADDED Requirements

### Requirement: Gateway client SHALL parse batch messages from server

The gateway client SHALL handle messages with structure `{ type: 'batch', messages: [...] }` by iterating through the messages array and processing each message individually.

#### Scenario: Server sends single response message
- **WHEN** server sends `{ type: 'res', seq: 1, result: {...} }`
- **THEN** client processes message as normal response with matching seq

#### Scenario: Server sends batched messages
- **WHEN** server sends `{ type: 'batch', messages: [{ type: 'res', seq: 1, ... }, { type: 'res', seq: 2, ... }] }`
- **THEN** client processes each message in the messages array independently

#### Scenario: Server sends event in batch
- **WHEN** server sends `{ type: 'batch', messages: [{ type: 'event', event: 'update', data: {...} }] }`
- **THEN** client triggers event handlers for 'update' with provided data

### Requirement: Gateway client SHALL use relative path for WebSocket connection

The gateway client SHALL use `/ws` as the default WebSocket URL, enabling proper routing through Vite's development server proxy.

#### Scenario: Client connects with default URL
- **WHEN** gateway client is instantiated without explicit URL
- **THEN** it connects to `/ws` (relative path)

#### Scenario: Client connects with explicit URL
- **WHEN** gateway client is instantiated with explicit URL
- **THEN** it uses the provided URL

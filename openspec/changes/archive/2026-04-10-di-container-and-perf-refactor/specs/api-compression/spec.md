## ADDED Requirements

### Requirement: API responses SHALL be compressed using gzip or deflate

The compression middleware SHALL compress responses larger than 1KB using gzip or deflate based on the client's Accept-Encoding header.

#### Scenario: Large response compressed
- **WHEN** a client sends a request with `Accept-Encoding: gzip, deflate`
- **AND** the response body is larger than 1024 bytes
- **THEN** the response SHALL be compressed

#### Scenario: Small response not compressed
- **WHEN** a client sends a request with `Accept-Encoding: gzip, deflate`
- **AND** the response body is smaller than 1024 bytes
- **THEN** the response SHALL NOT be compressed

### Requirement: Compression SHALL be transparent to application code

The compression middleware SHALL automatically handle content encoding without requiring changes to route handlers.

#### Scenario: JSON response compressed
- **WHEN** a route handler returns `res.json({ data: [...] })` with large payload
- **THEN** the compression middleware SHALL compress the output stream

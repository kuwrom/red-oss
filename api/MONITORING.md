# Monitoring and Observability

This document describes the monitoring capabilities implemented in the redxmoro API.

## OpenTelemetry Metrics

The API exports Prometheus metrics on port 8001 by default (configurable via `PROMETHEUS_PORT`).

### HTTP Metrics
- `http_requests_total`: Total number of HTTP requests
- `http_request_duration_seconds`: HTTP request duration histogram
- `http_requests_active`: Number of currently active HTTP requests

### WebSocket Metrics
- `websocket_connections_active`: Number of active WebSocket connections (gauge)
- `websocket_messages_sent_total`: Total number of WebSocket messages sent (counter)
- `websocket_send_failures_total`: Total number of WebSocket send failures (counter)

### Custom Application Metrics
- `experiment_events_total{event}`: Total number of experiment events by type
- `experiment_duration_seconds`: Experiment duration histogram
- `pii_redactions_total`: Total number of PII redactions performed

## Structured Logging

All logs are output in structured JSON format with the following fields:

```json
{
  "timestamp": "2025-01-01T12:00:00.000Z",
  "level": "INFO",
  "logger": "api.services.experiment_service",
  "message": "Starting experiment abc-123",
  "correlation_id": "def-456",
  "experiment_id": "abc-123"
}
```

### Log Events

#### HTTP Requests
- `event`: "http_request" or "http_response"
- `correlation_id`: Unique request identifier
- `method`: HTTP method
- `path`: Request path
- `status_code`: Response status (responses only)
- `duration_ms`: Request duration (responses only)

#### WebSocket Events
- `event`: "websocket_connection" or "websocket_message"
- `connection_count`: Number of active connections
- `message_type`: Type of WebSocket message

#### Experiment Events
- `event`: "experiment_started", "experiment_progress", etc.
- `experiment_id`: Unique experiment identifier
- `correlation_id`: Request correlation ID

## WebSocket Message Schema

All WebSocket messages follow this envelope format:

```json
{
  "type": "message_type",
  "schemaVersion": "1.0",
  "timestamp": "ISO-8601-timestamp",
  "experimentId": "experiment-uuid",
  "correlationId": "correlation-uuid",
  "...": "message-specific fields"
}
```

### Message Types

#### experiment_started
```json
{
  "type": "experiment_started",
  "experiment": { /* experiment object */ },
  "metrics": { /* initial metrics */ }
}
```

#### experiment_progress
```json
{
  "type": "experiment_progress",
  "event": { /* event data */ },
  "metrics": {
    "total": 20,
    "completed": 5,
    "successful": 2,
    "failed": 3,
    "successRate": 40.0,  // Already in percentage (0-100)
    "currentStrategy": "novelty_search",
    "currentSeed": "truncated seed...",
    "elapsedTime": 123
  }
}
```

#### heartbeat
```json
{
  "type": "heartbeat",
  "status": "alive"
}
```

## PII Redaction

The system automatically redacts personally identifiable information from:
- Log messages
- WebSocket event data
- API responses

Redacted patterns include:
- Email addresses → `[EMAIL_REDACTED]`
- Credit card numbers → `[CARD_REDACTED]`
- Phone numbers → `[PHONE_REDACTED]`
- API keys/tokens → `[TOKEN_REDACTED]`
- IP addresses → `[IP_REDACTED]`
- URLs → `[URL_REDACTED]`

PII redaction can be disabled by setting `PII_REDACTION_ENABLED=false`.

## Correlation Tracking

Every HTTP request gets a unique correlation ID that is:
- Returned in the `X-Correlation-ID` response header
- Included in all related log entries
- Propagated to WebSocket messages for that experiment
- Used to trace requests across the system

## Health Endpoints

- `GET /api/status`: Basic server status and connection count
- `GET /api/health`: Detailed health check including dependencies
- `GET /metrics`: Prometheus metrics (port 8001 by default)

## Alerting Recommendations

Set up alerts for:
- High WebSocket send failure rate
- Experiment error rate spikes
- Memory/CPU usage during long experiments
- No experiment events for >30s while status is "running"
- PII redaction failures

## Dashboards

Example Grafana queries:

```promql
# WebSocket connection count
websocket_connections_active

# HTTP request rate
rate(http_requests_total[5m])

# Experiment success rate
rate(experiment_events_total{event="result"}[5m]) / rate(experiment_events_total{event="seed_start"}[5m])

# Error rate
rate(http_requests_total{status_code=~"5.."}[5m])
```

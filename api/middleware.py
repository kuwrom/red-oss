"""
Custom middleware for logging, correlation tracking, and observability.
"""

import json
import time
import uuid
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse
from opentelemetry import metrics

logger = logging.getLogger(__name__)

# Metrics
meter = metrics.get_meter(__name__)
http_requests_counter = meter.create_counter(
    "http_requests_middleware_total",
    description="HTTP requests processed by middleware"
)
pii_redactions_middleware_counter = meter.create_counter(
    "pii_redactions_middleware_total",
    description="PII redactions in middleware"
)


def redact_sensitive_data(data: dict) -> dict:
    """Redact sensitive information from request/response data."""
    if not isinstance(data, dict):
        return data
    
    redacted = data.copy()
    sensitive_keys = {
        'apiKeys', 'api_keys', 'password', 'secret', 'token', 'authorization',
        'aws_access_key_id', 'aws_secret_access_key', 'google_api_key',
        'vortex_api_key'
    }
    
    for key in redacted:
        if any(sensitive in key.lower() for sensitive in sensitive_keys):
            redacted[key] = "[REDACTED]"
            pii_redactions_middleware_counter.add(1, {"field": key})
        elif isinstance(redacted[key], dict):
            redacted[key] = redact_sensitive_data(redacted[key])
    
    return redacted


class ObservabilityMiddleware(BaseHTTPMiddleware):
    """Middleware for correlation tracking, structured logging, and metrics."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate correlation ID
        correlation_id = str(uuid.uuid4())
        request.state.correlation_id = correlation_id
        
        # Start timing
        start_time = time.time()
        
        # Log request
        try:
            # Read request body if present (for POST/PUT)
            body = None
            if request.method in ("POST", "PUT", "PATCH"):
                body = await request.body()
                # Parse JSON body for logging (redacted)
                try:
                    if body:
                        request_json = json.loads(body.decode())
                        request_json = redact_sensitive_data(request_json)
                    else:
                        request_json = None
                except (json.JSONDecodeError, UnicodeDecodeError):
                    request_json = {"_raw_body_size": len(body) if body else 0}
            else:
                request_json = None
            
            # Log structured request
            request_log = {
                "event": "http_request",
                "correlation_id": correlation_id,
                "method": request.method,
                "path": str(request.url.path),
                "query_params": dict(request.query_params),
                "headers": dict(request.headers),
                "client_ip": getattr(request.client, 'host', None) if request.client else None,
                "body": request_json,
                "timestamp": time.time()
            }
            
            # Redact headers
            request_log["headers"] = redact_sensitive_data(request_log["headers"])
            
            logger.info("HTTP Request", extra=request_log)
            http_requests_counter.add(1, {"method": request.method, "path": request.url.path})
            
        except Exception as e:
            logger.error(f"Error logging request: {e}")
        
        # Process request
        try:
            response = await call_next(request)
        except Exception as e:
            # Log error and re-raise
            duration_ms = (time.time() - start_time) * 1000
            error_log = {
                "event": "http_error", 
                "correlation_id": correlation_id,
                "method": request.method,
                "path": str(request.url.path),
                "error": str(e),
                "duration_ms": duration_ms,
                "timestamp": time.time()
            }
            logger.error("HTTP Error", extra=error_log)
            raise
        
        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000
        
        # Add correlation ID to response headers
        response.headers["X-Correlation-ID"] = correlation_id
        
        # Log response
        try:
            # For streaming responses, we can't easily read the body
            response_body = None
            if not isinstance(response, StreamingResponse):
                # Try to get response body for logging (if it's JSON)
                try:
                    if hasattr(response, 'body') and response.body:
                        response_text = response.body.decode()
                        response_body = json.loads(response_text)
                        response_body = redact_sensitive_data(response_body)
                except (json.JSONDecodeError, UnicodeDecodeError, AttributeError):
                    response_body = {"_response_has_body": True}
            
            response_log = {
                "event": "http_response",
                "correlation_id": correlation_id,
                "method": request.method,
                "path": str(request.url.path),
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "body": response_body,
                "duration_ms": duration_ms,
                "timestamp": time.time()
            }
            
            # Redact response headers
            response_log["headers"] = redact_sensitive_data(response_log["headers"])
            
            logger.info("HTTP Response", extra=response_log)
            
        except Exception as e:
            logger.error(f"Error logging response: {e}")
        
        return response


def setup_structured_logging():
    """Configure structured JSON logging."""
    
    class StructuredFormatter(logging.Formatter):
        """JSON formatter for structured logs."""
        
        def format(self, record):
            log_entry = {
                "timestamp": self.formatTime(record),
                "level": record.levelname,
                "logger": record.name,
                "message": record.getMessage(),
            }
            
            # Add extra fields if present
            if hasattr(record, '__dict__'):
                for key, value in record.__dict__.items():
                    if key not in ['name', 'msg', 'args', 'levelname', 'levelno', 
                                 'pathname', 'filename', 'module', 'lineno', 'funcName', 
                                 'created', 'msecs', 'relativeCreated', 'thread', 
                                 'threadName', 'processName', 'process', 'getMessage',
                                 'exc_info', 'exc_text', 'stack_info']:
                        log_entry[key] = value
            
            return json.dumps(log_entry)
    
    # Get root logger
    root_logger = logging.getLogger()
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Add structured handler
    handler = logging.StreamHandler()
    handler.setFormatter(StructuredFormatter())
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)
    
    logger.info("Structured logging configured")

"""
OpenTelemetry configuration for redxmoro API.
"""

import os
import logging
from typing import Optional

from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from opentelemetry.sdk.resources import Resource
from prometheus_client import start_http_server

logger = logging.getLogger(__name__)


def setup_telemetry(app, service_name: str = "redxmoro-api", service_version: str = "1.0.0") -> None:
    """Setup OpenTelemetry instrumentation for the FastAPI app."""
    
    # Resource identification
    resource = Resource.create({
        "service.name": service_name,
        "service.version": service_version,
        "service.instance.id": os.environ.get("HOSTNAME", "unknown"),
    })
    
    # Setup tracing
    trace_provider = TracerProvider(resource=resource)
    trace.set_tracer_provider(trace_provider)
    
    # Setup metrics with Prometheus exporter
    prometheus_reader = PrometheusMetricReader()
    metrics_provider = MeterProvider(
        resource=resource,
        metric_readers=[prometheus_reader]
    )
    metrics.set_meter_provider(metrics_provider)
    
    # Start Prometheus metrics server
    prometheus_port = int(os.environ.get("PROMETHEUS_PORT", "8001"))
    try:
        start_http_server(prometheus_port)
        logger.info(f"Prometheus metrics server started on port {prometheus_port}")
    except Exception as e:
        logger.warning(f"Failed to start Prometheus server on port {prometheus_port}: {e}")
    
    # Instrument FastAPI
    FastAPIInstrumentor.instrument_app(app)
    
    logger.info(f"OpenTelemetry configured for {service_name} v{service_version}")


def get_tracer(name: str) -> trace.Tracer:
    """Get a tracer instance."""
    return trace.get_tracer(name)


def get_meter(name: str) -> metrics.Meter:
    """Get a meter instance for custom metrics."""
    return metrics.get_meter(name)

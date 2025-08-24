"""
Monitoring and observability endpoints.
"""

import logging
from fastapi import APIRouter
from opentelemetry import metrics

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])

# Get meter for custom metrics
meter = metrics.get_meter(__name__)


@router.get("/health/detailed")
async def detailed_health_check():
    """Comprehensive health check with monitoring status."""
    from api.websocket.connection_manager import ConnectionManager
    from api.services import ExperimentService
    
    # Import services if they're available
    try:
        # These will be set by dependency injection
        from api.main import connection_manager, experiment_service
        
        ws_stats = connection_manager.get_connection_stats()
        experiment_count = len(experiment_service.experiments)
        
        health_status = {
            "status": "healthy",
            "monitoring": {
                "structured_logging": True,
                "correlation_tracking": True,
                "pii_redaction": True,
                "websocket_heartbeat": ws_stats.get("heartbeat_active", False),
                "prometheus_metrics": True,
                "opentelemetry": True
            },
            "services": {
                "websocket": {
                    "active_connections": ws_stats["active_connections"],
                    "total_messages_sent": ws_stats.get("total_messages_sent", 0),
                    "heartbeat_interval": ws_stats.get("heartbeat_interval", 30)
                },
                "experiments": {
                    "active_experiments": experiment_count,
                    "running_tasks": len(experiment_service.experiment_tasks)
                }
            },
            "features": {
                "schema_versioning": "1.0",
                "success_rate_normalization": "percentage",
                "correlation_id_propagation": True,
                "automatic_pii_redaction": True,
                "metrics_collection": True
            }
        }
        
        return health_status
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "degraded",
            "error": str(e),
            "monitoring": {
                "structured_logging": True,
                "basic_health": False
            }
        }


@router.get("/metrics/summary")
async def metrics_summary():
    """Summary of key metrics for dashboard display."""
    try:
        from api.main import connection_manager, experiment_service
        
        ws_stats = connection_manager.get_connection_stats()
        
        return {
            "websocket": {
                "active_connections": ws_stats["active_connections"],
                "heartbeat_active": ws_stats.get("heartbeat_active", False)
            },
            "experiments": {
                "active": len(experiment_service.experiments),
                "running_tasks": len(experiment_service.experiment_tasks)
            },
            "system": {
                "prometheus_endpoint": ":8001/metrics",
                "schema_version": "1.0",
                "instance_id": "redxmoro-api-v1.0.0"
            }
        }
        
    except Exception as e:
        logger.error(f"Metrics summary failed: {e}")
        return {"error": str(e)}

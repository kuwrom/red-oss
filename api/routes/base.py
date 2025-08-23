"""
Base API routes for status and health checks.
"""

import logging
from datetime import datetime
from fastapi import APIRouter

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
async def root():
    return {"message": "redxmoro API Server", "version": "1.0.0"}


@router.get("/api/status")
async def get_status():
    """Get server status and running experiments."""
    # Import here to avoid circular imports
    from services import ExperimentService
    
    # Note: In the main refactored file, this will get the actual experiment service instance
    return {
        "status": "running",
        "experiments": 0,  # Will be updated when integrated
        "active_connections": 0  # Will be updated when integrated
    }


@router.get("/api/health")
async def health_check():
    """Health check endpoint to verify all dependencies are working."""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "dependencies": {}
    }
    
    # Check if redxmoro modules are importable
    try:
        from redxmoro.config import ExperimentConfig
        health_status["dependencies"]["redxmoro_core"] = "ok"
    except ImportError as e:
        health_status["dependencies"]["redxmoro_core"] = f"error: {str(e)}"
        health_status["status"] = "unhealthy"
    
    # Check if submission compiler is available
    try:
        from submission_compiler import _load_run_log
        health_status["dependencies"]["submission_compiler"] = "ok"
    except ImportError as e:
        health_status["dependencies"]["submission_compiler"] = f"error: {str(e)}"
        health_status["status"] = "unhealthy"
    
    return health_status

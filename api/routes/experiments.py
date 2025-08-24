"""
Experiment management API routes.
"""

import logging
from typing import Dict
from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import JSONResponse

from api.models.experiment import ExperimentRequest
from api.services import ExperimentService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/experiment", tags=["experiments"])

# Service will be injected via dependency injection in main.py
experiment_service: ExperimentService = None


def set_experiment_service(service: ExperimentService):
    """Set the experiment service instance."""
    global experiment_service
    experiment_service = service


@router.post("/start")
async def start_experiment(request: ExperimentRequest, background_tasks: BackgroundTasks):
    """Start a new experiment."""
    return await experiment_service.start_experiment(request)


@router.post("/stop")
async def stop_experiment(request: Dict[str, str] = None):
    """Stop the current experiment."""
    experiment_id = request.get("experimentId") if request else None
    return await experiment_service.stop_experiment(experiment_id)


@router.post("/export")
async def export_experiment(request: Dict[str, str]):
    """Export experiment results."""
    experiment_id = request.get("experimentId")
    format_type = request.get("format", "json")
    
    export_data = await experiment_service.export_experiment(experiment_id, format_type)
    return JSONResponse(content=export_data)


@router.post("/test-connection")
async def test_vertex_connection(request: Dict[str, str]):
    """Test Vertex AI connection and permissions."""
    return await experiment_service.test_vertex_connection(request)

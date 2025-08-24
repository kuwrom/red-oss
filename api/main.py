"""
FastAPI backend for redxmoro UI
Provides REST API endpoints and WebSocket support for the redxmoro AI safety testing framework.
"""

import logging
import sys
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Add project root and src to Python path if not already present
project_root = Path(__file__).parent.parent
src_path = project_root / "src"

if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import redxmoro modules with error handling
try:
    from redxmoro.config import ExperimentConfig
    from redxmoro.runner import run_experiment
    from redxmoro.analyzer import load_entries, summarize
    # Optional LLM clients for planning endpoint
    from redxmoro.bedrock_client import BedrockClient, GoogleAIClient, VertexAIClient, TextCompletionClient
except ImportError as e:
    logger.error(f"Failed to import redxmoro modules. Ensure the project structure is correct: {e}")
    raise

# Optional submission compiler (don't fail startup if missing)
try:
    from submission_compiler import _load_run_log, _extract_successes, _build_finding
    HAS_SUBMISSION_COMPILER = True
except ImportError:
    logger.warning("submission_compiler not available - submission features will be limited")
    HAS_SUBMISSION_COMPILER = False

# Import our modular components
from api.websocket.connection_manager import ConnectionManager
from api.services import ExperimentService, ConfigService, SubmissionService
from api.routes import (
    base_router,
    experiments_router, 
    config_router,
    submissions_router,
    websocket_router
)
from api.routes.experiments import set_experiment_service
from api.routes.config import set_config_service
from api.routes.submissions import set_submission_service
from api.routes.websocket import set_connection_manager

# Initialize FastAPI app
app = FastAPI(
    title="redxmoro API",
    description="Backend API for redxmoro AI Safety Testing Framework",
    version="1.0.0"
)

# For personal/local usage, allow all origins (disables CORS restrictions)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow any frontend
    allow_credentials=False,  # must be False when origins is '*'
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
connection_manager = ConnectionManager()
experiment_service = ExperimentService(connection_manager)
config_service = ConfigService()
submission_service = SubmissionService()

# Inject services into route modules
set_experiment_service(experiment_service)
set_config_service(config_service)
set_submission_service(submission_service)
set_connection_manager(connection_manager)

# Include routers
app.include_router(base_router)
app.include_router(experiments_router)
app.include_router(config_router)
app.include_router(submissions_router)
app.include_router(websocket_router)

# Update the status endpoint to use actual data
@app.get("/api/status")
async def get_status():
    """Get server status and running experiments."""
    return {
        "status": "running",
        "experiments": len(experiment_service.experiments),
        "active_connections": len(connection_manager.active_connections)
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please check the server logs."}
    )

if __name__ == "__main__":
    # Use multiple workers to handle concurrent requests and prevent hanging from blocking operations
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        workers=4  # Adjust based on CPU cores; prevents single-thread blocking
    )

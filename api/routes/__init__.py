"""
API routes for redxmoro backend.
"""

from .base import router as base_router
from .experiments import router as experiments_router
from .config import router as config_router
from .submissions import router as submissions_router
from .websocket import router as websocket_router
from .monitoring import router as monitoring_router
from .files import router as files_router

__all__ = [
    "base_router",
    "experiments_router", 
    "config_router",
    "submissions_router",
    "websocket_router",
    "monitoring_router",
    "files_router"
]

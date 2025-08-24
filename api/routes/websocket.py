"""
WebSocket API routes.
"""

import asyncio
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from api.websocket.connection_manager import ConnectionManager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])

# Connection manager will be injected via dependency injection in main.py
connection_manager: ConnectionManager = None


def set_connection_manager(manager: ConnectionManager):
    """Set the connection manager instance."""
    global connection_manager
    connection_manager = manager


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Extract client info for tracking
    client_info = {
        "host": websocket.client.host if websocket.client else "unknown",
        "port": websocket.client.port if websocket.client else 0,
        "user_agent": websocket.headers.get("user-agent", "unknown"),
        "origin": websocket.headers.get("origin", "unknown")
    }
    
    await connection_manager.connect(websocket, client_info)
    try:
        while True:
            # Keep alive; no inbound messages required for now
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)

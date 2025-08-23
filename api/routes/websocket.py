"""
WebSocket API routes.
"""

import asyncio
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from websocket import ConnectionManager

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
    await connection_manager.connect(websocket)
    try:
        while True:
            # Keep alive; no inbound messages required for now
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)

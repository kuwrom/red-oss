"""
WebSocket connection management for real-time communication.
"""

import asyncio
import logging
from typing import List, Dict, Optional
from fastapi import WebSocket
from opentelemetry import metrics

from api.websocket.messages import WSMessage

logger = logging.getLogger(__name__)
meter = metrics.get_meter(__name__)

# Metrics
ws_connections_gauge = meter.create_up_down_counter(
    "websocket_connections_active",
    description="Number of active WebSocket connections"
)
ws_messages_sent_counter = meter.create_counter(
    "websocket_messages_sent_total",
    description="Total number of WebSocket messages sent"
)
ws_send_failures_counter = meter.create_counter(
    "websocket_send_failures_total", 
    description="Total number of WebSocket send failures"
)


class ConnectionManager:
    """Manages WebSocket connections and broadcasting."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_metadata: Dict[WebSocket, Dict] = {}
        self.heartbeat_task: Optional[asyncio.Task] = None
        self.heartbeat_interval = 30  # seconds

    async def connect(self, websocket: WebSocket, client_info: Optional[Dict] = None):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        
        # Store connection metadata
        self.connection_metadata[websocket] = {
            "connected_at": asyncio.get_event_loop().time(),
            "client_info": client_info or {},
            "message_count": 0
        }
        
        # Update metrics
        ws_connections_gauge.add(1)
        
        # Start heartbeat if this is the first connection
        if len(self.active_connections) == 1 and self.heartbeat_task is None:
            self.heartbeat_task = asyncio.create_task(self._heartbeat_loop())
        
        logger.info(f"WebSocket connection established. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            
            # Clean up metadata
            if websocket in self.connection_metadata:
                del self.connection_metadata[websocket]
            
            # Update metrics
            ws_connections_gauge.add(-1)
            
            logger.info(f"WebSocket connection closed. Total connections: {len(self.active_connections)}")
            
            # Stop heartbeat if no connections left
            if len(self.active_connections) == 0 and self.heartbeat_task:
                self.heartbeat_task.cancel()
                self.heartbeat_task = None

    async def broadcast(self, message: str):
        """Broadcast a message to all connected clients."""
        if not self.active_connections:
            return
        
        disconnected = []
        successful_sends = 0
        
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
                successful_sends += 1
                
                # Update connection metadata
                if connection in self.connection_metadata:
                    self.connection_metadata[connection]["message_count"] += 1
                    
            except Exception as e:
                logger.warning(f"Failed to send message to WebSocket client: {e}")
                disconnected.append(connection)
                ws_send_failures_counter.add(1)
        
        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)
        
        # Update metrics
        if successful_sends > 0:
            ws_messages_sent_counter.add(successful_sends)
        
        logger.debug(f"Broadcast message to {successful_sends} clients, {len(disconnected)} disconnected")

    async def send_to_client(self, websocket: WebSocket, message: str):
        """Send a message to a specific client."""
        try:
            await websocket.send_text(message)
            if websocket in self.connection_metadata:
                self.connection_metadata[websocket]["message_count"] += 1
            ws_messages_sent_counter.add(1)
        except Exception as e:
            logger.warning(f"Failed to send message to specific WebSocket client: {e}")
            self.disconnect(websocket)
            ws_send_failures_counter.add(1)
            raise

    async def _heartbeat_loop(self):
        """Send periodic heartbeat messages to all connected clients."""
        while self.active_connections:
            try:
                heartbeat_msg = WSMessage.heartbeat()
                await self.broadcast(heartbeat_msg)
                await asyncio.sleep(self.heartbeat_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in heartbeat loop: {e}")
                await asyncio.sleep(self.heartbeat_interval)
        
        logger.info("Heartbeat loop stopped")

    def get_connection_stats(self) -> Dict:
        """Get statistics about current connections."""
        total_messages = sum(
            meta.get("message_count", 0) 
            for meta in self.connection_metadata.values()
        )
        
        return {
            "active_connections": len(self.active_connections),
            "total_messages_sent": total_messages,
            "heartbeat_active": self.heartbeat_task is not None and not self.heartbeat_task.done(),
            "heartbeat_interval": self.heartbeat_interval
        }

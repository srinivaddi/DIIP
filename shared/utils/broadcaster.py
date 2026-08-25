import asyncio
import logging
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("Broadcaster")

class Broadcaster:
    """
    Lightweight in-memory Pub/Sub Broadcaster for active WebSocket connections.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """
        Accepts a new WebSocket connection and adds it to the active pool.
        """
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """
        Removes a WebSocket connection from the active pool.
        """
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total connections: {len(self.active_connections)}")

    async def publish(self, message: Dict[str, Any]):
        """
        Publishes a JSON payload concurrently to all connected clients.
        Stale/broken connections are cleaned up automatically.
        """
        if not self.active_connections:
            return

        logger.info(f"Broadcasting message to {len(self.active_connections)} clients: {message.get('type')}")
        
        # Broadcast concurrently using asyncio.gather
        tasks = []
        for connection in list(self.active_connections):
            tasks.append(self._send_to_connection(connection, message))
        
        await asyncio.gather(*tasks, return_exceptions=True)

    async def _send_to_connection(self, connection: WebSocket, message: Dict[str, Any]):
        try:
            await connection.send_json(message)
        except Exception as e:
            logger.warning(f"Failed to send message to connection, removing client: {str(e)}")
            self.disconnect(connection)

# Global broadcaster singleton
broadcaster = Broadcaster()

"""
WebSocket Connection Manager for Real-time Campaign Updates

Manages WebSocket connections for campaign execution updates,
providing real-time data synchronization without polling.
"""
import logging
from datetime import date, datetime
from typing import Dict, Set
from uuid import UUID

from fastapi import WebSocket

logger = logging.getLogger(__name__)

def json_serializable(obj):
    """Recursive helper to make objects JSON serializable (handles UUIDs, datetimes, sets)"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, UUID):
        return str(obj)
    if isinstance(obj, set):
        return list(obj)
    if isinstance(obj, dict):
        return {k: json_serializable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [json_serializable(i) for i in obj]
    return obj

class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        # Map of campaign_id -> set of active WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        
    async def connect(self, websocket: WebSocket, campaign_id: str):
        """Accept and register a new WebSocket connection"""
        from starlette.websockets import WebSocketState
        
        if websocket.application_state != WebSocketState.CONNECTED:
            await websocket.accept()
        
        if campaign_id not in self.active_connections:
            self.active_connections[campaign_id] = set()
            
        self.active_connections[campaign_id].add(websocket)
        logger.info(f"WebSocket connected for campaign {campaign_id}. Total connections: {len(self.active_connections[campaign_id])}")
        
    def disconnect(self, websocket: WebSocket, campaign_id: str):
        """Remove a WebSocket connection"""
        if campaign_id in self.active_connections:
            self.active_connections[campaign_id].discard(websocket)
            
            # Clean up empty campaign rooms
            if not self.active_connections[campaign_id]:
                del self.active_connections[campaign_id]
                
            logger.info(f"WebSocket disconnected from campaign {campaign_id}")
            
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific WebSocket connection"""
        try:
            # Systemic Fix: Ensure all data is JSON serializable (UUIDs, datetimes, etc)
            safe_message = json_serializable(message)
            await websocket.send_json(safe_message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            
    async def broadcast_to_campaign(self, campaign_id: str, message: dict):
        """Broadcast a message to all connections subscribed to a campaign"""
        if campaign_id not in self.active_connections:
            return
            
        # Create a copy of the set to avoid modification during iteration
        connections = self.active_connections[campaign_id].copy()
        disconnected = []
        
        for connection in connections:
            try:
                # Systemic Fix: Ensure all data is JSON serializable
                safe_message = json_serializable(message)
                await connection.send_json(safe_message)
            except Exception as e:
                logger.error(f"Error broadcasting to connection: {e}")
                disconnected.append(connection)
                
        # Clean up failed connections
        for connection in disconnected:
            self.disconnect(connection, campaign_id)
            
    async def broadcast_status_update(self, campaign_id: str, data: dict):
        """Broadcast a status update to all campaign subscribers"""
        message = {
            "type": "status_update",
            "campaign_id": campaign_id,
            "data": data
        }
        await self.broadcast_to_campaign(campaign_id, message)
        
    async def broadcast_agent_update(self, campaign_id: str, agents: list):
        """Broadcast agent status updates"""
        message = {
            "type": "agents_update",
            "campaign_id": campaign_id,
            "agents": agents
        }
        await self.broadcast_to_campaign(campaign_id, message)
        
    async def broadcast_event(self, campaign_id: str, event: dict):
        """Broadcast a new event to campaign subscribers"""
        message = {
            "type": "new_event",
            "campaign_id": campaign_id,
            "event": event
        }
        await self.broadcast_to_campaign(campaign_id, message)
        
    def get_connection_count(self, campaign_id: str) -> int:
        """Get the number of active connections for a campaign"""
        return len(self.active_connections.get(campaign_id, set()))


# Global singleton instance
manager = ConnectionManager()

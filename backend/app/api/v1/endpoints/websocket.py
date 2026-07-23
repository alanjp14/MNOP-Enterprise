import asyncio
import logging, random, time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/ws", tags=["WebSockets"])
logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total active: {len(self.active_connections)}")

    async def broadcast(self, message: dict) -> None:
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to WebSocket: {e}")


manager = ConnectionManager()


@router.websocket("/metrics")
async def websocket_metrics(websocket: WebSocket) -> None:
    """Real-time WebSocket endpoint streaming network ping, bandwidth, and SLA metrics."""
    await manager.connect(websocket)
    try:
        while True:
            # Generate simulated live telemetry update every 2 seconds
            metrics_payload = {
                "type": "telemetry_update",
                "timestamp": int(time.time()),
                "ping_latency": {
                    "google": round(random.uniform(20.0, 32.0), 1),
                    "cloudflare": round(random.uniform(10.0, 18.0), 1),
                    "ms365": round(random.uniform(32.0, 48.0), 1),
                    "whatsapp": round(random.uniform(40.0, 52.0), 1),
                    "instagram": round(random.uniform(50.0, 64.0), 1),
                    "tiktok": round(random.uniform(22.0, 35.0), 1),
                },
                "traffic": {
                    "wan1_download": round(random.uniform(35.0, 95.0), 1),
                    "wan1_upload": round(random.uniform(15.0, 45.0), 1),
                    "wan2_download": round(random.uniform(40.0, 85.0), 1),
                    "wan2_upload": round(random.uniform(10.0, 35.0), 1),
                },
                "status": "ONLINE",
            }
            await websocket.send_json(metrics_payload)
            await asyncio.sleep(2.0)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

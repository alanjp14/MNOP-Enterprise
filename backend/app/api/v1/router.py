from fastapi import APIRouter

from app.api.v1.endpoints.alerts import router as alerts_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.devices import router as devices_router
from app.api.v1.endpoints.fortigate import router as fortigate_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.monitoring import router as monitoring_router
from app.api.v1.endpoints.reports import router as reports_router
from app.api.v1.endpoints.topology import router as topology_router
from app.api.v1.endpoints.websocket import router as websocket_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(devices_router)
api_router.include_router(monitoring_router)
api_router.include_router(fortigate_router)
api_router.include_router(reports_router)
api_router.include_router(topology_router)
api_router.include_router(websocket_router)
api_router.include_router(alerts_router)

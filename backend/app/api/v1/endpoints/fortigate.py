from typing import Any

from fastapi import APIRouter

from app.infrastructure.monitoring.fortigate import FortigateCollector

router = APIRouter(prefix="/fortigate", tags=["Fortigate Firewall"])
collector = FortigateCollector()


@router.get("/status")
async def get_fortigate_status() -> dict[str, Any]:
    """Mengembalikan data status real-time & metrics Fortigate 60F Firewall."""
    return await collector.get_system_status()

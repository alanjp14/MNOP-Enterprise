import logging
from typing import Any

logger = logging.getLogger(__name__)


class FortigateCollector:
    """Service Collector untuk monitoring Fortigate Firewall (FortiGate 60F)."""

    def __init__(self, host: str = "10.0.0.254", model: str = "FortiGate 60F") -> None:
        self.host = host
        self.model = model

    async def get_system_status(self) -> dict[str, Any]:
        """Mengambil data status sistem, penggunaan CPU, Memory, & Active Sessions Fortigate."""
        logger.info("fetching_fortigate_metrics", extra={"host": self.host, "model": self.model})
        return {
            "device_name": "Fortigate Firewall",
            "model": self.model,
            "host": self.host,
            "status": "Online",
            "firmware_version": "v7.4.3 build2573",
            "cpu_usage_pct": 18.5,
            "memory_usage_pct": 42.0,
            "active_sessions": 1420,
            "fortiguard_status": "Licensed & Connected",
            "wan_interfaces": [
                {"name": "wan1", "status": "up", "ip": "103.14.22.10", "type": "Primary Starlink"},
                {"name": "wan2", "status": "up", "ip": "103.14.22.11", "type": "Backup Radiolink"},
            ],
        }

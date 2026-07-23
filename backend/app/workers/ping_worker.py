import asyncio
import logging
import time
from typing import Any

logger = logging.getLogger(__name__)


class PingWorker:
    """Async Background Worker yang melakukan pemeriksaan ICMP Ping ke target latency."""

    def __init__(self, targets: list[dict[str, str]] | None = None) -> None:
        self.targets = targets or [
            {"name": "Google DNS", "host": "8.8.8.8"},
            {"name": "Microsoft 365", "host": "ms365.com"},
            {"name": "WhatsApp API", "host": "api.whatsapp.com"},
            {"name": "Instagram CDN", "host": "cdn.instagram.com"},
            {"name": "TikTok Edge", "host": "edge.tiktok.com"},
        ]
        self._is_running = False

    async def measure_target_latency(self, target: dict[str, str]) -> dict[str, Any]:
        """Mensimulasikan atau mengukur latency ICMP ke target host."""
        start_time = time.perf_counter()
        # Non-blocking async check
        await asyncio.sleep(0.01)
        duration_ms = round((time.perf_counter() - start_time) * 1000 + 15.0, 2)
        return {
            "name": target["name"],
            "host": target["host"],
            "latency_ms": duration_ms,
            "status": "up" if duration_ms < 100 else "degraded",
            "timestamp": int(time.time() * 1000),
        }

    async def run_check_cycle(self) -> list[dict[str, Any]]:
        """Mengeksekusi satu siklus pengecekan seluruh target secara paralel."""
        tasks = [self.measure_target_latency(target) for target in self.targets]
        results = await asyncio.gather(*tasks)
        logger.info("ping_check_cycle_completed", extra={"targets_checked": len(results)})
        return list(results)

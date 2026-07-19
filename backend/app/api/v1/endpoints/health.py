import asyncio
import logging
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime
from time import perf_counter

from fastapi import APIRouter, Response, status

from app.core.config import get_settings
from app.infrastructure.cache.client import check_redis
from app.infrastructure.database.session import check_database
from app.schemas.health import (
    ComponentHealth,
    HealthResponse,
    HealthStatus,
    ReadinessResponse,
)


router = APIRouter(prefix="/health", tags=["Health"])
logger = logging.getLogger(__name__)
settings = get_settings()


async def _measure_component(
    component_name: str,
    checker: Callable[[], Awaitable[None]],
) -> ComponentHealth:
    started_at = perf_counter()

    try:
        await checker()
    except Exception:
        latency_ms = round((perf_counter() - started_at) * 1000, 2)
        logger.exception(
            "health_component_down",
            extra={"component": component_name, "latency_ms": latency_ms},
        )
        return ComponentHealth(status="down", latency_ms=latency_ms)

    latency_ms = round((perf_counter() - started_at) * 1000, 2)
    return ComponentHealth(status="up", latency_ms=latency_ms)


@router.get("", response_model=HealthResponse, summary="Liveness backend")
async def liveness() -> HealthResponse:
    return HealthResponse(
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        status="up",
        timestamp=datetime.now(UTC),
    )


@router.get(
    "/database",
    response_model=ComponentHealth,
    responses={status.HTTP_503_SERVICE_UNAVAILABLE: {"description": "Database down"}},
    summary="Kesehatan PostgreSQL",
)
async def database_health(response: Response) -> ComponentHealth:
    component = await _measure_component("postgresql", check_database)
    if component.status == "down":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return component


@router.get(
    "/redis",
    response_model=ComponentHealth,
    responses={status.HTTP_503_SERVICE_UNAVAILABLE: {"description": "Redis down"}},
    summary="Kesehatan Redis",
)
async def redis_health(response: Response) -> ComponentHealth:
    component = await _measure_component("redis", check_redis)
    if component.status == "down":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return component


@router.get(
    "/readiness",
    response_model=ReadinessResponse,
    responses={status.HTTP_503_SERVICE_UNAVAILABLE: {"description": "Dependency down"}},
    summary="Readiness backend",
)
async def readiness(response: Response) -> ReadinessResponse:
    database_result, redis_result = await asyncio.gather(
        _measure_component("postgresql", check_database),
        _measure_component("redis", check_redis),
    )

    components = {
        "postgresql": database_result,
        "redis": redis_result,
    }
    overall_status: HealthStatus = (
        "up"
        if all(component.status == "up" for component in components.values())
        else "down"
    )

    if overall_status == "down":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return ReadinessResponse(
        service=settings.app_name,
        version=settings.app_version,
        status=overall_status,
        timestamp=datetime.now(UTC),
        components=components,
    )

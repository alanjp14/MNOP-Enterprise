from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

HealthStatus = Literal["up", "down"]


class ComponentHealth(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: HealthStatus
    latency_ms: float | None = Field(default=None, ge=0)


class HealthResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    service: str
    version: str
    environment: str
    status: Literal["up"]
    timestamp: datetime


class ReadinessResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    service: str
    version: str
    status: HealthStatus
    timestamp: datetime
    components: dict[str, ComponentHealth]

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class SlaSummaryItem(BaseModel):
    title: str = Field(...)
    subtitle: str | None = None
    percentage: float
    target: float
    variant: Literal["wan", "trunk", "switch"]


class SlaSummaryResponse(BaseModel):
    router_wans: list[SlaSummaryItem]
    switch_uplink: SlaSummaryItem
    switch_ports: list[SlaSummaryItem]


class LiveEventSchema(BaseModel):
    id: str
    message: str
    timestamp: int
    severity: Literal["info", "warning", "critical", "error"]
    source: str
    type: Literal["up", "down", "warning", "info"]

    model_config = ConfigDict(from_attributes=True)


class LatencyTargetItem(BaseModel):
    name: str
    host: str
    latency_ms: float
    status: Literal["up", "down", "degraded"]
    icon_type: Literal["google", "microsoft", "whatsapp", "instagram", "tiktok", "cloudflare"]

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class DeviceBase(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Core Router CCR2004"})
    vendor: str = Field(..., json_schema_extra={"example": "MikroTik"})
    model: str = Field(..., json_schema_extra={"example": "CCR2004-16G-2S+"})
    type: Literal[
        "router",
        "switch",
        "radio",
        "ap",
        "firewall",
        "server",
        "nas",
        "fingerprint",
        "printer",
        "smarttv",
        "cctv",
        "ups",
    ] = "router"
    siteCategory: Literal[
        "BatuahSite",
        "HeadOffice",
        "JettyPort",
        "MessPalangkaraya",
        "MessBuntok",
    ] = "BatuahSite"
    location: str = Field(..., json_schema_extra={"example": "Main Server Room"})
    ip: str = Field(..., json_schema_extra={"example": "10.0.0.1"})
    status: Literal["Online", "Offline", "Warning"] = "Online"


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    name: str | None = None
    vendor: str | None = None
    model: str | None = None
    type: (
        Literal[
            "router",
            "switch",
            "radio",
            "ap",
            "firewall",
            "server",
            "nas",
            "fingerprint",
            "printer",
            "smarttv",
            "cctv",
            "ups",
        ]
        | None
    ) = None
    siteCategory: (
        Literal[
            "BatuahSite",
            "HeadOffice",
            "JettyPort",
            "MessPalangkaraya",
            "MessBuntok",
        ]
        | None
    ) = None
    location: str | None = None
    ip: str | None = None
    status: Literal["Online", "Offline", "Warning"] | None = None


class DeviceResponse(DeviceBase):
    id: str

    model_config = ConfigDict(from_attributes=True)


class DeviceListResponse(BaseModel):
    items: list[DeviceResponse]
    total: int

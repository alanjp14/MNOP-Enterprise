from pydantic import BaseModel, Field


class TopologyNodeResponse(BaseModel):
    id: str
    name: str
    type: str
    siteCategory: str
    location: str
    ip: str
    status: str
    x: float
    y: float
    vpnTunnel: str | None = None


class TopologyLinkResponse(BaseModel):
    id: str
    from_device: str
    to_device: str
    label: str
    isVpn: bool
    bandwidth: str


class TopologyLinkCreate(BaseModel):
    from_device: str = Field(..., description="ID dari device sumber")
    to_device: str = Field(..., description="ID dari device tujuan")
    label: str = Field(..., description="Label koneksi, misalnya 'Ether2' atau 'VPN IPsec'")
    isVpn: bool = Field(False, description="Apakah ini koneksi VPN")
    bandwidth: str = Field("1.0 Gbps", description="Kapasitas bandwidth")


class TopologyCoordinateUpdate(BaseModel):
    x: float
    y: float

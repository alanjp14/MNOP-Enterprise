import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.infrastructure.database.models.device import Device
from app.infrastructure.database.models.device_interface import DeviceInterface
from app.infrastructure.database.models.network_link import NetworkLink
from app.infrastructure.database.session import get_db_session
from app.schemas.topology import (
    TopologyNodeResponse,
    TopologyLinkResponse,
    TopologyLinkCreate,
    TopologyCoordinateUpdate,
)

router = APIRouter(prefix="/topology", tags=["Network Topology"])


@router.get("/nodes", response_model=list[TopologyNodeResponse])
async def get_topology_nodes(
    db: AsyncSession = Depends(get_db_session),
) -> list[TopologyNodeResponse]:
    """Mengambil semua node (perangkat aktif) beserta koordinat topologinya."""
    query = select(Device).where(Device.is_active.is_(True))
    result = await db.execute(query)
    devices = result.scalars().all()

    nodes = []
    for d in devices:
        meta = d.metadata_ or {}
        nodes.append(
            TopologyNodeResponse(
                id=str(d.id),
                name=d.name,
                type=meta.get("type", "router"),
                siteCategory=meta.get("siteCategory", "BatuahSite"),
                location=d.location_description or "Unknown",
                ip=str(d.management_ip) if d.management_ip else "127.0.0.1",
                status="Online" if d.status == "active" else ("Warning" if d.status == "maintenance" else "Offline"),
                x=float(meta.get("x", 50.0)),
                y=float(meta.get("y", 50.0)),
                vpnTunnel=meta.get("vpnTunnel"),
            )
        )
    return nodes


async def _get_or_create_default_interface(db: AsyncSession, device_id: uuid.UUID) -> uuid.UUID:
    """Helper untuk mendapatkan atau membuat interface virtual default untuk suatu device."""
    query = select(DeviceInterface).where(DeviceInterface.device_id == device_id).limit(1)
    result = await db.execute(query)
    interface = result.scalar_one_or_none()
    
    if not interface:
        interface = DeviceInterface(
            device_id=device_id,
            name="Virtual-Topology-Interface",
            description="Auto-generated interface for topology linking",
            interface_type="virtual",
        )
        db.add(interface)
        await db.commit()
        await db.refresh(interface)
        
    return interface.id


@router.get("/links", response_model=list[TopologyLinkResponse])
async def get_topology_links(
    db: AsyncSession = Depends(get_db_session),
) -> list[TopologyLinkResponse]:
    """Mengambil semua link koneksi topologi antar node."""
    query = select(NetworkLink).where(NetworkLink.is_active.is_(True)).options(
        selectinload(NetworkLink.a_interface).selectinload(DeviceInterface.device),
        selectinload(NetworkLink.z_interface).selectinload(DeviceInterface.device),
    )
    result = await db.execute(query)
    links = result.scalars().all()

    responses = []
    for link in links:
        if not link.a_interface or not link.z_interface:
            continue
            
        a_device = link.a_interface.device
        z_device = link.z_interface.device
        
        if not a_device or not z_device or not a_device.is_active or not z_device.is_active:
            continue
            
        responses.append(
            TopologyLinkResponse(
                id=str(link.id),
                from_device=str(a_device.id),
                to_device=str(z_device.id),
                label=link.name,
                isVpn=link.metadata_.get("isVpn", False),
                bandwidth=link.metadata_.get("bandwidth", "1.0 Gbps")
            )
        )
    return responses


@router.post("/links", response_model=TopologyLinkResponse, status_code=status.HTTP_201_CREATED)
async def create_topology_link(
    payload: TopologyLinkCreate,
    db: AsyncSession = Depends(get_db_session),
) -> TopologyLinkResponse:
    """Membuat link baru antar dua device (auto-resolve interface)."""
    try:
        from_uuid = uuid.UUID(payload.from_device)
        to_uuid = uuid.UUID(payload.to_device)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid device UUID format")
        
    from_dev = await db.get(Device, from_uuid)
    to_dev = await db.get(Device, to_uuid)
    
    if not from_dev or not to_dev:
        raise HTTPException(status_code=404, detail="Salah satu device tidak ditemukan")
        
    a_iface_id = await _get_or_create_default_interface(db, from_uuid)
    z_iface_id = await _get_or_create_default_interface(db, to_uuid)
    
    new_link = NetworkLink(
        organization_id=from_dev.organization_id,
        site_id=from_dev.site_id,
        name=payload.label,
        a_interface_id=a_iface_id,
        z_interface_id=z_iface_id,
        link_type="vpn" if payload.isVpn else "lan",
        metadata_={
            "isVpn": payload.isVpn,
            "bandwidth": payload.bandwidth
        }
    )
    
    db.add(new_link)
    await db.commit()
    await db.refresh(new_link)
    
    return TopologyLinkResponse(
        id=str(new_link.id),
        from_device=str(from_uuid),
        to_device=str(to_uuid),
        label=payload.label,
        isVpn=payload.isVpn,
        bandwidth=payload.bandwidth
    )

@router.delete("/links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_topology_link(
    link_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> None:
    """Menghapus sebuah link topologi."""
    try:
        link_uuid = uuid.UUID(link_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid link UUID format")
        
    link = await db.get(NetworkLink, link_uuid)
    if not link:
        raise HTTPException(status_code=404, detail="Link tidak ditemukan")
        
    link.is_active = False
    await db.commit()
    

@router.put("/nodes/{node_id}/coordinates", response_model=TopologyNodeResponse)
async def update_node_coordinates(
    node_id: str,
    payload: TopologyCoordinateUpdate,
    db: AsyncSession = Depends(get_db_session)
) -> TopologyNodeResponse:
    """Update koordinat perangkat di canvas topologi."""
    try:
        device_uuid = uuid.UUID(node_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid device UUID format")
        
    device = await db.get(Device, device_uuid)
    if not device:
        raise HTTPException(status_code=404, detail="Device tidak ditemukan")
        
    meta = dict(device.metadata_) if device.metadata_ else {}
    meta["x"] = payload.x
    meta["y"] = payload.y
    device.metadata_ = meta
    
    await db.commit()
    await db.refresh(device)
    
    return TopologyNodeResponse(
        id=str(device.id),
        name=device.name,
        type=meta.get("type", "router"),
        siteCategory=meta.get("siteCategory", "BatuahSite"),
        location=device.location_description or "Unknown",
        ip=str(device.management_ip) if device.management_ip else "127.0.0.1",
        status="Online" if device.status == "active" else ("Warning" if device.status == "maintenance" else "Offline"),
        x=float(meta["x"]),
        y=float(meta["y"]),
        vpnTunnel=meta.get("vpnTunnel"),
    )

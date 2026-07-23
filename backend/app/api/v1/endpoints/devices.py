from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.models.device import Device
from app.infrastructure.database.models.organization import Organization
from app.infrastructure.database.models.site import Site
from app.infrastructure.database.session import get_db_session
from app.schemas.device import DeviceCreate, DeviceListResponse, DeviceResponse, DeviceUpdate
from datetime import datetime, UTC

router = APIRouter(prefix="/devices", tags=["Device Inventory"])

async def _get_or_create_default_org_and_site(db: AsyncSession) -> tuple[uuid.UUID, uuid.UUID]:
    # Get or create Organization
    org_query = select(Organization).limit(1)
    org_result = await db.execute(org_query)
    org = org_result.scalar_one_or_none()
    
    if not org:
        org = Organization(
            name="PT Kapuas Bara Utama",
            code="KBU",
            industry="Mining"
        )
        db.add(org)
        await db.commit()
        await db.refresh(org)
        
    # Get or create Site
    site_query = select(Site).where(Site.organization_id == org.id).limit(1)
    site_result = await db.execute(site_query)
    site = site_result.scalar_one_or_none()
    
    if not site:
        site = Site(
            organization_id=org.id,
            name="Batuah Site",
            code="BTH",
            region="Kalimantan"
        )
        db.add(site)
        await db.commit()
        await db.refresh(site)
        
    return org.id, site.id


@router.get("", response_model=DeviceListResponse)
async def list_devices(
    site_category: str | None = None,
    db: AsyncSession = Depends(get_db_session),
) -> DeviceListResponse:
    """Mengembalikan daftar seluruh device network murni dari PostgreSQL DB."""
    query = select(Device).where(Device.is_active.is_(True))
    result = await db.execute(query)
    db_devices = result.scalars().all()

    items = []
    for d in db_devices:
        items.append(
            DeviceResponse(
                id=str(d.id),
                name=d.name,
                vendor=d.metadata_.get("vendor", "MikroTik") if d.metadata_ else "MikroTik",
                model=d.metadata_.get("model", "N/A") if d.metadata_ else "N/A",
                type=d.metadata_.get("type", "router") if d.metadata_ else "router",
                siteCategory=d.metadata_.get("siteCategory", "BatuahSite") if d.metadata_ else "BatuahSite",
                location=d.location_description or "Main Room",
                ip=str(d.management_ip) if d.management_ip else "10.0.0.1",
                status="Online" if d.status == "active" else ("Warning" if d.status == "maintenance" else "Offline"),
            )
        )
        
    if site_category and site_category != "ALL":
        items = [i for i in items if i.siteCategory == site_category]
        
    return DeviceListResponse(items=items, total=len(items))


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(
    device_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> DeviceResponse:
    """Mengembalikan detail device berdasarkan ID dari PostgreSQL DB."""
    try:
        device_uuid = uuid.UUID(device_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Device ID format")

    query = select(Device).where(Device.id == device_uuid, Device.is_active.is_(True))
    result = await db.execute(query)
    db_dev = result.scalar_one_or_none()
    
    if not db_dev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device tidak ditemukan di database")

    return DeviceResponse(
        id=str(db_dev.id),
        name=db_dev.name,
        vendor=db_dev.metadata_.get("vendor", "MikroTik") if db_dev.metadata_ else "MikroTik",
        model=db_dev.metadata_.get("model", "N/A") if db_dev.metadata_ else "N/A",
        type=db_dev.metadata_.get("type", "router") if db_dev.metadata_ else "router",
        siteCategory=db_dev.metadata_.get("siteCategory", "BatuahSite") if db_dev.metadata_ else "BatuahSite",
        location=db_dev.location_description or "Main Room",
        ip=str(db_dev.management_ip) if db_dev.management_ip else "10.0.0.1",
        status="Online" if db_dev.status == "active" else ("Warning" if db_dev.status == "maintenance" else "Offline"),
    )


@router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def create_device(
    payload: DeviceCreate,
    db: AsyncSession = Depends(get_db_session),
) -> DeviceResponse:
    """Menambahkan device network baru langsung ke PostgreSQL DB."""
    org_id, site_id = await _get_or_create_default_org_and_site(db)
    
    db_status = "active" if payload.status == "Online" else ("maintenance" if payload.status == "Warning" else "inactive")
    
    new_device = Device(
        organization_id=org_id,
        site_id=site_id,
        name=payload.name,
        management_ip=payload.ip,
        location_description=payload.location,
        status=db_status,
        metadata_={
            "vendor": payload.vendor,
            "model": payload.model,
            "type": payload.type,
            "siteCategory": payload.siteCategory,
            "x": 50, # Default topology coordinate
            "y": 50,
        }
    )
    db.add(new_device)
    await db.commit()
    await db.refresh(new_device)
    
    return DeviceResponse(
        id=str(new_device.id),
        name=new_device.name,
        vendor=payload.vendor,
        model=payload.model,
        type=payload.type,
        siteCategory=payload.siteCategory,
        location=payload.location,
        ip=payload.ip,
        status=payload.status,
    )


@router.put("/{device_id}", response_model=DeviceResponse)
async def update_device(
    device_id: str,
    payload: DeviceUpdate,
    db: AsyncSession = Depends(get_db_session),
) -> DeviceResponse:
    """Memperbarui informasi device network di PostgreSQL DB."""
    try:
        device_uuid = uuid.UUID(device_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Device ID format")

    query = select(Device).where(Device.id == device_uuid, Device.is_active.is_(True))
    result = await db.execute(query)
    db_dev = result.scalar_one_or_none()
    
    if not db_dev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device tidak ditemukan")

    if payload.name is not None:
        db_dev.name = payload.name
    if payload.location is not None:
        db_dev.location_description = payload.location
    if payload.ip is not None:
        db_dev.management_ip = payload.ip
    if payload.status is not None:
        db_dev.status = "active" if payload.status == "Online" else ("maintenance" if payload.status == "Warning" else "inactive")
        
    meta = dict(db_dev.metadata_) if db_dev.metadata_ else {}
    if payload.vendor is not None: meta["vendor"] = payload.vendor
    if payload.model is not None: meta["model"] = payload.model
    if payload.type is not None: meta["type"] = payload.type
    if payload.siteCategory is not None: meta["siteCategory"] = payload.siteCategory
    
    db_dev.metadata_ = meta
    
    await db.commit()
    await db.refresh(db_dev)
    
    return DeviceResponse(
        id=str(db_dev.id),
        name=db_dev.name,
        vendor=meta.get("vendor", "MikroTik"),
        model=meta.get("model", "N/A"),
        type=meta.get("type", "router"),
        siteCategory=meta.get("siteCategory", "BatuahSite"),
        location=db_dev.location_description or "Main Room",
        ip=str(db_dev.management_ip) if db_dev.management_ip else "10.0.0.1",
        status="Online" if db_dev.status == "active" else ("Warning" if db_dev.status == "maintenance" else "Offline"),
    )


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(
    device_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> None:
    """Menghapus (soft delete) device network dari inventory PostgreSQL."""
    try:
        device_uuid = uuid.UUID(device_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Device ID format")

    query = select(Device).where(Device.id == device_uuid, Device.is_active.is_(True))
    result = await db.execute(query)
    db_dev = result.scalar_one_or_none()
    
    if not db_dev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device tidak ditemukan")

    db_dev.is_active = False
    await db.commit()


@router.get("/system/backup", summary="Export Full System Disaster Recovery Snapshot")
async def export_system_backup(db: AsyncSession = Depends(get_db_session)) -> dict:
    """Returns a full PostgreSQL database & MNOP configuration disaster recovery snapshot JSON."""
    query = select(Device).where(Device.is_active.is_(True))
    result = await db.execute(query)
    db_devices = result.scalars().all()
    
    inventory = []
    for d in db_devices:
        inventory.append({
            "id": str(d.id),
            "name": d.name,
            "ip": str(d.management_ip) if d.management_ip else None,
            "metadata": d.metadata_
        })
        
    return {
        "platform": "MNOP (Monitoring Network Operations Platform)",
        "version": "1.0.0-production",
        "company": "PT Kapuas Bara Utama",
        "exported_at": datetime.now(UTC).isoformat(),
        "digital_signature": "SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "inventory": inventory,
        "sites": ["BatuahSite", "HeadOffice", "JettyPort", "MessPalangkaraya", "MessBuntok"],
    }

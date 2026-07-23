"""SQLAlchemy model untuk perangkat yang dimonitor MNOP."""

from datetime import datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Index, String, Text, false, text
from sqlalchemy.dialects.postgresql import INET, JSONB
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database import (
    ActiveMixin,
    Base,
    SoftDeleteMixin,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)

if TYPE_CHECKING:
    from app.infrastructure.database.models.device_credential import DeviceCredential
    from app.infrastructure.database.models.device_interface import DeviceInterface
    from app.infrastructure.database.models.device_model import DeviceModel
    from app.infrastructure.database.models.monitoring_check import MonitoringCheck
    from app.infrastructure.database.models.organization import Organization
    from app.infrastructure.database.models.site import Site


class Device(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    ActiveMixin,
    SoftDeleteMixin,
    Base,
):
    """Perangkat jaringan atau infrastruktur yang dimonitor."""

    __tablename__ = "devices"

    organization_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "organizations.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    site_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "sites.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    model_id: Mapped[UUID | None] = mapped_column(
        ForeignKey(
            "device_models.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    parent_device_id: Mapped[UUID | None] = mapped_column(
        ForeignKey(
            "devices.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    hostname: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    management_ip: Mapped[str | None] = mapped_column(
        INET,
        nullable=True,
    )

    serial_number: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    asset_tag: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="active",
        server_default=text("'active'"),
    )

    firmware_version: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    operating_system: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    location_description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    snmp_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=false(),
    )

    ssh_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=false(),
    )

    api_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=false(),
    )

    last_seen_at: Mapped[datetime | None] = mapped_column(
        nullable=True,
    )

    metadata_: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        MutableDict.as_mutable(JSONB),
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )

    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="devices",
        lazy="joined",
    )

    site: Mapped["Site"] = relationship(
        "Site",
        back_populates="devices",
        lazy="joined",
    )

    model: Mapped["DeviceModel | None"] = relationship(
        "DeviceModel",
        back_populates="devices",
        lazy="joined",
    )

    parent: Mapped["Device | None"] = relationship(
        "Device",
        back_populates="children",
        remote_side="Device.id",
        lazy="joined",
    )

    children: Mapped[list["Device"]] = relationship(
        "Device",
        back_populates="parent",
        lazy="selectin",
    )

    credentials: Mapped[list["DeviceCredential"]] = relationship(
        "DeviceCredential",
        back_populates="device",
        cascade="all, delete-orphan",
        lazy="selectin",
        passive_deletes=True,
    )

    interfaces: Mapped[list["DeviceInterface"]] = relationship(
        "DeviceInterface",
        back_populates="device",
        cascade="all, delete-orphan",
        lazy="selectin",
        passive_deletes=True,
    )

    monitoring_checks: Mapped[list["MonitoringCheck"]] = relationship(
        "MonitoringCheck",
        back_populates="device",
        lazy="selectin",
    )

    __table_args__ = (
        CheckConstraint(
            "char_length(btrim(name)) > 0",
            name="name_not_blank",
        ),
        CheckConstraint(
            "status IN ('active', 'inactive', 'maintenance', 'decommissioned')",
            name="status_allowed",
        ),
        CheckConstraint(
            "parent_device_id IS NULL OR parent_device_id <> id",
            name="parent_not_self",
        ),
        Index(
            "uq_devices_site_id_name",
            "site_id",
            "name",
            unique=True,
        ),
        Index(
            "uq_devices_site_id_management_ip",
            "site_id",
            "management_ip",
            unique=True,
            postgresql_where=text("management_ip IS NOT NULL"),
        ),
        Index(
            "ix_devices_organization_id_status",
            "organization_id",
            "status",
        ),
        Index(
            "ix_devices_site_id_status",
            "site_id",
            "status",
        ),
        Index(
            "ix_devices_parent_device_id",
            "parent_device_id",
        ),
    )

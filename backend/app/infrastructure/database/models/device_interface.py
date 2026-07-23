"""SQLAlchemy model untuk interface perangkat MNOP."""

from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import INET, JSONB, MACADDR
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import false, text, true

from app.infrastructure.database import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.infrastructure.database.models.device import Device
    from app.infrastructure.database.models.monitoring_check import MonitoringCheck
    from app.infrastructure.database.models.network_link import NetworkLink


class DeviceInterface(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    """Interface fisik atau logis milik perangkat."""

    __tablename__ = "device_interfaces"

    device_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "devices.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    display_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    if_index: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    mac_address: Mapped[str | None] = mapped_column(
        MACADDR,
        nullable=True,
    )

    ip_address: Mapped[str | None] = mapped_column(
        INET,
        nullable=True,
    )

    interface_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    speed_bps: Mapped[int | None] = mapped_column(
        BigInteger,
        nullable=True,
    )

    admin_status: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    oper_status: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    is_uplink: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=false(),
    )

    is_wan: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=false(),
    )

    monitoring_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=true(),
    )

    metadata_: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        MutableDict.as_mutable(JSONB),
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )

    device: Mapped["Device"] = relationship(
        "Device",
        back_populates="interfaces",
        lazy="joined",
    )

    links_as_a: Mapped[list["NetworkLink"]] = relationship(
        "NetworkLink",
        back_populates="a_interface",
        foreign_keys="NetworkLink.a_interface_id",
        lazy="selectin",
    )

    links_as_z: Mapped[list["NetworkLink"]] = relationship(
        "NetworkLink",
        back_populates="z_interface",
        foreign_keys="NetworkLink.z_interface_id",
        lazy="selectin",
    )

    monitoring_checks: Mapped[list["MonitoringCheck"]] = relationship(
        "MonitoringCheck",
        back_populates="interface",
        lazy="selectin",
    )

    __table_args__ = (
        CheckConstraint(
            "char_length(btrim(name)) > 0",
            name="name_not_blank",
        ),
        CheckConstraint(
            "speed_bps IS NULL OR speed_bps >= 0",
            name="speed_bps_non_negative",
        ),
        CheckConstraint(
            "if_index IS NULL OR if_index > 0",
            name="if_index_positive",
        ),
        CheckConstraint(
            "admin_status IS NULL OR char_length(btrim(admin_status)) > 0",
            name="admin_status_not_blank",
        ),
        CheckConstraint(
            "oper_status IS NULL OR char_length(btrim(oper_status)) > 0",
            name="oper_status_not_blank",
        ),
        Index(
            "uq_device_interfaces_device_id_name",
            "device_id",
            "name",
            unique=True,
        ),
        Index(
            "ix_device_interfaces_device_id_if_index",
            "device_id",
            "if_index",
        ),
    )

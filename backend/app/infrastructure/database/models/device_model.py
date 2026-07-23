"""SQLAlchemy model untuk model perangkat MNOP."""

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import CheckConstraint, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database import (
    ActiveMixin,
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)

if TYPE_CHECKING:
    from app.infrastructure.database.models.device import Device
    from app.infrastructure.database.models.device_vendor import DeviceVendor


class DeviceModel(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    ActiveMixin,
    Base,
):
    """Model perangkat yang diproduksi oleh suatu vendor."""

    __tablename__ = "device_models"

    vendor_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "device_vendors.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    device_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    os_family: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    manufacturer_part_number: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    vendor: Mapped["DeviceVendor"] = relationship(
        "DeviceVendor",
        back_populates="models",
        lazy="joined",
    )

    devices: Mapped[list["Device"]] = relationship(
        "Device",
        back_populates="model",
        lazy="selectin",
    )

    __table_args__ = (
        UniqueConstraint(
            "vendor_id",
            "name",
            name="uq_device_models_vendor_id_name",
        ),
        CheckConstraint(
            "char_length(btrim(name)) > 0",
            name="name_not_blank",
        ),
        CheckConstraint(
            "device_type IN ("
            "'router', 'firewall', 'switch', 'access_point', 'radio', "
            "'server', 'virtual_machine', 'hypervisor', 'ups', 'printer', "
            "'cctv', 'snmp_device', 'other'"
            ")",
            name="device_type_allowed",
        ),
        Index(
            "ix_device_models_device_type",
            "device_type",
        ),
    )

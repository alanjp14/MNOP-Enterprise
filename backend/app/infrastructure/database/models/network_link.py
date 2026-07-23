"""SQLAlchemy model untuk koneksi topology jaringan MNOP."""

from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import BigInteger, CheckConstraint, ForeignKey, Index, String, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database import (
    ActiveMixin,
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)

if TYPE_CHECKING:
    from app.infrastructure.database.models.device_interface import DeviceInterface
    from app.infrastructure.database.models.organization import Organization
    from app.infrastructure.database.models.site import Site


class NetworkLink(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    ActiveMixin,
    Base,
):
    """Koneksi fisik atau logis antara dua interface perangkat."""

    __tablename__ = "network_links"

    organization_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    site_id: Mapped[UUID] = mapped_column(
        ForeignKey("sites.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    a_interface_id: Mapped[UUID] = mapped_column(
        ForeignKey("device_interfaces.id", ondelete="RESTRICT"),
        nullable=False,
    )
    z_interface_id: Mapped[UUID] = mapped_column(
        ForeignKey("device_interfaces.id", ondelete="RESTRICT"),
        nullable=False,
    )
    link_type: Mapped[str] = mapped_column(String(50), nullable=False)
    capacity_bps: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    provider_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    circuit_id: Mapped[str | None] = mapped_column(String(150), nullable=True)
    metadata_: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        MutableDict.as_mutable(JSONB),
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )

    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="network_links",
        lazy="joined",
    )
    site: Mapped["Site"] = relationship(
        "Site",
        back_populates="network_links",
        lazy="joined",
    )
    a_interface: Mapped["DeviceInterface"] = relationship(
        "DeviceInterface",
        back_populates="links_as_a",
        foreign_keys=[a_interface_id],
        lazy="joined",
    )
    z_interface: Mapped["DeviceInterface"] = relationship(
        "DeviceInterface",
        back_populates="links_as_z",
        foreign_keys=[z_interface_id],
        lazy="joined",
    )

    __table_args__ = (
        CheckConstraint("char_length(btrim(name)) > 0", name="name_not_blank"),
        CheckConstraint(
            "link_type IN ('wan', 'lan', 'trunk', 'access', 'fiber', "
            "'wireless', 'vpn', 'virtual', 'other')",
            name="link_type_allowed",
        ),
        CheckConstraint(
            "a_interface_id <> z_interface_id",
            name="interfaces_distinct",
        ),
        CheckConstraint(
            "capacity_bps IS NULL OR capacity_bps >= 0",
            name="capacity_bps_non_negative",
        ),
        Index(
            "uq_network_links_interface_pair",
            func.least(a_interface_id, z_interface_id),
            func.greatest(a_interface_id, z_interface_id),
            unique=True,
        ),
        Index("ix_network_links_organization_id_site_id", "organization_id", "site_id"),
    )

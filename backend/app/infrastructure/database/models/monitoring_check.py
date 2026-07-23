"""SQLAlchemy model untuk objek monitoring aktual MNOP."""

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Index, Integer, String, true
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.infrastructure.database.models.check_result import CheckResult
    from app.infrastructure.database.models.check_state import CheckState
    from app.infrastructure.database.models.device import Device
    from app.infrastructure.database.models.device_interface import DeviceInterface
    from app.infrastructure.database.models.monitoring_profile import MonitoringProfile
    from app.infrastructure.database.models.organization import Organization
    from app.infrastructure.database.models.site import Site


class MonitoringCheck(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Objek monitoring aktual untuk device atau interface."""

    __tablename__ = "monitoring_checks"

    organization_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    site_id: Mapped[UUID] = mapped_column(
        ForeignKey("sites.id", ondelete="RESTRICT"),
        nullable=False,
    )
    device_id: Mapped[UUID] = mapped_column(
        ForeignKey("devices.id", ondelete="RESTRICT"),
        nullable=False,
    )
    interface_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("device_interfaces.id", ondelete="SET NULL"),
        nullable=True,
    )
    profile_id: Mapped[UUID] = mapped_column(
        ForeignKey("monitoring_profiles.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    check_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_address: Mapped[str | None] = mapped_column(String(512), nullable=True)
    target_port: Mapped[int | None] = mapped_column(Integer, nullable=True)
    expected_status: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=true(),
    )

    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="monitoring_checks",
        lazy="joined",
    )
    site: Mapped["Site"] = relationship(
        "Site",
        back_populates="monitoring_checks",
        lazy="joined",
    )
    device: Mapped["Device"] = relationship(
        "Device",
        back_populates="monitoring_checks",
        lazy="joined",
    )
    interface: Mapped["DeviceInterface | None"] = relationship(
        "DeviceInterface",
        back_populates="monitoring_checks",
        lazy="joined",
    )
    profile: Mapped["MonitoringProfile"] = relationship(
        "MonitoringProfile",
        back_populates="checks",
        lazy="joined",
    )
    results: Mapped[list["CheckResult"]] = relationship(
        "CheckResult",
        back_populates="check",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="raise",
    )
    state: Mapped["CheckState | None"] = relationship(
        "CheckState",
        back_populates="check",
        cascade="all, delete-orphan",
        passive_deletes=True,
        uselist=False,
        lazy="joined",
    )

    __table_args__ = (
        CheckConstraint("char_length(btrim(name)) > 0", name="name_not_blank"),
        CheckConstraint(
            "check_type IN ('availability', 'latency', 'packet_loss', "
            "'interface_status', 'bandwidth', 'cpu', 'memory', 'storage', "
            "'temperature', 'service', 'api_response')",
            name="check_type_allowed",
        ),
        CheckConstraint(
            "target_port IS NULL OR target_port BETWEEN 1 AND 65535",
            name="target_port_range",
        ),
        CheckConstraint(
            "target_address IS NULL OR char_length(btrim(target_address)) > 0",
            name="target_address_not_blank",
        ),
        Index(
            "uq_monitoring_checks_device_id_name",
            "device_id",
            "name",
            unique=True,
        ),
        Index(
            "ix_monitoring_checks_organization_id_site_id_enabled",
            "organization_id",
            "site_id",
            "is_enabled",
        ),
        Index("ix_monitoring_checks_profile_id", "profile_id"),
    )

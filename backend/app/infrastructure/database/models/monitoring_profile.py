"""SQLAlchemy model untuk reusable monitoring profile MNOP."""

from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Integer,
    SmallInteger,
    String,
    UniqueConstraint,
    text,
)
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
    from app.infrastructure.database.models.monitoring_check import MonitoringCheck
    from app.infrastructure.database.models.organization import Organization


class MonitoringProfile(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    ActiveMixin,
    Base,
):
    """Konfigurasi monitoring reusable milik satu organization."""

    __tablename__ = "monitoring_profiles"

    organization_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    protocol: Mapped[str] = mapped_column(String(30), nullable=False)
    interval_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    timeout_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    retry_count: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False,
        default=0,
        server_default=text("0"),
    )
    parameters: Mapped[dict[str, Any]] = mapped_column(
        MutableDict.as_mutable(JSONB),
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )

    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="monitoring_profiles",
        lazy="joined",
    )
    checks: Mapped[list["MonitoringCheck"]] = relationship(
        "MonitoringCheck",
        back_populates="profile",
        lazy="selectin",
    )

    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "name",
            name="uq_monitoring_profiles_organization_id_name",
        ),
        CheckConstraint("char_length(btrim(name)) > 0", name="name_not_blank"),
        CheckConstraint(
            "protocol IN ('icmp', 'tcp', 'http', 'https', 'snmp', 'ssh', "
            "'api', 'winrm', 'vmware', 'hyper_v')",
            name="protocol_allowed",
        ),
        CheckConstraint("interval_seconds > 0", name="interval_seconds_positive"),
        CheckConstraint("timeout_seconds > 0", name="timeout_seconds_positive"),
        CheckConstraint(
            "timeout_seconds <= interval_seconds",
            name="timeout_not_exceed_interval",
        ),
        CheckConstraint("retry_count >= 0", name="retry_count_non_negative"),
    )

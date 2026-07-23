"""SQLAlchemy model untuk credential perangkat MNOP."""

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import CheckConstraint, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import BYTEA
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database import (
    ActiveMixin,
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)

if TYPE_CHECKING:
    from app.infrastructure.database.models.device import Device


class DeviceCredential(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    ActiveMixin,
    Base,
):
    """Credential perangkat yang secret-nya telah dienkripsi aplikasi."""

    __tablename__ = "device_credentials"

    device_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "devices.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    credential_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    username: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    encrypted_secret: Mapped[bytes] = mapped_column(
        BYTEA,
        nullable=False,
        deferred=True,
    )

    encryption_key_version: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    last_verified_at: Mapped[datetime | None] = mapped_column(
        nullable=True,
    )

    device: Mapped["Device"] = relationship(
        "Device",
        back_populates="credentials",
        lazy="joined",
    )

    __table_args__ = (
        CheckConstraint(
            "credential_type IN ("
            "'snmp_v2c', 'snmp_v3', 'ssh', 'api', 'winrm', 'vmware', 'hyper_v'"
            ")",
            name="credential_type_allowed",
        ),
        CheckConstraint(
            "octet_length(encrypted_secret) > 0",
            name="encrypted_secret_not_empty",
        ),
        CheckConstraint(
            "char_length(btrim(encryption_key_version)) > 0",
            name="encryption_key_version_not_blank",
        ),
        Index(
            "ix_device_credentials_device_id_credential_type",
            "device_id",
            "credential_type",
        ),
    )

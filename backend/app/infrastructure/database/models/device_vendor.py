"""SQLAlchemy model untuk vendor perangkat MNOP."""

from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database import (
    ActiveMixin,
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)

if TYPE_CHECKING:
    from app.infrastructure.database.models.device_model import DeviceModel


class DeviceVendor(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    ActiveMixin,
    Base,
):
    """Produsen perangkat yang didukung oleh MNOP."""

    __tablename__ = "device_vendors"

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    slug: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        unique=True,
    )

    website: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    models: Mapped[list["DeviceModel"]] = relationship(
        "DeviceModel",
        back_populates="vendor",
        lazy="selectin",
    )

    __table_args__ = (
        CheckConstraint(
            "char_length(btrim(name)) > 0",
            name="name_not_blank",
        ),
        CheckConstraint(
            "char_length(btrim(slug)) > 0",
            name="slug_not_blank",
        ),
        CheckConstraint(
            "slug = lower(slug)",
            name="slug_lowercase",
        ),
        CheckConstraint(
            "slug ~ '^[a-z0-9][a-z0-9-]*$'",
            name="slug_format",
        ),
    )

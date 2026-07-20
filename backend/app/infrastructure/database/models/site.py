"""SQLAlchemy model untuk site MNOP."""

from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database import (
    ActiveMixin,
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)

if TYPE_CHECKING:
    from app.infrastructure.database.models.organization import (
        Organization,
    )
    from app.infrastructure.database.models.user_role import UserRole


class Site(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    ActiveMixin,
    Base,
):
    """Lokasi operasional atau lokasi jaringan milik organization."""

    __tablename__ = "sites"

    organization_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "organizations.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    code: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    address: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    latitude: Mapped[Decimal | None] = mapped_column(
        Numeric(9, 6),
        nullable=True,
    )

    longitude: Mapped[Decimal | None] = mapped_column(
        Numeric(9, 6),
        nullable=True,
    )

    timezone: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default="Asia/Jakarta",
        server_default=text("'Asia/Jakarta'"),
    )

    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="sites",
        lazy="selectin",
    )

    user_role_assignments: Mapped[list["UserRole"]] = relationship(
        "UserRole",
        back_populates="site",
        lazy="selectin",
        passive_deletes=True,
    )

    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "code",
            name="uq_sites_organization_id_code",
        ),
        CheckConstraint(
            "char_length(btrim(code)) > 0",
            name="code_not_blank",
        ),
        CheckConstraint(
            "char_length(btrim(name)) > 0",
            name="name_not_blank",
        ),
        CheckConstraint(
            "char_length(btrim(timezone)) > 0",
            name="timezone_not_blank",
        ),
        CheckConstraint(
            "latitude IS NULL OR "
            "(latitude >= -90 AND latitude <= 90)",
            name="latitude_range",
        ),
        CheckConstraint(
            "longitude IS NULL OR "
            "(longitude >= -180 AND longitude <= 180)",
            name="longitude_range",
        ),
        Index(
            "ix_sites_organization_id_name",
            "organization_id",
            "name",
        ),
    )
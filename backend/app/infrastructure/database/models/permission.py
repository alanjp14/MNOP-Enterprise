"""SQLAlchemy model untuk permission RBAC MNOP."""

from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database import (
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)

if TYPE_CHECKING:
    from app.infrastructure.database.models.role_permission import (
        RolePermission,
    )


class Permission(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    """Permission granular yang dapat diberikan kepada role."""

    __tablename__ = "permissions"

    code: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        unique=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    module: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    role_assignments: Mapped[list["RolePermission"]] = relationship(
        "RolePermission",
        back_populates="permission",
        cascade="all, delete-orphan",
        lazy="selectin",
        passive_deletes=True,
    )

    __table_args__ = (
        CheckConstraint(
            "char_length(btrim(code)) > 0",
            name="code_not_blank",
        ),
        CheckConstraint(
            "code = lower(code)",
            name="code_lowercase",
        ),
        CheckConstraint(
            "code ~ '^[a-z0-9_]+[.][a-z0-9_.]+$'",
            name="code_format",
        ),
        CheckConstraint(
            "char_length(btrim(name)) > 0",
            name="name_not_blank",
        ),
        CheckConstraint(
            "char_length(btrim(module)) > 0",
            name="module_not_blank",
        ),
        CheckConstraint(
            "module = lower(module)",
            name="module_lowercase",
        ),
    )

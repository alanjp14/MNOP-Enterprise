"""SQLAlchemy model untuk role RBAC MNOP."""

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    String,
    Text,
    false,
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
    from app.infrastructure.database.models.role_permission import (
        RolePermission,
    )
    from app.infrastructure.database.models.user_role import UserRole


class Role(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    ActiveMixin,
    Base,
):
    """Role RBAC global atau milik suatu organization."""

    __tablename__ = "roles"

    organization_id: Mapped[UUID | None] = mapped_column(
        ForeignKey(
            "organizations.id",
            ondelete="RESTRICT",
        ),
        nullable=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    slug: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_system: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=false(),
    )

    organization: Mapped["Organization | None"] = relationship(
        "Organization",
        back_populates="roles",
        lazy="joined",
    )

    user_assignments: Mapped[list["UserRole"]] = relationship(
        "UserRole",
        back_populates="role",
        cascade="all, delete-orphan",
        lazy="selectin",
        passive_deletes=True,
    )

    permission_assignments: Mapped[list["RolePermission"]] = relationship(
        "RolePermission",
        back_populates="role",
        cascade="all, delete-orphan",
        lazy="selectin",
        passive_deletes=True,
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
            "slug ~ '^[a-z0-9][a-z0-9_-]*$'",
            name="slug_format",
        ),
        CheckConstraint(
            "("
            "is_system = true "
            "AND organization_id IS NULL"
            ") OR ("
            "is_system = false "
            "AND organization_id IS NOT NULL"
            ")",
            name="system_organization_consistency",
        ),
        Index(
            "uq_roles_system_slug",
            "slug",
            unique=True,
            postgresql_where=text("organization_id IS NULL"),
        ),
        Index(
            "uq_roles_organization_id_slug",
            "organization_id",
            "slug",
            unique=True,
            postgresql_where=text("organization_id IS NOT NULL"),
        ),
        Index(
            "ix_roles_organization_id_name",
            "organization_id",
            "name",
        ),
    )

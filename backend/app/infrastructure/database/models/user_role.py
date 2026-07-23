"""Association object antara user dan role MNOP."""

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database import (
    Base,
    UUIDPrimaryKeyMixin,
)

if TYPE_CHECKING:
    from app.infrastructure.database.models.role import Role
    from app.infrastructure.database.models.site import Site
    from app.infrastructure.database.models.user import User


class UserRole(
    UUIDPrimaryKeyMixin,
    Base,
):
    """Pemberian role kepada user secara global atau per site."""

    __tablename__ = "user_roles"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    role_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "roles.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    site_id: Mapped[UUID | None] = mapped_column(
        ForeignKey(
            "sites.id",
            ondelete="CASCADE",
        ),
        nullable=True,
    )

    assigned_by: Mapped[UUID | None] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="role_assignments",
        lazy="joined",
    )

    assigned_by_user: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[assigned_by],
        back_populates="assigned_role_assignments",
        lazy="joined",
    )

    role: Mapped["Role"] = relationship(
        "Role",
        back_populates="user_assignments",
        lazy="joined",
    )

    site: Mapped["Site | None"] = relationship(
        "Site",
        back_populates="user_role_assignments",
        lazy="joined",
    )

    __table_args__ = (
        Index(
            "uq_user_roles_global_assignment",
            "user_id",
            "role_id",
            unique=True,
            postgresql_where=text("site_id IS NULL"),
        ),
        Index(
            "uq_user_roles_site_assignment",
            "user_id",
            "role_id",
            "site_id",
            unique=True,
            postgresql_where=text("site_id IS NOT NULL"),
        ),
        Index(
            "ix_user_roles_site_id",
            "site_id",
        ),
        Index(
            "ix_user_roles_role_id",
            "role_id",
        ),
    )

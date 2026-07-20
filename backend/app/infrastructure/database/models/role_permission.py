"""Association object antara role dan permission MNOP."""

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.permission import Permission
    from app.infrastructure.database.models.role import Role


class RolePermission(Base):
    """Menghubungkan role dengan permission yang dimilikinya."""

    __tablename__ = "role_permissions"

    role_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "roles.id",
            ondelete="CASCADE",
        ),
        primary_key=True,
    )

    permission_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "permissions.id",
            ondelete="CASCADE",
        ),
        primary_key=True,
    )

    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    role: Mapped["Role"] = relationship(
        "Role",
        back_populates="permission_assignments",
        lazy="joined",
    )

    permission: Mapped["Permission"] = relationship(
        "Permission",
        back_populates="role_assignments",
        lazy="joined",
    )

    __table_args__ = (
        Index(
            "ix_role_permissions_permission_id",
            "permission_id",
        ),
    )
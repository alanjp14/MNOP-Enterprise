"""SQLAlchemy model untuk user MNOP."""

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
    false,
    true,
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


class User(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    ActiveMixin,
    Base,
):
    """Akun pengguna aplikasi MNOP."""

    __tablename__ = "users"

    organization_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "organizations.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    username: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(320),
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    is_superuser: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=false(),
    )

    must_change_password: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=true(),
    )

    last_login_at: Mapped[datetime | None] = mapped_column(
        nullable=True,
    )

    password_changed_at: Mapped[datetime | None] = mapped_column(
        nullable=True,
    )

    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="users",
        lazy="joined",
    )

    role_assignments: Mapped[list["UserRole"]] = relationship(
        "UserRole",
        foreign_keys="UserRole.user_id",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
        passive_deletes=True,
    )

    assigned_role_assignments: Mapped[list["UserRole"]] = relationship(
        "UserRole",
        foreign_keys="UserRole.assigned_by",
        back_populates="assigned_by_user",
        lazy="selectin",
    )

    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "username",
            name="uq_users_organization_id_username",
        ),
        UniqueConstraint(
            "organization_id",
            "email",
            name="uq_users_organization_id_email",
        ),
        CheckConstraint(
            "char_length(btrim(username)) >= 3",
            name="username_minimum_length",
        ),
        CheckConstraint(
            "username = lower(username)",
            name="username_lowercase",
        ),
        CheckConstraint(
            "char_length(btrim(email)) > 3",
            name="email_not_blank",
        ),
        CheckConstraint(
            "email = lower(email)",
            name="email_lowercase",
        ),
        CheckConstraint(
            "position('@' in email) > 1",
            name="email_format",
        ),
        CheckConstraint(
            "char_length(btrim(password_hash)) > 0",
            name="password_hash_not_blank",
        ),
        CheckConstraint(
            "char_length(btrim(full_name)) > 0",
            name="full_name_not_blank",
        ),
        Index(
            "ix_users_organization_id_is_active",
            "organization_id",
            "is_active",
        ),
        Index(
            "ix_users_organization_id_full_name",
            "organization_id",
            "full_name",
        ),
    )
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ProjectRoot = $PSScriptRoot

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    throw "Project root tidak dapat ditentukan."
}

$DatabaseDirectory = Join-Path `
    $ProjectRoot `
    "backend\app\infrastructure\database"

$ModelsDirectory = Join-Path `
    $DatabaseDirectory `
    "models"

$TestsDirectory = Join-Path `
    $ProjectRoot `
    "backend\tests"

function Write-Utf8NoBom {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [string]$Content
    )

    $ParentDirectory = Split-Path -Parent $Path

    if (-not (Test-Path $ParentDirectory)) {
        New-Item `
            -ItemType Directory `
            -Path $ParentDirectory `
            -Force | Out-Null
    }

    $Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

    [System.IO.File]::WriteAllText(
        $Path,
        $Content,
        $Utf8NoBom
    )

    Write-Host "Created/updated: $Path" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== MNOP IDENTITY AND RBAC MODELS ===" `
    -ForegroundColor Cyan
Write-Host ""

$OrganizationModelContent = @'
"""SQLAlchemy model untuk organization MNOP."""

from typing import TYPE_CHECKING, Any

from sqlalchemy import CheckConstraint, String, text
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
    from app.infrastructure.database.models.role import Role
    from app.infrastructure.database.models.site import Site
    from app.infrastructure.database.models.user import User


class Organization(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    ActiveMixin,
    Base,
):
    """Perusahaan atau tenant pemilik data MNOP."""

    __tablename__ = "organizations"

    code: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    timezone: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default="Asia/Jakarta",
        server_default=text("'Asia/Jakarta'"),
    )

    settings: Mapped[dict[str, Any]] = mapped_column(
        MutableDict.as_mutable(JSONB),
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )

    sites: Mapped[list["Site"]] = relationship(
        "Site",
        back_populates="organization",
        lazy="selectin",
    )

    users: Mapped[list["User"]] = relationship(
        "User",
        back_populates="organization",
        lazy="selectin",
    )

    roles: Mapped[list["Role"]] = relationship(
        "Role",
        back_populates="organization",
        lazy="selectin",
    )

    __table_args__ = (
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
    )
'@

$SiteModelContent = @'
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
'@

$UserModelContent = @'
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
'@

$RoleModelContent = @'
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
            postgresql_where=text(
                "organization_id IS NULL"
            ),
        ),
        Index(
            "uq_roles_organization_id_slug",
            "organization_id",
            "slug",
            unique=True,
            postgresql_where=text(
                "organization_id IS NOT NULL"
            ),
        ),
        Index(
            "ix_roles_organization_id_name",
            "organization_id",
            "name",
        ),
    )
'@

$PermissionModelContent = @'
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
'@

$UserRoleModelContent = @'
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
            postgresql_where=text(
                "site_id IS NULL"
            ),
        ),
        Index(
            "uq_user_roles_site_assignment",
            "user_id",
            "role_id",
            "site_id",
            unique=True,
            postgresql_where=text(
                "site_id IS NOT NULL"
            ),
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
'@

$RolePermissionModelContent = @'
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
'@

$ModelsInitContent = @'
"""Registrasi seluruh SQLAlchemy model MNOP."""

from app.infrastructure.database.models.organization import Organization
from app.infrastructure.database.models.permission import Permission
from app.infrastructure.database.models.role import Role
from app.infrastructure.database.models.role_permission import (
    RolePermission,
)
from app.infrastructure.database.models.site import Site
from app.infrastructure.database.models.user import User
from app.infrastructure.database.models.user_role import UserRole

__all__ = (
    "Organization",
    "Permission",
    "Role",
    "RolePermission",
    "Site",
    "User",
    "UserRole",
)
'@

$TestContent = @'
"""Tests untuk model Identity dan RBAC MNOP."""

from typing import Any

from sqlalchemy import CheckConstraint, Index, UniqueConstraint

from app.infrastructure.database import Base
from app.infrastructure.database.models import (
    Organization,
    Permission,
    Role,
    RolePermission,
    Site,
    User,
    UserRole,
)


def get_constraint_names(
    model: Any,
    constraint_type: type[CheckConstraint] | type[UniqueConstraint],
) -> set[str | None]:
    """Mengambil nama constraint berdasarkan jenisnya."""

    return {
        constraint.name
        for constraint in model.__table__.constraints
        if isinstance(constraint, constraint_type)
    }


def get_indexes(model: Any) -> dict[str, Index]:
    """Mengambil index model berdasarkan nama."""

    return {
        str(index.name): index
        for index in model.__table__.indexes
        if index.name is not None
    }


def test_identity_tables_registered_in_metadata() -> None:
    """Seluruh tabel Identity dan RBAC harus terdaftar."""

    expected_tables = {
        "organizations",
        "sites",
        "users",
        "roles",
        "permissions",
        "user_roles",
        "role_permissions",
    }

    assert expected_tables.issubset(
        set(Base.metadata.tables.keys())
    )


def test_user_organization_foreign_key() -> None:
    """User harus dimiliki satu organization."""

    foreign_keys = User.__table__.c.organization_id.foreign_keys

    assert len(foreign_keys) == 1

    foreign_key = next(iter(foreign_keys))

    assert foreign_key.target_fullname == "organizations.id"
    assert foreign_key.ondelete == "RESTRICT"


def test_user_unique_constraints() -> None:
    """Username dan email unik dalam satu organization."""

    unique_names = get_constraint_names(
        User,
        UniqueConstraint,
    )

    assert "uq_users_organization_id_username" in unique_names
    assert "uq_users_organization_id_email" in unique_names


def test_user_security_columns() -> None:
    """User harus memiliki kolom keamanan utama."""

    table = User.__table__

    assert table.c.password_hash.nullable is False
    assert table.c.is_superuser.nullable is False
    assert table.c.must_change_password.nullable is False
    assert table.c.is_active.nullable is False

    assert table.c.is_superuser.server_default is not None
    assert table.c.must_change_password.server_default is not None


def test_user_validation_constraints() -> None:
    """User harus memiliki constraint validasi."""

    check_names = get_constraint_names(
        User,
        CheckConstraint,
    )

    assert "ck_users_username_minimum_length" in check_names
    assert "ck_users_username_lowercase" in check_names
    assert "ck_users_email_not_blank" in check_names
    assert "ck_users_email_lowercase" in check_names
    assert "ck_users_email_format" in check_names
    assert "ck_users_password_hash_not_blank" in check_names
    assert "ck_users_full_name_not_blank" in check_names


def test_role_partial_unique_indexes() -> None:
    """Role harus unik untuk system dan organization."""

    indexes = get_indexes(Role)

    system_index = indexes["uq_roles_system_slug"]
    organization_index = indexes[
        "uq_roles_organization_id_slug"
    ]

    assert system_index.unique is True
    assert organization_index.unique is True

    assert (
        system_index.dialect_options["postgresql"]["where"]
        is not None
    )

    assert (
        organization_index.dialect_options["postgresql"]["where"]
        is not None
    )


def test_role_validation_constraints() -> None:
    """Role harus memiliki validasi slug dan scope."""

    check_names = get_constraint_names(
        Role,
        CheckConstraint,
    )

    assert "ck_roles_name_not_blank" in check_names
    assert "ck_roles_slug_not_blank" in check_names
    assert "ck_roles_slug_lowercase" in check_names
    assert "ck_roles_slug_format" in check_names
    assert (
        "ck_roles_system_organization_consistency"
        in check_names
    )


def test_permission_unique_code() -> None:
    """Permission code harus unik secara global."""

    unique_names = get_constraint_names(
        Permission,
        UniqueConstraint,
    )

    check_names = get_constraint_names(
        Permission,
        CheckConstraint,
    )

    assert "uq_permissions_code" in unique_names
    assert "ck_permissions_code_not_blank" in check_names
    assert "ck_permissions_code_lowercase" in check_names
    assert "ck_permissions_code_format" in check_names


def test_user_role_foreign_keys() -> None:
    """UserRole harus mempunyai seluruh foreign key."""

    table = UserRole.__table__

    user_fk = next(iter(table.c.user_id.foreign_keys))
    role_fk = next(iter(table.c.role_id.foreign_keys))
    site_fk = next(iter(table.c.site_id.foreign_keys))
    assigned_by_fk = next(
        iter(table.c.assigned_by.foreign_keys)
    )

    assert user_fk.target_fullname == "users.id"
    assert user_fk.ondelete == "CASCADE"

    assert role_fk.target_fullname == "roles.id"
    assert role_fk.ondelete == "CASCADE"

    assert site_fk.target_fullname == "sites.id"
    assert site_fk.ondelete == "CASCADE"

    assert assigned_by_fk.target_fullname == "users.id"
    assert assigned_by_fk.ondelete == "SET NULL"


def test_user_role_partial_unique_indexes() -> None:
    """Role assignment tidak boleh duplikat."""

    indexes = get_indexes(UserRole)

    global_index = indexes[
        "uq_user_roles_global_assignment"
    ]

    site_index = indexes[
        "uq_user_roles_site_assignment"
    ]

    assert global_index.unique is True
    assert site_index.unique is True

    assert (
        global_index.dialect_options["postgresql"]["where"]
        is not None
    )

    assert (
        site_index.dialect_options["postgresql"]["where"]
        is not None
    )


def test_role_permission_composite_primary_key() -> None:
    """RolePermission menggunakan composite primary key."""

    primary_key_columns = [
        column.name
        for column in RolePermission.__table__.primary_key.columns
    ]

    assert primary_key_columns == [
        "role_id",
        "permission_id",
    ]

    assert (
        RolePermission.__table__.primary_key.name
        == "pk_role_permissions"
    )


def test_identity_relationships_are_bidirectional() -> None:
    """Relasi Identity dan RBAC harus dua arah."""

    assert (
        Organization.users.property.back_populates
        == "organization"
    )

    assert (
        User.organization.property.back_populates
        == "users"
    )

    assert (
        Organization.roles.property.back_populates
        == "organization"
    )

    assert (
        Role.organization.property.back_populates
        == "roles"
    )

    assert (
        User.role_assignments.property.back_populates
        == "user"
    )

    assert (
        Role.user_assignments.property.back_populates
        == "role"
    )

    assert (
        Role.permission_assignments.property.back_populates
        == "role"
    )

    assert (
        Permission.role_assignments.property.back_populates
        == "permission"
    )

    assert (
        Site.user_role_assignments.property.back_populates
        == "site"
    )
'@

Write-Utf8NoBom `
    -Path (
        Join-Path `
            $ModelsDirectory `
            "organization.py"
    ) `
    -Content $OrganizationModelContent

Write-Utf8NoBom `
    -Path (
        Join-Path `
            $ModelsDirectory `
            "site.py"
    ) `
    -Content $SiteModelContent

Write-Utf8NoBom `
    -Path (
        Join-Path `
            $ModelsDirectory `
            "user.py"
    ) `
    -Content $UserModelContent

Write-Utf8NoBom `
    -Path (
        Join-Path `
            $ModelsDirectory `
            "role.py"
    ) `
    -Content $RoleModelContent

Write-Utf8NoBom `
    -Path (
        Join-Path `
            $ModelsDirectory `
            "permission.py"
    ) `
    -Content $PermissionModelContent

Write-Utf8NoBom `
    -Path (
        Join-Path `
            $ModelsDirectory `
            "user_role.py"
    ) `
    -Content $UserRoleModelContent

Write-Utf8NoBom `
    -Path (
        Join-Path `
            $ModelsDirectory `
            "role_permission.py"
    ) `
    -Content $RolePermissionModelContent

Write-Utf8NoBom `
    -Path (
        Join-Path `
            $ModelsDirectory `
            "__init__.py"
    ) `
    -Content $ModelsInitContent

Write-Utf8NoBom `
    -Path (
        Join-Path `
            $TestsDirectory `
            "test_identity_rbac_models.py"
    ) `
    -Content $TestContent

Write-Host ""
Write-Host "Identity dan RBAC models berhasil dibuat." `
    -ForegroundColor Green
Write-Host ""

Write-Host "Model files:" -ForegroundColor Cyan

Get-ChildItem `
    -Path $ModelsDirectory `
    -File |
    Sort-Object Name |
    Select-Object Name, Length

Write-Host ""
Write-Host "Test file:" -ForegroundColor Cyan

Get-Item (
    Join-Path `
        $TestsDirectory `
        "test_identity_rbac_models.py"
) |
Select-Object Name, Length
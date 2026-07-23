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

    return {str(index.name): index for index in model.__table__.indexes if index.name is not None}


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

    assert expected_tables.issubset(set(Base.metadata.tables.keys()))


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
    organization_index = indexes["uq_roles_organization_id_slug"]

    assert system_index.unique is True
    assert organization_index.unique is True

    assert system_index.dialect_options["postgresql"]["where"] is not None

    assert organization_index.dialect_options["postgresql"]["where"] is not None


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
    assert "ck_roles_system_organization_consistency" in check_names


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
    assigned_by_fk = next(iter(table.c.assigned_by.foreign_keys))

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

    global_index = indexes["uq_user_roles_global_assignment"]

    site_index = indexes["uq_user_roles_site_assignment"]

    assert global_index.unique is True
    assert site_index.unique is True

    assert global_index.dialect_options["postgresql"]["where"] is not None

    assert site_index.dialect_options["postgresql"]["where"] is not None


def test_role_permission_composite_primary_key() -> None:
    """RolePermission menggunakan composite primary key."""

    primary_key_columns = [column.name for column in RolePermission.__table__.primary_key.columns]

    assert primary_key_columns == [
        "role_id",
        "permission_id",
    ]

    assert RolePermission.__table__.primary_key.name == "pk_role_permissions"


def test_identity_relationships_are_bidirectional() -> None:
    """Relasi Identity dan RBAC harus dua arah."""

    assert Organization.users.property.back_populates == "organization"

    assert User.organization.property.back_populates == "users"

    assert Organization.roles.property.back_populates == "organization"

    assert Role.organization.property.back_populates == "roles"

    assert User.role_assignments.property.back_populates == "user"

    assert Role.user_assignments.property.back_populates == "role"

    assert Role.permission_assignments.property.back_populates == "role"

    assert Permission.role_assignments.property.back_populates == "permission"

    assert Site.user_role_assignments.property.back_populates == "site"

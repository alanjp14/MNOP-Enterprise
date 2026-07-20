"""Tests untuk shared SQLAlchemy database foundation."""

from sqlalchemy import DateTime, Uuid

from app.infrastructure.database import (
    ActiveMixin,
    Base,
    SoftDeleteMixin,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)


class FoundationTestModel(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    ActiveMixin,
    SoftDeleteMixin,
    Base,
):
    """Temporary model untuk menguji shared database foundation."""

    __tablename__ = "foundation_test_models"


def test_base_uses_constraint_naming_convention() -> None:
    """Base metadata harus menggunakan nama constraint deterministik."""

    naming_convention = Base.metadata.naming_convention

    assert naming_convention is not None
    assert naming_convention["pk"] == "pk_%(table_name)s"
    assert naming_convention["fk"] == (
        "fk_%(table_name)s_"
        "%(column_0_name)s_"
        "%(referred_table_name)s"
    )


def test_uuid_primary_key_mixin() -> None:
    """UUID mixin harus menghasilkan primary key UUID."""

    id_column = FoundationTestModel.__table__.c.id

    assert id_column.primary_key is True
    assert id_column.nullable is False
    assert isinstance(id_column.type, Uuid)
    assert id_column.default is not None


def test_timestamp_mixin() -> None:
    """Timestamp harus timezone-aware dan memiliki default database."""

    table = FoundationTestModel.__table__

    created_at_column = table.c.created_at
    updated_at_column = table.c.updated_at

    assert isinstance(created_at_column.type, DateTime)
    assert created_at_column.type.timezone is True
    assert created_at_column.server_default is not None

    assert isinstance(updated_at_column.type, DateTime)
    assert updated_at_column.type.timezone is True
    assert updated_at_column.server_default is not None
    assert updated_at_column.onupdate is not None


def test_active_mixin() -> None:
    """Master data harus aktif secara default."""

    is_active_column = FoundationTestModel.__table__.c.is_active

    assert is_active_column.nullable is False
    assert is_active_column.default is not None
    assert is_active_column.server_default is not None


def test_soft_delete_mixin() -> None:
    """Soft delete timestamp harus nullable."""

    deleted_at_column = FoundationTestModel.__table__.c.deleted_at

    assert deleted_at_column.nullable is True


def test_primary_key_constraint_name() -> None:
    """Primary key harus mengikuti naming convention."""

    primary_key = FoundationTestModel.__table__.primary_key

    assert primary_key.name == "pk_foundation_test_models"
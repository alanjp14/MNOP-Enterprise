$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ProjectRoot = $PSScriptRoot

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    throw "Project root tidak dapat ditentukan. Jalankan script dari file .ps1."
}

$DatabaseDirectory = Join-Path `
    $ProjectRoot `
    "backend\app\infrastructure\database"

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
Write-Host "=== MNOP DATABASE FOUNDATION ===" -ForegroundColor Cyan
Write-Host ""

$NamingConventionContent = @'
"""SQLAlchemy constraint naming convention untuk database MNOP."""

from typing import Final

from sqlalchemy import MetaData


NAMING_CONVENTION: Final[dict[str, str]] = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": (
        "fk_%(table_name)s_"
        "%(column_0_name)s_"
        "%(referred_table_name)s"
    ),
    "pk": "pk_%(table_name)s",
}

convention_metadata = MetaData(
    naming_convention=NAMING_CONVENTION,
)
'@

$TypesContent = @'
"""Reusable SQLAlchemy type annotation mapping untuk model MNOP."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Uuid


SQLALCHEMY_TYPE_ANNOTATION_MAP = {
    UUID: Uuid(as_uuid=True),
    datetime: DateTime(timezone=True),
}
'@

$MixinsContent = @'
"""Reusable SQLAlchemy model mixins untuk database MNOP."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Uuid, func, true
from sqlalchemy.orm import Mapped, mapped_column


class UUIDPrimaryKeyMixin:
    """Menyediakan UUID primary key yang dibuat oleh aplikasi."""

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )


class TimestampMixin:
    """Menyediakan timestamp pembuatan dan pembaruan data."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class ActiveMixin:
    """Menyediakan status aktif untuk master data."""

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=true(),
    )


class SoftDeleteMixin:
    """Menyediakan dukungan soft delete."""

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )
'@

$BaseContent = @'
"""Declarative base seluruh SQLAlchemy ORM model MNOP."""

from sqlalchemy.orm import DeclarativeBase

from app.infrastructure.database.naming_convention import (
    convention_metadata,
)
from app.infrastructure.database.types import (
    SQLALCHEMY_TYPE_ANNOTATION_MAP,
)


class Base(DeclarativeBase):
    """Base class seluruh SQLAlchemy ORM model MNOP."""

    metadata = convention_metadata
    type_annotation_map = SQLALCHEMY_TYPE_ANNOTATION_MAP
'@

$DatabaseInitContent = @'
"""Database infrastructure exports."""

from app.infrastructure.database.base import Base
from app.infrastructure.database.mixins import (
    ActiveMixin,
    SoftDeleteMixin,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)

__all__ = (
    "ActiveMixin",
    "Base",
    "SoftDeleteMixin",
    "TimestampMixin",
    "UUIDPrimaryKeyMixin",
)
'@

$TestContent = @'
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
'@

Write-Utf8NoBom `
    -Path (
        Join-Path `
            $DatabaseDirectory `
            "naming_convention.py"
    ) `
    -Content $NamingConventionContent

Write-Utf8NoBom `
    -Path (
        Join-Path `
            $DatabaseDirectory `
            "types.py"
    ) `
    -Content $TypesContent

Write-Utf8NoBom `
    -Path (
        Join-Path `
            $DatabaseDirectory `
            "mixins.py"
    ) `
    -Content $MixinsContent

Write-Utf8NoBom `
    -Path (
        Join-Path `
            $DatabaseDirectory `
            "base.py"
    ) `
    -Content $BaseContent

Write-Utf8NoBom `
    -Path (
        Join-Path `
            $DatabaseDirectory `
            "__init__.py"
    ) `
    -Content $DatabaseInitContent

Write-Utf8NoBom `
    -Path (
        Join-Path `
            $TestsDirectory `
            "test_database_foundation.py"
    ) `
    -Content $TestContent

Write-Host ""
Write-Host "Database foundation berhasil dibuat." -ForegroundColor Green
Write-Host ""
Write-Host "Files:" -ForegroundColor Cyan

Get-ChildItem `
    -Path $DatabaseDirectory `
    -File |
    Sort-Object Name |
    Select-Object Name, Length

Write-Host ""
Write-Host "Test file:" -ForegroundColor Cyan

Get-Item (
    Join-Path `
        $TestsDirectory `
        "test_database_foundation.py"
) |
Select-Object Name, Length
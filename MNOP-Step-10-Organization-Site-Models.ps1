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

$AlembicEnvPath = Join-Path `
    $ProjectRoot `
    "backend\alembic\env.py"

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
Write-Host "=== MNOP ORGANIZATION AND SITE MODELS ===" `
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
    from app.infrastructure.database.models.site import Site


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

$ModelsInitContent = @'
"""Registrasi seluruh SQLAlchemy model MNOP."""

from app.infrastructure.database.models.organization import Organization
from app.infrastructure.database.models.site import Site

__all__ = (
    "Organization",
    "Site",
)
'@

$TestContent = @'
"""Tests untuk model Organization dan Site."""

from sqlalchemy import CheckConstraint, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB

from app.infrastructure.database import Base
from app.infrastructure.database.models import Organization, Site


def get_constraint_names(
    model: type[Organization] | type[Site],
    constraint_type: type[CheckConstraint] | type[UniqueConstraint],
) -> set[str | None]:
    """Mengambil nama constraint berdasarkan jenisnya."""

    return {
        constraint.name
        for constraint in model.__table__.constraints
        if isinstance(constraint, constraint_type)
    }


def get_index_names(
    model: type[Organization] | type[Site],
) -> set[str | None]:
    """Mengambil seluruh nama index model."""

    return {
        index.name
        for index in model.__table__.indexes
        if isinstance(index, Index)
    }


def test_models_are_registered_in_base_metadata() -> None:
    """Organization dan site harus terdaftar di metadata."""

    assert "organizations" in Base.metadata.tables
    assert "sites" in Base.metadata.tables


def test_organization_columns() -> None:
    """Organization harus mempunyai kolom inti."""

    table = Organization.__table__

    assert table.c.code.nullable is False
    assert table.c.name.nullable is False
    assert table.c.timezone.nullable is False
    assert table.c.settings.nullable is False
    assert isinstance(table.c.settings.type, JSONB)
    assert table.c.settings.server_default is not None


def test_organization_constraints() -> None:
    """Organization harus mempunyai unique dan check constraint."""

    unique_names = get_constraint_names(
        Organization,
        UniqueConstraint,
    )

    check_names = get_constraint_names(
        Organization,
        CheckConstraint,
    )

    assert "uq_organizations_code" in unique_names
    assert "ck_organizations_code_not_blank" in check_names
    assert "ck_organizations_name_not_blank" in check_names
    assert "ck_organizations_timezone_not_blank" in check_names


def test_site_organization_foreign_key() -> None:
    """Site harus terhubung ke organization."""

    foreign_keys = Site.__table__.c.organization_id.foreign_keys

    assert len(foreign_keys) == 1

    foreign_key = next(iter(foreign_keys))

    assert foreign_key.target_fullname == "organizations.id"
    assert foreign_key.ondelete == "RESTRICT"


def test_site_constraints() -> None:
    """Site harus memiliki unique dan validasi koordinat."""

    unique_names = get_constraint_names(
        Site,
        UniqueConstraint,
    )

    check_names = get_constraint_names(
        Site,
        CheckConstraint,
    )

    assert "uq_sites_organization_id_code" in unique_names
    assert "ck_sites_code_not_blank" in check_names
    assert "ck_sites_name_not_blank" in check_names
    assert "ck_sites_timezone_not_blank" in check_names
    assert "ck_sites_latitude_range" in check_names
    assert "ck_sites_longitude_range" in check_names


def test_site_indexes() -> None:
    """Site harus memiliki index pencarian per organization."""

    index_names = get_index_names(Site)

    assert "ix_sites_organization_id_name" in index_names


def test_organization_site_relationship() -> None:
    """Relasi organization dan site harus dua arah."""

    assert Organization.sites.property.back_populates == "organization"
    assert Site.organization.property.back_populates == "sites"
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
            "__init__.py"
    ) `
    -Content $ModelsInitContent

Write-Utf8NoBom `
    -Path (
        Join-Path `
            $TestsDirectory `
            "test_organization_site_models.py"
    ) `
    -Content $TestContent

if (-not (Test-Path $AlembicEnvPath)) {
    throw "File Alembic env.py tidak ditemukan: $AlembicEnvPath"
}

$AlembicEnvContent = Get-Content `
    -Path $AlembicEnvPath `
    -Raw

$BaseImport = `
    "from app.infrastructure.database.base import Base"

$ModelsImport = `
    "from app.infrastructure.database import models as database_models  # noqa: F401"

if (-not $AlembicEnvContent.Contains($ModelsImport)) {
    if (-not $AlembicEnvContent.Contains($BaseImport)) {
        throw "Import Base tidak ditemukan di Alembic env.py."
    }

    $AlembicEnvContent = $AlembicEnvContent.Replace(
        $BaseImport,
        "$BaseImport`r`n$ModelsImport"
    )

    Write-Utf8NoBom `
        -Path $AlembicEnvPath `
        -Content $AlembicEnvContent
}
else {
    Write-Host `
        "Alembic model registration sudah tersedia." `
        -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Organization dan Site model berhasil dibuat." `
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
        "test_organization_site_models.py"
) |
Select-Object Name, Length
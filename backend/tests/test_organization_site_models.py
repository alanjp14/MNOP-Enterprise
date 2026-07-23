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

    return {index.name for index in model.__table__.indexes if isinstance(index, Index)}


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

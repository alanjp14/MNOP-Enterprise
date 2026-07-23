"""Tests untuk model device inventory."""

from typing import Any

from sqlalchemy import CheckConstraint, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import BYTEA, INET, JSONB, MACADDR

from app.infrastructure.database import Base
from app.infrastructure.database.models import (
    Device,
    DeviceCredential,
    DeviceInterface,
    DeviceModel,
    DeviceVendor,
    Organization,
    Site,
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


def get_index_names(model: Any) -> set[str | None]:
    """Mengambil nama index model."""

    return {index.name for index in model.__table__.indexes if isinstance(index, Index)}


def get_foreign_key(model: Any, column_name: str) -> Any:
    """Mengambil satu foreign key dari kolom model."""

    foreign_keys = model.__table__.c[column_name].foreign_keys
    assert len(foreign_keys) == 1
    return next(iter(foreign_keys))


def test_device_inventory_tables_registered_in_metadata() -> None:
    """Seluruh tabel device inventory harus terdaftar."""

    assert {
        "device_vendors",
        "device_models",
        "devices",
        "device_credentials",
        "device_interfaces",
    }.issubset(Base.metadata.tables)


def test_device_vendor_constraints() -> None:
    """Vendor harus mempunyai slug global yang valid dan unik."""

    unique_names = get_constraint_names(DeviceVendor, UniqueConstraint)
    check_names = get_constraint_names(DeviceVendor, CheckConstraint)

    assert "uq_device_vendors_slug" in unique_names
    assert "ck_device_vendors_name_not_blank" in check_names
    assert "ck_device_vendors_slug_lowercase" in check_names
    assert "ck_device_vendors_slug_format" in check_names


def test_device_model_constraints_and_vendor_relationship() -> None:
    """Model perangkat harus unik per vendor dan bertipe valid."""

    foreign_key = get_foreign_key(DeviceModel, "vendor_id")
    unique_names = get_constraint_names(DeviceModel, UniqueConstraint)
    check_names = get_constraint_names(DeviceModel, CheckConstraint)

    assert foreign_key.target_fullname == "device_vendors.id"
    assert foreign_key.ondelete == "RESTRICT"
    assert "uq_device_models_vendor_id_name" in unique_names
    assert "ck_device_models_device_type_allowed" in check_names
    assert DeviceVendor.models.property.back_populates == "vendor"
    assert DeviceModel.vendor.property.back_populates == "models"


def test_device_foreign_keys_use_safe_delete_policies() -> None:
    """Relasi device harus menjaga master dan melepaskan referensi opsional."""

    expected = {
        "organization_id": ("organizations.id", "RESTRICT"),
        "site_id": ("sites.id", "RESTRICT"),
        "model_id": ("device_models.id", "SET NULL"),
        "parent_device_id": ("devices.id", "SET NULL"),
    }

    for column_name, (target, ondelete) in expected.items():
        foreign_key = get_foreign_key(Device, column_name)
        assert foreign_key.target_fullname == target
        assert foreign_key.ondelete == ondelete


def test_device_constraints_and_indexes() -> None:
    """Device harus memvalidasi status dan keunikan dalam site."""

    check_names = get_constraint_names(Device, CheckConstraint)
    index_names = get_index_names(Device)

    assert "ck_devices_name_not_blank" in check_names
    assert "ck_devices_status_allowed" in check_names
    assert "ck_devices_parent_not_self" in check_names
    assert "uq_devices_site_id_name" in index_names
    assert "uq_devices_site_id_management_ip" in index_names
    assert "ix_devices_organization_id_status" in index_names
    assert isinstance(Device.__table__.c.management_ip.type, INET)
    assert isinstance(Device.__table__.c["metadata"].type, JSONB)


def test_device_credential_protects_secret_column() -> None:
    """Encrypted secret harus biner, wajib, dan tidak dimuat secara default."""

    foreign_key = get_foreign_key(DeviceCredential, "device_id")
    check_names = get_constraint_names(DeviceCredential, CheckConstraint)

    assert foreign_key.ondelete == "CASCADE"
    assert isinstance(DeviceCredential.__table__.c.encrypted_secret.type, BYTEA)
    assert DeviceCredential.__table__.c.encrypted_secret.nullable is False
    assert DeviceCredential.encrypted_secret.property.deferred is True
    assert "ck_device_credentials_credential_type_allowed" in check_names
    assert "ck_device_credentials_encrypted_secret_not_empty" in check_names


def test_device_interface_constraints_and_types() -> None:
    """Interface harus unik per device dan memakai tipe PostgreSQL yang tepat."""

    foreign_key = get_foreign_key(DeviceInterface, "device_id")
    check_names = get_constraint_names(DeviceInterface, CheckConstraint)
    index_names = get_index_names(DeviceInterface)
    table = DeviceInterface.__table__

    assert foreign_key.ondelete == "CASCADE"
    assert isinstance(table.c.mac_address.type, MACADDR)
    assert isinstance(table.c.ip_address.type, INET)
    assert isinstance(table.c["metadata"].type, JSONB)
    assert "ck_device_interfaces_speed_bps_non_negative" in check_names
    assert "ck_device_interfaces_if_index_positive" in check_names
    assert "uq_device_interfaces_device_id_name" in index_names


def test_device_relationships_are_bidirectional() -> None:
    """Relasi inventory utama harus dapat dinavigasi dua arah."""

    assert Organization.devices.property.back_populates == "organization"
    assert Site.devices.property.back_populates == "site"
    assert Device.model.property.back_populates == "devices"
    assert Device.parent.property.back_populates == "children"
    assert Device.credentials.property.back_populates == "device"
    assert Device.interfaces.property.back_populates == "device"

"""Tests untuk model network topology dan monitoring."""

from typing import Any

from sqlalchemy import BigInteger, CheckConstraint, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB

from app.infrastructure.database import Base
from app.infrastructure.database.models import (
    CheckResult,
    CheckState,
    Device,
    DeviceInterface,
    MonitoringCheck,
    MonitoringProfile,
    NetworkLink,
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


def test_network_monitoring_tables_registered_in_metadata() -> None:
    """Seluruh tabel topology dan monitoring harus terdaftar."""

    assert {
        "network_links",
        "monitoring_profiles",
        "monitoring_checks",
        "check_results",
        "check_states",
    }.issubset(Base.metadata.tables)


def test_network_link_constraints_and_order_independent_pair_index() -> None:
    """Link harus valid dan pasangan interface unik tanpa bergantung arah."""

    check_names = get_constraint_names(NetworkLink, CheckConstraint)
    index_names = get_index_names(NetworkLink)

    assert "ck_network_links_name_not_blank" in check_names
    assert "ck_network_links_link_type_allowed" in check_names
    assert "ck_network_links_interfaces_distinct" in check_names
    assert "ck_network_links_capacity_bps_non_negative" in check_names
    assert "uq_network_links_interface_pair" in index_names
    pair_index = next(
        index
        for index in NetworkLink.__table__.indexes
        if index.name == "uq_network_links_interface_pair"
    )
    assert pair_index.unique is True


def test_network_link_foreign_keys_protect_topology_integrity() -> None:
    """Master dan endpoint link tidak boleh terhapus selama masih direferensikan."""

    expected = {
        "organization_id": "organizations.id",
        "site_id": "sites.id",
        "a_interface_id": "device_interfaces.id",
        "z_interface_id": "device_interfaces.id",
    }

    for column_name, target in expected.items():
        foreign_key = get_foreign_key(NetworkLink, column_name)
        assert foreign_key.target_fullname == target
        assert foreign_key.ondelete == "RESTRICT"


def test_monitoring_profile_constraints() -> None:
    """Profile harus unik per tenant dan mempunyai jadwal valid."""

    unique_names = get_constraint_names(MonitoringProfile, UniqueConstraint)
    check_names = get_constraint_names(MonitoringProfile, CheckConstraint)

    assert "uq_monitoring_profiles_organization_id_name" in unique_names
    assert "ck_monitoring_profiles_protocol_allowed" in check_names
    assert "ck_monitoring_profiles_interval_seconds_positive" in check_names
    assert "ck_monitoring_profiles_timeout_seconds_positive" in check_names
    assert "ck_monitoring_profiles_timeout_not_exceed_interval" in check_names
    assert "ck_monitoring_profiles_retry_count_non_negative" in check_names
    assert isinstance(MonitoringProfile.__table__.c.parameters.type, JSONB)


def test_monitoring_check_constraints_and_delete_policies() -> None:
    """Check harus valid dan menjaga referensi master secara aman."""

    check_names = get_constraint_names(MonitoringCheck, CheckConstraint)
    index_names = get_index_names(MonitoringCheck)
    expected_deletes = {
        "organization_id": "RESTRICT",
        "site_id": "RESTRICT",
        "device_id": "RESTRICT",
        "interface_id": "SET NULL",
        "profile_id": "RESTRICT",
    }

    for column_name, ondelete in expected_deletes.items():
        assert get_foreign_key(MonitoringCheck, column_name).ondelete == ondelete

    assert "ck_monitoring_checks_check_type_allowed" in check_names
    assert "ck_monitoring_checks_target_port_range" in check_names
    assert "ck_monitoring_checks_target_address_not_blank" in check_names
    assert "uq_monitoring_checks_device_id_name" in index_names
    assert "ix_monitoring_checks_organization_id_site_id_enabled" in index_names


def test_check_result_is_append_oriented_and_indexed_for_dashboard_queries() -> None:
    """Result memakai bigint dan index time-series yang dibutuhkan query utama."""

    check_names = get_constraint_names(CheckResult, CheckConstraint)
    index_names = get_index_names(CheckResult)
    table = CheckResult.__table__

    assert isinstance(table.c.id.type, BigInteger)
    assert table.c.id.autoincrement is True
    assert get_foreign_key(CheckResult, "check_id").ondelete == "CASCADE"
    assert "ck_check_results_status_allowed" in check_names
    assert "ck_check_results_packet_loss_percent_range" in check_names
    assert "ix_check_results_check_id_observed_at" in index_names
    assert "ix_check_results_observed_at" in index_names
    assert "ix_check_results_status_observed_at" in index_names
    assert isinstance(table.c.metrics.type, JSONB)


def test_check_state_is_one_to_one_and_validates_counters() -> None:
    """State harus satu per check dengan counter dan metric yang valid."""

    check_names = get_constraint_names(CheckState, CheckConstraint)
    foreign_key = get_foreign_key(CheckState, "check_id")

    assert CheckState.__table__.c.check_id.primary_key is True
    assert foreign_key.ondelete == "CASCADE"
    assert "ck_check_states_current_status_allowed" in check_names
    assert "ck_check_states_consecutive_successes_non_negative" in check_names
    assert "ck_check_states_consecutive_failures_non_negative" in check_names
    assert "ck_check_states_last_packet_loss_percent_range" in check_names
    assert MonitoringCheck.state.property.uselist is False


def test_network_monitoring_relationships_are_bidirectional() -> None:
    """Relasi utama topology dan monitoring harus dapat dinavigasi dua arah."""

    assert Organization.network_links.property.back_populates == "organization"
    assert Organization.monitoring_profiles.property.back_populates == "organization"
    assert Organization.monitoring_checks.property.back_populates == "organization"
    assert Site.network_links.property.back_populates == "site"
    assert Site.monitoring_checks.property.back_populates == "site"
    assert Device.monitoring_checks.property.back_populates == "device"
    assert DeviceInterface.links_as_a.property.back_populates == "a_interface"
    assert DeviceInterface.links_as_z.property.back_populates == "z_interface"
    assert DeviceInterface.monitoring_checks.property.back_populates == "interface"
    assert MonitoringProfile.checks.property.back_populates == "profile"
    assert MonitoringCheck.results.property.back_populates == "check"
    assert MonitoringCheck.state.property.back_populates == "check"

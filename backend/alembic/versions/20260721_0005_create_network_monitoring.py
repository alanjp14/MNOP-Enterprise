"""create network topology and monitoring

Revision ID: 20260721_0005
Revises: 20260721_0004
Create Date: 2026-07-21 23:30:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "20260721_0005"
down_revision: str | None = "20260721_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _timestamp_columns() -> tuple[sa.Column[object], sa.Column[object]]:
    return (
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def upgrade() -> None:
    """Membuat tabel topology dan monitoring dasar."""

    op.create_table(
        "network_links",
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("site_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("a_interface_id", sa.Uuid(), nullable=False),
        sa.Column("z_interface_id", sa.Uuid(), nullable=False),
        sa.Column("link_type", sa.String(length=50), nullable=False),
        sa.Column("capacity_bps", sa.BigInteger(), nullable=True),
        sa.Column("provider_name", sa.String(length=255), nullable=True),
        sa.Column("circuit_id", sa.String(length=150), nullable=True),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("id", sa.Uuid(), nullable=False),
        *_timestamp_columns(),
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "char_length(btrim(name)) > 0",
            name=op.f("ck_network_links_name_not_blank"),
        ),
        sa.CheckConstraint(
            "link_type IN ('wan', 'lan', 'trunk', 'access', 'fiber', "
            "'wireless', 'vpn', 'virtual', 'other')",
            name=op.f("ck_network_links_link_type_allowed"),
        ),
        sa.CheckConstraint(
            "a_interface_id <> z_interface_id",
            name=op.f("ck_network_links_interfaces_distinct"),
        ),
        sa.CheckConstraint(
            "capacity_bps IS NULL OR capacity_bps >= 0",
            name=op.f("ck_network_links_capacity_bps_non_negative"),
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_network_links_organization_id_organizations"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["site_id"],
            ["sites.id"],
            name=op.f("fk_network_links_site_id_sites"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["a_interface_id"],
            ["device_interfaces.id"],
            name=op.f("fk_network_links_a_interface_id_device_interfaces"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["z_interface_id"],
            ["device_interfaces.id"],
            name=op.f("fk_network_links_z_interface_id_device_interfaces"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_network_links")),
    )
    op.create_index(
        "uq_network_links_interface_pair",
        "network_links",
        [
            sa.text("LEAST(a_interface_id, z_interface_id)"),
            sa.text("GREATEST(a_interface_id, z_interface_id)"),
        ],
        unique=True,
    )
    op.create_index(
        "ix_network_links_organization_id_site_id",
        "network_links",
        ["organization_id", "site_id"],
        unique=False,
    )

    op.create_table(
        "monitoring_profiles",
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("protocol", sa.String(length=30), nullable=False),
        sa.Column("interval_seconds", sa.Integer(), nullable=False),
        sa.Column("timeout_seconds", sa.Integer(), nullable=False),
        sa.Column(
            "retry_count",
            sa.SmallInteger(),
            server_default=sa.text("0"),
            nullable=False,
        ),
        sa.Column(
            "parameters",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("id", sa.Uuid(), nullable=False),
        *_timestamp_columns(),
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "char_length(btrim(name)) > 0",
            name=op.f("ck_monitoring_profiles_name_not_blank"),
        ),
        sa.CheckConstraint(
            "protocol IN ('icmp', 'tcp', 'http', 'https', 'snmp', 'ssh', "
            "'api', 'winrm', 'vmware', 'hyper_v')",
            name=op.f("ck_monitoring_profiles_protocol_allowed"),
        ),
        sa.CheckConstraint(
            "interval_seconds > 0",
            name=op.f("ck_monitoring_profiles_interval_seconds_positive"),
        ),
        sa.CheckConstraint(
            "timeout_seconds > 0",
            name=op.f("ck_monitoring_profiles_timeout_seconds_positive"),
        ),
        sa.CheckConstraint(
            "timeout_seconds <= interval_seconds",
            name=op.f("ck_monitoring_profiles_timeout_not_exceed_interval"),
        ),
        sa.CheckConstraint(
            "retry_count >= 0",
            name=op.f("ck_monitoring_profiles_retry_count_non_negative"),
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_monitoring_profiles_organization_id_organizations"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_monitoring_profiles")),
        sa.UniqueConstraint(
            "organization_id",
            "name",
            name="uq_monitoring_profiles_organization_id_name",
        ),
    )

    op.create_table(
        "monitoring_checks",
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("site_id", sa.Uuid(), nullable=False),
        sa.Column("device_id", sa.Uuid(), nullable=False),
        sa.Column("interface_id", sa.Uuid(), nullable=True),
        sa.Column("profile_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("check_type", sa.String(length=50), nullable=False),
        sa.Column("target_address", sa.String(length=512), nullable=True),
        sa.Column("target_port", sa.Integer(), nullable=True),
        sa.Column("expected_status", sa.String(length=100), nullable=True),
        sa.Column(
            "is_enabled",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.Column("id", sa.Uuid(), nullable=False),
        *_timestamp_columns(),
        sa.CheckConstraint(
            "char_length(btrim(name)) > 0",
            name=op.f("ck_monitoring_checks_name_not_blank"),
        ),
        sa.CheckConstraint(
            "check_type IN ('availability', 'latency', 'packet_loss', "
            "'interface_status', 'bandwidth', 'cpu', 'memory', 'storage', "
            "'temperature', 'service', 'api_response')",
            name=op.f("ck_monitoring_checks_check_type_allowed"),
        ),
        sa.CheckConstraint(
            "target_port IS NULL OR target_port BETWEEN 1 AND 65535",
            name=op.f("ck_monitoring_checks_target_port_range"),
        ),
        sa.CheckConstraint(
            "target_address IS NULL OR char_length(btrim(target_address)) > 0",
            name=op.f("ck_monitoring_checks_target_address_not_blank"),
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_monitoring_checks_organization_id_organizations"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["site_id"],
            ["sites.id"],
            name=op.f("fk_monitoring_checks_site_id_sites"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["device_id"],
            ["devices.id"],
            name=op.f("fk_monitoring_checks_device_id_devices"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["interface_id"],
            ["device_interfaces.id"],
            name=op.f("fk_monitoring_checks_interface_id_device_interfaces"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["profile_id"],
            ["monitoring_profiles.id"],
            name=op.f("fk_monitoring_checks_profile_id_monitoring_profiles"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_monitoring_checks")),
    )
    op.create_index(
        "uq_monitoring_checks_device_id_name",
        "monitoring_checks",
        ["device_id", "name"],
        unique=True,
    )
    op.create_index(
        "ix_monitoring_checks_organization_id_site_id_enabled",
        "monitoring_checks",
        ["organization_id", "site_id", "is_enabled"],
        unique=False,
    )
    op.create_index(
        "ix_monitoring_checks_profile_id",
        "monitoring_checks",
        ["profile_id"],
        unique=False,
    )

    op.create_table(
        "check_results",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("check_id", sa.Uuid(), nullable=False),
        sa.Column(
            "observed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("latency_ms", sa.Numeric(precision=12, scale=3), nullable=True),
        sa.Column(
            "packet_loss_percent",
            sa.Numeric(precision=5, scale=2),
            nullable=True,
        ),
        sa.Column(
            "response_time_ms",
            sa.Numeric(precision=12, scale=3),
            nullable=True,
        ),
        sa.Column("value_numeric", sa.Numeric(), nullable=True),
        sa.Column("value_text", sa.Text(), nullable=True),
        sa.Column("error_code", sa.String(length=100), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "metrics",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "status IN ('up', 'down', 'degraded', 'unknown')",
            name=op.f("ck_check_results_status_allowed"),
        ),
        sa.CheckConstraint(
            "latency_ms IS NULL OR latency_ms >= 0",
            name=op.f("ck_check_results_latency_ms_non_negative"),
        ),
        sa.CheckConstraint(
            "response_time_ms IS NULL OR response_time_ms >= 0",
            name=op.f("ck_check_results_response_time_ms_non_negative"),
        ),
        sa.CheckConstraint(
            "packet_loss_percent IS NULL OR "
            "(packet_loss_percent >= 0 AND packet_loss_percent <= 100)",
            name=op.f("ck_check_results_packet_loss_percent_range"),
        ),
        sa.ForeignKeyConstraint(
            ["check_id"],
            ["monitoring_checks.id"],
            name=op.f("fk_check_results_check_id_monitoring_checks"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_check_results")),
    )
    op.create_index(
        "ix_check_results_check_id_observed_at",
        "check_results",
        ["check_id", sa.text("observed_at DESC")],
        unique=False,
    )
    op.create_index(
        "ix_check_results_observed_at",
        "check_results",
        [sa.text("observed_at DESC")],
        unique=False,
    )
    op.create_index(
        "ix_check_results_status_observed_at",
        "check_results",
        ["status", sa.text("observed_at DESC")],
        unique=False,
    )

    op.create_table(
        "check_states",
        sa.Column("check_id", sa.Uuid(), nullable=False),
        sa.Column(
            "current_status",
            sa.String(length=20),
            server_default=sa.text("'unknown'"),
            nullable=False,
        ),
        sa.Column(
            "status_since",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("last_checked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_success_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_failure_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "consecutive_successes",
            sa.Integer(),
            server_default=sa.text("0"),
            nullable=False,
        ),
        sa.Column(
            "consecutive_failures",
            sa.Integer(),
            server_default=sa.text("0"),
            nullable=False,
        ),
        sa.Column(
            "last_latency_ms",
            sa.Numeric(precision=12, scale=3),
            nullable=True,
        ),
        sa.Column(
            "last_packet_loss_percent",
            sa.Numeric(precision=5, scale=2),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "current_status IN ('up', 'down', 'degraded', 'unknown')",
            name=op.f("ck_check_states_current_status_allowed"),
        ),
        sa.CheckConstraint(
            "consecutive_successes >= 0",
            name=op.f("ck_check_states_consecutive_successes_non_negative"),
        ),
        sa.CheckConstraint(
            "consecutive_failures >= 0",
            name=op.f("ck_check_states_consecutive_failures_non_negative"),
        ),
        sa.CheckConstraint(
            "last_latency_ms IS NULL OR last_latency_ms >= 0",
            name=op.f("ck_check_states_last_latency_ms_non_negative"),
        ),
        sa.CheckConstraint(
            "last_packet_loss_percent IS NULL OR "
            "(last_packet_loss_percent >= 0 AND last_packet_loss_percent <= 100)",
            name=op.f("ck_check_states_last_packet_loss_percent_range"),
        ),
        sa.ForeignKeyConstraint(
            ["check_id"],
            ["monitoring_checks.id"],
            name=op.f("fk_check_states_check_id_monitoring_checks"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("check_id", name=op.f("pk_check_states")),
    )


def downgrade() -> None:
    """Menghapus tabel topology dan monitoring dasar."""

    op.drop_table("check_states")
    op.drop_index("ix_check_results_status_observed_at", table_name="check_results")
    op.drop_index("ix_check_results_observed_at", table_name="check_results")
    op.drop_index("ix_check_results_check_id_observed_at", table_name="check_results")
    op.drop_table("check_results")
    op.drop_index("ix_monitoring_checks_profile_id", table_name="monitoring_checks")
    op.drop_index(
        "ix_monitoring_checks_organization_id_site_id_enabled",
        table_name="monitoring_checks",
    )
    op.drop_index("uq_monitoring_checks_device_id_name", table_name="monitoring_checks")
    op.drop_table("monitoring_checks")
    op.drop_table("monitoring_profiles")
    op.drop_index(
        "ix_network_links_organization_id_site_id",
        table_name="network_links",
    )
    op.drop_index("uq_network_links_interface_pair", table_name="network_links")
    op.drop_table("network_links")

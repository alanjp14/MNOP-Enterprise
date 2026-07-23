"""create device inventory

Revision ID: 20260721_0004
Revises: 20260719_0003
Create Date: 2026-07-21 20:30:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "20260721_0004"
down_revision: str | None = "20260719_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Membuat tabel dan index device inventory."""

    op.create_table(
        "device_vendors",
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("slug", sa.String(length=150), nullable=False),
        sa.Column("website", sa.String(length=255), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
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
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "char_length(btrim(name)) > 0",
            name=op.f("ck_device_vendors_name_not_blank"),
        ),
        sa.CheckConstraint(
            "char_length(btrim(slug)) > 0",
            name=op.f("ck_device_vendors_slug_not_blank"),
        ),
        sa.CheckConstraint(
            "slug = lower(slug)",
            name=op.f("ck_device_vendors_slug_lowercase"),
        ),
        sa.CheckConstraint(
            "slug ~ '^[a-z0-9][a-z0-9-]*$'",
            name=op.f("ck_device_vendors_slug_format"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_device_vendors")),
        sa.UniqueConstraint("slug", name=op.f("uq_device_vendors_slug")),
    )

    op.create_table(
        "device_models",
        sa.Column("vendor_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("device_type", sa.String(length=50), nullable=False),
        sa.Column("os_family", sa.String(length=100), nullable=True),
        sa.Column(
            "manufacturer_part_number",
            sa.String(length=150),
            nullable=True,
        ),
        sa.Column("id", sa.Uuid(), nullable=False),
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
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "char_length(btrim(name)) > 0",
            name=op.f("ck_device_models_name_not_blank"),
        ),
        sa.CheckConstraint(
            "device_type IN ("
            "'router', 'firewall', 'switch', 'access_point', 'radio', "
            "'server', 'virtual_machine', 'hypervisor', 'ups', 'printer', "
            "'cctv', 'snmp_device', 'other'"
            ")",
            name=op.f("ck_device_models_device_type_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["vendor_id"],
            ["device_vendors.id"],
            name=op.f("fk_device_models_vendor_id_device_vendors"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_device_models")),
        sa.UniqueConstraint(
            "vendor_id",
            "name",
            name="uq_device_models_vendor_id_name",
        ),
    )
    op.create_index(
        "ix_device_models_device_type",
        "device_models",
        ["device_type"],
        unique=False,
    )

    op.create_table(
        "devices",
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("site_id", sa.Uuid(), nullable=False),
        sa.Column("model_id", sa.Uuid(), nullable=True),
        sa.Column("parent_device_id", sa.Uuid(), nullable=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("hostname", sa.String(length=255), nullable=True),
        sa.Column("management_ip", postgresql.INET(), nullable=True),
        sa.Column("serial_number", sa.String(length=150), nullable=True),
        sa.Column("asset_tag", sa.String(length=150), nullable=True),
        sa.Column(
            "status",
            sa.String(length=30),
            server_default=sa.text("'active'"),
            nullable=False,
        ),
        sa.Column("firmware_version", sa.String(length=100), nullable=True),
        sa.Column("operating_system", sa.String(length=150), nullable=True),
        sa.Column("location_description", sa.Text(), nullable=True),
        sa.Column(
            "snmp_enabled",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "ssh_enabled",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "api_enabled",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("id", sa.Uuid(), nullable=False),
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
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "char_length(btrim(name)) > 0",
            name=op.f("ck_devices_name_not_blank"),
        ),
        sa.CheckConstraint(
            "status IN ('active', 'inactive', 'maintenance', 'decommissioned')",
            name=op.f("ck_devices_status_allowed"),
        ),
        sa.CheckConstraint(
            "parent_device_id IS NULL OR parent_device_id <> id",
            name=op.f("ck_devices_parent_not_self"),
        ),
        sa.ForeignKeyConstraint(
            ["model_id"],
            ["device_models.id"],
            name=op.f("fk_devices_model_id_device_models"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_devices_organization_id_organizations"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["parent_device_id"],
            ["devices.id"],
            name=op.f("fk_devices_parent_device_id_devices"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["site_id"],
            ["sites.id"],
            name=op.f("fk_devices_site_id_sites"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_devices")),
    )
    op.create_index(
        "ix_devices_organization_id_status",
        "devices",
        ["organization_id", "status"],
        unique=False,
    )
    op.create_index(
        "ix_devices_parent_device_id",
        "devices",
        ["parent_device_id"],
        unique=False,
    )
    op.create_index(
        "ix_devices_site_id_status",
        "devices",
        ["site_id", "status"],
        unique=False,
    )
    op.create_index(
        "uq_devices_site_id_management_ip",
        "devices",
        ["site_id", "management_ip"],
        unique=True,
        postgresql_where=sa.text("management_ip IS NOT NULL"),
    )
    op.create_index(
        "uq_devices_site_id_name",
        "devices",
        ["site_id", "name"],
        unique=True,
    )

    op.create_table(
        "device_credentials",
        sa.Column("device_id", sa.Uuid(), nullable=False),
        sa.Column("credential_type", sa.String(length=30), nullable=False),
        sa.Column("username", sa.String(length=255), nullable=True),
        sa.Column("encrypted_secret", postgresql.BYTEA(), nullable=False),
        sa.Column(
            "encryption_key_version",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column("last_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
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
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "credential_type IN ("
            "'snmp_v2c', 'snmp_v3', 'ssh', 'api', 'winrm', 'vmware', 'hyper_v'"
            ")",
            name=op.f("ck_device_credentials_credential_type_allowed"),
        ),
        sa.CheckConstraint(
            "octet_length(encrypted_secret) > 0",
            name=op.f("ck_device_credentials_encrypted_secret_not_empty"),
        ),
        sa.CheckConstraint(
            "char_length(btrim(encryption_key_version)) > 0",
            name=op.f("ck_device_credentials_encryption_key_version_not_blank"),
        ),
        sa.ForeignKeyConstraint(
            ["device_id"],
            ["devices.id"],
            name=op.f("fk_device_credentials_device_id_devices"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_device_credentials")),
    )
    op.create_index(
        "ix_device_credentials_device_id_credential_type",
        "device_credentials",
        ["device_id", "credential_type"],
        unique=False,
    )

    op.create_table(
        "device_interfaces",
        sa.Column("device_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("if_index", sa.Integer(), nullable=True),
        sa.Column("mac_address", postgresql.MACADDR(), nullable=True),
        sa.Column("ip_address", postgresql.INET(), nullable=True),
        sa.Column("interface_type", sa.String(length=50), nullable=True),
        sa.Column("speed_bps", sa.BigInteger(), nullable=True),
        sa.Column("admin_status", sa.String(length=20), nullable=True),
        sa.Column("oper_status", sa.String(length=20), nullable=True),
        sa.Column(
            "is_uplink",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "is_wan",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "monitoring_enabled",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("id", sa.Uuid(), nullable=False),
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
        sa.CheckConstraint(
            "char_length(btrim(name)) > 0",
            name=op.f("ck_device_interfaces_name_not_blank"),
        ),
        sa.CheckConstraint(
            "speed_bps IS NULL OR speed_bps >= 0",
            name=op.f("ck_device_interfaces_speed_bps_non_negative"),
        ),
        sa.CheckConstraint(
            "if_index IS NULL OR if_index > 0",
            name=op.f("ck_device_interfaces_if_index_positive"),
        ),
        sa.CheckConstraint(
            "admin_status IS NULL OR char_length(btrim(admin_status)) > 0",
            name=op.f("ck_device_interfaces_admin_status_not_blank"),
        ),
        sa.CheckConstraint(
            "oper_status IS NULL OR char_length(btrim(oper_status)) > 0",
            name=op.f("ck_device_interfaces_oper_status_not_blank"),
        ),
        sa.ForeignKeyConstraint(
            ["device_id"],
            ["devices.id"],
            name=op.f("fk_device_interfaces_device_id_devices"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_device_interfaces")),
    )
    op.create_index(
        "ix_device_interfaces_device_id_if_index",
        "device_interfaces",
        ["device_id", "if_index"],
        unique=False,
    )
    op.create_index(
        "uq_device_interfaces_device_id_name",
        "device_interfaces",
        ["device_id", "name"],
        unique=True,
    )


def downgrade() -> None:
    """Menghapus tabel dan index device inventory."""

    op.drop_index(
        "uq_device_interfaces_device_id_name",
        table_name="device_interfaces",
    )
    op.drop_index(
        "ix_device_interfaces_device_id_if_index",
        table_name="device_interfaces",
    )
    op.drop_table("device_interfaces")

    op.drop_index(
        "ix_device_credentials_device_id_credential_type",
        table_name="device_credentials",
    )
    op.drop_table("device_credentials")

    op.drop_index("uq_devices_site_id_name", table_name="devices")
    op.drop_index(
        "uq_devices_site_id_management_ip",
        table_name="devices",
        postgresql_where=sa.text("management_ip IS NOT NULL"),
    )
    op.drop_index("ix_devices_site_id_status", table_name="devices")
    op.drop_index("ix_devices_parent_device_id", table_name="devices")
    op.drop_index("ix_devices_organization_id_status", table_name="devices")
    op.drop_table("devices")

    op.drop_index("ix_device_models_device_type", table_name="device_models")
    op.drop_table("device_models")
    op.drop_table("device_vendors")

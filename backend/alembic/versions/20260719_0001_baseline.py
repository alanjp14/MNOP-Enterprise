"""Baseline struktur database MNOP.

Revision ID: 20260719_0001
Revises:
Create Date: 2026-07-19
"""

from collections.abc import Sequence


revision: str = "20260719_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Membuat baseline migration tanpa tabel domain."""

    # Tabel domain akan dibuat melalui migration fitur berikutnya.
    pass


def downgrade() -> None:
    """Mengembalikan baseline migration."""

    pass

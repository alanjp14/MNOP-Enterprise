"""SQLAlchemy model untuk hasil eksekusi monitoring MNOP."""

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.monitoring_check import MonitoringCheck


class CheckResult(Base):
    """Hasil immutable dari satu eksekusi monitoring check."""

    __tablename__ = "check_results"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    check_id: Mapped[UUID] = mapped_column(
        ForeignKey("monitoring_checks.id", ondelete="CASCADE"),
        nullable=False,
    )
    observed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    latency_ms: Mapped[Decimal | None] = mapped_column(Numeric(12, 3), nullable=True)
    packet_loss_percent: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )
    response_time_ms: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 3),
        nullable=True,
    )
    value_numeric: Mapped[Decimal | None] = mapped_column(Numeric, nullable=True)
    value_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    metrics: Mapped[dict[str, Any]] = mapped_column(
        MutableDict.as_mutable(JSONB),
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )

    check: Mapped["MonitoringCheck"] = relationship(
        "MonitoringCheck",
        back_populates="results",
        lazy="joined",
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('up', 'down', 'degraded', 'unknown')",
            name="status_allowed",
        ),
        CheckConstraint("latency_ms IS NULL OR latency_ms >= 0", name="latency_ms_non_negative"),
        CheckConstraint(
            "response_time_ms IS NULL OR response_time_ms >= 0",
            name="response_time_ms_non_negative",
        ),
        CheckConstraint(
            "packet_loss_percent IS NULL OR "
            "(packet_loss_percent >= 0 AND packet_loss_percent <= 100)",
            name="packet_loss_percent_range",
        ),
        Index("ix_check_results_check_id_observed_at", "check_id", observed_at.desc()),
        Index("ix_check_results_observed_at", observed_at.desc()),
        Index("ix_check_results_status_observed_at", "status", observed_at.desc()),
    )

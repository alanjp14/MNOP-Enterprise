"""SQLAlchemy model untuk status monitoring terkini MNOP."""

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.monitoring_check import MonitoringCheck


class CheckState(Base):
    """Snapshot status terbaru untuk satu monitoring check."""

    __tablename__ = "check_states"

    check_id: Mapped[UUID] = mapped_column(
        ForeignKey("monitoring_checks.id", ondelete="CASCADE"),
        primary_key=True,
    )
    current_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="unknown",
        server_default=text("'unknown'"),
    )
    status_since: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_success_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_failure_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    consecutive_successes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
    )
    consecutive_failures: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
    )
    last_latency_ms: Mapped[Decimal | None] = mapped_column(Numeric(12, 3))
    last_packet_loss_percent: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    check: Mapped["MonitoringCheck"] = relationship(
        "MonitoringCheck",
        back_populates="state",
        lazy="joined",
    )

    __table_args__ = (
        CheckConstraint(
            "current_status IN ('up', 'down', 'degraded', 'unknown')",
            name="current_status_allowed",
        ),
        CheckConstraint(
            "consecutive_successes >= 0",
            name="consecutive_successes_non_negative",
        ),
        CheckConstraint(
            "consecutive_failures >= 0",
            name="consecutive_failures_non_negative",
        ),
        CheckConstraint(
            "last_latency_ms IS NULL OR last_latency_ms >= 0",
            name="last_latency_ms_non_negative",
        ),
        CheckConstraint(
            "last_packet_loss_percent IS NULL OR "
            "(last_packet_loss_percent >= 0 AND last_packet_loss_percent <= 100)",
            name="last_packet_loss_percent_range",
        ),
    )

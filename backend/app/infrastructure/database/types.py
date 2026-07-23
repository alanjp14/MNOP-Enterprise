"""Reusable SQLAlchemy type annotation mapping untuk model MNOP."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Uuid

SQLALCHEMY_TYPE_ANNOTATION_MAP = {
    UUID: Uuid(as_uuid=True),
    datetime: DateTime(timezone=True),
}

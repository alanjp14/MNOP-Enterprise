"""Declarative base seluruh SQLAlchemy ORM model MNOP."""

from sqlalchemy.orm import DeclarativeBase

from app.infrastructure.database.naming_convention import (
    convention_metadata,
)
from app.infrastructure.database.types import (
    SQLALCHEMY_TYPE_ANNOTATION_MAP,
)


class Base(DeclarativeBase):
    """Base class seluruh SQLAlchemy ORM model MNOP."""

    metadata = convention_metadata
    type_annotation_map = SQLALCHEMY_TYPE_ANNOTATION_MAP
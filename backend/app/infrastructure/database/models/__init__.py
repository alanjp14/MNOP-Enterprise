"""Registrasi seluruh SQLAlchemy model MNOP."""

from app.infrastructure.database.models.organization import Organization
from app.infrastructure.database.models.permission import Permission
from app.infrastructure.database.models.role import Role
from app.infrastructure.database.models.role_permission import (
    RolePermission,
)
from app.infrastructure.database.models.site import Site
from app.infrastructure.database.models.user import User
from app.infrastructure.database.models.user_role import UserRole

__all__ = (
    "Organization",
    "Permission",
    "Role",
    "RolePermission",
    "Site",
    "User",
    "UserRole",
)
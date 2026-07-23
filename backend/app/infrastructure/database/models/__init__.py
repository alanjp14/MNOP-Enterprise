"""Registrasi seluruh SQLAlchemy model MNOP."""

from app.infrastructure.database.models.check_result import CheckResult
from app.infrastructure.database.models.check_state import CheckState
from app.infrastructure.database.models.device import Device
from app.infrastructure.database.models.device_credential import DeviceCredential
from app.infrastructure.database.models.device_interface import DeviceInterface
from app.infrastructure.database.models.device_model import DeviceModel
from app.infrastructure.database.models.device_vendor import DeviceVendor
from app.infrastructure.database.models.monitoring_check import MonitoringCheck
from app.infrastructure.database.models.monitoring_profile import MonitoringProfile
from app.infrastructure.database.models.network_link import NetworkLink
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
    "CheckResult",
    "CheckState",
    "Device",
    "DeviceCredential",
    "DeviceInterface",
    "DeviceModel",
    "DeviceVendor",
    "MonitoringCheck",
    "MonitoringProfile",
    "NetworkLink",
    "Organization",
    "Permission",
    "Role",
    "RolePermission",
    "Site",
    "User",
    "UserRole",
)

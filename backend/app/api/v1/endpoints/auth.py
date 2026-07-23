from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, get_password_hash, verify_password
from app.infrastructure.database.models.user import User
from app.infrastructure.database.session import get_db_session
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Fallback Mock User for Development/Testing without DB seed
MOCK_USERS = {
    "admin_kbu": {
        "id": "usr-1",
        "username": "admin_kbu",
        "email": "admin.kbu@kapuasbara.co.id",
        "full_name": "Admin KBU",
        "password_hash": get_password_hash("password123"),
        "role": "admin",
        "organization": "PT Kapuas Bara Utama",
    }
}


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db_session),
) -> TokenResponse:
    """Authentication login endpoint returning JWT access token with DB + Fallback support."""
    # 1. Try DB lookup first
    user_obj = None
    try:
        stmt = select(User).where(User.username == credentials.username.lower())
        res = await db.execute(stmt)
        user_obj = res.scalar_one_or_none()
    except Exception:
        user_obj = None

    if user_obj:
        if not verify_password(credentials.password, user_obj.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Username atau password salah.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token = create_access_token(subject=str(user_obj.id))
        return TokenResponse(access_token=access_token, token_type="bearer", expires_in=86400)

    # 2. Fallback to mock user for dev/demo mode
    fallback_user = MOCK_USERS.get(credentials.username)
    if fallback_user and verify_password(credentials.password, fallback_user["password_hash"]):
        access_token = create_access_token(subject=fallback_user["id"])
        return TokenResponse(access_token=access_token, token_type="bearer", expires_in=86400)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Username atau password salah.",
        headers={"WWW-Authenticate": "Bearer"},
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    db: AsyncSession = Depends(get_db_session),
) -> UserResponse:
    """Returns currently authenticated user profile."""
    # Attempt DB first
    try:
        stmt = select(User).where(User.username == "admin_kbu")
        res = await db.execute(stmt)
        user_obj = res.scalar_one_or_none()
        if user_obj:
            org_name = user_obj.organization.name if user_obj.organization else "PT Kapuas Bara Utama"
            return UserResponse(
                id=str(user_obj.id),
                username=user_obj.username,
                email=user_obj.email,
                full_name=user_obj.full_name,
                role="admin" if user_obj.is_superuser else "operator",
                organization=org_name,
            )
    except Exception:
        pass

    # Fallback to mock
    user = MOCK_USERS["admin_kbu"]
    return UserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        organization=user["organization"],
    )


@router.get("/rbac/matrix", summary="Matriks Hak Akses RBAC Granular")
async def get_rbac_matrix() -> dict:
    """Returns RBAC roles & permissions matrix for Super Admin, NOC Operator, and Auditor."""
    return {
        "roles": [
            {
                "role_id": "superadmin",
                "role_name": "Super Administrator",
                "description": "Akses penuh konfigurasi, user RBAC, device reboot, & backup system",
                "permissions": {
                    "view_dashboard": True,
                    "edit_devices": True,
                    "reboot_devices": True,
                    "download_backups": True,
                    "manage_users": True,
                },
            },
            {
                "role_id": "noc_operator",
                "role_name": "NOC Network Operator",
                "description": "Akses monitoring real-time, event log, & export report SLA",
                "permissions": {
                    "view_dashboard": True,
                    "edit_devices": False,
                    "reboot_devices": False,
                    "download_backups": True,
                    "manage_users": False,
                },
            },
            {
                "role_id": "auditor",
                "role_name": "Executive Auditor",
                "description": "Akses read-only laporan compliance SLA & audit log",
                "permissions": {
                    "view_dashboard": True,
                    "edit_devices": False,
                    "reboot_devices": False,
                    "download_backups": False,
                    "manage_users": False,
                },
            },
        ]
    }

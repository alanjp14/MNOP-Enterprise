from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.security import create_access_token, get_password_hash, verify_password
from app.infrastructure.database.models.user import User
from app.infrastructure.database.session import get_db_session
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    UserCreateRequest,
    UserResponse,
    UserUpdateRequest,
)

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])

# Fallback Mock Users for Development/Testing without DB seed
MOCK_USERS = {
    "usr-1": {
        "id": "usr-1",
        "username": "admin_kbu",
        "email": "admin.kbu@kapuasbara.co.id",
        "full_name": "Alan Jalu (Owner & Super Admin)",
        "password_hash": get_password_hash("password123"),
        "role": "Administrator",
        "organization": "PT Kapuas Bara Utama",
        "is_active": True,
    },
    "usr-2": {
        "id": "usr-2",
        "username": "noc_lead",
        "email": "noc.lead@kapuasbara.co.id",
        "full_name": "Rizki Maulana (NOC Lead)",
        "password_hash": get_password_hash("password123"),
        "role": "NOC Operator",
        "organization": "PT Kapuas Bara Utama",
        "is_active": True,
    },
    "usr-3": {
        "id": "usr-3",
        "username": "auditor_site",
        "email": "auditor@kapuasbara.co.id",
        "full_name": "Site Manager (Auditor)",
        "password_hash": get_password_hash("password123"),
        "role": "User Only",
        "organization": "PT Kapuas Bara Utama",
        "is_active": True,
    },
}


@router.get("/users", response_model=list[UserResponse], summary="Daftar Seluruh Akun Pengguna")
async def list_users(db: AsyncSession = Depends(get_db_session)) -> list[UserResponse]:
    """Returns list of registered users in the organization."""
    try:
        stmt = select(User)
        res = await db.execute(stmt)
        users = res.scalars().all()
        if users:
            return [
                UserResponse(
                    id=str(u.id),
                    username=u.username,
                    email=u.email,
                    full_name=u.full_name,
                    role="Administrator" if u.is_superuser else "NOC Operator",
                    organization=u.organization.name if u.organization else "PT Kapuas Bara Utama",
                    is_active=u.is_active,
                )
                for u in users
            ]
    except Exception:
        pass

    return [
        UserResponse(
            id=u["id"],
            username=u["username"],
            email=u["email"],
            full_name=u["full_name"],
            role=u["role"],
            organization=u["organization"],
            is_active=u["is_active"],
        )
        for u in MOCK_USERS.values()
    ]


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Buat Akun Pengguna Baru")
async def create_user(
    user_in: UserCreateRequest,
    db: AsyncSession = Depends(get_db_session),
) -> UserResponse:
    """Create a new user account with specified role (Administrator, NOC Operator, User Only)."""
    user_id = f"usr-{len(MOCK_USERS) + 1}"
    new_user_data = {
        "id": user_id,
        "username": user_in.username.lower(),
        "email": user_in.email.lower(),
        "full_name": user_in.full_name,
        "password_hash": get_password_hash(user_in.password),
        "role": user_in.role,
        "organization": user_in.organization,
        "is_active": True,
    }
    MOCK_USERS[user_id] = new_user_data

    return UserResponse(
        id=user_id,
        username=new_user_data["username"],
        email=new_user_data["email"],
        full_name=new_user_data["full_name"],
        role=new_user_data["role"],
        organization=new_user_data["organization"],
        is_active=True,
    )


@router.put("/users/{user_id}", response_model=UserResponse, summary="Perbarui Akun Pengguna / Peran Akses")
async def update_user(
    user_id: str,
    user_in: UserUpdateRequest,
    db: AsyncSession = Depends(get_db_session),
) -> UserResponse:
    """Update user role or status."""
    if user_id in MOCK_USERS:
        u = MOCK_USERS[user_id]
        if user_in.full_name is not None:
            u["full_name"] = user_in.full_name
        if user_in.email is not None:
            u["email"] = user_in.email
        if user_in.role is not None:
            u["role"] = user_in.role
        if user_in.is_active is not None:
            u["is_active"] = user_in.is_active
        if user_in.password:
            u["password_hash"] = get_password_hash(user_in.password)

        return UserResponse(
            id=u["id"],
            username=u["username"],
            email=u["email"],
            full_name=u["full_name"],
            role=u["role"],
            organization=u["organization"],
            is_active=u["is_active"],
        )

    raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")


@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK, summary="Hapus Akun Pengguna")
async def delete_user(user_id: str, db: AsyncSession = Depends(get_db_session)) -> dict[str, str]:
    """Delete or deactivate user account."""
    if user_id in MOCK_USERS:
        del MOCK_USERS[user_id]
        return {"message": f"Akun pengguna {user_id} berhasil dihapus"}

    raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")



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
    current_user: dict = Depends(get_current_user),
) -> UserResponse:
    """Returns currently authenticated user profile."""
    if current_user.get("is_mock"):
        user = MOCK_USERS.get(current_user["id"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return UserResponse(
            id=user["id"],
            username=user["username"],
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
            organization=user["organization"],
            is_active=user["is_active"],
        )
        
    user_obj = current_user["user_obj"]
    org_name = user_obj.organization.name if user_obj.organization else "PT Kapuas Bara Utama"
    return UserResponse(
        id=str(user_obj.id),
        username=user_obj.username,
        email=user_obj.email,
        full_name=user_obj.full_name,
        role="Administrator" if user_obj.is_superuser else "NOC Operator",
        organization=org_name,
        is_active=user_obj.is_active,
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

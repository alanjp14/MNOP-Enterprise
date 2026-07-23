from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.core.security import decode_access_token
from app.infrastructure.database.session import get_db_session
from app.infrastructure.database.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db_session)
) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sesi telah berakhir atau token tidak valid",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
        
    # Jika menggunakan fallback MOCK_USERS
    if user_id.startswith("usr-"):
        return {"id": user_id, "is_mock": True}
        
    # Cek ke database
    try:
        uid = uuid.UUID(user_id)
        stmt = select(User).where(User.id == uid)
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()
        if user is None:
            raise credentials_exception
        return {"id": str(user.id), "user_obj": user, "is_mock": False}
    except Exception:
        raise credentials_exception

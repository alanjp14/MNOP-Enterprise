import hashlib
import logging
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

SECRET_KEY = getattr(settings, "jwt_secret_key", "secret-key-mnops-development-2026-pt-kbu")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day
SALT = b"mnop_kbu_salt_2026"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Memverifikasi kecocokan plain password dengan password hash."""
    return get_password_hash(plain_password) == hashed_password


def get_password_hash(password: str) -> str:
    """Menghasilkan password hash menggunakan PBKDF2 HMAC SHA-256."""
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), SALT, 100000)
    return key.hex()


def create_access_token(subject: str | Any, expires_delta: timedelta | None = None) -> str:
    """Menghasilkan JWT Access Token dengan expiration timestamp."""
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {"exp": expire, "sub": str(subject), "iat": datetime.now(UTC)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Mendekode dan memverifikasi JWT Token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError as e:
        logger.warning("invalid_jwt_token", extra={"error": str(e)})
        return None

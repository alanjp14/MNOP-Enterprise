from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LoginRequest(BaseModel):
    username: str = Field(..., json_schema_extra={"example": "admin_kbu"})
    password: str = Field(..., json_schema_extra={"example": "password123"})


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 86400


class UserResponse(BaseModel):
    id: str
    username: str
    email: EmailStr | str
    full_name: str
    role: str
    organization: str
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)


class UserCreateRequest(BaseModel):
    username: str = Field(..., min_length=3)
    email: EmailStr | str
    full_name: str
    password: str = Field(..., min_length=6)
    role: str = Field(..., description="Administrator, NOC Operator, atau User Only")
    organization: str = "PT Kapuas Bara Utama"


class UserUpdateRequest(BaseModel):
    full_name: str | None = None
    email: EmailStr | str | None = None
    role: str | None = None
    is_active: bool | None = None
    password: str | None = None


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

    model_config = ConfigDict(from_attributes=True)
